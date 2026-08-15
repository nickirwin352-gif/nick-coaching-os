import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const state = fs.readFileSync(new URL('../src/session-state.js', import.meta.url), 'utf8');

test('practice editor enhancement loads after existing session usability modules', () => {
  const usabilityIndex = state.indexOf("import('./session-usability-pass.js')");
  const editorIndex = state.indexOf("import('./practice-editor-unified.js')");
  assert.ok(usabilityIndex >= 0);
  assert.ok(editorIndex > usabilityIndex);
});
