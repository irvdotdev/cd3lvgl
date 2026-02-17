import type { AnimationPath } from '../types/animation';

export type EasingFunction = (t: number) => number;

function linear(t: number): number {
  return t;
}

function ease_in(t: number): number {
  return t * t;
}

function ease_out(t: number): number {
  return 1 - (1 - t) * (1 - t);
}

function ease_in_out(t: number): number {
  return -(Math.cos(Math.PI * t) - 1) / 2;
}

function overshoot(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

function bounce(t: number): number {
  const n1 = 7.5625;
  const d1 = 2.75;

  if (t < 1 / d1) {
    return n1 * t * t;
  } else if (t < 2 / d1) {
    return n1 * (t -= 1.5 / d1) * t + 0.75;
  } else if (t < 2.5 / d1) {
    return n1 * (t -= 2.25 / d1) * t + 0.9375;
  } else {
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  }
}

export const EASING_FUNCTIONS: Record<AnimationPath, EasingFunction> = {
  linear,
  ease_in,
  ease_out,
  ease_in_out,
  overshoot,
  bounce,
};
