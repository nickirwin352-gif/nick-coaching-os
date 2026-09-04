import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  AUTO_ORGANISATION_VERSION,
  inferFormatV4,
  inferPurposeV4,
  principleMatchForPractice,
  autoOrganisePractice
} from '../src/practice-library-auto-organiser-v4.js';

const source = await readFile(new URL('../src/practice-library-auto-organiser-v4.js', import.meta.url), 'utf8');
const sessionState = await readFile(new URL('../src/session-state.js', import.meta.url), 'utf8');

test('versioned auto organiser is explicit and non-destructive by default', () => {
  assert.equal(AUTO_ORGANISATION_VERSION, 4);
  const manual = {
    id:'X1', name:'Manual practice', theme:'Build Up', stage:'Skill Practice',
    gameContext:'progress', practicePurpose:'execute', practiceFormat:'duel',
    primaryGameModelPrinciple:'arrive', gameModelPrinciples:['arrive']
  };
  autoOrganisePractice(manual);
  assert.equal(manual.gameContext, 'progress');
  assert.equal(manual.practicePurpose, 'execute');
  assert.equal(manual.practiceFormat, 'duel');
  assert.equal(manual.primaryGameModelPrinciple, 'arrive');
  assert.equal(manual.organisationSource, 'manual');
});

test('4v4+2 possession picture is treated as a format, not a purpose', () => {
  const practice = {
    id:'SP-MP3', name:'(8)4v4+2 Central dip in and out', theme:'Midfield Progression', stage:'Skill Practice',
    description:'4v4 in a box with two neutrals. Keep possession and find the free player.',
    coachingPoints:'Play through the free player. Support underneath and beyond.'
  };
  assert.equal(inferFormatV4(practice), 'possession-box');
  assert.equal(inferPurposeV4(practice), 'recognise');
});

test('known evidence practices receive curated game-model links', () => {
  const match = principleMatchForPractice({ id:'SP-BU4', name:'Vacate the central area', theme:'Build Up', stage:'Skill Practice' });
  assert.equal(match.primary, 'arrive');
  assert.ok(match.supports.includes('move-free'));
  assert.ok(match.supports.includes('break-open'));
  assert.equal(match.confidence, 'high');
});

test('uncertain principle evidence is suggested rather than forced', () => {
  const practice = {
    id:'TEST-1', name:'Generic possession', theme:'Midfield Progression', stage:'Skill Practice',
    coachingPoints:'Support the ball and communicate.'
  };
  const match = principleMatchForPractice(practice);
  assert.equal(match.primary, '');
  const next = { ...practice };
  autoOrganisePractice(next);
  assert.equal(next.primaryGameModelPrinciple || '', '');
});

test('auto organiser saves context purpose and format metadata', () => {
  const practice = {
    id:'A-PA14', name:'Timing of movement to receive', theme:'Core Passing Activations', stage:'Activation',
    coachingPoints:'Quality of pass and timing of arrival.'
  };
  assert.equal(autoOrganisePractice(practice), true);
  assert.equal(practice.gameContext, 'player-development');
  assert.equal(practice.practicePurpose, 'prepare');
  assert.equal(practice.practiceFormat, 'passing-activation');
  assert.equal(practice.primaryGameModelPrinciple, 'arrive');
  assert.equal(practice.organisationVersion, 4);
});

test('practice and session libraries expose simultaneous multi-filter controls', () => {
  assert.match(source, /Practice Library · Multi-Filter/);
  assert.match(source, /OR within a row, AND between rows/);
  assert.match(source, /library-context/);
  assert.match(source, /library-principle/);
  assert.match(source, /library-purpose/);
  assert.match(source, /library-format/);
  assert.match(source, /Find practices · combine filters/);
  assert.match(source, /Saved Sessions · Multi-Filter/);
  assert.match(source, /Needs review only/);
});

test('auto organiser loads after the game context system', () => {
  const v3 = sessionState.indexOf("import('./game-context-practice-system-v3.js')");
  const v4 = sessionState.indexOf("import('./practice-library-auto-organiser-v4.js')");
  assert.ok(v3 >= 0 && v4 > v3);
});
