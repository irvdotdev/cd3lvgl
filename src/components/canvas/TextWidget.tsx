import { Text } from 'react-konva';
import type { TextWidget as TextWidgetType } from '../../types/widget';

interface Props {
  widget: TextWidgetType;
  isSelected: boolean;
  onSelect: () => void;
  onDragEnd: (x: number, y: number) => void;
}

export function TextWidgetNode({ widget, isSelected, onSelect, onDragEnd }: Props) {
  return (
    <Text
      id={widget.id}
      x={widget.x}
      y={widget.y}
      width={widget.w}
      height={widget.h}
      text={widget.content || 'Text'}
      fontSize={widget.fontSize}
      fill={widget.fontColor}
      align={widget.align}
      verticalAlign="middle"
      draggable
      visible={widget.visible}
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={(e) => {
        onDragEnd(Math.round(e.target.x()), Math.round(e.target.y()));
      }}
      stroke={isSelected ? '#4A90D9' : undefined}
      strokeWidth={isSelected ? 1 : 0}
    />
  );
}
