import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  FOUR_PHASE_BUILDER_CLARITY_VERSION,
  LEGACY_STAGE_TO_PURPOSE
} from '../src/four-phase-builder-clarity-v2.js';

const source=await readFile(new URL('../src/four-phase-builder-clarity-v2.js',import.meta.url),'utf8');
const sessionState=await readFile(new URL('../src/session-state.js',import.meta.url),'utf8');

test('advanced builder presents the four practice purposes instead of legacy stage language', () => {
  assert.equal(FOUR_PHASE_BUILDER_CLARITY_VERSION,2);
  assert.deepEqual(LEGACY_STAGE_TO_PURPOSE,{
    'Activation':'Prepare',
    'Skill Practice':'Recognise',
    'Tactical Practice':'Execute',
    'Conditioned Game':'Transfer'
  });
  for(const label of ['Prepare','Recognise','Execute','Transfer'])assert.match(source,new RegExp(label));
});

test('game model is deliberately moved before the coaching cue bank', () => {
  assert.match(source,/reorderGameModelBeforeCueBank/);
  assert.match(source,/dateTeamRow\.insertAdjacentElement\('afterend',panel\)/);
  assert.match(source,/Coaching Cue Bank/);
});

test('format stays independent from purpose in the builder guidance', () => {
  assert.match(source,/Format is independent/);
  assert.match(source,/choose the practice purpose first/i);
  assert.match(source,/particular session structure/i);
});

test('selected session rows and preview translate hidden legacy stage into purpose', () => {
  assert.match(source,/decorateSessionRows/);
  assert.match(source,/practicePurposeLabel/);
  assert.match(source,/decoratePreview/);
});

test('builder clarity loads after the visual focus pass so its labels win final render', () => {
  const visual=sessionState.indexOf("import('./advanced-builder-visual-focus-v1.js')");
  const clarity=sessionState.indexOf("import('./four-phase-builder-clarity-v2.js')");
  assert.ok(visual>=0&&clarity>visual);
});
