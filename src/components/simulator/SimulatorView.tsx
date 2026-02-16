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
    ctx.save();
    ctx.globalAlpha = widget.opacity / 255;

    // Apply rotation around widget center
    if (widget.rotation) {
      const centerX = widget.x + widget.w / 2;
      const centerY = widget.y + widget.h / 2;
      ctx.translate(centerX, centerY);
      ctx.rotate(widget.rotation * Math.PI / 180);
      ctx.translate(-centerX, -centerY);
    }

    if (widget.type === 'text') {
      const weight = widget.fontWeight === 'bold' ? 'bold ' : '';
      ctx.fillStyle = widget.fontColor;
      ctx.font = `${weight}${widget.fontSize}px ${widget.fontFamily}`;
      ctx.textAlign = widget.align as CanvasTextAlign;
      ctx.textBaseline = widget.verticalAlign === 'top' ? 'top'
        : widget.verticalAlign === 'bottom' ? 'bottom' : 'middle';
      const textX = widget.align === 'center'
        ? widget.x + widget.w / 2
        : widget.align === 'right'
          ? widget.x + widget.w
          : widget.x;
      const textY = widget.verticalAlign === 'top'
        ? widget.y
        : widget.verticalAlign === 'bottom'
          ? widget.y + widget.h
          : widget.y + widget.h / 2;
      ctx.fillText(widget.content || 'Text', textX, textY, widget.w);
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
      const outerRadius = Math.min(widget.w, widget.h) / 2 - 4;
      const innerRadius = Math.max(0, outerRadius - widget.arcWidth);
      const range = widget.maxValue - widget.minValue;
      const ratio = range > 0 ? (widget.currentValue - widget.minValue) / range : 0;
      const startRad = (widget.startAngle * Math.PI) / 180;
      const endRad = (widget.endAngle * Math.PI) / 180;
      const valueRad = startRad + ratio * (endRad - startRad);

      if (widget.showArc) {
        // Background arc
        ctx.beginPath();
        ctx.arc(cx, cy, outerRadius, startRad, endRad);
        ctx.arc(cx, cy, innerRadius, endRad, startRad, true);
        ctx.closePath();
        ctx.fillStyle = widget.arcBgColor;
        ctx.fill();

        // Value arc
        ctx.beginPath();
        ctx.arc(cx, cy, outerRadius, startRad, valueRad);
        ctx.arc(cx, cy, innerRadius, valueRad, startRad, true);
        ctx.closePath();
        ctx.fillStyle = widget.arcColor;
        ctx.fill();
      }

      // Ticks
      if (widget.showTicks) {
        const angleRange = widget.endAngle - widget.startAngle;
        for (let i = 0; i < widget.tickCount; i++) {
          const t = widget.tickCount > 1 ? i / (widget.tickCount - 1) : 0;
          const a = (widget.startAngle + t * angleRange) * Math.PI / 180;
          ctx.beginPath();
          ctx.moveTo(cx + Math.cos(a) * (outerRadius + 2), cy + Math.sin(a) * (outerRadius + 2));
          ctx.lineTo(cx + Math.cos(a) * (outerRadius + 2 + widget.tickLength), cy + Math.sin(a) * (outerRadius + 2 + widget.tickLength));
          ctx.strokeStyle = widget.tickColor;
          ctx.lineWidth = widget.tickWidth;
          ctx.stroke();
        }
      }

      if (widget.showNeedle) {
        const needleLen = outerRadius * (widget.needleLength / 100);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(valueRad) * needleLen, cy + Math.sin(valueRad) * needleLen);
        ctx.strokeStyle = widget.needleColor;
        ctx.lineWidth = widget.needleWidth;
        ctx.stroke();

        if (widget.showNeedleDot) {
          ctx.beginPath();
          ctx.arc(cx, cy, widget.needleDotRadius, 0, Math.PI * 2);
          ctx.fillStyle = widget.needleColor;
          ctx.fill();
        }
      }
    }

    ctx.restore();
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
          img.onerror = () => resolve([w.assetId, img]);
          img.src = asset.originalDataUrl;
        })
      );
    }

    Promise.all(imagesToLoad).then(entries => {
      const imageCache = new Map(entries);

      const offscreen = document.createElement('canvas');
      offscreen.width = SCREEN_WIDTH;
      offscreen.height = SCREEN_HEIGHT;
      const ctx = offscreen.getContext('2d')!;

      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
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
        className="border-2 border-gray-600 rounded-full"
        style={{ imageRendering: 'pixelated' }}
      />
      <p className="text-xs text-gray-500">{SCREEN_WIDTH}x{SCREEN_HEIGHT} - RGB565 quantized</p>
    </div>
  );
}
