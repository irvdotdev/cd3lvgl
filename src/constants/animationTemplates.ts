import type { Widget, WidgetType } from '../types/widget';
import type { WidgetAnimation } from '../types/animation';
import { SCREEN_WIDTH } from './display';

export interface AnimationTemplate {
  name: string;
  description: string;
  applicableTo: WidgetType[];
  create: (widget: Widget) => WidgetAnimation;
}

const TEMPLATES: AnimationTemplate[] = [
  {
    name: 'Fade In',
    description: 'Fade from transparent to fully opaque',
    applicableTo: ['text', 'image', 'gauge'],
    create: () => ({
      id: crypto.randomUUID(),
      property: 'opacity',
      startValue: 0,
      endValue: 255,
      duration: 1000,
      delay: 0,
      path: 'ease_in_out',
      repeatCount: 0,
      playback: false,
      trigger: 'auto',
    }),
  },
  {
    name: 'Fade Out',
    description: 'Fade from fully opaque to transparent',
    applicableTo: ['text', 'image', 'gauge'],
    create: () => ({
      id: crypto.randomUUID(),
      property: 'opacity',
      startValue: 255,
      endValue: 0,
      duration: 1000,
      delay: 0,
      path: 'ease_in_out',
      repeatCount: 0,
      playback: false,
      trigger: 'auto',
    }),
  },
  {
    name: 'Slide In Left',
    description: 'Slide in from the left edge',
    applicableTo: ['text', 'image', 'gauge'],
    create: (widget) => ({
      id: crypto.randomUUID(),
      property: 'x',
      startValue: -widget.w,
      endValue: widget.x,
      duration: 800,
      delay: 0,
      path: 'ease_out',
      repeatCount: 0,
      playback: false,
      trigger: 'auto',
    }),
  },
  {
    name: 'Slide In Right',
    description: 'Slide in from the right edge',
    applicableTo: ['text', 'image', 'gauge'],
    create: (widget) => ({
      id: crypto.randomUUID(),
      property: 'x',
      startValue: SCREEN_WIDTH,
      endValue: widget.x,
      duration: 800,
      delay: 0,
      path: 'ease_out',
      repeatCount: 0,
      playback: false,
      trigger: 'auto',
    }),
  },
  {
    name: 'Pulse',
    description: 'Pulsing opacity, infinite loop',
    applicableTo: ['text', 'image', 'gauge'],
    create: () => ({
      id: crypto.randomUUID(),
      property: 'opacity',
      startValue: 255,
      endValue: 100,
      duration: 800,
      delay: 0,
      path: 'ease_in_out',
      repeatCount: -1,
      playback: true,
      trigger: 'auto',
    }),
  },
  {
    name: 'Spin',
    description: 'Continuous 360° rotation',
    applicableTo: ['text', 'image', 'gauge'],
    create: () => ({
      id: crypto.randomUUID(),
      property: 'rotation',
      startValue: 0,
      endValue: 360,
      duration: 2000,
      delay: 0,
      path: 'linear',
      repeatCount: -1,
      playback: false,
      trigger: 'auto',
    }),
  },
  {
    name: 'Zoom In',
    description: 'Scale width from 0 to current size',
    applicableTo: ['image'],
    create: (widget) => ({
      id: crypto.randomUUID(),
      property: 'w',
      startValue: 0,
      endValue: widget.w,
      duration: 600,
      delay: 0,
      path: 'ease_out',
      repeatCount: 0,
      playback: false,
      trigger: 'auto',
    }),
  },
  {
    name: 'Zoom Out',
    description: 'Scale width from current size to 0',
    applicableTo: ['image'],
    create: (widget) => ({
      id: crypto.randomUUID(),
      property: 'w',
      startValue: widget.w,
      endValue: 0,
      duration: 600,
      delay: 0,
      path: 'ease_in',
      repeatCount: 0,
      playback: false,
      trigger: 'auto',
    }),
  },
  {
    name: 'Fill 0→100',
    description: 'Sweep gauge from min to max',
    applicableTo: ['gauge'],
    create: (widget) => {
      const g = widget as Extract<Widget, { type: 'gauge' }>;
      return {
        id: crypto.randomUUID(),
        property: 'currentValue',
        startValue: g.minValue,
        endValue: g.maxValue,
        duration: 1500,
        delay: 0,
        path: 'ease_in_out',
        repeatCount: 0,
        playback: false,
        trigger: 'auto',
      };
    },
  },
  {
    name: 'Fill 100→0',
    description: 'Sweep gauge from max to min',
    applicableTo: ['gauge'],
    create: (widget) => {
      const g = widget as Extract<Widget, { type: 'gauge' }>;
      return {
        id: crypto.randomUUID(),
        property: 'currentValue',
        startValue: g.maxValue,
        endValue: g.minValue,
        duration: 1500,
        delay: 0,
        path: 'ease_in_out',
        repeatCount: 0,
        playback: false,
        trigger: 'auto',
      };
    },
  },
  {
    name: 'Bounce Fill',
    description: 'Fill gauge with overshoot easing',
    applicableTo: ['gauge'],
    create: (widget) => {
      const g = widget as Extract<Widget, { type: 'gauge' }>;
      return {
        id: crypto.randomUUID(),
        property: 'currentValue',
        startValue: g.minValue,
        endValue: g.maxValue,
        duration: 1500,
        delay: 0,
        path: 'overshoot',
        repeatCount: 0,
        playback: false,
        trigger: 'auto',
      };
    },
  },
  {
    name: 'Pulse Needle',
    description: 'Sweep gauge back and forth infinitely',
    applicableTo: ['gauge'],
    create: (widget) => {
      const g = widget as Extract<Widget, { type: 'gauge' }>;
      return {
        id: crypto.randomUUID(),
        property: 'currentValue',
        startValue: g.minValue,
        endValue: g.maxValue,
        duration: 1500,
        delay: 0,
        path: 'ease_in_out',
        repeatCount: -1,
        playback: true,
        trigger: 'auto',
      };
    },
  },
];

export function getTemplatesForType(type: WidgetType): AnimationTemplate[] {
  return TEMPLATES.filter(t => t.applicableTo.includes(type));
}
