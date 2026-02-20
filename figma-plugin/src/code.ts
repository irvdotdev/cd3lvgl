// cd3lvgl Figma Plugin — sandbox code
// Converts Figma frames to cd3lvgl editor JSON format

// ── Constants ──────────────────────────────────────────────────────────────────

const SCREEN_WIDTH = 350;
const SCREEN_HEIGHT = 350;
const UI_WIDGET_MIN_W = 10;
const UI_WIDGET_MIN_H = 10;
const FONT_SIZE_MIN = 6;
const FONT_SIZE_MAX = 128;
const LV_OPA_MAX = 255;
const ROTATION_MAX = 360;

// ── Types ──────────────────────────────────────────────────────────────────────

interface ScaleContext {
  scale: number;
  offsetX: number;
  offsetY: number;
  frameX: number;
  frameY: number;
}

interface WidgetResult {
  widget: Record<string, unknown>;
  warnings: string[];
}

interface PreviewData {
  type: 'preview';
  textCount: number;
  imageCount: number;
  skippedCount: number;
  scaleFactor: number;
  warnings: string[];
}

interface SceneData {
  name: string;
  screenWidth: number;
  screenHeight: number;
  backgroundColor: string;
  widgets: Record<string, unknown>[];
}

// ── Plugin entry ───────────────────────────────────────────────────────────────

figma.showUI(__html__, { width: 420, height: 520 });

checkSelection();

figma.on('selectionchange', () => {
  checkSelection();
});

figma.ui.onmessage = (msg: { type: string }) => {
  if (msg.type === 'export-json') {
    handleExportJSON();
  } else if (msg.type === 'export-images') {
    handleExportImages();
  }
};

// ── Selection & processing ─────────────────────────────────────────────────────

function checkSelection(): void {
  const selection = figma.currentPage.selection;

  if (selection.length !== 1) {
    figma.ui.postMessage({
      type: 'error',
      message: 'Select exactly one frame, group, or component to export.',
    });
    return;
  }

  const node = selection[0];
  const validTypes: string[] = ['FRAME', 'GROUP', 'COMPONENT', 'INSTANCE', 'SECTION'];
  if (!validTypes.includes(node.type)) {
    figma.ui.postMessage({
      type: 'error',
      message: `Selected node is a ${node.type}. Please select a frame, group, or component.`,
    });
    return;
  }

  const frame = node as FrameNode | GroupNode | ComponentNode | InstanceNode | SectionNode;
  const preview = processFrame(frame);
  figma.ui.postMessage(preview);
}

function computeScaleContext(frame: SceneNode & ChildrenMixin): ScaleContext {
  const frameW = frame.width;
  const frameH = frame.height;
  const scale = Math.min(SCREEN_WIDTH / frameW, SCREEN_HEIGHT / frameH);
  const scaledW = frameW * scale;
  const scaledH = frameH * scale;
  const offsetX = Math.round((SCREEN_WIDTH - scaledW) / 2);
  const offsetY = Math.round((SCREEN_HEIGHT - scaledH) / 2);

  // Use absoluteTransform for the frame origin if available
  let frameX = 0;
  let frameY = 0;
  if ('absoluteTransform' in frame) {
    const t = (frame as SceneNode & { absoluteTransform: Transform }).absoluteTransform;
    frameX = t[0][2];
    frameY = t[1][2];
  }

  return { scale, offsetX, offsetY, frameX, frameY };
}

function processFrame(frame: SceneNode & ChildrenMixin): PreviewData {
  const ctx = computeScaleContext(frame);
  const nodes = flattenNodes(frame);

  let textCount = 0;
  let imageCount = 0;
  let skippedCount = 0;
  const warnings: string[] = [];

  for (const child of nodes) {
    const result = mapNode(child, ctx);
    if (result === null) {
      skippedCount++;
      continue;
    }
    if (result.warnings.length > 0) {
      warnings.push(...result.warnings);
    }
    const w = result.widget;
    if (w.type === 'text') textCount++;
    else if (w.type === 'image') imageCount++;
  }

  return {
    type: 'preview',
    textCount,
    imageCount,
    skippedCount,
    scaleFactor: Math.round(ctx.scale * 1000) / 1000,
    warnings,
  };
}

// ── Node traversal ─────────────────────────────────────────────────────────────

function flattenNodes(parent: SceneNode & ChildrenMixin): SceneNode[] {
  const result: SceneNode[] = [];

  for (const child of parent.children) {
    if (!child.visible) continue;

    if (child.type === 'GROUP') {
      // Groups produce no widget — recurse only
      if ('children' in child) {
        result.push(...flattenNodes(child as SceneNode & ChildrenMixin));
      }
    } else if (
      (child.type === 'FRAME' || child.type === 'COMPONENT' || child.type === 'INSTANCE') &&
      'children' in child &&
      (child as FrameNode).children.length > 0
    ) {
      // Frame/component with children: emit as leaf if it has fills, then recurse
      if (hasSolidOrImageFill(child as GeometryMixin)) {
        result.push(child);
      }
      result.push(...flattenNodes(child as SceneNode & ChildrenMixin));
    } else {
      // Leaf node
      result.push(child);
    }
  }

  return result;
}

function hasSolidOrImageFill(node: GeometryMixin): boolean {
  const fills = node.fills;
  if (!Array.isArray(fills)) return false;
  return fills.some(
    (f: Paint) => f.visible !== false && (f.type === 'SOLID' || f.type === 'IMAGE')
  );
}

// ── Node mapping ───────────────────────────────────────────────────────────────

function mapNode(node: SceneNode, ctx: ScaleContext): WidgetResult | null {
  switch (node.type) {
    case 'TEXT':
      return mapTextNode(node as TextNode, ctx);
    case 'RECTANGLE':
      return mapRectangleNode(node as RectangleNode, ctx);
    case 'FRAME':
    case 'COMPONENT':
    case 'INSTANCE':
      return mapRectangleNode(node as FrameNode, ctx);
    case 'ELLIPSE':
      return mapEllipseNode(node as EllipseNode, ctx);
    case 'VECTOR':
    case 'STAR':
    case 'POLYGON':
    case 'LINE':
      return mapAsImagePlaceholder(node, ctx);
    case 'SECTION':
      // Sections are containers, skip as widget
      return null;
    default:
      return null;
  }
}

function transformCoords(
  node: SceneNode,
  ctx: ScaleContext
): { x: number; y: number; w: number; h: number } | null {
  const t = (node as SceneNode & { absoluteTransform: Transform }).absoluteTransform;
  const nodeX = t[0][2];
  const nodeY = t[1][2];

  const x = Math.round((nodeX - ctx.frameX) * ctx.scale + ctx.offsetX);
  const y = Math.round((nodeY - ctx.frameY) * ctx.scale + ctx.offsetY);
  const w = Math.round(node.width * ctx.scale);
  const h = Math.round(node.height * ctx.scale);

  if (w < UI_WIDGET_MIN_W || h < UI_WIDGET_MIN_H) return null;

  return { x, y, w, h };
}

function getNodeOpacity(node: SceneNode): number {
  const rawOpacity = 'opacity' in node ? (node as BlendMixin).opacity : 1;
  return clamp(Math.round(rawOpacity * LV_OPA_MAX), 0, LV_OPA_MAX);
}

function getNodeRotation(node: SceneNode): number {
  const raw = 'rotation' in node ? (node as LayoutMixin).rotation : 0;
  // Figma rotation is counter-clockwise in degrees; normalize to 0–360
  const deg = (((-raw) % 360) + 360) % 360;
  return clamp(Math.round(deg), 0, ROTATION_MAX);
}

// ── Text mapping ───────────────────────────────────────────────────────────────

function mapTextNode(node: TextNode, ctx: ScaleContext): WidgetResult | null {
  const coords = transformCoords(node, ctx);
  if (!coords) return null;

  const warnings: string[] = [];
  const { x, y, w, h } = coords;

  // Font size — scale proportionally, clamp
  let fontSize: number;
  if (typeof node.fontSize === 'number') {
    fontSize = clamp(Math.round(node.fontSize * ctx.scale), FONT_SIZE_MIN, FONT_SIZE_MAX);
  } else {
    // Mixed font sizes — use a reasonable default
    fontSize = clamp(Math.round(16 * ctx.scale), FONT_SIZE_MIN, FONT_SIZE_MAX);
    warnings.push(`"${truncate(node.characters, 20)}": mixed font sizes, using default`);
  }

  // Font color
  let fontColor = '#FFFFFF';
  const fills = node.fills;
  if (Array.isArray(fills) && fills.length > 0 && fills[0].type === 'SOLID') {
    fontColor = rgbaToHex(fills[0].color);
  }

  // Alignment
  let align: string = 'left';
  if (typeof node.textAlignHorizontal === 'string') {
    const hMap: Record<string, string> = { LEFT: 'left', CENTER: 'center', RIGHT: 'right', JUSTIFIED: 'left' };
    align = hMap[node.textAlignHorizontal] || 'left';
  }

  let verticalAlign: string = 'top';
  if (typeof node.textAlignVertical === 'string') {
    const vMap: Record<string, string> = { TOP: 'top', CENTER: 'middle', BOTTOM: 'bottom' };
    verticalAlign = vMap[node.textAlignVertical] || 'top';
  }

  // Font weight
  let fontWeight = 'normal';
  if (typeof node.fontName === 'object' && 'style' in node.fontName) {
    const style = (node.fontName as FontName).style.toLowerCase();
    if (style.includes('bold') || style.includes('black') || style.includes('heavy')) {
      fontWeight = 'bold';
    }
  }

  const widget: Record<string, unknown> = {
    id: generateId(),
    type: 'text',
    layer: 1,
    x,
    y,
    w,
    h,
    visible: true,
    clickable: false,
    opacity: getNodeOpacity(node),
    rotation: getNodeRotation(node),
    content: node.characters || '',
    fontSize,
    fontColor,
    fontFamily: 'sans-serif',
    fontWeight,
    align,
    verticalAlign,
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
  };

  return { widget, warnings };
}

// ── Rectangle / Frame mapping ──────────────────────────────────────────────────

function mapRectangleNode(
  node: RectangleNode | FrameNode | ComponentNode | InstanceNode,
  ctx: ScaleContext
): WidgetResult | null {
  const coords = transformCoords(node, ctx);
  if (!coords) return null;

  const warnings: string[] = [];
  const { x, y, w, h } = coords;

  const fills = node.fills;
  const hasFills = Array.isArray(fills) && fills.length > 0;

  // Check for image fill → ImageWidget placeholder
  if (hasFills) {
    const imageFill = (fills as Paint[]).find(
      (f) => f.visible !== false && f.type === 'IMAGE'
    );
    if (imageFill) {
      warnings.push(`"${node.name}": image fill detected, exported as image placeholder`);
      return makeImageWidget(node, x, y, w, h, warnings);
    }
  }

  // Solid fill → TextWidget with background
  let bgColor = '#000000';
  let bgEnabled = false;
  if (hasFills) {
    const solidFill = (fills as Paint[]).find(
      (f) => f.visible !== false && f.type === 'SOLID'
    );
    if (solidFill && solidFill.type === 'SOLID') {
      bgColor = rgbaToHex(solidFill.color);
      bgEnabled = true;
    }
  }

  // Border
  let borderWidth = 0;
  let borderColor = '#000000';
  if ('strokes' in node) {
    const strokes = node.strokes;
    if (Array.isArray(strokes) && strokes.length > 0) {
      const stroke = strokes[0];
      if (stroke.visible !== false && stroke.type === 'SOLID') {
        borderColor = rgbaToHex(stroke.color);
        borderWidth = Math.max(
          0,
          Math.round(
            (typeof node.strokeWeight === 'number' ? node.strokeWeight : 1) * ctx.scale
          )
        );
      }
    }
  }

  // Border radius
  let borderRadius = 0;
  if ('cornerRadius' in node && typeof node.cornerRadius === 'number') {
    borderRadius = Math.max(0, Math.round(node.cornerRadius * ctx.scale));
  }

  const widget: Record<string, unknown> = {
    id: generateId(),
    type: 'text',
    layer: 1,
    x,
    y,
    w,
    h,
    visible: true,
    clickable: false,
    opacity: getNodeOpacity(node),
    rotation: getNodeRotation(node),
    content: '',
    fontSize: 16,
    fontColor: '#FFFFFF',
    fontFamily: 'sans-serif',
    fontWeight: 'normal',
    align: 'center',
    verticalAlign: 'middle',
    letterSpacing: 0,
    lineSpacing: 0,
    textDecoration: 'none',
    longMode: 'wrap',
    borderWidth,
    borderColor,
    borderRadius,
    bgEnabled,
    bgColor,
    padding: 0,
    animations: [],
  };

  return { widget, warnings };
}

// ── Ellipse mapping ────────────────────────────────────────────────────────────

function mapEllipseNode(node: EllipseNode, ctx: ScaleContext): WidgetResult | null {
  const coords = transformCoords(node, ctx);
  if (!coords) return null;

  const warnings: string[] = [];
  const { x, y, w, h } = coords;

  const fills = node.fills;
  const hasFills = Array.isArray(fills) && fills.length > 0;

  // Check for image fill
  if (hasFills) {
    const imageFill = (fills as Paint[]).find(
      (f) => f.visible !== false && f.type === 'IMAGE'
    );
    if (imageFill) {
      warnings.push(`"${node.name}": ellipse with image fill, exported as image placeholder`);
      return makeImageWidget(node, x, y, w, h, warnings);
    }
  }

  // Solid fill → TextWidget with borderRadius = circle approximation
  let bgColor = '#000000';
  let bgEnabled = false;
  if (hasFills) {
    const solidFill = (fills as Paint[]).find(
      (f) => f.visible !== false && f.type === 'SOLID'
    );
    if (solidFill && solidFill.type === 'SOLID') {
      bgColor = rgbaToHex(solidFill.color);
      bgEnabled = true;
    }
  }

  // Border
  let borderWidth = 0;
  let borderColor = '#000000';
  const strokes = node.strokes;
  if (Array.isArray(strokes) && strokes.length > 0) {
    const stroke = strokes[0];
    if (stroke.visible !== false && stroke.type === 'SOLID') {
      borderColor = rgbaToHex(stroke.color);
      borderWidth = Math.max(
        0,
        Math.round(
          (typeof node.strokeWeight === 'number' ? node.strokeWeight : 1) * ctx.scale
        )
      );
    }
  }

  const borderRadius = Math.round(Math.max(w, h) / 2);

  const widget: Record<string, unknown> = {
    id: generateId(),
    type: 'text',
    layer: 1,
    x,
    y,
    w,
    h,
    visible: true,
    clickable: false,
    opacity: getNodeOpacity(node),
    rotation: getNodeRotation(node),
    content: '',
    fontSize: 16,
    fontColor: '#FFFFFF',
    fontFamily: 'sans-serif',
    fontWeight: 'normal',
    align: 'center',
    verticalAlign: 'middle',
    letterSpacing: 0,
    lineSpacing: 0,
    textDecoration: 'none',
    longMode: 'wrap',
    borderWidth,
    borderColor,
    borderRadius,
    bgEnabled,
    bgColor,
    padding: 0,
    animations: [],
  };

  return { widget, warnings };
}

// ── Image placeholder ──────────────────────────────────────────────────────────

function mapAsImagePlaceholder(node: SceneNode, ctx: ScaleContext): WidgetResult | null {
  const coords = transformCoords(node, ctx);
  if (!coords) return null;

  const warnings: string[] = [];
  warnings.push(
    `"${node.name}" (${node.type}): exported as image placeholder — use "Export Images" to get the PNG`
  );

  return makeImageWidget(node, coords.x, coords.y, coords.w, coords.h, warnings);
}

function makeImageWidget(
  node: SceneNode,
  x: number,
  y: number,
  w: number,
  h: number,
  warnings: string[]
): WidgetResult {
  const widget: Record<string, unknown> = {
    id: generateId(),
    type: 'image',
    layer: 1,
    x: x + Math.round(w / 2),
    y: y + Math.round(h / 2),
    w,
    h,
    visible: true,
    clickable: false,
    opacity: getNodeOpacity(node),
    rotation: getNodeRotation(node),
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
  };

  return { widget, warnings };
}

// ── Background color extraction ────────────────────────────────────────────────

function extractBackgroundColor(frame: SceneNode): string {
  if ('fills' in frame) {
    const fills = (frame as GeometryMixin).fills;
    if (Array.isArray(fills)) {
      const solid = fills.find(
        (f: Paint) => f.visible !== false && f.type === 'SOLID'
      );
      if (solid && solid.type === 'SOLID') {
        return rgbaToHex(solid.color);
      }
    }
  }
  return '#000000';
}

// ── Export handlers ────────────────────────────────────────────────────────────

function handleExportJSON(): void {
  const selection = figma.currentPage.selection;
  if (selection.length !== 1) return;

  const frame = selection[0] as SceneNode & ChildrenMixin;
  const ctx = computeScaleContext(frame);
  const nodes = flattenNodes(frame);

  const widgets: Record<string, unknown>[] = [];
  for (const child of nodes) {
    const result = mapNode(child, ctx);
    if (result !== null) {
      widgets.push(result.widget);
    }
  }

  const scene: SceneData = {
    name: frame.name || 'Imported Scene',
    screenWidth: SCREEN_WIDTH,
    screenHeight: SCREEN_HEIGHT,
    backgroundColor: extractBackgroundColor(frame),
    widgets,
  };

  figma.ui.postMessage({
    type: 'download-json',
    json: JSON.stringify(scene, null, 2),
    filename: `${sanitizeFilename(frame.name || 'scene')}.json`,
  });
}

async function handleExportImages(): Promise<void> {
  const selection = figma.currentPage.selection;
  if (selection.length !== 1) return;

  const frame = selection[0] as SceneNode & ChildrenMixin;
  const nodes = flattenNodes(frame);
  const ctx = computeScaleContext(frame);

  const imageNodes: { node: SceneNode; name: string }[] = [];
  for (const child of nodes) {
    const result = mapNode(child, ctx);
    if (result !== null && result.widget.type === 'image') {
      imageNodes.push({ node: child, name: child.name || 'image' });
    }
  }

  if (imageNodes.length === 0) {
    figma.ui.postMessage({ type: 'error', message: 'No image widgets to export.' });
    return;
  }

  for (const { node, name } of imageNodes) {
    try {
      if (!('exportAsync' in node)) continue;
      const bytes = await (node as ExportMixin).exportAsync({
        format: 'PNG',
        constraint: { type: 'SCALE', value: 1 },
      });
      figma.ui.postMessage({
        type: 'download-image',
        bytes: Array.from(bytes),
        filename: `${sanitizeFilename(name)}.png`,
      });
    } catch (err) {
      figma.ui.postMessage({
        type: 'error',
        message: `Failed to export "${name}": ${String(err)}`,
      });
    }
  }

  figma.ui.postMessage({ type: 'export-images-done' });
}

// ── Utilities ──────────────────────────────────────────────────────────────────

function rgbaToHex(color: RGB | RGBA): string {
  const r = Math.round(clamp(color.r, 0, 1) * 255);
  const g = Math.round(clamp(color.g, 0, 1) * 255);
  const b = Math.round(clamp(color.b, 0, 1) * 255);
  return `#${hex2(r)}${hex2(g)}${hex2(b)}`;
}

function hex2(n: number): string {
  return n.toString(16).padStart(2, '0').toUpperCase();
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function generateId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let suffix = '';
  for (let i = 0; i < 8; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `fig_${Date.now()}_${suffix}`;
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9_\-]/g, '_').substring(0, 60);
}

function truncate(s: string, maxLen: number): string {
  return s.length > maxLen ? s.substring(0, maxLen) + '...' : s;
}
