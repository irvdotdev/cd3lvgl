import { useEffect, useRef } from 'react';
import { Transformer } from 'react-konva';
import type Konva from 'konva';
interface Props {
  selectedNode: Konva.Node | null;
  onTransformEnd: (x: number, y: number, w: number, h: number, rotation: number) => void;
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
      rotateEnabled={true}
      keepRatio={false}
      boundBoxFunc={(_oldBox, newBox) => {
        const box = { ...newBox };
        if (box.width < 10) box.width = 10;
        if (box.height < 10) box.height = 10;
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
          Math.round(Math.max(10, node.height() * scaleY)),
          Math.round(node.rotation())
        );
      }}
    />
  );
}
