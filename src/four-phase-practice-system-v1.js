import {
  GAME_PHASES,
  GAME_MODEL_PRINCIPLES,
  GAME_SUB_PRINCIPLES,
  phaseById,
  principleById,
  subPrincipleById,
  principlesForPhase
} from './game-model-core.js';

export const FOUR_PHASE_PRACTICE_SYSTEM_VERSION = 2;
export const FOUR_PHASE_FILTER_PAGE_SIZE = 3;

export const LEGACY_STAGE_PURPOSE = Object.freeze({
  'Activation':'prepare',
  'Skill Practice':'recognise',
  'Tactical Practice':'execute',
  'Conditioned Game':'transfer'
});

export function purposeForLegacyStage(stage=''){
  const raw=String(stage||'').trim();
  if(LEGACY_STAGE_PURPOSE[raw])return LEGACY_STAGE_PURPOSE[raw];
  const lower=raw.toLowerCase();
  if(lower.includes('activation'))return 'prepare';
  if(lower.includes('skill'))return 'recognise';
  if(lower.includes('tactical'))return 'execute';
  if(lower.includes('conditioned')||lower==='game')return 'transfer';
  return '';
}

export function legacyStageForPurpose(purpose=''){
  const id=String(purpose||'');
  return Object.entries(LEGACY_STAGE_PURPOSE).find(([,value])=>value===id)?.[0]||'';
}

export const PRACTICE_PURPOSES = Object.freeze([
  Object.freeze({id:'prepare',label:'Prepare',description:'Get the body and ball ready and bank useful repetitions.'}),
  Object.freeze({id:'recognise',label:'Recognise',description:'Make the picture clear enough that players learn to see it.'}),
  Object.freeze({id:'execute',label:'Execute',description:'Improve the timing, technique and detail that makes the principle work.'}),
  Object.freeze({id:'transfer',label:'Transfer',description:'Remove support and test whether the behaviour appears in game-real football.'})
]);

export const PRACTICE_FORMATS = Object.freeze([
  Object.freeze({id:'passing-activation',label:'Passing Activation'}),
  Object.freeze({id:'rondo',label:'Rondo'}),
  Object.freeze({id:'possession-box',label:'Possession Box / Positional Possession'}),
  Object.freeze({id:'directional-possession',label:'Directional Possession'}),
  Object.freeze({id:'skill-practice',label:'Skill Practice'}),
  Object.freeze({id:'wave',label:'Wave / Repeated Attack'}),
  Object.freeze({id:'phase-play',label:'Phase of Play'}),
  Object.freeze({id:'unit-practice',label:'Unit Practice'}),
  Object.freeze({id:'opposed-tactical',label:'Opposed Tactical Practice'}),
  Object.freeze({id:'conditioned-game',label:'Conditioned Game'}),
  Object.freeze({id:'small-sided-game',label:'Small-Sided Game'}),
  Object.freeze({id:'finishing',label:'Finishing Practice'}),
  Object.freeze({id:'duel',label:'1v1 / Duel'}),
  Object.freeze({id:'pattern',label:'Pattern / Rehearsal'}),
  Object.freeze({id:'physical',label:'Physical'}),
  Object.freeze({id:'set-play',label:'Set Play'}),
  Object.freeze({id:'other',label:'Other'})
]);

const STYLE_ID='fourPhasePracticeSystemStyles';
const WORKBENCH_ID='fourPhasePracticeWorkbench';
const FINDER_ID='fourPhasePracticeFinder';
const EDITOR_ID='fourPhasePracticeEditor';

const workbenchFilters=createFilterState();
const finderFilters=createFilterState();
let workbenchPage=0;
let finderPage=0;
let editorPracticeId='';
let migrationBusy=false;

function appDb(){try{return typeof db!=='undefined'?db:window.db;}catch(_){return window.db;}}
function field(id){return document.getElementById(id);}
function esc(value){try{if(typeof escapeHtml==='function')return escapeHtml(String(value??''));}catch(_){}return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function uniq(values=[]){return [...new Set((Array.isArray(values)?values:[]).map(String).filter(Boolean))];}
function purposeById(id=''){return PRACTICE_PURPOSES.find(item=>item.id===String(id||''))||null;}
function formatById(id=''){return PRACTICE_FORMATS.find(item=>item.id===String(id||''))||null;}
function practiceText(practice={}){return [practice.id,practice.name,practice.desc,practice.description,practice.cp,practice.coachingPoints,practice.prog,practice.progressions,practice.reg,practice.regressions,practice.rules,practice.condRules,practice.stage,practice.theme].filter(Boolean).join(' ').toLowerCase();}

export function inferPracticePurpose(practice={}){
  if(purposeById(practice.practicePurpose))return practice.practicePurpose;
  const legacy=String(practice.practicePurpose||'');
  if(['technical-repetition','physical-development'].includes(legacy))return 'prepare';
  if(['picture-recognition','scenario-wave','restart-setplay'].includes(legacy))return 'recognise';
  if(legacy==='game-transfer')return 'transfer';
  return purposeForLegacyStage(practice.stage)||'execute';
}

export function inferPracticeFormat(practice={}){
  if(formatById(practice.practiceFormat))return practice.practiceFormat;
  const text=practiceText(practice);
  const name=String(practice.name||'').toLowerCase();
  const stage=String(practice.stage||'').toLowerCase();
  if(/corner|free.?kick|throw.?in|set play|restart/.test(text))return 'set-play';
  if(/fitness|conditioning|aerobic|anaerobic|speed endurance|repeat sprint|yoyo/.test(text))return 'physical';
  if(/wave|repeated attack|transition wave/.test(text))return 'wave';
  if(/phase of play|phase play/.test(text))return 'phase-play';
  if(/\brondo\b/.test(text))return 'rondo';
  if(/small sided|small-sided|\bssg\b/.test(text))return 'small-sided-game';
  if(stage.includes('conditioned'))return 'conditioned-game';
  if(/directional possession|directional|end zone|target player|mini goals|four goals|4 goals/.test(text))return 'directional-possession';
  if(/possession box|positional possession|keep ball/.test(text))return 'possession-box';
  if(/4v4\+2|4v4\+3|4v4\+4|5v5\+2|6v6\+2/.test(name)&&/possession|neutral|wall player|free player|keep/.test(text))return 'possession-box';
  if(/finishing|finish|shoot|strike/.test(name))return 'finishing';
  if(/\b1v1\b|duel/.test(name))return 'duel';
  if(/pattern|rehearsal|rotation|unopposed/.test(text))return 'pattern';
  if(/unit work|unit practice|back four|front three|midfield unit/.test(text))return 'unit-practice';
  if(stage.includes('activation'))return 'passing-activation';
  if(stage.includes('tactical'))return 'opposed-tactical';
  if(stage.includes('skill'))return 'skill-practice';
  return 'other';
}

const LEGACY_CONTEXT_PHASE = Object.freeze({
  'build-out':'in-possession',
  'progress':'in-possession',
  'create-finish':'in-possession',
  'attack-regain':'attacking-transition',
  'press-high':'out-of-possession',
  'defend-mid-low':'out-of-possession',
  'defend-loss':'defensive-transition'
});
const SAFE_LEGACY_PRINCIPLE_MAP = Object.freeze({
  'arrive':'arrive-affect-away',
  'behind-beneath':'combine-commit-cover',
  'protect-inside':'screen-shuffle-squeeze',
  'win-or-inside':'react-recover-reconnect'
});

function ambiguousLegacySuggestions(practice={}){
  const old=uniq([practice.primaryGameModelPrinciple,...(Array.isArray(practice.gameModelPrinciples)?practice.gameModelPrinciples:[])]);
  const phaseIds=uniq(practice.gameModelPhaseIds);
  const suggestions=[];
  if(old.includes('move-free'))suggestions.push('rotate-replace-release','spot-sense-seize');
  if(old.includes('break-open'))suggestions.push(phaseIds.includes('attacking-transition')?'see-send-sprint':'spot-sense-seize');
  if(old.includes('connected'))suggestions.push(phaseIds.includes('defensive-transition')?'react-recover-reconnect':'screen-shuffle-squeeze','spare-step-smother');
  return uniq(suggestions).filter(id=>principleById(id));
}

export function migratePracticeToFourPhase(practice={}){
  let changed=false;
  const previousVersion=Number(practice.fourPhaseModelVersion||0);
  const alreadyVersioned=previousVersion>=FOUR_PHASE_PRACTICE_SYSTEM_VERSION;
  const manual=practice.fourPhaseOrganisationSource==='manual'||Number(practice.fourPhaseTagSaveVersion||0)>=1;

  const stagePurpose=purposeForLegacyStage(practice.stage);
  if(!manual&&previousVersion<2&&stagePurpose){
    if(practice.practicePurpose!==stagePurpose){practice.practicePurpose=stagePurpose;changed=true;}
  }else if(!purposeById(practice.practicePurpose)){
    const value=inferPracticePurpose(practice);
    if(practice.practicePurpose!==value){practice.practicePurpose=value;changed=true;}
  }
  if(!formatById(practice.practiceFormat)){
    const value=inferPracticeFormat(practice);
    if(practice.practiceFormat!==value){practice.practiceFormat=value;changed=true;}
  }

  if(practice.noGameModelPrinciple===true && !alreadyVersioned){
    if(practice.noGameModelLink!==true){practice.noGameModelLink=true;changed=true;}
    if((practice.gameModelPhaseIds||[]).length){practice.gameModelPhaseIds=[];changed=true;}
    if((practice.gameModelPrincipleIds||[]).length){practice.gameModelPrincipleIds=[];changed=true;}
    if((practice.gameModelSubPrincipleIds||[]).length){practice.gameModelSubPrincipleIds=[];changed=true;}
    practice.fourPhaseNeedsReview=false;
  }

  if(!alreadyVersioned && practice.noGameModelLink!==true){
    let phases=uniq(practice.gameModelPhaseIds).filter(id=>phaseById(id));
    if(!phases.length){
      const mapped=LEGACY_CONTEXT_PHASE[String(practice.gameContext||'')];
      if(mapped){phases=[mapped];changed=true;}
    }
    let principles=uniq(practice.gameModelPrincipleIds).filter(id=>principleById(id));
    if(!principles.length){
      const old=uniq([practice.primaryGameModelPrinciple,...(Array.isArray(practice.gameModelPrinciples)?practice.gameModelPrinciples:[])]);
      principles=uniq(old.map(id=>SAFE_LEGACY_PRINCIPLE_MAP[id]).filter(Boolean));
      if(principles.length)changed=true;
    }
    principles.forEach(id=>{const phase=principleById(id)?.phaseId;if(phase&&!phases.includes(phase))phases.push(phase);});
    practice.gameModelPhaseIds=phases;
    practice.gameModelPrincipleIds=principles;
    practice.gameModelSubPrincipleIds=uniq(practice.gameModelSubPrincipleIds).filter(id=>subPrincipleById(id));
    const suggestions=ambiguousLegacySuggestions(practice);
    practice.fourPhaseSuggestedPrincipleIds=suggestions;
    // A practice is organised once it has a genuine main-principle link (or an explicit
    // no-link decision). Sub-principles are useful extra precision, not a requirement.
    practice.fourPhaseNeedsReview=practice.noGameModelLink!==true && principles.length===0;
    if(!practice.fourPhaseOrganisationSource)practice.fourPhaseOrganisationSource='migrated';
  }

  if(practice.fourPhaseModelVersion!==FOUR_PHASE_PRACTICE_SYSTEM_VERSION){
    practice.fourPhaseModelVersion=FOUR_PHASE_PRACTICE_SYSTEM_VERSION;
    changed=true;
  }
  return changed;
}

export function practiceArchitecture(practice={}){
  const noLink=practice.noGameModelLink===true;
  const subIds=noLink?[]:uniq(practice.gameModelSubPrincipleIds).filter(id=>subPrincipleById(id));
  const principleIds=noLink?[]:uniq([
    ...(Array.isArray(practice.gameModelPrincipleIds)?practice.gameModelPrincipleIds:[]),
    ...subIds.map(id=>subPrincipleById(id)?.principleId)
  ]).filter(id=>principleById(id));
  const phaseIds=noLink?[]:uniq([
    ...(Array.isArray(practice.gameModelPhaseIds)?practice.gameModelPhaseIds:[]),
    ...principleIds.map(id=>principleById(id)?.phaseId),
    ...subIds.map(id=>subPrincipleById(id)?.phaseId)
  ]).filter(id=>phaseById(id));
  return {
    phaseIds,
    principleIds,
    subPrincipleIds:subIds,
    purpose:purposeById(practice.practicePurpose)?.id||inferPracticePurpose(practice),
    format:formatById(practice.practiceFormat)?.id||inferPracticeFormat(practice),
    noGameModelLink:noLink
  };
}

export function createFilterState(seed={}){
  return {
    phases:new Set(Array.isArray(seed.phases)?seed.phases:[]),
    principles:new Set(Array.isArray(seed.principles)?seed.principles:[]),
    subPrinciples:new Set(Array.isArray(seed.subPrinciples)?seed.subPrinciples:[]),
    purposes:new Set(Array.isArray(seed.purposes)?seed.purposes:[]),
    formats:new Set(Array.isArray(seed.formats)?seed.formats:[]),
    search:String(seed.search||''),
    reviewOnly:seed.reviewOnly===true
  };
}
function intersects(set,values=[]){return [...set].some(value=>values.includes(value));}
export function matchesPracticeFilters(practice={},filters=createFilterState()){
  const a=practiceArchitecture(practice);
  if(filters.phases?.size&&!intersects(filters.phases,a.phaseIds))return false;
  if(filters.principles?.size&&!intersects(filters.principles,a.principleIds))return false;
  if(filters.subPrinciples?.size&&!intersects(filters.subPrinciples,a.subPrincipleIds))return false;
  if(filters.purposes?.size&&!filters.purposes.has(a.purpose))return false;
  if(filters.formats?.size&&!filters.formats.has(a.format))return false;
  if(filters.reviewOnly&&practice.fourPhaseNeedsReview!==true)return false;
  const q=String(filters.search||'').trim().toLowerCase();
  if(q){
    const text=[
      practice.id,practice.name,practice.desc,practice.description,
      ...a.phaseIds.map(id=>phaseById(id)?.label),
      ...a.principleIds.map(id=>principleById(id)?.message),
      ...a.subPrincipleIds.map(id=>subPrincipleById(id)?.title),
      purposeById(a.purpose)?.label,formatById(a.format)?.label
    ].filter(Boolean).join(' ').toLowerCase();
    if(!text.includes(q))return false;
  }
  return true;
}
export function filterPractices(practices=[],filters=createFilterState()){
  return (Array.isArray(practices)?practices:[]).filter(practice=>matchesPracticeFilters(practice,filters));
}


export function hasActivePracticeFilters(filters=createFilterState()){
  return ['phases','principles','subPrinciples','purposes','formats'].some(key=>filters[key]?.size>0)
    || Boolean(String(filters.search||'').trim()) || filters.reviewOnly===true;
}

export function sortWorkbenchPractices(practices=[],filters=createFilterState()){
  const byPurpose=hasActivePracticeFilters(filters);
  const purposeOrder=new Map(PRACTICE_PURPOSES.map((purpose,index)=>[purpose.id,index]));
  const enteredAt=practice=>{
    const value=practice.createdAt||practice.addedAt;
    const time=typeof value==='number'?value:Date.parse(value||'');
    return Number.isFinite(time)?time:0;
  };
  // Legacy drills have no creation date; use their existing library position as
  // the fallback. Never mutate the underlying library or use edit timestamps.
  return practices.map((practice,index)=>({practice,index,time:enteredAt(practice)}))
    .sort((a,b)=>{
      if(byPurpose){
        const rank=practice=>purposeOrder.get(inferPracticePurpose(practice))??PRACTICE_PURPOSES.length;
        const difference=rank(a.practice)-rank(b.practice);
        if(difference)return difference;
      }
      return b.time-a.time || b.index-a.index;
    }).map(item=>item.practice);
}

function addStyles(){
  if(field(STYLE_ID))return;
  const style=document.createElement('style');style.id=STYLE_ID;
  style.textContent=`
    #${WORKBENCH_ID},#${FINDER_ID},#${EDITOR_ID}{border:1px solid rgba(52,211,153,.28);background:linear-gradient(145deg,rgba(52,211,153,.045),rgba(56,189,248,.025));border-radius:16px;padding:14px;margin:0 0 14px}
    .fpwHead{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}.fpwHead h2,.fpwHead h3{margin:0}.fpwHead p{margin:4px 0 0;color:var(--text-dim);font-size:10px;line-height:1.45;max-width:800px}.fpwLogic{font-size:9px;font-weight:900;color:#a7f3d0;border:1px solid rgba(52,211,153,.28);border-radius:999px;padding:5px 8px;white-space:nowrap}
    .fpwRow{margin-top:10px}.fpwRowTitle{display:flex;justify-content:space-between;gap:8px;align-items:end;margin-bottom:5px}.fpwRowTitle b{font-size:10.5px}.fpwRowTitle span{font-size:8.5px;color:var(--text-faint)}.fpwChips{display:flex;gap:5px;flex-wrap:wrap}.fpwChip{padding:6px 8px;font-size:9px;border-radius:999px}.fpwChip.on{background:var(--turf);border-color:var(--turf);color:#04160f}.fpwChip.seed{box-shadow:0 0 0 2px rgba(251,191,36,.45)}.fpwChip.dim{opacity:.35}
    .fpwControls{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:7px;margin-top:11px}.fpwSelected{display:flex;gap:5px;flex-wrap:wrap;margin-top:8px;min-height:22px}.fpwSelected span{font-size:8.5px;padding:4px 6px;border-radius:999px;background:rgba(56,189,248,.08);border:1px solid rgba(56,189,248,.22);color:#bae6fd}.fpwStats{display:flex;justify-content:space-between;gap:8px;align-items:center;margin-top:8px;font-size:9.5px;color:var(--text-dim)}
    .fpwGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:9px}.fpwCard{border:1px solid var(--border-soft);border-radius:12px;padding:8px;background:var(--surface-2)}.fpwPitch .pitchMini{width:100%!important;max-width:none!important;height:150px!important;margin:0 0 7px!important}.fpwCard h4{margin:0 0 5px;font-size:10.5px}.fpwTags{display:flex;gap:4px;flex-wrap:wrap;margin-top:5px}.fpwTags span{font-size:8px;padding:3px 5px;border-radius:999px;border:1px solid var(--border);color:var(--text-dim)}.fpwTags .phase{color:#a7f3d0;border-color:rgba(52,211,153,.25)}.fpwTags .principle{color:#bae6fd;border-color:rgba(56,189,248,.25)}.fpwTags .sub{color:#fde68a;border-color:rgba(251,191,36,.28)}.fpwActions{display:flex;gap:5px;flex-wrap:wrap;margin-top:7px}.fpwActions button{padding:5px 7px;font-size:9px}.fpwPager{display:flex;align-items:center;justify-content:center;gap:8px;margin-top:10px}.fpwPager span{font-size:9px;color:var(--text-dim)}.fpwEmpty{margin-top:10px;padding:12px;border:1px dashed var(--border);border-radius:10px;color:var(--text-dim);font-size:10px;line-height:1.45}
    #${EDITOR_ID}{margin-top:8px}.fpeGrid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.fpeBlock{margin-top:9px}.fpeBlockTitle{font-size:10px;font-weight:900;margin-bottom:5px;color:#dbeafe}.fpeChecks{display:flex;gap:5px;flex-wrap:wrap}.fpeCheck{display:inline-flex;align-items:center;gap:5px;padding:6px 8px;border-radius:999px;border:1px solid var(--border);background:var(--surface-2);font-size:9px;cursor:pointer}.fpeCheck input{width:auto;margin:0}.fpeCheck.on{border-color:var(--turf);background:rgba(52,211,153,.10)}.fpeNoLink{margin-top:10px;padding:8px 9px;border:1px solid rgba(251,191,36,.25);border-radius:10px;background:rgba(251,191,36,.04);font-size:9.5px}.fpeNoLink label{display:flex;align-items:center;gap:7px;margin:0;color:#fde68a}.fpeNoLink input{width:auto;margin:0}
    #library>.grid.two{margin-top:12px}.fpLegacyNote{margin:10px 0 0;font-size:9px;color:var(--text-faint)}
    @media(max-width:900px){.fpwGrid{grid-template-columns:repeat(2,minmax(0,1fr))}.fpwPitch .pitchMini{height:165px!important}}
    @media(max-width:620px){.fpwHead{display:block}.fpwLogic{display:inline-flex;margin-top:7px}.fpwControls{grid-template-columns:1fr 1fr}.fpwControls input{grid-column:1/-1}.fpwGrid,.fpeGrid{grid-template-columns:1fr}.fpwPitch .pitchMini{height:205px!important}}
  `;
  document.head.appendChild(style);
}

function labelFor(kind,id){
  if(kind==='phases')return phaseById(id)?.label||id;
  if(kind==='principles')return principleById(id)?.message||id;
  if(kind==='subPrinciples')return subPrincipleById(id)?.title||id;
  if(kind==='purposes')return purposeById(id)?.label||id;
  if(kind==='formats')return formatById(id)?.label||id;
  return id;
}
function chipMarkup(group,kind,items,filters,labelFn=item=>item.label||item.message||item.title){
  return `<div class="fpwChips">${items.map(item=>`<button type="button" class="fpwChip ${filters[kind].has(item.id)?'on':''}" data-fpw-group="${group}" data-fpw-kind="${kind}" data-fpw-value="${esc(item.id)}" data-phase="${esc(item.phaseId||'')}">${esc(labelFn(item))}</button>`).join('')}</div>`;
}
function rowsMarkup(group,filters){
  return `
    <div class="fpwRow"><div class="fpwRowTitle"><b>1 · Phase</b><span>OR inside this row</span></div>${chipMarkup(group,'phases',GAME_PHASES,filters)}</div>
    <div class="fpwRow"><div class="fpwRowTitle"><b>2 · Main Principle</b><span>Must also match Phase</span></div>${chipMarkup(group,'principles',GAME_MODEL_PRINCIPLES,filters,item=>item.message)}</div>
    <div class="fpwRow"><div class="fpwRowTitle"><b>3 · Sub-Principle</b><span>Must also match Main Principle</span></div>${chipMarkup(group,'subPrinciples',GAME_SUB_PRINCIPLES,filters,item=>item.title)}</div>
    <div class="fpwRow"><div class="fpwRowTitle"><b>4 · Purpose</b><span>Prepare · Recognise · Execute · Transfer</span></div>${chipMarkup(group,'purposes',PRACTICE_PURPOSES,filters)}</div>
    <div class="fpwRow"><div class="fpwRowTitle"><b>5 · Format</b><span>What the exercise physically looks like</span></div>${chipMarkup(group,'formats',PRACTICE_FORMATS,filters)}</div>`;
}
function selectedMarkup(filters){
  const values=[];
  ['phases','principles','subPrinciples','purposes','formats'].forEach(kind=>filters[kind].forEach(id=>values.push(labelFor(kind,id))));
  if(filters.reviewOnly)values.push('Needs principle');
  return values.length?values.map(value=>`<span>${esc(value)}</span>`).join(''):'<span>No filters · showing all practices</span>';
}
function cardMarkup(practice,mode,index){
  const a=practiceArchitecture(practice);
  const pitchId=`fpw-${mode}-${index}-${String(practice.id||'').replace(/[^a-z0-9_-]/gi,'-')}`;
  const tags=[
    ...a.phaseIds.map(id=>`<span class="phase">${esc(phaseById(id)?.label||id)}</span>`),
    ...a.principleIds.map(id=>`<span class="principle">${esc(principleById(id)?.message||id)}</span>`),
    ...a.subPrincipleIds.map(id=>`<span class="sub">${esc(subPrincipleById(id)?.title||id)}</span>`),
    `<span>${esc(purposeById(a.purpose)?.label||a.purpose)}</span>`,
    `<span>${esc(formatById(a.format)?.label||a.format)}</span>`
  ].join('');
  let inSession=false; try{inSession=Array.isArray(plannerDrills)&&plannerDrills.includes(practice.id);}catch(_){}
  const review=practice.fourPhaseNeedsReview===true?'<span class="sub">Needs principle</span>':'';
  return `<article class="fpwCard"><div class="fpwPitch" id="${pitchId}"></div><h4>${esc(practice.id)} · ${esc(practice.name||'Practice')}</h4><div class="fpwTags">${tags}${review}${a.noGameModelLink?'<span>No Game Model link</span>':''}</div><div class="fpwActions">${mode==='finder'?`<button type="button" data-fpw-session="${esc(practice.id)}">${inSession?'Remove from session':'Add to session'}</button>`:`<button type="button" data-fpw-edit="${esc(practice.id)}">Edit practice</button>`}${practice.fourPhaseSuggestedPrincipleIds?.length?`<button type="button" data-fpw-edit="${esc(practice.id)}">Review suggestions</button>`:''}</div></article>`;
}
function drawVisible(practices,mode,page){
  practices.forEach((practice,index)=>{
    const id=`fpw-${mode}-${page*FOUR_PHASE_FILTER_PAGE_SIZE+index}-${String(practice.id||'').replace(/[^a-z0-9_-]/gi,'-')}`;
    try{if(typeof drawMini==='function')drawMini(id,practice.diagram||[],practice.pitchMode||'full');else window.drawMini?.(id,practice.diagram||[],practice.pitchMode||'full');}catch(_){}
  });
}
function panelFor(group){return field(group==='finder'?FINDER_ID:WORKBENCH_ID);}
function refreshChipVisibility(group,filters){
  const panel=panelFor(group); if(!panel)return;
  panel.querySelectorAll('[data-fpw-kind]').forEach(chip=>{
    const kind=chip.dataset.fpwKind;
    chip.classList.toggle('on',filters[kind]?.has(chip.dataset.fpwValue));
    if(kind==='principles'||kind==='subPrinciples'){
      const activePhases=filters.phases;
      chip.classList.toggle('dim',activePhases.size>0&&chip.dataset.phase&&!activePhases.has(chip.dataset.phase));
    }
  });
}
function renderResults(group,filters){
  const isFinder=group==='finder'; const panel=panelFor(group); if(!panel)return;
  const matches=filterPractices(appDb()?.practices||[],filters);
  const all=isFinder?matches.sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''))):sortWorkbenchPractices(matches,filters);
  let page=isFinder?finderPage:workbenchPage;
  const pages=Math.max(1,Math.ceil(all.length/FOUR_PHASE_FILTER_PAGE_SIZE));
  if(page>=pages)page=pages-1;
  if(isFinder)finderPage=page;else workbenchPage=page;
  const visible=all.slice(page*FOUR_PHASE_FILTER_PAGE_SIZE,(page+1)*FOUR_PHASE_FILTER_PAGE_SIZE);
  panel.querySelector('[data-fpw-selected]').innerHTML=selectedMarkup(filters);
  panel.querySelector('[data-fpw-count]').textContent=`${all.length} exact ${all.length===1?'match':'matches'}`;
  const orderLabel=panel.querySelector('[data-fpw-sort]');
  if(orderLabel)orderLabel.textContent=hasActivePracticeFilters(filters)?'Prepare → Recognise → Execute → Transfer':'Newest entered first';
  const results=panel.querySelector('[data-fpw-results]');
  results.innerHTML=visible.length?`<div class="fpwGrid">${visible.map((practice,index)=>cardMarkup(practice,isFinder?'finder':'workbench',page*FOUR_PHASE_FILTER_PAGE_SIZE+index)).join('')}</div>${pages>1?`<div class="fpwPager"><button type="button" data-fpw-page="prev" ${page===0?'disabled':''}>← Previous</button><span>Page ${page+1} of ${pages}</span><button type="button" data-fpw-page="next" ${page>=pages-1?'disabled':''}>Next →</button></div>`:''}`:'<div class="fpwEmpty"><b>No exact matches.</b><br>No saved practice currently satisfies every selected row. Remove a filter or edit the practice tags — the finder will not leak in near-matches.</div>';
  requestAnimationFrame(()=>drawVisible(visible,isFinder?'finder':'workbench',page));
  refreshChipVisibility(group,filters);
}
function handlePanelClick(group,filters,event){
  const chip=event.target.closest?.('[data-fpw-kind]');
  if(chip&&chip.dataset.fpwGroup===group){
    const set=filters[chip.dataset.fpwKind];
    if(set)set.has(chip.dataset.fpwValue)?set.delete(chip.dataset.fpwValue):set.add(chip.dataset.fpwValue);
    if(group==='finder')finderPage=0;else workbenchPage=0;
    renderResults(group,filters);return;
  }
  const pager=event.target.closest?.('[data-fpw-page]');
  if(pager){const delta=pager.dataset.fpwPage==='next'?1:-1;if(group==='finder')finderPage=Math.max(0,finderPage+delta);else workbenchPage=Math.max(0,workbenchPage+delta);renderResults(group,filters);return;}
  const edit=event.target.closest?.('[data-fpw-edit]');if(edit){window.editPractice?.(edit.dataset.fpwEdit);return;}
  const session=event.target.closest?.('[data-fpw-session]');if(session){window.togglePracticeInSession?.(session.dataset.fpwSession);setTimeout(()=>renderResults('finder',finderFilters),60);}
}

function buildWorkbench(){
  const library=field('library');if(!library||field(WORKBENCH_ID))return;
  const panel=document.createElement('section');panel.id=WORKBENCH_ID;
  panel.innerHTML=`<div class="fpwHead"><div><h2>Practice Workbench · Four-Phase Model</h2><p>This is strict. Select a Phase and only practices tagged to that phase can appear. Add a Main Principle and the practice must match both. Add a Sub-Principle, Purpose or Format and every selected row continues to stack.</p></div><span class="fpwLogic">OR within a row · AND between rows</span></div>${rowsMarkup('workbench',workbenchFilters)}<div class="fpwControls"><input id="fpwSearch" placeholder="Search inside exact matches..."><button type="button" id="fpwReview">Needs principle</button><button type="button" id="fpwClear">Clear</button></div><div class="fpwSelected" data-fpw-selected></div><div class="fpwStats"><b data-fpw-count></b><span data-fpw-sort>Newest entered first</span></div><div data-fpw-results></div><div class="fpLegacyNote">The old Theme browser underneath is kept only as a legacy fallback. “Needs principle” now means only that no main principle could be resolved; sub-principles are optional detail.</div>`;
  library.prepend(panel);
  panel.addEventListener('click',event=>handlePanelClick('workbench',workbenchFilters,event));
  field('fpwSearch')?.addEventListener('input',event=>{workbenchFilters.search=event.target.value||'';workbenchPage=0;renderResults('workbench',workbenchFilters);});
  field('fpwReview')?.addEventListener('click',event=>{workbenchFilters.reviewOnly=!workbenchFilters.reviewOnly;event.currentTarget.classList.toggle('on',workbenchFilters.reviewOnly);workbenchPage=0;renderResults('workbench',workbenchFilters);});
  field('fpwClear')?.addEventListener('click',()=>{['phases','principles','subPrinciples','purposes','formats'].forEach(k=>workbenchFilters[k].clear());workbenchFilters.search='';workbenchFilters.reviewOnly=false;field('fpwSearch').value='';field('fpwReview')?.classList.remove('on');workbenchPage=0;renderResults('workbench',workbenchFilters);});
  renderResults('workbench',workbenchFilters);
}

export function resetFinderToSession(){
  ['phases','principles','subPrinciples','purposes','formats'].forEach(k=>finderFilters[k].clear());
  finderFilters.search='';finderFilters.reviewOnly=false;finderPage=0;
  const plan=window.NickFourPhaseGameModel?.currentPlan?.()||{};
  if(phaseById(plan.gamePhase))finderFilters.phases.add(plan.gamePhase);
  if(principleById(plan.primaryPrincipleId))finderFilters.principles.add(plan.primaryPrincipleId);
  (plan.subPrincipleIds||[]).forEach(id=>{if(subPrincipleById(id))finderFilters.subPrinciples.add(id);});
  const search=field('fpfSearch');if(search)search.value='';
  renderResults('finder',finderFilters);
  markFinderSeeds();
}
function markFinderSeeds(){
  const panel=field(FINDER_ID);if(!panel)return;
  panel.querySelectorAll('.fpwChip').forEach(chip=>chip.classList.remove('seed'));
  const plan=window.NickFourPhaseGameModel?.currentPlan?.()||{};
  const seeds=[['phases',plan.gamePhase],['principles',plan.primaryPrincipleId],...(plan.subPrincipleIds||[]).map(id=>['subPrinciples',id])];
  seeds.forEach(([kind,id])=>{if(!id)return;panel.querySelector(`[data-fpw-kind="${kind}"][data-fpw-value="${id}"]`)?.classList.add('seed');});
}
function buildFinder(){
  const visual=field('visualPicker');const card=visual?.closest('.card');if(!card||field(FINDER_ID))return;
  const panel=document.createElement('section');panel.id=FINDER_ID;
  panel.innerHTML=`<div class="fpwHead"><div><h3>Find Practices · Same Workbench</h3><p>This uses the exact same filter engine as the Practice Workbench. Your session Phase, Main Principle and selected Sub-Principles are the starting filters, then you can add Purpose and Format.</p></div><span class="fpwLogic">Exact matches only</span></div>${rowsMarkup('finder',finderFilters)}<div class="fpwControls"><input id="fpfSearch" placeholder="Search inside exact matches..."><button type="button" id="fpfReset">Reset to session</button><span></span></div><div class="fpwSelected" data-fpw-selected></div><div class="fpwStats"><b data-fpw-count></b><span>Gold outline = session starting filter</span></div><div data-fpw-results></div>`;
  card.prepend(panel);
  panel.addEventListener('click',event=>handlePanelClick('finder',finderFilters,event));
  field('fpfSearch')?.addEventListener('input',event=>{finderFilters.search=event.target.value||'';finderPage=0;renderResults('finder',finderFilters);});
  field('fpfReset')?.addEventListener('click',resetFinderToSession);
  resetFinderToSession();
}

function editorState(){
  const panel=field(EDITOR_ID);if(!panel)return null;
  const noLink=field('fpeNoLink')?.checked===true;
  const phases=noLink?[]:[...panel.querySelectorAll('[data-fpe-phase] input:checked')].map(input=>input.value);
  const principles=noLink?[]:[...panel.querySelectorAll('[data-fpe-principle] input:checked')].map(input=>input.value);
  const subs=noLink?[]:[...panel.querySelectorAll('[data-fpe-sub] input:checked')].map(input=>input.value);
  const derivedPrinciples=uniq([...principles,...subs.map(id=>subPrincipleById(id)?.principleId).filter(Boolean)]);
  const derivedPhases=uniq([...phases,...derivedPrinciples.map(id=>principleById(id)?.phaseId).filter(Boolean)]);
  return {
    phaseIds:derivedPhases,
    principleIds:derivedPrinciples,
    subPrincipleIds:subs,
    practicePurpose:field('fpePurpose')?.value||'execute',
    practiceFormat:field('fpeFormat')?.value||'other',
    noGameModelLink:noLink||derivedPrinciples.length===0
  };
}
function editorChip(item,kind,checked=false){
  return `<label class="fpeCheck ${checked?'on':''}" data-fpe-${kind}="${esc(item.id)}"><input type="checkbox" value="${esc(item.id)}" ${checked?'checked':''}><span>${esc(item.label||item.message||item.title)}</span></label>`;
}
function renderEditorPrinciples(selected=[],phaseIds=[]){
  const wrap=field('fpePrinciples');if(!wrap)return;
  const active=new Set(phaseIds);
  const items=active.size?GAME_MODEL_PRINCIPLES.filter(item=>active.has(item.phaseId)):GAME_MODEL_PRINCIPLES;
  wrap.innerHTML=items.map(item=>editorChip(item,'principle',selected.includes(item.id))).join('');
  bindEditorChecks();
}
function renderEditorSubs(selected=[],principleIds=[]){
  const wrap=field('fpeSubs');if(!wrap)return;
  const active=new Set(principleIds);
  const items=active.size?GAME_SUB_PRINCIPLES.filter(item=>active.has(item.principleId)):[];
  wrap.innerHTML=items.length?items.map(item=>editorChip(item,'sub',selected.includes(item.id))).join(''):'<span class="small">Select a main principle to choose its three sub-principles.</span>';
  bindEditorChecks();
}
function bindEditorChecks(){
  const panel=field(EDITOR_ID);if(!panel)return;
  panel.querySelectorAll('.fpeCheck input').forEach(input=>{if(input.__fourPhaseBound)return;input.__fourPhaseBound=true;input.addEventListener('change',event=>{
    event.target.closest('.fpeCheck')?.classList.toggle('on',event.target.checked);
    if(event.target.closest('[data-fpe-phase]')){
      const phases=[...panel.querySelectorAll('[data-fpe-phase] input:checked')].map(x=>x.value);
      const selectedPrinciples=[...panel.querySelectorAll('[data-fpe-principle] input:checked')].map(x=>x.value);
      renderEditorPrinciples(selectedPrinciples,phases);
      renderEditorSubs([],selectedPrinciples.filter(id=>!phases.length||phases.includes(principleById(id)?.phaseId)));
    }else if(event.target.closest('[data-fpe-principle]')){
      const principles=[...panel.querySelectorAll('[data-fpe-principle] input:checked')].map(x=>x.value);
      const selectedSubs=[...panel.querySelectorAll('[data-fpe-sub] input:checked')].map(x=>x.value);
      renderEditorSubs(selectedSubs,principles);
    }
  });});
}
function ensureEditor(){
  const name=field('pname');const card=name?.closest('.card');if(!card||field(EDITOR_ID))return;
  const panel=document.createElement('section');panel.id=EDITOR_ID;
  panel.innerHTML=`<div class="fpwHead"><div><h3>Practice Game Model Tags</h3><p>Tag what this practice can genuinely expose. You can select multiple phases, main principles and sub-principles. Saving with no main principle records an intentional “No Game Model link”.</p></div></div><div class="fpeGrid"><div><label>PURPOSE</label><select id="fpePurpose">${PRACTICE_PURPOSES.map(item=>`<option value="${item.id}">${item.label}</option>`).join('')}</select></div><div><label>FORMAT</label><select id="fpeFormat">${PRACTICE_FORMATS.map(item=>`<option value="${item.id}">${item.label}</option>`).join('')}</select></div></div><div class="fpeBlock"><div class="fpeBlockTitle">PHASE · MULTI-SELECT</div><div id="fpePhases" class="fpeChecks">${GAME_PHASES.map(item=>editorChip(item,'phase',false)).join('')}</div></div><div class="fpeBlock"><div class="fpeBlockTitle">MAIN PRINCIPLE · MULTI-SELECT</div><div id="fpePrinciples" class="fpeChecks"></div></div><div class="fpeBlock"><div class="fpeBlockTitle">SUB-PRINCIPLE · MULTI-SELECT</div><div id="fpeSubs" class="fpeChecks"></div></div><div class="fpeNoLink"><label><input id="fpeNoLink" type="checkbox"> No Game Model link — keep this as useful technical / physical / general work without forcing a principle.</label></div>`;
  const nameLabel=name.previousElementSibling;
  if(nameLabel?.tagName==='LABEL')card.insertBefore(panel,nameLabel);else card.prepend(panel);
  bindEditorChecks();
  field('fpeNoLink')?.addEventListener('change',event=>{panel.querySelectorAll('.fpeCheck input').forEach(input=>{input.disabled=event.target.checked;});});
  field('fpePurpose')?.addEventListener('change',()=>syncLegacyStageFromPurpose());
  const theme=field('theme');if(theme){theme.classList.add('fourPhaseLegacyHidden');const label=theme.previousElementSibling;if(label?.tagName==='LABEL')label.classList.add('fourPhaseLegacyHidden');}
  const stage=field('stage');if(stage){stage.classList.add('fourPhaseLegacyHidden');const label=stage.previousElementSibling;if(label?.tagName==='LABEL')label.classList.add('fourPhaseLegacyHidden');}
}
function syncLegacyStageFromPurpose(){
  const stage=field('stage');
  const purpose=field('fpePurpose')?.value||'';
  const legacyStage=legacyStageForPurpose(purpose);
  if(stage&&legacyStage)stage.value=legacyStage;
}
function loadEditorForPractice(practice={}){
  ensureEditor();editorPracticeId=String(practice.id||'');
  const a=practiceArchitecture(practice);
  const panel=field(EDITOR_ID);if(!panel)return;
  field('fpePurpose').value=a.purpose;
  field('fpeFormat').value=a.format;
  syncLegacyStageFromPurpose();
  field('fpeNoLink').checked=a.noGameModelLink;
  field('fpePhases').innerHTML=GAME_PHASES.map(item=>editorChip(item,'phase',a.phaseIds.includes(item.id))).join('');
  renderEditorPrinciples(a.principleIds,a.phaseIds);
  renderEditorSubs(a.subPrincipleIds,a.principleIds);
  panel.querySelectorAll('.fpeCheck input').forEach(input=>{input.disabled=a.noGameModelLink;});
  bindEditorChecks();
}
function clearEditor(){
  ensureEditor();editorPracticeId='';
  loadEditorForPractice({practicePurpose:'execute',practiceFormat:'other',gameModelPhaseIds:[],gameModelPrincipleIds:[],gameModelSubPrincipleIds:[],noGameModelLink:false});
}
async function persistPracticeTags(practiceId,draft,quiet=false){
  const practice=appDb()?.practices?.find(item=>String(item.id)===String(practiceId));if(!practice)return false;
  practice.gameModelPhaseIds=uniq(draft.phaseIds).filter(id=>phaseById(id));
  practice.gameModelPrincipleIds=uniq(draft.principleIds).filter(id=>principleById(id));
  practice.gameModelSubPrincipleIds=uniq(draft.subPrincipleIds).filter(id=>subPrincipleById(id));
  practice.practicePurpose=purposeById(draft.practicePurpose)?.id||'execute';
  practice.practiceFormat=formatById(draft.practiceFormat)?.id||'other';
  const legacyStage=legacyStageForPurpose(practice.practicePurpose);
  if(legacyStage)practice.stage=legacyStage;
  practice.noGameModelLink=draft.noGameModelLink===true||practice.gameModelPrincipleIds.length===0;
  if(practice.noGameModelLink){practice.gameModelPhaseIds=[];practice.gameModelPrincipleIds=[];practice.gameModelSubPrincipleIds=[];}
  practice.fourPhaseNeedsReview=false;
  practice.fourPhaseSuggestedPrincipleIds=[];
  practice.fourPhaseOrganisationSource='manual';
  practice.fourPhaseTagSaveVersion=FOUR_PHASE_PRACTICE_SYSTEM_VERSION;
  practice.fourPhaseModelVersion=FOUR_PHASE_PRACTICE_SYSTEM_VERSION;
  window.NickFourPhasePracticePersistence?.remember?.(practiceId,{
    phaseIds:practice.gameModelPhaseIds,principleIds:practice.gameModelPrincipleIds,subPrincipleIds:practice.gameModelSubPrincipleIds,
    practicePurpose:practice.practicePurpose,practiceFormat:practice.practiceFormat,noGameModelLink:practice.noGameModelLink
  });
  try{localStorage.setItem('nickCoachOSv3',JSON.stringify(appDb()));}catch(_){}
  try{await window.NickFourPhasePracticePersistence?.flush?.();}catch(_){}
  if(!quiet){
    const message=practice.noGameModelLink?'Practice saved · No Game Model link ✓':'Four-phase tags saved ✓';
    let toast=field('fourPhasePracticeToast');if(!toast){toast=document.createElement('div');toast.id='fourPhasePracticeToast';toast.style.cssText='position:fixed;left:50%;bottom:calc(18px + env(safe-area-inset-bottom));transform:translateX(-50%);z-index:15000;padding:9px 13px;border-radius:999px;background:#0f172a;border:1px solid rgba(52,211,153,.5);box-shadow:0 10px 30px rgba(0,0,0,.3);font-size:12px;font-weight:850;color:#d1fae5';document.body.appendChild(toast);}toast.textContent=message;toast.hidden=false;clearTimeout(toast._timer);toast._timer=setTimeout(()=>toast.hidden=true,2200);
  }
  setTimeout(()=>{renderResults('workbench',workbenchFilters);renderResults('finder',finderFilters);},80);
  return true;
}
function wrapPracticeEditor(){
  let editOriginal;try{editOriginal=editPractice;}catch(_){editOriginal=window.editPractice;}
  if(typeof editOriginal==='function'&&!editOriginal.__fourPhasePractice){
    const wrapped=function(id,...rest){const result=editOriginal.call(this,id,...rest);setTimeout(()=>{const practice=appDb()?.practices?.find(item=>String(item.id)===String(id));loadEditorForPractice(practice||{});},0);return result;};wrapped.__fourPhasePractice=true;try{editPractice=wrapped;}catch(_){}window.editPractice=wrapped;
  }
  let newOriginal;try{newOriginal=newPractice;}catch(_){newOriginal=window.newPractice;}
  if(typeof newOriginal==='function'&&!newOriginal.__fourPhasePractice){
    const wrapped=function(...args){const result=newOriginal.apply(this,args);setTimeout(clearEditor,0);return result;};wrapped.__fourPhasePractice=true;try{newPractice=wrapped;}catch(_){}window.newPractice=wrapped;
  }
  let saveOriginal;try{saveOriginal=savePractice;}catch(_){saveOriginal=window.savePractice;}
  if(typeof saveOriginal==='function'&&!saveOriginal.__fourPhasePractice){
    const wrapped=function(...args){
      const draft=editorState()||{phaseIds:[],principleIds:[],subPrincipleIds:[],practicePurpose:'execute',practiceFormat:'other',noGameModelLink:true};
      const target=String(field('pid')?.value||'').trim();
      const legacyStage=legacyStageForPurpose(draft.practicePurpose);
      if(field('stage')&&legacyStage)field('stage').value=legacyStage;
      const result=saveOriginal.apply(this,args);
      if(target){setTimeout(()=>persistPracticeTags(target,draft),30);setTimeout(()=>persistPracticeTags(target,draft,true),320);}
      return result;
    };wrapped.__fourPhasePractice=true;try{savePractice=wrapped;}catch(_){}window.savePractice=wrapped;
  }
}

async function migrateLibrary(){
  if(migrationBusy)return;migrationBusy=true;
  const data=appDb();let changed=false;
  try{
    (data?.practices||[]).forEach(practice=>{if(migratePracticeToFourPhase(practice))changed=true;});
    if(changed){
      try{localStorage.setItem('nickCoachOSv3',JSON.stringify(data));}catch(_){}
      setTimeout(async()=>{try{if(typeof store==='function')await store();else if(typeof window.store==='function')await window.store();}catch(_){}},900);
    }
  }finally{migrationBusy=false;}
}

function ensureAll(){
  addStyles();buildWorkbench();buildFinder();ensureEditor();wrapPracticeEditor();
}
function install(){
  ensureAll();migrateLibrary().then(()=>{renderResults('workbench',workbenchFilters);resetFinderToSession();});
  [150,500,1200,2600].forEach(delay=>setTimeout(()=>{ensureAll();renderResults('workbench',workbenchFilters);},delay));
  document.addEventListener('click',event=>{if(event.target.closest?.('[data-tab="library"],[data-tab="planner"],[data-tab="editor"],[onclick*="showBuildRoute"]'))setTimeout(ensureAll,70);},true);
  window.NickFourPhasePracticeSystem=Object.freeze({
    version:FOUR_PHASE_PRACTICE_SYSTEM_VERSION,
    architecture:practiceArchitecture,
    matches:matchesPracticeFilters,
    filter:filterPractices,
    workbenchFilters,
    finderFilters,
    resetFinderToSession,
    migrate:migrateLibrary
  });
}
if(typeof window!=='undefined'&&typeof document!=='undefined'){
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
}
