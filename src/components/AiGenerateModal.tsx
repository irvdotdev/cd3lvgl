import { useState, useRef, useEffect, useCallback } from 'react';
import type { Scene } from '../types/widget';
import { generateSceneFromImage } from '../utils/aiGenerate';

const LS_KEY = 'cd3lvgl_anthropic_api_key';

type ModalState =
  | { step: 'input' }
  | { step: 'generating' }
  | { step: 'result'; scene: Scene; widgetCount: number }
  | { step: 'error'; message: string };

interface Props {
  onClose: () => void;
  onApply: (scene: Scene) => void;
}

export function AiGenerateModal({ onClose, onApply }: Props) {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(LS_KEY) || '');
  const [remember, setRemember] = useState(() => !!localStorage.getItem(LS_KEY));
  const [imageData, setImageData] = useState<{ base64: string; mediaType: string; name: string } | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [state, setState] = useState<ModalState>({ step: 'input' });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      // Extract base64 and media type from data URL
      const match = dataUrl.match(/^data:(image\/\w+);base64,(.+)$/);
      if (match) {
        setImageData({ base64: match[2], mediaType: match[1], name: file.name });
        setPreview(dataUrl);
      }
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleGenerate = async () => {
    if (!apiKey.trim()) {
      setState({ step: 'error', message: 'Please enter your Anthropic API key.' });
      return;
    }
    if (!imageData) {
      setState({ step: 'error', message: 'Please select an image file.' });
      return;
    }

    // Persist or clear API key
    if (remember) {
      localStorage.setItem(LS_KEY, apiKey);
    } else {
      localStorage.removeItem(LS_KEY);
    }

    const allowedMediaTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'] as const;
    type AllowedMediaType = typeof allowedMediaTypes[number];
    if (!allowedMediaTypes.includes(imageData.mediaType as AllowedMediaType)) {
      setState({ step: 'error', message: `Unsupported image type: ${imageData.mediaType}` });
      return;
    }

    setState({ step: 'generating' });

    try {
      const { scene, widgetCount } = await generateSceneFromImage(
        apiKey.trim(),
        imageData.base64,
        imageData.mediaType as AllowedMediaType,
        { name: imageData.name.replace(/\.\w+$/, '') },
      );
      setState({ step: 'result', scene, widgetCount });
    } catch (err) {
      setState({ step: 'error', message: err instanceof Error ? err.message : String(err) });
    }
  };

  const handleApply = () => {
    if (state.step === 'result') {
      onApply(state.scene);
      onClose();
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current) onClose();
  };

  const widgetBreakdown = () => {
    if (state.step !== 'result') return '';
    const counts: Record<string, number> = {};
    for (const w of state.scene.widgets) {
      counts[w.type] = (counts[w.type] || 0) + 1;
    }
    return Object.entries(counts).map(([t, c]) => `${c} ${t}`).join(', ');
  };

  const btnClass = 'px-3 py-1.5 text-xs rounded bg-gray-700 hover:bg-gray-600 text-gray-200 transition-colors';
  const primaryBtnClass = 'px-3 py-1.5 text-xs rounded bg-blue-600 hover:bg-blue-500 text-white transition-colors';

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl w-[420px] max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
          <h2 className="text-sm font-bold text-gray-200">AI Generate Scene</h2>
          <button className="text-gray-400 hover:text-gray-200 text-lg leading-none" onClick={onClose}>&times;</button>
        </div>

        <div className="px-4 py-4 space-y-4">
          {/* API Key */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Anthropic API Key</label>
            <input
              type="password"
              className="w-full px-2 py-1.5 text-xs bg-gray-900 border border-gray-600 rounded text-gray-200 focus:outline-none focus:border-blue-500"
              placeholder="sk-ant-..."
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              disabled={state.step === 'generating'}
            />
            <label className="flex items-center gap-1.5 mt-1.5 text-xs text-gray-400 cursor-pointer">
              <input
                type="checkbox"
                checked={remember}
                onChange={e => setRemember(e.target.checked)}
                className="rounded"
              />
              Remember key in browser
            </label>
            {remember && (
              <p className="mt-1 text-xs text-yellow-600">
                Warning: API keys stored in the browser can be exposed by browser extensions or XSS attacks.
              </p>
            )}
          </div>

          {/* Image Picker */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Design Image</label>
            <div className="flex items-center gap-2">
              <button
                className={btnClass}
                onClick={() => fileInputRef.current?.click()}
                disabled={state.step === 'generating'}
              >
                Choose Image
              </button>
              {imageData && <span className="text-xs text-gray-400 truncate max-w-[200px]">{imageData.name}</span>}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={handleFileChange}
            />
            {preview && (
              <img
                src={preview}
                alt="Preview"
                className="mt-2 w-32 h-32 object-contain rounded border border-gray-600 bg-gray-900"
              />
            )}
          </div>

          {/* State-dependent content */}
          {state.step === 'generating' && (
            <div className="flex items-center gap-2 text-xs text-gray-300 py-2">
              <svg className="animate-spin h-4 w-4 text-blue-400" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Analyzing design with Claude...
            </div>
          )}

          {state.step === 'error' && (
            <div className="text-xs text-red-400 bg-red-900/20 border border-red-800 rounded px-3 py-2">
              {state.message}
            </div>
          )}

          {state.step === 'result' && (
            <div className="text-xs text-green-400 bg-green-900/20 border border-green-800 rounded px-3 py-2">
              <p className="font-bold">Generated {state.widgetCount} widget{state.widgetCount !== 1 ? 's' : ''}</p>
              <p className="text-gray-400 mt-1">{widgetBreakdown()}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-4 py-3 border-t border-gray-700">
          <button className={btnClass} onClick={onClose}>Cancel</button>

          {state.step === 'result' ? (
            <button className={primaryBtnClass} onClick={handleApply}>
              Apply to Canvas
            </button>
          ) : (
            <button
              className={primaryBtnClass}
              onClick={handleGenerate}
              disabled={state.step === 'generating'}
            >
              {state.step === 'generating' ? 'Generating...' : 'Generate'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
