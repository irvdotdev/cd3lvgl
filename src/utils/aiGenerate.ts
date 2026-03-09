// AI scene generation — browser-side port of scripts/image-to-scene.mjs
// NOTE: The SYSTEM_PROMPT is duplicated from scripts/image-to-scene.mjs.
// If the prompt needs updating, change both places.

import type { Scene } from '../types/widget';

// ---------------------------------------------------------------------------
// System prompt (verbatim copy from scripts/image-to-scene.mjs)
// ---------------------------------------------------------------------------
const SYSTEM_PROMPT = `You convert UI design images into cd3lvgl Scene JSON for a 350x350px circular LVGL display.

Output ONLY valid JSON matching this schema. No markdown fences, no commentary, no explanation — just the JSON object.

{
  "name": "string",
  "screenWidth": 350,
  "screenHeight": 350,
  "backgroundColor": "#RRGGBB",
  "widgets": [...]
}

Widget types:

TextWidget (type: "text"):
  Required: id(string), type("text"), layer(0|1), x(number), y(number), w(number,>=10), h(number,>=10),
  content(string, <=255 bytes), fontSize(6-128), fontColor("#RRGGBB"),
  align("left"|"center"|"right"), verticalAlign("top"|"middle"|"bottom"),
  fontFamily("sans-serif"|"serif"|"monospace"), fontWeight("normal"|"bold")
  Optional with defaults: opacity(255), borderWidth(0), borderColor("#000000"),
  borderRadius(0), bgEnabled(false), bgColor("#000000"), padding(0), rotation(0),
  visible(true), clickable(false), letterSpacing(0), lineSpacing(0),
  textDecoration("none"), longMode("wrap"), animations([])

ImageWidget (type: "image"):
  Required: id(string), type("image"), layer(0|1), x(number), y(number), w(number,>=10), h(number,>=10),
  imagePath(""), assetId(""), pivotX(0.5), pivotY(0.5), zoom(256), antialias(true)
  Same optional base fields as TextWidget (opacity, border*, bg*, padding, rotation, visible, clickable, animations).
  Note: Always set imagePath="" and assetId="" — the user assigns actual images later.

GaugeWidget (type: "gauge"):
  Required: id(string), type("gauge"), layer(0|1), x(number), y(number), w(number,>=10), h(number,>=10),
  minValue(number), maxValue(number, >minValue), currentValue(number, in [min,max]),
  startAngle(number, degrees), endAngle(number, degrees, != startAngle)
  Arc: showArc(bool), arcColor("#RRGGBB"), arcBgColor("#RRGGBB"), arcWidth(>=1), arcRounded(bool)
  Needle: showNeedle(bool), needleColor("#RRGGBB"), needleWidth(>=1), needleLength(1-100),
  showNeedleDot(bool), needleDotRadius(>=1)
  Ticks: showTicks(bool), tickCount(>=2), tickLength(>=1), tickWidth(>=1), tickColor("#RRGGBB")
  Labels: showLabels(bool), labelCount(>=2), labelFontSize(6-128), labelColor("#RRGGBB"), labelOffset(number)

Rules:
- Coordinate origin is top-left (0,0). Display is 350x350 with circular mask (center 175,175, radius 175).
- All colors must be #RRGGBB hex format (e.g. "#ff0000").
- Generate unique IDs: "w1", "w2", "w3", etc.
- Text you can read in the image -> TextWidget with the actual text as content.
- Colored rectangles/shapes -> TextWidget with bgEnabled:true and empty content:"".
- Circles -> TextWidget with bgEnabled:true, borderRadius set to half of max(w,h).
- Photos, icons, complex graphics -> ImageWidget with imagePath:"" and assetId:"".
- Circular gauges, dials, meters -> GaugeWidget with appropriate angle ranges and values.
- Keep all widgets within 350x350 bounds. Widgets near edges may be clipped by the circular mask.
- Infer the background color from the dominant background of the design.
- screenWidth and screenHeight must always be 350.
- For gauge widgets: always include ALL gauge fields (arc, needle, ticks, labels) even if some are disabled (showArc:false, etc).`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const HEX_RE = /^#[0-9a-fA-F]{6}$/;

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function ensureHex(color: unknown, fallback: string): string {
  if (typeof color === 'string' && HEX_RE.test(color)) return color;
  return fallback;
}

// ---------------------------------------------------------------------------
// Post-processing (port of CLI's postProcess)
// ---------------------------------------------------------------------------
interface PostProcessOpts {
  name?: string;
  bg?: string;
}

export function postProcessScene(scene: Record<string, unknown>, opts: PostProcessOpts = {}): Scene {
  const s: Record<string, unknown> = JSON.parse(JSON.stringify(scene));

  s.name = s.name || opts.name || 'Untitled';
  s.screenWidth = 350;
  s.screenHeight = 350;
  s.backgroundColor = opts.bg
    ? ensureHex(opts.bg, '#000000')
    : ensureHex(s.backgroundColor, '#000000');

  if (!Array.isArray(s.widgets)) {
    s.widgets = [];
  }

  const usedIds = new Set<string>();
  let idCounter = 1;

  for (const w of s.widgets as Record<string, unknown>[]) {
    // Ensure unique ID
    if (!w.id || usedIds.has(w.id as string)) {
      while (usedIds.has(`w${idCounter}`)) idCounter++;
      w.id = `w${idCounter}`;
      idCounter++;
    }
    usedIds.add(w.id as string);

    // Validate type
    if (!['text', 'image', 'gauge'].includes(w.type as string)) {
      w.type = 'text';
    }

    // Layer
    w.layer = w.layer === 0 ? 0 : 1;

    // Position & size
    w.x = typeof w.x === 'number' ? Math.round(w.x) : 0;
    w.y = typeof w.y === 'number' ? Math.round(w.y) : 0;
    w.w = typeof w.w === 'number' ? Math.max(10, Math.round(w.w)) : 100;
    w.h = typeof w.h === 'number' ? Math.max(10, Math.round(w.h)) : 50;

    // Base optional fields
    w.opacity = typeof w.opacity === 'number' ? clamp(Math.round(w.opacity), 0, 255) : 255;
    w.rotation = typeof w.rotation === 'number' ? clamp(w.rotation, 0, 360) : 0;
    w.borderWidth = typeof w.borderWidth === 'number' ? Math.max(0, w.borderWidth) : 0;
    w.borderRadius = typeof w.borderRadius === 'number' ? Math.max(0, w.borderRadius) : 0;
    w.padding = typeof w.padding === 'number' ? Math.max(0, w.padding) : 0;
    w.borderColor = ensureHex(w.borderColor, '#000000');
    w.bgColor = ensureHex(w.bgColor, '#000000');
    if (typeof w.bgEnabled !== 'boolean') w.bgEnabled = false;
    if (typeof w.visible !== 'boolean') w.visible = true;
    if (typeof w.clickable !== 'boolean') w.clickable = false;
    if (!Array.isArray(w.animations)) w.animations = [];

    // Type-specific clamping
    if (w.type === 'text') {
      w.content = typeof w.content === 'string' ? w.content : '';
      w.fontSize = typeof w.fontSize === 'number' ? clamp(w.fontSize, 6, 128) : 16;
      w.fontColor = ensureHex(w.fontColor, '#ffffff');
      w.align = ['left', 'center', 'right'].includes(w.align as string) ? w.align : 'left';
      w.verticalAlign = ['top', 'middle', 'bottom'].includes(w.verticalAlign as string) ? w.verticalAlign : 'top';
      w.fontFamily = ['sans-serif', 'serif', 'monospace'].includes(w.fontFamily as string) ? w.fontFamily : 'sans-serif';
      w.fontWeight = w.fontWeight === 'bold' ? 'bold' : 'normal';
      w.letterSpacing = typeof w.letterSpacing === 'number' ? w.letterSpacing : 0;
      w.lineSpacing = typeof w.lineSpacing === 'number' ? w.lineSpacing : 0;
      w.textDecoration = ['none', 'underline', 'strikethrough'].includes(w.textDecoration as string) ? w.textDecoration : 'none';
      w.longMode = ['wrap', 'scroll', 'dot', 'clip'].includes(w.longMode as string) ? w.longMode : 'wrap';
    }

    if (w.type === 'image') {
      w.imagePath = '';
      w.assetId = '';
      w.pivotX = typeof w.pivotX === 'number' ? clamp(w.pivotX, 0, 1) : 0.5;
      w.pivotY = typeof w.pivotY === 'number' ? clamp(w.pivotY, 0, 1) : 0.5;
      w.zoom = typeof w.zoom === 'number' ? clamp(Math.round(w.zoom), 32, 512) : 256;
      if (typeof w.antialias !== 'boolean') w.antialias = true;
    }

    if (w.type === 'gauge') {
      w.minValue = typeof w.minValue === 'number' ? w.minValue : 0;
      w.maxValue = typeof w.maxValue === 'number' ? w.maxValue : 100;
      if ((w.maxValue as number) <= (w.minValue as number)) w.maxValue = (w.minValue as number) + 1;
      w.currentValue = typeof w.currentValue === 'number'
        ? clamp(w.currentValue, w.minValue as number, w.maxValue as number)
        : w.minValue;
      w.startAngle = typeof w.startAngle === 'number' ? w.startAngle : 135;
      w.endAngle = typeof w.endAngle === 'number' ? w.endAngle : 45;
      if (w.startAngle === w.endAngle) w.endAngle = (w.startAngle as number) + 270;

      // Arc
      if (typeof w.showArc !== 'boolean') w.showArc = true;
      w.arcColor = ensureHex(w.arcColor, '#00ff00');
      w.arcBgColor = ensureHex(w.arcBgColor, '#333333');
      w.arcWidth = typeof w.arcWidth === 'number' ? Math.max(1, w.arcWidth) : 10;
      if (typeof w.arcRounded !== 'boolean') w.arcRounded = false;

      // Needle
      if (typeof w.showNeedle !== 'boolean') w.showNeedle = false;
      w.needleColor = ensureHex(w.needleColor, '#ffffff');
      w.needleWidth = typeof w.needleWidth === 'number' ? Math.max(1, w.needleWidth) : 2;
      w.needleLength = typeof w.needleLength === 'number' ? clamp(w.needleLength, 1, 100) : 80;
      if (typeof w.showNeedleDot !== 'boolean') w.showNeedleDot = false;
      w.needleDotRadius = typeof w.needleDotRadius === 'number' ? Math.max(1, w.needleDotRadius) : 5;

      // Ticks
      if (typeof w.showTicks !== 'boolean') w.showTicks = false;
      w.tickCount = typeof w.tickCount === 'number' ? Math.max(2, w.tickCount) : 5;
      w.tickLength = typeof w.tickLength === 'number' ? Math.max(1, w.tickLength) : 5;
      w.tickWidth = typeof w.tickWidth === 'number' ? Math.max(1, w.tickWidth) : 2;
      w.tickColor = ensureHex(w.tickColor, '#ffffff');

      // Labels
      if (typeof w.showLabels !== 'boolean') w.showLabels = false;
      w.labelCount = typeof w.labelCount === 'number' ? Math.max(2, w.labelCount) : 5;
      w.labelFontSize = typeof w.labelFontSize === 'number' ? clamp(w.labelFontSize, 6, 128) : 12;
      w.labelColor = ensureHex(w.labelColor, '#ffffff');
      w.labelOffset = typeof w.labelOffset === 'number' ? w.labelOffset : 10;
    }
  }

  return s as unknown as Scene;
}

// ---------------------------------------------------------------------------
// API call
// ---------------------------------------------------------------------------
type MediaType = 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif';

interface GenerateResult {
  scene: Scene;
  widgetCount: number;
}

export async function generateSceneFromImage(
  apiKey: string,
  imageBase64: string,
  mediaType: MediaType,
  opts: PostProcessOpts = {},
): Promise<GenerateResult> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: imageBase64 },
            },
            {
              type: 'text',
              text: `Analyze this UI design and convert it to a cd3lvgl Scene JSON for a 350x350px circular display. Scene name: "${opts.name || 'AI Generated'}".`,
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    let message = `API error (${response.status})`;
    try {
      const err = await response.json();
      if (err?.error?.message) {
        message = err.error.message;
      }
    } catch {
      // use default message
    }

    if (response.status === 401) {
      throw new Error('Invalid API key. Please check your Anthropic API key and try again.');
    }
    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please wait a moment and try again.');
    }
    if (response.status === 529) {
      throw new Error('Anthropic API is overloaded. Please try again later.');
    }
    throw new Error(message);
  }

  const data = await response.json();

  // Extract text from response
  const textBlock = data.content?.find((b: { type: string }) => b.type === 'text');
  if (!textBlock) {
    throw new Error('No text in Claude response.');
  }

  let raw: string = textBlock.text.trim();

  // Strip markdown fences if present
  if (raw.startsWith('```')) {
    raw = raw.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
  }

  // Parse JSON
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('Failed to parse Claude response as JSON. The model may have returned invalid output.');
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Response is not a JSON object.');
  }

  const scene = postProcessScene(parsed, opts);

  return {
    scene,
    widgetCount: scene.widgets.length,
  };
}
