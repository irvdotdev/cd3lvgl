import { useEffect, useState } from 'react';
import { Group, Image, Rect } from 'react-konva';
import type { ImageWidget as ImageWidgetType } from '../../types/widget';
import { useAssetStore } from '../../store/assetStore';

interface Props {
  widget: ImageWidgetType;
  isSelected: boolean;
  onSelect: () => void;
  onDragEnd: (x: number, y: number) => void;
}

export function ImageWidgetNode({ widget, isSelected, onSelect, onDragEnd }: Props) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const asset = useAssetStore(s => s.assets.find(a => a.id === widget.assetId));
  const dataUrl = asset?.originalDataUrl;

  useEffect(() => {
    if (!dataUrl) {
      setImage(null);
      return;
    }
    let cancelled = false;
    const img = new window.Image();
    img.onload = () => {
      if (!cancelled) setImage(img);
    };
    img.src = dataUrl;
    return () => { cancelled = true; };
  }, [dataUrl]);

  const zoomScale = widget.zoom / 256;

  return (
    <Group
      id={widget.id}
      x={widget.x}
      y={widget.y}
      width={widget.w}
      height={widget.h}
      opacity={widget.opacity / 255}
      rotation={widget.rotation}
      offsetX={widget.w * widget.pivotX}
      offsetY={widget.h * widget.pivotY}
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
      {!image ? (
        <Rect
          width={widget.w}
          height={widget.h}
          fill="#333"
          stroke={isSelected ? '#4A90D9' : '#666'}
          strokeWidth={isSelected ? 2 : 1}
          cornerRadius={widget.borderRadius}
        />
      ) : (
        <Image
          width={widget.w * zoomScale}
          height={widget.h * zoomScale}
          offsetX={(widget.w * zoomScale - widget.w) / 2}
          offsetY={(widget.h * zoomScale - widget.h) / 2}
          image={image}
          stroke={isSelected ? '#4A90D9' : undefined}
          strokeWidth={isSelected ? 2 : 0}
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
    </Group>
  );
}
