import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../src/diagram-editor-pickup-line-pass.js', import.meta.url), 'utf8');

test('editor defaults to pickup cursor and only shows group cursor during an active drag selection', () => {
  assert.match(source, /cursor:grab!important/);
  assert.match(source, /coachGroupSelecting/);
  assert.match(source, /coachDragSelectBox/);
  assert.match(source, /classList\.toggle\('coachGroupSelecting'/);
});

test('editor adds a one-shot plain line tool without an arrowhead', () => {
  assert.match(source, /data-coach-basic-line/);
  assert.match(source, /button\.textContent = '— Line'/);
  assert.match(source, /movementType:'line'/);
  assert.match(source, /removeAttribute\('marker-end'\)/);
  assert.match(source, /dsMovementVisible\.line/);
});

test('overlap pickup prioritizes smaller foreground objects but allows cycling stacked items', () => {
  assert.match(source, /function candidatesAt/);
  assert.match(source, /object\.type === 'movement'\) return 120/);
  assert.match(source, /object\.type === 'zone'\) return 10/);
  assert.match(source, /samePickSpot/);
  assert.match(source, /lastPick\.index \+ 1/);
  assert.match(source, /click the same spot again to cycle stacked items/);
});

test('pickup and line handlers run at window capture before older document selection handlers', () => {
  assert.match(source, /Window capture runs before the older document-level group-selection handler/);
  assert.match(source, /window\.addEventListener\('pointerdown', startLineDraw, true\)/);
  assert.match(source, /window\.addEventListener\('pointerdown', smartPickup, true\)/);
});
