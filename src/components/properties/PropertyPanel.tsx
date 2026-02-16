import { useSceneStore } from '../../store/sceneStore';
import type { Widget } from '../../types/widget';
import { TextProperties } from './TextProperties';
import { ImageProperties } from './ImageProperties';
import { GaugeProperties } from './GaugeProperties';

const labelCls = "block text-xs text-gray-400 mb-1";
const inputCls = "w-full bg-gray-700 text-white text-sm p-1.5 rounded border border-gray-600";
const sectionCls = "text-xs text-gray-500 uppercase tracking-wide mt-3 mb-1";
const checkCls = "flex items-center gap-1.5 text-xs text-gray-400 cursor-pointer";

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
          <label className={labelCls}>Background Color</label>
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

      {/* Position & Size */}
      <p className={sectionCls}>Position & Size</p>
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={labelCls}>X</label>
            <input type="number" className={inputCls} value={widget.x}
              onChange={e => handleChange({ x: Number(e.target.value) })} />
          </div>
          <div>
            <label className={labelCls}>Y</label>
            <input type="number" className={inputCls} value={widget.y}
              onChange={e => handleChange({ y: Number(e.target.value) })} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={labelCls}>Width</label>
            <input type="number" className={inputCls} value={widget.w} min={10}
              onChange={e => handleChange({ w: Number(e.target.value) })} />
          </div>
          <div>
            <label className={labelCls}>Height</label>
            <input type="number" className={inputCls} value={widget.h} min={10}
              onChange={e => handleChange({ h: Number(e.target.value) })} />
          </div>
        </div>
        <div>
          <label className={labelCls}>Rotation</label>
          <input type="range" className="w-full" min={0} max={360} value={widget.rotation}
            onChange={e => handleChange({ rotation: Number(e.target.value) })} />
          <span className="text-xs text-gray-500">{widget.rotation}&deg;</span>
        </div>
      </div>

      {/* Flags */}
      <p className={sectionCls}>Flags</p>
      <div className="flex flex-wrap gap-3">
        <label className={checkCls}>
          <input type="checkbox" checked={widget.visible}
            onChange={e => handleChange({ visible: e.target.checked })} />
          Visible
        </label>
        <label className={checkCls}>
          <input type="checkbox" checked={widget.clickable}
            onChange={e => handleChange({ clickable: e.target.checked })} />
          Clickable
        </label>
        <div>
          <label className={labelCls}>Layer</label>
          <select className={inputCls} value={widget.layer}
            onChange={e => handleChange({ layer: Number(e.target.value) as 0 | 1 })}>
            <option value={0}>0 - Background</option>
            <option value={1}>1 - Foreground</option>
          </select>
        </div>
      </div>

      {/* Style */}
      <p className={sectionCls}>Style</p>
      <div className="space-y-2">
        <div>
          <label className={labelCls}>Opacity (0–255)</label>
          <input type="range" className="w-full" min={0} max={255} value={widget.opacity}
            onChange={e => handleChange({ opacity: Number(e.target.value) })} />
          <span className="text-xs text-gray-500">{widget.opacity}</span>
        </div>
        <div>
          <label className={labelCls}>Padding</label>
          <input type="number" className={inputCls} value={widget.padding} min={0}
            onChange={e => handleChange({ padding: Number(e.target.value) })} />
        </div>
        <label className={checkCls}>
          <input type="checkbox" checked={widget.bgEnabled}
            onChange={e => handleChange({ bgEnabled: e.target.checked })} />
          Background
        </label>
        {widget.bgEnabled && (
          <div>
            <label className={labelCls}>BG Color</label>
            <input type="color" className="w-full h-8 bg-gray-700 rounded border border-gray-600 cursor-pointer"
              value={widget.bgColor} onChange={e => handleChange({ bgColor: e.target.value })} />
          </div>
        )}
      </div>

      {/* Border */}
      <p className={sectionCls}>Border</p>
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={labelCls}>Width</label>
            <input type="number" className={inputCls} value={widget.borderWidth} min={0}
              onChange={e => handleChange({ borderWidth: Number(e.target.value) })} />
          </div>
          <div>
            <label className={labelCls}>Radius</label>
            <input type="number" className={inputCls} value={widget.borderRadius} min={0}
              onChange={e => handleChange({ borderRadius: Number(e.target.value) })} />
          </div>
        </div>
        {widget.borderWidth > 0 && (
          <div>
            <label className={labelCls}>Color</label>
            <input type="color" className="w-full h-8 bg-gray-700 rounded border border-gray-600 cursor-pointer"
              value={widget.borderColor} onChange={e => handleChange({ borderColor: e.target.value })} />
          </div>
        )}
      </div>

      <hr className="border-gray-700 my-4" />

      {/* Type-specific properties */}
      {widget.type === 'text' && <TextProperties widget={widget} onChange={handleChange} />}
      {widget.type === 'image' && <ImageProperties widget={widget} onChange={handleChange} />}
      {widget.type === 'gauge' && <GaugeProperties widget={widget} onChange={handleChange} />}
    </div>
  );
}
