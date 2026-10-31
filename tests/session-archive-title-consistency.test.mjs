import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {sessionTitle} from '../src/session-identity.js';

const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');

test('a saved session uses its phase and main principle, not its generic old theme',()=>{
  assert.equal(sessionTitle({
    theme:'Core Passing Activations',
    gameModelPlan:{gamePhase:'in-possession',primaryPrincipleId:'arrive-affect-away'}
  }),'In Possession · Arrive, Affect, Away');
});

test('older sessions use model identity recorded during review without mutating data',()=>{
  const session={
    theme:'Core Passing Activations',
    review:{gameModelV2:{gamePhase:'out-of-possession',primaryPrincipleId:'screen-shuffle-squeeze'}}
  };
  const before=JSON.stringify(session);
  assert.equal(sessionTitle(session),'Out of Possession · Screen, Shuffle, Squeeze');
  assert.equal(JSON.stringify(session),before);
});

test('partial models label missing details; old generic themes are never guessed',()=>{
  assert.equal(sessionTitle({gameModelPlan:{gamePhase:'defensive-transition'}}),
    'Defensive Transition · Main principle not recorded');
  assert.equal(sessionTitle({gameModelPlan:{primaryPrincipleId:'see-send-sprint'}}),
    'Attacking Transition · See, Send, Sprint');
  assert.equal(sessionTitle({theme:'Core Passing Activations'}),
    'Session · phase / principle not recorded');
});

test('the session card, archive calendar and calendar tooltip use the canonical title',()=>{
  assert.match(read('../src/practice-library-auto-organiser-v4.js'), /<h3>\$\{esc\(sessionTitle\(session\)\)\}<\/h3>/);
  assert.match(read('../src/session-intelligence-v2.js'),/calSessionTitle">\$\{escapeText\(sessionTitle\(session\)\)\}/);
  assert.match(read('../src/session-calendar-navigation-rating.js'),/View \$\{sessionTitle\(item\.session\)\}/);
  assert.match(read('../index.html'),/data-tab="archive">Archive<\/button>/);
});
