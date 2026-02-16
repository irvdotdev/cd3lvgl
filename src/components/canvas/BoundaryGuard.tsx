import { Line } from 'react-konva';
import type { Widget } from '../../types/widget';
import { getWidgetCorners, widgetDistanceToEdge } from '../../constants/display';

interface Props {
  widget: Widget;
}

export function BoundaryGuard({ widget }: Props) {
  const margin = widgetDistanceToEdge(widget);

  // Inside and not near edge — nothing to show
  if (margin > 15) return null;

  const corners = getWidgetCorners(widget);
  const points = corners.flatMap(c => [c.x, c.y]);

  // Red when outside, yellow when near edge
  const stroke = margin < 0 ? '#ff4444' : '#ffaa00';

  return (
    <Line
      points={points}
      closed
      stroke={stroke}
      strokeWidth={2}
      dash={[4, 4]}
      listening={false}
    />
  );
}
