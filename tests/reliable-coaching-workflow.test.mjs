import test from 'node:test';
import assert from 'node:assert/strict';
import {SyncEngine,mergeRecord,clone} from '../src/sync-engine.js';
import {alignInstances,changeInstances,effectiveInstance,nextActions,validateBackup} from '../src/coaching-domain.js';
import {syncPresentation} from '../src/sync-presentation.js';
import {classificationReview,inferPracticeFormat} from '../src/four-phase-practice-system-v1.js';
const workspace=()=>({practices:[{id:'p1',name:'Original',cp:'Scan'}],sessions:[],sessionTemplates:[],banks:{}});
const record=(data,id='p1')=>data.practices.find(p=>p.id===id);
function server(initial){let data=clone(initial);return {get data(){return clone(data);},set data(v){data=clone(v);},async write(op){const list=op.collection==='banks'?null:data[op.collection];const remote=list?list.find(x=>x.id===op.id):data.banks;const result=mergeRecord(op.base,op.local,remote);if(result.conflicts.length)return {...result,remote};if(list){data[op.collection]=list.filter(x=>x.id!==op.id);if(result.value!==undefined)data[op.collection].push(clone(result.value));}else data.banks=clone(result.value);return result;}};}
test('different device edits to different fields merge without losing either',async()=>{
 const base=workspace(),cloud=server(base),phone=new SyncEngine({initial:base}),laptop=new SyncEngine({initial:base});
 const a=clone(base),b=clone(base);record(a).name='Phone';record(b).cp='Laptop';phone.capture(a);laptop.capture(b);
 await phone.flush(cloud.write);await laptop.flush(cloud.write);assert.deepEqual(record(cloud.data),{id:'p1',name:'Phone',cp:'Laptop'});
});
test('same field edits retain both versions as a conflict until explicitly resolved',async()=>{
 const base=workspace(),cloud=server(base),e=new SyncEngine({initial:base});const local=clone(base);record(local).name='Local';e.capture(local);
 const remote=clone(base);record(remote).name='Remote';cloud.data=remote;await e.flush(cloud.write);
 assert.equal(record(cloud.data).name,'Remote');assert.equal(e.ops.size,1);assert.equal(e.ops.get('practices/p1').conflict.fields[0].path,'name');
 e.resolve('practices/p1','local');await e.flush(cloud.write);assert.equal(record(cloud.data).name,'Local');assert.equal(e.ops.size,0);
});
test('failed save never replaces a newer queued edit',async()=>{
 const base=workspace(),e=new SyncEngine({initial:base});const first=clone(base);record(first).name='One';e.capture(first);
 let reject;const task=e.flush(()=>new Promise((_,r)=>reject=r));const newer=clone(first);record(newer).name='Two';e.capture(newer);reject(Error('offline'));await assert.rejects(task);
 assert.equal(e.ops.get('practices/p1').local.name,'Two');const cloud=server(base);await e.flush(cloud.write);assert.equal(record(cloud.data).name,'Two');
});
test('reverting an edit while its earlier value is in flight persists the revert',async()=>{
 const base=workspace(),e=new SyncEngine({initial:base}),cloud=server(base);const first=clone(base);record(first).name='Changed';e.capture(first);
 let release;const task=e.flush(op=>new Promise(resolve=>release=async()=>resolve(await cloud.write(op))));e.capture(base);await release();await task;await e.flush(cloud.write);assert.equal(record(cloud.data).name,'Original');
});
test('new local edits during acknowledgement are rebased on merged server fields',async()=>{
 const base=workspace(),e=new SyncEngine({initial:base}),cloud=server(base);const remote=clone(base);record(remote).cp='Remote cue';cloud.data=remote;
 const first=clone(base);record(first).name='One';e.capture(first);let release;const task=e.flush(op=>new Promise(resolve=>release=async()=>resolve(await cloud.write(op))));const next=clone(first);record(next).name='Two';e.capture(next);await release();await task;await e.flush(cloud.write);assert.deepEqual(record(cloud.data),{id:'p1',name:'Two',cp:'Remote cue'});
});
test('queued records survive restart and overlay stale initial hydration',async()=>{
 const base=workspace();let saved;const e=new SyncEngine({initial:base,persist:data=>saved=clone(data)});const next=clone(base);next.sessions.push({id:'s1',coaching:{evidence:'Match 1'}});e.capture(next);
 const reopened=new SyncEngine({initial:next,saved});assert.equal(reopened.receive(base).sessions[0].coaching.evidence,'Match 1');const cloud=server(base);await reopened.flush(cloud.write);assert.equal(cloud.data.sessions.length,1);
});
test('unseen remote additions are never inferred as local deletions',async()=>{
 const base=workspace(),e=new SyncEngine({initial:base}),cloud=server(base);const remote=clone(base);remote.practices.push({id:'p2',name:'Elsewhere'});cloud.data=remote;
 const local=clone(base);record(local).cp='New';e.capture(local);await e.flush(cloud.write);assert.equal(cloud.data.practices.length,2);assert.equal(e.receive(cloud.data).practices.length,2);
});
test('delete versus remote edit produces a conflict rather than silent deletion',async()=>{
 const base=workspace(),e=new SyncEngine({initial:base}),cloud=server(base);const next=clone(base);next.practices=[];e.capture(next);const remote=clone(base);record(remote).name='New';cloud.data=remote;await e.flush(cloud.write);assert.equal(e.ops.size,1);assert.equal(cloud.data.practices.length,1);e.resolve('practices/p1','remote');assert.equal(e.view.practices[0].name,'New');
});
test('simultaneous nested word bank and development edits merge independently',()=>{
 const base={banks:{goals:{},cues:['Check']}};const local=clone(base),remote=clone(base);local.banks.goals.g1={player:'Unit',goal:'Support'};remote.banks.cues=['Hold'];const merged=mergeRecord(base,local,remote);assert.equal(merged.conflicts.length,0);assert.equal(merged.value.banks.goals.g1.goal,'Support');assert.deepEqual(merged.value.banks.cues,['Hold']);
});
test('arrays such as diagram steps conflict as a complete field',()=>{
 const merged=mergeRecord({diagram:[1]},{diagram:[1,2]},{diagram:[3]});assert.equal(merged.conflicts[0].path,'diagram');
});
test('storage failure does not claim queued persistence or drop prior operations',()=>{
 const base=workspace(),e=new SyncEngine({initial:base,persist:()=>{throw Error('quota');}});const next=clone(base);record(next).name='New';assert.throws(()=>e.capture(next),/quota/);assert.equal(e.ops.size,0);assert.equal(record(e.view).name,'Original');
});
test('status never calls a pending change synced after an earlier acknowledgement',()=>{
 const view=syncPresentation({pending:1,lastSynced:new Date().toISOString(),online:true});assert.doesNotMatch(view.text,/Cloud synced/);assert.match(view.detail,/not yet acknowledged/);
 assert.match(syncPresentation({conflicts:1}).text,/conflict/);assert.match(syncPresentation({blocked:true}).text,/Another tab/);
});
test('practice snapshots preserve history after template changes',()=>{
 const base=workspace(),instances=alignInstances(['p1'],[],base.practices);instances[0].prescription.minutes='12';record(base).name='Edited template';const session={drills:['p1'],coaching:{instances}};const p=effectiveInstance(session,0,record(base));assert.equal(p.name,'Original');assert.equal(p.time,'12');
});
test('duplicate occurrences keep independent prescriptions and stable instance IDs through moves',()=>{
 let instances=alignInstances(['p1'],[],workspace().practices);instances[0].prescription.minutes='8';instances=changeInstances(instances,'duplicate',0);assert.notEqual(instances[0].id,instances[1].id);instances[1].prescription.minutes='15';instances=changeInstances(instances,'move',0,1);assert.equal(instances[0].prescription.minutes,'15');instances=changeInstances(instances,'remove',1);assert.equal(instances[0].prescription.minutes,'15');
});
test('session prescriptions and learning evidence survive JSON round trip',()=>{
 const session={id:'s',drills:['p1'],coaching:{evidence:'Clip 12',trigger:'Pressure behind',instances:alignInstances(['p1'],[],workspace().practices)}};session.coaching.instances[0].prescription.rotation='2 x 4 min';const loaded=clone(session);assert.equal(loaded.coaching.evidence,'Clip 12');assert.equal(loaded.coaching.instances[0].prescription.rotation,'2 x 4 min');
});
test('a review creates one stable next action, including its evidence and model',()=>{
 const data=workspace();data.sessions.push({id:'s1',gameModelPlan:{primaryPrincipleId:'rotate-replace-release'},review:{learning:{nextAction:'Revisit support',evidence:'Late twice',due:'2026-10-15'}}});assert.equal(nextActions(data).length,1);assert.equal(nextActions(data)[0].id,'review:s1');assert.equal(nextActions(data)[0].evidence,'Late twice');data.sessions[0].review.learning.actionStatus='done';assert.equal(nextActions(data)[0].status,'done');
});
test('grid corners do not imply set play and manual format choices remain intact',()=>{
 const p={name:'Sharp Turns Race',desc:'Sprint around the corner of the grid',theme:'Fitness',stage:'Activation'};assert.equal(inferPracticeFormat(p),'physical');assert.equal(inferPracticeFormat({...p,practiceFormat:'duel'}),'duel');assert.equal(classificationReview({...p,practiceFormat:'set-play'}).changed,true);assert.equal(classificationReview({...p,fourPhaseOrganisationSource:'manual'}).needsReview,false);
});
test('real restarts remain detectable',()=>{assert.equal(inferPracticeFormat({name:'Defending Corner'}),'set-play');assert.equal(inferPracticeFormat({name:'Attacking free-kick'}),'set-play');});
test('backup validation prevents partial malformed replacement and duplicate IDs',()=>{
 assert.doesNotThrow(()=>validateBackup(workspace()));assert.throws(()=>validateBackup({practices:[]}));const data=workspace();data.practices.push({...data.practices[0]});assert.throws(()=>validateBackup(data),/Duplicate/);
});

test('restart replays a durable outbox even when the display cache was not written',()=>{
 const base=workspace();let saved;const e=new SyncEngine({initial:base,persist:value=>saved=clone(value)});const changed=clone(base);record(changed).name='Durable edit';e.capture(changed);
 const reopened=new SyncEngine({initial:base,saved});assert.equal(record(reopened.view).name,'Durable edit');const next=clone(reopened.view);record(next).cp='Another edit';reopened.capture(next);assert.equal(reopened.ops.get('practices/p1').local.name,'Durable edit');
});
