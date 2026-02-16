import { useRef, useCallback, useState } from 'react';
import { Stage, Layer, Rect, Shape } from 'react-konva';
import type Konva from 'konva';
import { useSceneStore } from '../../store/sceneStore';
import {
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  DOME_RADIUS,
  DOME_CENTER_X,
  DOME_CENTER_Y,
} from '../../constants/display';
import { WidgetRenderer } from './WidgetRenderer';
import { GridOverlay } from './GridOverlay';
import { BoundaryGuard } from './BoundaryGuard';
import { SelectionBox } from './SelectionBox';

/** Konva clipFunc that traces the D-shape (flat bottom, dome top) */
function dShapeClip(ctx: Konva.Context) {
  ctx.beginPath();
  ctx.moveTo(0, SCREEN_HEIGHT);
  ctx.lineTo(0, DOME_CENTER_Y);
  ctx.arc(DOME_CENTER_X, DOME_CENTER_Y, DOME_RADIUS, Math.PI, 0, false);
  ctx.lineTo(SCREEN_WIDTH, SCREEN_HEIGHT);
  ctx.closePath();
}

export function EditorCanvas() {
  const widgets = useSceneStore(s => s.widgets);
  const selectedWidgetId = useSceneStore(s => s.selectedWidgetId);
  const backgroundColor = useSceneStore(s => s.backgroundColor);
  const showGrid = useSceneStore(s => s.showGrid);
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
    updateWidget(widgetId, { x, y });
  }, [updateWidget]);

  const handleTransformEnd = useCallback((x: number, y: number, w: number, h: number) => {
    if (selectedWidgetId) {
      updateWidget(selectedWidgetId, { x, y, w, h });
    }
  }, [selectedWidgetId, updateWidget]);

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
          {/* Background Layer — clipped to D-shape */}
          <Layer clipFunc={dShapeClip}>
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

          {/* Layer 0 - Background widgets — clipped to D-shape */}
          <Layer clipFunc={dShapeClip}>
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

          {/* Layer 1 - Foreground widgets — clipped to D-shape */}
          <Layer clipFunc={dShapeClip}>
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

          {/* Overlay layer for boundary warnings, selection, and D-shape outline */}
          <Layer>
            {widgets.map(w => (
              <BoundaryGuard key={`bound-${w.id}`} widget={w} />
            ))}
            <SelectionBox
              selectedNode={selectedNode}
              onTransformEnd={handleTransformEnd}
            />
            {/* D-shape outline */}
            <Shape
              sceneFunc={(ctx, shape) => {
                ctx.beginPath();
                ctx.moveTo(0, SCREEN_HEIGHT);
                ctx.lineTo(0, DOME_CENTER_Y);
                ctx.arc(DOME_CENTER_X, DOME_CENTER_Y, DOME_RADIUS, Math.PI, 0, false);
                ctx.lineTo(SCREEN_WIDTH, SCREEN_HEIGHT);
                ctx.closePath();
                ctx.fillStrokeShape(shape);
              }}
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
