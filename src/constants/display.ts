import type { Widget } from '../types/widget';

export const SCREEN_DIAMETER = 350;
export const SCREEN_WIDTH = SCREEN_DIAMETER;
export const SCREEN_HEIGHT = SCREEN_DIAMETER;
export const SCREEN_RADIUS = SCREEN_DIAMETER / 2; // 175
export const SCREEN_CENTER_X = SCREEN_RADIUS; // 175
export const SCREEN_CENTER_Y = SCREEN_RADIUS; // 175

export const CHROMA_KEY_R = 0;
export const CHROMA_KEY_G = 255;
export const CHROMA_KEY_B = 0;
export const MAX_TEXT_BYTES = 255;
export const MAX_PATH_LENGTH = 255;
export const GRID_SIZE = 10;

export interface Point {
  x: number;
  y: number;
}

/**
 * Trace the circular display path on a Canvas2D context.
 */
export function traceDisplayPath(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D) {
  ctx.beginPath();
  ctx.arc(SCREEN_CENTER_X, SCREEN_CENTER_Y, SCREEN_RADIUS, 0, Math.PI * 2);
  ctx.closePath();
}

/**
 * Test whether a point is inside the circular display boundary.
 */
export function isInsideDisplay(x: number, y: number): boolean {
  const dx = x - SCREEN_CENTER_X;
  const dy = y - SCREEN_CENTER_Y;
  return dx * dx + dy * dy <= SCREEN_RADIUS * SCREEN_RADIUS;
}

/**
 * Get the 4 world-space corners of a rotated rectangle.
 * Rotation is applied around (x, y) after subtracting the offset.
 */
export function getRotatedCorners(
  x: number, y: number, w: number, h: number,
  rotation: number, offsetX = 0, offsetY = 0,
): Point[] {
  const rad = (rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  // Local corners relative to the offset pivot
  const locals: Point[] = [
    { x: -offsetX, y: -offsetY },
    { x: w - offsetX, y: -offsetY },
    { x: w - offsetX, y: h - offsetY },
    { x: -offsetX, y: h - offsetY },
  ];

  return locals.map(p => ({
    x: x + p.x * cos - p.y * sin,
    y: y + p.x * sin + p.y * cos,
  }));
}

/**
 * Get the rotation center and offset for a widget.
 * ImageWidget stores (x,y) as the pivot position with custom pivotX/pivotY.
 * TextWidget/GaugeWidget store (x,y) as top-left and rotate around center.
 */
function getWidgetPivot(widget: Widget): { cx: number; cy: number; ox: number; oy: number } {
  if (widget.type === 'image') {
    return { cx: widget.x, cy: widget.y, ox: widget.w * widget.pivotX, oy: widget.h * widget.pivotY };
  }
  return { cx: widget.x + widget.w / 2, cy: widget.y + widget.h / 2, ox: widget.w / 2, oy: widget.h / 2 };
}

/**
 * Get the world-space corners of a widget, accounting for its type-specific pivot.
 */
export function getWidgetCorners(widget: Widget): Point[] {
  const { cx, cy, ox, oy } = getWidgetPivot(widget);
  return getRotatedCorners(cx, cy, widget.w, widget.h, widget.rotation, ox, oy);
}

/**
 * Get 8 sample points (4 corners + 4 edge midpoints) of a rotated rectangle.
 */
export function getRotatedSamplePoints(
  x: number, y: number, w: number, h: number,
  rotation: number, offsetX = 0, offsetY = 0,
): Point[] {
  const rad = (rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  // Local points: 4 corners + 4 edge midpoints
  const locals: Point[] = [
    { x: -offsetX, y: -offsetY },
    { x: w - offsetX, y: -offsetY },
    { x: w - offsetX, y: h - offsetY },
    { x: -offsetX, y: h - offsetY },
    { x: w / 2 - offsetX, y: -offsetY },          // top mid
    { x: w / 2 - offsetX, y: h - offsetY },        // bottom mid
    { x: -offsetX, y: h / 2 - offsetY },            // left mid
    { x: w - offsetX, y: h / 2 - offsetY },         // right mid
  ];

  return locals.map(p => ({
    x: x + p.x * cos - p.y * sin,
    y: y + p.x * sin + p.y * cos,
  }));
}

/**
 * Test whether a rectangle is fully inside the circle.
 * Supports optional rotation and offset for rotation-aware checking.
 */
export function isRectInsideDisplay(
  x: number, y: number, w: number, h: number,
  rotation = 0, offsetX = 0, offsetY = 0,
): boolean {
  const points = getRotatedSamplePoints(x, y, w, h, rotation, offsetX, offsetY);
  return points.every(p => isInsideDisplay(p.x, p.y));
}

/**
 * Convenience: test whether a widget is fully inside the display,
 * accounting for rotation and type-specific pivot.
 */
export function isWidgetInsideDisplay(widget: Widget): boolean {
  const { cx, cy, ox, oy } = getWidgetPivot(widget);
  return isRectInsideDisplay(cx, cy, widget.w, widget.h, widget.rotation, ox, oy);
}

/**
 * Minimum distance from any sample point to the circle edge.
 * Positive = inside, negative = outside.
 */
export function widgetDistanceToEdge(widget: Widget): number {
  const { cx, cy, ox, oy } = getWidgetPivot(widget);
  const points = getRotatedSamplePoints(
    cx, cy, widget.w, widget.h,
    widget.rotation, ox, oy,
  );

  let minMargin = Infinity;
  for (const p of points) {
    const dx = p.x - SCREEN_CENTER_X;
    const dy = p.y - SCREEN_CENTER_Y;
    const distFromCenter = Math.sqrt(dx * dx + dy * dy);
    const margin = SCREEN_RADIUS - distFromCenter;
    if (margin < minMargin) minMargin = margin;
  }
  return minMargin;
}

/**
 * Clamp a widget's (x, y) so it fits inside the circle.
 * Uses binary search along the radial vector from circle center to widget position.
 * Preserves w, h, and rotation — only adjusts position.
 */
export function clampWidgetToCircle(widget: Widget): { x: number; y: number } {
  if (isWidgetInsideDisplay(widget)) return { x: widget.x, y: widget.y };

  const { cx, cy, ox, oy } = getWidgetPivot(widget);
  const dx = cx - SCREEN_CENTER_X;
  const dy = cy - SCREEN_CENTER_Y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist === 0) return { x: widget.x, y: widget.y };

  let lo = 0;
  let hi = dist;
  for (let i = 0; i < 20; i++) {
    const mid = (lo + hi) / 2;
    const scale = mid / dist;
    const testCX = SCREEN_CENTER_X + dx * scale;
    const testCY = SCREEN_CENTER_Y + dy * scale;
    if (isRectInsideDisplay(testCX, testCY, widget.w, widget.h, widget.rotation, ox, oy)) {
      lo = mid;
    } else {
      hi = mid;
    }
  }

  const scale = lo / dist;
  const clampedCX = Math.round(SCREEN_CENTER_X + dx * scale);
  const clampedCY = Math.round(SCREEN_CENTER_Y + dy * scale);

  // Convert rotation center back to store coordinates
  if (widget.type === 'image') {
    return { x: clampedCX, y: clampedCY };
  }
  return { x: clampedCX - widget.w / 2, y: clampedCY - widget.h / 2 };
}
