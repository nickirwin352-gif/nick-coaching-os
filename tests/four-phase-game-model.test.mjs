import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GAME_PHASES,
  GAME_MODEL_PRINCIPLES,
  GAME_SUB_PRINCIPLES,
  principleById,
  subPrincipleById,
  normaliseGameModelPlan
} from '../src/game-model-core.js';

test('game model is rebuilt around exactly four phases', () => {
  assert.deepEqual(GAME_PHASES.map(item=>item.label), [
    'In Possession',
    'Attacking Transition',
    'Out of Possession',
    'Defensive Transition'
  ]);
});

test('nine main principles replace the old seven-message model', () => {
  assert.deepEqual(GAME_MODEL_PRINCIPLES.map(item=>item.message), [
    'Arrive, Affect, Away',
    'Rotate, Replace, Release',
    'Combine, Commit, Cover',
    'Spot, Sense, Seize',
    'See, Send, Sprint',
    'Stretch, Supply, Strike',
    'Screen, Shuffle, Squeeze',
    'Spare, Step, Smother',
    'React, Recover, Reconnect'
  ]);
  assert.equal(GAME_MODEL_PRINCIPLES.length,9);
  assert.ok(GAME_MODEL_PRINCIPLES.every(item=>item.subPrinciples.length===3));
  assert.equal(GAME_SUB_PRINCIPLES.length,27);
});

test('canonical sub-principle wording is preserved', () => {
  assert.equal(subPrincipleById('create-separation').description,'Move to lose, move to receive, arrive with space.');
  assert.equal(subPrincipleById('supply-the-space').description,'Deliver into the space the movement has created — not simply “put it in the box.” Cut-backs, driven deliveries, inverted crosses, clips behind/over the back line.');
  assert.equal(subPrincipleById('recover-danger-first').description,'Protect the centre, goal and most dangerous runners before worrying about exact positions.');
  assert.equal(principleById('stretch-supply-strike').phaseId,'attacking-transition');
});

test('session plans use phase, main principle and sub-principles', () => {
  const plan=normaliseGameModelPlan({
    playerProblem:'  We arrive too early  ',
    successLooksLike:' arrive with space ',
    gamePhase:'in-possession',
    primaryPrincipleId:'arrive-affect-away',
    subPrincipleIds:['create-separation','arrive-to-affect'],
    emphasis:'recognise'
  });
  assert.deepEqual(plan,{
    playerProblem:'We arrive too early',
    successLooksLike:'arrive with space',
    gamePhase:'in-possession',
    gameMoment:'in-possession',
    primaryPrincipleId:'arrive-affect-away',
    subPrincipleIds:['create-separation','arrive-to-affect'],
    supportingPrincipleId:'',
    emphasis:'recognise'
  });
});

test('safe legacy session values migrate without pretending ambiguous principles are equivalent', () => {
  const safe=normaliseGameModelPlan({gameMoment:'without-ball',primaryPrincipleId:'protect-inside'});
  assert.equal(safe.gamePhase,'out-of-possession');
  assert.equal(safe.primaryPrincipleId,'screen-shuffle-squeeze');
  const ambiguous=normaliseGameModelPlan({gameMoment:'with-ball',primaryPrincipleId:'move-free'});
  assert.equal(ambiguous.gamePhase,'in-possession');
  assert.equal(ambiguous.primaryPrincipleId,'');
});
