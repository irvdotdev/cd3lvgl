import { useEffect, useRef, useState, useCallback } from 'react';
import type { Widget } from '../types/widget';
import type { WidgetAnimation } from '../types/animation';
import { EASING_FUNCTIONS } from '../utils/easing';

function computeAnimatedValue(anim: WidgetAnimation, localTime: number): number | null {
  // Before delay, return null (no override)
  if (localTime < anim.delay) return null;

  const elapsed = localTime - anim.delay;

  // Single cycle duration (forward only, or forward + reverse if playback)
  const cycleDuration = anim.playback ? anim.duration * 2 : anim.duration;

  if (cycleDuration <= 0) return anim.endValue;

  let cycleIndex = Math.floor(elapsed / cycleDuration);
  let cycleProgress = elapsed % cycleDuration;

  // Handle repeat count
  if (anim.repeatCount >= 0 && cycleIndex > anim.repeatCount) {
    // Animation finished — return final value
    if (anim.playback) return anim.startValue;
    return anim.endValue;
  }

  // Normalized progress within forward phase [0, 1]
  let t: number;
  if (anim.playback && cycleProgress >= anim.duration) {
    // Reverse phase
    t = 1 - (cycleProgress - anim.duration) / anim.duration;
  } else {
    t = Math.min(cycleProgress / anim.duration, 1);
  }

  const easingFn = EASING_FUNCTIONS[anim.path] || EASING_FUNCTIONS.linear;
  const easedT = easingFn(t);

  return anim.startValue + (anim.endValue - anim.startValue) * easedT;
}

interface UseAnimationEngineOptions {
  widgets: Widget[];
  playing: boolean;
}

interface AnimationEngineResult {
  overrides: Map<string, Partial<Widget>>;
  elapsed: number;
  triggerClick: (widgetId: string) => void;
  reset: () => void;
}

export function useAnimationEngine({ widgets, playing }: UseAnimationEngineOptions): AnimationEngineResult {
  const [frame, setFrame] = useState<{ overrides: Map<string, Partial<Widget>>; elapsed: number }>({
    overrides: new Map(),
    elapsed: 0,
  });

  const startTimeRef = useRef<number>(0);
  const clickTimesRef = useRef<Map<string, number>>(new Map());
  const rafRef = useRef<number>(0);
  const playingRef = useRef(playing);
  playingRef.current = playing;

  const widgetsRef = useRef(widgets);
  widgetsRef.current = widgets;

  const tick = useCallback(() => {
    if (!playingRef.current) return;

    const now = performance.now();
    const globalElapsed = now - startTimeRef.current;
    const overrides = new Map<string, Partial<Widget>>();

    for (const widget of widgetsRef.current) {
      if (!widget.animations || widget.animations.length === 0) continue;

      const widgetOverride: Record<string, number> = {};

      for (const anim of widget.animations) {
        let epoch: number;
        if (anim.trigger === 'click') {
          const clickTime = clickTimesRef.current.get(widget.id);
          if (clickTime === undefined) continue;
          epoch = clickTime;
        } else {
          epoch = startTimeRef.current;
        }

        const localTime = now - epoch;
        const value = computeAnimatedValue(anim, localTime);
        if (value !== null) {
          // Last animation per property wins
          widgetOverride[anim.property] = value;
        }
      }

      if (Object.keys(widgetOverride).length > 0) {
        overrides.set(widget.id, widgetOverride as Partial<Widget>);
      }
    }

    setFrame({ overrides, elapsed: globalElapsed });
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    if (playing) {
      if (startTimeRef.current === 0) {
        startTimeRef.current = performance.now();
      }
      rafRef.current = requestAnimationFrame(tick);
    }
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }
    };
  }, [playing, tick]);

  const triggerClick = useCallback((widgetId: string) => {
    const widget = widgetsRef.current.find(w => w.id === widgetId);
    if (!widget || !widget.clickable) return;
    clickTimesRef.current.set(widgetId, performance.now());
  }, []);

  const reset = useCallback(() => {
    startTimeRef.current = 0;
    clickTimesRef.current.clear();
    setFrame({ overrides: new Map(), elapsed: 0 });
  }, []);

  return {
    overrides: frame.overrides,
    elapsed: frame.elapsed,
    triggerClick,
    reset,
  };
}
