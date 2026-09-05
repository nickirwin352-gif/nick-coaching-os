import { GAME_MODEL_PRINCIPLES, principleById } from './game-model-core.js';
import { GAME_CONTEXTS, PRACTICE_PURPOSES_V3, PRACTICE_FORMATS, inferGameContext, inferPurposeV3, inferFormatV3 } from './game-context-practice-system-v3.js';

export const PRACTICE_FILTER_WORKBENCH_VERSION = 5;
export const PRACTICE_FILTER_PAGE_SIZE = 6;

const WORKBENCH_ID = 'practiceStrictWorkbenchV5';
const FINDER_ID = 'practiceStrictFinderV5';
const STYLE_ID = 'practiceStrictWorkbenchV5Styles';

function valid(items, id='') { return items.some(item=>item.id===String(id||'')) ? String(id) : ''; }
function contextById(id='') { return GAME_CONTEXTS.find(item=>item.id===String(id||'')) || null; }
function purposeById(id='') { return PRACTICE_PURPOSES_V3.find(item=>item.id===String(id||'')) || null; }
function formatById(id='') { return PRACTICE_FORMATS.find(item=>item.id===String(id||'')) || null; }
function appDb() { try { return typeof db !== 'undefined' ? db : window.db; } catch (_) { return window.db; } }
function field(id) { return document.getElementById(id); }
function esc(value) {
  try { if (typeof escapeHtml === 'function') return escapeHtml(String(value ?? '')); } catch (_) {}
  return String(value ?? '').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}

function normalisePrincipleIds(practice={}) {
  if (practice.noGameModelPrinciple === true) return [];
  const ids = [practice.primaryGameModelPrinciple, ...(Array.isArray(practice.gameModelPrinciples)?practice.gameModelPrinciples:[])];
  return [...new Set(ids.map(id=>principleById(id)?.id).filter(Boolean))];
}

export function strictPracticeArchitecture(practice={}) {
  return {
    context:valid(GAME_CONTEXTS,practice.gameContext) || inferGameContext(practice) || '',
    purpose:valid(PRACTICE_PURPOSES_V3,practice.practicePurpose) || inferPurposeV3(practice) || '',
    format:valid(PRACTICE_FORMATS,practice.practiceFormat) || inferFormatV3(practice) || '',
    principles:normalisePrincipleIds(practice)
  };
}

export function createStrictFilterState(seed={}) {
  return {
    contexts:new Set(Array.isArray(seed.contexts)?seed.contexts:[]),
    principles:new Set(Array.isArray(seed.principles)?seed.principles:[]),
    purposes:new Set(Array.isArray(seed.purposes)?seed.purposes:[]),
    formats:new Set(Array.isArray(seed.formats)?seed.formats:[]),
    search:String(seed.search||''),
    reviewOnly:seed.reviewOnly===true
  };
}

export function matchesStrictPracticeFilters(practice={}, filters=createStrictFilterState()) {
  const architecture = strictPracticeArchitecture(practice);
  if (filters.contexts?.size && !filters.contexts.has(architecture.context)) return false;
  if (filters.principles?.size && ![...filters.principles].some(id=>architecture.principles.includes(id))) return false;
  if (filters.purposes?.size && !filters.purposes.has(architecture.purpose)) return false;
  if (filters.formats?.size && !filters.formats.has(architecture.format)) return false;
  if (filters.reviewOnly && practice.organisationNeedsReview !== true) return false;
  const query = String(filters.search||'').trim().toLowerCase();
  if (query) {
    const text = [practice.id,practice.name,practice.theme,practice.stage,practice.desc,practice.description,
      contextById(architecture.context)?.label,purposeById(architecture.purpose)?.label,formatById(architecture.format)?.label,
      ...architecture.principles.map(id=>principleById(id)?.message)
    ].filter(Boolean).join(' ').toLowerCase();
    if (!text.includes(query)) return false;
  }
  return true;
}

export function filterPracticesStrict(practices=[], filters=createStrictFilterState()) {
  return (Array.isArray(practices)?practices:[]).filter(practice=>matchesStrictPracticeFilters(practice,filters));
}

const workbenchFilters = createStrictFilterState();
const finderFilters = createStrictFilterState();
let workbenchPage = 0;
let finderPage = 0;
let finderSessionContext = '';
let finderSessionPrinciple = '';

function addStyles() {
  if (field(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    #practiceMultiFilterLibraryV4,#practiceMultiFilterFinderV4{display:none!important}
    #${WORKBENCH_ID},#${FINDER_ID}{border:1px solid rgba(52,211,153,.28);background:linear-gradient(145deg,rgba(52,211,153,.045),rgba(56,189,248,.025));border-radius:16px;padding:14px;margin:0 0 14px}
    .pfV5Head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}.pfV5Head h2,.pfV5Head h3{margin:0}.pfV5Head p{margin:4px 0 0;color:var(--text-dim);font-size:10.5px;line-height:1.45;max-width:780px}.pfV5Logic{font-size:9px;font-weight:900;color:#a7f3d0;border:1px solid rgba(52,211,153,.28);border-radius:999px;padding:5px 8px;white-space:nowrap}
    .pfV5Row{margin-top:10px}.pfV5RowTitle{display:flex;justify-content:space-between;gap:8px;align-items:end;margin-bottom:5px}.pfV5RowTitle b{font-size:10.5px}.pfV5RowTitle span{font-size:8.7px;color:var(--text-faint)}.pfV5Chips{display:flex;gap:5px;flex-wrap:wrap}.pfV5Chip{padding:6px 8px;font-size:9px;border-radius:999px}.pfV5Chip.on{background:var(--turf);border-color:var(--turf);color:#04160f}.pfV5Chip.sessionSeed{box-shadow:0 0 0 2px rgba(251,191,36,.42)}
    .pfV5Controls{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:7px;margin-top:11px}.pfV5Controls input{margin:0}.pfV5Selected{display:flex;gap:5px;flex-wrap:wrap;margin-top:8px;min-height:22px}.pfV5Selected span{font-size:8.7px;padding:4px 6px;border-radius:999px;background:rgba(56,189,248,.08);border:1px solid rgba(56,189,248,.22);color:#bae6fd}.pfV5Stats{display:flex;justify-content:space-between;gap:8px;align-items:center;margin-top:8px;font-size:9.5px;color:var(--text-dim)}
    .pfV5Grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:9px}.pfV5Card{border:1px solid var(--border-soft);border-radius:12px;padding:8px;background:var(--surface-2)}.pfV5Pitch .pitchMini{width:100%!important;max-width:none!important;height:150px!important;margin:0 0 7px!important}.pfV5Card h4{margin:0 0 5px;font-size:10.5px}.pfV5Tags{display:flex;gap:4px;flex-wrap:wrap;margin-top:5px}.pfV5Tags span{font-size:8px;padding:3px 5px;border-radius:999px;border:1px solid var(--border);color:var(--text-dim)}.pfV5Tags .context{color:#a7f3d0;border-color:rgba(52,211,153,.25)}.pfV5Tags .principle{color:#bae6fd;border-color:rgba(56,189,248,.25)}.pfV5CardActions{display:flex;gap:5px;flex-wrap:wrap;margin-top:7px}.pfV5CardActions button{padding:5px 7px;font-size:9px}.pfV5Pager{display:flex;align-items:center;justify-content:center;gap:8px;margin-top:10px}.pfV5Pager span{font-size:9px;color:var(--text-dim)}.pfV5Empty{margin-top:10px;padding:12px;border:1px dashed var(--border);border-radius:10px;color:var(--text-dim);font-size:10px;line-height:1.45}
    @media(max-width:900px){.pfV5Grid{grid-template-columns:repeat(2,minmax(0,1fr))}.pfV5Pitch .pitchMini{height:165px!important}}
    @media(max-width:620px){.pfV5Head{display:block}.pfV5Logic{display:inline-flex;margin-top:7px}.pfV5Controls{grid-template-columns:1fr 1fr}.pfV5Controls input{grid-column:1/-1}.pfV5Grid{grid-template-columns:1fr}.pfV5Pitch .pitchMini{height:205px!important}}
  `;
  document.head.appendChild(style);
}

function itemLabel(kind,id) {
  if (kind==='contexts') return contextById(id)?.label || id;
  if (kind==='principles') return principleById(id)?.message || id;
  if (kind==='purposes') return purposeById(id)?.label || id;
  if (kind==='formats') return formatById(id)?.label || id;
  return id;
}

function chipMarkup(group,kind,items,filters,labelFn=item=>item.label||item.message) {
  return `<div class="pfV5Chips">${items.map(item=>`<button type="button" class="pfV5Chip ${filters[kind].has(item.id)?'on':''}" data-pfv5-group="${group}" data-pfv5-kind="${kind}" data-pfv5-value="${esc(item.id)}">${esc(labelFn(item))}</button>`).join('')}</div>`;
}

function selectedMarkup(filters) {
  const values=[];
  ['contexts','principles','purposes','formats'].forEach(kind=>filters[kind].forEach(id=>values.push(itemLabel(kind,id))));
  if (filters.reviewOnly) values.push('Needs review');
  return values.length ? values.map(value=>`<span>${esc(value)}</span>`).join('') : '<span>No filters · showing all practices</span>';
}

function filterRowsMarkup(group,filters) {
  return `
    <div class="pfV5Row"><div class="pfV5RowTitle"><b>1 · Game Context</b><span>OR within this row</span></div>${chipMarkup(group,'contexts',GAME_CONTEXTS,filters)}</div>
    <div class="pfV5Row"><div class="pfV5RowTitle"><b>2 · Principle</b><span>Must also match selected context</span></div>${chipMarkup(group,'principles',GAME_MODEL_PRINCIPLES,filters,item=>item.message)}</div>
    <div class="pfV5Row"><div class="pfV5RowTitle"><b>3 · Purpose</b><span>Must also match rows above</span></div>${chipMarkup(group,'purposes',PRACTICE_PURPOSES_V3,filters)}</div>
    <div class="pfV5Row"><div class="pfV5RowTitle"><b>4 · Format</b><span>Must also match rows above</span></div>${chipMarkup(group,'formats',PRACTICE_FORMATS,filters)}</div>`;
}

function practiceCardMarkup(practice,mode,index) {
  const a = strictPracticeArchitecture(practice);
  const pitchId = `pfv5-${mode}-${index}-${String(practice.id||'').replace(/[^a-z0-9_-]/gi,'-')}`;
  const principleTags = a.principles.length ? a.principles.map(id=>`<span class="principle">${esc(principleById(id)?.message||id)}</span>`).join('') : '<span>No principle</span>';
  const inSession = (()=>{ try { return Array.isArray(plannerDrills) && plannerDrills.includes(practice.id); } catch (_) { return false; } })();
  return `<article class="pfV5Card" data-pfv5-practice="${esc(practice.id)}"><div class="pfV5Pitch" id="${pitchId}"></div><h4>${esc(practice.id)} · ${esc(practice.name||'Practice')}</h4><div class="pfV5Tags"><span class="context">${esc(contextById(a.context)?.label||'No context')}</span>${principleTags}<span>${esc(purposeById(a.purpose)?.label||'No purpose')}</span><span>${esc(formatById(a.format)?.label||'No format')}</span></div><div class="pfV5CardActions">${mode==='finder'?`<button type="button" data-pfv5-session="${esc(practice.id)}">${inSession?'Remove from session':'Add to session'}</button>`:`<button type="button" data-pfv5-edit="${esc(practice.id)}">Edit practice</button>`}</div></article>`;
}

function drawCards(practices,mode,page) {
  practices.forEach((practice,index)=>{
    const id = `pfv5-${mode}-${page*PRACTICE_FILTER_PAGE_SIZE+index}-${String(practice.id||'').replace(/[^a-z0-9_-]/gi,'-')}`;
    try { if (typeof drawMini === 'function') drawMini(id,practice.diagram||[],practice.pitchMode||'full'); else window.drawMini?.(id,practice.diagram||[],practice.pitchMode||'full'); } catch (_) {}
  });
}

function renderResults(group,filters) {
  const isFinder = group==='finder';
  const panel = field(isFinder?FINDER_ID:WORKBENCH_ID);
  if (!panel) return;
  const all = filterPracticesStrict(appDb()?.practices||[],filters).sort((a,b)=>String(a.name||'').localeCompare(String(b.name||'')));
  let page = isFinder ? finderPage : workbenchPage;
  const pages = Math.max(1,Math.ceil(all.length/PRACTICE_FILTER_PAGE_SIZE));
  if (page >= pages) page = pages-1;
  if (isFinder) finderPage=page; else workbenchPage=page;
  const visible = all.slice(page*PRACTICE_FILTER_PAGE_SIZE,(page+1)*PRACTICE_FILTER_PAGE_SIZE);
  const selected = panel.querySelector('[data-pfv5-selected]');
  const count = panel.querySelector('[data-pfv5-count]');
  const results = panel.querySelector('[data-pfv5-results]');
  if (selected) selected.innerHTML=selectedMarkup(filters);
  if (count) count.textContent=`${all.length} exact ${all.length===1?'match':'matches'}`;
  if (!results) return;
  results.innerHTML = visible.length ? `<div class="pfV5Grid">${visible.map((practice,index)=>practiceCardMarkup(practice,isFinder?'finder':'workbench',page*PRACTICE_FILTER_PAGE_SIZE+index)).join('')}</div>${pages>1?`<div class="pfV5Pager"><button type="button" data-pfv5-page="prev" ${page===0?'disabled':''}>← Previous</button><span>Page ${page+1} of ${pages}</span><button type="button" data-pfv5-page="next" ${page>=pages-1?'disabled':''}>Next →</button></div>`:''}` : '<div class="pfV5Empty"><b>No exact matches.</b><br>This means no saved practice currently satisfies every selected row. Remove one filter or edit the practice tags — the system will not quietly show near-matches.</div>';
  requestAnimationFrame(()=>drawCards(visible,isFinder?'finder':'workbench',page));
}

function resetFinderToSession() {
  finderFilters.contexts.clear(); finderFilters.principles.clear(); finderFilters.purposes.clear(); finderFilters.formats.clear(); finderFilters.search=''; finderFilters.reviewOnly=false;
  finderSessionContext = valid(GAME_CONTEXTS,field('gmGameContext')?.value) || '';
  finderSessionPrinciple = principleById(field('gmPrimaryPrinciple')?.value)?.id || '';
  if (finderSessionContext) finderFilters.contexts.add(finderSessionContext);
  if (finderSessionPrinciple) finderFilters.principles.add(finderSessionPrinciple);
  finderPage=0;
  const search=field('practiceStrictFinderSearchV5'); if(search) search.value='';
}

function markFinderSeeds() {
  const panel=field(FINDER_ID); if(!panel) return;
  panel.querySelectorAll('.pfV5Chip').forEach(chip=>chip.classList.remove('sessionSeed'));
  if (finderSessionContext) panel.querySelector(`[data-pfv5-kind="contexts"][data-pfv5-value="${CSS.escape(finderSessionContext)}"]`)?.classList.add('sessionSeed');
  if (finderSessionPrinciple) panel.querySelector(`[data-pfv5-kind="principles"][data-pfv5-value="${CSS.escape(finderSessionPrinciple)}"]`)?.classList.add('sessionSeed');
}

function refreshChipStates(group,filters) {
  const panel=field(group==='finder'?FINDER_ID:WORKBENCH_ID); if(!panel) return;
  panel.querySelectorAll('[data-pfv5-kind]').forEach(chip=>chip.classList.toggle('on',filters[chip.dataset.pfv5Kind]?.has(chip.dataset.pfv5Value)));
  if (group==='finder') markFinderSeeds();
}

function handlePanelClick(group,filters,event) {
  const chip=event.target.closest?.('[data-pfv5-kind]');
  if (chip && chip.dataset.pfv5Group===group) {
    const set=filters[chip.dataset.pfv5Kind];
    if (set) set.has(chip.dataset.pfv5Value)?set.delete(chip.dataset.pfv5Value):set.add(chip.dataset.pfv5Value);
    if(group==='finder') finderPage=0; else workbenchPage=0;
    refreshChipStates(group,filters); renderResults(group,filters); return;
  }
  const page=event.target.closest?.('[data-pfv5-page]');
  if(page){ const delta=page.dataset.pfv5Page==='next'?1:-1; if(group==='finder')finderPage=Math.max(0,finderPage+delta);else workbenchPage=Math.max(0,workbenchPage+delta); renderResults(group,filters); return; }
  const edit=event.target.closest?.('[data-pfv5-edit]'); if(edit){ window.editPractice?.(edit.dataset.pfv5Edit); return; }
  const session=event.target.closest?.('[data-pfv5-session]'); if(session){ window.togglePracticeInSession?.(session.dataset.pfv5Session); setTimeout(()=>renderResults('finder',finderFilters),40); }
}

function buildWorkbench() {
  const library=field('library'); if(!library || field(WORKBENCH_ID)) return;
  const old=field('practiceMultiFilterLibraryV4') || field('practiceArchitectureBrowserV3');
  const panel=document.createElement('section'); panel.id=WORKBENCH_ID;
  panel.innerHTML=`<div class="pfV5Head"><div><h2>Practice Workbench · Exact Filters</h2><p>If you select <b>Build Out</b>, only Build Out practices can appear. Add a Principle and a practice must match <b>both</b>. Multiple choices inside one row are alternatives; different rows always stack together.</p></div><span class="pfV5Logic">OR within a row · AND between rows</span></div>${filterRowsMarkup('workbench',workbenchFilters)}<div class="pfV5Controls"><input id="practiceStrictWorkbenchSearchV5" placeholder="Search inside the exact matches..."><button type="button" id="practiceStrictWorkbenchReviewV5">Needs review</button><button type="button" id="practiceStrictWorkbenchClearV5">Clear</button></div><div class="pfV5Selected" data-pfv5-selected></div><div class="pfV5Stats"><b data-pfv5-count></b><span>No suggestions leak into filtered results</span></div><div data-pfv5-results></div>`;
  if(old) old.insertAdjacentElement('beforebegin',panel); else library.prepend(panel);
  panel.addEventListener('click',event=>handlePanelClick('workbench',workbenchFilters,event));
  field('practiceStrictWorkbenchSearchV5')?.addEventListener('input',event=>{workbenchFilters.search=event.target.value||'';workbenchPage=0;renderResults('workbench',workbenchFilters);});
  field('practiceStrictWorkbenchReviewV5')?.addEventListener('click',event=>{workbenchFilters.reviewOnly=!workbenchFilters.reviewOnly;event.currentTarget.classList.toggle('on',workbenchFilters.reviewOnly);workbenchPage=0;renderResults('workbench',workbenchFilters);});
  field('practiceStrictWorkbenchClearV5')?.addEventListener('click',()=>{workbenchFilters.contexts.clear();workbenchFilters.principles.clear();workbenchFilters.purposes.clear();workbenchFilters.formats.clear();workbenchFilters.search='';workbenchFilters.reviewOnly=false;field('practiceStrictWorkbenchSearchV5').value='';field('practiceStrictWorkbenchReviewV5')?.classList.remove('on');workbenchPage=0;refreshChipStates('workbench',workbenchFilters);renderResults('workbench',workbenchFilters);});
  renderResults('workbench',workbenchFilters);
}

function buildFinder() {
  const old=field('practiceMultiFilterFinderV4') || field('gameContextPracticeFinder');
  const card=field('visualPicker')?.closest('.card');
  if(!card || field(FINDER_ID)) return;
  const panel=document.createElement('section'); panel.id=FINDER_ID;
  panel.innerHTML=`<div class="pfV5Head"><div><h3>Find Practices · Same Exact Workbench</h3><p>This uses the <b>same filter engine</b> as the Practice Workbench. Your session Context and Primary Principle are selected as the starting point, then you can change them exactly like any other filters.</p></div><span class="pfV5Logic">Exact matches only</span></div>${filterRowsMarkup('finder',finderFilters)}<div class="pfV5Controls"><input id="practiceStrictFinderSearchV5" placeholder="Search inside the exact matches..."><button type="button" id="practiceStrictFinderResetV5">Reset to session</button><span></span></div><div class="pfV5Selected" data-pfv5-selected></div><div class="pfV5Stats"><b data-pfv5-count></b><span>Gold outline = session starting filter</span></div><div data-pfv5-results></div>`;
  if(old) old.insertAdjacentElement('beforebegin',panel); else card.prepend(panel);
  panel.addEventListener('click',event=>handlePanelClick('finder',finderFilters,event));
  field('practiceStrictFinderSearchV5')?.addEventListener('input',event=>{finderFilters.search=event.target.value||'';finderPage=0;renderResults('finder',finderFilters);});
  field('practiceStrictFinderResetV5')?.addEventListener('click',()=>{resetFinderToSession();refreshChipStates('finder',finderFilters);renderResults('finder',finderFilters);});
  resetFinderToSession(); refreshChipStates('finder',finderFilters); renderResults('finder',finderFilters);
  ['gmGameContext','gmPrimaryPrinciple'].forEach(id=>field(id)?.addEventListener('change',()=>{resetFinderToSession();refreshChipStates('finder',finderFilters);renderResults('finder',finderFilters);}));
}

function wrapPracticeSave() {
  let original; try { original=savePractice; } catch (_) { original=window.savePractice; }
  if(typeof original!=='function' || original.__strictFilterV5) return;
  const wrapped=function(...args){const result=original.apply(this,args);setTimeout(()=>{renderResults('workbench',workbenchFilters);renderResults('finder',finderFilters);},120);setTimeout(()=>{renderResults('workbench',workbenchFilters);renderResults('finder',finderFilters);},500);return result;};
  wrapped.__strictFilterV5=true; try{savePractice=wrapped;}catch(_){} window.savePractice=wrapped;
}

function install() {
  addStyles(); buildWorkbench(); buildFinder(); wrapPracticeSave();
  document.addEventListener('click',event=>{if(event.target.closest?.('[data-tab="library"],[data-tab="planner"]'))setTimeout(()=>{buildWorkbench();buildFinder();renderResults('workbench',workbenchFilters);renderResults('finder',finderFilters);},80);},true);
  window.NickPracticeStrictFilters=Object.freeze({version:PRACTICE_FILTER_WORKBENCH_VERSION,architecture:strictPracticeArchitecture,matches:matchesStrictPracticeFilters,filter:filterPracticesStrict,workbenchFilters,finderFilters,resetFinderToSession});
}

if(typeof window!=='undefined' && typeof document!=='undefined'){
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',install,{once:true}); else install();
}
