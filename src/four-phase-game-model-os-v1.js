import {
  GAME_MODEL_VERSION,
  GAME_MODEL_DEFINITION,
  GAME_PHASES,
  GAME_MODEL_PRINCIPLES,
  LEARNING_EMPHASES,
  phaseById,
  principleById,
  subPrincipleById,
  principlesForPhase,
  normaliseGameModelPlan
} from './game-model-core.js';

export const FOUR_PHASE_GAME_MODEL_OS_VERSION = 1;

const VIEW_ID = 'gameModel';
const TAB_ID = 'gameModelTabV2';
const MORE_TAB_ID = 'gameModelMoreTabV2';
const PLAN_ID = 'fourPhaseSessionPlan';
const STYLE_ID = 'fourPhaseGameModelStyles';

const IDS = Object.freeze({
  playerProblem:'gmPlayerProblem',
  successLooksLike:'gmSuccessLooksLike',
  phase:'gmGamePhase',
  principle:'gmPrimaryPrinciple',
  emphasis:'gmLearningEmphasis',
  subWrap:'gmSubPrinciplePicker'
});

let plannerObserver = null;
let reviewSession = null;
let reviewIndex = -1;

function field(id){return document.getElementById(id);}
function appDb(){try{return typeof db!=='undefined'?db:window.db;}catch(_){return window.db;}}
function esc(value){try{if(typeof escapeHtml==='function')return escapeHtml(String(value??''));}catch(_){}return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function safeCss(value){try{return CSS.escape(String(value));}catch(_){return String(value).replace(/[^a-z0-9_-]/gi,'-');}}

function addStyles(){
  if(field(STYLE_ID))return;
  const style=document.createElement('style');
  style.id=STYLE_ID;
  style.textContent=`
    .fourPhaseLegacyHidden{display:none!important}
    #${PLAN_ID}{margin:0 0 14px;padding:14px;border:1px solid rgba(52,211,153,.30);border-radius:16px;background:linear-gradient(145deg,rgba(52,211,153,.055),rgba(56,189,248,.03))}
    .fpPlanHead{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;margin-bottom:9px}.fpPlanHead h3{margin:0;font-size:15px}.fpPlanHead p{margin:3px 0 0;font-size:10px;color:var(--text-dim);line-height:1.4}.fpPlanHead button{padding:6px 8px;font-size:10px}
    .fpPlanGrid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.fpPlanGrid .full{grid-column:1/-1}.fpPlanGrid label{margin-top:4px}
    .fpSubGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin-top:6px}.fpSubChip{padding:8px 9px;text-align:left;border:1px solid var(--border);border-radius:10px;background:rgba(4,13,22,.35);font-size:10px;line-height:1.35}.fpSubChip b{display:block;color:#eaf7ff;margin-bottom:2px}.fpSubChip span{display:block;color:var(--text-dim);font-size:9px}.fpSubChip.on{border-color:var(--turf);background:rgba(52,211,153,.12);box-shadow:inset 0 0 0 1px rgba(52,211,153,.16)}
    .fpSessionSummary{display:flex;gap:5px;flex-wrap:wrap;margin-top:9px}.fpSessionSummary span{padding:4px 7px;border-radius:999px;border:1px solid rgba(56,189,248,.22);background:rgba(56,189,248,.06);font-size:9px;color:#bae6fd}.fpSessionSummary span.phase{border-color:rgba(52,211,153,.30);color:#a7f3d0}
    #${VIEW_ID}.fourPhaseView{max-width:1250px}.fpHero{padding:20px;border-radius:18px;border:1px solid rgba(52,211,153,.30);background:linear-gradient(145deg,rgba(52,211,153,.10),rgba(56,189,248,.05));margin-bottom:14px}.fpHeroTop{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.fpHero h2{margin:0;font-size:24px}.fpHero p{margin:6px 0 0;color:#d9e5ef;line-height:1.5;max-width:880px}.fpVersion{font-size:9px;font-weight:900;letter-spacing:.07em;text-transform:uppercase;color:#a7f3d0;border:1px solid rgba(52,211,153,.35);border-radius:999px;padding:5px 8px;white-space:nowrap}
    .fpPhaseNav{display:flex;gap:7px;flex-wrap:wrap;margin:0 0 14px}.fpPhaseNav button{font-size:10px;padding:7px 9px}.fpPhaseSection{margin:0 0 18px;scroll-margin-top:140px}.fpPhaseHead{display:flex;align-items:flex-end;justify-content:space-between;gap:10px;margin-bottom:8px}.fpPhaseHead h3{margin:0;font-size:19px}.fpPhaseHead p{margin:2px 0 0;font-size:10.5px;color:var(--text-dim)}.fpPhaseCount{font-size:9px;color:var(--text-faint)}
    .fpPrincipleGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.fpPrincipleCard{border:1px solid var(--border);border-radius:15px;background:linear-gradient(180deg,var(--surface),var(--surface-2));padding:13px}.fpPrincipleTop{display:flex;gap:9px;align-items:center;margin-bottom:9px}.fpPrincipleNum{width:25px;height:25px;border-radius:8px;background:var(--turf-dim);color:var(--turf);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:950}.fpPrincipleCard h4{margin:0;font-size:17px}.fpPrincipleSummary{font-size:10px;color:var(--text-dim);line-height:1.4;margin:0 0 9px}.fpSubList{display:grid;gap:6px}.fpSubItem{padding:8px 9px;border-radius:10px;border:1px solid var(--border-soft);background:rgba(4,13,22,.34)}.fpSubItem b{display:block;font-size:10px;color:#a7f3d0}.fpSubItem span{display:block;margin-top:2px;font-size:10px;line-height:1.4;color:#d6e1eb}
    .fpPreviewSummary{margin:6px 0 12px;padding:10px 11px;border:1px solid rgba(52,211,153,.22);border-radius:11px;background:rgba(52,211,153,.045)}.fpPreviewSummary b{font-size:11px}.fpPreviewSummary .small{margin-top:3px}
    #fourPhaseReviewCard{grid-column:1/-1}.fpReviewMeta{display:flex;gap:5px;flex-wrap:wrap;margin-bottom:9px}.fpReviewMeta span{font-size:9px;padding:4px 6px;border-radius:999px;border:1px solid rgba(56,189,248,.22);color:#bae6fd}.fpReviewScores{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px}.fpReviewScores label{margin-top:0}.fpReviewScores select{margin-top:4px}.fpReviewEvidence{display:grid;grid-template-columns:1fr .7fr;gap:8px;margin-top:8px}
    #fourPhaseSidelineCue{margin:0 0 10px;padding:9px 10px;border:1px solid rgba(52,211,153,.32);border-radius:11px;background:rgba(52,211,153,.07)}#fourPhaseSidelineCue b{display:block;font-size:12px;color:#a7f3d0}#fourPhaseSidelineCue span{display:block;margin-top:2px;font-size:10px;color:#dbeafe}
    @media(max-width:760px){.fpPlanGrid,.fpPrincipleGrid,.fpReviewEvidence{grid-template-columns:1fr}.fpPlanGrid .full{grid-column:auto}.fpSubGrid{grid-template-columns:1fr}.fpReviewScores{grid-template-columns:1fr 1fr}.fpHeroTop{display:block}.fpVersion{display:inline-flex;margin-top:8px}}
  `;
  document.head.appendChild(style);
}

function phaseOptions(selected=''){
  return '<option value="">Choose phase...</option>'+GAME_PHASES.map(item=>`<option value="${esc(item.id)}"${item.id===selected?' selected':''}>${esc(item.label)}</option>`).join('');
}
function emphasisOptions(selected='recognise'){
  return LEARNING_EMPHASES.map(item=>`<option value="${esc(item.id)}"${item.id===selected?' selected':''}>${esc(item.label)}</option>`).join('');
}
function principleOptions(phaseId='',selected=''){
  const items=phaseId?principlesForPhase(phaseId):GAME_MODEL_PRINCIPLES;
  return '<option value="">Choose main principle...</option>'+items.map(item=>`<option value="${esc(item.id)}"${item.id===selected?' selected':''}>${esc(item.message)}</option>`).join('');
}

function selectedSubIds(){
  return [...document.querySelectorAll('#'+IDS.subWrap+' [data-fp-sub].on')].map(button=>button.dataset.fpSub).filter(Boolean);
}
function renderSubPicker(selectedIds=[]){
  const wrap=field(IDS.subWrap); if(!wrap)return;
  const main=principleById(field(IDS.principle)?.value||'');
  if(!main){wrap.innerHTML='<div class="small">Choose a main principle to see its three sub-principles.</div>';return;}
  const set=new Set(selectedIds);
  wrap.innerHTML=`<div class="fpSubGrid">${main.subPrinciples.map(item=>`<button type="button" class="fpSubChip ${set.has(item.id)?'on':''}" data-fp-sub="${esc(item.id)}"><b>${esc(item.title)}</b><span>${esc(item.description)}</span></button>`).join('')}</div>`;
  wrap.querySelectorAll('[data-fp-sub]').forEach(button=>button.addEventListener('click',()=>{
    button.classList.toggle('on');
    updatePlanSummary();
    refreshFinderFromSession();
  }));
}

function currentPlan(){
  return normaliseGameModelPlan({
    playerProblem:field(IDS.playerProblem)?.value,
    successLooksLike:field(IDS.successLooksLike)?.value,
    gamePhase:field(IDS.phase)?.value,
    primaryPrincipleId:field(IDS.principle)?.value,
    subPrincipleIds:selectedSubIds(),
    emphasis:field(IDS.emphasis)?.value
  });
}
function setPlan(value={}){
  const plan=normaliseGameModelPlan(value);
  if(field(IDS.playerProblem))field(IDS.playerProblem).value=plan.playerProblem;
  if(field(IDS.successLooksLike))field(IDS.successLooksLike).value=plan.successLooksLike;
  if(field(IDS.phase))field(IDS.phase).value=plan.gamePhase;
  if(field(IDS.principle)){
    field(IDS.principle).innerHTML=principleOptions(plan.gamePhase,plan.primaryPrincipleId);
    field(IDS.principle).value=plan.primaryPrincipleId;
  }
  if(field(IDS.emphasis))field(IDS.emphasis).value=plan.emphasis;
  renderSubPicker(plan.subPrincipleIds);
  updatePlanSummary();
}
function clearPlan(){setPlan({emphasis:'recognise'});}

function updatePlanSummary(){
  const box=field('fourPhasePlanSummary'); if(!box)return;
  const plan=currentPlan();
  const phase=phaseById(plan.gamePhase);
  const main=principleById(plan.primaryPrincipleId);
  const subs=plan.subPrincipleIds.map(subPrincipleById).filter(Boolean);
  box.innerHTML=[
    phase?`<span class="phase">${esc(phase.label)}</span>`:'',
    main?`<span>${esc(main.message)}</span>`:'',
    ...subs.map(item=>`<span>${esc(item.title)}</span>`)
  ].filter(Boolean).join('') || '<span>Choose the phase and main principle for this session.</span>';
  window.NickPrincipleWordBanks?.refresh();
}

function hideLegacyBuilderFields(){
  const ids=['sTheme','objective','objChips','links','linkChips','reflect','reflectChips','sessionSubtitle','sessionSubtitleField'];
  ids.forEach(id=>{
    const el=field(id); if(!el)return;
    el.classList.add('fourPhaseLegacyHidden');
    const label=el.previousElementSibling;
    if(label?.tagName==='LABEL')label.classList.add('fourPhaseLegacyHidden');
  });
  ['objective','links','reflect'].forEach(id=>{
    const el=field(id); const label=el?.previousElementSibling;
    if(label?.tagName==='LABEL')label.classList.add('fourPhaseLegacyHidden');
  });
}

function ensurePlannerPanel(){
  const advanced=field('advancedBuilder');
  if(!advanced || field(PLAN_ID))return field(PLAN_ID);
  const details=advanced.querySelector('.grid.two > .card');
  if(!details)return null;
  const panel=document.createElement('section');
  panel.id=PLAN_ID;
  panel.innerHTML=`
    <div class="fpPlanHead"><div><h3>Game Model · Four Phases</h3><p>Phase → main principle → sub-principles. Keep the session problem simple and make the practice finder match it exactly.</p></div><button type="button" id="openFourPhaseGameModel">View Game Model</button></div>
    <div class="fpPlanGrid">
      <div class="full"><label for="${IDS.playerProblem}">PLAYER PROBLEM</label><textarea id="${IDS.playerProblem}" placeholder="What are the players doing now that needs to improve?"></textarea></div>
      <div><label for="${IDS.phase}">PHASE</label><select id="${IDS.phase}">${phaseOptions()}</select></div>
      <div><label for="${IDS.emphasis}">LEARNING EMPHASIS</label><select id="${IDS.emphasis}">${emphasisOptions()}</select></div>
      <div class="full"><label for="${IDS.principle}">MAIN PRINCIPLE</label><select id="${IDS.principle}">${principleOptions()}</select></div>
      <div class="full"><label>SUB-PRINCIPLES · SELECT THE DETAIL YOU WANT TODAY</label><div id="${IDS.subWrap}"></div></div>
      <div class="full"><label for="${IDS.successLooksLike}">SUCCESS LOOKS LIKE</label><textarea id="${IDS.successLooksLike}" placeholder="What would you actually see if the principle lands?"></textarea></div>
    </div>
    <div id="fourPhasePlanSummary" class="fpSessionSummary"></div>`;
  const cues=field('cues');
  if(cues?.parentElement===details) details.insertBefore(panel,cues.previousElementSibling?.tagName==='LABEL'?cues.previousElementSibling:cues);
  else details.prepend(panel);

  field(IDS.phase)?.addEventListener('change',()=>{
    const phase=field(IDS.phase).value;
    field(IDS.principle).innerHTML=principleOptions(phase,'');
    renderSubPicker([]);
    updatePlanSummary();
    refreshFinderFromSession();
  });
  field(IDS.principle)?.addEventListener('change',()=>{
    const main=principleById(field(IDS.principle).value);
    if(main && field(IDS.phase).value!==main.phaseId) field(IDS.phase).value=main.phaseId;
    renderSubPicker([]);
    updatePlanSummary();
    refreshFinderFromSession();
  });
  [IDS.playerProblem,IDS.successLooksLike,IDS.emphasis].forEach(id=>field(id)?.addEventListener('input',()=>{updatePlanSummary();}));
  field('openFourPhaseGameModel')?.addEventListener('click',()=>showGameModelView(field(IDS.principle)?.value||''));
  hideLegacyBuilderFields();
  renderSubPicker([]);
  updatePlanSummary();
  return panel;
}

function phaseSection(phase){
  const principles=principlesForPhase(phase.id);
  return `<section class="fpPhaseSection" id="fp-phase-${esc(phase.id)}"><div class="fpPhaseHead"><div><h3>${esc(phase.label)}</h3><p>${esc(phase.description)}</p></div><span class="fpPhaseCount">${principles.length} main ${principles.length===1?'principle':'principles'}</span></div><div class="fpPrincipleGrid">${principles.map(main=>`<article class="fpPrincipleCard" id="fp-principle-${esc(main.id)}"><div class="fpPrincipleTop"><span class="fpPrincipleNum">${main.number}</span><h4>${esc(main.message)}</h4></div><p class="fpPrincipleSummary">${esc(main.meaning)}</p><div class="fpSubList">${main.subPrinciples.map(detail=>`<div class="fpSubItem"><b>${esc(detail.title)}</b><span>${esc(detail.description)}</span></div>`).join('')}</div></article>`).join('')}</div></section>`;
}

function ensureGameModelView(){
  let view=field(VIEW_ID);
  if(!view){
    view=document.createElement('section');
    view.id=VIEW_ID;
    view.className='view hidden fourPhaseView';
    document.body.appendChild(view);
  }
  view.classList.add('fourPhaseView');
  view.innerHTML=`
    <div class="fpHero"><div class="fpHeroTop"><div><h2>Our Game Model</h2><p>${esc(GAME_MODEL_DEFINITION)}</p></div><span class="fpVersion">Game Model v${esc(GAME_MODEL_VERSION)}</span></div></div>
    <div class="fpPhaseNav">${GAME_PHASES.map(phase=>`<button type="button" data-fp-phase-jump="${esc(phase.id)}">${esc(phase.label)}</button>`).join('')}</div>
    ${GAME_PHASES.map(phaseSection).join('')}`;
  view.querySelectorAll('[data-fp-phase-jump]').forEach(button=>button.addEventListener('click',()=>field('fp-phase-'+button.dataset.fpPhaseJump)?.scrollIntoView({behavior:'smooth',block:'start'})));
  window.NickPrincipleWordBanks?.ensureSupportingLists();
  return view;
}

function showGameModelView(principleId=''){
  ensureGameModelView();
  document.querySelectorAll('.tab').forEach(tab=>tab.classList.remove('active'));
  document.querySelectorAll('.tab[data-tab="gameModel"]').forEach(tab=>tab.classList.add('active'));
  document.querySelectorAll('.view').forEach(view=>view.classList.add('hidden'));
  field(VIEW_ID)?.classList.remove('hidden');
  try{if(typeof closeMoreSheet==='function')closeMoreSheet();else window.closeMoreSheet?.();}catch(_){}
  const main=principleById(principleId);
  if(main){const detail=field('fp-principle-'+main.id)?.closest('details');if(detail)detail.open=true;}
  if(main)setTimeout(()=>field('fp-principle-'+main.id)?.scrollIntoView({behavior:'smooth',block:'center'}),0); else window.scrollTo(0,0);
}

function ensureNavigation(){
  const nav=document.querySelector('nav');
  let tab=field(TAB_ID);
  if(nav && !tab){
    tab=document.createElement('button'); tab.id=TAB_ID; tab.type='button'; tab.className='tab'; tab.dataset.tab='gameModel'; tab.textContent='Game Model';
    tab.addEventListener('click',()=>showGameModelView());
    const planner=nav.querySelector('.tab[data-tab="planner"]'); if(planner)planner.insertAdjacentElement('afterend',tab);else nav.appendChild(tab);
  }
  const more=field('moreSheet');
  if(more && !field(MORE_TAB_ID)){
    const button=document.createElement('button'); button.id=MORE_TAB_ID; button.type='button'; button.className='tab'; button.dataset.tab='gameModel'; button.textContent='🧭 Game Model';
    button.addEventListener('click',()=>showGameModelView()); more.prepend(button);
  }
}

function decoratePreview(){
  const preview=field('preview'); if(!preview)return;
  preview.querySelector('.fpPreviewSummary')?.remove();
  const plan=currentPlan(); const phase=phaseById(plan.gamePhase); const main=principleById(plan.primaryPrincipleId);
  if(!phase&&!main&&!plan.playerProblem)return;
  const box=document.createElement('div'); box.className='fpPreviewSummary';
  box.innerHTML=`<b>${esc([phase?.label,main?.message].filter(Boolean).join(' · ')||'Game Model')}</b>${plan.playerProblem?`<div class="small"><b>Player problem:</b> ${esc(plan.playerProblem)}</div>`:''}${plan.subPrincipleIds.length?`<div class="small"><b>Detail:</b> ${esc(plan.subPrincipleIds.map(id=>subPrincipleById(id)?.title).filter(Boolean).join(' · '))}</div>`:''}${plan.successLooksLike?`<div class="small"><b>Success looks like:</b> ${esc(plan.successLooksLike)}</div>`:''}`;
  const h=preview.querySelector('h2'); if(h)h.insertAdjacentElement('afterend',box); else preview.prepend(box);
}

function decorateDock(){
  const plan=currentPlan(); const meta=field('currentSessionDockMeta'); const phase=phaseById(plan.gamePhase); const main=principleById(plan.primaryPrincipleId);
  if(!meta||(!phase&&!main))return;
  const marker=[phase?.label,main?.message].filter(Boolean).join(' · ');
  if(marker&&!meta.textContent.includes(marker))meta.textContent += (meta.textContent?' · ':'')+marker;
}

function installPlannerPersistence(){
  let currentOriginal; try{currentOriginal=currentPlannerSession;}catch(_){currentOriginal=window.currentPlannerSession;}
  if(typeof currentOriginal==='function'&&!currentOriginal.__fourPhaseGameModel){
    const wrapped=function(...args){return {...(currentOriginal.apply(this,args)||{}),gameModelPlan:currentPlan()};};
    wrapped.__fourPhaseGameModel=true; try{currentPlannerSession=wrapped;}catch(_){} window.currentPlannerSession=wrapped;
  }

  let loadOriginal; try{loadOriginal=loadSessionToPlanner;}catch(_){loadOriginal=window.loadSessionToPlanner;}
  if(typeof loadOriginal==='function'&&!loadOriginal.__fourPhaseGameModel){
    const wrapped=function(index,mode='edit',...rest){const session=appDb()?.sessions?.[index];const result=loadOriginal.call(this,index,mode,...rest);setTimeout(()=>{ensurePlannerPanel();setPlan(session?.gameModelPlan||{});decoratePreview();},0);return result;};
    wrapped.__fourPhaseGameModel=true; try{loadSessionToPlanner=wrapped;}catch(_){} window.loadSessionToPlanner=wrapped;
  }

  let resetOriginal; try{resetOriginal=resetSessionPlanner;}catch(_){resetOriginal=window.resetSessionPlanner;}
  if(typeof resetOriginal==='function'&&!resetOriginal.__fourPhaseGameModel){
    const wrapped=function(...args){const result=resetOriginal.apply(this,args);clearPlan();return result;};
    wrapped.__fourPhaseGameModel=true; try{resetSessionPlanner=wrapped;}catch(_){} window.resetSessionPlanner=wrapped;
  }

  let previewOriginal; try{previewOriginal=renderPreview;}catch(_){previewOriginal=window.renderPreview;}
  if(typeof previewOriginal==='function'&&!previewOriginal.__fourPhaseGameModel){
    const wrapped=function(...args){const result=previewOriginal.apply(this,args);decoratePreview();return result;};
    wrapped.__fourPhaseGameModel=true; try{renderPreview=wrapped;}catch(_){} window.renderPreview=wrapped;
  }

  let dockOriginal; try{dockOriginal=renderCurrentSessionDock;}catch(_){dockOriginal=window.renderCurrentSessionDock;}
  if(typeof dockOriginal==='function'&&!dockOriginal.__fourPhaseGameModel){
    const wrapped=function(...args){const result=dockOriginal.apply(this,args);decorateDock();return result;};
    wrapped.__fourPhaseGameModel=true; try{renderCurrentSessionDock=wrapped;}catch(_){} window.renderCurrentSessionDock=wrapped;
  }

  let saveBlueprintOriginal; try{saveBlueprintOriginal=saveCurrentAsBlueprint;}catch(_){saveBlueprintOriginal=window.saveCurrentAsBlueprint;}
  if(typeof saveBlueprintOriginal==='function'&&!saveBlueprintOriginal.__fourPhaseGameModel){
    const wrapped=function(...args){const data=appDb();const before=data?.sessionTemplates?.length||0;const plan=currentPlan();const result=saveBlueprintOriginal.apply(this,args);setTimeout(()=>{const after=data?.sessionTemplates?.length||0;if(after>before&&data.sessionTemplates[after-1]){data.sessionTemplates[after-1].gameModelPlan=plan;try{if(typeof store==='function')store();else window.store?.();}catch(_){}}},0);return result;};
    wrapped.__fourPhaseGameModel=true; try{saveCurrentAsBlueprint=wrapped;}catch(_){} window.saveCurrentAsBlueprint=wrapped;
  }

  let useBlueprintOriginal; try{useBlueprintOriginal=useBlueprint;}catch(_){useBlueprintOriginal=window.useBlueprint;}
  if(typeof useBlueprintOriginal==='function'&&!useBlueprintOriginal.__fourPhaseGameModel){
    const wrapped=function(index,...rest){const template=appDb()?.sessionTemplates?.[index];const result=useBlueprintOriginal.call(this,index,...rest);setTimeout(()=>setPlan(template?.gameModelPlan||{}),0);return result;};
    wrapped.__fourPhaseGameModel=true; try{useBlueprint=wrapped;}catch(_){} window.useBlueprint=wrapped;
  }
}

function reviewScoreOptions(value=''){
  return '<option value="">—</option>'+Array.from({length:10},(_,i)=>i+1).map(n=>`<option value="${n}"${String(value)===String(n)?' selected':''}>${n}/10</option>`).join('');
}
function injectReview(session,index){
  const body=field('reviewBody'); if(!body||!session)return;
  body.querySelector('#fourPhaseReviewCard')?.remove();
  reviewSession=session; reviewIndex=Number.isInteger(index)?index:-1;
  const plan=normaliseGameModelPlan(session.gameModelPlan||{});
  const phase=phaseById(plan.gamePhase); const main=principleById(plan.primaryPrincipleId); const existing=session.review?.gameModelV2||{};
  const subs=plan.subPrincipleIds.map(subPrincipleById).filter(Boolean);
  const card=document.createElement('div'); card.id='fourPhaseReviewCard'; card.className='reviewCard';
  card.innerHTML=`<h2>Did the principle land?</h2><div class="fpReviewMeta">${phase?`<span>${esc(phase.label)}</span>`:''}${main?`<span>${esc(main.message)}</span>`:''}${subs.map(item=>`<span>${esc(item.title)}</span>`).join('')}</div>${plan.playerProblem?`<div class="small"><b>Player problem:</b> ${esc(plan.playerProblem)}</div>`:''}${plan.successLooksLike?`<div class="small" style="margin-top:4px"><b>Success target:</b> ${esc(plan.successLooksLike)}</div>`:''}<div class="fpReviewScores" style="margin-top:9px"><label>UNDERSTANDING<select id="fpReviewUnderstanding">${reviewScoreOptions(existing.understanding)}</select></label><label>RECOGNITION<select id="fpReviewRecognition">${reviewScoreOptions(existing.recognition)}</select></label><label>EXECUTION<select id="fpReviewExecution">${reviewScoreOptions(existing.execution)}</select></label><label>TRANSFER<select id="fpReviewTransfer">${reviewScoreOptions(existing.transfer)}</select></label></div><div class="fpReviewEvidence"><label>EVIDENCE<textarea id="fpReviewEvidence" placeholder="What did players actually do or say?">${esc(existing.evidence||'')}</textarea></label><label>NEXT ACTION<select id="fpReviewNextAction"><option value="">Choose...</option>${['Embed','Progress','Revisit','Adapt'].map(v=>`<option${existing.nextAction===v?' selected':''}>${v}</option>`).join('')}</select></label></div>`;
  const grid=body.querySelector('.reviewGrid'); if(grid)grid.prepend(card); else body.prepend(card);
  const choice=body.querySelector('[data-choice="objectiveOutcome"]'); if(choice){choice.classList.add('fourPhaseLegacyHidden');const label=choice.previousElementSibling;if(label?.tagName==='LABEL')label.classList.add('fourPhaseLegacyHidden');}
  const outcomeCard=body.querySelector('.reviewGrid .reviewCard:not(#fourPhaseReviewCard)');
  if(outcomeCard){const h=outcomeCard.querySelector('h2');if(h)h.textContent='Overall coaching reflection';}
  ['reviewSaveClose','reviewSaveDashboard'].forEach(id=>field(id)?.addEventListener('click',captureReview,{capture:true}));
}
function captureReview(){
  if(!reviewSession)return;
  const payload={
    gamePhase:normaliseGameModelPlan(reviewSession.gameModelPlan||{}).gamePhase,
    primaryPrincipleId:normaliseGameModelPlan(reviewSession.gameModelPlan||{}).primaryPrincipleId,
    subPrincipleIds:normaliseGameModelPlan(reviewSession.gameModelPlan||{}).subPrincipleIds,
    understanding:Number(field('fpReviewUnderstanding')?.value||0),
    recognition:Number(field('fpReviewRecognition')?.value||0),
    execution:Number(field('fpReviewExecution')?.value||0),
    transfer:Number(field('fpReviewTransfer')?.value||0),
    evidence:String(field('fpReviewEvidence')?.value||'').trim(),
    nextAction:String(field('fpReviewNextAction')?.value||'')
  };
  const session=reviewSession; const index=reviewIndex;
  [80,320].forEach(delay=>setTimeout(async()=>{
    const data=appDb(); const target=index>=0?data?.sessions?.[index]:(data?.sessions||[]).find(item=>item===session||(item.id&&session.id&&item.id===session.id));
    if(!target)return;
    target.review={...(target.review||{}),gameModelV2:payload};
    try{if(typeof store==='function')await store();else if(typeof window.store==='function')await window.store();else localStorage.setItem('nickCoachOSv3',JSON.stringify(data));}catch(_){}
  },delay));
}
function installReviewIntegration(){
  let original; try{original=openPostSessionReview;}catch(_){original=window.openPostSessionReview;}
  if(typeof original!=='function'||original.__fourPhaseGameModel)return;
  const wrapped=function(session,index,...rest){const result=original.call(this,session,index,...rest);setTimeout(()=>injectReview(session,index),0);return result;};
  wrapped.__fourPhaseGameModel=true; try{openPostSessionReview=wrapped;}catch(_){} window.openPostSessionReview=wrapped;
}

function decorateSideline(){
  const host=field('grassContent'); if(!host)return;
  host.querySelector('#fourPhaseSidelineCue')?.remove();
  let state; try{state=typeof sidelineState!=='undefined'?sidelineState:window.sidelineState;}catch(_){state=window.sidelineState;}
  const plan=normaliseGameModelPlan(state?.session?.gameModelPlan||{}); const phase=phaseById(plan.gamePhase); const main=principleById(plan.primaryPrincipleId);
  if(!phase&&!main)return;
  const subs=plan.subPrincipleIds.map(subPrincipleById).filter(Boolean);
  const box=document.createElement('div'); box.id='fourPhaseSidelineCue';
  box.innerHTML=`<b>${esc([phase?.label,main?.message].filter(Boolean).join(' · '))}</b>${subs.length?`<span>${esc(subs.map(item=>item.title).join(' · '))}</span>`:''}`;
  host.prepend(box);
}
function installSidelineIntegration(){
  let original; try{original=renderSidelinePractice;}catch(_){original=window.renderSidelinePractice;}
  if(typeof original==='function'&&!original.__fourPhaseGameModel){
    const wrapped=function(...args){const result=original.apply(this,args);setTimeout(decorateSideline,0);return result;};
    wrapped.__fourPhaseGameModel=true; try{renderSidelinePractice=wrapped;}catch(_){} window.renderSidelinePractice=wrapped;
  }
}

function refreshFinderFromSession(){
  try{window.NickFourPhasePracticeSystem?.resetFinderToSession?.();}catch(_){}
}
function ensureAll(){
  addStyles(); ensureNavigation(); ensureGameModelView(); ensurePlannerPanel(); hideLegacyBuilderFields(); installPlannerPersistence(); installReviewIntegration(); installSidelineIntegration();
}
function install(){
  ensureAll();
  [100,350,800,1600].forEach(delay=>setTimeout(ensureAll,delay));
  plannerObserver=new MutationObserver(()=>{ensurePlannerPanel();hideLegacyBuilderFields();});
  const planner=field('planner'); if(planner)plannerObserver.observe(planner,{childList:true,subtree:true});
  document.addEventListener('click',event=>{if(event.target.closest?.('[data-tab="planner"],[onclick*="showBuildRoute"]'))setTimeout(ensureAll,60);},true);
  window.NickFourPhaseGameModel=Object.freeze({version:FOUR_PHASE_GAME_MODEL_OS_VERSION,currentPlan,setPlan,show:showGameModelView,refreshFinderFromSession});
}

if(typeof window!=='undefined'&&typeof document!=='undefined'){
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true}); else install();
}
