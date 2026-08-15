import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../src/practice-editor-studio-v2.js', import.meta.url), 'utf8');
const sessionState = await readFile(new URL('../src/session-state.js', import.meta.url), 'utf8');

test('Diagram Studio V2 guarantees a visible pitch viewport with flexible layout', () => {
  assert.match(source, /display:flex!important/);
  assert.match(source, /flex-direction:column!important/);
  assert.match(source, /dsViewport/);
  assert.match(source, /min-height:430px!important/);
  assert.match(source, /flex:1 1 470px!important/);
  assert.match(source, /fitPitch/);
});

test('Diagram Studio V2 consolidates selection copy actions into one command bar', () => {
  assert.match(source, /diagramGroupCopyTools\{display:none!important\}/);
  assert.match(source, /Select Group/);
  assert.match(source, /Copy Side/);
  assert.match(source, /Copy Half/);
  assert.match(source, /Copy Quarter/);
  assert.match(source, /data-v2-copy/);
});

test('Diagram Studio V2 supports one-click progression creation', () => {
  assert.match(source, /addProgressionStep/);
  assert.match(source, /dsDuplicateStep/);
  assert.match(source, /Progression \$\{s\.currentStep \+ 1\}/);
  assert.match(source, /step\.kind = 'progression'/);
});

test('Diagram Studio V2 loads after the existing editor interaction modules', () => {
  const groupIndex = sessionState.indexOf("import('./diagram-group-copy-tools.js')");
  const v2Index = sessionState.indexOf("import('./practice-editor-studio-v2.js')");
  assert.ok(groupIndex >= 0 && v2Index > groupIndex);
});
