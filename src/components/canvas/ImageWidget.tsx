import { useEffect, useState } from 'react';
import { Image, Rect } from 'react-konva';
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
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Synchronizing image state with external asset data URL
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

  if (!image) {
    return (
      <Rect
        id={widget.id}
        x={widget.x}
        y={widget.y}
        width={widget.w}
        height={widget.h}
        fill="#333"
        stroke={isSelected ? '#4A90D9' : '#666'}
        strokeWidth={isSelected ? 2 : 1}
        draggable
        visible={widget.visible}
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={(e) => {
          onDragEnd(Math.round(e.target.x()), Math.round(e.target.y()));
        }}
      />
    );
  }

  return (
    <Image
      id={widget.id}
      x={widget.x}
      y={widget.y}
      width={widget.w}
      height={widget.h}
      image={image}
      draggable
      visible={widget.visible}
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={(e) => {
        onDragEnd(Math.round(e.target.x()), Math.round(e.target.y()));
      }}
      stroke={isSelected ? '#4A90D9' : undefined}
      strokeWidth={isSelected ? 2 : 0}
    />
  );
}
