export const FOUR_PHASE_PRACTICE_PERSISTENCE_VERSION = 1;
export const FOUR_PHASE_PRACTICE_DECISIONS_KEY = 'nickCoachFourPhasePracticeDecisionsV1';

let cloudHydrated=false;
let cloudFlushBusy=false;

function appDb(){try{return typeof db!=='undefined'?db:window.db;}catch(_){return window.db;}}
function uniq(values=[]){return [...new Set((Array.isArray(values)?values:[]).map(String).filter(Boolean))];}
function clone(value){return value==null?value:JSON.parse(JSON.stringify(value));}

export function cleanFourPhaseDecision(value={}){
  return {
    phaseIds:uniq(value.phaseIds),
    principleIds:uniq(value.principleIds),
    subPrincipleIds:uniq(value.subPrincipleIds),
    practicePurpose:String(value.practicePurpose||''),
    practiceFormat:String(value.practiceFormat||''),
    noGameModelLink:value.noGameModelLink===true,
    updatedAt:Number(value.updatedAt||Date.now())
  };
}

export function readFourPhaseDecisions(){
  try{
    const value=JSON.parse(localStorage.getItem(FOUR_PHASE_PRACTICE_DECISIONS_KEY)||'{}');
    return value&&typeof value==='object'&&!Array.isArray(value)?value:{};
  }catch(_){return {};}
}
function writeDecisions(value){
  try{localStorage.setItem(FOUR_PHASE_PRACTICE_DECISIONS_KEY,JSON.stringify(value||{}));return true;}catch(_){return false;}
}

export function applyFourPhaseDecision(practice={},rawDecision={}){
  const d=cleanFourPhaseDecision(rawDecision);
  practice.gameModelPhaseIds=d.noGameModelLink?[]:d.phaseIds;
  practice.gameModelPrincipleIds=d.noGameModelLink?[]:d.principleIds;
  practice.gameModelSubPrincipleIds=d.noGameModelLink?[]:d.subPrincipleIds;
  if(d.practicePurpose)practice.practicePurpose=d.practicePurpose;
  if(d.practiceFormat)practice.practiceFormat=d.practiceFormat;
  practice.noGameModelLink=d.noGameModelLink;
  practice.fourPhaseNeedsReview=false;
  practice.fourPhaseSuggestedPrincipleIds=[];
  practice.fourPhaseOrganisationSource='manual';
  practice.fourPhaseTagSaveVersion=FOUR_PHASE_PRACTICE_PERSISTENCE_VERSION;
  return practice;
}

export function applyStoredFourPhaseDecisions(data,decisions=readFourPhaseDecisions()){
  if(!data||!Array.isArray(data.practices))return 0;
  let changed=0;
  data.practices.forEach(practice=>{
    const decision=decisions[String(practice.id||'')];
    if(!decision)return;
    const before=JSON.stringify({
      a:practice.gameModelPhaseIds,b:practice.gameModelPrincipleIds,c:practice.gameModelSubPrincipleIds,
      d:practice.practicePurpose,e:practice.practiceFormat,f:practice.noGameModelLink,g:practice.fourPhaseNeedsReview
    });
    applyFourPhaseDecision(practice,decision);
    const after=JSON.stringify({
      a:practice.gameModelPhaseIds,b:practice.gameModelPrincipleIds,c:practice.gameModelSubPrincipleIds,
      d:practice.practicePurpose,e:practice.practiceFormat,f:practice.noGameModelLink,g:practice.fourPhaseNeedsReview
    });
    if(before!==after)changed++;
  });
  return changed;
}

function saveLocal(data=appDb()){
  if(!data)return false;
  try{localStorage.setItem('nickCoachOSv3',JSON.stringify(data));return true;}catch(_){return false;}
}

export function seedFourPhaseDecisionsFromLocal(){
  let local=null;
  try{local=JSON.parse(localStorage.getItem('nickCoachOSv3')||'null');}catch(_){}
  if(!local?.practices)return false;
  const decisions=readFourPhaseDecisions();
  let changed=false;
  local.practices.forEach(practice=>{
    const id=String(practice?.id||'');
    if(!id||decisions[id])return;
    if(practice.fourPhaseOrganisationSource!=='manual'&&Number(practice.fourPhaseTagSaveVersion||0)<1)return;
    decisions[id]=cleanFourPhaseDecision({
      phaseIds:practice.gameModelPhaseIds,
      principleIds:practice.gameModelPrincipleIds,
      subPrincipleIds:practice.gameModelSubPrincipleIds,
      practicePurpose:practice.practicePurpose,
      practiceFormat:practice.practiceFormat,
      noGameModelLink:practice.noGameModelLink,
      updatedAt:Date.now()
    });
    changed=true;
  });
  if(changed)writeDecisions(decisions);
  return changed;
}

export function rememberFourPhasePracticeDecision(practiceId,draft={}){
  const id=String(practiceId||''); if(!id)return false;
  const decisions=readFourPhaseDecisions();
  decisions[id]=cleanFourPhaseDecision({...draft,updatedAt:Date.now()});
  writeDecisions(decisions);
  const data=appDb();
  if(data){applyStoredFourPhaseDecisions(data,decisions);saveLocal(data);}
  scheduleCloudFlush(100);
  return true;
}

function legacyCloudReady(){
  if(cloudHydrated)return true;
  try{return typeof cloudReady!=='undefined'&&!!cloudReady;}catch(_){return false;}
}

export async function flushFourPhaseDecisionsToCloud(){
  if(cloudFlushBusy||!legacyCloudReady())return false;
  const data=appDb();
  if(!data||!window.nickCloud||typeof window.nickCloud.save!=='function')return false;
  cloudFlushBusy=true;
  try{
    applyStoredFourPhaseDecisions(data);
    saveLocal(data);
    await window.nickCloud.save(clone(data));
    return true;
  }catch(error){
    console.warn('Four-phase practice tag cloud flush deferred',error);
    return false;
  }finally{cloudFlushBusy=false;}
}
function scheduleCloudFlush(delay=250){
  clearTimeout(scheduleCloudFlush._timer);
  scheduleCloudFlush._timer=setTimeout(()=>flushFourPhaseDecisionsToCloud(),delay);
}

function mergeIntoPayload(data){
  const copy=clone(data);
  if(copy)applyStoredFourPhaseDecisions(copy);
  return copy;
}
function wrapNickCloud(){
  const cloud=window.nickCloud;
  if(!cloud||cloud.__fourPhasePracticePersistence)return false;
  const originalSave=typeof cloud.save==='function'?cloud.save.bind(cloud):null;
  const originalListen=typeof cloud.listen==='function'?cloud.listen.bind(cloud):null;
  const originalGetCurrent=typeof cloud.getCurrent==='function'?cloud.getCurrent.bind(cloud):null;

  if(originalSave)cloud.save=async function(data){return await originalSave(mergeIntoPayload(data));};
  if(originalGetCurrent)cloud.getCurrent=async function(...args){
    const current=await originalGetCurrent(...args); cloudHydrated=true;
    const merged=mergeIntoPayload(current); scheduleCloudFlush(140); return merged;
  };
  if(originalListen)cloud.listen=function(callback,...rest){
    return originalListen(function(cloudDoc){
      cloudHydrated=true;
      const merged=cloudDoc&&cloudDoc.data?{...cloudDoc,data:mergeIntoPayload(cloudDoc.data)}:cloudDoc;
      const result=callback(merged); scheduleCloudFlush(180); return result;
    },...rest);
  };
  try{Object.defineProperty(cloud,'__fourPhasePracticePersistence',{value:true});}catch(_){cloud.__fourPhasePracticePersistence=true;}
  return true;
}

export function reconcileFourPhaseDecisions(){
  const data=appDb(); if(!data)return 0;
  const changed=applyStoredFourPhaseDecisions(data);
  if(changed){saveLocal(data);scheduleCloudFlush(300);}
  return changed;
}

function install(){
  seedFourPhaseDecisionsFromLocal();
  reconcileFourPhaseDecisions();
  [0,20,80,180,450,900,1600,2600].forEach(delay=>setTimeout(wrapNickCloud,delay));
  [120,500,1100,2200,4200].forEach(delay=>setTimeout(reconcileFourPhaseDecisions,delay));
  setInterval(()=>{wrapNickCloud();reconcileFourPhaseDecisions();},1800);
  window.NickFourPhasePracticePersistence=Object.freeze({
    version:FOUR_PHASE_PRACTICE_PERSISTENCE_VERSION,
    key:FOUR_PHASE_PRACTICE_DECISIONS_KEY,
    remember:rememberFourPhasePracticeDecision,
    apply:reconcileFourPhaseDecisions,
    flush:flushFourPhaseDecisionsToCloud,
    read:readFourPhaseDecisions
  });
}
if(typeof window!=='undefined'&&typeof document!=='undefined')install();
