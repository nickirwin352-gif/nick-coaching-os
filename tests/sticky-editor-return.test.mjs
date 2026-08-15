import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../src/sticky-editor-return.js', import.meta.url), 'utf8');
const stickySource = await readFile(new URL('../src/sticky-session-diagrams-fix.js', import.meta.url), 'utf8');

test('sticky session dock hides during diagram editing', () => {
  assert.match(source, /stickyDiagramEditing \.currentSessionDock/);
  assert.match(source, /enterStickyDiagramEdit/);
});

test('diagram editing has a clear return to advanced builder control', () => {
  assert.match(source, /Back to Advanced Builder/);
  assert.match(source, /showBuildRoute\('advanced'\)/);
  assert.match(source, /returnToAdvancedBuilder/);
});

test('sticky diagram edit action enters focused edit mode before opening studio', () => {
  assert.match(stickySource, /enterStickyDiagramEdit/);
  assert.match(stickySource, /openSessionDiagramStudio/);
});
