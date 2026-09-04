import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { normaliseManualTagDraft, applyManualPracticeTags, PRACTICE_TAG_SAVE_VERSION } from '../src/practice-tag-save-reliability-v5.js';

const sessionState = await readFile(new URL('../src/session-state.js', import.meta.url), 'utf8');
const source = await readFile(new URL('../src/practice-tag-save-reliability-v5.js', import.meta.url), 'utf8');

test('manual tag draft keeps only valid context, purpose, format and principles', () => {
  assert.deepEqual(normaliseManualTagDraft({
    gameContext:'build-out',
    practicePurpose:'recognise',
    practiceFormat:'possession-box',
    primaryPrincipleId:'arrive',
    supportingPrincipleIds:['move-free','arrive','not-real','move-free']
  }), {
    gameContext:'build-out',
    practicePurpose:'recognise',
    practiceFormat:'possession-box',
    primaryPrincipleId:'arrive',
    supportingPrincipleIds:['move-free']
  });
});

test('manual save makes the coach choices authoritative and clears needs review', () => {
  const practice = {
    id:'SP-TEST',
    organisationNeedsReview:true,
    organisationConfidence:'review',
    organisationSource:'auto-v4',
    suggestedGameModelPrinciples:['arrive','move-free'],
    primaryGameModelPrinciple:'',
    gameModelPrinciples:[]
  };
  applyManualPracticeTags(practice,{
    gameContext:'progress',
    practicePurpose:'execute',
    practiceFormat:'possession-box',
    primaryPrincipleId:'move-free',
    supportingPrincipleIds:['break-open']
  });
  assert.equal(practice.gameContext,'progress');
  assert.equal(practice.practicePurpose,'execute');
  assert.equal(practice.practiceFormat,'possession-box');
  assert.equal(practice.primaryGameModelPrinciple,'move-free');
  assert.deepEqual(practice.gameModelPrinciples,['move-free','break-open']);
  assert.equal(practice.noGameModelPrinciple,false);
  assert.deepEqual(practice.suggestedGameModelPrinciples,[]);
  assert.equal(practice.organisationNeedsReview,false);
  assert.equal(practice.organisationConfidence,'manual');
  assert.equal(practice.organisationSource,'manual');
  assert.equal(practice.manualTagSaveVersion,PRACTICE_TAG_SAVE_VERSION);
});

test('manual save can deliberately leave a practice with no principle', () => {
  const practice = { id:'A-TECH', organisationNeedsReview:true, suggestedGameModelPrinciples:['arrive'] };
  applyManualPracticeTags(practice,{
    gameContext:'player-development',
    practicePurpose:'prepare',
    practiceFormat:'passing-activation',
    primaryPrincipleId:'',
    supportingPrincipleIds:[]
  });
  assert.equal(practice.primaryGameModelPrinciple,'');
  assert.deepEqual(practice.gameModelPrinciples,[]);
  assert.equal(practice.noGameModelPrinciple,true);
  assert.deepEqual(practice.suggestedGameModelPrinciples,[]);
  assert.equal(practice.organisationNeedsReview,false);
  assert.equal(practice.organisationConfidence,'manual');
  assert.equal(practice.organisationSource,'manual');
});

test('reliability patch captures editor tags before base save can replace the practice object', () => {
  assert.match(source,/const draft = captureEditorDraft\(\)/);
  assert.match(source,/const result = original\.apply\(this,args\)/);
  assert.match(source,/finalisePractice\(targetId,draft\)/);
  assert.match(source,/localStorage\.setItem\('nickCoachOSv3'/);
});

test('suggestion buttons are reinforced through the same reliable persistence path', () => {
  assert.match(source,/\[data-v4-use-suggestion\]/);
  assert.match(source,/finalisePractice\(practiceId,draft\)/);
});

test('tag save reliability loads after the v4 auto organiser and before no-principle support', () => {
  const auto = sessionState.indexOf("import('./practice-library-auto-organiser-v4.js')");
  const fix = sessionState.indexOf("import('./practice-tag-save-reliability-v5.js')");
  const noPrinciple = sessionState.indexOf("import('./practice-no-principle-decision-v1.js')");
  assert.ok(auto >= 0 && fix > auto && noPrinciple > fix);
});
