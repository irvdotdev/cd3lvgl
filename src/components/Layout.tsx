import { useEffect } from 'react';
import { Toolbar } from './Toolbar';
import { EditorCanvas } from './canvas/EditorCanvas';
import { PropertyPanel } from './properties/PropertyPanel';
import { WidgetList } from './sidebar/WidgetList';
import { AssetLibrary } from './sidebar/AssetLibrary';
import { SimulatorView } from './simulator/SimulatorView';
import { ValidationPanel } from './validation/ValidationPanel';
import { useSceneStore } from '../store/sceneStore';

export function Layout() {
  const showSimulator = useSceneStore(s => s.showSimulator);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      // Don't intercept when typing in inputs
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        return;
      }

      const { undo, redo, removeWidget, selectedWidgetId } = useSceneStore.getState();

      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedWidgetId) {
        e.preventDefault();
        removeWidget(selectedWidgetId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-gray-100">
      <Toolbar />
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-56 bg-gray-800 border-r border-gray-700 p-3 overflow-y-auto space-y-4">
          <WidgetList />
          <hr className="border-gray-700" />
          <AssetLibrary />
          <hr className="border-gray-700" />
          <ValidationPanel />
        </div>

        {/* Main Canvas Area */}
        <div className="flex-1 flex">
          {showSimulator ? (
            <div className="flex-1 flex items-center justify-center bg-gray-900 p-8">
              <SimulatorView />
            </div>
          ) : (
            <EditorCanvas />
          )}
        </div>

        {/* Right Panel */}
        <PropertyPanel />
      </div>
    </div>
  );
}
