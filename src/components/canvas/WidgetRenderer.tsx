import type { Widget } from '../../types/widget';
import { TextWidgetNode } from './TextWidget';
import { ImageWidgetNode } from './ImageWidget';
import { GaugeWidgetNode } from './GaugeWidget';

interface Props {
  widget: Widget;
  isSelected: boolean;
  onSelect: () => void;
  onDragEnd: (x: number, y: number) => void;
  draggable?: boolean;
}

export function WidgetRenderer({ widget, isSelected, onSelect, onDragEnd, draggable }: Props) {
  switch (widget.type) {
    case 'text':
      return <TextWidgetNode widget={widget} isSelected={isSelected} onSelect={onSelect} onDragEnd={onDragEnd} draggable={draggable} />;
    case 'image':
      return <ImageWidgetNode widget={widget} isSelected={isSelected} onSelect={onSelect} onDragEnd={onDragEnd} draggable={draggable} />;
    case 'gauge':
      return <GaugeWidgetNode widget={widget} isSelected={isSelected} onSelect={onSelect} onDragEnd={onDragEnd} draggable={draggable} />;
  }
}
