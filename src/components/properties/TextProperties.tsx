import type { TextWidget } from '../../types/widget';
import { MAX_TEXT_BYTES } from '../../constants/display';

interface Props {
  widget: TextWidget;
  onChange: (changes: Partial<TextWidget>) => void;
}

export function TextProperties({ widget, onChange }: Props) {
  const byteLength = new TextEncoder().encode(widget.content).length;

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs text-gray-400 mb-1">Content</label>
        <textarea
          className="w-full bg-gray-700 text-white text-sm p-2 rounded border border-gray-600"
          rows={3}
          value={widget.content}
          onChange={e => onChange({ content: e.target.value })}
        />
        <span className={`text-xs ${byteLength > MAX_TEXT_BYTES ? 'text-red-400' : 'text-gray-500'}`}>
          {byteLength}/{MAX_TEXT_BYTES} bytes
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Font Size</label>
          <input
            type="number"
            className="w-full bg-gray-700 text-white text-sm p-1.5 rounded border border-gray-600"
            value={widget.fontSize}
            min={8}
            max={72}
            onChange={e => onChange({ fontSize: Number(e.target.value) })}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Color</label>
          <input
            type="color"
            className="w-full h-8 bg-gray-700 rounded border border-gray-600 cursor-pointer"
            value={widget.fontColor}
            onChange={e => onChange({ fontColor: e.target.value })}
          />
        </div>
      </div>
      <div>
        <label className="block text-xs text-gray-400 mb-1">Align</label>
        <select
          className="w-full bg-gray-700 text-white text-sm p-1.5 rounded border border-gray-600"
          value={widget.align}
          onChange={e => onChange({ align: e.target.value as 'left' | 'center' | 'right' })}
        >
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
        </select>
      </div>
    </div>
  );
}
