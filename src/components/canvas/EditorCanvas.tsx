import { useRef, useCallback, useState, useEffect, useMemo } from 'react';
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
import { ContextMenu, type ContextMenuState } from './ContextMenu';
import { useAnimationEngine } from '../../hooks/useAnimationEngine';
import { SimulatorControls } from '../simulator/SimulatorControls';
import { createTextWidget, createImageWidget, createGaugeWidget } from '../../utils/widgetFactory';
import type { Widget } from '../../types/widget';

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
  const showBoundary = useSceneStore(s => s.showBoundary);
  const zoom = useSceneStore(s => s.zoom);
  const animationMode = useSceneStore(s => s.animationMode);
  const selectWidget = useSceneStore(s => s.selectWidget);
  const updateWidget = useSceneStore(s => s.updateWidget);
  const removeWidget = useSceneStore(s => s.removeWidget);
  const addWidget = useSceneStore(s => s.addWidget);
  const duplicateWidget = useSceneStore(s => s.duplicateWidget);
  const bringToFront = useSceneStore(s => s.bringToFront);
  const sendToBack = useSceneStore(s => s.sendToBack);
  const moveWidgetToLayer = useSceneStore(s => s.moveWidgetToLayer);

  const stageRef = useRef<Konva.Stage>(null);
  const [selectedNode, setSelectedNode] = useState<Konva.Node | null>(null);
  const [playing, setPlaying] = useState(false);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  const { overrides, elapsed, triggerClick, reset } = useAnimationEngine({
    widgets,
    playing: animationMode && playing,
  });

  // Reset when animation mode turns off
  useEffect(() => {
    if (!animationMode) {
      reset();
      setPlaying(false);
    }
  }, [animationMode, reset]);

  // Merge animation overrides into widgets
  const effectiveWidgets = useMemo(() => {
    if (!animationMode || overrides.size === 0) return widgets;
    return widgets.map(w => {
      const ov = overrides.get(w.id);
      if (!ov) return w;
      return { ...w, ...ov } as Widget;
    });
  }, [widgets, overrides, animationMode]);

  const isAnimating = animationMode && playing;

  const handleStageClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    setContextMenu(null);
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
      const widget = widgets.find(wg => wg.id === selectedWidgetId);
      if (!widget) return;

      // Text/gauge use center offset: Konva reports center position, convert to top-left
      let storeX = x;
      let storeY = y;
      if (widget.type !== 'image') {
        storeX = x - w / 2;
        storeY = y - h / 2;
      }

      if (snapBack) {
        const testWidget = { ...widget, x: storeX, y: storeY, w, h, rotation };
        if (!isWidgetInsideDisplay(testWidget)) {
          const clamped = clampWidgetToCircle(testWidget);
          updateWidget(selectedWidgetId, { x: clamped.x, y: clamped.y, w, h, rotation });
          return;
        }
      }
      updateWidget(selectedWidgetId, { x: storeX, y: storeY, w, h, rotation });
    }
  }, [selectedWidgetId, updateWidget, snapBack, widgets]);

  const handleContextMenu = useCallback((e: Konva.KonvaEventObject<PointerEvent>) => {
    e.evt.preventDefault();
    if (isAnimating) return;

    const stage = stageRef.current;
    if (!stage) return;

    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    // Walk up the Konva node tree to find a widget ID
    let widgetId: string | null = null;
    let node: Konva.Node | null = e.target;
    while (node && node !== stage) {
      const nodeId = node.attrs?.id;
      if (nodeId && nodeId !== 'bg-rect' && widgets.some(w => w.id === nodeId)) {
        widgetId = nodeId;
        break;
      }
      node = node.parent;
    }

    setContextMenu({
      screenX: e.evt.clientX,
      screenY: e.evt.clientY,
      canvasX: pointer.x,
      canvasY: pointer.y,
      widgetId,
    });
  }, [isAnimating, widgets]);

  const handleReset = useCallback(() => {
    setPlaying(false);
    reset();
  }, [reset]);

  const layer0Widgets = effectiveWidgets.filter(w => w.layer === 0);
  const layer1Widgets = effectiveWidgets.filter(w => w.layer === 1);

  const renderWidgetLayer = (layerWidgets: Widget[]) =>
    layerWidgets.map(widget => (
      <WidgetRenderer
        key={widget.id}
        widget={widget}
        isSelected={!isAnimating && selectedWidgetId === widget.id}
        draggable={!isAnimating}
        onSelect={() => {
          const node = stageRef.current?.findOne(`#${CSS.escape(widget.id)}`);
          if (isAnimating) {
            triggerClick(widget.id);
          } else if (node) {
            handleWidgetSelect(widget.id, node);
          } else {
            selectWidget(widget.id);
          }
        }}
        onDragEnd={(x, y) => handleDragEnd(widget.id, x, y)}
      />
    ));

  return (
    <div className="flex flex-col items-center justify-center flex-1 bg-gray-900 overflow-auto p-8">
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
          onContextMenu={handleContextMenu}
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
            {renderWidgetLayer(layer0Widgets)}
          </Layer>

          {/* Layer 1 - Foreground widgets — clipped to circle */}
          <Layer clipFunc={circleClip}>
            {renderWidgetLayer(layer1Widgets)}
          </Layer>

          {/* Overlay layer for boundary warnings, selection, and circle outline */}
          <Layer>
            {!isAnimating && showBoundary && widgets.map(w => (
              <BoundaryGuard key={`bound-${w.id}`} widget={w} />
            ))}
            <SelectionBox
              selectedNode={isAnimating ? null : selectedNode}
              onTransformEnd={handleTransformEnd}
            />
            {/* Circle outline */}
            <Circle
              x={SCREEN_CENTER_X}
              y={SCREEN_CENTER_Y}
              radius={SCREEN_RADIUS}
              stroke={animationMode ? '#f59e0b' : '#555'}
              strokeWidth={animationMode ? 3 : 2}
              listening={false}
            />
          </Layer>
        </Stage>
      </div>

      {animationMode && (
        <div className="mt-3">
          <SimulatorControls
            playing={playing}
            elapsed={elapsed}
            onTogglePlay={() => setPlaying(p => !p)}
            onReset={handleReset}
          />
        </div>
      )}

      {contextMenu && (
        <ContextMenu
          state={contextMenu}
          onClose={() => setContextMenu(null)}
          onDuplicate={(id) => duplicateWidget(id)}
          onDelete={(id) => removeWidget(id)}
          onCenterH={(id) => {
            const w = widgets.find(wg => wg.id === id);
            if (!w) return;
            updateWidget(id, { x: w.type === 'image' ? SCREEN_CENTER_X : SCREEN_CENTER_X - w.w / 2 });
          }}
          onCenterV={(id) => {
            const w = widgets.find(wg => wg.id === id);
            if (!w) return;
            updateWidget(id, { y: w.type === 'image' ? SCREEN_CENTER_Y : SCREEN_CENTER_Y - w.h / 2 });
          }}
          onBringToFront={(id) => bringToFront(id)}
          onSendToBack={(id) => sendToBack(id)}
          onMoveToForeground={(id) => moveWidgetToLayer(id, 1)}
          onMoveToBackground={(id) => moveWidgetToLayer(id, 0)}
          onAddText={(pos) => addWidget(createTextWidget(pos))}
          onAddImage={(pos) => addWidget(createImageWidget(pos))}
          onAddGauge={(pos) => addWidget(createGaugeWidget(pos))}
        />
      )}
    </div>
  );
}
