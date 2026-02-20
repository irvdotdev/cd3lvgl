#!/usr/bin/env node

// image-to-scene.mjs — Convert a UI design image to cd3lvgl Scene JSON via Claude Vision
// Usage: node scripts/image-to-scene.mjs <image-path> [options]
//
// Options:
//   --name <name>    Scene name (default: filename without extension)
//   --bg <color>     Override background color (#RRGGBB)
//   -o <file>        Write output to file instead of stdout
//   --model <model>  Claude model (default: claude-sonnet-4-5-20250929)
//   --help           Show this help message

import fs from "node:fs";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";

// ---------------------------------------------------------------------------
// Arg parsing
// ---------------------------------------------------------------------------
function printUsage() {
  console.error(`Usage: node scripts/image-to-scene.mjs <image-path> [options]

Converts a UI design screenshot into cd3lvgl Scene JSON using Claude Vision.

Positional:
  <image-path>       Path to PNG, JPEG, or WebP image file

Options:
  --name <name>      Scene name (default: filename without extension)
  --bg <color>       Override background color (#RRGGBB)
  -o <file>          Write JSON to file instead of stdout
  --model <model>    Claude model to use (default: claude-sonnet-4-5-20250929)
  --help             Show this help message

Environment:
  ANTHROPIC_API_KEY   Required. Your Anthropic API key.

Examples:
  node scripts/image-to-scene.mjs design.png > scene.json
  node scripts/image-to-scene.mjs design.png --name "My Watch Face" --bg "#1a1a2e" -o scene.json`);
}

function parseArgs(argv) {
  const args = argv.slice(2);
  const opts = {
    imagePath: null,
    name: null,
    bg: null,
    output: null,
    model: "claude-sonnet-4-5-20250929",
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--help" || arg === "-h") {
      printUsage();
      process.exit(0);
    } else if (arg === "--name" && i + 1 < args.length) {
      opts.name = args[++i];
    } else if (arg === "--bg" && i + 1 < args.length) {
      opts.bg = args[++i];
    } else if (arg === "-o" && i + 1 < args.length) {
      opts.output = args[++i];
    } else if (arg === "--model" && i + 1 < args.length) {
      opts.model = args[++i];
    } else if (!arg.startsWith("-")) {
      opts.imagePath = arg;
    } else {
      console.error(`Unknown option: ${arg}`);
      printUsage();
      process.exit(1);
    }
  }

  if (!opts.imagePath) {
    console.error("Error: image path is required.\n");
    printUsage();
    process.exit(1);
  }

  return opts;
}

// ---------------------------------------------------------------------------
// Image handling
// ---------------------------------------------------------------------------
const MIME_MAP = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

function readImage(imagePath) {
  const resolved = path.resolve(imagePath);
  if (!fs.existsSync(resolved)) {
    console.error(`Error: file not found: ${resolved}`);
    process.exit(1);
  }

  const ext = path.extname(resolved).toLowerCase();
  const mime = MIME_MAP[ext];
  if (!mime) {
    console.error(
      `Error: unsupported image format "${ext}". Use PNG, JPEG, WebP, or GIF.`
    );
    process.exit(1);
  }

  const data = fs.readFileSync(resolved);
  return { base64: data.toString("base64"), mediaType: mime };
}

// ---------------------------------------------------------------------------
// System prompt
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
// Post-processing & validation
// ---------------------------------------------------------------------------
const HEX_RE = /^#[0-9a-fA-F]{6}$/;

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

function ensureHex(color, fallback) {
  if (typeof color === "string" && HEX_RE.test(color)) return color;
  return fallback;
}

function postProcess(scene, opts) {
  // Scene-level defaults
  scene.name = scene.name || opts.name || "Untitled";
  scene.screenWidth = 350;
  scene.screenHeight = 350;
  scene.backgroundColor = opts.bg
    ? ensureHex(opts.bg, "#000000")
    : ensureHex(scene.backgroundColor, "#000000");

  if (!Array.isArray(scene.widgets)) {
    scene.widgets = [];
  }

  const usedIds = new Set();
  let idCounter = 1;

  for (const w of scene.widgets) {
    // Ensure unique ID
    if (!w.id || usedIds.has(w.id)) {
      while (usedIds.has(`w${idCounter}`)) idCounter++;
      w.id = `w${idCounter}`;
      idCounter++;
    }
    usedIds.add(w.id);

    // Validate type
    if (!["text", "image", "gauge"].includes(w.type)) {
      w.type = "text";
    }

    // Layer
    w.layer = w.layer === 0 ? 0 : 1;

    // Position & size
    w.x = typeof w.x === "number" ? Math.round(w.x) : 0;
    w.y = typeof w.y === "number" ? Math.round(w.y) : 0;
    w.w = typeof w.w === "number" ? Math.max(10, Math.round(w.w)) : 100;
    w.h = typeof w.h === "number" ? Math.max(10, Math.round(w.h)) : 50;

    // Base optional fields
    w.opacity =
      typeof w.opacity === "number"
        ? clamp(Math.round(w.opacity), 0, 255)
        : 255;
    w.rotation =
      typeof w.rotation === "number" ? clamp(w.rotation, 0, 360) : 0;
    w.borderWidth =
      typeof w.borderWidth === "number" ? Math.max(0, w.borderWidth) : 0;
    w.borderRadius =
      typeof w.borderRadius === "number" ? Math.max(0, w.borderRadius) : 0;
    w.padding = typeof w.padding === "number" ? Math.max(0, w.padding) : 0;
    w.borderColor = ensureHex(w.borderColor, "#000000");
    w.bgColor = ensureHex(w.bgColor, "#000000");
    if (typeof w.bgEnabled !== "boolean") w.bgEnabled = false;
    if (typeof w.visible !== "boolean") w.visible = true;
    if (typeof w.clickable !== "boolean") w.clickable = false;
    if (!Array.isArray(w.animations)) w.animations = [];

    // Type-specific clamping
    if (w.type === "text") {
      w.content = typeof w.content === "string" ? w.content : "";
      w.fontSize =
        typeof w.fontSize === "number" ? clamp(w.fontSize, 6, 128) : 16;
      w.fontColor = ensureHex(w.fontColor, "#ffffff");
      w.align = ["left", "center", "right"].includes(w.align)
        ? w.align
        : "left";
      w.verticalAlign = ["top", "middle", "bottom"].includes(w.verticalAlign)
        ? w.verticalAlign
        : "top";
      w.fontFamily = ["sans-serif", "serif", "monospace"].includes(
        w.fontFamily
      )
        ? w.fontFamily
        : "sans-serif";
      w.fontWeight = w.fontWeight === "bold" ? "bold" : "normal";
      w.letterSpacing =
        typeof w.letterSpacing === "number" ? w.letterSpacing : 0;
      w.lineSpacing = typeof w.lineSpacing === "number" ? w.lineSpacing : 0;
      w.textDecoration = ["none", "underline", "strikethrough"].includes(
        w.textDecoration
      )
        ? w.textDecoration
        : "none";
      w.longMode = ["wrap", "scroll", "dot", "clip"].includes(w.longMode)
        ? w.longMode
        : "wrap";
    }

    if (w.type === "image") {
      w.imagePath = "";
      w.assetId = "";
      w.pivotX =
        typeof w.pivotX === "number" ? clamp(w.pivotX, 0, 1) : 0.5;
      w.pivotY =
        typeof w.pivotY === "number" ? clamp(w.pivotY, 0, 1) : 0.5;
      w.zoom =
        typeof w.zoom === "number"
          ? clamp(Math.round(w.zoom), 32, 512)
          : 256;
      if (typeof w.antialias !== "boolean") w.antialias = true;
    }

    if (w.type === "gauge") {
      w.minValue = typeof w.minValue === "number" ? w.minValue : 0;
      w.maxValue = typeof w.maxValue === "number" ? w.maxValue : 100;
      if (w.maxValue <= w.minValue) w.maxValue = w.minValue + 1;
      w.currentValue =
        typeof w.currentValue === "number"
          ? clamp(w.currentValue, w.minValue, w.maxValue)
          : w.minValue;
      w.startAngle = typeof w.startAngle === "number" ? w.startAngle : 135;
      w.endAngle = typeof w.endAngle === "number" ? w.endAngle : 45;
      if (w.startAngle === w.endAngle) w.endAngle = w.startAngle + 270;

      // Arc
      if (typeof w.showArc !== "boolean") w.showArc = true;
      w.arcColor = ensureHex(w.arcColor, "#00ff00");
      w.arcBgColor = ensureHex(w.arcBgColor, "#333333");
      w.arcWidth =
        typeof w.arcWidth === "number" ? Math.max(1, w.arcWidth) : 10;
      if (typeof w.arcRounded !== "boolean") w.arcRounded = false;

      // Needle
      if (typeof w.showNeedle !== "boolean") w.showNeedle = false;
      w.needleColor = ensureHex(w.needleColor, "#ffffff");
      w.needleWidth =
        typeof w.needleWidth === "number" ? Math.max(1, w.needleWidth) : 2;
      w.needleLength =
        typeof w.needleLength === "number"
          ? clamp(w.needleLength, 1, 100)
          : 80;
      if (typeof w.showNeedleDot !== "boolean") w.showNeedleDot = false;
      w.needleDotRadius =
        typeof w.needleDotRadius === "number"
          ? Math.max(1, w.needleDotRadius)
          : 5;

      // Ticks
      if (typeof w.showTicks !== "boolean") w.showTicks = false;
      w.tickCount =
        typeof w.tickCount === "number" ? Math.max(2, w.tickCount) : 5;
      w.tickLength =
        typeof w.tickLength === "number" ? Math.max(1, w.tickLength) : 5;
      w.tickWidth =
        typeof w.tickWidth === "number" ? Math.max(1, w.tickWidth) : 2;
      w.tickColor = ensureHex(w.tickColor, "#ffffff");

      // Labels
      if (typeof w.showLabels !== "boolean") w.showLabels = false;
      w.labelCount =
        typeof w.labelCount === "number" ? Math.max(2, w.labelCount) : 5;
      w.labelFontSize =
        typeof w.labelFontSize === "number"
          ? clamp(w.labelFontSize, 6, 128)
          : 12;
      w.labelColor = ensureHex(w.labelColor, "#ffffff");
      w.labelOffset = typeof w.labelOffset === "number" ? w.labelOffset : 10;
    }
  }

  return scene;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const opts = parseArgs(process.argv);

  // Default scene name from filename
  if (!opts.name) {
    opts.name = path.basename(opts.imagePath, path.extname(opts.imagePath));
  }

  // Check API key
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error(
      "Error: ANTHROPIC_API_KEY environment variable is not set.\n" +
        "Export your key:  export ANTHROPIC_API_KEY=sk-ant-..."
    );
    process.exit(1);
  }

  // Read image
  const { base64, mediaType } = readImage(opts.imagePath);
  console.error(`Reading ${opts.imagePath} (${mediaType})...`);

  // Call Claude
  const client = new Anthropic();
  console.error(`Calling ${opts.model}...`);

  const response = await client.messages.create({
    model: opts.model,
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mediaType, data: base64 },
          },
          {
            type: "text",
            text: `Analyze this UI design and convert it to a cd3lvgl Scene JSON for a 350x350px circular display.${opts.bg ? ` Use "${opts.bg}" as the background color.` : ""} Scene name: "${opts.name}".`,
          },
        ],
      },
    ],
  });

  // Extract text from response
  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock) {
    console.error("Error: no text in Claude response.");
    process.exit(1);
  }

  let raw = textBlock.text.trim();

  // Strip markdown fences if present
  if (raw.startsWith("```")) {
    raw = raw.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
  }

  // Parse JSON
  let scene;
  try {
    scene = JSON.parse(raw);
  } catch (e) {
    console.error("Error: failed to parse Claude response as JSON.");
    console.error("Raw response:\n" + raw);
    process.exit(1);
  }

  // Validate basic structure
  if (!scene || typeof scene !== "object") {
    console.error("Error: response is not a JSON object.");
    process.exit(1);
  }

  // Post-process
  scene = postProcess(scene, opts);

  const json = JSON.stringify(scene, null, 2);

  // Output
  if (opts.output) {
    fs.writeFileSync(path.resolve(opts.output), json, "utf-8");
    console.error(`Written to ${opts.output} (${scene.widgets.length} widgets)`);
  } else {
    process.stdout.write(json + "\n");
    console.error(`Done — ${scene.widgets.length} widget(s) generated.`);
  }
}

main().catch((err) => {
  console.error("Error:", err.message || err);
  process.exit(1);
});
