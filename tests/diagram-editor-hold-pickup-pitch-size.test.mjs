import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../src/diagram-editor-hold-pickup-pitch-size.js', import.meta.url), 'utf8');
const sessionState = await readFile(new URL('../src/session-state.js', import.meta.url), 'utf8');

test('holding over an object always routes to pickup before group selection', () => {
  assert.match(source, /function forceObjectPickup/);
  assert.match(source, /dsObjectPointerDown\(event, object\.id\)/);
  assert.match(source, /stopImmediatePropagation/);
  assert.match(source, /Window capture beats the older document-level group-selection handler/);
});

test('group cursor only reflects an active drag selection box', () => {
  assert.match(source, /document\.querySelector\('\.coachDragSelectBox'\)/);
  assert.match(source, /classList\.toggle\('coachGroupSelecting', selecting\)/);
});

test('line tool is visually moved into the objects palette', () => {
  assert.match(source, /#diagramCoachWorkflowBar \[data-coach-basic-line\]\{display:none!important\}/);
  assert.match(source, /findObjectsPaletteRow/);
  assert.match(source, /className = 'dsPaletteButton'/);
  assert.match(source, /<span>Line<\/span>/);
});

test('pitch workspace is substantially enlarged', () => {
  assert.match(source, /max-width:1780px!important/);
  assert.match(source, /height:calc\(100dvh - 86px\)!important/);
  assert.match(source, /min-height:560px!important/);
});

test('new interaction pass loads after previous diagram passes', () => {
  const previous = sessionState.indexOf("import('./diagram-editor-pickup-line-pass.js')");
  const next = sessionState.indexOf("import('./diagram-editor-hold-pickup-pitch-size.js')");
  assert.ok(previous >= 0 && next > previous);
});
