import { Group, Arc, Line, Circle } from 'react-konva';
import type { GaugeWidget as GaugeWidgetType } from '../../types/widget';

interface Props {
  widget: GaugeWidgetType;
  isSelected: boolean;
  onSelect: () => void;
  onDragEnd: (x: number, y: number) => void;
}

export function GaugeWidgetNode({ widget, isSelected, onSelect, onDragEnd }: Props) {
  const cx = widget.w / 2;
  const cy = widget.h / 2;
  const radius = Math.min(cx, cy) - 4;
  const innerRadius = radius * 0.7;

  const range = widget.maxValue - widget.minValue;
  const ratio = range > 0 ? (widget.currentValue - widget.minValue) / range : 0;
  const angleRange = widget.endAngle - widget.startAngle;
  const needleAngle = widget.startAngle + ratio * angleRange;
  const needleRad = (needleAngle * Math.PI) / 180;

  const needleLength = radius * 0.85;
  const needleEndX = cx + Math.cos(needleRad) * needleLength;
  const needleEndY = cy + Math.sin(needleRad) * needleLength;

  return (
    <Group
      id={widget.id}
      x={widget.x}
      y={widget.y}
      width={widget.w}
      height={widget.h}
      draggable
      visible={widget.visible}
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={(e) => {
        onDragEnd(Math.round(e.target.x()), Math.round(e.target.y()));
      }}
    >
      {/* Background arc */}
      <Arc
        x={cx}
        y={cy}
        innerRadius={innerRadius}
        outerRadius={radius}
        angle={angleRange}
        rotation={widget.startAngle}
        fill={widget.arcBgColor}
        stroke={isSelected ? '#4A90D9' : undefined}
        strokeWidth={isSelected ? 1 : 0}
      />
      {/* Value arc */}
      <Arc
        x={cx}
        y={cy}
        innerRadius={innerRadius}
        outerRadius={radius}
        angle={ratio * angleRange}
        rotation={widget.startAngle}
        fill={widget.arcColor}
      />
      {/* Needle */}
      <Line
        points={[cx, cy, needleEndX, needleEndY]}
        stroke={widget.needleColor}
        strokeWidth={2}
      />
      {/* Center dot */}
      <Circle
        x={cx}
        y={cy}
        radius={4}
        fill={widget.needleColor}
      />
    </Group>
  );
}
