import type { ImageWidget } from '../../types/widget';
import { useAssetStore } from '../../store/assetStore';

interface Props {
  widget: ImageWidget;
  onChange: (changes: Partial<ImageWidget>) => void;
}

export function ImageProperties({ widget, onChange }: Props) {
  const assets = useAssetStore(s => s.assets);

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs text-gray-400 mb-1">Asset</label>
        <select
          className="w-full bg-gray-700 text-white text-sm p-1.5 rounded border border-gray-600"
          value={widget.assetId}
          onChange={e => {
            const asset = assets.find(a => a.id === e.target.value);
            onChange({
              assetId: e.target.value,
              imagePath: asset?.name || '',
            });
          }}
        >
          <option value="">-- Select Asset --</option>
          {assets
            .filter(a => a.status === 'ready')
            .map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
        </select>
      </div>
      <div>
        <label className="block text-xs text-gray-400 mb-1">Image Path</label>
        <input
          type="text"
          className="w-full bg-gray-700 text-white text-sm p-1.5 rounded border border-gray-600"
          value={widget.imagePath}
          onChange={e => onChange({ imagePath: e.target.value })}
        />
      </div>
    </div>
  );
}
