import { create } from 'zustand';
import type { Widget, HistoryEntry } from '../types/widget';

const MAX_HISTORY = 50;

interface SceneState {
  widgets: Widget[];
  selectedWidgetId: string | null;
  backgroundColor: string;
  showGrid: boolean;
  showSimulator: boolean;
  animationMode: boolean;
  snapBack: boolean;
  showBoundary: boolean;
  zoom: number;

  // History
  history: HistoryEntry[];
  historyIndex: number;

  // Actions
  addWidget: (widget: Widget) => void;
  updateWidget: (id: string, changes: Partial<Widget>) => void;
  removeWidget: (id: string) => void;
  selectWidget: (id: string | null) => void;
  reorderWidget: (id: string, newIndex: number) => void;
  duplicateWidget: (id: string) => void;
  moveWidgetToLayer: (id: string, layer: 0 | 1) => void;
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;
  setBackgroundColor: (color: string) => void;
  setWidgets: (widgets: Widget[]) => void;

  toggleGrid: () => void;
  toggleSimulator: () => void;
  toggleAnimationMode: () => void;
  toggleSnapBack: () => void;
  toggleBoundary: () => void;
  setZoom: (zoom: number) => void;

  undo: () => void;
  redo: () => void;
  pushHistory: () => void;
}

export const useSceneStore = create<SceneState>((set, get) => ({
  widgets: [],
  selectedWidgetId: null,
  backgroundColor: '#000000',
  showGrid: false,
  showSimulator: false,
  animationMode: false,
  snapBack: false,
  showBoundary: true,
  zoom: 1,

  history: [{ widgets: [], backgroundColor: '#000000' }],
  historyIndex: 0,

  addWidget: (widget) => {
    const state = get();
    state.pushHistory();
    set({ widgets: [...state.widgets, widget] });
  },

  updateWidget: (id, changes) => {
    const state = get();
    state.pushHistory();
    set({
      widgets: state.widgets.map(w =>
        w.id === id ? { ...w, ...changes } as Widget : w
      ),
    });
  },

  removeWidget: (id) => {
    const state = get();
    state.pushHistory();
    set({
      widgets: state.widgets.filter(w => w.id !== id),
      selectedWidgetId: state.selectedWidgetId === id ? null : state.selectedWidgetId,
    });
  },

  selectWidget: (id) => set({ selectedWidgetId: id }),

  reorderWidget: (id, newIndex) => {
    const state = get();
    state.pushHistory();
    const widgets = [...state.widgets];
    const oldIndex = widgets.findIndex(w => w.id === id);
    if (oldIndex === -1) return;
    const [widget] = widgets.splice(oldIndex, 1);
    widgets.splice(newIndex, 0, widget);
    set({ widgets });
  },

  duplicateWidget: (id) => {
    const state = get();
    const widget = state.widgets.find(w => w.id === id);
    if (!widget) return;
    state.pushHistory();
    const clone = { ...JSON.parse(JSON.stringify(widget)), id: crypto.randomUUID(), x: widget.x + 10, y: widget.y + 10 } as Widget;
    set({ widgets: [...state.widgets, clone], selectedWidgetId: clone.id });
  },

  moveWidgetToLayer: (id, layer) => {
    const state = get();
    const widget = state.widgets.find(w => w.id === id);
    if (!widget || widget.layer === layer) return;
    state.pushHistory();
    set({
      widgets: state.widgets.map(w =>
        w.id === id ? { ...w, layer } as Widget : w
      ),
    });
  },

  bringToFront: (id) => {
    const state = get();
    const idx = state.widgets.findIndex(w => w.id === id);
    if (idx === -1 || idx === state.widgets.length - 1) return;
    state.pushHistory();
    const widgets = [...state.widgets];
    const [widget] = widgets.splice(idx, 1);
    widgets.push(widget);
    set({ widgets });
  },

  sendToBack: (id) => {
    const state = get();
    const idx = state.widgets.findIndex(w => w.id === id);
    if (idx <= 0) return;
    state.pushHistory();
    const widgets = [...state.widgets];
    const [widget] = widgets.splice(idx, 1);
    widgets.unshift(widget);
    set({ widgets });
  },

  setBackgroundColor: (color) => {
    const state = get();
    state.pushHistory();
    set({ backgroundColor: color });
  },

  setWidgets: (widgets) => {
    const state = get();
    state.pushHistory();
    set({ widgets });
  },

  toggleGrid: () => set(s => ({ showGrid: !s.showGrid })),
  toggleSimulator: () => set(s => ({
    showSimulator: !s.showSimulator,
    ...(!s.showSimulator ? { animationMode: false } : {}),
  })),
  toggleAnimationMode: () => set(s => ({
    animationMode: !s.animationMode,
    ...(!s.animationMode ? { showSimulator: false, selectedWidgetId: null } : {}),
  })),
  toggleSnapBack: () => set(s => ({ snapBack: !s.snapBack })),
  toggleBoundary: () => set(s => ({ showBoundary: !s.showBoundary })),
  setZoom: (zoom) => set({ zoom: Math.max(0.25, Math.min(4, zoom)) }),

  pushHistory: () => {
    const state = get();
    const entry: HistoryEntry = {
      widgets: JSON.parse(JSON.stringify(state.widgets)),
      backgroundColor: state.backgroundColor,
    };
    const newHistory = state.history.slice(0, state.historyIndex + 1);
    newHistory.push(entry);
    if (newHistory.length > MAX_HISTORY) newHistory.shift();
    set({ history: newHistory, historyIndex: newHistory.length - 1 });
  },

  undo: () => {
    const state = get();
    if (state.historyIndex <= 0) return;
    const newIndex = state.historyIndex - 1;
    const entry = state.history[newIndex];
    set({
      widgets: JSON.parse(JSON.stringify(entry.widgets)),
      backgroundColor: entry.backgroundColor,
      historyIndex: newIndex,
    });
  },

  redo: () => {
    const state = get();
    if (state.historyIndex >= state.history.length - 1) return;
    const newIndex = state.historyIndex + 1;
    const entry = state.history[newIndex];
    set({
      widgets: JSON.parse(JSON.stringify(entry.widgets)),
      backgroundColor: entry.backgroundColor,
      historyIndex: newIndex,
    });
  },
}));
