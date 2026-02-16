import { useRef } from 'react';
import { useAssetStore } from '../../store/assetStore';
import { checkImageDimensions } from '../../utils/imageConverter';

export function AssetLibrary() {
  const assets = useAssetStore(s => s.assets);
  const importAsset = useAssetStore(s => s.importAsset);
  const removeAsset = useAssetStore(s => s.removeAsset);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      await importAsset(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-xs text-gray-500 uppercase tracking-wide">Assets</h4>
        <button
          className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-2 py-0.5 rounded"
          onClick={() => fileInputRef.current?.click()}
        >
          Import
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/bmp"
          multiple
          className="hidden"
          onChange={handleImport}
        />
      </div>
      {assets.length === 0 && (
        <p className="text-xs text-gray-500 italic">No assets imported</p>
      )}
      {assets.map(asset => {
        const warnings = asset.status === 'ready' ? checkImageDimensions(asset.width, asset.height) : [];
        return (
          <div key={asset.id} className="flex items-center gap-2 p-1.5 bg-gray-750 rounded">
            <div className="w-8 h-8 bg-gray-700 rounded overflow-hidden flex-shrink-0">
              {asset.originalDataUrl && (
                <img
                  src={asset.originalDataUrl}
                  alt={asset.name}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-300 truncate">{asset.name}</p>
              {asset.status === 'converting' && (
                <p className="text-xs text-yellow-400">Converting...</p>
              )}
              {asset.status === 'error' && (
                <p className="text-xs text-red-400">{asset.errorMessage}</p>
              )}
              {asset.status === 'ready' && (
                <p className="text-xs text-gray-500">{asset.width}x{asset.height}</p>
              )}
              {warnings.map((w, i) => (
                <p key={i} className="text-xs text-yellow-400">{w}</p>
              ))}
            </div>
            <button
              className="text-xs text-red-400 hover:text-red-300 flex-shrink-0"
              onClick={() => removeAsset(asset.id)}
            >
              x
            </button>
          </div>
        );
      })}
    </div>
  );
}
