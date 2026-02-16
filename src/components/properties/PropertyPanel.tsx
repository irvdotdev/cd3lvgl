import { useSceneStore } from '../../store/sceneStore';
import type { Widget } from '../../types/widget';
import { TextProperties } from './TextProperties';
import { ImageProperties } from './ImageProperties';
import { GaugeProperties } from './GaugeProperties';

export function PropertyPanel() {
  const widgets = useSceneStore(s => s.widgets);
  const selectedWidgetId = useSceneStore(s => s.selectedWidgetId);
  const updateWidget = useSceneStore(s => s.updateWidget);
  const removeWidget = useSceneStore(s => s.removeWidget);
  const backgroundColor = useSceneStore(s => s.backgroundColor);
  const setBackgroundColor = useSceneStore(s => s.setBackgroundColor);

  const widget = widgets.find(w => w.id === selectedWidgetId);

  if (!widget) {
    return (
      <div className="w-64 bg-gray-800 border-l border-gray-700 p-4 overflow-y-auto">
        <h3 className="text-sm font-semibold text-gray-300 mb-4">Scene Properties</h3>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Background Color</label>
          <input
            type="color"
            className="w-full h-8 bg-gray-700 rounded border border-gray-600 cursor-pointer"
            value={backgroundColor}
            onChange={e => setBackgroundColor(e.target.value)}
          />
        </div>
      </div>
    );
  }

  const handleChange = (changes: Partial<Widget>) => {
    updateWidget(widget.id, changes);
  };

  return (
    <div className="w-64 bg-gray-800 border-l border-gray-700 p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-300 capitalize">{widget.type} Widget</h3>
        <button
          className="text-xs text-red-400 hover:text-red-300"
          onClick={() => removeWidget(widget.id)}
        >
          Delete
        </button>
      </div>

      {/* Common properties */}
      <div className="space-y-3 mb-4">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-gray-400 mb-1">X</label>
            <input
              type="number"
              className="w-full bg-gray-700 text-white text-sm p-1.5 rounded border border-gray-600"
              value={widget.x}
              onChange={e => handleChange({ x: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Y</label>
            <input
              type="number"
              className="w-full bg-gray-700 text-white text-sm p-1.5 rounded border border-gray-600"
              value={widget.y}
              onChange={e => handleChange({ y: Number(e.target.value) })}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Width</label>
            <input
              type="number"
              className="w-full bg-gray-700 text-white text-sm p-1.5 rounded border border-gray-600"
              value={widget.w}
              min={10}
              onChange={e => handleChange({ w: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Height</label>
            <input
              type="number"
              className="w-full bg-gray-700 text-white text-sm p-1.5 rounded border border-gray-600"
              value={widget.h}
              min={10}
              onChange={e => handleChange({ h: Number(e.target.value) })}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Layer</label>
            <select
              className="w-full bg-gray-700 text-white text-sm p-1.5 rounded border border-gray-600"
              value={widget.layer}
              onChange={e => handleChange({ layer: Number(e.target.value) as 0 | 1 })}
            >
              <option value={0}>0 - Background</option>
              <option value={1}>1 - Foreground</option>
            </select>
          </div>
          <div className="flex items-end gap-2">
            <label className="flex items-center gap-1 text-xs text-gray-400 cursor-pointer">
              <input
                type="checkbox"
                checked={widget.visible}
                onChange={e => handleChange({ visible: e.target.checked })}
              />
              Visible
            </label>
            <label className="flex items-center gap-1 text-xs text-gray-400 cursor-pointer">
              <input
                type="checkbox"
                checked={widget.clickable}
                onChange={e => handleChange({ clickable: e.target.checked })}
              />
              Click
            </label>
          </div>
        </div>
      </div>

      <hr className="border-gray-700 mb-4" />

      {/* Type-specific properties */}
      {widget.type === 'text' && <TextProperties widget={widget} onChange={handleChange} />}
      {widget.type === 'image' && <ImageProperties widget={widget} onChange={handleChange} />}
      {widget.type === 'gauge' && <GaugeProperties widget={widget} onChange={handleChange} />}
    </div>
  );
}
