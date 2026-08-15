import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  stageCode,
  themeCode,
  practicePrefix,
  nextPracticeId,
  planPracticeIdMigration,
  migratePracticeIdsData
} from '../src/practice-id-system.js';

const reviewSource = await readFile(new URL('../src/review-diagram-ten-scale.js', import.meta.url), 'utf8');
const guardSource = await readFile(new URL('../src/session-intelligence-observer-guard.js', import.meta.url), 'utf8');
const idSource = await readFile(new URL('../src/practice-id-system.js', import.meta.url), 'utf8');

test('practice IDs use short stage and theme codes', () => {
  assert.equal(stageCode('Activation'), 'A');
  assert.equal(stageCode('Skill Practice'), 'SP');
  assert.equal(stageCode('Tactical Practice'), 'TP');
  assert.equal(stageCode('Conditioned Game'), 'CG');
  assert.equal(themeCode('Core Passing Activations'), 'PA');
  assert.equal(themeCode('Chance Creation'), 'CC');
  assert.equal(practicePrefix('Activation', 'Core Passing Activations'), 'A-PA');
  assert.equal(practicePrefix('Skill Practice', 'Chance Creation'), 'SP-CC');
});

test('new practice IDs take the next number in their stage-theme group', () => {
  const practices = [
    { id:'A-PA1', stage:'Activation', theme:'Core Passing Activations' },
    { id:'A-PA2', stage:'Activation', theme:'Core Passing Activations' },
    { id:'SP-CC1', stage:'Skill Practice', theme:'Chance Creation' }
  ];
  assert.equal(nextPracticeId(practices, 'Activation', 'Core Passing Activations'), 'A-PA3');
  assert.equal(nextPracticeId(practices, 'Skill Practice', 'Chance Creation'), 'SP-CC2');
});

test('migration preserves valid IDs and assigns compact IDs to old practices', () => {
  const practices = [
    { id:'A-PA1', stage:'Activation', theme:'Core Passing Activations' },
    { id:'ACT-PASS-OLD', stage:'Activation', theme:'Core Passing Activations' },
    { id:'chance-create-old', stage:'Skill Practice', theme:'Chance Creation' }
  ];
  const plan = planPracticeIdMigration(practices);
  assert.equal(plan.length, 2);
  assert.deepEqual(plan.map(item => item.newId), ['A-PA2', 'SP-CC1']);
});

test('renaming practice IDs keeps saved sessions, templates and review reasoning linked', () => {
  const data = {
    practices:[
      { id:'old-pass', name:'Passing Activation', stage:'Activation', theme:'Core Passing Activations' },
      { id:'old-chance', name:'Chance Creation Wave', stage:'Skill Practice', theme:'Chance Creation' }
    ],
    sessions:[{
      id:'session-1',
      drills:['old-pass','old-chance'],
      review:{
        practices:[
          { practiceId:'old-pass', effectiveness:'6', reasoning:'Keep it but tighten the area.' },
          { practiceId:'old-chance', effectiveness:'8', reasoning:'Worked well.' }
        ]
      }
    }],
    sessionTemplates:[{ id:'template-1', drills:['old-pass','old-chance'] }]
  };

  const result = migratePracticeIdsData(data);
  assert.equal(result.changed, true);
  assert.deepEqual(data.practices.map(p => p.id), ['A-PA1','SP-CC1']);
  assert.deepEqual(data.sessions[0].drills, ['A-PA1','SP-CC1']);
  assert.equal(data.sessions[0].review.practices[0].practiceId, 'A-PA1');
  assert.equal(data.sessions[0].review.practices[0].reasoning, 'Keep it but tighten the area.');
  assert.deepEqual(data.sessionTemplates[0].drills, ['A-PA1','SP-CC1']);
});

test('review overlay observers no longer watch every child mutation', () => {
  assert.match(reviewSource, /reviewObserver\.observe\(overlay, \{ attributes:true, attributeFilter:\['class'\] \}\)/);
  assert.doesNotMatch(reviewSource, /reviewObserver\.observe\(overlay, \{[^}]*childList:true/);
  assert.match(guardSource, /target\?\.id === 'postSessionReviewOverlay'/);
  assert.match(guardSource, /childList:false/);
  assert.match(guardSource, /subtree:false/);
});

test('practice search hierarchy makes the name dominant and ID automatic', () => {
  assert.match(idSource, /practiceProminentName/);
  assert.match(idSource, /practiceCompactId/);
  assert.match(idSource, /idField\.readOnly = true/);
  assert.match(idSource, /Generated from stage \+ theme/);
  assert.match(idSource, /SP-CC1/);
});
