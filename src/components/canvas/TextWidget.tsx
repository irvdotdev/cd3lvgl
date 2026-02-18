import { Group, Rect, Text } from 'react-konva';
import type { TextWidget as TextWidgetType } from '../../types/widget';

interface Props {
  widget: TextWidgetType;
  isSelected: boolean;
  onSelect: () => void;
  onDragEnd: (x: number, y: number) => void;
  draggable?: boolean;
}

export function TextWidgetNode({ widget, isSelected, onSelect, onDragEnd, draggable }: Props) {
  const fontStyle = [
    widget.fontWeight === 'bold' ? 'bold' : '',
  ].filter(Boolean).join(' ') || 'normal';

  const decoration = widget.textDecoration === 'underline' ? 'underline'
    : widget.textDecoration === 'strikethrough' ? 'line-through'
    : '';

  return (
    <Group
      id={widget.id}
      x={widget.x + widget.w / 2}
      y={widget.y + widget.h / 2}
      offsetX={widget.w / 2}
      offsetY={widget.h / 2}
      width={widget.w}
      height={widget.h}
      opacity={widget.opacity / 255}
      rotation={widget.rotation}
      draggable={draggable !== false}
      visible={widget.visible}
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={(e) => {
        onDragEnd(
          Math.round(e.target.x() - widget.w / 2),
          Math.round(e.target.y() - widget.h / 2)
        );
      }}
    >
      {widget.bgEnabled && (
        <Rect
          width={widget.w}
          height={widget.h}
          fill={widget.bgColor}
          cornerRadius={widget.borderRadius}
        />
      )}
      {widget.borderWidth > 0 && (
        <Rect
          width={widget.w}
          height={widget.h}
          stroke={widget.borderColor}
          strokeWidth={widget.borderWidth}
          cornerRadius={widget.borderRadius}
        />
      )}
      <Text
        x={widget.padding}
        y={widget.padding}
        width={widget.w - widget.padding * 2}
        height={widget.h - widget.padding * 2}
        text={widget.content || 'Text'}
        fontSize={widget.fontSize}
        fontFamily={widget.fontFamily}
        fontStyle={fontStyle}
        textDecoration={decoration}
        letterSpacing={widget.letterSpacing}
        lineHeight={widget.lineSpacing > 0 ? 1 + widget.lineSpacing / widget.fontSize : 1.2}
        fill={widget.fontColor}
        align={widget.align}
        verticalAlign={widget.verticalAlign}
        wrap={widget.longMode === 'wrap' ? 'word' : 'none'}
        ellipsis={widget.longMode === 'dot'}
        stroke={isSelected ? '#4A90D9' : undefined}
        strokeWidth={isSelected ? 0.5 : 0}
      />
    </Group>
  );
}
