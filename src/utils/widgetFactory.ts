import type { TextWidget, ImageWidget, GaugeWidget } from '../types/widget';

const baseDefaults = {
  layer: 1 as const,
  clickable: false,
  visible: true,
  opacity: 255,
  borderWidth: 0,
  borderColor: '#ffffff',
  borderRadius: 0,
  bgColor: '#000000',
  bgEnabled: false,
  padding: 0,
  rotation: 0,
  animations: [],
};

/**
 * Create a TextWidget. When position is provided, the widget is centered on that point.
 * Otherwise uses hardcoded default position.
 */
export function createTextWidget(position?: { x: number; y: number }): TextWidget {
  const w = 200;
  const h = 40;
  return {
    id: crypto.randomUUID(),
    type: 'text',
    ...baseDefaults,
    x: position ? position.x - w / 2 : 75,
    y: position ? position.y - h / 2 : 150,
    w,
    h,
    content: 'Hello',
    fontSize: 16,
    fontColor: '#ffffff',
    align: 'center',
    verticalAlign: 'middle',
    fontFamily: 'sans-serif',
    fontWeight: 'normal',
    letterSpacing: 0,
    lineSpacing: 0,
    textDecoration: 'none',
    longMode: 'wrap',
  };
}

/**
 * Create an ImageWidget. When position is provided, the widget is placed with pivot at that point.
 * Otherwise uses hardcoded default position.
 */
export function createImageWidget(position?: { x: number; y: number }): ImageWidget {
  return {
    id: crypto.randomUUID(),
    type: 'image',
    ...baseDefaults,
    x: position ? position.x : 125,
    y: position ? position.y : 125,
    w: 100,
    h: 100,
    assetId: '',
    imagePath: '',
    pivotX: 0.5,
    pivotY: 0.5,
    zoom: 256,
    antialias: true,
  };
}

/**
 * Create a GaugeWidget. When position is provided, the widget is centered on that point.
 * Otherwise uses hardcoded default position.
 */
export function createGaugeWidget(position?: { x: number; y: number }): GaugeWidget {
  const w = 120;
  const h = 120;
  return {
    id: crypto.randomUUID(),
    type: 'gauge',
    ...baseDefaults,
    x: position ? position.x - w / 2 : 115,
    y: position ? position.y - h / 2 : 115,
    w,
    h,
    minValue: 0,
    maxValue: 100,
    currentValue: 50,
    startAngle: -135,
    endAngle: 135,
    showArc: true,
    arcColor: '#00aaff',
    arcBgColor: '#333333',
    arcWidth: 12,
    arcRounded: false,
    showNeedle: true,
    needleColor: '#ff0000',
    needleWidth: 2,
    needleLength: 85,
    showNeedleDot: true,
    needleDotRadius: 4,
    showTicks: false,
    tickCount: 11,
    tickLength: 8,
    tickWidth: 1,
    tickColor: '#ffffff',
    showLabels: false,
    labelCount: 5,
    labelFontSize: 10,
    labelColor: '#ffffff',
    labelOffset: 15,
  };
}
