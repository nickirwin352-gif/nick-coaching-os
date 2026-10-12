import {clone} from './sync-engine.js';
export const uid=(prefix='item')=>`${prefix}-${globalThis.crypto?.randomUUID?.()||Date.now().toString(36)+'-'+Math.random().toString(36).slice(2)}`;
export function alignInstances(ids=[],instances=[],practices=[]){
 const used=new Set();
 return ids.map(id=>{
  const index=instances.findIndex((x,i)=>!used.has(i)&&x.practiceId===id);
  if(index>=0){used.add(index);return clone(instances[index]);}
  const practice=practices.find(x=>x.id===id)||{id,name:id};
  return {id:uid('instance'),practiceId:id,snapshot:clone(practice),prescription:{players:practice.players||'',area:practice.area||'',minutes:practice.time||'',rotation:'',equipment:'',focus:'',delivered:''}};
 });
}
export function changeInstances(instances,kind,index,target){
 const next=clone(instances||[]);
 if(kind==='remove')next.splice(index,1);
 if(kind==='duplicate'&&next[index])next.splice(index+1,0,{...clone(next[index]),id:uid('instance')});
 if(kind==='move'&&next[index]&&next[target])[next[index],next[target]]=[next[target],next[index]];
 if(kind==='clear')return [];
 if(kind==='removeAll')return next.filter(x=>x.practiceId!==index);
 return next;
}
export function effectiveInstance(session,index,fallback){
 const instance=session?.coaching?.instances?.[index];
 if(!instance||instance.practiceId!==session?.drills?.[index])return fallback;
 const p=instance.prescription||{},base=instance.snapshot||fallback;
 if(!base)return fallback;
 return {...clone(base),players:p.players||base.players,time:p.minutes||base.time,area:p.area||base.area,sessionPrescription:clone(p)};
}
export function nextActions(data={}){
 const reviewed=(data.sessions||[]).filter(s=>s.review?.learning?.nextAction).map(s=>({id:`review:${s.id}`,sourceSessionId:s.id,title:s.review.learning.nextAction,due:s.review.learning.due||'',status:s.review.learning.actionStatus||'open',evidence:s.review.learning.evidence||'',team:s.team||'',gameModelPlan:clone(s.gameModelPlan||{})}));
 const manual=Object.values(data.banks?.coachingActions||{});
 return [...reviewed,...manual].sort((a,b)=>(a.due||'9999').localeCompare(b.due||'9999'));
}
export function validateBackup(data){
 if(!data||typeof data!=='object'||Array.isArray(data))throw new Error('Backup must contain a workspace object.');
 for(const kind of ['practices','sessions','sessionTemplates']){
  if(!Array.isArray(data[kind]))throw new Error(`Backup is missing ${kind}.`);
  const ids=new Set();
  for(const item of data[kind]){
   if(!item||typeof item!=='object'||typeof item.id!=='string'||!item.id)throw new Error(`Invalid ${kind} record.`);
   if(ids.has(item.id))throw new Error(`Duplicate ${kind} ID: ${item.id}`);
   ids.add(item.id);
  }
 }
 if(!data.banks||typeof data.banks!=='object'||Array.isArray(data.banks))throw new Error('Invalid word banks.');
 return clone(data);
}
