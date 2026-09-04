import { GAME_MODEL_PRINCIPLES, principleById, scorePracticeForPrinciple } from './game-model-core.js';

export const PRACTICE_PURPOSES = Object.freeze([
  Object.freeze({ id:'technical-repetition', label:'Technical / Repetition', description:'Bank touches, repeat a skill, or sharpen execution without forcing a tactical picture.' }),
  Object.freeze({ id:'picture-recognition', label:'Picture / Recognition', description:'Make one of our game-model pictures obvious and repeatable so players learn to see it.' }),
  Object.freeze({ id:'scenario-wave', label:'Scenario / Wave', description:'Rehearse a recurring game problem, overload, underload, wave or unit scenario.' }),
  Object.freeze({ id:'game-transfer', label:'Game / Transfer', description:'Remove support and test whether players can recognise and solve the problem in game-real play.' }),
  Object.freeze({ id:'physical-development', label:'Physical / Development', description:'Develop physical capacity or individual capability that supports how we want to play.' }),
  Object.freeze({ id:'restart-setplay', label:'Restart / Set Play', description:'Corners, free-kicks, throw-ins and other restart-specific work.' })
]);

const STYLE_ID = 'gameModelPracticeArchitectureV2Styles';
const EDITOR_PANEL_ID = 'practiceArchitectureEditorPanel';
const LIBRARY_PANEL_ID = 'practiceArchitectureBrowser';
const LEGACY_LIBRARY_ID = 'legacyThemePracticeBrowser';
const REVIEW_CARD_ID = 'gameModelUnderstandingReview';
const REVIEW_HIDE_ID = 'gameModelReviewClarity';
let activeLibraryView = 'principles';
let currentReviewSession = null;
let currentReviewIndex = -1;
let plannerObserver = null;
let libraryObserver = null;

function appDb() {
  try { return typeof db !== 'undefined' ? db : window.db; }
  catch (_) { return window.db; }
}

function escapeText(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}

function clampTen(value) {
  const number = Number(value) || 0;
  return number ? Math.max(1, Math.min(10, Math.round(number))) : 0;
}

export function normalisePrincipleIds(value = []) {
  const source = Array.isArray(value) ? value : String(value || '').split(/[\n,|]/);
  const seen = new Set();
  return source.map(item => String(item || '').trim()).filter(Boolean).filter(id => {
    if (!principleById(id) || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

export function purposeById(id = '') {
  return PRACTICE_PURPOSES.find(item => item.id === String(id || '')) || null;
}

export function inferPracticePurpose(practice = {}) {
  if (purposeById(practice.practicePurpose)) return practice.practicePurpose;
  const theme = String(practice.theme || '').toLowerCase();
  const stage = String(practice.stage || '').toLowerCase();
  const text = [practice.name,practice.desc,practice.description,practice.cp,practice.coachingPoints,practice.rules,practice.condRules].filter(Boolean).join(' ').toLowerCase();
  if (theme.includes('set play') || /corner|free kick|throw.?in|restart/.test(text)) return 'restart-setplay';
  if (theme.includes('fitness') || /conditioning|aerobic|anaerobic|speed endurance|repeat sprint/.test(text)) return 'physical-development';
  if (/wave|transition wave|\b[23456]v[12345]\b|overload to goal|attack v defend|phase of play/.test(text)) return 'scenario-wave';
  if (stage.includes('conditioned game') || stage === 'game' || /small sided game|ssg|conditioned game|free play/.test(text)) return 'game-transfer';
  if (stage.includes('activation') || theme.includes('core passing') || stage.includes('skill')) return 'technical-repetition';
  if (stage.includes('tactical')) return 'picture-recognition';
  return 'technical-repetition';
}

export function suggestedPrinciplesForPractice(practice = {}, limit = 3) {
  return GAME_MODEL_PRINCIPLES
    .map(principle => ({ principle, score:scorePracticeForPrinciple(practice, principle.id) }))
    .filter(item => item.score >= 5)
    .sort((a,b) => b.score - a.score || a.principle.number - b.principle.number)
    .slice(0, Math.max(1, Number(limit) || 3))
    .map(item => item.principle.id);
}

export function normaliseGameModelReview(value = {}, session = {}) {
  const plan = session?.gameModelPlan || {};
  return {
    primaryPrincipleId:principleById(value.primaryPrincipleId || plan.primaryPrincipleId)?.id || '',
    supportingPrincipleId:principleById(value.supportingPrincipleId || plan.supportingPrincipleId)?.id || '',
    understanding:clampTen(value.understanding),
    recognition:clampTen(value.recognition),
    transfer:clampTen(value.transfer),
    execution:clampTen(value.execution),
    cueHelp:['Yes','Partly','No'].includes(value.cueHelp) ? value.cueHelp : '',
    nextAction:['Embed','Progress','Revisit','Adapt'].includes(value.nextAction) ? value.nextAction : '',
    evidence:String(value.evidence || '').trim()
  };
}

function addStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    #objective,#objChips,#links,#linkChips,#reflect,#reflectChips,#sessionSubtitleField{display:none!important}
    #${REVIEW_HIDE_ID}{display:none!important}
    .gmLegacyPlannerHidden{display:none!important}
    #${EDITOR_PANEL_ID}{margin:0 0 12px;padding:12px;border:1px solid rgba(52,211,153,.28);background:rgba(52,211,153,.045);border-radius:13px}
    #${EDITOR_PANEL_ID} h3{margin:0 0 3px;font-size:14px}#${EDITOR_PANEL_ID}>p{margin:0 0 9px;font-size:10.5px;color:var(--text-dim);line-height:1.4}
    .gmPracticePurposeRow{display:grid;grid-template-columns:1fr;gap:7px}.gmPracticePurposeRow label{margin-top:4px}
    .gmPrincipleTagGrid{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:6px}.gmPrincipleTag{display:flex;align-items:flex-start;gap:7px;padding:8px;border:1px solid var(--border-soft);border-radius:9px;background:rgba(4,13,22,.35);cursor:pointer}.gmPrincipleTag input{width:auto;margin-top:2px}.gmPrincipleTag b{display:block;font-size:10.5px;color:#f8fafc}.gmPrincipleTag span{display:block;font-size:9.5px;color:var(--text-dim);margin-top:2px;line-height:1.3}
    .gmEditorSuggestion{margin-top:7px;padding:7px 8px;border-radius:9px;background:rgba(56,189,248,.055);border:1px solid rgba(56,189,248,.18);font-size:9.5px;color:#bae6fd}.gmEditorSuggestion button{padding:4px 6px;font-size:9px;margin-left:5px}
    #${LIBRARY_PANEL_ID}{margin-bottom:14px}.gmArchitectureHero{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.gmArchitectureHero h2{margin:0}.gmArchitectureHero p{margin:4px 0 0;color:var(--text-dim);font-size:11px;line-height:1.45;max-width:760px}
    .gmArchitectureTabs{display:flex;gap:6px;flex-wrap:wrap;margin:11px 0 8px}.gmArchitectureTabs button.on{background:var(--turf);color:#04160f;border-color:var(--turf)}
    .gmArchitectureSearch{display:flex;gap:7px;margin-bottom:10px}.gmArchitectureSearch input{flex:1}.gmArchitectureGroup{margin:10px 0 14px}.gmArchitectureGroupHead{display:flex;justify-content:space-between;gap:8px;align-items:flex-end;margin-bottom:6px}.gmArchitectureGroupHead h3{margin:0;font-size:14px}.gmArchitectureGroupHead span{font-size:9.5px;color:var(--text-faint)}
    .gmPracticeOrganisedGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.gmOrganisedPractice{padding:9px;border:1px solid var(--border-soft);border-radius:10px;background:var(--surface-2)}.gmOrganisedPractice h4{font-size:11px;margin:0 0 4px}.gmOrganisedPracticeMeta{font-size:9px;color:var(--text-faint);line-height:1.35}.gmOrganisedPracticeTags{display:flex;gap:4px;flex-wrap:wrap;margin-top:6px}.gmOrganisedPracticeTags span{font-size:8.5px;padding:3px 5px;border-radius:999px;border:1px solid rgba(56,189,248,.2);color:#bae6fd}.gmOrganisedPracticeActions{display:flex;gap:5px;margin-top:7px}.gmOrganisedPracticeActions button{padding:5px 7px;font-size:9px}
    #${LEGACY_LIBRARY_ID}{margin-top:12px;border:1px solid var(--border-soft);border-radius:12px;background:rgba(4,13,22,.24)}#${LEGACY_LIBRARY_ID}>summary{cursor:pointer;padding:10px 12px;font-size:11px;font-weight:850;color:var(--text-dim)}#${LEGACY_LIBRARY_ID}>.grid{padding:0 10px 10px}
    #postSessionReviewOverlay .gmGameModelReviewCard{grid-column:1/-1;border-color:rgba(52,211,153,.32);background:linear-gradient(145deg,rgba(52,211,153,.07),var(--surface))}
    .gmReviewPrincipleStrip{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px}.gmReviewPrincipleStrip>div{padding:9px;border:1px solid var(--border-soft);border-radius:10px;background:rgba(4,13,22,.33)}.gmReviewPrincipleStrip b{display:block;font-size:9px;color:#93c5fd;text-transform:uppercase;letter-spacing:.05em}.gmReviewPrincipleStrip span{display:block;margin-top:3px;font-size:11px;line-height:1.4}
    .gmReviewScoreGrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px}.gmReviewScoreGrid label{margin-top:0}.gmReviewEvidenceGrid{display:grid;grid-template-columns:1fr 180px 180px;gap:7px;margin-top:9px;align-items:start}.gmReviewEvidenceGrid textarea{min-height:82px}.gmReviewWhyHint{font-size:10px;color:var(--text-dim);line-height:1.4;margin:5px 0 9px}
    @media(max-width:850px){.gmPrincipleTagGrid,.gmPracticeOrganisedGrid,.gmReviewScoreGrid,.gmReviewPrincipleStrip{grid-template-columns:1fr}.gmReviewEvidenceGrid{grid-template-columns:1fr}.gmArchitectureHero{display:block}}
  `;
  document.head.appendChild(style);
}

function hideLegacyPlannerBlock(fieldId, chipId) {
  const field = document.getElementById(fieldId);
  const chip = chipId ? document.getElementById(chipId) : null;
  if (field) field.classList.add('gmLegacyPlannerHidden');
  if (chip) chip.classList.add('gmLegacyPlannerHidden');
  const label = (chip?.previousElementSibling?.tagName === 'LABEL' ? chip.previousElementSibling : field?.previousElementSibling?.tagName === 'LABEL' ? field.previousElementSibling : null);
  label?.classList.add('gmLegacyPlannerHidden');
}

function cleanAdvancedBuilder() {
  hideLegacyPlannerBlock('objective','objChips');
  hideLegacyPlannerBlock('links','linkChips');
  hideLegacyPlannerBlock('reflect','reflectChips');
  document.getElementById('sessionSubtitleField')?.classList.add('gmLegacyPlannerHidden');
}

function watchPlannerCleanup() {
  const planner = document.getElementById('planner');
  if (!planner || typeof MutationObserver === 'undefined' || plannerObserver) return;
  plannerObserver = new MutationObserver(() => cleanAdvancedBuilder());
  plannerObserver.observe(planner,{childList:true,subtree:true});
}

function principleCheckboxMarkup(principle) {
  return `<label class="gmPrincipleTag"><input type="checkbox" value="${escapeText(principle.id)}"><span><b>${escapeText(principle.message)}</b><span>${escapeText(principle.title)}</span></span></label>`;
}

function ensureEditorPanel() {
  const editor = document.getElementById('editor');
  const card = editor?.querySelector('.grid.two>.card:first-child');
  if (!card || document.getElementById(EDITOR_PANEL_ID)) return;
  const panel = document.createElement('section');
  panel.id = EDITOR_PANEL_ID;
  panel.innerHTML = `<h3>Practice purpose + game-model tags</h3><p><b>Principle</b> tells us what football idea the practice can teach. <b>Purpose</b> tells us what the practice is doing. The old Theme field is now just a secondary game context.</p>
    <div class="gmPracticePurposeRow"><label for="gmPracticePurpose">PRACTICE PURPOSE</label><select id="gmPracticePurpose">${PRACTICE_PURPOSES.map(item=>`<option value="${item.id}">${escapeText(item.label)}</option>`).join('')}</select></div>
    <label>GAME MODEL PRINCIPLES · OPTIONAL / MULTI-SELECT</label><div class="gmPrincipleTagGrid">${GAME_MODEL_PRINCIPLES.map(principleCheckboxMarkup).join('')}</div><div id="gmEditorPrincipleSuggestion" class="gmEditorSuggestion hidden"></div>`;
  const heading = card.querySelector('h2');
  if (heading) heading.insertAdjacentElement('afterend',panel); else card.prepend(panel);
}

function editorPrincipleIds() {
  return [...document.querySelectorAll(`#${EDITOR_PANEL_ID} input[type="checkbox"]:checked`)].map(input=>input.value);
}

function editorPurpose() {
  return purposeById(document.getElementById('gmPracticePurpose')?.value)?.id || 'technical-repetition';
}

function practiceByCurrentForm() {
  const data = appDb();
  const id = document.getElementById('oldId')?.value || document.getElementById('pid')?.value || '';
  return data?.practices?.find(item=>String(item.id)===String(id)) || null;
}

function setEditorMetadata(practice = null) {
  ensureEditorPanel();
  const purpose = practice ? inferPracticePurpose(practice) : 'technical-repetition';
  const select = document.getElementById('gmPracticePurpose');
  if (select) select.value = purpose;
  const ids = new Set(normalisePrincipleIds(practice?.gameModelPrinciples || []));
  document.querySelectorAll(`#${EDITOR_PANEL_ID} input[type="checkbox"]`).forEach(input=>{ input.checked = ids.has(input.value); });
  const suggestion = document.getElementById('gmEditorPrincipleSuggestion');
  if (!suggestion) return;
  const suggested = practice && !ids.size ? suggestedPrinciplesForPractice(practice,3) : [];
  if (!suggested.length) { suggestion.classList.add('hidden'); suggestion.innerHTML=''; return; }
  suggestion.classList.remove('hidden');
  suggestion.innerHTML = `Suggested from the existing coaching detail: ${suggested.map(id=>`<b>${escapeText(principleById(id)?.message || id)}</b>`).join(' · ')} <button type="button" id="gmApplyPrincipleSuggestions">Apply suggestions</button>`;
  document.getElementById('gmApplyPrincipleSuggestions')?.addEventListener('click',()=>{
    document.querySelectorAll(`#${EDITOR_PANEL_ID} input[type="checkbox"]`).forEach(input=>{ if(suggested.includes(input.value)) input.checked=true; });
    suggestion.classList.add('hidden');
  });
}

async function persistPracticeMetadata() {
  const practice = practiceByCurrentForm();
  if (!practice) return;
  practice.practicePurpose = editorPurpose();
  practice.gameModelPrinciples = normalisePrincipleIds(editorPrincipleIds());
  try { if (typeof store === 'function') await store(); else if (typeof window.store === 'function') await window.store(); } catch (_) {}
  renderPracticeArchitectureBrowser();
}

function installPracticeEditorHooks() {
  ensureEditorPanel();
  let saveOriginal;
  try { saveOriginal = savePractice; } catch (_) { saveOriginal = window.savePractice; }
  if (typeof saveOriginal === 'function' && !saveOriginal.__gmPracticeArchitectureV2) {
    const wrapped = function(...args) {
      const result = saveOriginal.apply(this,args);
      setTimeout(()=>persistPracticeMetadata(),0);
      return result;
    };
    wrapped.__gmPracticeArchitectureV2 = true;
    try { savePractice = wrapped; } catch (_) {}
    window.savePractice = wrapped;
  }
  let editOriginal;
  try { editOriginal = editPractice; } catch (_) { editOriginal = window.editPractice; }
  if (typeof editOriginal === 'function' && !editOriginal.__gmPracticeArchitectureV2) {
    const wrapped = function(id,...rest) {
      const data = appDb();
      const practice = data?.practices?.find(item=>String(item.id)===String(id)) || null;
      const result = editOriginal.call(this,id,...rest);
      setTimeout(()=>setEditorMetadata(practice),0);
      return result;
    };
    wrapped.__gmPracticeArchitectureV2 = true;
    try { editPractice = wrapped; } catch (_) {}
    window.editPractice = wrapped;
  }
  let newOriginal;
  try { newOriginal = newPractice; } catch (_) { newOriginal = window.newPractice; }
  if (typeof newOriginal === 'function' && !newOriginal.__gmPracticeArchitectureV2) {
    const wrapped = function(...args) { const result = newOriginal.apply(this,args); setTimeout(()=>setEditorMetadata(null),0); return result; };
    wrapped.__gmPracticeArchitectureV2 = true;
    try { newPractice = wrapped; } catch (_) {}
    window.newPractice = wrapped;
  }
}

function purposeLabel(practice) {
  return purposeById(inferPracticePurpose(practice))?.label || 'Uncategorised';
}

function practiceCard(practice,{suggestedPrincipleId='',showAttach=false}={}) {
  const ids = normalisePrincipleIds(practice.gameModelPrinciples || []);
  const tags = ids.map(id=>principleById(id)?.message).filter(Boolean);
  return `<article class="gmOrganisedPractice" data-practice-id="${escapeText(practice.id)}"><h4>${escapeText(practice.name || practice.id)}</h4><div class="gmOrganisedPracticeMeta">${escapeText(practice.stage || 'No stage')} · ${escapeText(purposeLabel(practice))}<br>Context: ${escapeText(practice.theme || 'Not set')}</div><div class="gmOrganisedPracticeTags">${tags.map(tag=>`<span>${escapeText(tag)}</span>`).join('')}${suggestedPrincipleId?'<span>Suggested match</span>':''}</div><div class="gmOrganisedPracticeActions"><button type="button" data-edit-practice="${escapeText(practice.id)}">Edit</button>${showAttach&&suggestedPrincipleId?`<button type="button" class="primary" data-attach-principle="${escapeText(suggestedPrincipleId)}" data-practice="${escapeText(practice.id)}">Attach principle</button>`:''}</div></article>`;
}

function matchesArchitectureSearch(practice,query='') {
  if (!query) return true;
  const text = [practice.id,practice.name,practice.theme,practice.stage,practice.desc,practice.cp,purposeLabel(practice),...normalisePrincipleIds(practice.gameModelPrinciples).map(id=>principleById(id)?.message)].filter(Boolean).join(' ').toLowerCase();
  return text.includes(query.toLowerCase());
}

function principleBrowserMarkup(practices,query) {
  return GAME_MODEL_PRINCIPLES.map(principle=>{
    const tagged = practices.filter(practice=>normalisePrincipleIds(practice.gameModelPrinciples).includes(principle.id)).filter(practice=>matchesArchitectureSearch(practice,query));
    const taggedIds = new Set(tagged.map(item=>item.id));
    const suggested = practices.filter(practice=>!normalisePrincipleIds(practice.gameModelPrinciples).length && !taggedIds.has(practice.id) && suggestedPrinciplesForPractice(practice,2).includes(principle.id)).filter(practice=>matchesArchitectureSearch(practice,query)).slice(0,6);
    return `<section class="gmArchitectureGroup"><div class="gmArchitectureGroupHead"><h3>${principle.number}. ${escapeText(principle.message)}</h3><span>${tagged.length} tagged${suggested.length?` · ${suggested.length} suggestions`:''}</span></div>${tagged.length?`<div class="gmPracticeOrganisedGrid">${tagged.map(practice=>practiceCard(practice)).join('')}</div>`:'<div class="small">No practices explicitly tagged yet.</div>'}${suggested.length?`<div class="small" style="margin:7px 0 5px">Suggested from your existing practice detail — attach only when the picture is genuinely present.</div><div class="gmPracticeOrganisedGrid">${suggested.map(practice=>practiceCard(practice,{suggestedPrincipleId:principle.id,showAttach:true})).join('')}</div>`:''}</section>`;
  }).join('');
}

function purposeBrowserMarkup(practices,query) {
  return PRACTICE_PURPOSES.map(purpose=>{
    const rows = practices.filter(practice=>inferPracticePurpose(practice)===purpose.id).filter(practice=>matchesArchitectureSearch(practice,query));
    if (!rows.length) return '';
    return `<section class="gmArchitectureGroup"><div class="gmArchitectureGroupHead"><h3>${escapeText(purpose.label)}</h3><span>${rows.length} practices</span></div><div class="small" style="margin-bottom:6px">${escapeText(purpose.description)}</div><div class="gmPracticeOrganisedGrid">${rows.map(practice=>practiceCard(practice)).join('')}</div></section>`;
  }).join('');
}

function needsOrganisationMarkup(practices,query) {
  const rows = practices.filter(practice=>!practice.practicePurpose && !normalisePrincipleIds(practice.gameModelPrinciples).length).filter(practice=>matchesArchitectureSearch(practice,query));
  return `<section class="gmArchitectureGroup"><div class="gmArchitectureGroupHead"><h3>Needs intentional tagging</h3><span>${rows.length} practices</span></div><div class="small" style="margin-bottom:7px">These are legacy practices. Their purpose can be inferred for browsing, but they have not yet been deliberately assigned a purpose or game-model principle by you.</div>${rows.length?`<div class="gmPracticeOrganisedGrid">${rows.map(practice=>practiceCard(practice)).join('')}</div>`:'<div class="small">Everything has been intentionally organised.</div>'}</section>`;
}

function renderPracticeArchitectureBrowser() {
  const results = document.getElementById('practiceArchitectureResults');
  if (!results) return;
  const practices = appDb()?.practices || [];
  const query = document.getElementById('practiceArchitectureSearch')?.value.trim() || '';
  if (activeLibraryView==='purpose') results.innerHTML = purposeBrowserMarkup(practices,query);
  else if (activeLibraryView==='needs') results.innerHTML = needsOrganisationMarkup(practices,query);
  else results.innerHTML = principleBrowserMarkup(practices,query);
  document.querySelectorAll('.gmArchitectureTabs button').forEach(button=>button.classList.toggle('on',button.dataset.architectureView===activeLibraryView));
}

async function attachPrincipleToPractice(practiceId,principleId) {
  const practice = appDb()?.practices?.find(item=>String(item.id)===String(practiceId));
  if (!practice || !principleById(principleId)) return;
  practice.gameModelPrinciples = normalisePrincipleIds([...(practice.gameModelPrinciples || []),principleId]);
  try { if (typeof store === 'function') await store(); else if (typeof window.store === 'function') await window.store(); } catch (_) {}
  renderPracticeArchitectureBrowser();
}

function ensurePracticeArchitectureBrowser() {
  const library = document.getElementById('library');
  if (!library || document.getElementById(LIBRARY_PANEL_ID)) return;
  const existingChildren = [...library.children];
  const panel = document.createElement('section');
  panel.id = LIBRARY_PANEL_ID;
  panel.className = 'card';
  panel.innerHTML = `<div class="gmArchitectureHero"><div><h2>Practice Library · Purpose First</h2><p><b>Principles are now the main football organisation.</b> Practice purpose tells you what the exercise is doing; Theme is kept only as secondary game context. A practice can belong to more than one principle without being trapped inside one old theme folder.</p></div><span class="pill">Game-model architecture</span></div><div class="gmArchitectureTabs"><button type="button" data-architecture-view="principles" class="on">By Principle</button><button type="button" data-architecture-view="purpose">By Purpose</button><button type="button" data-architecture-view="needs">Needs Tagging</button></div><div class="gmArchitectureSearch"><input id="practiceArchitectureSearch" placeholder="Search practices, principles, purposes or old context..."></div><div id="practiceArchitectureResults"></div>`;
  const legacy = document.createElement('details');
  legacy.id = LEGACY_LIBRARY_ID;
  legacy.innerHTML = '<summary>Open legacy Theme / Stage browser</summary>';
  existingChildren.forEach(child=>legacy.appendChild(child));
  library.appendChild(panel);
  library.appendChild(legacy);
  panel.addEventListener('click',event=>{
    const view = event.target.closest?.('[data-architecture-view]');
    if (view) { activeLibraryView=view.dataset.architectureView; renderPracticeArchitectureBrowser(); return; }
    const edit = event.target.closest?.('[data-edit-practice]');
    if (edit) { try { window.editPractice?.(edit.dataset.editPractice); } catch (_) {} return; }
    const attach = event.target.closest?.('[data-attach-principle]');
    if (attach) attachPrincipleToPractice(attach.dataset.practice,attach.dataset.attachPrinciple);
  });
  document.getElementById('practiceArchitectureSearch')?.addEventListener('input',renderPracticeArchitectureBrowser);
  renderPracticeArchitectureBrowser();
}

function reviewSelect(id,value='') {
  return `<select id="${id}"><option value="">Rate 1–10</option>${Array.from({length:10},(_,i)=>i+1).map(n=>`<option value="${n}"${String(value)===String(n)?' selected':''}>${n}/10</option>`).join('')}</select>`;
}

function rewriteLegacyReviewLabels() {
  const overlay = document.getElementById('postSessionReviewOverlay');
  const firstCard = overlay?.querySelector('.reviewGrid>.reviewCard:not(.gmGameModelReviewCard)');
  if (!firstCard) return;
  const heading = firstCard.querySelector('h2');
  if (heading) heading.textContent = 'Overall coaching reflection';
  const objectiveChoice = firstCard.querySelector('[data-choice="objectiveOutcome"]');
  const objectiveLabel = objectiveChoice?.previousElementSibling;
  if (objectiveChoice) objectiveChoice.style.display='none';
  if (objectiveLabel?.tagName==='LABEL') objectiveLabel.style.display='none';
  const labels = [...firstCard.querySelectorAll('label')];
  labels.forEach(label=>{
    const next = label.nextElementSibling;
    if (next?.id==='reviewRating') label.textContent='Overall session impact';
    if (next?.id==='reviewWorked') label.textContent='What showed the principle was understood?';
    if (next?.id==='reviewDidnt') label.textContent='Where did the picture break down?';
    if (next?.id==='reviewRepeat') label.textContent='What should we reinforce?';
    if (next?.id==='reviewChange') label.textContent='Next coaching action';
  });
  const worked = document.getElementById('reviewWorked'); if(worked) worked.placeholder='What did players do or say that showed genuine understanding?';
  const didnt = document.getElementById('reviewDidnt'); if(didnt) didnt.placeholder='Where did recognition, decision-making or execution break down?';
  const repeat = document.getElementById('reviewRepeat'); if(repeat) repeat.placeholder='Which picture, cue, question or practice design is worth repeating?';
  const change = document.getElementById('reviewChange'); if(change) change.placeholder='Revisit, progress, adapt the practice, or raise the execution demand?';
}

function currentGameModelReviewPayload() {
  const value = id => document.getElementById(id)?.value || '';
  return normaliseGameModelReview({
    primaryPrincipleId:currentReviewSession?.gameModelPlan?.primaryPrincipleId,
    supportingPrincipleId:currentReviewSession?.gameModelPlan?.supportingPrincipleId,
    understanding:value('gmReviewUnderstanding'), recognition:value('gmReviewRecognition'), transfer:value('gmReviewTransfer'), execution:value('gmReviewExecution'),
    cueHelp:value('gmReviewCueHelp'), nextAction:value('gmReviewNextAction'), evidence:value('gmReviewEvidence')
  }, currentReviewSession || {});
}

function injectGameModelReview(session,index=-1) {
  currentReviewSession = session || null;
  currentReviewIndex = Number.isInteger(index) ? index : -1;
  const overlay = document.getElementById('postSessionReviewOverlay');
  const grid = overlay?.querySelector('.reviewGrid');
  if (!grid || !session) return;
  document.getElementById(REVIEW_CARD_ID)?.remove();
  const plan = session.gameModelPlan || {};
  const primary = principleById(plan.primaryPrincipleId);
  const supporting = principleById(plan.supportingPrincipleId);
  const previous = normaliseGameModelReview(session.review?.gameModel || {},session);
  const card = document.createElement('section');
  card.id = REVIEW_CARD_ID;
  card.className = 'reviewCard gmGameModelReviewCard';
  card.innerHTML = `<h2>Did the principle actually land?</h2><div class="gmReviewWhyHint">Review the learning before the drill. Could players explain <b>why</b>, recognise the picture, solve it without constant prompting and execute it successfully?</div><div class="gmReviewPrincipleStrip"><div><b>Primary principle</b><span>${escapeText(primary?.message || 'No primary principle saved')}</span></div><div><b>Session problem → success</b><span>${escapeText(plan.playerProblem || 'No player problem saved')}${plan.successLooksLike?` → ${escapeText(plan.successLooksLike)}`:''}</span></div></div><div class="gmReviewScoreGrid"><div><label>UNDERSTANDING · can they explain why?</label>${reviewSelect('gmReviewUnderstanding',previous.understanding)}</div><div><label>RECOGNITION · did they see the picture?</label>${reviewSelect('gmReviewRecognition',previous.recognition)}</div><div><label>TRANSFER · did it appear without prompting?</label>${reviewSelect('gmReviewTransfer',previous.transfer)}</div><div><label>EXECUTION · how well did they produce it?</label>${reviewSelect('gmReviewExecution',previous.execution)}</div></div><div class="gmReviewEvidenceGrid"><div><label for="gmReviewEvidence">EVIDENCE · WHAT DID PLAYERS ACTUALLY DO / SAY?</label><textarea id="gmReviewEvidence" placeholder="What convinced you they understood it? What still needed coaching?">${escapeText(previous.evidence)}</textarea></div><div><label for="gmReviewCueHelp">DID THE CUE HELP?</label><select id="gmReviewCueHelp"><option value="">Choose...</option>${['Yes','Partly','No'].map(v=>`<option${previous.cueHelp===v?' selected':''}>${v}</option>`).join('')}</select></div><div><label for="gmReviewNextAction">NEXT PRINCIPLE ACTION</label><select id="gmReviewNextAction"><option value="">Choose...</option>${['Embed','Progress','Revisit','Adapt'].map(v=>`<option${previous.nextAction===v?' selected':''}>${v}</option>`).join('')}</select></div></div>${supporting?`<div class="small" style="margin-top:7px">Supporting principle: <b>${escapeText(supporting.message)}</b></div>`:''}`;
  grid.prepend(card);
  rewriteLegacyReviewLabels();
  document.getElementById(REVIEW_HIDE_ID)?.remove();
  const meta = document.getElementById('reviewMeta');
  if (meta) meta.textContent = `${session.date || ''}${primary?` · ${primary.message}`:''}${plan.playerProblem?` · Problem: ${plan.playerProblem}`:''}`;
}

async function mergeGameModelReview(payload) {
  const session = currentReviewSession;
  if (!session) return;
  session.review = { ...(session.review || {}), gameModel:payload };
  const data = appDb();
  const index = currentReviewIndex >= 0 ? currentReviewIndex : data?.sessions?.findIndex(item=>item===session || (item.id && session.id && item.id===session.id));
  if (index >= 0 && data?.sessions?.[index]) data.sessions[index] = session;
  try { if (typeof store === 'function') await store(); else if (typeof window.store === 'function') await window.store(); } catch (_) {}
}

function installReviewHooks() {
  let openOriginal;
  try { openOriginal = openPostSessionReview; } catch (_) { openOriginal = window.openPostSessionReview; }
  if (typeof openOriginal === 'function' && !openOriginal.__gmUnderstandingReviewV2) {
    const wrapped = function(session,index,...rest) {
      const result = openOriginal.call(this,session,index,...rest);
      setTimeout(()=>injectGameModelReview(session,index),0);
      setTimeout(()=>injectGameModelReview(session,index),80);
      return result;
    };
    wrapped.__gmUnderstandingReviewV2 = true;
    try { openPostSessionReview = wrapped; } catch (_) {}
    window.openPostSessionReview = wrapped;
  }
  document.addEventListener('click',event=>{
    if (!event.target.closest?.('#reviewSaveClose,#reviewSaveDashboard')) return;
    const payload = currentGameModelReviewPayload();
    setTimeout(()=>mergeGameModelReview(payload),80);
    setTimeout(()=>mergeGameModelReview(payload),350);
  },true);
}

function watchLibrary() {
  const library = document.getElementById('library');
  if (!library || typeof MutationObserver === 'undefined' || libraryObserver) return;
  libraryObserver = new MutationObserver(()=>{
    if (!document.getElementById(LIBRARY_PANEL_ID)) ensurePracticeArchitectureBrowser();
  });
  libraryObserver.observe(library,{childList:true,subtree:false});
}

function ensureAll() {
  cleanAdvancedBuilder();
  watchPlannerCleanup();
  ensureEditorPanel();
  installPracticeEditorHooks();
  ensurePracticeArchitectureBrowser();
  watchLibrary();
  installReviewHooks();
}

function install() {
  addStyles();
  ensureAll();
  setTimeout(ensureAll,120);
  setTimeout(ensureAll,500);
  setTimeout(ensureAll,1300);
  document.addEventListener('click',event=>{
    if (event.target.closest?.('[data-tab="planner"],[data-tab="library"],[data-tab="editor"],button[onclick*="showBuildRoute"],button[onclick*="loadSessionToPlanner"]')) setTimeout(ensureAll,0);
  },true);
  window.NickPracticeArchitecture = Object.freeze({ purposes:PRACTICE_PURPOSES, principles:GAME_MODEL_PRINCIPLES, render:renderPracticeArchitectureBrowser });
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
}
