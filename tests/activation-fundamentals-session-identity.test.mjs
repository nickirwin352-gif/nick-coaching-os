import test from 'node:test';
import assert from 'node:assert/strict';
import {passingFundamentals} from '../src/passing-fundamentals.js';
import {createFilterState,matchesPracticeFilters,hasActivePracticeFilters} from '../src/four-phase-practice-system-v1.js';
import {sessionTitle,sessionModelError} from '../src/session-identity.js';
import {applyFourPhaseDecision,applyStoredFourPhaseDecisions} from '../src/four-phase-practice-persistence-v1.js';

test('session identity uses phase then principle regardless of old theme',()=>{
 const session={theme:'Core Passing Activations',gameModelPlan:{gamePhase:'out-of-possession',primaryPrincipleId:'screen-shuffle-squeeze'}};
 assert.equal(sessionTitle(session),'Out of Possession · Screen, Shuffle, Squeeze');
 assert.equal(sessionModelError(session),'');
 assert.ok(sessionModelError({...session,gameModelPlan:{gamePhase:'in-possession',primaryPrincipleId:'screen-shuffle-squeeze'}}));
 assert.ok(sessionModelError({theme:'Passing Activation'}));
 assert.equal(sessionTitle({theme:'Core Passing Activations'}),'Session · phase / principle not recorded');
});
test('activation suggestions reflect explicit text; manual selections and exclusions win',()=>{
 const drill={stage:'Activation',name:"1/2 Supporting Runs",cp:'Scan before receiving on the back foot. Quality of pass.'};
 assert.deepEqual(passingFundamentals(drill),['scanning','back-foot','weight','one-two','movement']);
 assert.deepEqual(passingFundamentals({...drill,passingFundamentals:[]}),[]);
 assert.deepEqual(passingFundamentals({...drill,passingFundamentals:['height','depth','height']}),['height','depth']);
 assert.deepEqual(passingFundamentals({name:'Random tactical game',cp:'Scanning'}),[]);
});
test('fundamental filters require all selected tags and stack with format',()=>{
 const drill={practiceFormat:'passing-activation',passingFundamentals:['scanning','back-foot']};
 const f=createFilterState({fundamentals:['scanning','back-foot'],formats:['passing-activation']});
 assert.equal(matchesPracticeFilters(drill,f),true);
 f.fundamentals.add('depth');assert.equal(matchesPracticeFilters(drill,f),false);
 assert.equal(hasActivePracticeFilters(createFilterState({fundamentals:['depth']})),true);
 assert.equal(matchesPracticeFilters(drill,createFilterState({search:'back foot'})),true);
});
test('fundamentals survive cross-device decisions and old cache entries do not erase them',()=>{
 const phone=applyFourPhaseDecision({id:'p'},{passingFundamentals:['height','depth'],practiceFormat:'passing-activation',updatedAt:200});
 const cache={p:{passingFundamentals:['one-two'],updatedAt:100}};
 const data=JSON.parse(JSON.stringify({practices:[phone]}));
 applyStoredFourPhaseDecisions(data,cache);
 assert.deepEqual(data.practices[0].passingFundamentals,['height','depth']);
 assert.deepEqual(cache.p.passingFundamentals,['height','depth']);
 applyFourPhaseDecision(data.practices[0],{updatedAt:300});
 assert.deepEqual(data.practices[0].passingFundamentals,['height','depth']);
 applyFourPhaseDecision(data.practices[0],{updatedAt:400,passingFundamentals:[]});
 assert.deepEqual(data.practices[0].passingFundamentals,[]);
});
