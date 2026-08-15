import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../src/sticky-editor-return.js', import.meta.url), 'utf8');
const stickySource = await readFile(new URL('../src/sticky-session-diagrams-fix.js', import.meta.url), 'utf8');

test('sticky session dock hides while the real session editor host is active', () => {
  assert.match(source, /dsSessionDiagramHost/);
  assert.match(source, /classList\.contains\('active'\)/);
  assert.match(source, /stickyDiagramEditing #currentSessionDock/);
  assert.match(source, /MutationObserver/);
});

test('session editor banner becomes a clear return to advanced builder control', () => {
  assert.match(source, /dsSessionEditBanner/);
  assert.match(source, /Back to Advanced Builder/);
  assert.match(source, /showBuildRoute\('advanced'\)/);
  assert.match(source, /returnToAdvancedBuilder/);
});

test('sticky diagram edit action enters focused edit mode before opening studio', () => {
  assert.match(stickySource, /enterStickyDiagramEdit/);
  assert.match(stickySource, /openSessionDiagramStudio/);
});
