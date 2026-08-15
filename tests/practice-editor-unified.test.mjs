import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../src/practice-editor-unified.js', import.meta.url), 'utf8');

test('unified editor keeps text and Diagram Studio in one workspace', () => {
  assert.match(source, /grid-template-columns:minmax\(330px,390px\) minmax\(0,1fr\)/);
  assert.match(source, /Write the practice on the left and build the diagram here/);
  assert.match(source, /unifiedWorkspaceReady/);
});

test('editing a practice clears stale diagram state before loading selected practice', () => {
  assert.match(source, /dsState = null/);
  assert.match(source, /practiceDiagramStepsDraft = dsPracticeSteps\(practice\)/);
  assert.match(source, /window\.editPractice = function\(id\)/);
});
