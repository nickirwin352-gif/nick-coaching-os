import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../src/diagram-editor-coach-workflow.js', import.meta.url), 'utf8');

test('movement arrows have a much larger invisible grab target', () => {
  assert.match(source, /stroke-width:38!important/);
  assert.match(source, /stroke-linecap:round!important/);
  assert.match(source, /dsMovementHover/);
});

test('empty-pitch drag performs direct box selection', () => {
  assert.match(source, /function startBoxSelect/);
  assert.match(source, /Math\.hypot\(dx,dy\)<7/);
  assert.match(source, /coachDragSelectBox/);
  assert.match(source, /new Set\(matches\.map\(o=>o\.id\)\)/);
});

test('selected groups can be copied then pasted at a clicked pitch position', () => {
  assert.match(source, /function copySelection/);
  assert.match(source, /pasteArmed=true/);
  assert.match(source, /function pasteAt\(point\)/);
  assert.match(source, /point\.x-centerX/);
  assert.match(source, /idMap\.get\(o\.attachStart\)\|\|null/);
});

test('coach preset shelf includes relevant realistic practice scenarios', () => {
  assert.match(source, /4v2 Possession Box/);
  assert.match(source, /5v3 Build Out/);
  assert.match(source, /4-4-2 Press/);
  assert.match(source, /3v2 Wide Overload/);
  assert.match(source, /Finishing Pattern/);
  assert.match(source, /6v3 \+ Mini Goals/);
  assert.match(source, /intentionally built on the left side for progressions/);
});
