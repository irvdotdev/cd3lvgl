import { describe, it, expect } from 'vitest';

// ── Helpers ─────────────────────────────────────────────────────────────────

const COLOR_REGEX = /^#[0-9A-F]{6}$/;

function makeSampleTextWidget(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'fig_1234567890_abcdefgh',
    type: 'text',
    layer: 1,
    x: 10,
    y: 20,
    w: 100,
    h: 40,
    visible: true,
    clickable: false,
    opacity: 255,
    rotation: 0,
    content: 'Hello World',
    fontSize: 16,
    fontColor: '#FFFFFF',
    fontFamily: 'sans-serif',
    fontWeight: 'normal',
    align: 'left',
    verticalAlign: 'top',
    letterSpacing: 0,
    lineSpacing: 0,
    textDecoration: 'none',
    longMode: 'wrap',
    borderWidth: 0,
    borderColor: '#000000',
    borderRadius: 0,
    bgEnabled: false,
    bgColor: '#000000',
    padding: 0,
    animations: [],
    ...overrides,
  };
}

function makeSampleImageWidget(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'fig_1234567890_ijklmnop',
    type: 'image',
    layer: 1,
    x: 175,
    y: 175,
    w: 200,
    h: 150,
    visible: true,
    clickable: false,
    opacity: 255,
    rotation: 0,
    assetId: '',
    imagePath: '',
    pivotX: 0.5,
    pivotY: 0.5,
    zoom: 256,
    antialias: true,
    borderWidth: 0,
    borderColor: '#000000',
    borderRadius: 0,
    bgEnabled: false,
    bgColor: '#000000',
    padding: 0,
    animations: [],
    ...overrides,
  };
}

function makeSampleScene(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    name: 'Test Scene',
    screenWidth: 350,
    screenHeight: 350,
    backgroundColor: '#000000',
    widgets: [makeSampleTextWidget(), makeSampleImageWidget()],
    ...overrides,
  };
}

// ── Scene-level validation ──────────────────────────────────────────────────

describe('Scene schema', () => {
  it('has all required top-level fields', () => {
    const scene = makeSampleScene();
    expect(scene).toHaveProperty('name');
    expect(scene).toHaveProperty('screenWidth');
    expect(scene).toHaveProperty('screenHeight');
    expect(scene).toHaveProperty('backgroundColor');
    expect(scene).toHaveProperty('widgets');
  });

  it('screenWidth and screenHeight are 350', () => {
    const scene = makeSampleScene();
    expect(scene.screenWidth).toBe(350);
    expect(scene.screenHeight).toBe(350);
  });

  it('backgroundColor matches #RRGGBB format', () => {
    const scene = makeSampleScene();
    expect(scene.backgroundColor).toMatch(COLOR_REGEX);
  });

  it('widgets is an array', () => {
    const scene = makeSampleScene();
    expect(Array.isArray(scene.widgets)).toBe(true);
  });
});

// ── TextWidget validation ───────────────────────────────────────────────────

describe('TextWidget schema', () => {
  const requiredFields = [
    'id', 'type', 'x', 'y', 'w', 'h',
    'content', 'fontSize', 'fontColor', 'align', 'verticalAlign',
    'fontWeight', 'fontFamily', 'opacity',
    'bgEnabled', 'bgColor',
    'borderWidth', 'borderColor', 'borderRadius',
    'padding', 'animations',
  ];

  it('has all required fields', () => {
    const widget = makeSampleTextWidget();
    for (const field of requiredFields) {
      expect(widget, `missing field: ${field}`).toHaveProperty(field);
    }
  });

  it('type is "text"', () => {
    const widget = makeSampleTextWidget();
    expect(widget.type).toBe('text');
  });

  it('fontSize is within 6–128', () => {
    const widget = makeSampleTextWidget();
    expect(widget.fontSize).toBeGreaterThanOrEqual(6);
    expect(widget.fontSize).toBeLessThanOrEqual(128);
  });

  it('opacity is within 0–255', () => {
    const widget = makeSampleTextWidget();
    expect(widget.opacity).toBeGreaterThanOrEqual(0);
    expect(widget.opacity).toBeLessThanOrEqual(255);
  });

  it('fontColor matches #RRGGBB format', () => {
    const widget = makeSampleTextWidget();
    expect(widget.fontColor).toMatch(COLOR_REGEX);
  });

  it('bgColor matches #RRGGBB format', () => {
    const widget = makeSampleTextWidget();
    expect(widget.bgColor).toMatch(COLOR_REGEX);
  });

  it('borderColor matches #RRGGBB format', () => {
    const widget = makeSampleTextWidget();
    expect(widget.borderColor).toMatch(COLOR_REGEX);
  });

  it('animations is an array', () => {
    const widget = makeSampleTextWidget();
    expect(Array.isArray(widget.animations)).toBe(true);
  });
});

// ── ImageWidget validation ──────────────────────────────────────────────────

describe('ImageWidget schema', () => {
  const requiredFields = [
    'id', 'type', 'x', 'y', 'w', 'h',
    'imagePath', 'assetId', 'pivotX', 'pivotY', 'zoom', 'antialias',
    'opacity',
    'borderWidth', 'borderColor', 'borderRadius',
    'bgEnabled', 'bgColor',
    'padding', 'animations',
  ];

  it('has all required fields', () => {
    const widget = makeSampleImageWidget();
    for (const field of requiredFields) {
      expect(widget, `missing field: ${field}`).toHaveProperty(field);
    }
  });

  it('type is "image"', () => {
    const widget = makeSampleImageWidget();
    expect(widget.type).toBe('image');
  });

  it('opacity is within 0–255', () => {
    const widget = makeSampleImageWidget();
    expect(widget.opacity).toBeGreaterThanOrEqual(0);
    expect(widget.opacity).toBeLessThanOrEqual(255);
  });

  it('pivotX is within 0–1', () => {
    const widget = makeSampleImageWidget();
    expect(widget.pivotX).toBeGreaterThanOrEqual(0);
    expect(widget.pivotX).toBeLessThanOrEqual(1);
  });

  it('pivotY is within 0–1', () => {
    const widget = makeSampleImageWidget();
    expect(widget.pivotY).toBeGreaterThanOrEqual(0);
    expect(widget.pivotY).toBeLessThanOrEqual(1);
  });

  it('zoom is within 32–512', () => {
    const widget = makeSampleImageWidget();
    expect(widget.zoom).toBeGreaterThanOrEqual(32);
    expect(widget.zoom).toBeLessThanOrEqual(512);
  });

  it('borderColor matches #RRGGBB format', () => {
    const widget = makeSampleImageWidget();
    expect(widget.borderColor).toMatch(COLOR_REGEX);
  });

  it('bgColor matches #RRGGBB format', () => {
    const widget = makeSampleImageWidget();
    expect(widget.bgColor).toMatch(COLOR_REGEX);
  });

  it('animations is an array', () => {
    const widget = makeSampleImageWidget();
    expect(Array.isArray(widget.animations)).toBe(true);
  });
});
