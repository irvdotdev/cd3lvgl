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
}

export interface TextWidget extends BaseWidget {
  type: 'text';
  content: string;
  fontSize: number;
  fontColor: string;
  align: 'left' | 'center' | 'right';
}

export interface ImageWidget extends BaseWidget {
  type: 'image';
  assetId: string;
  imagePath: string;
}

export interface GaugeWidget extends BaseWidget {
  type: 'gauge';
  minValue: number;
  maxValue: number;
  currentValue: number;
  startAngle: number;
  endAngle: number;
  needleColor: string;
  arcColor: string;
  arcBgColor: string;
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
