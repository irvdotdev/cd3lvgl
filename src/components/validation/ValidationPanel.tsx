import { useMemo } from 'react';
import { useSceneStore } from '../../store/sceneStore';
import { validateScene } from '../../utils/validation';
import { SCREEN_WIDTH, SCREEN_HEIGHT } from '../../constants/display';
import type { ValidationIssue } from '../../utils/validation';

export function ValidationPanel() {
  const widgets = useSceneStore(s => s.widgets);
  const backgroundColor = useSceneStore(s => s.backgroundColor);
  const selectWidget = useSceneStore(s => s.selectWidget);

  const issues: ValidationIssue[] = useMemo(() => {
    return validateScene({
      name: '',
      screenWidth: SCREEN_WIDTH,
      screenHeight: SCREEN_HEIGHT,
      backgroundColor,
      widgets,
    });
  }, [widgets, backgroundColor]);

  const errors = issues.filter(i => i.severity === 'error');
  const warnings = issues.filter(i => i.severity === 'warning');

  if (issues.length === 0) {
    return (
      <div className="p-2">
        <p className="text-xs text-green-400">No issues found</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <h4 className="text-xs text-gray-500 uppercase tracking-wide">
        Validation ({errors.length} errors, {warnings.length} warnings)
      </h4>
      {issues.map((issue, i) => (
        <div
          key={i}
          className={`text-xs p-1.5 rounded cursor-pointer ${
            issue.severity === 'error'
              ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50'
              : 'bg-yellow-900/30 text-yellow-400 hover:bg-yellow-900/50'
          }`}
          onClick={() => selectWidget(issue.widgetId)}
        >
          <span className="font-mono">{issue.widgetId ? issue.widgetId.slice(0, 8) : 'Scene'}</span>: {issue.message}
        </div>
      ))}
    </div>
  );
}
