import {clone} from './sync-engine.js';
import {uid,alignInstances,changeInstances,effectiveInstance,nextActions,validateBackup} from './coaching-domain.js';
import {GAME_MODEL_PRINCIPLES,principleById} from './game-model-core.js';

const field=id=>document.getElementById(id);
const dbNow=()=>{try{return db;}catch{return window.db;}};
const ids=()=>{try{return [...plannerDrills];}catch{return [];}};
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const value=id=>field(id)?.value.trim()||'';
const PLAN_FIELDS={evidence:'Evidence behind this objective',observe:'What will you observe?',trigger:'Trigger · what do players recognise?',roles:'Roles · who does what?',alternative:'Alternative · when is another option better?',individualFocus:'Individual / unit focus',transferTask:'Transfer · what will you look for in a game?'};
const SETUP_FIELDS={players:'Players / goalkeepers',area:'Area / dimensions',minutes:'Duration',rotation:'Work, rest and rotations',equipment:'Equipment',focus:'Today’s focus / cues',delivered:'Delivered changes / notes'};
let draft={version:1,instances:[]},reviewSession=null,practiceDraft={};
function input(id,label,text='',type='textarea'){
 return `<label for="${esc(id)}">${esc(label)}</label>${type==='textarea'?`<textarea id="${esc(id)}" rows="2">${esc(text)}</textarea>`:`<input id="${esc(id)}" type="${type}" value="${esc(text)}">`}`;
}
function persist(){window.NickPersistence.enqueue(dbNow());renderPathway();}
function rememberDraft(){
 try{localStorage.setItem('nickCoachLearningDraftV1',JSON.stringify({coaching:draft,drills:ids(),planner:typeof currentPlannerSession==='function'?currentPlannerSession():{},model:window.NickFourPhaseGameModel?.currentPlan?.(),editingId:typeof editingSessionId==='undefined'?null:editingSessionId}));}catch{}
}
export function capture(){
 for(const key of Object.keys(PLAN_FIELDS))if(field(`learning-${key}`))draft[key]=value(`learning-${key}`);
 draft.instances=alignInstances(ids(),draft.instances,dbNow()?.practices);
 return clone(draft);
}
function load(session={}){
 draft=clone(session.coaching||{version:1,instances:[]});
 draft.instances=alignInstances(session.drills||[],draft.instances,dbNow()?.practices);
 for(const key of Object.keys(PLAN_FIELDS))if(field(`learning-${key}`))field(`learning-${key}`).value=draft[key]||'';
 if(field('sessionPrescriptions'))delete field('sessionPrescriptions').dataset.signature;
 renderPrescriptions();
}
function reset(){draft={version:1,instances:[]};load({});localStorage.removeItem('nickCoachLearningDraftV1');}
function change(kind,index,target){draft.instances=changeInstances(draft.instances,kind,index,target);}
function renderPrescriptions(){
 const host=field('sessionPrescriptions');if(!host)return;
 draft.instances=alignInstances(ids(),draft.instances,dbNow()?.practices);
 const signature=JSON.stringify(draft.instances.map(x=>[x.id,x.practiceId]));
 if(host.dataset.signature===signature)return;host.dataset.signature=signature;
 host.innerHTML=draft.instances.length?draft.instances.map((instance,index)=>`<details class="learningSetup"><summary>${index+1}. ${esc(instance.snapshot?.name||instance.practiceId)} · session setup</summary><p class="small">Saved for this session. The reusable practice stays unchanged.</p><div class="learningGrid">${Object.entries(SETUP_FIELDS).map(([key,label])=>input(`setup-${instance.id}-${key}`,label,instance.prescription?.[key]||'','text')).join('')}</div></details>`).join(''):'<p class="small">Add a practice to set its numbers, space and delivery details.</p>';
 host.querySelectorAll('input').forEach(el=>el.addEventListener('input',()=>{
  const instance=draft.instances.find(x=>el.id.startsWith(`setup-${x.id}-`));if(!instance)return;
  const key=el.id.slice(`setup-${instance.id}-`.length);instance.prescription[key]=el.value;rememberDraft();setupSummary();
 }));setupSummary();
}
function setupSummary(){
 const missing=draft.instances.filter(x=>!['players','area','minutes'].every(key=>String(x.prescription?.[key]||'').trim())).length;
 const el=field('sessionSetupSummary');if(el)el.textContent=missing?`${missing} practice setup${missing===1?'':'s'} still need numbers, area or duration. You can save a draft.`:'Session setups complete.';
}
function ensurePlanner(){
 const parent=field('fourPhaseSessionPlan');if(!parent||field('learningPlan'))return;
 const section=document.createElement('section');section.id='learningPlan';section.className='learningSection';
 section.innerHTML=`<h3>Evidence → learning → game transfer</h3><p class="small">Connect the objective above to what you saw and what players will demonstrate.</p>${input('learning-evidence',PLAN_FIELDS.evidence,'','textarea')}${input('learning-observe',PLAN_FIELDS.observe,'','textarea')}<details><summary>Roles, decisions and individual focus</summary>${Object.entries(PLAN_FIELDS).filter(([k])=>!['evidence','observe'].includes(k)).map(([key,label])=>input(`learning-${key}`,label)).join('')}<button type="button" id="useModelDetail">Use saved principle detail in empty fields</button></details><details><summary>Actual session prescriptions</summary><p id="sessionSetupSummary" class="small"></p><div id="sessionPrescriptions"></div></details><button type="button" id="restoreLearningDraft" hidden>Recover learning draft</button>`;
 parent.after(section);
 section.querySelectorAll('textarea').forEach(el=>el.addEventListener('input',()=>{capture();rememberDraft();}));
 field('useModelDetail').onclick=()=>{
  const id=window.NickFourPhaseGameModel?.currentPlan?.().primaryPrincipleId;
  const detail=dbNow()?.banks?.principleDelivery?.[id]||{};
  for(const key of ['trigger','roles','alternative','observe'])if(!value(`learning-${key}`))field(`learning-${key}`).value=detail[key]||'';
  capture();rememberDraft();
 };
 if(localStorage.getItem('nickCoachLearningDraftV1')){
  field('restoreLearningDraft').hidden=false;
  field('restoreLearningDraft').onclick=()=>{
   const saved=JSON.parse(localStorage.getItem('nickCoachLearningDraftV1'));
   if(!saved)return;
   if(ids().length&&!confirm('Replace the current planner with the recovered learning draft?'))return;
   plannerDrills=[...(saved.drills||[])];editingSessionId=saved.editingId||null;
   for(const [id,key] of [['sDate','date'],['team','team'],['objective','objective'],['links','links'],['cues','cues'],['reflect','reflect'],['sessionRating','rating']])if(field(id))field(id).value=saved.planner?.[key]||'';
   if(typeof plannerDiagramOverrides!=='undefined')plannerDiagramOverrides=clone(saved.planner?.diagramOverrides||[]);
   window.NickFourPhaseGameModel?.setPlan?.(saved.model||{});load({coaching:saved.coaching,drills:plannerDrills});
   window.renderSessionDrillList?.();window.renderPreview?.();
  };
 }
 renderPrescriptions();
}
function ensurePractice(){
 const cp=field('cp');if(!cp||field('practiceLearning'))return;
 const host=document.createElement('details');host.id='practiceLearning';host.className='learningSection';
 host.innerHTML=`<summary>Practice family, variation and delivery cues</summary>${input('practiceFamily','Practice family',practiceDraft.familyName||'','text')}${input('practiceVariation','Variation · what changes?',practiceDraft.variationName||'','text')}${input('practiceDeliveryCues','Short delivery cues',practiceDraft.deliveryCues||'')}<label for="practiceReadiness">Readiness</label><select id="practiceReadiness"><option value="draft">Draft</option><option value="ready">Ready to run</option><option value="reviewed">Reviewed in delivery</option></select><button type="button" id="createPracticeVariation">Create a variation</button><p class="small">Use the same family name to group related practices. A variation keeps its own ID, setup and review history.</p>`;
 cp.after(host);
 field('createPracticeVariation').onclick=()=>{
  const name=value('practiceFamily')||value('pname');
  const metadata=readPractice();window.duplicatePractice?.();
  practiceDraft={...metadata,familyName:name,variationName:'',readiness:'draft'};
  field('practiceFamily').value=name;field('practiceVariation').value='';field('practiceReadiness').value='draft';
 };
}
function loadPractice(practice={}){
 ensurePractice();practiceDraft=clone(practice);
 for(const [id,key] of [['practiceFamily','familyName'],['practiceVariation','variationName'],['practiceDeliveryCues','deliveryCues'],['practiceReadiness','readiness']])if(field(id))field(id).value=practice[key]||(key==='readiness'?'draft':'');
}
function readPractice(){
 const familyName=value('practiceFamily'),relative=(dbNow()?.practices||[]).find(p=>p.familyName?.toLowerCase()===familyName.toLowerCase());
 return {familyName,familyId:familyName?(relative?.familyId||practiceDraft.familyId||uid('family')):'',variationName:value('practiceVariation'),deliveryCues:value('practiceDeliveryCues'),readiness:value('practiceReadiness')||'draft'};
}
function openReview(session){
 reviewSession=session;const parent=field('reviewBody');if(!parent)return;
 field('learningReview')?.remove();const el=document.createElement('details');el.id='learningReview';el.open=true;el.className='learningSection';
 const learning=session.review?.learning||{};
 el.innerHTML=`<summary>Learning evidence and next action</summary><p class="small"><b>Observe:</b> ${esc(session.coaching?.observe||session.gameModelPlan?.successLooksLike||'No observation target recorded')}</p>${input('reviewEvidence','What did players demonstrate? Include a counterexample.',learning.evidence)}${input('reviewOpportunities','Who had opportunities? What did you observe?',learning.opportunities)}<label for="reviewIndependent">Without prompting</label><select id="reviewIndependent"><option value="not-observed">Not observed</option><option value="supported">Only with support</option><option value="independent">Observed independently</option><option value="mixed">Mixed evidence</option></select>${input('reviewTransfer','Match / later-game evidence',learning.transferEvidence)}${input('reviewMatchDate','Match / observation date',learning.matchDate,'date')}${input('reviewNextAction','Next coaching action',learning.nextAction)}${input('reviewActionDue','Revisit by',learning.due,'date')}<p class="small">Saving the review adds its next action to Coaching pathway. Not observed is a valid answer.</p>`;
 parent.prepend(el);field('reviewIndependent').value=learning.independent||'not-observed';
}
function readReview(session){
 if(!field('learningReview')||reviewSession?.id!==session.id)return session.review?.learning;
 return {...(session.review?.learning||{}),evidence:value('reviewEvidence'),opportunities:value('reviewOpportunities'),independent:value('reviewIndependent'),transferEvidence:value('reviewTransfer'),matchDate:value('reviewMatchDate'),nextAction:value('reviewNextAction'),due:value('reviewActionDue'),actionStatus:value('reviewNextAction')===session.review?.learning?.nextAction?(session.review?.learning?.actionStatus||'open'):'open'};
}
function detail(session,host){
 if(!host||!session.coaching)return;
 const box=document.createElement('details');box.className='learningSection';
 box.innerHTML=`<summary>Learning plan and delivery record</summary>${Object.entries(PLAN_FIELDS).map(([key,label])=>session.coaching[key]?`<p><b>${esc(label)}</b><br>${esc(session.coaching[key]).replace(/\n/g,'<br>')}</p>`:'').join('')}${(session.coaching.instances||[]).map(i=>`<details><summary>${esc(i.snapshot?.name||i.practiceId)}</summary>${Object.entries(SETUP_FIELDS).map(([key,label])=>i.prescription?.[key]?`<p><b>${esc(label)}:</b> ${esc(i.prescription[key])}</p>`:'').join('')}</details>`).join('')}`;
 host.prepend(box);
}
function updateAction(action,status){
 const data=dbNow();
 if(action.sourceSessionId){const session=data.sessions.find(s=>s.id===action.sourceSessionId);session.review.learning.actionStatus=status;}
 else data.banks.coachingActions[action.id].status=status;
 persist();
}
function renderPathway(){
 const host=field('coachingActions');if(!host)return;
 const actions=nextActions(dbNow()),open=actions.filter(x=>x.status!=='done');
 host.innerHTML=open.length?open.map(action=>`<article class="learningAction"><b>${esc(action.title)}</b><p class="small">${esc(action.team||'')} · ${esc(action.due||'No revisit date')} · ${esc(action.status||'open')}</p>${action.evidence?`<p>${esc(action.evidence)}</p>`:''}<button data-plan-action="${esc(action.id)}">Use in next plan</button> <button data-complete-action="${esc(action.id)}">Mark complete</button></article>`).join(''):'<p>No open actions. Save a next action in a session review or add one below.</p>';
 host.querySelectorAll('[data-plan-action]').forEach(button=>button.onclick=()=>{
  const action=actions.find(x=>x.id===button.dataset.planAction);if(!action)return;
  if(ids().length&&!confirm('Start a new plan from this action? Save your current session first if you need it.'))return;
  window.resetSessionPlanner?.();document.querySelector('[data-tab="planner"]')?.click();window.showBuildRoute?.('advanced');
  window.NickFourPhaseGameModel?.setPlan?.({...action.gameModelPlan,playerProblem:action.title,successLooksLike:''});
  draft.sourceActionId=action.id;draft.evidence=action.evidence||'';field('learning-evidence').value=draft.evidence;
  rememberDraft();updateAction(action,'planned');
 });
 host.querySelectorAll('[data-complete-action]').forEach(button=>button.onclick=()=>updateAction(actions.find(x=>x.id===button.dataset.completeAction),'done'));
 const done=field('completedCoachingActions');done.innerHTML=actions.filter(x=>x.status==='done').map(action=>`<p>${esc(action.title)} <button data-reopen-action="${esc(action.id)}">Reopen</button></p>`).join('')||'<p>No completed actions.</p>';
 done.querySelectorAll('[data-reopen-action]').forEach(b=>b.onclick=()=>updateAction(actions.find(x=>x.id===b.dataset.reopenAction),'open'));
 renderGoals();
}
function renderGoals(){
 const host=field('developmentGoals');if(!host)return;
 host.innerHTML=Object.values(dbNow()?.banks?.developmentGoals||{}).map(goal=>`<details><summary>${esc(goal.player)} · ${esc(goal.goal)} · ${esc(goal.status||'active')}</summary><p>${esc(principleById(goal.principle)?.message||'General development')} · Revisit ${esc(goal.due||'not set')}</p>${input(`goalEvidence-${goal.id}`,'Latest observation / evidence',goal.evidence)}<button data-save-goal="${esc(goal.id)}">Save evidence</button> <button data-toggle-goal="${esc(goal.id)}">${goal.status==='complete'?'Reopen goal':'Complete goal'}</button></details>`).join('')||'<p>No individual or unit goals yet.</p>';
 host.querySelectorAll('[data-save-goal]').forEach(b=>b.onclick=()=>{const goal=dbNow().banks.developmentGoals[b.dataset.saveGoal];goal.evidence=value(`goalEvidence-${goal.id}`);goal.updatedAt=new Date().toISOString();persist();});
 host.querySelectorAll('[data-toggle-goal]').forEach(b=>b.onclick=()=>{const goal=dbNow().banks.developmentGoals[b.dataset.toggleGoal];goal.status=goal.status==='complete'?'active':'complete';persist();});
}
function ensurePathway(){
 const nav=document.querySelector('nav');if(!nav||field('coachingPathway'))return;
 const button=document.createElement('button');button.type='button';button.className='tab';button.textContent='Coaching pathway';button.dataset.tab='coachingPathway';nav.append(button);
 const view=document.createElement('section');view.id='coachingPathway';view.className='view hidden';
 view.innerHTML=`<div class="card"><h2>Coaching pathway</h2><p>Use evidence from sessions and matches to decide what comes next.</p><details open><summary>Next actions</summary><div id="coachingActions"></div><details><summary>Add an action</summary>${input('newAction','Next action')}${input('newActionDue','Revisit by','','date')}<button id="addCoachingAction">Add action</button></details></details><details><summary>Completed actions</summary><div id="completedCoachingActions"></div></details><details><summary>Individual / unit development</summary><p class="small">Use initials, a role or a unit. Record football learning only; avoid health or sensitive personal details.</p><div id="developmentGoals"></div><details><summary>Add a development goal</summary>${input('goalPlayer','Player initials / role / unit','','text')}${input('goalTarget','Learning goal')}<label for="goalPrinciple">Related principle</label><select id="goalPrinciple"><option value="">General development</option>${GAME_MODEL_PRINCIPLES.map(p=>`<option value="${p.id}">${esc(p.message)}</option>`).join('')}</select>${input('goalDue','Revisit by','','date')}<button id="addDevelopmentGoal">Add goal</button></details></details><details><summary>Principle delivery detail</summary><label for="deliveryPrinciple">Principle</label><select id="deliveryPrinciple">${GAME_MODEL_PRINCIPLES.map(p=>`<option value="${p.id}">${esc(p.message)}</option>`).join('')}</select><div id="deliveryFields"></div><button id="saveDeliveryDetail">Save principle detail</button></details></div>`;
 document.body.append(view);
 button.onclick=()=>{document.querySelectorAll('.view').forEach(v=>v.classList.add('hidden'));view.classList.remove('hidden');document.querySelectorAll('.tab').forEach(b=>b.classList.toggle('active',b===button));renderPathway();};
 field('addCoachingAction').onclick=()=>{if(!value('newAction'))return;const data=dbNow();data.banks.coachingActions||={};const id=uid('action');data.banks.coachingActions[id]={id,title:value('newAction'),due:value('newActionDue'),status:'open'};persist();field('newAction').value='';};
 field('addDevelopmentGoal').onclick=()=>{if(!value('goalPlayer')||!value('goalTarget'))return;const data=dbNow();data.banks.developmentGoals||={};const id=uid('goal');data.banks.developmentGoals[id]={id,player:value('goalPlayer'),goal:value('goalTarget'),principle:value('goalPrinciple'),due:value('goalDue'),status:'active'};persist();field('goalPlayer').value='';field('goalTarget').value='';};
 const loadDelivery=()=>{const saved=dbNow()?.banks?.principleDelivery?.[value('deliveryPrinciple')]||{};field('deliveryFields').innerHTML=['trigger','roles','alternative','observe'].map(key=>input(`delivery-${key}`,PLAN_FIELDS[key],saved[key])).join('');};
 field('deliveryPrinciple').onchange=loadDelivery;loadDelivery();
 field('saveDeliveryDetail').onclick=()=>{const data=dbNow();data.banks.principleDelivery||={};data.banks.principleDelivery[value('deliveryPrinciple')]=Object.fromEntries(['trigger','roles','alternative','observe'].map(key=>[key,value(`delivery-${key}`)]));persist();};
 renderPathway();
}
function renderConflicts(){
 const host=field('syncConflictList');if(!host)return;
 const conflicts=window.NickPersistence.conflicts();
 host.innerHTML=conflicts.length?conflicts.map(op=>`<details><summary>${esc(op.local?.name||op.local?.team||op.base?.name||op.id)} · ${esc(op.collection)}</summary><p>Your version and the cloud version are retained until you choose. Different fields merge automatically.</p>${op.conflict.fields.map(f=>`<p><b>${esc(f.path)}</b><br>On this device: ${esc(JSON.stringify(f.local)??'(deleted)')}<br>Cloud: ${esc(JSON.stringify(f.remote)??'(deleted)')}</p>`).join('')}<button data-resolve-key="${esc(op.key)}" data-choice="local">Keep my conflicting changes</button> <button data-resolve-key="${esc(op.key)}" data-choice="remote">Use cloud record</button></details>`).join(''):'<p>No edit conflicts.</p>';
 host.querySelectorAll('[data-resolve-key]').forEach(b=>b.onclick=()=>window.NickPersistence.resolve(b.dataset.resolveKey,b.dataset.choice));
}
function ensureRecovery(){
 const parent=field('backup');if(!parent||field('syncConflictList'))return;
 const host=document.createElement('section');host.className='card';host.innerHTML='<h3>Sync and recovery</h3><button id="retryQueuedChanges">Retry queued changes</button><details><summary>Edit conflicts</summary><div id="syncConflictList"></div></details><p id="backupExportStatus" role="status"></p><a id="backupDownloadLink" hidden>Download JSON backup</a>';
 parent.prepend(host);field('retryQueuedChanges').onclick=()=>window.NickPersistence.flush();window.NickPersistence.subscribe(renderConflicts);
}
async function exportBackup(){
 const status=field('backupExportStatus');if(status)status.textContent='Preparing a local snapshot…';
 await new Promise(resolve=>setTimeout(resolve,0));
 try{
  const data=JSON.stringify(dbNow());const blob=new Blob([data],{type:'application/json'});
  const link=field('backupDownloadLink');if(link){if(link.dataset.url)URL.revokeObjectURL(link.dataset.url);link.href=URL.createObjectURL(blob);link.dataset.url=link.href;link.download=`coaching-os-${new Date().toISOString().slice(0,10)}.json`;link.hidden=false;}
  // Do not insert a multi-megabyte value into the accessibility tree.
  field('backupBox').value=data.length<150000?data:'';
  if(status)status.textContent=`Ready: ${dbNow().practices.length} practices, ${dbNow().sessions.length} sessions. Download to keep an independent backup.${data.length>=150000?' Large backup kept out of the text box for responsiveness.':''}`;
 }catch(error){if(status)status.textContent=`Export failed: ${error.message}`;}
}
function restoreBackup(){
 try{
  const incoming=validateBackup(JSON.parse(field('backupBox').value));
  if(!confirm(`Replace this workspace with ${incoming.practices.length} practices and ${incoming.sessions.length} sessions? Current data will be kept in a local recovery copy.`))return;
  localStorage.setItem('nickCoachBeforeRestoreV3',JSON.stringify(dbNow()));
  window.NickPersistence.enqueue(incoming);db=incoming;window.renderAll?.();
 }catch(error){alert(`Restore not completed: ${error.message}`);}
}
function install(){
 const style=document.createElement('style');style.textContent='.learningSection{margin:14px 0;padding:12px;border:1px solid var(--border);border-radius:12px}.learningSection summary,#coachingPathway summary{cursor:pointer;font-weight:700;padding:8px 0}.learningGrid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.learningGrid label{grid-column:1/-1;margin-bottom:-5px}.learningGrid input{grid-column:1/-1}.learningSetup,.learningAction{padding:10px;border-bottom:1px solid var(--border)}#coachingPathway{max-width:1100px;margin:auto}#coachingPathway details{margin:10px 0}#learningPlan textarea{min-height:65px}@media(max-width:700px){.learningGrid{grid-template-columns:1fr}}';document.head.append(style);
 ensurePlanner();ensurePractice();ensurePathway();ensureRecovery();
 if(field('practiceCueChips'))delete field('practiceCueChips').dataset.principleBankSignature;
 window.NickPrincipleWordBanks?.refresh?.();
 window.NickCoachingLoop={capture,load,reset,change,renderPrescriptions,loadPractice,readPractice,openReview,readReview,detail,effectiveInstance,renderPathway,exportBackup,restoreBackup};
 document.addEventListener('click',event=>{if(event.target.closest?.('[data-tab="planner"]'))renderPrescriptions();});
 window.addEventListener('coaching:data',()=>{renderPathway();renderConflicts();});
}
if(typeof window!=='undefined'&&typeof document!=='undefined')install();
