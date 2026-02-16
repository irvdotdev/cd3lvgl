import type { GaugeWidget } from '../../types/widget';

interface Props {
  widget: GaugeWidget;
  onChange: (changes: Partial<GaugeWidget>) => void;
}

const label = "block text-xs text-gray-400 mb-1";
const input = "w-full bg-gray-700 text-white text-sm p-1.5 rounded border border-gray-600";
const check = "flex items-center gap-1.5 text-xs text-gray-400 cursor-pointer";
const section = "text-xs text-gray-500 uppercase tracking-wide mt-2 mb-1";

export function GaugeProperties({ widget, onChange }: Props) {
  return (
    <div className="space-y-3">
      {/* Value */}
      <p className={section}>Value</p>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className={label}>Min</label>
          <input type="number" className={input} value={widget.minValue}
            onChange={e => onChange({ minValue: Number(e.target.value) })} />
        </div>
        <div>
          <label className={label}>Max</label>
          <input type="number" className={input} value={widget.maxValue}
            onChange={e => onChange({ maxValue: Number(e.target.value) })} />
        </div>
        <div>
          <label className={label}>Current</label>
          <input type="number" className={input} value={widget.currentValue}
            min={widget.minValue} max={widget.maxValue}
            onChange={e => onChange({ currentValue: Number(e.target.value) })} />
        </div>
      </div>

      {/* Angles */}
      <p className={section}>Angles</p>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={label}>Start</label>
          <input type="number" className={input} value={widget.startAngle}
            onChange={e => onChange({ startAngle: Number(e.target.value) })} />
        </div>
        <div>
          <label className={label}>End</label>
          <input type="number" className={input} value={widget.endAngle}
            onChange={e => onChange({ endAngle: Number(e.target.value) })} />
        </div>
      </div>

      {/* Arc */}
      <p className={section}>Arc</p>
      <label className={check}>
        <input type="checkbox" checked={widget.showArc}
          onChange={e => onChange({ showArc: e.target.checked })} />
        Show Arc
      </label>
      {widget.showArc && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={label}>Width</label>
              <input type="number" className={input} value={widget.arcWidth} min={1}
                onChange={e => onChange({ arcWidth: Number(e.target.value) })} />
            </div>
            <div>
              <label className={check}>
                <input type="checkbox" checked={widget.arcRounded}
                  onChange={e => onChange({ arcRounded: e.target.checked })} />
                Rounded
              </label>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={label}>Color</label>
              <input type="color" className="w-full h-8 bg-gray-700 rounded border border-gray-600 cursor-pointer"
                value={widget.arcColor} onChange={e => onChange({ arcColor: e.target.value })} />
            </div>
            <div>
              <label className={label}>BG Color</label>
              <input type="color" className="w-full h-8 bg-gray-700 rounded border border-gray-600 cursor-pointer"
                value={widget.arcBgColor} onChange={e => onChange({ arcBgColor: e.target.value })} />
            </div>
          </div>
        </>
      )}

      {/* Needle */}
      <p className={section}>Needle</p>
      <label className={check}>
        <input type="checkbox" checked={widget.showNeedle}
          onChange={e => onChange({ showNeedle: e.target.checked })} />
        Show Needle
      </label>
      {widget.showNeedle && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={label}>Color</label>
              <input type="color" className="w-full h-8 bg-gray-700 rounded border border-gray-600 cursor-pointer"
                value={widget.needleColor} onChange={e => onChange({ needleColor: e.target.value })} />
            </div>
            <div>
              <label className={label}>Width</label>
              <input type="number" className={input} value={widget.needleWidth} min={1}
                onChange={e => onChange({ needleWidth: Number(e.target.value) })} />
            </div>
          </div>
          <div>
            <label className={label}>Length (%)</label>
            <input type="range" className="w-full" min={10} max={100} value={widget.needleLength}
              onChange={e => onChange({ needleLength: Number(e.target.value) })} />
            <span className="text-xs text-gray-500">{widget.needleLength}%</span>
          </div>
          <label className={check}>
            <input type="checkbox" checked={widget.showNeedleDot}
              onChange={e => onChange({ showNeedleDot: e.target.checked })} />
            Center Dot
          </label>
          {widget.showNeedleDot && (
            <div>
              <label className={label}>Dot Radius</label>
              <input type="number" className={input} value={widget.needleDotRadius} min={1}
                onChange={e => onChange({ needleDotRadius: Number(e.target.value) })} />
            </div>
          )}
        </>
      )}

      {/* Ticks */}
      <p className={section}>Ticks</p>
      <label className={check}>
        <input type="checkbox" checked={widget.showTicks}
          onChange={e => onChange({ showTicks: e.target.checked })} />
        Show Ticks
      </label>
      {widget.showTicks && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={label}>Count</label>
            <input type="number" className={input} value={widget.tickCount} min={2}
              onChange={e => onChange({ tickCount: Number(e.target.value) })} />
          </div>
          <div>
            <label className={label}>Length</label>
            <input type="number" className={input} value={widget.tickLength} min={1}
              onChange={e => onChange({ tickLength: Number(e.target.value) })} />
          </div>
          <div>
            <label className={label}>Width</label>
            <input type="number" className={input} value={widget.tickWidth} min={1}
              onChange={e => onChange({ tickWidth: Number(e.target.value) })} />
          </div>
          <div>
            <label className={label}>Color</label>
            <input type="color" className="w-full h-8 bg-gray-700 rounded border border-gray-600 cursor-pointer"
              value={widget.tickColor} onChange={e => onChange({ tickColor: e.target.value })} />
          </div>
        </div>
      )}

      {/* Labels */}
      <p className={section}>Labels</p>
      <label className={check}>
        <input type="checkbox" checked={widget.showLabels}
          onChange={e => onChange({ showLabels: e.target.checked })} />
        Show Labels
      </label>
      {widget.showLabels && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={label}>Count</label>
            <input type="number" className={input} value={widget.labelCount} min={2}
              onChange={e => onChange({ labelCount: Number(e.target.value) })} />
          </div>
          <div>
            <label className={label}>Font Size</label>
            <input type="number" className={input} value={widget.labelFontSize} min={6}
              onChange={e => onChange({ labelFontSize: Number(e.target.value) })} />
          </div>
          <div>
            <label className={label}>Color</label>
            <input type="color" className="w-full h-8 bg-gray-700 rounded border border-gray-600 cursor-pointer"
              value={widget.labelColor} onChange={e => onChange({ labelColor: e.target.value })} />
          </div>
          <div>
            <label className={label}>Offset</label>
            <input type="number" className={input} value={widget.labelOffset}
              onChange={e => onChange({ labelOffset: Number(e.target.value) })} />
          </div>
        </div>
      )}
    </div>
  );
}
