import { Line, Group } from 'react-konva';
import { SCREEN_WIDTH, SCREEN_HEIGHT, GRID_SIZE } from '../../constants/display';

export function GridOverlay() {
  const lines = [];
  for (let x = 0; x <= SCREEN_WIDTH; x += GRID_SIZE) {
    lines.push(
      <Line
        key={`v-${x}`}
        points={[x, 0, x, SCREEN_HEIGHT]}
        stroke="rgba(255,255,255,0.1)"
        strokeWidth={0.5}
      />
    );
  }
  for (let y = 0; y <= SCREEN_HEIGHT; y += GRID_SIZE) {
    lines.push(
      <Line
        key={`h-${y}`}
        points={[0, y, SCREEN_WIDTH, y]}
        stroke="rgba(255,255,255,0.1)"
        strokeWidth={0.5}
      />
    );
  }
  return <Group listening={false}>{lines}</Group>;
}
