import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {SyncEngine,clone} from '../src/sync-engine.js';
import * as domain from '../src/coaching-domain.js';
import {syncPresentation} from '../src/sync-presentation.js';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const loop=fs.readFileSync(new URL('../src/coaching-loop.js',import.meta.url),'utf8');
function learning(){
 const fields=new Map(['evidence','observe','trigger','roles','alternative','individualFocus','transferTask'].map(k=>['learning-'+k,{value:''}]));
 const storage=new Map();
 const ctx={...domain,clone,db:{practices:[{id:'p1',name:'Original'}]},plannerDrills:['p1'],window:{},document:{getElementById:id=>fields.get(id)},localStorage:{setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},GAME_MODEL_PRINCIPLES:[],principleById:()=>null};
 vm.createContext(ctx);vm.runInContext(loop.replace(/^import .*;$/gm,'').replaceAll('export ','').replace("if(typeof window!=='undefined'&&typeof document!=='undefined')install();",'')+'\nwindow.test={load,capture,rememberDraft,reset};',ctx);
 return {ctx,api:ctx.window.test,fields,storage};
}
test('reopening learning fields retains the saved practice snapshot and prescriptions',()=>{
 const {ctx,api,fields}=learning();const session={drills:['p1'],coaching:{evidence:'Match clip 3',observe:'Receive facing forward',instances:domain.alignInstances(['p1'],[],ctx.db.practices)}};
 session.coaching.instances[0].prescription.minutes='14';ctx.db.practices[0].name='New template';api.load(session);
 assert.equal(fields.get('learning-evidence').value,'Match clip 3');assert.equal(api.capture().instances[0].snapshot.name,'Original');assert.equal(api.capture().instances[0].prescription.minutes,'14');
 fields.get('learning-observe').value='Recognise pressure';assert.equal(api.capture().observe,'Recognise pressure');
});
test('learning draft recovery also preserves the surrounding session form',()=>{
 const {ctx,api,storage}=learning();ctx.currentPlannerSession=()=>({team:'U18',date:'2026-10-15',cues:'Scan',coaching:api.capture(),diagramOverrides:[{pitchMode:'half'}]});
 api.rememberDraft();const saved=JSON.parse(storage.get('nickCoachLearningDraftV1'));assert.equal(saved.planner.team,'U18');assert.equal(saved.planner.diagramOverrides[0].pitchMode,'half');assert.equal(saved.drills[0],'p1');
});
test('the active session loader hydrates learning fields before drawing the planner',()=>{
 const code=html.match(/loadSessionToPlanner=function\(i,mode='edit'\)\{[^\n]+/)[0];const sequence=[];
 const session={id:'s1',drills:['p1'],coaching:{evidence:'Saved evidence'}};
 const ctx={db:{sessions:[session]},window:{NickCoachingLoop:{load:s=>sequence.push(s.coaching.evidence)},scrollTo(){}},document:{getElementById:()=>({}),querySelector:()=>({click(){}})},sessionDrillIds:s=>s.drills,dsClone:clone,renderSessionDrillList:()=>sequence.push('render')};
 for(const id of ['sDate','team','sTheme','objective','links','cues','reflect','sessionRating'])ctx[id]={value:''};
 for(const name of ['populatePlannerThemeFilter','dsEnsurePlannerOverrides','showBuildRoute','updatePlannerSaveControls','renderObjectiveChips','renderPlannerPracticeOptions','renderPreview','renderVisualPicker'])ctx[name]=()=>{};
 vm.runInNewContext(code+';loadSessionToPlanner(0);',ctx);assert.deepEqual(sequence,['Saved evidence','render']);
});
test('sideline delivery prioritises session cues and escapes user-entered text',()=>{
 const source=html.match(/function sidelineTabContent\(p\)\{[\s\S]*?\n\}/)[0];const ctx={sidelineState:{activeTab:'coaching'},splitContentLines:s=>s.split('\n'),escapeHtml:s=>s.replaceAll('<','&lt;').replaceAll('>','&gt;')};
 vm.runInNewContext(source,ctx);const result=ctx.sidelineTabContent({cp:'Wordy template',deliveryCues:'Fast',sessionPrescription:{focus:'<scan>'}});assert.match(result,/&lt;scan&gt;/);assert.doesNotMatch(result,/Wordy template|<scan>/);
});
test('connection errors and offline state override an old acknowledgement',()=>{
 assert.match(syncPresentation({lastSynced:new Date().toISOString(),lastError:'Denied'}).text,/attention/);
 assert.match(syncPresentation({lastSynced:new Date().toISOString(),online:false}).text,/Offline/);
});
test('remote updates do not bypass cloud retry backoff',async()=>{
 const source=fs.readFileSync(new URL('../src/persistence-client.js',import.meta.url),'utf8');const timers=[];const storage=new Map();
 const ctx={SyncEngine,clone,navigator:{onLine:true},window:{addEventListener(){},dispatchEvent(){}},CustomEvent:class{},localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},setTimeout:(fn,ms)=>{timers.push(ms);return timers.length;},clearTimeout(){}};
 vm.createContext(ctx);vm.runInContext(source.replace(/^import .*;$/gm,'').replaceAll('export ','')+'\nwindow.test={connect,receive,enqueue,flush};',ctx);
 const a=ctx.window.test,base={practices:[],sessions:[],sessionTemplates:[],banks:{}};a.receive(base);a.connect(async()=>{throw Error('Unavailable');});a.enqueue({...base,sessions:[{id:'s1'}]});await a.flush();assert.equal(timers.at(-1),3000);a.receive(base);assert.equal(timers.at(-1),3000);
});

test('coaching pathway is mounted outside the hidden diagram studio',()=>{
 assert.match(loop,/document\.body\.append\(view\)/);
 assert.doesNotMatch(loop,/document\.querySelector\('main'\)/);
});
