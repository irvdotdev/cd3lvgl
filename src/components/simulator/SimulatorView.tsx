import { useEffect, useRef } from 'react';
import { SCREEN_WIDTH, SCREEN_HEIGHT } from '../../constants/display';
import { useSceneStore } from '../../store/sceneStore';
import { useAssetStore } from '../../store/assetStore';
import { renderSceneToRgb565 } from './Rgb565Renderer';
import type { Widget } from '../../types/widget';

function drawWidgets(
  ctx: CanvasRenderingContext2D,
  widgets: Widget[],
  imageCache: Map<string, HTMLImageElement>
) {
  for (const widget of widgets) {
    if (!widget.visible) continue;

    if (widget.type === 'text') {
      ctx.fillStyle = widget.fontColor;
      ctx.font = `${widget.fontSize}px sans-serif`;
      ctx.textAlign = widget.align as CanvasTextAlign;
      ctx.textBaseline = 'middle';
      const textX = widget.align === 'center'
        ? widget.x + widget.w / 2
        : widget.align === 'right'
          ? widget.x + widget.w
          : widget.x;
      ctx.fillText(widget.content || 'Text', textX, widget.y + widget.h / 2, widget.w);
    }

    if (widget.type === 'image') {
      const img = imageCache.get(widget.assetId);
      if (img) {
        ctx.drawImage(img, widget.x, widget.y, widget.w, widget.h);
      } else {
        ctx.fillStyle = '#333333';
        ctx.fillRect(widget.x, widget.y, widget.w, widget.h);
        ctx.strokeStyle = '#666666';
        ctx.strokeRect(widget.x, widget.y, widget.w, widget.h);
      }
    }

    if (widget.type === 'gauge') {
      const cx = widget.x + widget.w / 2;
      const cy = widget.y + widget.h / 2;
      const radius = Math.min(widget.w, widget.h) / 2 - 4;
      const innerRadius = radius * 0.7;
      const range = widget.maxValue - widget.minValue;
      const ratio = range > 0 ? (widget.currentValue - widget.minValue) / range : 0;
      const startRad = (widget.startAngle * Math.PI) / 180;
      const endRad = (widget.endAngle * Math.PI) / 180;
      const valueRad = startRad + ratio * (endRad - startRad);

      // Background arc
      ctx.beginPath();
      ctx.arc(cx, cy, radius, startRad, endRad);
      ctx.arc(cx, cy, innerRadius, endRad, startRad, true);
      ctx.closePath();
      ctx.fillStyle = widget.arcBgColor;
      ctx.fill();

      // Value arc
      ctx.beginPath();
      ctx.arc(cx, cy, radius, startRad, valueRad);
      ctx.arc(cx, cy, innerRadius, valueRad, startRad, true);
      ctx.closePath();
      ctx.fillStyle = widget.arcColor;
      ctx.fill();

      // Needle
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(valueRad) * radius * 0.85, cy + Math.sin(valueRad) * radius * 0.85);
      ctx.strokeStyle = widget.needleColor;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Center dot
      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.fillStyle = widget.needleColor;
      ctx.fill();
    }
  }
}

export function SimulatorView() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const widgets = useSceneStore(s => s.widgets);
  const backgroundColor = useSceneStore(s => s.backgroundColor);
  const assets = useAssetStore(s => s.assets);

  useEffect(() => {
    const targetCanvas = canvasRef.current;
    if (!targetCanvas) return;

    // Pre-load all image assets
    const imageWidgets = widgets.filter(w => w.type === 'image' && w.visible);
    const imagesToLoad: Promise<[string, HTMLImageElement]>[] = [];

    for (const w of imageWidgets) {
      if (w.type !== 'image') continue;
      const asset = assets.find(a => a.id === w.assetId);
      if (!asset?.originalDataUrl) continue;

      imagesToLoad.push(
        new Promise<[string, HTMLImageElement]>((resolve) => {
          const img = new Image();
          img.onload = () => resolve([w.assetId, img]);
          img.onerror = () => resolve([w.assetId, img]); // still resolve to not block
          img.src = asset.originalDataUrl;
        })
      );
    }

    Promise.all(imagesToLoad).then(entries => {
      const imageCache = new Map(entries);

      // Create offscreen canvas to render scene
      const offscreen = document.createElement('canvas');
      offscreen.width = SCREEN_WIDTH;
      offscreen.height = SCREEN_HEIGHT;
      const ctx = offscreen.getContext('2d')!;

      // Draw background
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

      // Draw all widgets
      drawWidgets(ctx, widgets, imageCache);

      renderSceneToRgb565(offscreen, targetCanvas, backgroundColor);
    });
  }, [widgets, backgroundColor, assets]);

  return (
    <div className="flex flex-col items-center gap-2">
      <h3 className="text-sm font-semibold text-gray-300">Simulator (RGB565)</h3>
      <canvas
        ref={canvasRef}
        width={SCREEN_WIDTH}
        height={SCREEN_HEIGHT}
        className="border-2 border-gray-600 rounded"
        style={{ imageRendering: 'pixelated' }}
      />
      <p className="text-xs text-gray-500">{SCREEN_WIDTH}x{SCREEN_HEIGHT} - RGB565 quantized</p>
    </div>
  );
}
