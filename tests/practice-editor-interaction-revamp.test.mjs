import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../src/practice-editor-interaction-revamp.js', import.meta.url), 'utf8');

test('practice editor removes manual zoom and keeps pitch fitted', () => {
  assert.match(source, /dsZoomControls\{display:none!important\}/);
  assert.match(source, /fitPitchLarge/);
  assert.match(source, /horizontalRoom \/ dims\.w/);
  assert.match(source, /verticalRoom \/ dims\.h/);
  assert.match(source, /event\.stopImmediatePropagation\(\)/);
});

test('practice editor defaults to smooth free dragging', () => {
  assert.match(source, /dsState\.snap = false/);
  assert.match(source, /throttleGlobalDuringDrag\('dsRenderCanvas'\)/);
  assert.match(source, /requestAnimationFrame/);
  assert.match(source, /touch-action:none/);
});

test('practice editor uses medium visible arrowheads', () => {
  assert.match(source, /markerWidth', '9'/);
  assert.match(source, /markerUnits', 'userSpaceOnUse'/);
  assert.match(source, /M0,0 L0,9 L9,4\.5 z/);
});
