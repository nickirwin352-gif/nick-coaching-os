import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const pitchSource = await readFile(new URL('../src/editor-pitch-builder-cleanup.js', import.meta.url), 'utf8');
const reviewSource = await readFile(new URL('../src/review-diagram-ten-scale.js', import.meta.url), 'utf8');
const sessionState = await readFile(new URL('../src/session-state.js', import.meta.url), 'utf8');

test('Diagram Studio removes the old setup and step strip and gives the pitch more space', () => {
  assert.match(pitchSource, /\.dsStepBar\{display:none!important\}/);
  assert.match(pitchSource, /min-height:650px!important/);
  assert.match(pitchSource, /max-width:1920px!important/);
});

test('full and half pitch markup includes goals, six-yard boxes and penalty spots', () => {
  assert.match(pitchSource, /dsSixYard/);
  assert.match(pitchSource, /dsGoalMouth/);
  assert.match(pitchSource, /dsPenaltySpot/);
  assert.match(pitchSource, /core === 'half'.*goalEnd\('right'\)/s);
  assert.match(pitchSource, /goalEnd\('left'\).*goalEnd\('right'\)/s);
});

test('Advanced Builder has a prominent clear current session control', () => {
  assert.match(pitchSource, /advancedBuilderResetBar/);
  assert.match(pitchSource, /Clear Current Session/);
  assert.match(pitchSource, /clearSessionDrills/);
});

test('review UI hides quick notes, shows diagrams and uses a ten point scale', () => {
  assert.match(reviewSource, /reviewNoteHidden/);
  assert.match(reviewSource, /reviewPracticeDiagram/);
  assert.match(reviewSource, /drawMini/);
  assert.match(reviewSource, /length:10/);
  assert.match(reviewSource, /10-point session scale/);
  assert.match(reviewSource, /10 Flawless/);
});

test('legacy five point reviews are mapped to the new ten point view', () => {
  assert.match(reviewSource, /number <= 5 \? number \* 2/);
  assert.match(reviewSource, /session\.review\.scale = 10/);
  assert.match(reviewSource, /average\.toFixed\(1\)\}\/10/);
});

test('cleanup modules load after the existing diagram editor passes', () => {
  const oldEditor = sessionState.indexOf("import('./diagram-editor-hold-pickup-pitch-size.js')");
  const pitch = sessionState.indexOf("import('./editor-pitch-builder-cleanup.js')");
  const review = sessionState.indexOf("import('./review-diagram-ten-scale.js')");
  assert.ok(oldEditor >= 0 && pitch > oldEditor && review > pitch);
});
