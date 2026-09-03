import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  normaliseClarity,
  clarityCompleteness,
  playerCueWordCount,
  buildCoachingEvidence
} from '../src/game-model-clarity-framework.js';

const source = await readFile(new URL('../src/game-model-clarity-framework.js', import.meta.url), 'utf8');
const sessionState = await readFile(new URL('../src/session-state.js', import.meta.url), 'utf8');

test('clarity framework normalises the five coaching layers', () => {
  assert.deepEqual(normaliseClarity({
    why:'  Keep the ball to create our own attack  ',
    principle:'Move them to break them',
    picture:'Opposition jump and leave a player or space',
    cue:'Bring them in. Play where they leave.',
    questions:'- Can we break them?\n• Who is free?'
  }), {
    why:'Keep the ball to create our own attack',
    principle:'Move them to break them',
    picture:'Opposition jump and leave a player or space',
    cue:'Bring them in. Play where they leave.',
    questions:['Can we break them?','Who is free?']
  });
});

test('completeness only reaches five of five when every layer exists', () => {
  assert.deepEqual(clarityCompleteness({ principle:'One', cue:'Two' }), { completed:2, total:5, complete:false });
  assert.deepEqual(clarityCompleteness({ why:'Why', principle:'Principle', picture:'Picture', cue:'Cue', questions:['Question?'] }), { completed:5, total:5, complete:true });
});

test('player cue length can be kept concise', () => {
  assert.equal(playerCueWordCount('Break them. If not, move them.'), 6);
  assert.equal(playerCueWordCount(''), 0);
});

test('coaching evidence export keeps sessions, practice coaching detail and reviews without diagram payloads', () => {
  const evidence = buildCoachingEvidence({
    sessions:[{ id:'s1', theme:'Build Up', drills:['A-PA1'], gameModelClarity:{ why:'Retain to attack', principle:'Move them', picture:'Press comes, space appears', cue:'Bring them in', questions:['Who is free?'] }, review:{ rating:8, reasoning:'Good recognition' } }],
    practices:[{ id:'A-PA1', name:'Passing Activation', stage:'Activation', theme:'Build Up', cp:'Scan before receiving', diagram:[{ id:'big' }], diagramSteps:[{ diagram:[{ id:'bigger' }] }] }],
    sessionTemplates:[]
  });
  assert.equal(evidence.sessions[0].gameModelClarity.cue, 'Bring them in');
  assert.equal(evidence.sessions[0].review.reasoning, 'Good recognition');
  assert.equal(evidence.practices[0].coachingPoints, 'Scan before receiving');
  assert.equal('diagram' in evidence.practices[0], false);
  assert.deepEqual(evidence.framework, ['WHY','PRINCIPLE','PICTURE','PLAYER CUE','PLAYER QUESTIONS']);
});

test('framework persists through planner, sideline, review and evidence export hooks', () => {
  assert.match(source, /gameModelClarity:currentClarity\(\)/);
  assert.match(source, /loadSessionToPlanner/);
  assert.match(source, /openGrassView/);
  assert.match(source, /gameModelSidelineClarity/);
  assert.match(source, /gameModelReviewClarity/);
  assert.match(source, /Export Coaching Evidence/);
  assert.match(source, /Review the learning, not just the practice/);
});

test('clarity framework loads after the existing session and diagram enhancement chain', () => {
  const previous = sessionState.indexOf("import('./diagram-cone-colours.js')");
  const clarity = sessionState.indexOf("import('./game-model-clarity-framework.js')");
  assert.ok(previous >= 0 && clarity > previous);
});
