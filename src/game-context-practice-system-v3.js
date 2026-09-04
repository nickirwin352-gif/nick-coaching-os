import { GAME_MODEL_PRINCIPLES, principleById, scorePracticeForPrinciple, LEARNING_EMPHASES } from './game-model-core.js';

export const GAME_CONTEXTS = Object.freeze([
  Object.freeze({ id:'build-out', label:'Build Out', moment:'with-ball', legacyTheme:'Build Up', description:'Starting attacks and creating the route out from our first line.' }),
  Object.freeze({ id:'progress', label:'Progress', moment:'with-ball', legacyTheme:'Midfield Progression', description:'Moving through or around midfield and breaking into the next line.' }),
  Object.freeze({ id:'create-finish', label:'Create & Finish', moment:'with-ball', legacyTheme:'Chance Creation', description:'Attacking the final third, creating chances and finishing attacks.' }),
  Object.freeze({ id:'press-high', label:'Press High', moment:'without-ball', legacyTheme:'High Press', description:'Defending high up the pitch and trying to regain near their goal.' }),
  Object.freeze({ id:'defend-mid-low', label:'Defend Mid / Low', moment:'without-ball', legacyTheme:'Mid Block', description:'Protecting space when the opponent has established possession.' }),
  Object.freeze({ id:'attack-regain', label:'Attack on Regain', moment:'win-it', legacyTheme:'Attacking Transition', description:'Hurting the opponent before they can recover their defensive shape.' }),
  Object.freeze({ id:'defend-loss', label:'Defend on Loss', moment:'lose-it', legacyTheme:'Defensive Transition', description:'Counterpress when connected; otherwise recover inside and protect danger.' }),
  Object.freeze({ id:'restarts', label:'Restarts', moment:'restart-development', legacyTheme:'Set Plays', description:'Corners, free-kicks, throw-ins and restart-specific work.' }),
  Object.freeze({ id:'player-development', label:'Player / Physical Development', moment:'restart-development', legacyTheme:'Core Passing Activations', description:'Technical, physical or individual work that supports the model without forcing a tactical context.' })
]);

export const PRACTICE_PURPOSES_V3 = Object.freeze([
  Object.freeze({ id:'prepare', label:'Prepare', description:'Get players technically or physically ready and bank useful repetitions.' }),
  Object.freeze({ id:'recognise', label:'Recognise', description:'Make the game-model picture obvious enough that players learn to see it.' }),
  Object.freeze({ id:'execute', label:'Execute', description:'The picture is understood; improve timing, technique, speed and detail.' }),
  Object.freeze({ id:'transfer', label:'Transfer', description:'Remove help and test whether the behaviour appears in game-real football.' })
]);

export const PRACTICE_FORMATS = Object.freeze([
  Object.freeze({ id:'passing-activation', label:'Passing Activation' }),
  Object.freeze({ id:'rondo', label:'Rondo' }),
  Object.freeze({ id:'possession-box', label:'Possession Box / Positional Possession' }),
  Object.freeze({ id:'directional-possession', label:'Directional Possession' }),
  Object.freeze({ id:'skill-practice', label:'Skill Practice' }),
  Object.freeze({ id:'wave', label:'Wave / Repeated Attack' }),
  Object.freeze({ id:'phase-play', label:'Phase of Play' }),
  Object.freeze({ id:'unit-practice', label:'Unit Practice' }),
  Object.freeze({ id:'opposed-tactical', label:'Opposed Tactical Practice' }),
  Object.freeze({ id:'conditioned-game', label:'Conditioned Game' }),
  Object.freeze({ id:'small-sided-game', label:'Small-Sided Game' }),
  Object.freeze({ id:'finishing', label:'Finishing Practice' }),
  Object.freeze({ id:'duel', label:'1v1 / Duel' }),
  Object.freeze({ id:'pattern', label:'Pattern / Rehearsal' }),
  Object.freeze({ id:'physical', label:'Physical' }),
  Object.freeze({ id:'set-play', label:'Set Play' }),
  Object.freeze({ id:'other', label:'Other' })
]);

const STYLE_ID = 'gameContextPracticeSystemV3Styles';
const PRACTICE_EDITOR_ID = 'practiceArchitectureEditorPanelV3';
const PRACTICE_LIBRARY_ID = 'practiceArchitectureBrowserV3';
const SESSION_FINDER_ID = 'gameContextPracticeFinder';
const SESSION_LIBRARY_TOOLBAR_ID = 'sessionLibraryGameModelToolbar';
const SESSION_LIBRARY_RESULTS_ID = 'sessionLibraryGameModelResults';
let practiceLibraryView = 'principle';
let finderPurpose = '';
let finderFormat = '';
let sessionLibraryObserver = null;
let currentEditorPracticeId = '';

function appDb() {
  try { return typeof db !== 'undefined' ? db : window.db; }
  catch (_) { return window.db; }
}

function escapeText(value) {
  try { if (typeof escapeHtml === 'function') return escapeHtml(String(value ?? '')); } catch (_) {}
  return String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[ch]));
}

function field(id) { return document.getElementById(id); }
function contextById(id='') { return GAME_CONTEXTS.find(item => item.id === String(id || '')) || null; }
function purposeById(id='') { return PRACTICE_PURPOSES_V3.find(item => item.id === String(id || '')) || null; }
function formatById(id='') { return PRACTICE_FORMATS.find(item => item.id === String(id || '')) || null; }

export function inferGameContext(value = {}) {
  const explicit = contextById(value?.gameContext || value?.gameModelPlan?.gameContext);
  if (explicit) return explicit.id;
  const theme = String(value?.theme || '').toLowerCase();
  if (!theme) return '';
  if (theme.includes('build')) return 'build-out';
  if (theme.includes('midfield progression')) return 'progress';
  if (theme.includes('chance') || theme.includes('wide overload') || theme.includes('finishing')) return 'create-finish';
  if (theme.includes('high press')) return 'press-high';
  if (theme.includes('mid block')) return 'defend-mid-low';
  if (theme.includes('attacking transition')) return 'attack-regain';
  if (theme.includes('counter press') || theme.includes('defensive transition')) return 'defend-loss';
  if (theme.includes('set play')) return 'restarts';
  if (theme.includes('fitness') || theme.includes('core passing') || theme.includes('1v1') || theme.includes('duel')) return 'player-development';
  return '';
}

function normalisePrinciples(practice = {}) {
  const ids = [practice.primaryGameModelPrinciple, ...(Array.isArray(practice.gameModelPrinciples) ? practice.gameModelPrinciples : [])]
    .map(id => principleById(id)?.id)
    .filter(Boolean);
  return [...new Set(ids)];
}

export function inferPurposeV3(practice = {}) {
  if (purposeById(practice.practicePurpose)) return practice.practicePurpose;
  const legacy = String(practice.practicePurpose || '');
  if (legacy === 'technical-repetition' || legacy === 'physical-development') return 'prepare';
  if (legacy === 'picture-recognition' || legacy === 'scenario-wave' || legacy === 'restart-setplay') return 'recognise';
  if (legacy === 'game-transfer') return 'transfer';
  const stage = String(practice.stage || '').toLowerCase();
  const theme = String(practice.theme || '').toLowerCase();
  if (stage.includes('activation') || theme.includes('core passing')) return 'prepare';
  if (stage.includes('conditioned') || stage === 'game') return 'transfer';
  if (stage.includes('tactical')) return 'recognise';
  if (stage.includes('skill')) return 'execute';
  return 'execute';
}

export function inferFormatV3(practice = {}) {
  if (formatById(practice.practiceFormat)) return practice.practiceFormat;
  const text = [practice.name, practice.desc, practice.description, practice.stage, practice.theme, practice.cp, practice.condRules].filter(Boolean).join(' ').toLowerCase();
  if (/corner|free.?kick|throw.?in|set play|restart/.test(text)) return 'set-play';
  if (/fitness|conditioning|aerobic|anaerobic|speed endurance|repeat sprint/.test(text)) return 'physical';
  if (/wave|repeated attack|transition wave/.test(text)) return 'wave';
  if (/phase of play|phase play/.test(text)) return 'phase-play';
  if (/rondo/.test(text)) return 'rondo';
  if (/4v4\+2|5v5\+2|3v3\+|possession box|positional possession|keep ball|possession/.test(text) && !/goal|direction/.test(text)) return 'possession-box';
  if (/directional possession|target player|end zone|play through to|directional/.test(text)) return 'directional-possession';
  if (/small sided|small-sided|\bssg\b/.test(text)) return 'small-sided-game';
  if (/conditioned game/.test(text) || String(practice.stage || '').toLowerCase().includes('conditioned')) return 'conditioned-game';
  if (/finishing|finish|shoot|strike/.test(text)) return 'finishing';
  if (/1v1|duel/.test(text)) return 'duel';
  if (/pattern|rehearsal|rotation/.test(text)) return 'pattern';
  if (/unit work|unit practice|back four|front three|midfield unit/.test(text)) return 'unit-practice';
  if (/passing activation|passing circuit|passing practice/.test(text) || String(practice.stage || '').toLowerCase().includes('activation')) return 'passing-activation';
  if (String(practice.stage || '').toLowerCase().includes('tactical')) return 'opposed-tactical';
  if (String(practice.stage || '').toLowerCase().includes('skill')) return 'skill-practice';
  return 'other';
}

export function practiceArchitecture(practice = {}) {
  return {
    gameContext: inferGameContext(practice),
    purpose: inferPurposeV3(practice),
    format: inferFormatV3(practice),
    primaryPrincipleId: principleById(practice.primaryGameModelPrinciple)?.id || normalisePrinciples(practice)[0] || '',
    principleIds: normalisePrinciples(practice)
  };
}

function addStyles() {
  if (field(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    #practiceArchitectureEditorPanel{display:none!important}
    #practiceArchitectureBrowser{display:none!important}
    .gmV3LegacyThemeHidden{display:none!important}
    #${PRACTICE_EDITOR_ID}{margin:0 0 12px;padding:12px;border:1px solid rgba(52,211,153,.3);border-radius:13px;background:linear-gradient(145deg,rgba(52,211,153,.055),rgba(56,189,248,.025))}
    #${PRACTICE_EDITOR_ID} h3{margin:0 0 3px;font-size:14px}#${PRACTICE_EDITOR_ID}>p{margin:0 0 9px;color:var(--text-dim);font-size:10.5px;line-height:1.4}
    .gmV3MetaGrid{display:grid;grid-template-columns:1fr 1fr;gap:7px}.gmV3MetaGrid .full{grid-column:1/-1}.gmV3MetaGrid label{margin-top:4px}
    .gmV3SupportGrid{display:grid;grid-template-columns:1fr 1fr;gap:5px;margin-top:6px}.gmV3SupportTag{display:flex;gap:7px;align-items:flex-start;padding:7px;border:1px solid var(--border-soft);border-radius:9px;background:rgba(4,13,22,.35)}.gmV3SupportTag input{width:auto;margin-top:2px}.gmV3SupportTag b{font-size:10px;line-height:1.25}.gmV3EditorHint{margin-top:7px;font-size:9.5px;color:var(--text-dim);line-height:1.4}
    #${PRACTICE_LIBRARY_ID}{margin-bottom:14px}.gmV3Hero{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}.gmV3Hero h2{margin:0}.gmV3Hero p{margin:4px 0 0;max-width:820px;color:var(--text-dim);font-size:11px;line-height:1.45}.gmV3Tabs{display:flex;gap:6px;flex-wrap:wrap;margin:11px 0 8px}.gmV3Tabs button.on{background:var(--turf);border-color:var(--turf);color:#04160f}.gmV3Search{margin-bottom:10px}.gmV3Group{margin:11px 0 15px}.gmV3GroupHead{display:flex;justify-content:space-between;gap:8px;align-items:flex-end;margin-bottom:6px}.gmV3GroupHead h3{margin:0;font-size:14px}.gmV3GroupHead span{font-size:9.5px;color:var(--text-faint)}
    .gmV3PracticeGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.gmV3PracticeCard{padding:9px;border:1px solid var(--border-soft);border-radius:11px;background:var(--surface-2)}.gmV3PracticeCard h4{margin:0 0 4px;font-size:11px}.gmV3PracticeMeta{font-size:9px;color:var(--text-faint);line-height:1.45}.gmV3PracticeTags{display:flex;gap:4px;flex-wrap:wrap;margin-top:6px}.gmV3PracticeTags span{font-size:8.5px;padding:3px 5px;border-radius:999px;border:1px solid rgba(56,189,248,.22);color:#bae6fd}.gmV3PracticeTags span.primary{border-color:rgba(52,211,153,.35);color:#a7f3d0}.gmV3PracticeActions{display:flex;gap:5px;margin-top:7px}.gmV3PracticeActions button{padding:5px 7px;font-size:9px}
    #${SESSION_FINDER_ID}{margin:0 0 12px;padding:12px;border:1px solid rgba(56,189,248,.28);border-radius:13px;background:rgba(56,189,248,.035)}.gmV3FinderHead{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}.gmV3FinderHead h3{margin:0;font-size:14px}.gmV3FinderHead p{margin:3px 0 0;font-size:10px;color:var(--text-dim);line-height:1.4}.gmV3FinderControls{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:9px}.gmV3FinderPurposes{display:flex;gap:5px;flex-wrap:wrap;margin-top:8px}.gmV3FinderPurposes button{padding:5px 7px;font-size:9px}.gmV3FinderPurposes button.on{background:var(--turf);color:#04160f;border-color:var(--turf)}.gmV3FinderGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;margin-top:9px}.gmV3FinderCard{border:1px solid var(--border-soft);border-radius:10px;padding:8px;background:var(--surface-2);display:grid;grid-template-columns:100px 1fr;gap:8px}.gmV3FinderPitch{min-height:78px}.gmV3FinderCard h4{font-size:10.5px;margin:0 0 3px}.gmV3FinderCard .small{font-size:8.8px}.gmV3FinderCard button{margin-top:6px;padding:5px 7px;font-size:9px}.gmV3LegacyPicker{margin-top:10px;border:1px solid var(--border-soft);border-radius:10px}.gmV3LegacyPicker>summary{padding:8px 10px;cursor:pointer;font-size:10px;color:var(--text-dim);font-weight:800}.gmV3LegacyPicker>.gmV3LegacyPickerBody{padding:0 8px 8px}
    #sessionsLibraryView .sessionLibraryToolbar,#sessionsLibraryView #sessionLibraryResults,#sessionsLibraryView .sessionLibrarySummary{display:none!important}#${SESSION_LIBRARY_TOOLBAR_ID}{display:grid;grid-template-columns:1.2fr .65fr .8fr .9fr;gap:8px;margin:14px 0}#${SESSION_LIBRARY_RESULTS_ID}{margin-top:9px}.gmV3SessionGrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:10px}.gmV3SessionCard{padding:13px;border:1px solid var(--border-soft);border-radius:14px;background:linear-gradient(180deg,var(--surface),var(--surface-2))}.gmV3SessionCard h3{margin:4px 0 7px;font-size:16px}.gmV3SessionMeta{display:flex;gap:5px;flex-wrap:wrap}.gmV3SessionProblem{margin-top:8px;font-size:11px;line-height:1.45;color:var(--text-dim)}.gmV3SessionProblem b{color:var(--text)}.gmV3SessionActions{display:flex;gap:5px;flex-wrap:wrap;margin-top:10px}.gmV3SessionActions button{flex:1 1 110px}
    .gmV3ContextReview{margin-top:6px;padding:7px 9px;border:1px solid rgba(56,189,248,.22);border-radius:9px;background:rgba(56,189,248,.04);font-size:10px;color:#bae6fd}
    .gmV3ArchitectureExplainer{margin:12px 0;padding:12px;border:1px solid rgba(52,211,153,.22);border-radius:13px;background:rgba(52,211,153,.035)}.gmV3ArchitectureSteps{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:5px;margin-top:8px}.gmV3ArchitectureStep{padding:7px;border:1px solid var(--border-soft);border-radius:9px;background:rgba(4,13,22,.34)}.gmV3ArchitectureStep b{display:block;font-size:9px;color:#93c5fd;text-transform:uppercase}.gmV3ArchitectureStep span{display:block;margin-top:2px;font-size:9px;color:var(--text-dim);line-height:1.35}
    @media(max-width:850px){.gmV3MetaGrid,.gmV3SupportGrid,.gmV3PracticeGrid,.gmV3FinderGrid,#${SESSION_LIBRARY_TOOLBAR_ID},.gmV3ArchitectureSteps{grid-template-columns:1fr}.gmV3FinderCard{grid-template-columns:84px 1fr}.gmV3Hero,.gmV3FinderHead{display:block}}
  `;
  document.head.appendChild(style);
}

function contextOptions(selected='') {
  return `<option value="">Choose game context</option>${GAME_CONTEXTS.map(item=>`<option value="${item.id}"${item.id===selected?' selected':''}>${escapeText(item.label)}</option>`).join('')}`;
}
function purposeOptions(selected='') {
  return PRACTICE_PURPOSES_V3.map(item=>`<option value="${item.id}"${item.id===selected?' selected':''}>${escapeText(item.label)}</option>`).join('');
}
function formatOptions(selected='') {
  return PRACTICE_FORMATS.map(item=>`<option value="${item.id}"${item.id===selected?' selected':''}>${escapeText(item.label)}</option>`).join('');
}
function principleOptions(selected='', empty='No primary principle') {
  return `<option value="">${escapeText(empty)}</option>${GAME_MODEL_PRINCIPLES.map(item=>`<option value="${item.id}"${item.id===selected?' selected':''}>${escapeText(item.message)}</option>`).join('')}`;
}

function hideLegacyThemeField() {
  const select = field('sTheme');
  if (!select) return;
  select.classList.add('gmV3LegacyThemeHidden');
  const label = select.previousElementSibling;
  if (label?.tagName === 'LABEL') label.classList.add('gmV3LegacyThemeHidden');
}

function ensurePlannerContextField() {
  const panel = field('gameModelImplementationPlan');
  const old = field('gmGameMoment');
  if (!panel || field('gmGameContext')) return;
  const oldWrap = old?.closest('div');
  if (oldWrap) oldWrap.style.display = 'none';
  const wrap = document.createElement('div');
  wrap.innerHTML = `<label for="gmGameContext">GAME CONTEXT · WHERE IS THE PROBLEM?</label><select id="gmGameContext">${contextOptions()}</select>`;
  const emphasisWrap = field('gmLearningEmphasis')?.closest('div');
  if (emphasisWrap) emphasisWrap.insertAdjacentElement('beforebegin', wrap);
  else panel.querySelector('.gmPlanGrid')?.prepend(wrap);
  field('gmGameContext')?.addEventListener('change', () => {
    syncLegacyThemeFromContext();
    renderSessionPracticeFinder();
  });
  const headText = panel.querySelector('.gmPlanHead span');
  if (headText) headText.textContent = 'Start with where the problem is happening, define the player problem, then choose the principle and learning emphasis.';
}

function currentContextId() { return contextById(field('gmGameContext')?.value)?.id || ''; }
function currentPrimaryPrincipleId() { return principleById(field('gmPrimaryPrinciple')?.value)?.id || ''; }

function syncLegacyThemeFromContext() {
  const context = contextById(currentContextId());
  const legacy = field('sTheme');
  if (!context || !legacy) return;
  const options = [...legacy.options].map(option=>option.value);
  if (options.includes(context.legacyTheme)) {
    legacy.value = context.legacyTheme;
    try { legacy.dispatchEvent(new Event('change',{bubbles:true})); } catch (_) {}
  }
}

function sessionContextFromSession(session={}) {
  return contextById(session?.gameModelPlan?.gameContext)?.id || inferGameContext(session);
}

function setPlannerContextFromSession(session={}) {
  ensurePlannerContextField();
  const select = field('gmGameContext');
  if (!select) return;
  select.value = sessionContextFromSession(session);
  renderSessionPracticeFinder();
}

function installPlannerPersistence() {
  let original;
  try { original = currentPlannerSession; } catch (_) { original = window.currentPlannerSession; }
  if (typeof original === 'function' && !original.__gameContextV3) {
    const wrapped = function(...args) {
      const session = original.apply(this,args) || {};
      const context = contextById(currentContextId());
      const plan = { ...(session.gameModelPlan || {}), gameContext:context?.id || '', gameMoment:context?.moment || session.gameModelPlan?.gameMoment || '' };
      return { ...session, gameModelPlan:plan };
    };
    wrapped.__gameContextV3 = true;
    try { currentPlannerSession = wrapped; } catch (_) {}
    window.currentPlannerSession = wrapped;
  }
  let loadOriginal;
  try { loadOriginal = loadSessionToPlanner; } catch (_) { loadOriginal = window.loadSessionToPlanner; }
  if (typeof loadOriginal === 'function' && !loadOriginal.__gameContextV3) {
    const wrapped = function(index,...rest) {
      const session = appDb()?.sessions?.[index] || {};
      const result = loadOriginal.call(this,index,...rest);
      setTimeout(()=>setPlannerContextFromSession(session),30);
      return result;
    };
    wrapped.__gameContextV3 = true;
    try { loadSessionToPlanner = wrapped; } catch (_) {}
    window.loadSessionToPlanner = wrapped;
  }
  let resetOriginal;
  try { resetOriginal = resetSessionPlanner; } catch (_) { resetOriginal = window.resetSessionPlanner; }
  if (typeof resetOriginal === 'function' && !resetOriginal.__gameContextV3) {
    const wrapped = function(...args) {
      const result = resetOriginal.apply(this,args);
      setTimeout(()=>{ if(field('gmGameContext')) field('gmGameContext').value=''; renderSessionPracticeFinder(); },20);
      return result;
    };
    wrapped.__gameContextV3 = true;
    try { resetSessionPlanner = wrapped; } catch (_) {}
    window.resetSessionPlanner = wrapped;
  }
  let blueprintOriginal;
  try { blueprintOriginal = useBlueprint; } catch (_) { blueprintOriginal = window.useBlueprint; }
  if (typeof blueprintOriginal === 'function' && !blueprintOriginal.__gameContextV3) {
    const wrapped = function(index,...rest) {
      const template = appDb()?.sessionTemplates?.[index] || {};
      const result = blueprintOriginal.call(this,index,...rest);
      setTimeout(()=>setPlannerContextFromSession(template),30);
      return result;
    };
    wrapped.__gameContextV3 = true;
    try { useBlueprint = wrapped; } catch (_) {}
    window.useBlueprint = wrapped;
  }
}

function supportCheckbox(principle) {
  return `<label class="gmV3SupportTag"><input type="checkbox" value="${principle.id}"><b>${escapeText(principle.message)}</b></label>`;
}

function ensurePracticeEditorV3() {
  const editor = field('editor');
  const card = editor?.querySelector('.grid.two>.card:first-child');
  if (!card || field(PRACTICE_EDITOR_ID)) return;
  const panel = document.createElement('section');
  panel.id = PRACTICE_EDITOR_ID;
  panel.innerHTML = `<h3>Practice architecture</h3><p><b>Context</b> says where the problem lives. <b>Principle</b> says what football idea it can teach. <b>Purpose</b> says the job it is doing today. <b>Format</b> says what the exercise physically is.</p><div class="gmV3MetaGrid"><div><label for="gmV3PracticeContext">GAME CONTEXT</label><select id="gmV3PracticeContext">${contextOptions()}</select></div><div><label for="gmV3PracticePurpose">PRACTICE PURPOSE</label><select id="gmV3PracticePurpose">${purposeOptions('execute')}</select></div><div><label for="gmV3PracticeFormat">FORMAT</label><select id="gmV3PracticeFormat">${formatOptions('other')}</select></div><div><label for="gmV3PrimaryPrinciple">PRIMARY PRINCIPLE · OPTIONAL</label><select id="gmV3PrimaryPrinciple">${principleOptions()}</select></div><div class="full"><label>ALSO SUPPORTS · OPTIONAL</label><div class="gmV3SupportGrid">${GAME_MODEL_PRINCIPLES.map(supportCheckbox).join('')}</div></div></div><div class="gmV3EditorHint">A pure passing activation can have no principle. If a principle is genuinely present, choose one primary principle and only the supporting links that the practice really exposes.</div>`;
  const heading = card.querySelector('h2');
  if (heading) heading.insertAdjacentElement('afterend',panel); else card.prepend(panel);
  field('gmV3PrimaryPrinciple')?.addEventListener('change',()=>{
    const primary = field('gmV3PrimaryPrinciple')?.value || '';
    document.querySelectorAll(`#${PRACTICE_EDITOR_ID} .gmV3SupportTag input`).forEach(input=>{ if(input.value===primary) input.checked=false; });
  });
}

function setPracticeEditorV3(practice=null) {
  ensurePracticeEditorV3();
  currentEditorPracticeId = practice?.id || '';
  const architecture = practiceArchitecture(practice || {});
  if (field('gmV3PracticeContext')) field('gmV3PracticeContext').value = architecture.gameContext || 'player-development';
  if (field('gmV3PracticePurpose')) field('gmV3PracticePurpose').value = practice ? architecture.purpose : 'prepare';
  if (field('gmV3PracticeFormat')) field('gmV3PracticeFormat').value = practice ? architecture.format : 'other';
  if (field('gmV3PrimaryPrinciple')) field('gmV3PrimaryPrinciple').value = architecture.primaryPrincipleId;
  const supporting = new Set(architecture.principleIds.filter(id=>id!==architecture.primaryPrincipleId));
  document.querySelectorAll(`#${PRACTICE_EDITOR_ID} .gmV3SupportTag input`).forEach(input=>{ input.checked = supporting.has(input.value); });
}

function currentEditorPractice() {
  const id = field('oldId')?.value || field('pid')?.value || currentEditorPracticeId;
  return appDb()?.practices?.find(item=>String(item.id)===String(id)) || null;
}

async function persistPracticeV3() {
  const practice = currentEditorPractice();
  if (!practice) return;
  const primary = principleById(field('gmV3PrimaryPrinciple')?.value)?.id || '';
  const supporting = [...document.querySelectorAll(`#${PRACTICE_EDITOR_ID} .gmV3SupportTag input:checked`)].map(input=>principleById(input.value)?.id).filter(Boolean).filter(id=>id!==primary);
  practice.gameContext = contextById(field('gmV3PracticeContext')?.value)?.id || inferGameContext(practice) || 'player-development';
  practice.practicePurpose = purposeById(field('gmV3PracticePurpose')?.value)?.id || 'execute';
  practice.practiceFormat = formatById(field('gmV3PracticeFormat')?.value)?.id || 'other';
  practice.primaryGameModelPrinciple = primary;
  practice.gameModelPrinciples = [...new Set([primary,...supporting].filter(Boolean))];
  try { if (typeof store === 'function') await store(); else await window.store?.(); } catch (_) {}
  renderPracticeLibraryV3();
  renderSessionPracticeFinder();
}

function installPracticeEditorHooksV3() {
  ensurePracticeEditorV3();
  let editOriginal;
  try { editOriginal = editPractice; } catch (_) { editOriginal = window.editPractice; }
  if (typeof editOriginal === 'function' && !editOriginal.__practiceArchitectureV3) {
    const wrapped = function(id,...rest) {
      const practice = appDb()?.practices?.find(item=>String(item.id)===String(id)) || null;
      const result = editOriginal.call(this,id,...rest);
      setTimeout(()=>setPracticeEditorV3(practice),80);
      return result;
    };
    wrapped.__practiceArchitectureV3 = true;
    try { editPractice = wrapped; } catch (_) {}
    window.editPractice = wrapped;
  }
  let newOriginal;
  try { newOriginal = newPractice; } catch (_) { newOriginal = window.newPractice; }
  if (typeof newOriginal === 'function' && !newOriginal.__practiceArchitectureV3) {
    const wrapped = function(...args) { const result = newOriginal.apply(this,args); setTimeout(()=>setPracticeEditorV3(null),80); return result; };
    wrapped.__practiceArchitectureV3 = true;
    try { newPractice = wrapped; } catch (_) {}
    window.newPractice = wrapped;
  }
  let saveOriginal;
  try { saveOriginal = savePractice; } catch (_) { saveOriginal = window.savePractice; }
  if (typeof saveOriginal === 'function' && !saveOriginal.__practiceArchitectureV3) {
    const wrapped = function(...args) {
      const result = saveOriginal.apply(this,args);
      setTimeout(()=>persistPracticeV3(),140);
      return result;
    };
    wrapped.__practiceArchitectureV3 = true;
    try { savePractice = wrapped; } catch (_) {}
    window.savePractice = wrapped;
  }
}

function practiceMatchScore(practice, principleId='') {
  const architecture = practiceArchitecture(practice);
  let score = 0;
  if (principleId) {
    if (architecture.primaryPrincipleId === principleId) score += 20;
    else if (architecture.principleIds.includes(principleId)) score += 14;
    else score += Math.min(10, scorePracticeForPrinciple(practice,principleId));
  }
  if (practice.isFavourite || practice.favourite) score += 1;
  return score;
}

function practiceTagsMarkup(practice) {
  const a = practiceArchitecture(practice);
  const primary = principleById(a.primaryPrincipleId);
  const supports = a.principleIds.filter(id=>id!==a.primaryPrincipleId).map(id=>principleById(id)?.message).filter(Boolean);
  return `${primary?`<span class="primary">Primary · ${escapeText(primary.message)}</span>`:''}${supports.map(text=>`<span>${escapeText(text)}</span>`).join('')}`;
}

function practiceCardV3(practice,{suggestedPrincipleId=''}={}) {
  const a = practiceArchitecture(practice);
  const context = contextById(a.gameContext);
  const purpose = purposeById(a.purpose);
  const format = formatById(a.format);
  return `<article class="gmV3PracticeCard"><h4>${escapeText(practice.name || practice.id)}</h4><div class="gmV3PracticeMeta">${escapeText(context?.label || 'Context not set')} · ${escapeText(purpose?.label || 'Purpose not set')}<br>${escapeText(format?.label || 'Format not set')}${practice.stage?` · ${escapeText(practice.stage)}`:''}</div><div class="gmV3PracticeTags">${practiceTagsMarkup(practice)}${suggestedPrincipleId?'<span>Suggested principle match</span>':''}</div><div class="gmV3PracticeActions"><button type="button" data-v3-edit-practice="${escapeText(practice.id)}">Edit</button>${suggestedPrincipleId?`<button type="button" class="primary" data-v3-primary-principle="${escapeText(suggestedPrincipleId)}" data-v3-practice="${escapeText(practice.id)}">Make primary</button>`:''}</div></article>`;
}

function practiceSearchMatch(practice,query='') {
  if (!query) return true;
  const a = practiceArchitecture(practice);
  const text = [practice.id,practice.name,practice.desc,practice.cp,practice.theme,practice.stage,contextById(a.gameContext)?.label,purposeById(a.purpose)?.label,formatById(a.format)?.label,...a.principleIds.map(id=>principleById(id)?.message)].filter(Boolean).join(' ').toLowerCase();
  return text.includes(query.toLowerCase());
}

function groupedPracticeMarkup(practices, groups, keyFn, titleFn, descriptionFn=()=>'', query='') {
  return groups.map(group=>{
    const rows = practices.filter(p=>keyFn(p,group)).filter(p=>practiceSearchMatch(p,query));
    if (!rows.length) return '';
    return `<section class="gmV3Group"><div class="gmV3GroupHead"><h3>${escapeText(titleFn(group))}</h3><span>${rows.length} practices</span></div>${descriptionFn(group)?`<div class="small" style="margin-bottom:6px">${escapeText(descriptionFn(group))}</div>`:''}<div class="gmV3PracticeGrid">${rows.map(p=>practiceCardV3(p)).join('')}</div></section>`;
  }).join('');
}

function principleLibraryMarkup(practices,query='') {
  return GAME_MODEL_PRINCIPLES.map(principle=>{
    const explicit = practices.filter(p=>practiceArchitecture(p).principleIds.includes(principle.id)).filter(p=>practiceSearchMatch(p,query));
    const explicitIds = new Set(explicit.map(p=>p.id));
    const suggested = practices.filter(p=>!explicitIds.has(p.id) && !practiceArchitecture(p).principleIds.length && scorePracticeForPrinciple(p,principle.id)>=5).filter(p=>practiceSearchMatch(p,query)).sort((a,b)=>practiceMatchScore(b,principle.id)-practiceMatchScore(a,principle.id)).slice(0,5);
    return `<section class="gmV3Group"><div class="gmV3GroupHead"><h3>${principle.number}. ${escapeText(principle.message)}</h3><span>${explicit.length} tagged${suggested.length?` · ${suggested.length} suggestions`:''}</span></div>${explicit.length?`<div class="gmV3PracticeGrid">${explicit.map(p=>practiceCardV3(p)).join('')}</div>`:'<div class="small">No practices explicitly tagged yet.</div>'}${suggested.length?`<div class="small" style="margin:7px 0 5px">Possible legacy matches — only make one primary when the picture is genuinely present.</div><div class="gmV3PracticeGrid">${suggested.map(p=>practiceCardV3(p,{suggestedPrincipleId:principle.id})).join('')}</div>`:''}</section>`;
  }).join('');
}

function needsTaggingMarkup(practices,query='') {
  const rows = practices.filter(p=>!p.gameContext || !purposeById(p.practicePurpose) || !formatById(p.practiceFormat)).filter(p=>practiceSearchMatch(p,query));
  return `<section class="gmV3Group"><div class="gmV3GroupHead"><h3>Needs organising</h3><span>${rows.length} practices</span></div><div class="small" style="margin-bottom:7px">These still rely partly on legacy Theme / Stage inference. Open them and deliberately set Context, Purpose and Format. A principle can remain blank when the practice is purely technical or developmental.</div>${rows.length?`<div class="gmV3PracticeGrid">${rows.map(p=>practiceCardV3(p)).join('')}</div>`:'<div class="small">Everything has explicit Context, Purpose and Format.</div>'}</section>`;
}

function renderPracticeLibraryV3() {
  const results = field('practiceArchitectureResultsV3');
  if (!results) return;
  const practices = appDb()?.practices || [];
  const query = field('practiceArchitectureSearchV3')?.value.trim() || '';
  if (practiceLibraryView === 'context') results.innerHTML = groupedPracticeMarkup(practices,GAME_CONTEXTS,(p,g)=>practiceArchitecture(p).gameContext===g.id,g=>g.label,g=>g.description,query);
  else if (practiceLibraryView === 'purpose') results.innerHTML = groupedPracticeMarkup(practices,PRACTICE_PURPOSES_V3,(p,g)=>practiceArchitecture(p).purpose===g.id,g=>g.label,g=>g.description,query);
  else if (practiceLibraryView === 'format') results.innerHTML = groupedPracticeMarkup(practices,PRACTICE_FORMATS,(p,g)=>practiceArchitecture(p).format===g.id,g=>g.label,()=>'',query);
  else if (practiceLibraryView === 'needs') results.innerHTML = needsTaggingMarkup(practices,query);
  else results.innerHTML = principleLibraryMarkup(practices,query);
  document.querySelectorAll(`#${PRACTICE_LIBRARY_ID} [data-v3-library-view]`).forEach(button=>button.classList.toggle('on',button.dataset.v3LibraryView===practiceLibraryView));
}

async function makePracticePrimary(practiceId,principleId) {
  const practice = appDb()?.practices?.find(p=>String(p.id)===String(practiceId));
  if (!practice || !principleById(principleId)) return;
  practice.primaryGameModelPrinciple = principleId;
  practice.gameModelPrinciples = [...new Set([principleId,...normalisePrinciples(practice)])];
  try { if (typeof store === 'function') await store(); else await window.store?.(); } catch (_) {}
  renderPracticeLibraryV3();
  renderSessionPracticeFinder();
}

function ensurePracticeLibraryV3() {
  const library = field('library');
  const oldPanel = field('practiceArchitectureBrowser');
  if (!library || field(PRACTICE_LIBRARY_ID)) return;
  const panel = document.createElement('section');
  panel.id = PRACTICE_LIBRARY_ID;
  panel.className = 'card';
  panel.innerHTML = `<div class="gmV3Hero"><div><h2>Practice Library · Game Model First</h2><p><b>Context → Principle → Purpose → Format.</b> Context tells you where the football problem lives. Principle tells you what we believe. Purpose tells you the teaching job. Format tells you what the exercise physically is. Legacy Theme / Stage remains available underneath only as a fallback.</p></div><span class="pill">Game-model organisation</span></div><div class="gmV3Tabs"><button type="button" data-v3-library-view="principle" class="on">By Principle</button><button type="button" data-v3-library-view="context">By Context</button><button type="button" data-v3-library-view="purpose">By Purpose</button><button type="button" data-v3-library-view="format">By Format</button><button type="button" data-v3-library-view="needs">Needs Organising</button></div><div class="gmV3Search"><input id="practiceArchitectureSearchV3" placeholder="Search practice, context, principle, purpose or format..."></div><div id="practiceArchitectureResultsV3"></div>`;
  if (oldPanel) oldPanel.insertAdjacentElement('beforebegin',panel); else library.prepend(panel);
  panel.addEventListener('click',event=>{
    const view = event.target.closest?.('[data-v3-library-view]');
    if (view) { practiceLibraryView=view.dataset.v3LibraryView; renderPracticeLibraryV3(); return; }
    const edit = event.target.closest?.('[data-v3-edit-practice]');
    if (edit) { window.editPractice?.(edit.dataset.v3EditPractice); return; }
    const primary = event.target.closest?.('[data-v3-primary-principle]');
    if (primary) makePracticePrimary(primary.dataset.v3Practice,primary.dataset.v3PrimaryPrinciple);
  });
  field('practiceArchitectureSearchV3')?.addEventListener('input',renderPracticeLibraryV3);
  renderPracticeLibraryV3();
}

function finderPracticeRows() {
  const context = currentContextId();
  const principle = currentPrimaryPrincipleId();
  const query = field('gameContextPracticeFinderSearch')?.value.trim().toLowerCase() || '';
  return (appDb()?.practices || []).map(practice=>{
    const a = practiceArchitecture(practice);
    let score = practiceMatchScore(practice,principle);
    if (context && a.gameContext === context) score += 12;
    else if (context) score -= 8;
    if (finderPurpose && a.purpose !== finderPurpose) return null;
    if (finderFormat && a.format !== finderFormat) return null;
    if (query && !practiceSearchMatch(practice,query)) return null;
    if (context && a.gameContext !== context && score < 8) return null;
    if (principle && scorePracticeForPrinciple(practice,principle) < 3 && !a.principleIds.includes(principle) && a.gameContext !== context) return null;
    return {practice,a,score};
  }).filter(Boolean).sort((a,b)=>b.score-a.score || String(a.practice.name||'').localeCompare(String(b.practice.name||''))).slice(0,24);
}

function finderCard(row,index) {
  const {practice,a} = row;
  const context = contextById(a.gameContext);
  const purpose = purposeById(a.purpose);
  const format = formatById(a.format);
  const inSession = (()=>{ try { return Array.isArray(plannerDrills) && plannerDrills.includes(practice.id); } catch (_) { return false; } })();
  const pitchId = `gm-v3-finder-${String(practice.id||index).replace(/[^a-zA-Z0-9_-]/g,'-')}-${index}`;
  return `<article class="gmV3FinderCard"><div class="gmV3FinderPitch" id="${pitchId}"></div><div><h4>${escapeText(practice.name || practice.id)}</h4><div class="small">${escapeText(context?.label || 'No context')} · ${escapeText(purpose?.label || '')}<br>${escapeText(format?.label || '')}</div><div class="gmV3PracticeTags">${practiceTagsMarkup(practice)}</div><button type="button" class="${inSession?'':'primary'}" data-v3-toggle-session-practice="${escapeText(practice.id)}">${inSession?'Remove from session':'Add to session'}</button></div></article>`;
}

function drawFinderDiagrams(rows) {
  rows.forEach(({practice},index)=>{
    const pitchId = `gm-v3-finder-${String(practice.id||index).replace(/[^a-zA-Z0-9_-]/g,'-')}-${index}`;
    setTimeout(()=>{ try { if (typeof drawMini === 'function') drawMini(pitchId,practice.diagram||[],practice.pitchMode||'full'); else window.drawMini?.(pitchId,practice.diagram||[],practice.pitchMode||'full'); } catch (_) {} },0);
  });
}

function renderSessionPracticeFinder() {
  const results = field('gameContextPracticeFinderResults');
  if (!results) return;
  const context = contextById(currentContextId());
  const principle = principleById(currentPrimaryPrincipleId());
  const summary = field('gameContextPracticeFinderSummary');
  if (summary) summary.textContent = `${context?.label || 'Choose a context'}${principle?` · ${principle.message}`:' · choose a primary principle'} · filter by the job the practice needs to do.`;
  const rows = finderPracticeRows();
  results.innerHTML = rows.length ? `<div class="gmV3FinderGrid">${rows.map(finderCard).join('')}</div>` : '<div class="small" style="margin-top:8px">No practices match these filters yet. Use the legacy picker below or edit practices to add Context / Purpose / Format tags.</div>';
  document.querySelectorAll(`#${SESSION_FINDER_ID} [data-v3-finder-purpose]`).forEach(button=>button.classList.toggle('on',(button.dataset.v3FinderPurpose||'')===finderPurpose));
  if (field('gameContextPracticeFinderFormat')) field('gameContextPracticeFinderFormat').value = finderFormat;
  drawFinderDiagrams(rows);
}

function ensureSessionPracticeFinder() {
  const visualPicker = field('visualPicker');
  const card = visualPicker?.closest('.card');
  if (!card || field(SESSION_FINDER_ID)) return;
  const panel = document.createElement('section');
  panel.id = SESSION_FINDER_ID;
  panel.innerHTML = `<div class="gmV3FinderHead"><div><h3>Find practices for this session</h3><p id="gameContextPracticeFinderSummary">Choose the Game Context and Primary Principle on the left, then choose what job the next practice needs to do.</p></div><span class="pill">Context → Principle → Purpose → Format</span></div><div class="gmV3FinderPurposes"><button type="button" data-v3-finder-purpose="" class="on">All purposes</button>${PRACTICE_PURPOSES_V3.map(item=>`<button type="button" data-v3-finder-purpose="${item.id}">${escapeText(item.label)}</button>`).join('')}</div><div class="gmV3FinderControls"><div><label for="gameContextPracticeFinderFormat">FORMAT</label><select id="gameContextPracticeFinderFormat"><option value="">All formats</option>${formatOptions()}</select></div><div><label for="gameContextPracticeFinderSearch">SEARCH</label><input id="gameContextPracticeFinderSearch" placeholder="Name, ID or coaching detail..."></div></div><div id="gameContextPracticeFinderResults"></div>`;
  const buildHeading = [...card.querySelectorAll('h2')].find(h=>h.textContent.includes('Build the Session')) || card.querySelector('h2');
  if (buildHeading) buildHeading.insertAdjacentElement('afterend',panel); else card.prepend(panel);
  panel.addEventListener('click',event=>{
    const purpose = event.target.closest?.('[data-v3-finder-purpose]');
    if (purpose) { finderPurpose=purpose.dataset.v3FinderPurpose || ''; renderSessionPracticeFinder(); return; }
    const toggle = event.target.closest?.('[data-v3-toggle-session-practice]');
    if (toggle) { try { window.togglePracticeInSession?.(toggle.dataset.v3ToggleSessionPractice); } catch (_) {} setTimeout(renderSessionPracticeFinder,20); }
  });
  field('gameContextPracticeFinderFormat')?.addEventListener('change',event=>{ finderFormat=event.target.value || ''; renderSessionPracticeFinder(); });
  field('gameContextPracticeFinderSearch')?.addEventListener('input',renderSessionPracticeFinder);
  const stageRow = card.querySelector('.stageBtns')?.closest('.row');
  const pickerControls = card.querySelector('.pickerControls');
  if (stageRow && pickerControls && visualPicker && !field('gmV3LegacyPicker')) {
    const details = document.createElement('details');
    details.id = 'gmV3LegacyPicker';
    details.className = 'gmV3LegacyPicker';
    details.innerHTML = '<summary>Legacy Stage / Theme picker</summary><div class="gmV3LegacyPickerBody"></div>';
    panel.insertAdjacentElement('afterend',details);
    const body = details.querySelector('.gmV3LegacyPickerBody');
    body.append(stageRow,pickerControls,visualPicker);
  }
  ['gmGameContext','gmPrimaryPrinciple','gmLearningEmphasis'].forEach(id=>field(id)?.addEventListener('change',renderSessionPracticeFinder));
  renderSessionPracticeFinder();
}

function sessionSearchText(session={}) {
  const plan = session.gameModelPlan || {};
  const primary = principleById(plan.primaryPrincipleId);
  const context = contextById(sessionContextFromSession(session));
  const practiceNames = (session.drills || []).map(id=>appDb()?.practices?.find(p=>p.id===id)?.name || id).join(' ');
  return [session.date,session.team,session.theme,plan.playerProblem,plan.successLooksLike,primary?.message,context?.label,practiceNames].filter(Boolean).join(' ').toLowerCase();
}

function sessionLibraryFiltered() {
  const q = field('gmV3SessionSearch')?.value.trim().toLowerCase() || '';
  const team = field('gmV3SessionTeam')?.value || '';
  const context = field('gmV3SessionContext')?.value || '';
  const principle = field('gmV3SessionPrinciple')?.value || '';
  return [...(appDb()?.sessions || [])].filter(session=>!team || String(session.team||'')===team).filter(session=>!context || sessionContextFromSession(session)===context).filter(session=>!principle || session?.gameModelPlan?.primaryPrincipleId===principle || session?.gameModelPlan?.supportingPrincipleId===principle).filter(session=>!q || sessionSearchText(session).includes(q)).sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')));
}

function renderSessionLibraryV3() {
  const root = field(SESSION_LIBRARY_RESULTS_ID);
  if (!root) return;
  const sessions = sessionLibraryFiltered();
  root.innerHTML = `<div class="small" style="margin-bottom:8px"><b>${sessions.length}</b> ${sessions.length===1?'session':'sessions'} · organised by Game Context and Principle</div>${sessions.length?`<div class="gmV3SessionGrid">${sessions.map(session=>{
    const index = appDb().sessions.indexOf(session);
    const plan = session.gameModelPlan || {};
    const context = contextById(sessionContextFromSession(session));
    const primary = principleById(plan.primaryPrincipleId);
    const emphasis = LEARNING_EMPHASES.find(item=>item.id===plan.emphasis);
    return `<article class="gmV3SessionCard"><div class="small">${escapeText(session.date || 'No date')}${session.team?` · ${escapeText(session.team)}`:''}</div><h3>${escapeText(context?.label || session.theme || 'Session')}</h3><div class="gmV3SessionMeta">${primary?`<span class="pill">${escapeText(primary.message)}</span>`:''}${emphasis?`<span class="pill">${escapeText(emphasis.label)}</span>`:''}<span class="pill">${(session.drills||[]).length} practices</span>${session.review?.gameModel?'<span class="pill">Principle reviewed</span>':''}</div><div class="gmV3SessionProblem"><b>Player problem:</b> ${escapeText(plan.playerProblem || 'Legacy session — no player problem saved')}${plan.successLooksLike?`<br><b>Success:</b> ${escapeText(plan.successLooksLike)}`:''}</div><div class="gmV3SessionActions"><button data-v3-session-action="view" data-index="${index}">View</button><button data-v3-session-action="diagrams" data-index="${index}">🗺 Diagrams</button><button data-v3-session-action="sideline" data-index="${index}">▶ Sideline</button><button data-v3-session-action="edit" data-index="${index}">Edit</button></div></article>`;
  }).join('')}</div>`:'<div class="notice">No sessions match those filters.</div>'}`;
}

function ensureSessionLibraryV3() {
  const view = field('sessionsLibraryView');
  if (!view || field(SESSION_LIBRARY_TOOLBAR_ID)) return;
  const card = view.querySelector('.card');
  if (!card) return;
  const title = card.querySelector('h2');
  if (title) title.textContent = 'Saved Sessions · Game Model Library';
  const subtitle = title?.nextElementSibling;
  if (subtitle) subtitle.textContent = 'Find sessions by where the problem happened, which principle you were targeting and what the players needed to learn.';
  const toolbar = document.createElement('div');
  toolbar.id = SESSION_LIBRARY_TOOLBAR_ID;
  const teams = [...new Set((appDb()?.sessions||[]).map(s=>s.team).filter(Boolean))].sort();
  toolbar.innerHTML = `<input id="gmV3SessionSearch" type="search" placeholder="Search player problem, principle or practice..."><select id="gmV3SessionTeam"><option value="">All teams</option>${teams.map(team=>`<option value="${escapeText(team)}">${escapeText(team)}</option>`).join('')}</select><select id="gmV3SessionContext"><option value="">All contexts</option>${GAME_CONTEXTS.map(item=>`<option value="${item.id}">${escapeText(item.label)}</option>`).join('')}</select><select id="gmV3SessionPrinciple"><option value="">All principles</option>${GAME_MODEL_PRINCIPLES.map(item=>`<option value="${item.id}">${escapeText(item.message)}</option>`).join('')}</select>`;
  const oldToolbar = card.querySelector('.sessionLibraryToolbar');
  if (oldToolbar) oldToolbar.insertAdjacentElement('beforebegin',toolbar); else card.appendChild(toolbar);
  const results = document.createElement('div');
  results.id = SESSION_LIBRARY_RESULTS_ID;
  const oldResults = field('sessionLibraryResults');
  if (oldResults) oldResults.insertAdjacentElement('afterend',results); else card.appendChild(results);
  ['gmV3SessionSearch','gmV3SessionTeam','gmV3SessionContext','gmV3SessionPrinciple'].forEach(id=>field(id)?.addEventListener('input',renderSessionLibraryV3));
  results.addEventListener('click',event=>{
    const control = event.target.closest?.('[data-v3-session-action]');
    if (!control) return;
    const index = Number(control.dataset.index);
    if (control.dataset.v3SessionAction==='view') window.openSessionDetail?.(index);
    if (control.dataset.v3SessionAction==='diagrams') window.openAllSessionDiagrams?.(index);
    if (control.dataset.v3SessionAction==='sideline') { try { openGrassView(index); } catch (_) { window.openGrassView?.(index); } }
    if (control.dataset.v3SessionAction==='edit') window.loadSessionToPlanner?.(index);
  });
  renderSessionLibraryV3();
}

function watchSessionLibrary() {
  const view = field('sessionsLibraryView');
  if (!view || sessionLibraryObserver || typeof MutationObserver === 'undefined') return;
  sessionLibraryObserver = new MutationObserver(()=>{ if(!field(SESSION_LIBRARY_TOOLBAR_ID)) ensureSessionLibraryV3(); });
  sessionLibraryObserver.observe(view,{childList:true,subtree:true});
}

function decorateReviewV3(session={}) {
  const card = field('gameModelUnderstandingReview');
  if (!card) return;
  const plan = session.gameModelPlan || {};
  const context = contextById(sessionContextFromSession(session));
  const emphasis = LEARNING_EMPHASES.find(item=>item.id===plan.emphasis);
  card.querySelector('.gmV3ContextReview')?.remove();
  const note = document.createElement('div');
  note.className = 'gmV3ContextReview';
  note.innerHTML = `<b>Game Context:</b> ${escapeText(context?.label || 'Not saved')} ${emphasis?`· <b>Learning emphasis:</b> ${escapeText(emphasis.label)}`:''}`;
  const hint = card.querySelector('.gmReviewWhyHint');
  if (hint) hint.insertAdjacentElement('afterend',note); else card.prepend(note);
  const heading = card.querySelector('h2');
  if (heading) heading.textContent = 'Did the principle land in this game context?';
  const meta = field('reviewMeta');
  const primary = principleById(plan.primaryPrincipleId);
  if (meta) meta.textContent = `${session.date || ''}${context?` · ${context.label}`:''}${primary?` · ${primary.message}`:''}${plan.playerProblem?` · Problem: ${plan.playerProblem}`:''}`;
}

function installReviewV3() {
  let original;
  try { original = openPostSessionReview; } catch (_) { original = window.openPostSessionReview; }
  if (typeof original === 'function' && !original.__gameContextReviewV3) {
    const wrapped = function(session,index,...rest) {
      const result = original.call(this,session,index,...rest);
      setTimeout(()=>decorateReviewV3(session),120);
      setTimeout(()=>decorateReviewV3(session),260);
      return result;
    };
    wrapped.__gameContextReviewV3 = true;
    try { openPostSessionReview = wrapped; } catch (_) {}
    window.openPostSessionReview = wrapped;
  }
}

function ensureGameModelArchitectureExplainer() {
  const view = field('gameModel');
  const hero = view?.querySelector('.gmOsHero');
  if (!view || !hero || view.querySelector('.gmV3ArchitectureExplainer')) return;
  const section = document.createElement('section');
  section.className = 'gmV3ArchitectureExplainer';
  section.innerHTML = `<b>How sessions are now organised</b><div class="gmV3ArchitectureSteps"><div class="gmV3ArchitectureStep"><b>Where?</b><span>Game Context</span></div><div class="gmV3ArchitectureStep"><b>What is wrong?</b><span>Player Problem</span></div><div class="gmV3ArchitectureStep"><b>What do we believe?</b><span>Primary Principle</span></div><div class="gmV3ArchitectureStep"><b>What do they need?</b><span>Understand / Recognise / Execute / Adapt</span></div><div class="gmV3ArchitectureStep"><b>Practice job</b><span>Prepare / Recognise / Execute / Transfer</span></div><div class="gmV3ArchitectureStep"><b>What is it?</b><span>Practice Format</span></div></div><div class="small" style="margin-top:8px">No separate field-area layer: the Game Context is the blanket football category. The principle stays stable while the picture changes with the context.</div>`;
  hero.insertAdjacentElement('afterend',section);
}

function ensureAll() {
  addStyles();
  hideLegacyThemeField();
  ensurePlannerContextField();
  installPlannerPersistence();
  ensurePracticeEditorV3();
  installPracticeEditorHooksV3();
  ensurePracticeLibraryV3();
  ensureSessionPracticeFinder();
  ensureSessionLibraryV3();
  watchSessionLibrary();
  installReviewV3();
  ensureGameModelArchitectureExplainer();
}

function install() {
  ensureAll();
  setTimeout(ensureAll,120);
  setTimeout(ensureAll,500);
  setTimeout(ensureAll,1300);
  document.addEventListener('click',event=>{
    if (event.target.closest?.('[data-tab="planner"],[data-tab="library"],[data-tab="editor"],#sessionsLibraryTab,button[onclick*="showBuildRoute"],button[onclick*="loadSessionToPlanner"]')) {
      setTimeout(ensureAll,0);
      setTimeout(()=>{ renderPracticeLibraryV3(); renderSessionPracticeFinder(); renderSessionLibraryV3(); },100);
    }
  },true);
  window.NickGameContextSystem = Object.freeze({
    contexts:GAME_CONTEXTS,
    purposes:PRACTICE_PURPOSES_V3,
    formats:PRACTICE_FORMATS,
    inferGameContext,
    inferPurpose:inferPurposeV3,
    inferFormat:inferFormatV3,
    practiceArchitecture
  });
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
}
