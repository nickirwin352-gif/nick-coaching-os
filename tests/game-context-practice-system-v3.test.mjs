import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  GAME_CONTEXTS,
  PRACTICE_PURPOSES_V3,
  PRACTICE_FORMATS,
  inferGameContext,
  inferPurposeV3,
  inferFormatV3,
  practiceArchitecture
} from '../src/game-context-practice-system-v3.js';

const source = await readFile(new URL('../src/game-context-practice-system-v3.js', import.meta.url), 'utf8');
const state = await readFile(new URL('../src/session-state.js', import.meta.url), 'utf8');

test('blanket game contexts replace old themes as the main where layer', () => {
  assert.deepEqual(GAME_CONTEXTS.map(item => item.id), [
    'build-out','progress','create-finish','press-high','defend-mid-low','attack-regain','defend-loss','restarts','player-development'
  ]);
  assert.equal(inferGameContext({ theme:'Build Up' }), 'build-out');
  assert.equal(inferGameContext({ theme:'Wide Overloads' }), 'create-finish');
  assert.equal(inferGameContext({ theme:'Counter Press' }), 'defend-loss');
});

test('practice purpose is only prepare recognise execute or transfer', () => {
  assert.deepEqual(PRACTICE_PURPOSES_V3.map(item => item.id), ['prepare','recognise','execute','transfer']);
  assert.equal(inferPurposeV3({ stage:'Activation', theme:'Core Passing Activations' }), 'prepare');
  assert.equal(inferPurposeV3({ stage:'Tactical Practice' }), 'recognise');
  assert.equal(inferPurposeV3({ stage:'Skill Practice' }), 'execute');
  assert.equal(inferPurposeV3({ stage:'Conditioned Game' }), 'transfer');
  assert.equal(inferPurposeV3({ practicePurpose:'scenario-wave' }), 'recognise');
});

test('4v4+2 is classified as a possession format rather than a purpose', () => {
  assert.ok(PRACTICE_FORMATS.some(item => item.id === 'possession-box'));
  assert.equal(inferFormatV3({ name:'4v4+2 possession box', stage:'Skill Practice' }), 'possession-box');
  const architecture = practiceArchitecture({ name:'4v4+2 possession box', stage:'Skill Practice', theme:'Midfield Progression' });
  assert.equal(architecture.format, 'possession-box');
  assert.equal(architecture.purpose, 'execute');
  assert.equal(architecture.gameContext, 'progress');
});

test('session planning hierarchy includes context but deliberately no field-area layer', () => {
  assert.match(source, /GAME CONTEXT · WHERE IS THE PROBLEM\?/);
  assert.match(source, /Context → Principle → Purpose → Format/);
  assert.match(source, /Player Problem/);
  assert.match(source, /Understand \/ Recognise \/ Execute \/ Adapt/);
  assert.doesNotMatch(source, /FIELD AREA|gmFieldArea|fieldArea/);
});

test('practice editor stores context purpose format and primary principle separately', () => {
  assert.match(source, /practice\.gameContext =/);
  assert.match(source, /practice\.practicePurpose =/);
  assert.match(source, /practice\.practiceFormat =/);
  assert.match(source, /practice\.primaryGameModelPrinciple =/);
  assert.match(source, /ALSO SUPPORTS · OPTIONAL/);
});

test('practice library and advanced builder can browse with the new architecture', () => {
  assert.match(source, /Practice Library · Game Model First/);
  assert.match(source, /By Context/);
  assert.match(source, /By Purpose/);
  assert.match(source, /By Format/);
  assert.match(source, /Find practices for this session/);
  assert.match(source, /Legacy Stage \/ Theme picker/);
});

test('saved session library is game-context and principle led', () => {
  assert.match(source, /Saved Sessions · Game Model Library/);
  assert.match(source, /All contexts/);
  assert.match(source, /All principles/);
  assert.match(source, /Player problem:/);
});

test('review shows the context alongside principle learning', () => {
  assert.match(source, /Did the principle land in this game context\?/);
  assert.match(source, /Game Context:/);
  assert.match(source, /Learning emphasis:/);
});

test('v3 loads after the existing practice architecture', () => {
  const v2 = state.indexOf("import('./game-model-practice-architecture-v2.js')");
  const v3 = state.indexOf("import('./game-context-practice-system-v3.js')");
  assert.ok(v2 >= 0 && v3 > v2);
});
