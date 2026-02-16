export const SCREEN_WIDTH = 350;
export const SCREEN_HEIGHT = 316;

// D-shape geometry: flat bottom, semicircular dome top
// The dome is a semicircle with radius = SCREEN_WIDTH / 2 = 175
// Dome center sits at (175, 175) — the arc spans from (0,175) over the top to (350,175)
// Below y=175 is a straight rectangle
export const DOME_RADIUS = SCREEN_WIDTH / 2; // 175
export const DOME_CENTER_X = SCREEN_WIDTH / 2; // 175
export const DOME_CENTER_Y = DOME_RADIUS; // 175

export const CHROMA_KEY_R = 0;
export const CHROMA_KEY_G = 255;
export const CHROMA_KEY_B = 0;
export const MAX_TEXT_BYTES = 255;
export const MAX_PATH_LENGTH = 255;
export const GRID_SIZE = 10;

/**
 * Trace the D-shaped display path on a Canvas2D context.
 * Flat bottom, semicircular dome on top.
 */
export function traceDShapePath(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D) {
  ctx.beginPath();
  // Start at bottom-left
  ctx.moveTo(0, SCREEN_HEIGHT);
  // Left edge up to where the arc starts
  ctx.lineTo(0, DOME_CENTER_Y);
  // Semicircular dome (from left to right, going over the top)
  ctx.arc(DOME_CENTER_X, DOME_CENTER_Y, DOME_RADIUS, Math.PI, 0, false);
  // Right edge down to bottom-right
  ctx.lineTo(SCREEN_WIDTH, SCREEN_HEIGHT);
  // Bottom edge
  ctx.closePath();
}

/**
 * Test whether a point is inside the D-shaped display boundary.
 */
export function isInsideDShape(x: number, y: number): boolean {
  // Below the dome center line: simple rectangle check
  if (y >= DOME_CENTER_Y) {
    return x >= 0 && x <= SCREEN_WIDTH && y <= SCREEN_HEIGHT;
  }
  // Above the dome center line: circle check
  const dx = x - DOME_CENTER_X;
  const dy = y - DOME_CENTER_Y;
  return dx * dx + dy * dy <= DOME_RADIUS * DOME_RADIUS;
}

/**
 * Test whether a rectangle is fully inside the D-shape.
 * Checks all four corners plus top-edge sample points for the dome.
 */
export function isRectInsideDShape(x: number, y: number, w: number, h: number): boolean {
  // Check all four corners
  if (!isInsideDShape(x, y)) return false;
  if (!isInsideDShape(x + w, y)) return false;
  if (!isInsideDShape(x, y + h)) return false;
  if (!isInsideDShape(x + w, y + h)) return false;
  // If the top edge is in the dome area, also check the midpoint
  if (y < DOME_CENTER_Y) {
    if (!isInsideDShape(x + w / 2, y)) return false;
  }
  return true;
}
