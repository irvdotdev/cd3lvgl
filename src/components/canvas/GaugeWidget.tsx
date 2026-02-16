import { Group, Arc, Line, Circle, Text } from 'react-konva';
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
  const outerRadius = Math.min(cx, cy) - 4;
  const innerRadius = Math.max(0, outerRadius - widget.arcWidth);

  const range = widget.maxValue - widget.minValue;
  const ratio = range > 0 ? (widget.currentValue - widget.minValue) / range : 0;
  const angleRange = widget.endAngle - widget.startAngle;
  const needleAngle = widget.startAngle + ratio * angleRange;
  const needleRad = (needleAngle * Math.PI) / 180;

  const needleLen = outerRadius * (widget.needleLength / 100);
  const needleEndX = cx + Math.cos(needleRad) * needleLen;
  const needleEndY = cy + Math.sin(needleRad) * needleLen;

  // Ticks & labels
  const ticks: { x1: number; y1: number; x2: number; y2: number; angle: number; value: number }[] = [];
  if (widget.showTicks || widget.showLabels) {
    const count = widget.showTicks ? widget.tickCount : widget.labelCount;
    for (let i = 0; i < count; i++) {
      const t = count > 1 ? i / (count - 1) : 0;
      const angleDeg = widget.startAngle + t * angleRange;
      const angleR = (angleDeg * Math.PI) / 180;
      const value = widget.minValue + t * range;
      ticks.push({
        x1: cx + Math.cos(angleR) * (outerRadius + 2),
        y1: cy + Math.sin(angleR) * (outerRadius + 2),
        x2: cx + Math.cos(angleR) * (outerRadius + 2 + widget.tickLength),
        y2: cy + Math.sin(angleR) * (outerRadius + 2 + widget.tickLength),
        angle: angleDeg,
        value,
      });
    }
  }

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
      {/* Background arc */}
      {widget.showArc && (
        <Arc
          x={cx}
          y={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          angle={angleRange}
          rotation={widget.startAngle}
          fill={widget.arcBgColor}
          stroke={isSelected ? '#4A90D9' : undefined}
          strokeWidth={isSelected ? 1 : 0}
        />
      )}
      {/* Value arc */}
      {widget.showArc && (
        <Arc
          x={cx}
          y={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          angle={ratio * angleRange}
          rotation={widget.startAngle}
          fill={widget.arcColor}
        />
      )}
      {/* Ticks */}
      {widget.showTicks && ticks.map((tick, i) => (
        <Line
          key={`tick-${i}`}
          points={[tick.x1, tick.y1, tick.x2, tick.y2]}
          stroke={widget.tickColor}
          strokeWidth={widget.tickWidth}
        />
      ))}
      {/* Labels */}
      {widget.showLabels && ticks.map((tick, i) => {
        // Only show labels at evenly distributed positions
        const labelStep = widget.labelCount > 1
          ? Math.max(1, Math.floor((widget.showTicks ? widget.tickCount : widget.labelCount) / (widget.labelCount - 1)))
          : ticks.length;
        if (i % labelStep !== 0 && i !== ticks.length - 1) return null;
        const angleR = (tick.angle * Math.PI) / 180;
        const lx = cx + Math.cos(angleR) * (outerRadius + widget.labelOffset + widget.tickLength);
        const ly = cy + Math.sin(angleR) * (outerRadius + widget.labelOffset + widget.tickLength);
        return (
          <Text
            key={`label-${i}`}
            x={lx - 15}
            y={ly - widget.labelFontSize / 2}
            width={30}
            height={widget.labelFontSize}
            text={String(Math.round(tick.value))}
            fontSize={widget.labelFontSize}
            fill={widget.labelColor}
            align="center"
            verticalAlign="middle"
          />
        );
      })}
      {/* Needle */}
      {widget.showNeedle && (
        <Line
          points={[cx, cy, needleEndX, needleEndY]}
          stroke={widget.needleColor}
          strokeWidth={widget.needleWidth}
        />
      )}
      {/* Center dot */}
      {widget.showNeedle && widget.showNeedleDot && (
        <Circle
          x={cx}
          y={cy}
          radius={widget.needleDotRadius}
          fill={widget.needleColor}
        />
      )}
    </Group>
  );
}
