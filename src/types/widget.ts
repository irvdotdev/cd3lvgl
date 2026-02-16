export type WidgetType = 'text' | 'image' | 'gauge';

export interface BaseWidget {
  id: string;
  type: WidgetType;
  layer: 0 | 1;
  x: number;
  y: number;
  w: number;
  h: number;
  clickable: boolean;
  visible: boolean;
  opacity: number;            // 0–255 (LVGL opa)
  borderWidth: number;
  borderColor: string;
  borderRadius: number;
  bgColor: string;            // widget background (empty = transparent)
  bgEnabled: boolean;
  padding: number;
  rotation: number;           // degrees
}

export interface TextWidget extends BaseWidget {
  type: 'text';
  content: string;
  fontSize: number;
  fontColor: string;
  align: 'left' | 'center' | 'right';
  verticalAlign: 'top' | 'middle' | 'bottom';
  fontFamily: string;
  fontWeight: 'normal' | 'bold';
  letterSpacing: number;
  lineSpacing: number;
  textDecoration: 'none' | 'underline' | 'strikethrough';
  longMode: 'wrap' | 'scroll' | 'dot' | 'clip';
}

export interface ImageWidget extends BaseWidget {
  type: 'image';
  assetId: string;
  imagePath: string;
  pivotX: number;            // 0–1 relative
  pivotY: number;            // 0–1 relative
  zoom: number;              // 256 = 100% (LVGL img zoom)
  antialias: boolean;
}

export interface GaugeWidget extends BaseWidget {
  type: 'gauge';
  // Value
  minValue: number;
  maxValue: number;
  currentValue: number;
  // Angles
  startAngle: number;
  endAngle: number;
  // Arc
  showArc: boolean;
  arcColor: string;
  arcBgColor: string;
  arcWidth: number;
  arcRounded: boolean;
  // Needle
  showNeedle: boolean;
  needleColor: string;
  needleWidth: number;
  needleLength: number;       // 0–100 (% of radius)
  showNeedleDot: boolean;
  needleDotRadius: number;
  // Ticks
  showTicks: boolean;
  tickCount: number;
  tickLength: number;
  tickWidth: number;
  tickColor: string;
  // Labels
  showLabels: boolean;
  labelCount: number;
  labelFontSize: number;
  labelColor: string;
  labelOffset: number;
}

export type Widget = TextWidget | ImageWidget | GaugeWidget;

export interface Scene {
  name: string;
  screenWidth: number;
  screenHeight: number;
  backgroundColor: string;
  widgets: Widget[];
}

export interface HistoryEntry {
  widgets: Widget[];
  backgroundColor: string;
}
