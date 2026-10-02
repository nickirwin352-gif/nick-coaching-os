import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const sessionState=await readFile(new URL('../src/session-state.js',import.meta.url),'utf8');
const os=await readFile(new URL('../src/four-phase-game-model-os-v1.js',import.meta.url),'utf8');
const practice=await readFile(new URL('../src/four-phase-practice-system-v1.js',import.meta.url),'utf8');

test('runtime loads only the new four-phase game-model stack', () => {
  assert.match(sessionState,/four-phase-practice-persistence-v1\.js/);
  assert.match(sessionState,/four-phase-game-model-os-v1\.js/);
  assert.match(sessionState,/four-phase-practice-system-v1\.js/);
  assert.doesNotMatch(sessionState,/game-model-operating-system\.js/);
  assert.doesNotMatch(sessionState,/game-context-practice-system-v3\.js/);
  assert.doesNotMatch(sessionState,/practice-library-auto-organiser-v4\.js/);
  assert.doesNotMatch(sessionState,/practice-filter-workbench-v5\.js/);
});

test('advanced builder is phase then main principle then sub-principles', () => {
  assert.match(os,/Game Model · Four Phases/);
  assert.match(os,/PHASE/);
  assert.match(os,/MAIN PRINCIPLE/);
  assert.match(os,/SUB-PRINCIPLES/);
  assert.match(os,/SUCCESS LOOKS LIKE/);
  assert.match(os,/Did the principle land\?/);
});

test('practice workbench and finder share one strict filter engine', () => {
  assert.match(practice,/Practice Workbench · Four-Phase Model/);
  assert.match(practice,/Find Practices · Same Workbench/);
  assert.match(practice,/matchesPracticeFilters/);
  assert.match(practice,/No exact matches/);
  assert.match(practice,/OR within a row · AND between rows/);
});
