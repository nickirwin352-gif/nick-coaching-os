import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {clone,mergeRecord} from '../src/sync-engine.js';
const source=fs.readFileSync(new URL('../src/firebase-cloud.js',import.meta.url),'utf8');
async function adapter(remote){
 let writer,stored=remote,sets=0,queued;
 const initial={practices:[{id:'p'}],sessions:[],sessionTemplates:[],banks:{}};
 const context={location:{hostname:'test.example'},window:{dispatchEvent(){}},Event:class{},CustomEvent:class{},console,setTimeout,clearTimeout,
  clone,mergeRecord,enqueue:data=>(queued=clone(data)),receive:clone,getEngine:()=>({view:initial}),connect:fn=>{writer=fn;},initializeApp:()=>({}),getFirestore:()=>({}),doc:(_,collection,id)=>({collection,id}),collection:(_,name)=>name,
  onSnapshot:()=>()=>{},serverTimestamp:()=>123,
  runTransaction:async(_,fn)=>fn({get:async()=>({exists:()=>!!stored,data:()=>stored}),set:(_,value)=>{stored=value;sets++;}})};
 await vm.runInNewContext('(async()=>{'+source.replace(/^import .*;$/gm,'')+'})()',context);
 return {cloud:context.window.nickCloud,write:op=>writer(op),get stored(){return stored;},get sets(){return sets;},get queued(){return queued;}};
}
test('Firebase transaction merges independent fields and increments the existing revision',async()=>{
 const a=await adapter({data:{id:'p',name:'Original',cp:'Remote'},revision:4});
 const result=await a.write({collection:'practices',id:'p',base:{id:'p',name:'Original',cp:'Old'},local:{id:'p',name:'Local',cp:'Old'}});
 assert.equal(result.conflicts.length,0);assert.equal(a.stored.data.name,'Local');assert.equal(a.stored.data.cp,'Remote');assert.equal(a.stored.revision,5);assert.equal(a.sets,1);
});
test('Firebase conflicting writes retain remote data and return both alternatives',async()=>{
 const a=await adapter({data:{id:'p',name:'Remote'},revision:4});
 const result=await a.write({collection:'practices',id:'p',base:{id:'p',name:'Original'},local:{id:'p',name:'Local'}});
 assert.equal(a.sets,0);assert.equal(result.conflicts[0].path,'name');assert.equal(result.remote.name,'Remote');
});
test('deletions retain a server revision as a tombstone',async()=>{
 const a=await adapter({data:{id:'p'},revision:2});await a.write({collection:'practices',id:'p',base:{id:'p'},local:undefined});
 assert.equal(a.stored.deleted,true);assert.equal(a.stored.data,null);assert.equal(a.stored.revision,3);
});
test('local cache opens before remote hydration and session-only saves preserve other records',async()=>{
 const a=await adapter();let received;a.cloud.listen(data=>{received=data;});assert.equal(received.pendingRemote,true);assert.equal(received.data.practices[0].id,'p');
 await a.cloud.saveSessions([{id:'s'}]);assert.equal(a.queued.practices[0].id,'p');assert.equal(a.queued.sessions[0].id,'s');
});
