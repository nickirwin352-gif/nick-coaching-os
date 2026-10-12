// Pure conflict-aware outbox. Arrays are atomic; object fields merge independently.
export const clone = value => value === undefined ? undefined : JSON.parse(JSON.stringify(value));
const object = x => x && typeof x === 'object' && !Array.isArray(x);
export function equal(a,b) {
  if (a === b) return true;
  if (Array.isArray(a) && Array.isArray(b)) return a.length===b.length && a.every((v,i)=>equal(v,b[i]));
  if (object(a) && object(b)) {
    const keys=new Set([...Object.keys(a),...Object.keys(b)]);
    return [...keys].every(k=>equal(a[k],b[k]));
  }
  return false;
}
export function mergeRecord(base,local,remote,path='') {
  if(equal(local,remote))return {value:clone(local),conflicts:[]};
  if(equal(local,base))return {value:clone(remote),conflicts:[]};
  if(equal(remote,base))return {value:clone(local),conflicts:[]};
  if(object(local)&&object(remote)&&(object(base)||base===undefined)){
    const value={},conflicts=[];
    for(const key of new Set([...Object.keys(base||{}),...Object.keys(local),...Object.keys(remote)])){
      if(['__proto__','constructor','prototype'].includes(key))continue;
      const result=mergeRecord(base?.[key],local[key],remote[key],path?`${path}.${key}`:key);
      if(result.value!==undefined)value[key]=result.value;
      conflicts.push(...result.conflicts);
    }
    return {value,conflicts};
  }
  return {value:clone(local),conflicts:[{path:path||'record',local:clone(local),remote:clone(remote)}]};
}
export const collections=['practices','sessions','sessionTemplates'];
export function records(data={}){
  const map=new Map();
  for(const collection of collections)for(const record of data[collection]||[]){
    if(record?.id)map.set(`${collection}/${record.id}`,{collection,id:String(record.id),value:record});
  }
  map.set('banks/master',{collection:'banks',id:'master',value:data.banks||{}});
  return map;
}
function put(data,op,value){
  if(op.collection==='banks'){data.banks=clone(value||{});return;}
  const list=data[op.collection]||(data[op.collection]=[]);
  const index=list.findIndex(x=>String(x.id)===op.id);
  if(value===undefined){if(index>=0)list.splice(index,1);}
  else if(index>=0)list[index]=clone(value);else list.push(clone(value));
}
export class SyncEngine {
  constructor({initial={},saved={},persist=()=>{},notify=()=>{}}={}){
    this.view=clone(initial);this.ops=new Map((saved.operations||[]).map(op=>[op.key,op]));
    this.sequence=saved.sequence||0;this.persist=persist;this.notify=notify;this.running=false;
    // The durable outbox can be newer than the display cache after a crash.
    const cached=records(this.view);
    for(const op of this.ops.values())put(this.view,op,mergeRecord(op.base,op.local,cached.get(op.key)?.value).value);
  }
  checkpoint(){this.persist({version:3,sequence:this.sequence,operations:[...this.ops.values()]});this.notify();}
  capture(next){
    const before=records(this.view),after=records(next);
    const previousOps=clone([...this.ops]);const previousSeq=this.sequence;
    for(const key of new Set([...before.keys(),...after.keys()])){
      const old=before.get(key),item=after.get(key);
      if(equal(old?.value,item?.value))continue;
      const existing=this.ops.get(key);
      const op={...(existing||{}),key,collection:(item||old).collection,id:(item||old).id,
        base:existing?existing.base:clone(old?.value),local:clone(item?.value),seq:++this.sequence};
      // A delete is recorded only when the client actually removed a known record.
      this.ops.set(key,op);
    }
    try{this.checkpoint();}catch(error){this.ops=new Map(previousOps);this.sequence=previousSeq;throw error;}
    this.view=clone(next);
    return {queued:this.ops.size>0,pending:this.ops.size,local:true};
  }
  receive(remote){
    const next=clone(remote),map=records(remote);
    for(const op of this.ops.values()){
      const result=mergeRecord(op.base,op.local,map.get(op.key)?.value);
      put(next,op,result.value);
    }
    this.view=next;return clone(next);
  }
  async flush(write){
    if(this.running)return;
    this.running=true;this.notify();
    try{
      for(const [key,entry] of [...this.ops]){
        if(entry.conflict)continue;
        const sent=clone(entry);
        const result=await write(sent);
        const current=this.ops.get(key);
        if(!current)continue;
        if(result.conflicts?.length){
          current.conflict={remote:clone(result.remote),fields:result.conflicts};
        }else{
          if(current.seq===sent.seq){this.ops.delete(key);put(this.view,sent,result.value);}
          else{
            const rebased=mergeRecord(sent.local,current.local,result.value);
            current.base=clone(result.value);current.local=rebased.value;
            if(rebased.conflicts.length)current.conflict={remote:clone(result.value),fields:rebased.conflicts};
            put(this.view,current,current.local);
          }
        }
        this.checkpoint();
      }
    }finally{this.running=false;this.notify();}
  }
  resolve(key,choice){
    const op=this.ops.get(key);if(!op?.conflict)return false;
    const remote=clone(op.conflict.remote);
    if(choice==='remote'){this.ops.delete(key);put(this.view,op,remote);}
    else if(choice==='local'){
      op.local=mergeRecord(op.base,op.local,remote).value;op.base=remote;
      delete op.conflict;op.seq=++this.sequence;put(this.view,op,op.local);
    }else return false;
    this.checkpoint();return true;
  }
}
