import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  GAME_MODEL_PRINCIPLES,
  GAME_MOMENTS,
  TECHNICAL_STANDARDS,
  PRACTICE_ROLES,
  LEARNING_EMPHASES,
  normaliseGameModelPlan,
  standardClarityForPrinciple
} from '../src/game-model-core.js';

const source = await readFile(new URL('../src/game-model-operating-system.js', import.meta.url), 'utf8');
const sessionState = await readFile(new URL('../src/session-state.js', import.meta.url), 'utf8');

test('core game model keeps the seven agreed player messages', () => {
  assert.deepEqual(GAME_MODEL_PRINCIPLES.map(item => item.message), [
    'Bring them. Play where they leave.',
    'One behind. One beneath.',
    'Arrive. Don’t live there.',
    'Break them when it opens.',
    'Protect inside.',
    'Stay connected.',
    'Win it or get inside.'
  ]);
});

test('every core principle carries meaning, why, picture and player questions', () => {
  assert.equal(GAME_MODEL_PRINCIPLES.length, 7);
  GAME_MODEL_PRINCIPLES.forEach(item => {
    assert.ok(item.meaning);
    assert.ok(item.why);
    assert.ok(item.picture);
    assert.ok(item.questions.length >= 2);
  });
});

test('themes are contexts while training keeps separate technical and practice-role layers', () => {
  assert.ok(GAME_MOMENTS.some(item => item.id === 'with-ball' && item.themes.includes('Build Up')));
  assert.ok(GAME_MOMENTS.some(item => item.id === 'lose-it' && item.themes.includes('Defensive Transition')));
  assert.ok(TECHNICAL_STANDARDS.includes('First touch with purpose.'));
  assert.deepEqual(PRACTICE_ROLES.map(item => item.id), ['activate','recognise','apply']);
  assert.deepEqual(LEARNING_EMPHASES.map(item => item.id), ['understand','recognise','execute','adapt']);
});

test('session game-model plan is stable and cannot duplicate the same supporting principle', () => {
  assert.deepEqual(normaliseGameModelPlan({
    playerProblem:'  We stay in the space too long  ',
    gameMoment:'with-ball',
    primaryPrincipleId:'arrive',
    supportingPrincipleId:'arrive',
    emphasis:'execute'
  }), {
    playerProblem:'We stay in the space too long',
    gameMoment:'with-ball',
    primaryPrincipleId:'arrive',
    supportingPrincipleId:'',
    emphasis:'execute'
  });
});

test('selecting a core principle can load the stable clarity wording', () => {
  assert.deepEqual(standardClarityForPrinciple('move-free'), {
    why:'We create our own route forward instead of hoping one appears.',
    principle:'Move them to free us.',
    picture:'An opponent moves towards the ball, leaving a player or space available.',
    cue:'Bring them. Play where they leave.',
    questions:['Who moved?','What did they leave?']
  });
});

test('operating-system UI adds a dedicated game-model area and planner implementation controls', () => {
  assert.match(source, /Our Game Model/);
  assert.match(source, /Our seven messages/);
  assert.match(source, /PLAYER PROBLEM/);
  assert.match(source, /GAME MOMENT/);
  assert.match(source, /PRIMARY PRINCIPLE/);
  assert.match(source, /LEARNING EMPHASIS/);
  assert.match(source, /Technical standards/);
  assert.match(source, /Themes are contexts/);
});

test('planner implementation persists into sessions and templates and protects core wording', () => {
  assert.match(source, /gameModelPlan:currentPlan\(\)/);
  assert.match(source, /gameModelPlan = plan/);
  assert.match(source, /readOnly = !!primary/);
  assert.match(source, /Core WHY, principle and cue are locked for consistency/);
  assert.match(source, /ACTIVATE · TOOLS/);
  assert.match(source, /TACTICAL · PICTURE/);
});

test('operating system loads after the existing clarity framework', () => {
  const clarity = sessionState.indexOf("import('./game-model-clarity-framework.js')");
  const operatingSystem = sessionState.indexOf("import('./game-model-operating-system.js')");
  assert.ok(clarity >= 0 && operatingSystem > clarity);
});
