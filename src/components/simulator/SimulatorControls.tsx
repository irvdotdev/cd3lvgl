interface SimulatorControlsProps {
  playing: boolean;
  elapsed: number;
  onTogglePlay: () => void;
  onReset: () => void;
}

export function SimulatorControls({ playing, elapsed, onTogglePlay, onReset }: SimulatorControlsProps) {
  const btnClass = "px-3 py-1.5 text-xs rounded bg-gray-700 hover:bg-gray-600 text-gray-200 transition-colors";
  const activeBtnClass = "px-3 py-1.5 text-xs rounded bg-blue-600 hover:bg-blue-500 text-white transition-colors";

  const formatted = (elapsed / 1000).toFixed(3) + 's';

  return (
    <div className="flex items-center gap-2">
      <button className={playing ? activeBtnClass : btnClass} onClick={onTogglePlay}>
        {playing ? 'Pause' : 'Play'}
      </button>
      <button className={btnClass} onClick={onReset}>
        Reset
      </button>
      <span className="text-xs text-gray-400 font-mono">{formatted}</span>
    </div>
  );
}
