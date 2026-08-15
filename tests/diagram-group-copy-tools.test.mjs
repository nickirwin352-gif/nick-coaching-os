import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../src/diagram-group-copy-tools.js', import.meta.url), 'utf8');
const interaction = await readFile(new URL('../src/practice-editor-interaction-revamp.js', import.meta.url), 'utf8');

test('diagram editor offers drag group selection and three copy directions', () => {
  assert.match(source, /Select Group/);
  assert.match(source, /Copy ↔ Other Side/);
  assert.match(source, /Copy ↕ Other Half/);
  assert.match(source, /Copy ⇲ Opposite Quarter/);
  assert.match(source, /dsGroupSelectionBox/);
});

test('copying keeps selected items together and remaps attached movements', () => {
  assert.match(source, /idMap/);
  assert.match(source, /attachStart/);
  assert.match(source, /attachEnd/);
  assert.match(source, /state\.selectedIds = new Set\(copies/);
});

test('arrowheads use a visible medium marker size', () => {
  assert.match(interaction, /markerWidth', '9'/);
  assert.match(interaction, /markerHeight', '9'/);
  assert.match(interaction, /M0,0 L0,9 L9,4\.5 z/);
});
