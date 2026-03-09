import type { Widget, TextWidget, ImageWidget, GaugeWidget, Scene } from '../types/widget';
import type { WidgetAnimation } from '../types/animation';
import { MAX_TEXT_BYTES, MAX_PATH_LENGTH, isWidgetInsideDisplay } from '../constants/display';
import {
  LV_COORD_MIN, LV_COORD_MAX,
  LV_OPA_MIN, LV_OPA_MAX,
  UI_WIDGET_MIN_W, UI_WIDGET_MIN_H,
  ROTATION_MIN, ROTATION_MAX,
  BORDER_WIDTH_MIN, BORDER_RADIUS_MIN, PADDING_MIN,
  FONT_SIZE_MIN, FONT_SIZE_MAX,
  UI_IMG_ZOOM_MIN, UI_IMG_ZOOM_MAX,
  IMG_PIVOT_MIN, IMG_PIVOT_MAX,
  ARC_WIDTH_MIN,
  NEEDLE_WIDTH_MIN, NEEDLE_LENGTH_MIN, NEEDLE_LENGTH_MAX, NEEDLE_DOT_RADIUS_MIN,
  TICK_COUNT_MIN, TICK_LENGTH_MIN, TICK_WIDTH_MIN,
  LABEL_COUNT_MIN,
  ANIM_DURATION_MIN, ANIM_DELAY_MIN, ANIM_REPEAT_MIN,
  SCENE_WIDGET_WARN_THRESHOLD,
  HEX_COLOR_REGEX,
  RAM_BASE_WIDGET, RAM_TEXT_OVERHEAD, RAM_IMAGE_OVERHEAD, RAM_GAUGE_OVERHEAD,
  RAM_ANIMATION_OVERHEAD, RAM_SCENE_BASE, RAM_WARN_THRESHOLD,
  VALID_ALIGN, VALID_VERTICAL_ALIGN, VALID_FONT_WEIGHT,
  VALID_TEXT_DECORATION, VALID_LONG_MODE, VALID_FONT_FAMILY,
  VALID_ANIMATION_PATH, VALID_ANIMATION_TRIGGER, VALID_ANIMATABLE_PROPERTY,
} from '../constants/lvglLimits';

// ---------------------------------------------------------------------------
// Public types (unchanged API)
// ---------------------------------------------------------------------------

export type Severity = 'error' | 'warning';

export interface ValidationIssue {
  widgetId: string;
  field: string;
  message: string;
  severity: Severity;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function textByteLength(text: string): number {
  return new TextEncoder().encode(text).length;
}

function isValidHexColor(color: string): boolean {
  return HEX_COLOR_REGEX.test(color);
}

function issue(
  widgetId: string, field: string, message: string, severity: Severity,
): ValidationIssue {
  return { widgetId, field, message, severity };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildDuplicateIds(widgets: Widget[]): Set<string> {
  const counts = new Map<string, number>();
  for (const w of widgets) counts.set(w.id, (counts.get(w.id) ?? 0) + 1);
  return new Set([...counts.entries()].filter(([, c]) => c > 1).map(([id]) => id));
}

// ---------------------------------------------------------------------------
// A: Base Widget checks (all types) — 16 rules
// ---------------------------------------------------------------------------

function validateBaseWidget(w: Widget, duplicateIds: Set<string>): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const id = w.id;

  // A1 — Duplicate widget ID
  if (duplicateIds.has(id)) {
    issues.push(issue(id, 'id', 'Duplicate widget ID', 'error'));
  }

  // A2 — Layer must be 0 or 1
  if (w.layer !== 0 && w.layer !== 1) {
    issues.push(issue(id, 'layer', 'Layer must be 0 or 1', 'error'));
  }

  // A3 — x overflows lv_coord_t or NaN
  if (Number.isNaN(w.x) || w.x < LV_COORD_MIN || w.x > LV_COORD_MAX) {
    issues.push(issue(id, 'x', `X must be between ${LV_COORD_MIN} and ${LV_COORD_MAX}`, 'error'));
  }

  // A4 — y overflows lv_coord_t or NaN
  if (Number.isNaN(w.y) || w.y < LV_COORD_MIN || w.y > LV_COORD_MAX) {
    issues.push(issue(id, 'y', `Y must be between ${LV_COORD_MIN} and ${LV_COORD_MAX}`, 'error'));
  }

  // A5 — w < minimum
  if (w.w < UI_WIDGET_MIN_W) {
    issues.push(issue(id, 'w', `Width must be at least ${UI_WIDGET_MIN_W}`, 'error'));
  }

  // A6 — h < minimum
  if (w.h < UI_WIDGET_MIN_H) {
    issues.push(issue(id, 'h', `Height must be at least ${UI_WIDGET_MIN_H}`, 'error'));
  }

  // A7 — w > lv_coord_t max
  if (w.w > LV_COORD_MAX) {
    issues.push(issue(id, 'w', `Width exceeds lv_coord_t maximum (${LV_COORD_MAX})`, 'error'));
  }

  // A8 — h > lv_coord_t max
  if (w.h > LV_COORD_MAX) {
    issues.push(issue(id, 'h', `Height exceeds lv_coord_t maximum (${LV_COORD_MAX})`, 'error'));
  }

  // A9 — opacity not integer 0-255
  if (!Number.isInteger(w.opacity) || w.opacity < LV_OPA_MIN || w.opacity > LV_OPA_MAX) {
    issues.push(issue(id, 'opacity', `Opacity must be an integer between ${LV_OPA_MIN} and ${LV_OPA_MAX}`, 'error'));
  }

  // A10 — rotation outside 0-360
  if (w.rotation < ROTATION_MIN || w.rotation > ROTATION_MAX) {
    issues.push(issue(id, 'rotation', `Rotation must be between ${ROTATION_MIN} and ${ROTATION_MAX}`, 'error'));
  }

  // A11 — borderWidth < 0
  if (w.borderWidth < BORDER_WIDTH_MIN) {
    issues.push(issue(id, 'borderWidth', 'Border width cannot be negative', 'error'));
  }

  // A12 — borderRadius < 0
  if (w.borderRadius < BORDER_RADIUS_MIN) {
    issues.push(issue(id, 'borderRadius', 'Border radius cannot be negative', 'error'));
  }

  // A13 — padding < 0
  if (w.padding < PADDING_MIN) {
    issues.push(issue(id, 'padding', 'Padding cannot be negative', 'error'));
  }

  // A14 — borderColor invalid hex (when borderWidth > 0)
  if (w.borderWidth > 0 && !isValidHexColor(w.borderColor)) {
    issues.push(issue(id, 'borderColor', 'Invalid border color (expected #RRGGBB)', 'error'));
  }

  // A15 — bgColor invalid hex (when bgEnabled)
  if (w.bgEnabled && !isValidHexColor(w.bgColor)) {
    issues.push(issue(id, 'bgColor', 'Invalid background color (expected #RRGGBB)', 'error'));
  }

  // A16 — outside circular display
  if (!isWidgetInsideDisplay(w)) {
    issues.push(issue(id, 'bounds', 'Widget extends outside circular display boundary', 'warning'));
  }

  return issues;
}

// ---------------------------------------------------------------------------
// B: Text Widget checks — 10 rules
// ---------------------------------------------------------------------------

function validateTextWidget(w: TextWidget): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const id = w.id;

  // B1 — empty content
  if (!w.content) {
    issues.push(issue(id, 'content', 'Text content is empty', 'warning'));
  }

  // B2 — content exceeds 255 bytes
  if (textByteLength(w.content) > MAX_TEXT_BYTES) {
    issues.push(issue(id, 'content', `Text exceeds ${MAX_TEXT_BYTES} bytes`, 'error'));
  }

  // B3 — fontSize outside 6-128
  if (w.fontSize < FONT_SIZE_MIN || w.fontSize > FONT_SIZE_MAX) {
    issues.push(issue(id, 'fontSize', `Font size must be between ${FONT_SIZE_MIN} and ${FONT_SIZE_MAX}`, 'error'));
  }

  // B4 — fontColor invalid hex
  if (!isValidHexColor(w.fontColor)) {
    issues.push(issue(id, 'fontColor', 'Invalid font color (expected #RRGGBB)', 'error'));
  }

  // B5 — align not left/center/right
  if (!VALID_ALIGN.has(w.align)) {
    issues.push(issue(id, 'align', `Invalid align "${w.align}" (expected left, center, or right)`, 'error'));
  }

  // B6 — verticalAlign not top/middle/bottom
  if (!VALID_VERTICAL_ALIGN.has(w.verticalAlign)) {
    issues.push(issue(id, 'verticalAlign', `Invalid vertical align "${w.verticalAlign}" (expected top, middle, or bottom)`, 'error'));
  }

  // B7 — fontWeight not normal/bold
  if (!VALID_FONT_WEIGHT.has(w.fontWeight)) {
    issues.push(issue(id, 'fontWeight', `Invalid font weight "${w.fontWeight}" (expected normal or bold)`, 'error'));
  }

  // B8 — textDecoration not none/underline/strikethrough
  if (!VALID_TEXT_DECORATION.has(w.textDecoration)) {
    issues.push(issue(id, 'textDecoration', `Invalid text decoration "${w.textDecoration}" (expected none, underline, or strikethrough)`, 'error'));
  }

  // B9 — longMode not wrap/scroll/dot/clip
  if (!VALID_LONG_MODE.has(w.longMode)) {
    issues.push(issue(id, 'longMode', `Invalid long mode "${w.longMode}" (expected wrap, scroll, dot, or clip)`, 'error'));
  }

  // B10 — fontFamily unknown
  if (!VALID_FONT_FAMILY.has(w.fontFamily)) {
    issues.push(issue(id, 'fontFamily', `Unknown font family "${w.fontFamily}" (expected sans-serif, serif, or monospace)`, 'warning'));
  }

  return issues;
}

// ---------------------------------------------------------------------------
// C: Image Widget checks — 6 rules
// ---------------------------------------------------------------------------

function validateImageWidget(w: ImageWidget): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const id = w.id;

  // C1 — imagePath empty
  if (!w.imagePath) {
    issues.push(issue(id, 'imagePath', 'Image path is empty', 'error'));
  }

  // C2 — imagePath exceeds 255 chars
  if (w.imagePath.length > MAX_PATH_LENGTH) {
    issues.push(issue(id, 'imagePath', `Image path exceeds ${MAX_PATH_LENGTH} characters`, 'error'));
  }

  // C3 — zoom outside 32-512
  if (w.zoom < UI_IMG_ZOOM_MIN || w.zoom > UI_IMG_ZOOM_MAX) {
    issues.push(issue(id, 'zoom', `Zoom must be between ${UI_IMG_ZOOM_MIN} and ${UI_IMG_ZOOM_MAX}`, 'error'));
  }

  // C4 — zoom not integer
  if (!Number.isInteger(w.zoom)) {
    issues.push(issue(id, 'zoom', 'Zoom must be an integer', 'error'));
  }

  // C5 — pivotX outside 0-1
  if (w.pivotX < IMG_PIVOT_MIN || w.pivotX > IMG_PIVOT_MAX) {
    issues.push(issue(id, 'pivotX', `Pivot X must be between ${IMG_PIVOT_MIN} and ${IMG_PIVOT_MAX}`, 'error'));
  }

  // C6 — pivotY outside 0-1
  if (w.pivotY < IMG_PIVOT_MIN || w.pivotY > IMG_PIVOT_MAX) {
    issues.push(issue(id, 'pivotY', `Pivot Y must be between ${IMG_PIVOT_MIN} and ${IMG_PIVOT_MAX}`, 'error'));
  }

  return issues;
}

// ---------------------------------------------------------------------------
// D: Gauge Widget checks — 17 rules
// ---------------------------------------------------------------------------

function validateGaugeWidget(w: GaugeWidget): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const id = w.id;

  // D1 — minValue >= maxValue
  if (w.minValue >= w.maxValue) {
    issues.push(issue(id, 'minValue', 'Min value must be less than max value', 'error'));
  }

  // D2 — currentValue outside min..max
  if (w.currentValue < w.minValue || w.currentValue > w.maxValue) {
    issues.push(issue(id, 'currentValue', `Current value must be between ${w.minValue} and ${w.maxValue}`, 'error'));
  }

  // D3 — arcWidth < 1 (when showArc)
  if (w.showArc && w.arcWidth < ARC_WIDTH_MIN) {
    issues.push(issue(id, 'arcWidth', `Arc width must be at least ${ARC_WIDTH_MIN}`, 'error'));
  }

  // D4 — arcColor invalid hex (when showArc)
  if (w.showArc && !isValidHexColor(w.arcColor)) {
    issues.push(issue(id, 'arcColor', 'Invalid arc color (expected #RRGGBB)', 'error'));
  }

  // D5 — arcBgColor invalid hex (when showArc)
  if (w.showArc && !isValidHexColor(w.arcBgColor)) {
    issues.push(issue(id, 'arcBgColor', 'Invalid arc background color (expected #RRGGBB)', 'error'));
  }

  // D6 — needleWidth < 1 (when showNeedle)
  if (w.showNeedle && w.needleWidth < NEEDLE_WIDTH_MIN) {
    issues.push(issue(id, 'needleWidth', `Needle width must be at least ${NEEDLE_WIDTH_MIN}`, 'error'));
  }

  // D7 — needleLength outside 1-100% (when showNeedle)
  if (w.showNeedle && (w.needleLength < NEEDLE_LENGTH_MIN || w.needleLength > NEEDLE_LENGTH_MAX)) {
    issues.push(issue(id, 'needleLength', `Needle length must be between ${NEEDLE_LENGTH_MIN}% and ${NEEDLE_LENGTH_MAX}%`, 'error'));
  }

  // D8 — needleColor invalid hex (when showNeedle)
  if (w.showNeedle && !isValidHexColor(w.needleColor)) {
    issues.push(issue(id, 'needleColor', 'Invalid needle color (expected #RRGGBB)', 'error'));
  }

  // D9 — needleDotRadius < 1 (when showNeedle + showNeedleDot)
  if (w.showNeedle && w.showNeedleDot && w.needleDotRadius < NEEDLE_DOT_RADIUS_MIN) {
    issues.push(issue(id, 'needleDotRadius', `Needle dot radius must be at least ${NEEDLE_DOT_RADIUS_MIN}`, 'error'));
  }

  // D10 — tickCount < 2 (when showTicks)
  if (w.showTicks && w.tickCount < TICK_COUNT_MIN) {
    issues.push(issue(id, 'tickCount', `Tick count must be at least ${TICK_COUNT_MIN}`, 'error'));
  }

  // D11 — tickLength < 1 (when showTicks)
  if (w.showTicks && w.tickLength < TICK_LENGTH_MIN) {
    issues.push(issue(id, 'tickLength', `Tick length must be at least ${TICK_LENGTH_MIN}`, 'error'));
  }

  // D12 — tickWidth < 1 (when showTicks)
  if (w.showTicks && w.tickWidth < TICK_WIDTH_MIN) {
    issues.push(issue(id, 'tickWidth', `Tick width must be at least ${TICK_WIDTH_MIN}`, 'error'));
  }

  // D13 — tickColor invalid hex (when showTicks)
  if (w.showTicks && !isValidHexColor(w.tickColor)) {
    issues.push(issue(id, 'tickColor', 'Invalid tick color (expected #RRGGBB)', 'error'));
  }

  // D14 — labelCount < 2 (when showLabels)
  if (w.showLabels && w.labelCount < LABEL_COUNT_MIN) {
    issues.push(issue(id, 'labelCount', `Label count must be at least ${LABEL_COUNT_MIN}`, 'error'));
  }

  // D15 — labelFontSize outside 6-128 (when showLabels)
  if (w.showLabels && (w.labelFontSize < FONT_SIZE_MIN || w.labelFontSize > FONT_SIZE_MAX)) {
    issues.push(issue(id, 'labelFontSize', `Label font size must be between ${FONT_SIZE_MIN} and ${FONT_SIZE_MAX}`, 'error'));
  }

  // D16 — labelColor invalid hex (when showLabels)
  if (w.showLabels && !isValidHexColor(w.labelColor)) {
    issues.push(issue(id, 'labelColor', 'Invalid label color (expected #RRGGBB)', 'error'));
  }

  // D17 — startAngle equals endAngle
  if (w.startAngle === w.endAngle) {
    issues.push(issue(id, 'startAngle', 'Start angle equals end angle (gauge has no arc span)', 'warning'));
  }

  return issues;
}

// ---------------------------------------------------------------------------
// E: Animation checks (per animation entry) — 11 rules
// ---------------------------------------------------------------------------

function validateAnimation(
  anim: WidgetAnimation, widgetId: string, widgetType: string, allAnims: WidgetAnimation[],
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const id = widgetId;

  // E1 — duration < 1 ms
  if (anim.duration < ANIM_DURATION_MIN) {
    issues.push(issue(id, 'animation.duration', `Animation duration must be at least ${ANIM_DURATION_MIN} ms`, 'error'));
  }

  // E2 — delay < 0 ms
  if (anim.delay < ANIM_DELAY_MIN) {
    issues.push(issue(id, 'animation.delay', 'Animation delay cannot be negative', 'error'));
  }

  // E3 — repeatCount < -1
  if (anim.repeatCount < ANIM_REPEAT_MIN) {
    issues.push(issue(id, 'animation.repeatCount', `Animation repeat count must be at least ${ANIM_REPEAT_MIN} (-1 = infinite)`, 'error'));
  }

  // E4 — path not a valid AnimationPath
  if (!VALID_ANIMATION_PATH.has(anim.path)) {
    issues.push(issue(id, 'animation.path', `Invalid animation path "${anim.path}"`, 'error'));
  }

  // E5 — trigger not a valid AnimationTrigger
  if (!VALID_ANIMATION_TRIGGER.has(anim.trigger)) {
    issues.push(issue(id, 'animation.trigger', `Invalid animation trigger "${anim.trigger}"`, 'error'));
  }

  // E6 — property not a valid AnimatableProperty
  if (!VALID_ANIMATABLE_PROPERTY.has(anim.property)) {
    issues.push(issue(id, 'animation.property', `Invalid animatable property "${anim.property}"`, 'error'));
  }

  // E7 — 'currentValue' on non-gauge widget
  if (anim.property === 'currentValue' && widgetType !== 'gauge') {
    issues.push(issue(id, 'animation.property', '"currentValue" can only be animated on gauge widgets', 'error'));
  }

  // E8 — opacity anim values outside 0-255
  if (anim.property === 'opacity') {
    if (anim.startValue < LV_OPA_MIN || anim.startValue > LV_OPA_MAX ||
        anim.endValue < LV_OPA_MIN || anim.endValue > LV_OPA_MAX) {
      issues.push(issue(id, 'animation.value', `Opacity animation values must be between ${LV_OPA_MIN} and ${LV_OPA_MAX}`, 'error'));
    }
  }

  // E9 — rotation anim values outside 0-360
  if (anim.property === 'rotation') {
    if (anim.startValue < ROTATION_MIN || anim.startValue > ROTATION_MAX ||
        anim.endValue < ROTATION_MIN || anim.endValue > ROTATION_MAX) {
      issues.push(issue(id, 'animation.value', `Rotation animation values should be between ${ROTATION_MIN} and ${ROTATION_MAX}`, 'warning'));
    }
  }

  // E10 — startValue equals endValue (no visible effect)
  if (anim.startValue === anim.endValue) {
    issues.push(issue(id, 'animation.value', 'Animation start and end values are equal (no visible effect)', 'warning'));
  }

  // E11 — duplicate animation ID within same widget
  if (allAnims.filter(a => a.id === anim.id).length > 1) {
    issues.push(issue(id, 'animation.id', `Duplicate animation ID "${anim.id}"`, 'error'));
  }

  return issues;
}

// ---------------------------------------------------------------------------
// Per-widget validation (internal — accepts pre-built duplicate set)
// ---------------------------------------------------------------------------

function validateWidgetInternal(widget: Widget, duplicateIds: Set<string>): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // A: base checks
  issues.push(...validateBaseWidget(widget, duplicateIds));

  // Type-specific checks
  switch (widget.type) {
    case 'text':
      issues.push(...validateTextWidget(widget));
      break;
    case 'image':
      issues.push(...validateImageWidget(widget));
      break;
    case 'gauge':
      issues.push(...validateGaugeWidget(widget));
      break;
  }

  // E: animation checks
  for (const anim of widget.animations) {
    issues.push(...validateAnimation(anim, widget.id, widget.type, widget.animations));
  }

  return issues;
}

// ---------------------------------------------------------------------------
// Per-widget validation (public — unchanged signature)
// ---------------------------------------------------------------------------

export function validateWidget(widget: Widget, allWidgets: Widget[]): ValidationIssue[] {
  return validateWidgetInternal(widget, buildDuplicateIds(allWidgets));
}

// ---------------------------------------------------------------------------
// F: Scene-level checks — 4 rules
// ---------------------------------------------------------------------------

function validateSceneLevel(scene: Scene): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // F1 — backgroundColor invalid hex
  if (!isValidHexColor(scene.backgroundColor)) {
    issues.push(issue('', 'backgroundColor', 'Invalid scene background color (expected #RRGGBB)', 'error'));
  }

  // F2 — widget count > threshold
  if (scene.widgets.length > SCENE_WIDGET_WARN_THRESHOLD) {
    issues.push(issue('', 'widgets', `Scene has ${scene.widgets.length} widgets (>${SCENE_WIDGET_WARN_THRESHOLD} may impact performance)`, 'warning'));
  }

  // F3 — empty scene
  if (scene.widgets.length === 0) {
    issues.push(issue('', 'widgets', 'Scene has no widgets', 'warning'));
  }

  // F4 — estimated RAM > threshold
  const ram = estimateSceneRam(scene);
  if (ram > RAM_WARN_THRESHOLD) {
    issues.push(issue('', 'ram', `Estimated RAM usage ~${(ram / 1024).toFixed(1)} KB exceeds ${RAM_WARN_THRESHOLD / 1024} KB advisory threshold`, 'warning'));
  }

  return issues;
}

// ---------------------------------------------------------------------------
// Scene validation (public — unchanged signature)
// ---------------------------------------------------------------------------

export function validateScene(scene: Scene): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // Scene-level checks
  issues.push(...validateSceneLevel(scene));

  // Pre-compute duplicate IDs once for all widgets (O(n) instead of O(n²))
  const duplicateIds = buildDuplicateIds(scene.widgets);

  // Per-widget checks
  for (const widget of scene.widgets) {
    issues.push(...validateWidgetInternal(widget, duplicateIds));
  }

  return issues;
}

// ---------------------------------------------------------------------------
// Error predicate (public — unchanged signature)
// ---------------------------------------------------------------------------

export function hasErrors(issues: ValidationIssue[]): boolean {
  return issues.some(i => i.severity === 'error');
}

// ---------------------------------------------------------------------------
// RAM Estimation (new exports)
// ---------------------------------------------------------------------------

export function estimateWidgetRam(widget: Widget): number {
  let ram = RAM_BASE_WIDGET;

  switch (widget.type) {
    case 'text':
      ram += RAM_TEXT_OVERHEAD + textByteLength(widget.content);
      break;
    case 'image':
      ram += RAM_IMAGE_OVERHEAD;
      break;
    case 'gauge':
      ram += RAM_GAUGE_OVERHEAD;
      break;
  }

  ram += widget.animations.length * RAM_ANIMATION_OVERHEAD;
  return ram;
}

export function estimateSceneRam(scene: Scene): number {
  let ram = RAM_SCENE_BASE;
  for (const widget of scene.widgets) {
    ram += estimateWidgetRam(widget);
  }
  return ram;
}
