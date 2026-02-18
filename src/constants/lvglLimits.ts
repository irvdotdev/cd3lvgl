import type { AnimationPath, AnimationTrigger, AnimatableProperty } from '../types/animation';

// --- Coordinate system (lv_coord_t = int16_t) ---
export const LV_COORD_MIN = -32768;
export const LV_COORD_MAX = 32767;

// --- Opacity (uint8_t) ---
export const LV_OPA_MIN = 0;
export const LV_OPA_MAX = 255;

// --- Image zoom (LVGL: 256 = 100%) ---
export const UI_IMG_ZOOM_MIN = 32;
export const UI_IMG_ZOOM_MAX = 512;

// --- Image pivot (0–1 relative) ---
export const IMG_PIVOT_MIN = 0;
export const IMG_PIVOT_MAX = 1;

// --- Widget minimum dimensions (UI) ---
export const UI_WIDGET_MIN_W = 10;
export const UI_WIDGET_MIN_H = 10;

// --- Rotation ---
export const ROTATION_MIN = 0;
export const ROTATION_MAX = 360;

// --- Text / Font ---
export const FONT_SIZE_MIN = 6;
export const FONT_SIZE_MAX = 128;

// --- Gauge ---
export const ARC_WIDTH_MIN = 1;
export const NEEDLE_WIDTH_MIN = 1;
export const NEEDLE_LENGTH_MIN = 1;
export const NEEDLE_LENGTH_MAX = 100;
export const NEEDLE_DOT_RADIUS_MIN = 1;
export const TICK_COUNT_MIN = 2;
export const TICK_LENGTH_MIN = 1;
export const TICK_WIDTH_MIN = 1;
export const LABEL_COUNT_MIN = 2;

// --- Animation ---
export const ANIM_DURATION_MIN = 1;
export const ANIM_DELAY_MIN = 0;
export const ANIM_REPEAT_MIN = -1;

// --- Border / Padding ---
export const BORDER_WIDTH_MIN = 0;
export const BORDER_RADIUS_MIN = 0;
export const PADDING_MIN = 0;

// --- Scene ---
export const SCENE_WIDGET_WARN_THRESHOLD = 50;

// --- Color ---
export const HEX_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;

// --- RAM estimation (bytes) ---
export const RAM_BASE_WIDGET = 200;
export const RAM_TEXT_OVERHEAD = 100;
export const RAM_IMAGE_OVERHEAD = 80;
export const RAM_GAUGE_OVERHEAD = 300;
export const RAM_ANIMATION_OVERHEAD = 64;
export const RAM_SCENE_BASE = 2048;
export const RAM_WARN_THRESHOLD = 32768;

// --- Valid enum sets ---
export const VALID_ALIGN = new Set<string>(['left', 'center', 'right']);
export const VALID_VERTICAL_ALIGN = new Set<string>(['top', 'middle', 'bottom']);
export const VALID_FONT_WEIGHT = new Set<string>(['normal', 'bold']);
export const VALID_TEXT_DECORATION = new Set<string>(['none', 'underline', 'strikethrough']);
export const VALID_LONG_MODE = new Set<string>(['wrap', 'scroll', 'dot', 'clip']);
export const VALID_FONT_FAMILY = new Set<string>(['sans-serif', 'serif', 'monospace']);

export const VALID_ANIMATION_PATH = new Set<AnimationPath>([
  'linear', 'ease_in', 'ease_out', 'ease_in_out', 'overshoot', 'bounce',
]);
export const VALID_ANIMATION_TRIGGER = new Set<AnimationTrigger>(['auto', 'click']);
export const VALID_ANIMATABLE_PROPERTY = new Set<AnimatableProperty>([
  'x', 'y', 'w', 'h', 'opacity', 'rotation', 'currentValue',
]);
