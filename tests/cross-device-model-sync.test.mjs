import {sessionModelError} from '../src/session-identity.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {applyStoredFourPhaseDecisions,applyFourPhaseDecision,cleanFourPhaseDecision} from '../src/four-phase-practice-persistence-v1.js';
const decision=(time,format='rondo')=>({phaseIds:['out-of-possession'],principleIds:['screen-shuffle-squeeze'],subPrincipleIds:['shuffle-together'],practicePurpose:'recognise',practiceFormat:format,noGameModelLink:false,updatedAt:time});
test('phone manual changes replace stale laptop decisions and are not reverted on subsequent refresh',()=>{
  const phone=applyFourPhaseDecision({id:'p1'},decision(200,'phase-play'));
  const laptopCache={p1:decision(100,'rondo')};
  const laptop=JSON.parse(JSON.stringify({practices:[phone]}));
  applyStoredFourPhaseDecisions(laptop,laptopCache);
  assert.equal(laptop.practices[0].practiceFormat,'phase-play');
  assert.equal(laptopCache.p1.updatedAt,200);
  applyStoredFourPhaseDecisions(laptop,laptopCache);
  assert.deepEqual(laptop.practices[0].gameModelPrincipleIds,['screen-shuffle-squeeze']);
  assert.equal(laptop.practices[0].practiceFormat,'phase-play');
});
test('unsynced newer edits and intentional cleared principles survive an older cloud copy',()=>{
  const remote=applyFourPhaseDecision({id:'p1'},decision(100));
  const latest={...decision(300,'physical'),noGameModelLink:true};
  const data={practices:[remote]};
  applyStoredFourPhaseDecisions(data,{p1:latest});
  assert.deepEqual(data.practices[0].gameModelPrincipleIds,[]);
  assert.equal(data.practices[0].practiceFormat,'physical');
  assert.equal(data.practices[0].fourPhaseDecisionUpdatedAt,300);
});
test('legacy decisions are not assigned a fabricated fresh timestamp',()=>{
  assert.equal(cleanFourPhaseDecision({practiceFormat:'rondo'}).updatedAt,0);
});
test('every session save path explicitly includes the selected model and saved cards show it',()=>{
  const index=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
  const speed=fs.readFileSync(new URL('../src/session-library-speed-v2.js',import.meta.url),'utf8');
  assert.ok(index.includes("const base={gameModelPlan:window.NickFourPhaseGameModel?.currentPlan?.(),"));
  assert.ok(speed.includes('base.gameModelPlan=window.NickFourPhaseGameModel.currentPlan()'));
  assert.ok(speed.includes('phaseById(plan.gamePhase)?.label'));
  assert.ok(speed.includes('principleById(plan.primaryPrincipleId)?.message'));
});

test('fast session save round-trips phone model selections through a cloud JSON payload',async()=>{
  const vm=await import('node:vm');
  const source=fs.readFileSync(new URL('../src/session-library-speed-v2.js',import.meta.url),'utf8');
  const install=source.slice(source.indexOf('function installFastSessionSave()'),source.indexOf('function getEffectivePractice'));
  const plan={gamePhase:'out-of-possession',primaryPrincipleId:'screen-shuffle-squeeze',subPrincipleIds:['shuffle-together'],successLooksLike:'Stay compact',emphasis:'execute'};
  const db={sessions:[]};let payload;
  const context={sessionModelError,window:{NickFourPhaseGameModel:{currentPlan:()=>({...plan})}},saveSession:()=>{},currentPlannerSession:()=>({drills:['p1'],date:'2026-10-04',team:'Test'}),appDb:()=>db,makeLocalId:()=> 'session-test',persistFast:()=>{payload=JSON.stringify(db);},resetSessionPlanner:()=>{},showBuildRoute:()=>{},toast:()=>{},console};
  vm.runInNewContext(install+'\ninstallFastSessionSave();saveSession();',context);
  const laptop=JSON.parse(payload);
  assert.deepEqual(laptop.sessions[0].gameModelPlan,plan);
  assert.equal(laptop.sessions[0].id,'session-test');
});
