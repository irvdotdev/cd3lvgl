import type { Widget, Scene } from '../types/widget';
import { MAX_TEXT_BYTES, MAX_PATH_LENGTH, isWidgetInsideDisplay } from '../constants/display';

export type Severity = 'error' | 'warning';

export interface ValidationIssue {
  widgetId: string;
  field: string;
  message: string;
  severity: Severity;
}

function textByteLength(text: string): number {
  return new TextEncoder().encode(text).length;
}

export function validateWidget(widget: Widget, allWidgets: Widget[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // Check D-shape bounds
  if (!isWidgetInsideDisplay(widget)) {
    issues.push({ widgetId: widget.id, field: 'bounds', message: 'Widget extends outside circular display boundary', severity: 'warning' });
  }

  // Check layer
  if (widget.layer !== 0 && widget.layer !== 1) {
    issues.push({ widgetId: widget.id, field: 'layer', message: 'Layer must be 0 or 1', severity: 'error' });
  }

  // Type-specific validation
  if (widget.type === 'text') {
    if (!widget.content) {
      issues.push({ widgetId: widget.id, field: 'content', message: 'Text content is empty', severity: 'warning' });
    }
    if (textByteLength(widget.content) > MAX_TEXT_BYTES) {
      issues.push({ widgetId: widget.id, field: 'content', message: `Text exceeds ${MAX_TEXT_BYTES} bytes`, severity: 'error' });
    }
  }

  if (widget.type === 'image') {
    if (!widget.imagePath) {
      issues.push({ widgetId: widget.id, field: 'imagePath', message: 'Image path is empty', severity: 'error' });
    }
    if (widget.imagePath.length > MAX_PATH_LENGTH) {
      issues.push({ widgetId: widget.id, field: 'imagePath', message: `Image path exceeds ${MAX_PATH_LENGTH} characters`, severity: 'error' });
    }
  }

  // Check duplicate IDs
  const dupes = allWidgets.filter(w => w.id === widget.id);
  if (dupes.length > 1) {
    issues.push({ widgetId: widget.id, field: 'id', message: 'Duplicate widget ID', severity: 'error' });
  }

  return issues;
}

export function validateScene(scene: Scene): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  for (const widget of scene.widgets) {
    issues.push(...validateWidget(widget, scene.widgets));
  }
  return issues;
}

export function hasErrors(issues: ValidationIssue[]): boolean {
  return issues.some(i => i.severity === 'error');
}
