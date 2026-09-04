import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  PRACTICE_PURPOSES,
  normalisePrincipleIds,
  inferPracticePurpose,
  suggestedPrinciplesForPractice,
  normaliseGameModelReview
} from '../src/game-model-practice-architecture-v2.js';

const source = await readFile(new URL('../src/game-model-practice-architecture-v2.js', import.meta.url), 'utf8');
const sessionState = await readFile(new URL('../src/session-state.js', import.meta.url), 'utf8');

test('practice architecture separates purpose from principle and legacy theme', () => {
  assert.deepEqual(PRACTICE_PURPOSES.map(item => item.id), [
    'technical-repetition','picture-recognition','scenario-wave','game-transfer','physical-development','restart-setplay'
  ]);
  assert.equal(inferPracticePurpose({ stage:'Activation', theme:'Core Passing Activations' }), 'technical-repetition');
  assert.equal(inferPracticePurpose({ stage:'Conditioned Game', theme:'Chance Creation' }), 'game-transfer');
  assert.equal(inferPracticePurpose({ stage:'Tactical', name:'3v2 wave to goal' }), 'scenario-wave');
  assert.equal(inferPracticePurpose({ theme:'Set Plays', name:'Attacking corner' }), 'restart-setplay');
});

test('principle tags are valid, unique and multi-select', () => {
  assert.deepEqual(normalisePrincipleIds(['arrive','move-free','arrive','not-real']), ['arrive','move-free']);
});

test('legacy coaching detail can suggest a principle without auto-attaching it', () => {
  const suggestions = suggestedPrinciplesForPractice({
    theme:'Build Up',
    name:'Central spare player',
    cp:'Attract pressure then play through the free player and space left'
  }, 3);
  assert.ok(suggestions.includes('move-free'));
});

test('game-model review measures understanding, recognition, transfer and execution', () => {
  assert.deepEqual(normaliseGameModelReview({
    understanding:11,
    recognition:8,
    transfer:6,
    execution:7,
    cueHelp:'Partly',
    nextAction:'Revisit',
    evidence:'  Players could explain why but needed prompts  '
  }, { gameModelPlan:{ primaryPrincipleId:'arrive', supportingPrincipleId:'move-free' } }), {
    primaryPrincipleId:'arrive',
    supportingPrincipleId:'move-free',
    understanding:10,
    recognition:8,
    transfer:6,
    execution:7,
    cueHelp:'Partly',
    nextAction:'Revisit',
    evidence:'Players could explain why but needed prompts'
  });
});

test('advanced builder hides legacy objective, link-back, reflection and subtitle fields', () => {
  assert.match(source, /hideLegacyPlannerBlock\('objective','objChips'\)/);
  assert.match(source, /hideLegacyPlannerBlock\('links','linkChips'\)/);
  assert.match(source, /hideLegacyPlannerBlock\('reflect','reflectChips'\)/);
  assert.match(source, /sessionSubtitleField/);
});

test('practice editor supports purpose and game-model principle tagging', () => {
  assert.match(source, /Practice purpose \+ game-model tags/);
  assert.match(source, /GAME MODEL PRINCIPLES · OPTIONAL \/ MULTI-SELECT/);
  assert.match(source, /practice\.practicePurpose = editorPurpose\(\)/);
  assert.match(source, /practice\.gameModelPrinciples = normalisePrincipleIds/);
});

test('practice library becomes principle-first with purpose and legacy fallback views', () => {
  assert.match(source, /Practice Library · Purpose First/);
  assert.match(source, /By Principle/);
  assert.match(source, /By Purpose/);
  assert.match(source, /Needs Tagging/);
  assert.match(source, /Open legacy Theme \/ Stage browser/);
  assert.match(source, /Attach principle/);
});

test('session review is rebuilt around whether the principle landed', () => {
  assert.match(source, /Did the principle actually land\?/);
  assert.match(source, /UNDERSTANDING · can they explain why\?/);
  assert.match(source, /RECOGNITION · did they see the picture\?/);
  assert.match(source, /TRANSFER · did it appear without prompting\?/);
  assert.match(source, /EXECUTION · how well did they produce it\?/);
  assert.match(source, /gameModel:payload/);
});

test('practice architecture loads after the visual game model playbook', () => {
  const visual = sessionState.indexOf("import('./game-model-visual-playbook.js')");
  const architecture = sessionState.indexOf("import('./game-model-practice-architecture-v2.js')");
  assert.ok(visual >= 0 && architecture > visual);
});
