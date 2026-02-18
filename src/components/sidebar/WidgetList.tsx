import { useState } from 'react';
import { useSceneStore } from '../../store/sceneStore';

export function WidgetList() {
  const widgets = useSceneStore(s => s.widgets);
  const selectedWidgetId = useSceneStore(s => s.selectedWidgetId);
  const selectWidget = useSceneStore(s => s.selectWidget);
  const reorderWidget = useSceneStore(s => s.reorderWidget);
  const moveWidgetToLayer = useSceneStore(s => s.moveWidgetToLayer);

  const [dragOverLayer, setDragOverLayer] = useState<0 | 1 | null>(null);

  const layer0 = widgets.filter(w => w.layer === 0);
  const layer1 = widgets.filter(w => w.layer === 1);

  const renderWidget = (w: typeof widgets[0]) => (
    <div
      key={w.id}
      className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer text-sm ${
        selectedWidgetId === w.id
          ? 'bg-blue-600 text-white'
          : 'text-gray-300 hover:bg-gray-700'
      }`}
      onClick={() => selectWidget(w.id)}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('widget-id', w.id);
        e.dataTransfer.setData('widget-index', String(widgets.indexOf(w)));
      }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        setDragOverLayer(null);
        const draggedId = e.dataTransfer.getData('widget-id');
        if (!draggedId) return;
        const dragged = widgets.find(wg => wg.id === draggedId);
        if (dragged && dragged.layer !== w.layer) {
          moveWidgetToLayer(draggedId, w.layer);
        }
        const targetIndex = widgets.indexOf(w);
        if (targetIndex >= 0) {
          reorderWidget(draggedId, targetIndex);
        }
      }}
    >
      <span className="text-xs opacity-50 uppercase w-10">{w.type}</span>
      <span className="truncate flex-1">
        {w.type === 'text' ? (w as { content: string }).content?.slice(0, 20) || 'Text' : w.type}
      </span>
      {!w.visible && <span className="text-xs opacity-40">hidden</span>}
    </div>
  );

  const layerHeaderClass = (layer: 0 | 1) =>
    `text-xs text-gray-500 mb-1 px-1 py-0.5 rounded transition-colors ${
      dragOverLayer === layer ? 'bg-blue-600/30 text-blue-300' : ''
    }`;

  return (
    <div className="space-y-2">
      <h4 className="text-xs text-gray-500 uppercase tracking-wide">Widgets</h4>
      {widgets.length === 0 && (
        <p className="text-xs text-gray-500 italic">No widgets yet</p>
      )}
      {layer0.length > 0 && (
        <div>
          <p
            className={layerHeaderClass(0)}
            onDragOver={(e) => { e.preventDefault(); setDragOverLayer(0); }}
            onDragLeave={() => setDragOverLayer(null)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOverLayer(null);
              const draggedId = e.dataTransfer.getData('widget-id');
              if (draggedId) moveWidgetToLayer(draggedId, 0);
            }}
          >
            Layer 0
          </p>
          {layer0.map(renderWidget)}
        </div>
      )}
      {layer1.length > 0 && (
        <div>
          <p
            className={layerHeaderClass(1)}
            onDragOver={(e) => { e.preventDefault(); setDragOverLayer(1); }}
            onDragLeave={() => setDragOverLayer(null)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOverLayer(null);
              const draggedId = e.dataTransfer.getData('widget-id');
              if (draggedId) moveWidgetToLayer(draggedId, 1);
            }}
          >
            Layer 1
          </p>
          {layer1.map(renderWidget)}
        </div>
      )}
    </div>
  );
}
