export type AnimationPath = 'linear' | 'ease_in' | 'ease_out' | 'ease_in_out' | 'overshoot' | 'bounce';
export type AnimationTrigger = 'auto' | 'click';
export type AnimatableProperty = 'x' | 'y' | 'w' | 'h' | 'opacity' | 'rotation' | 'currentValue';

export interface WidgetAnimation {
  id: string;
  property: AnimatableProperty;
  startValue: number;
  endValue: number;
  duration: number;       // ms
  delay: number;          // ms
  path: AnimationPath;
  repeatCount: number;    // 0 = once, -1 = infinite
  playback: boolean;      // reverse after forward
  trigger: AnimationTrigger;
}
