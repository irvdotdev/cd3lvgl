import type { GaugeWidget } from '../../types/widget';

interface Props {
  widget: GaugeWidget;
  onChange: (changes: Partial<GaugeWidget>) => void;
}

export function GaugeProperties({ widget, onChange }: Props) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Min</label>
          <input
            type="number"
            className="w-full bg-gray-700 text-white text-sm p-1.5 rounded border border-gray-600"
            value={widget.minValue}
            onChange={e => onChange({ minValue: Number(e.target.value) })}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Max</label>
          <input
            type="number"
            className="w-full bg-gray-700 text-white text-sm p-1.5 rounded border border-gray-600"
            value={widget.maxValue}
            onChange={e => onChange({ maxValue: Number(e.target.value) })}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Value</label>
          <input
            type="number"
            className="w-full bg-gray-700 text-white text-sm p-1.5 rounded border border-gray-600"
            value={widget.currentValue}
            min={widget.minValue}
            max={widget.maxValue}
            onChange={e => onChange({ currentValue: Number(e.target.value) })}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Start Angle</label>
          <input
            type="number"
            className="w-full bg-gray-700 text-white text-sm p-1.5 rounded border border-gray-600"
            value={widget.startAngle}
            onChange={e => onChange({ startAngle: Number(e.target.value) })}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">End Angle</label>
          <input
            type="number"
            className="w-full bg-gray-700 text-white text-sm p-1.5 rounded border border-gray-600"
            value={widget.endAngle}
            onChange={e => onChange({ endAngle: Number(e.target.value) })}
          />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Needle</label>
          <input
            type="color"
            className="w-full h-8 bg-gray-700 rounded border border-gray-600 cursor-pointer"
            value={widget.needleColor}
            onChange={e => onChange({ needleColor: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Arc</label>
          <input
            type="color"
            className="w-full h-8 bg-gray-700 rounded border border-gray-600 cursor-pointer"
            value={widget.arcColor}
            onChange={e => onChange({ arcColor: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Arc BG</label>
          <input
            type="color"
            className="w-full h-8 bg-gray-700 rounded border border-gray-600 cursor-pointer"
            value={widget.arcBgColor}
            onChange={e => onChange({ arcBgColor: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}
