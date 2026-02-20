# cd3lvgl Figma Plugin

Export Figma frames to the cd3lvgl editor's JSON scene format for a 350x350px circular LVGL display.

## Installation

1. Clone or download this repository
2. Install dependencies and build:
   ```bash
   cd figma-plugin
   npm install
   npm run build
   ```
3. In Figma, go to **Plugins > Development > Import plugin from manifest**
4. Select the `figma-plugin/manifest.json` file

## Usage

1. Create or open a Figma frame containing your UI design
2. Select exactly one frame (or component/group)
3. Run the plugin from **Plugins > Development > cd3lvgl Export**
4. Review the export preview (widget counts, scale factor, warnings)
5. Click **Download Scene JSON** to save the scene file
6. In the cd3lvgl editor, use **Import Scene** to load the JSON
7. If image placeholders were created, click **Export Images as PNG** and import them through the editor's asset pipeline

## Supported Elements

| Figma Node | Editor Widget | Notes |
|-----------|---------------|-------|
| TEXT | TextWidget | Content, fontSize, color, alignment, weight |
| RECTANGLE (solid fill) | TextWidget (bgEnabled) | Colored box with border, radius, opacity |
| RECTANGLE (image fill) | ImageWidget (placeholder) | Export PNG separately via plugin |
| FRAME (solid fill, leaf) | TextWidget (bgEnabled) | Same as rectangle |
| FRAME with children | Container + children | Frame emitted if it has fills, children recursed |
| ELLIPSE (solid fill) | TextWidget (high borderRadius) | Approximates circle |
| VECTOR / STAR / POLYGON / LINE | ImageWidget (placeholder) | Export PNG separately |
| GROUP | Recurse into children | No widget for the group itself |

## Coordinate Mapping

- Scale factor: `min(350 / frameWidth, 350 / frameHeight)`
- Centered with offset when aspect ratios differ
- Figma RGBA (0-1) converted to `#RRGGBB` hex
- Widget opacity mapped to LVGL 0-255 range
- Widgets smaller than 10x10px after scaling are skipped

## Limitations

- **Gauges** are not auto-detected (too many properties to infer reliably)
- **Image fills** create placeholder ImageWidgets with empty paths; export the PNGs separately
- **Gradient fills** are not supported; only the first solid fill is used
- **Effects** (shadows, blurs) are not exported
- **Auto-layout** constraints are flattened to absolute positions
- **Mixed font sizes** within a single text node use a default size
- **Text content** is limited to 255 bytes per the editor's constraints

## Build

```bash
npm install          # Install dependencies
npm run build        # Build plugin (dist/code.js + dist/ui.html)
npm run watch        # Watch mode for development
```

## Project Structure

```
figma-plugin/
  manifest.json      # Figma plugin manifest
  package.json       # Dependencies and scripts
  tsconfig.json      # TypeScript configuration
  src/
    code.ts          # Plugin sandbox code (node mapping, export logic)
    ui.html          # Plugin UI (inline CSS + JS)
  dist/              # Built output (gitignored)
    code.js
    ui.html
```
