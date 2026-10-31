// Shared display order for all practice browsers and selectors.
// No filters: newest created first. With filters: Activation -> SP -> TP -> CG,
// newest first within a stage. Never mutate the stored practice array.
const STAGES = ['activation','skill practice','tactical practice','conditioned game'];
const PURPOSE_STAGE = {prepare:0,recognise:1,execute:2,transfer:3};
export function stageRank(practice={}){
  const stage=String(practice.stage||'').trim().toLowerCase();
  const index=STAGES.indexOf(stage);
  if(index>=0)return index;
  return PURPOSE_STAGE[String(practice.practicePurpose||'').trim().toLowerCase()]??4;
}
export function hasSelectedFilters(filters={}){
  return Boolean(filters.search&&String(filters.search).trim()) ||
    Boolean(filters.reviewOnly||filters.classificationOnly) ||
    ['phases','principles','subPrinciples','purposes','formats','fundamentals','contexts','emphases'].some(k=>{
      const v=filters[k];
      return v instanceof Set?v.size>0:Array.isArray(v)?v.length>0:false;
    });
}
function createdMillis(practice={}){
  const raw=practice.createdAt||practice.addedAt;
  const n=typeof raw==='number'?raw:Date.parse(raw||'');
  return Number.isFinite(n)?n:0;
}
export function sortPracticesForDisplay(practices=[],filters={}){
  const filtered=typeof filters==='boolean'?filters:hasSelectedFilters(filters);
  return [...practices].map((practice,index)=>({practice,index,time:createdMillis(practice)}))
    .sort((a,b)=>(filtered?stageRank(a.practice)-stageRank(b.practice):0) ||
      b.time-a.time || b.index-a.index)
    .map(item=>item.practice);
}
