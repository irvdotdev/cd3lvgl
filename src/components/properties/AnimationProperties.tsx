import { useState } from 'react';
import type { Widget } from '../../types/widget';
import type { WidgetAnimation, AnimatableProperty, AnimationPath, AnimationTrigger } from '../../types/animation';
import { getTemplatesForType } from '../../constants/animationTemplates';

const labelCls = "block text-xs text-gray-400 mb-1";
const inputCls = "w-full bg-gray-700 text-white text-sm p-1.5 rounded border border-gray-600";
const sectionCls = "text-xs text-gray-500 uppercase tracking-wide mt-3 mb-1";

const ALL_PROPERTIES: AnimatableProperty[] = ['x', 'y', 'w', 'h', 'opacity', 'rotation', 'currentValue'];
const ALL_PATHS: AnimationPath[] = ['linear', 'ease_in', 'ease_out', 'ease_in_out', 'overshoot', 'bounce'];
const ALL_TRIGGERS: AnimationTrigger[] = ['auto', 'click'];

interface AnimationPropertiesProps {
  widget: Widget;
  onChange: (changes: Partial<Widget>) => void;
}

export function AnimationProperties({ widget, onChange }: AnimationPropertiesProps) {
  const animations = widget.animations || [];
  const [selectedTemplate, setSelectedTemplate] = useState('');

  const updateAnimation = (index: number, changes: Partial<WidgetAnimation>) => {
    const updated = animations.map((a, i) => i === index ? { ...a, ...changes } : a);
    onChange({ animations: updated });
  };

  const removeAnimation = (index: number) => {
    onChange({ animations: animations.filter((_, i) => i !== index) });
  };

  const addAnimation = () => {
    const newAnim: WidgetAnimation = {
      id: crypto.randomUUID(),
      property: 'x',
      startValue: 0,
      endValue: 100,
      duration: 1000,
      delay: 0,
      path: 'linear',
      repeatCount: 0,
      playback: false,
      trigger: 'auto',
    };
    onChange({ animations: [...animations, newAnim] });
  };

  const availableProperties = widget.type === 'gauge'
    ? ALL_PROPERTIES
    : ALL_PROPERTIES.filter(p => p !== 'currentValue');

  const templates = getTemplatesForType(widget.type);

  const handleTemplateSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const idx = Number(e.target.value);
    setSelectedTemplate('');
    if (isNaN(idx) || idx < 0) return;
    const template = templates[idx];
    if (!template) return;
    const newAnim = template.create(widget);
    onChange({ animations: [...animations, newAnim] });
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className={sectionCls}>Animations</p>
        <button
          className="text-xs text-blue-400 hover:text-blue-300"
          onClick={addAnimation}
        >
          + Add
        </button>
      </div>

      <select
        className={inputCls + ' mb-2'}
        value={selectedTemplate}
        onChange={handleTemplateSelect}
      >
        <option value="" disabled>Apply template...</option>
        {templates.map((t, i) => (
          <option key={t.name} value={i}>{t.name} — {t.description}</option>
        ))}
      </select>

      {animations.length === 0 && (
        <p className="text-xs text-gray-600 italic">No animations</p>
      )}

      {animations.map((anim, index) => (
        <div key={anim.id} className="bg-gray-750 border border-gray-600 rounded p-2 mb-2 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-300 font-medium">#{index + 1}</span>
            <button
              className="text-xs text-red-400 hover:text-red-300"
              onClick={() => removeAnimation(index)}
            >
              Remove
            </button>
          </div>

          <div>
            <label className={labelCls}>Property</label>
            <select className={inputCls} value={anim.property}
              onChange={e => updateAnimation(index, { property: e.target.value as AnimatableProperty })}>
              {availableProperties.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelCls}>Start</label>
              <input type="number" className={inputCls} value={anim.startValue}
                onChange={e => updateAnimation(index, { startValue: Number(e.target.value) })} />
            </div>
            <div>
              <label className={labelCls}>End</label>
              <input type="number" className={inputCls} value={anim.endValue}
                onChange={e => updateAnimation(index, { endValue: Number(e.target.value) })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelCls}>Duration (ms)</label>
              <input type="number" className={inputCls} value={anim.duration} min={1}
                onChange={e => updateAnimation(index, { duration: Number(e.target.value) })} />
            </div>
            <div>
              <label className={labelCls}>Delay (ms)</label>
              <input type="number" className={inputCls} value={anim.delay} min={0}
                onChange={e => updateAnimation(index, { delay: Number(e.target.value) })} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Easing</label>
            <select className={inputCls} value={anim.path}
              onChange={e => updateAnimation(index, { path: e.target.value as AnimationPath })}>
              {ALL_PATHS.map(p => (
                <option key={p} value={p}>{p.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelCls}>Repeat (-1=inf)</label>
              <input type="number" className={inputCls} value={anim.repeatCount} min={-1}
                onChange={e => updateAnimation(index, { repeatCount: Number(e.target.value) })} />
            </div>
            <div>
              <label className={labelCls}>Trigger</label>
              <select className={inputCls} value={anim.trigger}
                onChange={e => updateAnimation(index, { trigger: e.target.value as AnimationTrigger })}>
                {ALL_TRIGGERS.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <label className="flex items-center gap-1.5 text-xs text-gray-400 cursor-pointer">
            <input type="checkbox" checked={anim.playback}
              onChange={e => updateAnimation(index, { playback: e.target.checked })} />
            Playback (reverse)
          </label>
        </div>
      ))}
    </div>
  );
}
