import { useEffect, useRef } from 'react';

export interface ContextMenuState {
  screenX: number;
  screenY: number;
  canvasX: number;
  canvasY: number;
  widgetId: string | null;
}

interface ContextMenuProps {
  state: ContextMenuState;
  onClose: () => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onCenterH: (id: string) => void;
  onCenterV: (id: string) => void;
  onBringToFront: (id: string) => void;
  onSendToBack: (id: string) => void;
  onMoveToForeground: (id: string) => void;
  onMoveToBackground: (id: string) => void;
  onAddText: (pos: { x: number; y: number }) => void;
  onAddImage: (pos: { x: number; y: number }) => void;
  onAddGauge: (pos: { x: number; y: number }) => void;
}

export function ContextMenu({
  state,
  onClose,
  onDuplicate,
  onDelete,
  onCenterH,
  onCenterV,
  onBringToFront,
  onSendToBack,
  onMoveToForeground,
  onMoveToBackground,
  onAddText,
  onAddImage,
  onAddGauge,
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Clamp position to viewport
  const x = Math.min(state.screenX, window.innerWidth - 200);
  const y = Math.min(state.screenY, window.innerHeight - 300);

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const pos = { x: state.canvasX, y: state.canvasY };
  const wid = state.widgetId;

  const itemClass =
    'px-3 py-1.5 text-sm text-gray-200 hover:bg-gray-700 cursor-pointer whitespace-nowrap';

  return (
    <div
      ref={menuRef}
      className="fixed bg-gray-800 border border-gray-700 rounded shadow-lg py-1 min-w-[180px]"
      style={{ left: x, top: y, zIndex: 9999 }}
    >
      {wid && (
        <>
          <div className={itemClass} onClick={() => { onDuplicate(wid); onClose(); }}>
            Duplicate
          </div>
          <div className={itemClass} onClick={() => { onDelete(wid); onClose(); }}>
            Delete
          </div>
          <div className="border-t border-gray-700 my-1" />
          <div className={itemClass} onClick={() => { onCenterH(wid); onClose(); }}>
            Center Horizontally
          </div>
          <div className={itemClass} onClick={() => { onCenterV(wid); onClose(); }}>
            Center Vertically
          </div>
          <div className="border-t border-gray-700 my-1" />
          <div className={itemClass} onClick={() => { onBringToFront(wid); onClose(); }}>
            Bring to Front
          </div>
          <div className={itemClass} onClick={() => { onSendToBack(wid); onClose(); }}>
            Send to Back
          </div>
          <div className={itemClass} onClick={() => { onMoveToForeground(wid); onClose(); }}>
            Move to Foreground
          </div>
          <div className={itemClass} onClick={() => { onMoveToBackground(wid); onClose(); }}>
            Move to Background
          </div>
          <div className="border-t border-gray-700 my-1" />
        </>
      )}
      <div className={itemClass} onClick={() => { onAddText(pos); onClose(); }}>
        Add Text Here
      </div>
      <div className={itemClass} onClick={() => { onAddImage(pos); onClose(); }}>
        Add Image Here
      </div>
      <div className={itemClass} onClick={() => { onAddGauge(pos); onClose(); }}>
        Add Gauge Here
      </div>
    </div>
  );
}
