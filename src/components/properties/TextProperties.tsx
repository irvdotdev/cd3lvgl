import type { TextWidget } from '../../types/widget';
import { MAX_TEXT_BYTES } from '../../constants/display';

interface Props {
  widget: TextWidget;
  onChange: (changes: Partial<TextWidget>) => void;
}

const label = "block text-xs text-gray-400 mb-1";
const input = "w-full bg-gray-700 text-white text-sm p-1.5 rounded border border-gray-600";
const section = "text-xs text-gray-500 uppercase tracking-wide mt-2 mb-1";

export function TextProperties({ widget, onChange }: Props) {
  const byteLength = new TextEncoder().encode(widget.content).length;

  return (
    <div className="space-y-3">
      {/* Content */}
      <div>
        <label className={label}>Content</label>
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

      {/* Font */}
      <p className={section}>Font</p>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={label}>Size</label>
          <input type="number" className={input} value={widget.fontSize} min={6} max={128}
            onChange={e => onChange({ fontSize: Number(e.target.value) })} />
        </div>
        <div>
          <label className={label}>Color</label>
          <input type="color" className="w-full h-8 bg-gray-700 rounded border border-gray-600 cursor-pointer"
            value={widget.fontColor} onChange={e => onChange({ fontColor: e.target.value })} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={label}>Family</label>
          <select className={input} value={widget.fontFamily}
            onChange={e => onChange({ fontFamily: e.target.value })}>
            <option value="sans-serif">Sans Serif</option>
            <option value="serif">Serif</option>
            <option value="monospace">Monospace</option>
          </select>
        </div>
        <div>
          <label className={label}>Weight</label>
          <select className={input} value={widget.fontWeight}
            onChange={e => onChange({ fontWeight: e.target.value as 'normal' | 'bold' })}>
            <option value="normal">Normal</option>
            <option value="bold">Bold</option>
          </select>
        </div>
      </div>

      {/* Alignment */}
      <p className={section}>Alignment</p>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={label}>Horizontal</label>
          <select className={input} value={widget.align}
            onChange={e => onChange({ align: e.target.value as 'left' | 'center' | 'right' })}>
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
        </div>
        <div>
          <label className={label}>Vertical</label>
          <select className={input} value={widget.verticalAlign}
            onChange={e => onChange({ verticalAlign: e.target.value as 'top' | 'middle' | 'bottom' })}>
            <option value="top">Top</option>
            <option value="middle">Middle</option>
            <option value="bottom">Bottom</option>
          </select>
        </div>
      </div>

      {/* Spacing */}
      <p className={section}>Spacing</p>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={label}>Letter</label>
          <input type="number" className={input} value={widget.letterSpacing}
            onChange={e => onChange({ letterSpacing: Number(e.target.value) })} />
        </div>
        <div>
          <label className={label}>Line</label>
          <input type="number" className={input} value={widget.lineSpacing}
            onChange={e => onChange({ lineSpacing: Number(e.target.value) })} />
        </div>
      </div>

      {/* Decoration & Long Mode */}
      <p className={section}>Text Mode</p>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={label}>Decoration</label>
          <select className={input} value={widget.textDecoration}
            onChange={e => onChange({ textDecoration: e.target.value as 'none' | 'underline' | 'strikethrough' })}>
            <option value="none">None</option>
            <option value="underline">Underline</option>
            <option value="strikethrough">Strikethrough</option>
          </select>
        </div>
        <div>
          <label className={label}>Long Mode</label>
          <select className={input} value={widget.longMode}
            onChange={e => onChange({ longMode: e.target.value as 'wrap' | 'scroll' | 'dot' | 'clip' })}>
            <option value="wrap">Wrap</option>
            <option value="dot">Dot (...)</option>
            <option value="clip">Clip</option>
            <option value="scroll">Scroll</option>
          </select>
        </div>
      </div>
    </div>
  );
}
