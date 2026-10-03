import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FOUR_PHASE_FILTER_PAGE_SIZE,
  createFilterState,
  matchesPracticeFilters,
  filterPractices,
  practiceArchitecture,
  migratePracticeToFourPhase,
  inferPracticePurpose,
  inferPracticeFormat,
  purposeForLegacyStage,
  legacyStageForPurpose
} from '../src/four-phase-practice-system-v1.js';

const practices=[
  {id:'A',name:'Build possession',gameModelPhaseIds:['in-possession'],gameModelPrincipleIds:['arrive-affect-away'],gameModelSubPrincipleIds:['create-separation'],practicePurpose:'recognise',practiceFormat:'possession-box'},
  {id:'B',name:'Transition wave',gameModelPhaseIds:['attacking-transition'],gameModelPrincipleIds:['see-send-sprint'],gameModelSubPrincipleIds:['send-into-space'],practicePurpose:'execute',practiceFormat:'wave'},
  {id:'C',name:'Defending block',gameModelPhaseIds:['out-of-possession'],gameModelPrincipleIds:['screen-shuffle-squeeze'],gameModelSubPrincipleIds:['screen-the-centre'],practicePurpose:'transfer',practiceFormat:'conditioned-game'}
];

test('four-phase workbench keeps the visual choice set focused', () => {
  assert.equal(FOUR_PHASE_FILTER_PAGE_SIZE,3);
});

test('workbench is OR within a row and AND between rows', () => {
  const filters=createFilterState({
    phases:['in-possession','attacking-transition'],
    principles:['arrive-affect-away'],
    formats:['possession-box','wave']
  });
  assert.deepEqual(filterPractices(practices,filters).map(p=>p.id),['A']);
});

test('selecting a phase never leaks practices from another phase', () => {
  const filters=createFilterState({phases:['in-possession']});
  assert.equal(matchesPracticeFilters(practices[0],filters),true);
  assert.equal(matchesPracticeFilters(practices[1],filters),false);
  assert.equal(matchesPracticeFilters(practices[2],filters),false);
});

test('sub-principle, purpose and format continue to stack exactly', () => {
  const filters=createFilterState({
    phases:['in-possession'],
    principles:['arrive-affect-away'],
    subPrinciples:['create-separation'],
    purposes:['recognise'],
    formats:['possession-box']
  });
  assert.equal(matchesPracticeFilters(practices[0],filters),true);
  assert.equal(matchesPracticeFilters({...practices[0],practicePurpose:'execute'},filters),false);
});

test('safe old tags migrate to the new model and ambiguous tags stay for review', () => {
  const safe={id:'old1',gameContext:'build-out',primaryGameModelPrinciple:'arrive',gameModelPrinciples:['arrive'],stage:'Tactical Practice'};
  migratePracticeToFourPhase(safe);
  assert.deepEqual(safe.gameModelPhaseIds,['in-possession']);
  assert.deepEqual(safe.gameModelPrincipleIds,['arrive-affect-away']);
  assert.equal(safe.fourPhaseNeedsReview,false);
  assert.equal(safe.practicePurpose,'execute');

  const ambiguous={id:'old2',gameContext:'build-out',primaryGameModelPrinciple:'move-free',gameModelPrinciples:['move-free'],stage:'Tactical Practice'};
  migratePracticeToFourPhase(ambiguous);
  assert.deepEqual(ambiguous.gameModelPrincipleIds,[]);
  assert.deepEqual(ambiguous.fourPhaseSuggestedPrincipleIds,['rotate-replace-release','spot-sense-seize']);
  assert.equal(ambiguous.fourPhaseNeedsReview,true);
});


test('legacy stage names now map exactly onto the four practice purposes', () => {
  assert.equal(purposeForLegacyStage('Activation'),'prepare');
  assert.equal(purposeForLegacyStage('Skill Practice'),'recognise');
  assert.equal(purposeForLegacyStage('Tactical Practice'),'execute');
  assert.equal(purposeForLegacyStage('Conditioned Game'),'transfer');
  assert.equal(legacyStageForPurpose('prepare'),'Activation');
  assert.equal(legacyStageForPurpose('recognise'),'Skill Practice');
  assert.equal(legacyStageForPurpose('execute'),'Tactical Practice');
  assert.equal(legacyStageForPurpose('transfer'),'Conditioned Game');
});

test('legacy practices receive purpose from their old stage without changing format', () => {
  assert.equal(inferPracticePurpose({stage:'Activation'}),'prepare');
  assert.equal(inferPracticePurpose({stage:'Skill Practice'}),'recognise');
  assert.equal(inferPracticePurpose({stage:'Tactical Practice'}),'execute');
  assert.equal(inferPracticePurpose({stage:'Conditioned Game'}),'transfer');
  const practice={id:'legacy-skill',stage:'Skill Practice',practiceFormat:'wave',gameModelPrincipleIds:['arrive-affect-away'],fourPhaseModelVersion:1};
  migratePracticeToFourPhase(practice);
  assert.equal(practice.practicePurpose,'recognise');
  assert.equal(practice.practiceFormat,'wave');
  assert.equal(practice.fourPhaseNeedsReview,false);
});

test('sub-principles are optional precision rather than a reason to flag a linked practice', () => {
  const practice={id:'linked',stage:'Tactical Practice',gameModelPhaseIds:['in-possession'],gameModelPrincipleIds:['spot-sense-seize'],gameModelSubPrincipleIds:[],fourPhaseModelVersion:1};
  migratePracticeToFourPhase(practice);
  assert.equal(practice.practicePurpose,'execute');
  assert.equal(practice.fourPhaseNeedsReview,false);
});

test('an intentional no-principle practice stays out of review', () => {
  const practice={id:'tech',noGameModelPrinciple:true,stage:'Activation'};
  migratePracticeToFourPhase(practice);
  assert.equal(practice.noGameModelLink,true);
  assert.equal(practice.fourPhaseNeedsReview,false);
  assert.deepEqual(practiceArchitecture(practice).principleIds,[]);
});

test('4v4+2 possession is treated as a format rather than a principle or purpose', () => {
  assert.equal(inferPracticeFormat({name:'4v4+2 possession with neutrals',desc:'keep possession and find the free player',stage:'Skill Practice'}),'possession-box');
});
