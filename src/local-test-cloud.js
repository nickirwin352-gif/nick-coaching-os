// Localhost-only fixture transport. Never connects to the coach's Firestore.
import {clone,mergeRecord} from './sync-engine.js';
import {connect,receive,enqueue,getEngine} from './persistence-client.js';
const key='nickCoachLocalTestCloud';
const practice={id:'TEST-1',name:'Third player test practice',theme:'Build Up',stage:'Skill Practice',players:'8',time:'10 min',area:'20 x 25',desc:'Find the player beyond pressure.',cp:'Scan before receiving.',diagram:[],pitchMode:'full',gameModelPhaseIds:['in-possession'],gameModelPrincipleIds:['rotate-replace-release'],practicePurpose:'recognise',practiceFormat:'rondo',fourPhaseOrganisationSource:'manual',fourPhaseModelVersion:2};
let remote=JSON.parse(localStorage.getItem(key)||'null')||{practices:[practice,{...clone(practice),id:'TEST-2',name:'Directional transfer game',stage:'Conditioned Game',practicePurpose:'transfer',practiceFormat:'small-sided-game'}],sessions:[],sessionTemplates:[],banks:typeof defaultBanks==='undefined'?{}:clone(defaultBanks)};
const callbacks=new Set();
function publish(){const data=receive(remote);callbacks.forEach(fn=>fn({data:clone(data),source:'local-test'}));}
connect(async op=>{
 const collection=op.collection==='banks'?null:remote[op.collection];
 const existing=collection?.find(x=>x.id===op.id)||(op.collection==='banks'?remote.banks:undefined);
 const result=mergeRecord(op.base,op.local,existing);
 if(result.conflicts.length)return {...result,remote:existing};
 if(collection){const index=collection.findIndex(x=>x.id===op.id);if(index>=0)collection.splice(index,1);if(result.value!==undefined)collection.push(result.value);}else remote.banks=result.value||{};
 localStorage.setItem(key,JSON.stringify(remote));return result;
},data=>callbacks.forEach(fn=>fn({data,source:'local-test-ack'})));
window.nickCloud={version:3,save:async data=>enqueue(data),getCurrent:async()=>receive(remote),listen:fn=>{callbacks.add(fn);publish();return()=>callbacks.delete(fn);},createBackup:async()=>{},loadBackups:async()=>[]};
const banner=document.createElement('p');banner.textContent='LOCAL TEST WORKSPACE — sample data only; no production cloud access';banner.style='background:#ffe08a;color:#111;padding:10px';document.body.prepend(banner);
window.dispatchEvent(new Event('coaching:cloud-ready'));
