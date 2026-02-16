import { Group, Rect, Text } from 'react-konva';
import type { TextWidget as TextWidgetType } from '../../types/widget';

interface Props {
  widget: TextWidgetType;
  isSelected: boolean;
  onSelect: () => void;
  onDragEnd: (x: number, y: number) => void;
}

export function TextWidgetNode({ widget, isSelected, onSelect, onDragEnd }: Props) {
  const fontStyle = [
    widget.fontWeight === 'bold' ? 'bold' : '',
  ].filter(Boolean).join(' ') || 'normal';

  const decoration = widget.textDecoration === 'underline' ? 'underline'
    : widget.textDecoration === 'strikethrough' ? 'line-through'
    : '';

  return (
    <Group
      id={widget.id}
      x={widget.x}
      y={widget.y}
      width={widget.w}
      height={widget.h}
      opacity={widget.opacity / 255}
      rotation={widget.rotation}
      draggable
      visible={widget.visible}
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={(e) => {
        onDragEnd(Math.round(e.target.x()), Math.round(e.target.y()));
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
