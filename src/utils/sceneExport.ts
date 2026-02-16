import type { Scene, Widget } from '../types/widget';
import { SCREEN_WIDTH, SCREEN_HEIGHT } from '../constants/display';
import { validateScene, hasErrors } from './validation';

export function exportScene(
  widgets: Widget[],
  backgroundColor: string,
  name: string = 'Untitled Scene'
): { json: string; errors: string[] } {
  const scene: Scene = {
    name,
    screenWidth: SCREEN_WIDTH,
    screenHeight: SCREEN_HEIGHT,
    backgroundColor,
    widgets,
  };

  const issues = validateScene(scene);
  if (hasErrors(issues)) {
    return {
      json: '',
      errors: issues.filter(i => i.severity === 'error').map(i => `${i.widgetId}: ${i.message}`),
    };
  }

  return { json: JSON.stringify(scene, null, 2), errors: [] };
}

export function importScene(json: string): { scene: Scene | null; errors: string[] } {
  try {
    const parsed = JSON.parse(json);

    if (!parsed.widgets || !Array.isArray(parsed.widgets)) {
      return { scene: null, errors: ['Invalid scene: missing widgets array'] };
    }

    const scene: Scene = {
      name: parsed.name || 'Imported Scene',
      screenWidth: parsed.screenWidth || SCREEN_WIDTH,
      screenHeight: parsed.screenHeight || SCREEN_HEIGHT,
      backgroundColor: parsed.backgroundColor || '#000000',
      widgets: parsed.widgets.map((w: Record<string, unknown>) => ({
        id: w.id || crypto.randomUUID(),
        type: w.type || 'text',
        layer: w.layer ?? 1,
        x: w.x || 0,
        y: w.y || 0,
        w: w.w || 100,
        h: w.h || 50,
        clickable: w.clickable ?? false,
        visible: w.visible ?? true,
        ...w,
      })) as Widget[],
    };

    const issues = validateScene(scene);
    const warnings = issues.filter(i => i.severity === 'warning').map(i => `${i.widgetId}: ${i.message}`);

    return { scene, errors: warnings };
  } catch (e) {
    return { scene: null, errors: [`Failed to parse JSON: ${(e as Error).message}`] };
  }
}

export function downloadJson(json: string, filename: string = 'scene.json') {
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
