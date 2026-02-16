import { useEffect, useRef } from 'react';
import { Transformer } from 'react-konva';
import type Konva from 'konva';
import { SCREEN_WIDTH, SCREEN_HEIGHT, isRectInsideDShape } from '../../constants/display';

interface Props {
  selectedNode: Konva.Node | null;
  onTransformEnd: (x: number, y: number, w: number, h: number) => void;
}

export function SelectionBox({ selectedNode, onTransformEnd }: Props) {
  const trRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    if (trRef.current && selectedNode) {
      trRef.current.nodes([selectedNode]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [selectedNode]);

  if (!selectedNode) return null;

  return (
    <Transformer
      ref={trRef}
      rotateEnabled={false}
      keepRatio={false}
      boundBoxFunc={(oldBox, newBox) => {
        const box = { ...newBox };
        if (box.width < 10) box.width = 10;
        if (box.height < 10) box.height = 10;
        // Clamp to overall bounding rect first
        if (box.x < 0) box.x = 0;
        if (box.y < 0) box.y = 0;
        if (box.x + box.width > SCREEN_WIDTH) box.width = SCREEN_WIDTH - box.x;
        if (box.y + box.height > SCREEN_HEIGHT) box.height = SCREEN_HEIGHT - box.y;
        // If the new box is outside the D-shape, revert
        if (!isRectInsideDShape(box.x, box.y, box.width, box.height)) {
          return oldBox;
        }
        return box;
      }}
      onTransformEnd={() => {
        if (!selectedNode) return;
        const node = selectedNode;
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();
        node.scaleX(1);
        node.scaleY(1);
        onTransformEnd(
          Math.round(node.x()),
          Math.round(node.y()),
          Math.round(Math.max(10, node.width() * scaleX)),
          Math.round(Math.max(10, node.height() * scaleY))
        );
      }}
    />
  );
}
