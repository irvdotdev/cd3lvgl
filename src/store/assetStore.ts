import { create } from 'zustand';
import type { Asset } from '../types/asset';
import { convertImageToRgb565 } from '../utils/imageConverter';

interface AssetState {
  assets: Asset[];

  importAsset: (file: File) => Promise<void>;
  removeAsset: (id: string) => void;
  getAsset: (id: string) => Asset | undefined;
}

export const useAssetStore = create<AssetState>((set, get) => ({
  assets: [],

  importAsset: async (file: File) => {
    const id = crypto.randomUUID();
    const originalDataUrl = URL.createObjectURL(file);

    const pendingAsset: Asset = {
      id,
      name: file.name,
      originalFile: file,
      originalDataUrl,
      convertedBlob: null,
      convertedDataUrl: '',
      width: 0,
      height: 0,
      format: 'rgb565',
      status: 'converting',
    };

    set(s => ({ assets: [...s.assets, pendingAsset] }));

    try {
      const result = await convertImageToRgb565(file);
      set(s => ({
        assets: s.assets.map(a =>
          a.id === id
            ? {
                ...a,
                convertedBlob: result.blob,
                convertedDataUrl: result.dataUrl,
                width: result.width,
                height: result.height,
                status: 'ready' as const,
              }
            : a
        ),
      }));
    } catch (e) {
      set(s => ({
        assets: s.assets.map(a =>
          a.id === id
            ? { ...a, status: 'error' as const, errorMessage: (e as Error).message }
            : a
        ),
      }));
    }
  },

  removeAsset: (id) => set(s => ({ assets: s.assets.filter(a => a.id !== id) })),

  getAsset: (id) => get().assets.find(a => a.id === id),
}));
