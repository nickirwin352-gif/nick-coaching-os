import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildPrincipleWordBanks,resolveBankContext} from '../src/principle-word-bank-data.js';
import {principleDelivery,contextualPhrases,PRINCIPLE_DELIVERY,DELIVERY_FIELDS,technicalBank} from '../src/personal-coaching-model.js';
import {practiceArchitecture} from '../src/four-phase-practice-system-v1.js';

test('phase-only suggestions narrow to the selected principle and then sub-principle',()=>{
 const phase=buildPrincipleWordBanks({phaseIds:['in-possession']});
 assert.ok(phase.cp.includes('Soft set'));assert.ok(phase.cp.includes('Clip far post'));
 assert.ok(!phase.cp.includes('Nothing inside'));
 const main=buildPrincipleWordBanks({phaseIds:['in-possession'],principleIds:['arrive-affect-away']});
 assert.ok(main.cp.includes('Hold if free'));assert.ok(!main.cp.includes('Clip far post'));
 const sub=buildPrincipleWordBanks({phaseIds:['in-possession'],principleIds:['arrive-affect-away'],subPrincipleIds:['arrive-to-affect']});
 assert.ok(sub.cues.includes('Connect'));assert.ok(!sub.cues.includes('Open'));assert.ok(!sub.cp.includes('Hold if free'));
});

test('shared finishing principle preserves the phase actually selected',()=>{
 for(const phase of ['in-possession','attacking-transition']){
  assert.equal(resolveBankContext({phaseIds:[phase],principleIds:['stretch-supply-strike']}).principles.length,1);
  assert.deepEqual(practiceArchitecture({gameModelPhaseIds:[phase],gameModelPrincipleIds:['stretch-supply-strike']}).phaseIds,[phase]);
 }
});

test('technical no-link path is useful and distinguishes back foot from open body',()=>{
 const bank=buildPrincipleWordBanks({noGameModelLink:true,practiceFormat:'passing-activation',passingFundamentals:['back-foot']});
 assert.ok(bank.cp.includes('Back foot to release'));assert.ok(!bank.cp.includes('Open when space allows'));assert.deepEqual(bank.links,[]);
 assert.ok(technicalBank({practiceFormat:'finishing'}).cp.includes('Follow the second ball'));
 const custom={'technical:finishing':{cp:['My finishing cue'],reg:[]}};
 assert.deepEqual(buildPrincipleWordBanks({noGameModelLink:true,practiceFormat:'finishing'},custom).cp,['My finishing cue']);
 assert.deepEqual(buildPrincipleWordBanks({noGameModelLink:true,practiceFormat:'finishing'},custom).reg,[]);
});

test('personal memory is context-bound, ranks purpose then format, and excludes retired fallback text',()=>{
 const c={phaseIds:['in-possession'],principleIds:['arrive-affect-away'],subPrincipleIds:['arrive-to-affect'],practicePurpose:'recognise',practiceFormat:'possession-box'};
 const base={gameModelPhaseIds:c.phaseIds,gameModelPrincipleIds:c.principleIds,gameModelSubPrincipleIds:c.subPrincipleIds};
 const rows=[{...base,cp:'Format match',practiceFormat:'possession-box'},{...base,cp:'Purpose match',practicePurpose:'recognise'},{...base,cp:'Quality of pass'},{...base,cp:'Wrong sub',gameModelSubPrincipleIds:['recover-danger-first']}];
 assert.deepEqual(contextualPhrases(c,'cp',rows),['Purpose match','Format match']);
 assert.deepEqual(contextualPhrases({},'cp',rows),[]);
});

test('all decisions have five coherent draft fields and explicit coach edits win including empty strings',()=>{
 assert.equal(Object.keys(PRINCIPLE_DELIVERY).length,9);
 for(const id of Object.keys(PRINCIPLE_DELIVERY))for(const key of Object.keys(DELIVERY_FIELDS))assert.ok(principleDelivery(id)[key]);
 assert.equal(principleDelivery('react-recover-reconnect',{'react-recover-reconnect':{action:'My choice',trigger:''}}).action,'My choice');
 assert.equal(principleDelivery('react-recover-reconnect',{'react-recover-reconnect':{trigger:''}}).trigger,'');
 assert.match(principleDelivery('react-recover-reconnect').alternative,/escapes.*back line/);
});

test('activation suggestions preserve the match intention without adding unrelated opposed conditions',()=>{
 const bank=buildPrincipleWordBanks({principleIds:['combine-commit-cover'],practicePurpose:'prepare',practiceFormat:'passing-activation',passingFundamentals:['weight']});
 assert.ok(bank.cp.includes('Punched to feet'));
 assert.deepEqual(bank.prog,['Start simple, add a bounce, then rehearse the match picture.']);
 assert.ok(bank.cond.every(t=>!t.includes('bonus')));
});

test('background suggestion reads cannot schedule cloud writes',()=>{
 const source=readFileSync(new URL('../src/coaching-personalisation-automation.js',import.meta.url),'utf8');
 assert.doesNotMatch(source,/nickCloud\.save|persistQuietly|b\.cp = merge/);
});
