import type { ImageWidget } from '../../types/widget';
import { useAssetStore } from '../../store/assetStore';

interface Props {
  widget: ImageWidget;
  onChange: (changes: Partial<ImageWidget>) => void;
}

const label = "block text-xs text-gray-400 mb-1";
const input = "w-full bg-gray-700 text-white text-sm p-1.5 rounded border border-gray-600";
const section = "text-xs text-gray-500 uppercase tracking-wide mt-2 mb-1";
const check = "flex items-center gap-1.5 text-xs text-gray-400 cursor-pointer";

export function ImageProperties({ widget, onChange }: Props) {
  const assets = useAssetStore(s => s.assets);

  return (
    <div className="space-y-3">
      {/* Source */}
      <div>
        <label className={label}>Asset</label>
        <select className={input} value={widget.assetId}
          onChange={e => {
            const asset = assets.find(a => a.id === e.target.value);
            onChange({ assetId: e.target.value, imagePath: asset?.name || '' });
          }}>
          <option value="">-- Select Asset --</option>
          {assets.filter(a => a.status === 'ready').map(a => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className={label}>Image Path</label>
        <input type="text" className={input} value={widget.imagePath}
          onChange={e => onChange({ imagePath: e.target.value })} />
      </div>

      {/* Transform */}
      <p className={section}>Transform</p>
      <div>
        <label className={label}>Zoom (256 = 100%)</label>
        <input type="range" className="w-full" min={32} max={512} value={widget.zoom}
          onChange={e => onChange({ zoom: Number(e.target.value) })} />
        <span className="text-xs text-gray-500">{Math.round(widget.zoom / 256 * 100)}%</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={label}>Pivot X</label>
          <input type="number" className={input} value={widget.pivotX} min={0} max={1} step={0.1}
            onChange={e => onChange({ pivotX: Number(e.target.value) })} />
        </div>
        <div>
          <label className={label}>Pivot Y</label>
          <input type="number" className={input} value={widget.pivotY} min={0} max={1} step={0.1}
            onChange={e => onChange({ pivotY: Number(e.target.value) })} />
        </div>
      </div>

      {/* Rendering */}
      <p className={section}>Rendering</p>
      <label className={check}>
        <input type="checkbox" checked={widget.antialias}
          onChange={e => onChange({ antialias: e.target.checked })} />
        Antialias
      </label>
    </div>
  );
}
