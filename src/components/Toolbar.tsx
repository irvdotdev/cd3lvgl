import { useRef } from 'react';
import { useSceneStore } from '../store/sceneStore';
import type { TextWidget, ImageWidget, GaugeWidget } from '../types/widget';
import { exportScene, importScene, downloadJson } from '../utils/sceneExport';
import { hasErrors } from '../utils/validation';
import { validateScene } from '../utils/validation';
import { SCREEN_WIDTH, SCREEN_HEIGHT } from '../constants/display';

export function Toolbar() {
  const addWidget = useSceneStore(s => s.addWidget);
  const widgets = useSceneStore(s => s.widgets);
  const backgroundColor = useSceneStore(s => s.backgroundColor);
  const setWidgets = useSceneStore(s => s.setWidgets);
  const setBackgroundColor = useSceneStore(s => s.setBackgroundColor);
  const toggleGrid = useSceneStore(s => s.toggleGrid);
  const showGrid = useSceneStore(s => s.showGrid);
  const toggleSimulator = useSceneStore(s => s.toggleSimulator);
  const showSimulator = useSceneStore(s => s.showSimulator);
  const toggleAnimationMode = useSceneStore(s => s.toggleAnimationMode);
  const animationMode = useSceneStore(s => s.animationMode);
  const snapBack = useSceneStore(s => s.snapBack);
  const toggleSnapBack = useSceneStore(s => s.toggleSnapBack);
  const showBoundary = useSceneStore(s => s.showBoundary);
  const toggleBoundary = useSceneStore(s => s.toggleBoundary);
  const zoom = useSceneStore(s => s.zoom);
  const setZoom = useSceneStore(s => s.setZoom);
  const undo = useSceneStore(s => s.undo);
  const redo = useSceneStore(s => s.redo);

  const importInputRef = useRef<HTMLInputElement>(null);

  const baseDefaults = {
    layer: 1 as const,
    clickable: false,
    visible: true,
    opacity: 255,
    borderWidth: 0,
    borderColor: '#ffffff',
    borderRadius: 0,
    bgColor: '#000000',
    bgEnabled: false,
    padding: 0,
    rotation: 0,
    animations: [],
  };

  const addTextWidget = () => {
    const widget: TextWidget = {
      id: crypto.randomUUID(),
      type: 'text',
      ...baseDefaults,
      x: 75,
      y: 150,
      w: 200,
      h: 40,
      content: 'Hello',
      fontSize: 16,
      fontColor: '#ffffff',
      align: 'center',
      verticalAlign: 'middle',
      fontFamily: 'sans-serif',
      fontWeight: 'normal',
      letterSpacing: 0,
      lineSpacing: 0,
      textDecoration: 'none',
      longMode: 'wrap',
    };
    addWidget(widget);
  };

  const addImageWidget = () => {
    const widget: ImageWidget = {
      id: crypto.randomUUID(),
      type: 'image',
      ...baseDefaults,
      x: 125,
      y: 125,
      w: 100,
      h: 100,
      assetId: '',
      imagePath: '',
      pivotX: 0.5,
      pivotY: 0.5,
      zoom: 256,
      antialias: true,
    };
    addWidget(widget);
  };

  const addGaugeWidget = () => {
    const widget: GaugeWidget = {
      id: crypto.randomUUID(),
      type: 'gauge',
      ...baseDefaults,
      x: 115,
      y: 115,
      w: 120,
      h: 120,
      minValue: 0,
      maxValue: 100,
      currentValue: 50,
      startAngle: -135,
      endAngle: 135,
      showArc: true,
      arcColor: '#00aaff',
      arcBgColor: '#333333',
      arcWidth: 12,
      arcRounded: false,
      showNeedle: true,
      needleColor: '#ff0000',
      needleWidth: 2,
      needleLength: 85,
      showNeedleDot: true,
      needleDotRadius: 4,
      showTicks: false,
      tickCount: 11,
      tickLength: 8,
      tickWidth: 1,
      tickColor: '#ffffff',
      showLabels: false,
      labelCount: 5,
      labelFontSize: 10,
      labelColor: '#ffffff',
      labelOffset: 15,
    };
    addWidget(widget);
  };

  const handleExport = () => {
    const scene = {
      name: 'Scene',
      screenWidth: SCREEN_WIDTH,
      screenHeight: SCREEN_HEIGHT,
      backgroundColor,
      widgets,
    };
    const issues = validateScene(scene);
    if (hasErrors(issues)) {
      alert('Cannot export: scene has errors.\n' + issues.filter(i => i.severity === 'error').map(i => `${i.widgetId.slice(0, 8)}: ${i.message}`).join('\n'));
      return;
    }
    const { json } = exportScene(widgets, backgroundColor);
    if (json) downloadJson(json);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const { scene, errors } = importScene(reader.result as string);
      if (scene) {
        setWidgets(scene.widgets);
        setBackgroundColor(scene.backgroundColor);
        if (errors.length > 0) {
          alert('Import warnings:\n' + errors.join('\n'));
        }
      } else {
        alert('Import failed:\n' + errors.join('\n'));
      }
    };
    reader.readAsText(file);
    if (importInputRef.current) importInputRef.current.value = '';
  };

  const btnClass = "px-3 py-1.5 text-xs rounded bg-gray-700 hover:bg-gray-600 text-gray-200 transition-colors";
  const activeBtnClass = "px-3 py-1.5 text-xs rounded bg-blue-600 hover:bg-blue-500 text-white transition-colors";

  return (
    <div className="flex items-center gap-2 bg-gray-800 border-b border-gray-700 px-4 py-2">
      <span className="text-sm font-bold text-gray-200 mr-2">OOONO UI Builder</span>
      <div className="h-4 w-px bg-gray-600" />

      {/* Add Widgets */}
      <button className={btnClass} onClick={addTextWidget}>+ Text</button>
      <button className={btnClass} onClick={addImageWidget}>+ Image</button>
      <button className={btnClass} onClick={addGaugeWidget}>+ Gauge</button>

      <div className="h-4 w-px bg-gray-600" />

      {/* Undo/Redo */}
      <button className={btnClass} onClick={undo} title="Undo">Undo</button>
      <button className={btnClass} onClick={redo} title="Redo">Redo</button>

      <div className="h-4 w-px bg-gray-600" />

      {/* Toggle Grid */}
      <button className={showGrid ? activeBtnClass : btnClass} onClick={toggleGrid}>
        Grid
      </button>

      {/* Toggle Simulator */}
      <button className={showSimulator ? activeBtnClass : btnClass} onClick={toggleSimulator}>
        Simulator
      </button>

      {/* Toggle Animation Mode */}
      <button className={animationMode ? activeBtnClass : btnClass} onClick={toggleAnimationMode}>
        Animate
      </button>

      {/* Toggle Snap Back */}
      <button className={snapBack ? activeBtnClass : btnClass} onClick={toggleSnapBack}>
        Snap Back
      </button>

      {/* Toggle Boundary */}
      <button className={showBoundary ? activeBtnClass : btnClass} onClick={toggleBoundary}>
        Boundary
      </button>

      <div className="h-4 w-px bg-gray-600" />

      {/* Zoom */}
      <button className={btnClass} onClick={() => setZoom(zoom - 0.25)}>-</button>
      <span className="text-xs text-gray-400 w-12 text-center">{Math.round(zoom * 100)}%</span>
      <button className={btnClass} onClick={() => setZoom(zoom + 0.25)}>+</button>
      <button className={btnClass} onClick={() => setZoom(1)}>1:1</button>

      <div className="flex-1" />

      {/* Export/Import */}
      <button className={btnClass} onClick={handleExport}>Export JSON</button>
      <button className={btnClass} onClick={() => importInputRef.current?.click()}>Import JSON</button>
      <input
        ref={importInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleImport}
      />
    </div>
  );
}
