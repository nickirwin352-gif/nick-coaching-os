import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  splitCoachingPhrases,
  mergeCoachingPhrases,
  buildPersonalLanguage,
  suggestedDecision,
  practiceReviewSuggestions
} from '../src/coaching-personalisation-automation.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here,'..');
const source = fs.readFileSync(path.join(root,'src/coaching-personalisation-automation.js'),'utf8');
const sessionState = fs.readFileSync(path.join(root,'src/session-state.js'),'utf8');

test('splits coaching language into clean reusable phrases', () => {
  assert.deepEqual(splitCoachingPhrases('Scan before receiving\nMove after pass; Protect centre'), [
    'Scan before receiving','Move after pass','Protect centre'
  ]);
});

test('merges phrases case-insensitively without duplicates', () => {
  assert.deepEqual(mergeCoachingPhrases(['Scan before receiving'],['scan before receiving','Play forward']), [
    'Scan before receiving','Play forward'
  ]);
});

test('learns recurring language from practices, sessions and review reasoning', () => {
  const data = {
    practices:[
      { id:'SP-CC1',theme:'Chance Creation',cp:'Fix defender before releasing\nAttack cut-back space',prog:'Add active defender',reg:'Increase space' },
      { id:'SP-CC2',theme:'Chance Creation',cp:'Fix defender before releasing',prog:'Add active defender',reg:'' }
    ],
    sessions:[
      { date:'2026-08-10',theme:'Chance Creation',objective:'Create better chances from wide areas',links:'Fix and Release',cues:'Fix him',review:{
        worked:'Players recognised the picture quickly',changeNext:'Use a smaller area',practices:[{ practiceId:'SP-CC1',effectiveness:'6',reasoning:'Area was slightly too big' }]
      }},
      { date:'2026-08-01',theme:'Chance Creation',objective:'Create better chances from wide areas',links:'Fix and Release',cues:'Fix him',review:{
        worked:'Players recognised the picture quickly',practices:[{ practiceId:'SP-CC1',effectiveness:'7',reasoning:'Area was slightly too big' }]
      }}
    ],
    sessionTemplates:[]
  };
  const personal = buildPersonalLanguage(data);
  assert.equal(personal.cp[0],'Fix defender before releasing');
  assert.equal(personal.obj[0],'Create better chances from wide areas');
  assert.ok(personal.review.includes('Area was slightly too big'));
  assert.ok(personal.cpByTheme['Chance Creation'].includes('Attack cut-back space'));
});

test('suggests Keep, Adapt or Drop from ten-point effectiveness', () => {
  assert.equal(suggestedDecision(9),'Keep');
  assert.equal(suggestedDecision(6),'Adapt');
  assert.equal(suggestedDecision(3),'Drop');
  assert.equal(suggestedDecision(''),'');
});

test('review suggestions lead with personal history and include theme-specific feedback', () => {
  const suggestions = practiceReviewSuggestions({
    effectiveness:6,
    decision:'Adapt',
    theme:'Build Up',
    personal:['My own previous note']
  });
  assert.equal(suggestions[0],'My own previous note');
  assert.ok(suggestions.includes('Created clear spare-player pictures'));
  assert.ok(suggestions.some(item => /small setup change/i.test(item)));
});

test('module covers every existing word bank and adds review suggestion tools', () => {
  for (const token of ['b.cp =','b.prog =','b.reg =','b.obj =','b.links =','b.cues =','b.reflect =','b.cpByTheme','b.objByTheme','b.condByTheme']) {
    assert.ok(source.includes(token),`missing ${token}`);
  }
  assert.match(source,/My Coaching Language/);
  assert.match(source,/Suggested reasoning/);
  assert.match(source,/Fill coaching detail/);
  assert.match(source,/Fill theme details/);
  assert.match(source,/Existing writing is never overwritten/);
});

test('review hook observes only overlay open-close state to avoid mutation loops', () => {
  assert.match(source,/observe\(overlay,\{ attributes:true,attributeFilter:\['class'\] \}\)/);
  assert.doesNotMatch(source,/observe\(overlay,\{[^}]*childList:true/);
});

test('personalisation module is loaded after the existing review and calendar passes', () => {
  const calendar = sessionState.indexOf("import('./session-calendar-navigation-rating.js')");
  const personal = sessionState.indexOf("import('./coaching-personalisation-automation.js')");
  assert.ok(calendar >= 0 && personal > calendar);
});
