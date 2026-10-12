import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {getFirestore,doc,getDoc,onSnapshot,serverTimestamp,collection,addDoc,getDocs,query,orderBy,limit,runTransaction} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import {mergeRecord,clone} from './sync-engine.js';
import {enqueue,receive,connect,getEngine} from './persistence-client.js';
const firebaseConfig = {
  apiKey: "AIzaSyDbBy2QfJZ2y-Mq8cpeqLjDEBgrcIdclYI",
  authDomain: "nick-coaching-os.firebaseapp.com",
  projectId: "nick-coaching-os",
  storageBucket: "nick-coaching-os.firebasestorage.app",
  messagingSenderId: "250479748129",
  appId: "1:250479748129:web:5b8bd15b91d6a14a7d2f60"
};


if(['localhost','127.0.0.1'].includes(location.hostname)){
 await import('./local-test-cloud.js');
}else{
const firestore=getFirestore(initializeApp(firebaseConfig));
const COLLECTIONS={practices:'coachingOSPractices',sessions:'coachingOSSessions',sessionTemplates:'coachingOSSessionBlueprints',banks:'coachingOSWordbanks',backups:'coachingOSBackups'};
const listeners=new Set();
let latestRemote=null;
const makeDocId=id=>encodeURIComponent(String(id)).replace(/\./g,'%2E').slice(0,140);
function payload(snap){if(!snap.exists())return undefined;const value=snap.data();return value.deleted?undefined:clone(value.data||value);}
function publish(data,source='remote'){
 const safe=receive(data);
 listeners.forEach(callback=>callback({data:clone(safe),source}));
}
async function writeOperation(op){
 const ref=doc(firestore,COLLECTIONS[op.collection],makeDocId(op.id));
 return runTransaction(firestore,async tx=>{
  const snapshot=await tx.get(ref),remote=payload(snapshot);
  const result=mergeRecord(op.base,op.local,remote);
  if(result.conflicts.length)return {...result,remote};
  const revision=Number(snapshot.data()?.revision||0)+1;
  tx.set(ref,{data:result.value===undefined?null:result.value,deleted:result.value===undefined,revision,updatedAt:serverTimestamp()});
  return {...result,revision};
 });
}
connect(writeOperation,data=>listeners.forEach(callback=>callback({data:clone(data),source:'local-ack'})));
let unsubscribeAll=null;
function startListening(){
 if(unsubscribeAll)return;
 const buckets=new Map(),ready=new Set();let timer;
 const notify=()=>{
  clearTimeout(timer);timer=setTimeout(()=>{
   if(ready.size!==4)return;
   latestRemote={practices:[...buckets.get('practices').values()],sessions:[...buckets.get('sessions').values()],sessionTemplates:[...buckets.get('sessionTemplates').values()],banks:buckets.get('banks')||{}};
   publish(latestRemote);
  },80);
 };
 const stops=['practices','sessions','sessionTemplates'].map(key=>{
  const map=new Map();buckets.set(key,map);
  return onSnapshot(collection(firestore,COLLECTIONS[key]),snapshot=>{
   snapshot.docChanges().forEach(change=>{const value=payload(change.doc);if(change.type==='removed'||value===undefined)map.delete(change.doc.id);else map.set(change.doc.id,value);});
   ready.add(key);notify();
  },error=>window.dispatchEvent(new CustomEvent('coaching:cloud-error',{detail:error.message})));
 });
 stops.push(onSnapshot(doc(firestore,COLLECTIONS.banks,'master'),snapshot=>{buckets.set('banks',payload(snapshot)||{});ready.add('banks');notify();},error=>window.dispatchEvent(new CustomEvent('coaching:cloud-error',{detail:error.message}))));
 unsubscribeAll=()=>{stops.forEach(stop=>stop());clearTimeout(timer);unsubscribeAll=null;};
}
window.nickCloud={
 version:3,
 save:async data=>enqueue(data),
 saveSessions:async sessions=>enqueue({...clone(getEngine().view),sessions:clone(sessions)}),
 getCurrent:async()=>{
  const [practices,sessions,templates,bank]=await Promise.all([getDocs(collection(firestore,COLLECTIONS.practices)),getDocs(collection(firestore,COLLECTIONS.sessions)),getDocs(collection(firestore,COLLECTIONS.sessionTemplates)),getDoc(doc(firestore,COLLECTIONS.banks,'master'))]);
  return receive({practices:practices.docs.map(payload).filter(Boolean),sessions:sessions.docs.map(payload).filter(Boolean),sessionTemplates:templates.docs.map(payload).filter(Boolean),banks:payload(bank)||{}});
 },
 listen:callback=>{
  listeners.add(callback);callback({data:clone(getEngine().view),pendingRemote:!latestRemote,source:'local-cache-fast-start'});
  startListening();return()=>{listeners.delete(callback);if(!listeners.size)unsubscribeAll?.();};
 },
 createBackup:async data=>addDoc(collection(firestore,COLLECTIONS.backups),{data:clone(data),createdAt:serverTimestamp(),label:new Date().toLocaleString('en-GB'),structure:'revision-outbox-v3'}),
 loadBackups:async()=>{const snapshot=await getDocs(query(collection(firestore,COLLECTIONS.backups),orderBy('createdAt','desc'),limit(25)));return snapshot.docs.map(d=>({id:d.id,...d.data()}));}
};
window.dispatchEvent(new Event('coaching:cloud-ready'));

}
