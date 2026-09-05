import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  ADVANCED_BUILDER_VISUAL_FOCUS_VERSION,
  VISUAL_PICKER_PAGE_SIZE,
  SESSION_PREVIEW_PAGE_SIZE
} from '../src/advanced-builder-visual-focus-v1.js';

const source = await readFile(new URL('../src/advanced-builder-visual-focus-v1.js', import.meta.url),'utf8');
const sessionState = await readFile(new URL('../src/session-state.js', import.meta.url),'utf8');

test('builder visual focus uses fewer, larger practice options', () => {
  assert.equal(ADVANCED_BUILDER_VISUAL_FOCUS_VERSION,1);
  assert.equal(VISUAL_PICKER_PAGE_SIZE,3);
  assert.equal(SESSION_PREVIEW_PAGE_SIZE,1);
  assert.match(source,/#visualPicker \.pitchCard/);
  assert.match(source,/height:275px!important/);
  assert.match(source,/grid-template-columns:minmax\(420px,52%\)/);
});

test('session preview focuses one practice at a time with a larger diagram', () => {
  assert.match(source,/#preview \.practiceDetail \.pitchMini/);
  assert.match(source,/height:300px!important/);
  assert.match(source,/detail\.hidden = index !== previewPage/);
  assert.match(source,/Practice/);
});

test('practice chooser paginates and keeps theme headers in sync', () => {
  assert.match(source,/VISUAL_PICKER_PAGE_SIZE/);
  assert.match(source,/card\.hidden = index < start \|\| index >= end/);
  assert.match(source,/syncThemeHeaders/);
  assert.match(source,/Previous/);
  assert.match(source,/Next/);
});

test('builder focus loads after existing practice and game-model enhancements', () => {
  const banks = sessionState.indexOf("import('./practice-editor-collapsible-word-banks-v1.js')");
  const focus = sessionState.indexOf("import('./advanced-builder-visual-focus-v1.js')");
  assert.ok(banks >= 0 && focus > banks);
});
