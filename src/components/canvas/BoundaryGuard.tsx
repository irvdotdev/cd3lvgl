import { Rect } from 'react-konva';
import type { Widget } from '../../types/widget';
import { isRectInsideDShape } from '../../constants/display';

interface Props {
  widget: Widget;
}

export function BoundaryGuard({ widget }: Props) {
  const outOfBounds = !isRectInsideDShape(widget.x, widget.y, widget.w, widget.h);

  if (!outOfBounds) return null;

  return (
    <Rect
      x={widget.x}
      y={widget.y}
      width={widget.w}
      height={widget.h}
      stroke="#ff4444"
      strokeWidth={2}
      dash={[4, 4]}
      listening={false}
    />
  );
}
