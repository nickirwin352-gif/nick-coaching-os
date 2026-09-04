import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { COLLAPSIBLE_WORD_BANKS, COLLAPSIBLE_WORD_BANKS_VERSION } from '../src/practice-editor-collapsible-word-banks-v1.js';

const source = await readFile(new URL('../src/practice-editor-collapsible-word-banks-v1.js', import.meta.url),'utf8');
const sessionState = await readFile(new URL('../src/session-state.js', import.meta.url),'utf8');

test('only progression and regression banks are collapsed', () => {
  assert.equal(COLLAPSIBLE_WORD_BANKS_VERSION,1);
  assert.deepEqual(COLLAPSIBLE_WORD_BANKS.map(item=>item.chipsId),['progChips','regChips']);
  assert.ok(!COLLAPSIBLE_WORD_BANKS.some(item=>item.chipsId==='cpChips'));
});

test('word banks use closed details controls with explicit open and close affordance', () => {
  assert.match(source,/document\.createElement\('details'\)/);
  assert.match(source,/details\.open = false/);
  assert.match(source,/content:'Open'/);
  assert.match(source,/content:'Close'/);
});

test('editing or creating a practice resets the banks closed', () => {
  assert.match(source,/editPractice/);
  assert.match(source,/newPractice/);
  assert.match(source,/resetSoon\(\)/);
  assert.match(source,/collapsePracticeWordBanks/);
});

test('compact bank patch loads after practice tag save reliability', () => {
  const saveFix = sessionState.indexOf("import('./practice-tag-save-reliability-v5.js')");
  const banks = sessionState.indexOf("import('./practice-editor-collapsible-word-banks-v1.js')");
  assert.ok(saveFix >= 0 && banks > saveFix);
});
