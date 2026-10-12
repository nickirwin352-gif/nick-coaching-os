import {SyncEngine,clone} from './sync-engine.js';
const KEY='nickCoachOutboxV3';
const CACHE='nickCoachOSv3';
let engine,writer,receiver,timer,running=false,delay=1500,lastError='',lastSynced='',connected=false;
let ownsWorkspace=typeof navigator==='undefined'||!navigator.locks;
const subscribers=new Set();
const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key)||'null')||fallback;}catch{return fallback;}};
export function status(){
 const pending=engine?.ops.size||0,conflicts=[...(engine?.ops.values()||[])].filter(x=>x.conflict).length;
 return {pending,conflicts,running,connected,blocked:!ownsWorkspace,online:typeof navigator==='undefined'||navigator.onLine,lastError,lastSynced};
}
function emit(){const s=status();subscribers.forEach(fn=>fn(s));if(typeof window!=='undefined')window.dispatchEvent(new CustomEvent('coaching:sync',{detail:s}));}
export function getEngine(){
 if(!engine)engine=new SyncEngine({initial:read(CACHE,{practices:[],sessions:[],sessionTemplates:[],banks:{}}),saved:read(KEY,{}),persist:data=>localStorage.setItem(KEY,JSON.stringify(data)),notify:emit});
 return engine;
}
function schedule(ms=0){clearTimeout(timer);timer=setTimeout(flush,ms);}
export function enqueue(data){
 if(!ownsWorkspace)throw new Error('Another tab is using this workspace. Close that tab, then retry saving here.');
 const e=getEngine();
 try{
  const receipt=e.capture(data);
  localStorage.setItem(CACHE,JSON.stringify(data));
  lastError='';emit();schedule();return receipt;
 }catch(error){lastError='Device storage is full or unavailable. Keep this page open and export your work.';emit();throw error;}
}
export function receive(data){connected=true;const next=getEngine().receive(data);if(ownsWorkspace)localStorage.setItem(CACHE,JSON.stringify(next));emit();schedule(lastError?delay:0);return next;}
export function connect(write,onChange){writer=write;receiver=onChange;schedule();}
export async function flush(){
 clearTimeout(timer);
 if(running||!writer||!connected||!status().online||!ownsWorkspace)return;
 const e=getEngine();if(![...e.ops.values()].some(op=>!op.conflict)){emit();return;}
 running=true;emit();
 try{
  await e.flush(writer);delay=1500;lastError='';
  if(!e.ops.size)lastSynced=new Date().toISOString();
  localStorage.setItem(CACHE,JSON.stringify(e.view));receiver?.(clone(e.view));
 }catch(error){lastError=error?.message||'Cloud unavailable';delay=Math.min(delay*2,60000);}
 finally{running=false;emit();if([...e.ops.values()].some(op=>!op.conflict))schedule(lastError?delay:0);}
}
export function resolve(key,choice){if(!ownsWorkspace)return false;if(!getEngine().resolve(key,choice))return false;localStorage.setItem(CACHE,JSON.stringify(engine.view));receiver?.(clone(engine.view));schedule();return true;}
export function subscribe(fn){subscribers.add(fn);fn(status());return()=>subscribers.delete(fn);}
if(typeof window!=='undefined'){
 getEngine();
 if(navigator.locks)navigator.locks.request('nickCoachWorkspaceWriterV3',async()=>{
  // A second tab may have waited while the first tab made further edits.
  engine=undefined;getEngine();ownsWorkspace=true;emit();
  if(window.nickCloud?.getCurrent)try{receiver?.(await window.nickCloud.getCurrent());}catch{}
  schedule();await new Promise(()=>{});
 });
 window.NickPersistence={enqueue,subscribe,status,flush,resolve,conflicts:()=>[...getEngine().ops.values()].filter(x=>x.conflict).map(clone)};
 window.addEventListener('online',()=>schedule());window.addEventListener('offline',emit);
 window.addEventListener('coaching:cloud-error',event=>{lastError=String(event.detail||'Cloud connection failed');emit();});
 window.addEventListener('storage',event=>{if(event.key===KEY)window.dispatchEvent(new CustomEvent('coaching:other-tab'));});
}
