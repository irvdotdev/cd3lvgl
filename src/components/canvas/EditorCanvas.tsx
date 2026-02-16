import { useRef, useCallback, useState } from 'react';
import { Stage, Layer, Rect, Circle } from 'react-konva';
import type Konva from 'konva';
import { useSceneStore } from '../../store/sceneStore';
import {
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  SCREEN_RADIUS,
  SCREEN_CENTER_X,
  SCREEN_CENTER_Y,
  clampWidgetToCircle,
  isWidgetInsideDisplay,
} from '../../constants/display';
import { WidgetRenderer } from './WidgetRenderer';
import { GridOverlay } from './GridOverlay';
import { BoundaryGuard } from './BoundaryGuard';
import { SelectionBox } from './SelectionBox';

/** Konva clipFunc that traces a circle */
function circleClip(ctx: Konva.Context) {
  ctx.beginPath();
  ctx.arc(SCREEN_CENTER_X, SCREEN_CENTER_Y, SCREEN_RADIUS, 0, Math.PI * 2);
  ctx.closePath();
}

export function EditorCanvas() {
  const widgets = useSceneStore(s => s.widgets);
  const selectedWidgetId = useSceneStore(s => s.selectedWidgetId);
  const backgroundColor = useSceneStore(s => s.backgroundColor);
  const showGrid = useSceneStore(s => s.showGrid);
  const snapBack = useSceneStore(s => s.snapBack);
  const zoom = useSceneStore(s => s.zoom);
  const selectWidget = useSceneStore(s => s.selectWidget);
  const updateWidget = useSceneStore(s => s.updateWidget);

  const stageRef = useRef<Konva.Stage>(null);
  const [selectedNode, setSelectedNode] = useState<Konva.Node | null>(null);

  const handleStageClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.target === e.target.getStage() || e.target.attrs?.id === 'bg-rect') {
      selectWidget(null);
      setSelectedNode(null);
    }
  }, [selectWidget]);

  const handleWidgetSelect = useCallback((widgetId: string, node: Konva.Node) => {
    selectWidget(widgetId);
    setSelectedNode(node);
  }, [selectWidget]);

  const handleDragEnd = useCallback((widgetId: string, x: number, y: number) => {
    if (snapBack) {
      const widget = widgets.find(w => w.id === widgetId);
      if (widget) {
        const testWidget = { ...widget, x, y };
        if (!isWidgetInsideDisplay(testWidget)) {
          const clamped = clampWidgetToCircle(testWidget);
          updateWidget(widgetId, { x: clamped.x, y: clamped.y });
          return;
        }
      }
    }
    updateWidget(widgetId, { x, y });
  }, [updateWidget, snapBack, widgets]);

  const handleTransformEnd = useCallback((x: number, y: number, w: number, h: number, rotation: number) => {
    if (selectedWidgetId) {
      if (snapBack) {
        const widget = widgets.find(w => w.id === selectedWidgetId);
        if (widget) {
          const testWidget = { ...widget, x, y, w, h, rotation };
          if (!isWidgetInsideDisplay(testWidget)) {
            const clamped = clampWidgetToCircle(testWidget);
            updateWidget(selectedWidgetId, { x: clamped.x, y: clamped.y, w, h, rotation });
            return;
          }
        }
      }
      updateWidget(selectedWidgetId, { x, y, w, h, rotation });
    }
  }, [selectedWidgetId, updateWidget, snapBack, widgets]);

  const layer0Widgets = widgets.filter(w => w.layer === 0);
  const layer1Widgets = widgets.filter(w => w.layer === 1);

  return (
    <div className="flex items-center justify-center flex-1 bg-gray-900 overflow-auto p-8">
      <div
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: 'center center',
        }}
      >
        <Stage
          ref={stageRef}
          width={SCREEN_WIDTH}
          height={SCREEN_HEIGHT}
          onClick={handleStageClick}
        >
          {/* Background Layer — clipped to circle */}
          <Layer clipFunc={circleClip}>
            <Rect
              id="bg-rect"
              x={0}
              y={0}
              width={SCREEN_WIDTH}
              height={SCREEN_HEIGHT}
              fill={backgroundColor}
            />
            {showGrid && <GridOverlay />}
          </Layer>

          {/* Layer 0 - Background widgets — clipped to circle */}
          <Layer clipFunc={circleClip}>
            {layer0Widgets.map(widget => (
              <WidgetRenderer
                key={widget.id}
                widget={widget}
                isSelected={selectedWidgetId === widget.id}
                onSelect={() => {
                  const node = stageRef.current?.findOne(`#${CSS.escape(widget.id)}`);
                  if (node) handleWidgetSelect(widget.id, node);
                  else selectWidget(widget.id);
                }}
                onDragEnd={(x, y) => handleDragEnd(widget.id, x, y)}
              />
            ))}
          </Layer>

          {/* Layer 1 - Foreground widgets — clipped to circle */}
          <Layer clipFunc={circleClip}>
            {layer1Widgets.map(widget => (
              <WidgetRenderer
                key={widget.id}
                widget={widget}
                isSelected={selectedWidgetId === widget.id}
                onSelect={() => {
                  const node = stageRef.current?.findOne(`#${CSS.escape(widget.id)}`);
                  if (node) handleWidgetSelect(widget.id, node);
                  else selectWidget(widget.id);
                }}
                onDragEnd={(x, y) => handleDragEnd(widget.id, x, y)}
              />
            ))}
          </Layer>

          {/* Overlay layer for boundary warnings, selection, and circle outline */}
          <Layer>
            {widgets.map(w => (
              <BoundaryGuard key={`bound-${w.id}`} widget={w} />
            ))}
            <SelectionBox
              selectedNode={selectedNode}
              onTransformEnd={handleTransformEnd}
            />
            {/* Circle outline */}
            <Circle
              x={SCREEN_CENTER_X}
              y={SCREEN_CENTER_Y}
              radius={SCREEN_RADIUS}
              stroke="#555"
              strokeWidth={2}
              listening={false}
            />
          </Layer>
        </Stage>
      </div>
    </div>
  );
}
