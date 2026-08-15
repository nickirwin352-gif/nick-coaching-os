const STYLE_ID = 'practiceIdSystemStyles';
const SCHEME_VERSION = 'stage-theme-v1';

const STAGE_CODES = Object.freeze({
  'Activation':'A',
  'Skill Practice':'SP',
  'Tactical Practice':'TP',
  'Conditioned Game':'CG'
});

const THEME_CODES = Object.freeze({
  'Core Passing Activations':'PA',
  'Build Up':'BU',
  'Midfield Progression':'MP',
  'Chance Creation':'CC',
  'Wide Overloads':'WO',
  'Finishing':'FI',
  'High Press':'HP',
  'Mid Block':'MB',
  'Counter Press':'CP',
  'Attacking Transition':'AT',
  'Defensive Transition':'DT',
  '1v1 & Duel Play':'DU',
  'Set Plays':'SET',
  'Conditioned Games':'CG',
  'Fitness':'FIT'
});

function appDb() {
  try { return typeof db !== 'undefined' ? db : window.db; }
  catch (_) { return window.db; }
}

function escapeText(value) {
  try { if (typeof escapeHtml === 'function') return escapeHtml(String(value ?? '')); } catch (_) {}
  return String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[ch]));
}

function escapeRegex(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function stageCode(stage = '') {
  return STAGE_CODES[stage] || String(stage || 'P').trim().split(/\s+/).filter(Boolean).map(word => word[0]).join('').toUpperCase().slice(0,3) || 'P';
}

export function themeCode(theme = '') {
  if (THEME_CODES[theme]) return THEME_CODES[theme];
  const words = String(theme || 'General').replace(/[^a-zA-Z0-9 ]+/g, ' ').trim().split(/\s+/).filter(Boolean);
  if (!words.length) return 'GEN';
  if (words.length === 1) return words[0].slice(0,3).toUpperCase();
  return words.slice(0,3).map(word => word[0]).join('').toUpperCase();
}

export function practicePrefix(stage = '', theme = '') {
  return `${stageCode(stage)}-${themeCode(theme)}`;
}

function idNumber(id, prefix) {
  const match = String(id || '').match(new RegExp(`^${escapeRegex(prefix)}(\\d+)$`, 'i'));
  return match ? Number(match[1]) || 0 : 0;
}

export function nextPracticeId(practices = [], stage = '', theme = '', ignoreId = '') {
  const prefix = practicePrefix(stage, theme);
  let highest = 0;
  for (const practice of practices || []) {
    if (!practice || practice.id === ignoreId) continue;
    const number = idNumber(practice.id, prefix);
    if (number > highest) highest = number;
  }
  return `${prefix}${highest + 1}`;
}

export function planPracticeIdMigration(practices = []) {
  const usedByPrefix = new Map();
  const changes = [];

  (practices || []).forEach((practice, index) => {
    const prefix = practicePrefix(practice?.stage, practice?.theme);
    const number = idNumber(practice?.id, prefix);
    if (!usedByPrefix.has(prefix)) usedByPrefix.set(prefix, new Set());
    const used = usedByPrefix.get(prefix);
    if (number && !used.has(number)) {
      used.add(number);
      return;
    }
    changes.push({ index, oldId:String(practice?.id || ''), prefix });
  });

  changes.forEach(change => {
    const used = usedByPrefix.get(change.prefix) || new Set();
    let next = used.size ? Math.max(...used) + 1 : 1;
    while (used.has(next)) next += 1;
    used.add(next);
    usedByPrefix.set(change.prefix, used);
    change.newId = `${change.prefix}${next}`;
  });

  return changes;
}

function replaceExactIds(value, idMap) {
  if (typeof value === 'string') return idMap.get(value) || value;
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) value[index] = replaceExactIds(value[index], idMap);
    return value;
  }
  if (value && typeof value === 'object') {
    Object.keys(value).forEach(key => { value[key] = replaceExactIds(value[key], idMap); });
  }
  return value;
}

export function migratePracticeIdsData(data = {}) {
  const practices = Array.isArray(data.practices) ? data.practices : [];
  const changes = planPracticeIdMigration(practices);
  if (!changes.length) {
    data.practiceIdSchemeVersion = SCHEME_VERSION;
    return { changed:false, idMap:new Map(), changes:[] };
  }

  const idMap = new Map();
  changes.forEach(change => {
    const practice = practices[change.index];
    if (!practice) return;
    if (change.oldId && !idMap.has(change.oldId)) idMap.set(change.oldId, change.newId);
    practice.id = change.newId;
  });

  if (Array.isArray(data.sessions)) replaceExactIds(data.sessions, idMap);
  if (Array.isArray(data.sessionTemplates)) replaceExactIds(data.sessionTemplates, idMap);
  data.practiceIdSchemeVersion = SCHEME_VERSION;
  return { changed:true, idMap, changes };
}

function applyRuntimeIdMap(idMap) {
  if (!idMap?.size) return;
  try {
    if (Array.isArray(plannerDrills)) plannerDrills = plannerDrills.map(id => idMap.get(id) || id);
  } catch (_) {}
  try {
    if (typeof sidelineState !== 'undefined' && sidelineState?.session) replaceExactIds(sidelineState.session, idMap);
  } catch (_) {}

  const oldField = document.getElementById('oldId');
  const idField = document.getElementById('pid');
  if (oldField && idMap.has(oldField.value)) oldField.value = idMap.get(oldField.value);
  if (idField && idMap.has(idField.value)) idField.value = idMap.get(idField.value);
}

let persistTimer = 0;
function persistMigratedData(data) {
  try { localStorage.setItem('nickCoachOSv3', JSON.stringify(data)); } catch (_) {}
  clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    try {
      const result = typeof store === 'function' ? store() : window.store?.();
      if (result?.catch) result.catch(error => console.warn('Practice ID migration cloud save pending', error));
    } catch (error) {
      console.warn('Practice ID migration save pending', error);
    }
  }, 40);
}

function migrateRuntimeData(data = appDb()) {
  if (!data) return { changed:false, idMap:new Map(), changes:[] };
  const result = migratePracticeIdsData(data);
  if (result.changed) {
    applyRuntimeIdMap(result.idMap);
    persistMigratedData(data);
  }
  return result;
}

function installNormaliseMigration() {
  let original;
  try { original = normaliseDbShape; } catch (_) { original = window.normaliseDbShape; }
  if (typeof original !== 'function' || original.__practiceIdScheme) return;
  const wrapped = function(data) {
    const normalised = original.apply(this, arguments);
    const result = migratePracticeIdsData(normalised);
    if (result.changed && typeof document !== 'undefined') {
      requestAnimationFrame(() => applyRuntimeIdMap(result.idMap));
      persistMigratedData(normalised);
    }
    return normalised;
  };
  wrapped.__practiceIdScheme = true;
  try { normaliseDbShape = wrapped; } catch (_) {}
  window.normaliseDbShape = wrapped;
}

function currentFormPractice() {
  const old = document.getElementById('oldId')?.value?.trim() || '';
  return (appDb()?.practices || []).find(practice => practice.id === old) || null;
}

function refreshAutomaticId(force = false) {
  const idField = document.getElementById('pid');
  const oldField = document.getElementById('oldId');
  const stageField = document.getElementById('stage');
  const themeField = document.getElementById('theme');
  const data = appDb();
  if (!idField || !oldField || !stageField || !themeField || !data) return;

  const old = oldField.value.trim();
  const current = currentFormPractice();
  const sameCategory = current && current.stage === stageField.value && current.theme === themeField.value;
  if (!force && old && sameCategory) {
    idField.value = old;
    return;
  }
  idField.value = nextPracticeId(data.practices || [], stageField.value, themeField.value, old);
}

function addIdFieldHint() {
  const idField = document.getElementById('pid');
  if (!idField) return;
  idField.readOnly = true;
  idField.setAttribute('aria-readonly', 'true');
  idField.classList.add('automaticPracticeId');
  const label = document.querySelector('label[for="pid"]') || idField.previousElementSibling;
  if (label?.tagName === 'LABEL') label.textContent = 'Practice ID · automatic';
  if (!idField.parentElement?.querySelector('.automaticIdHint')) {
    const hint = document.createElement('div');
    hint.className = 'automaticIdHint';
    hint.textContent = 'Generated from stage + theme. Example: A-PA1 or SP-CC1.';
    idField.insertAdjacentElement('afterend', hint);
  }
}

function replaceReferencesForRename(oldId, newId) {
  if (!oldId || !newId || oldId === newId) return;
  const data = appDb();
  if (!data) return;
  const map = new Map([[oldId, newId]]);
  if (Array.isArray(data.sessions)) replaceExactIds(data.sessions, map);
  if (Array.isArray(data.sessionTemplates)) replaceExactIds(data.sessionTemplates, map);
  applyRuntimeIdMap(map);
}

function installPracticeEditorAutomation() {
  addIdFieldHint();
  const stageField = document.getElementById('stage');
  const themeField = document.getElementById('theme');
  [stageField, themeField].filter(Boolean).forEach(field => {
    if (field.dataset.autoPracticeIdBound === 'true') return;
    field.dataset.autoPracticeIdBound = 'true';
    field.addEventListener('change', () => refreshAutomaticId(false));
  });

  let clearOriginal;
  try { clearOriginal = clearForm; } catch (_) { clearOriginal = window.clearForm; }
  if (typeof clearOriginal === 'function' && !clearOriginal.__autoPracticeId) {
    const wrapped = function(...args) { const result = clearOriginal.apply(this, args); requestAnimationFrame(() => refreshAutomaticId(true)); return result; };
    wrapped.__autoPracticeId = true;
    try { clearForm = wrapped; } catch (_) {}
    window.clearForm = wrapped;
  }

  let newOriginal;
  try { newOriginal = newPractice; } catch (_) { newOriginal = window.newPractice; }
  if (typeof newOriginal === 'function' && !newOriginal.__autoPracticeId) {
    const wrapped = function(...args) { const result = newOriginal.apply(this, args); setTimeout(() => { addIdFieldHint(); refreshAutomaticId(true); }, 0); return result; };
    wrapped.__autoPracticeId = true;
    try { newPractice = wrapped; } catch (_) {}
    window.newPractice = wrapped;
  }

  let editOriginal;
  try { editOriginal = editPractice; } catch (_) { editOriginal = window.editPractice; }
  if (typeof editOriginal === 'function' && !editOriginal.__autoPracticeId) {
    const wrapped = function(...args) { const result = editOriginal.apply(this, args); setTimeout(() => { addIdFieldHint(); refreshAutomaticId(false); }, 0); return result; };
    wrapped.__autoPracticeId = true;
    try { editPractice = wrapped; } catch (_) {}
    window.editPractice = wrapped;
  }

  let duplicateOriginal;
  try { duplicateOriginal = duplicatePractice; } catch (_) { duplicateOriginal = window.duplicatePractice; }
  if (typeof duplicateOriginal === 'function' && !duplicateOriginal.__autoPracticeId) {
    const wrapped = function(...args) { const result = duplicateOriginal.apply(this, args); refreshAutomaticId(true); return result; };
    wrapped.__autoPracticeId = true;
    try { duplicatePractice = wrapped; } catch (_) {}
    window.duplicatePractice = wrapped;
  }

  let saveOriginal;
  try { saveOriginal = savePractice; } catch (_) { saveOriginal = window.savePractice; }
  if (typeof saveOriginal === 'function' && !saveOriginal.__autoPracticeId) {
    const wrapped = async function(...args) {
      const idField = document.getElementById('pid');
      const oldField = document.getElementById('oldId');
      const stageField = document.getElementById('stage');
      const themeField = document.getElementById('theme');
      const nameField = document.getElementById('pname');
      if (!idField || !oldField || !stageField || !themeField) return saveOriginal.apply(this, args);
      if (!String(nameField?.value || '').trim()) return saveOriginal.apply(this, args);

      const data = appDb();
      const oldId = oldField.value.trim();
      const current = currentFormPractice();
      const sameCategory = current && current.stage === stageField.value && current.theme === themeField.value;
      const targetId = oldId && sameCategory
        ? oldId
        : nextPracticeId(data?.practices || [], stageField.value, themeField.value, oldId);
      idField.value = targetId;

      if (oldId && oldId !== targetId) replaceReferencesForRename(oldId, targetId);
      try {
        const result = saveOriginal.apply(this, args);
        if (result?.then) await result;
        if (oldField) oldField.value = targetId;
        decoratePracticeSearchViews();
        return result;
      } catch (error) {
        if (oldId && oldId !== targetId) replaceReferencesForRename(targetId, oldId);
        throw error;
      }
    };
    wrapped.__autoPracticeId = true;
    try { savePractice = wrapped; } catch (_) {}
    window.savePractice = wrapped;
  }
}

function identityMarkup(practice) {
  return `<span class="practiceCompactId">${escapeText(practice.id)}</span><span class="practiceIdentityDivider"> · </span><span class="practiceProminentName">${escapeText(practice.name)}</span>`;
}

function decorateLibraryCards() {
  const data = appDb();
  if (!data) return;
  document.querySelectorAll('#practiceList .item[data-practice-id]').forEach(card => {
    const practice = (data.practices || []).find(item => item.id === card.dataset.practiceId);
    const heading = card.querySelector('.row > div > strong');
    if (!practice || !heading) return;
    heading.classList.add('practiceIdentityHeading');
    heading.innerHTML = identityMarkup(practice);
  });

  const favourites = (data.practices || []).filter(practice => practice.isFavourite);
  [...document.querySelectorAll('#favList .favCard')].forEach((card, index) => {
    const practice = favourites[index];
    if (!practice) return;
    const id = card.querySelector('b');
    const name = card.querySelector('.small');
    if (id) { id.classList.add('favouritePracticeId'); id.textContent = `⭐ ${practice.id}`; }
    if (name) { name.classList.add('favouritePracticeName'); name.textContent = practice.name; }
  });
}

function decorateVisualPicker() {
  const data = appDb();
  if (!data) return;
  document.querySelectorAll('#visualPicker .pitchCard').forEach(card => {
    const heading = card.querySelector('h3');
    if (!heading) return;
    const existingId = card.dataset.practiceId || String(heading.textContent || '').split(' · ')[0].trim();
    const practice = (data.practices || []).find(item => item.id === existingId);
    if (!practice) return;
    card.dataset.practiceId = practice.id;
    heading.classList.add('practiceIdentityHeading');
    heading.innerHTML = identityMarkup(practice);
  });
}

function decorateSelectOptions(selectId) {
  const select = document.getElementById(selectId);
  const data = appDb();
  if (!select || !data) return;
  [...select.options].forEach(option => {
    if (!option.value) return;
    const practice = (data.practices || []).find(item => item.id === option.value);
    if (practice) option.textContent = `${practice.name} — ${practice.id}${practice.theme ? ` · ${practice.theme}` : ''}`;
  });
}

function decoratePracticeSearchViews() {
  decorateLibraryCards();
  decorateVisualPicker();
  decorateSelectOptions('plannerPractice');
  decorateSelectOptions('diagramSourceSelect');
}

function wrapRenderer(name, after) {
  let original;
  try { original = window[name]; } catch (_) { original = null; }
  if (typeof original !== 'function' || original.__practiceIdentityUx) return;
  const wrapped = function(...args) { const result = original.apply(this, args); requestAnimationFrame(after); return result; };
  wrapped.__practiceIdentityUx = true;
  try {
    if (name === 'renderList') renderList = wrapped;
    else if (name === 'renderVisualPicker') renderVisualPicker = wrapped;
    else if (name === 'renderPlannerPracticeOptions') renderPlannerPracticeOptions = wrapped;
    else if (name === 'populateDiagramSourceSelect') populateDiagramSourceSelect = wrapped;
  } catch (_) {}
  window[name] = wrapped;
}

function installRenderDecorators() {
  wrapRenderer('renderList', decorateLibraryCards);
  wrapRenderer('renderVisualPicker', decorateVisualPicker);
  wrapRenderer('renderPlannerPracticeOptions', () => decorateSelectOptions('plannerPractice'));
  wrapRenderer('populateDiagramSourceSelect', () => decorateSelectOptions('diagramSourceSelect'));
}

function addStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .practiceIdentityHeading{display:flex!important;flex-direction:column;align-items:flex-start;gap:1px;line-height:1.12;margin:0 0 7px!important;min-width:0}
    .practiceProminentName{order:1;color:var(--text)!important;font-size:16px!important;font-weight:900!important;letter-spacing:-.015em;max-width:100%}
    .practiceCompactId{order:2;color:var(--text-faint)!important;font-size:9.5px!important;font-weight:850!important;letter-spacing:.08em;text-transform:uppercase;line-height:1.2}
    .practiceIdentityDivider{display:none!important}
    #visualPicker .practiceProminentName{font-size:17px!important}
    #practiceList .item .pill,#visualPicker .pitchCard .pill{font-size:10.5px}
    #practiceList .item .small,#visualPicker .pitchCard .small{font-size:11px}
    #favList .favouritePracticeName{display:block!important;color:var(--text)!important;font-size:14px!important;font-weight:850!important;margin-bottom:3px}
    #favList .favouritePracticeId{display:block;color:var(--text-faint);font-size:9.5px;letter-spacing:.06em;margin-top:3px}
    .automaticPracticeId{font-size:12px!important;color:var(--text-dim)!important;letter-spacing:.06em;background:rgba(13,21,36,.72)!important}
    .automaticIdHint{font-size:10px;color:var(--text-faint);margin-top:4px;line-height:1.35}
    @media(max-width:720px){
      .practiceProminentName{font-size:15px!important}#visualPicker .practiceProminentName{font-size:16px!important}
      .practiceCompactId{font-size:9px!important}
      #practiceList .item{padding:10px}
    }
  `;
  document.head.appendChild(style);
}

function install() {
  addStyles();
  installNormaliseMigration();
  const migration = migrateRuntimeData();
  installPracticeEditorAutomation();
  installRenderDecorators();
  decoratePracticeSearchViews();
  if (!migration.changed) refreshAutomaticId(false);
  setTimeout(() => { addIdFieldHint(); installPracticeEditorAutomation(); installRenderDecorators(); decoratePracticeSearchViews(); }, 250);
  setTimeout(() => { addIdFieldHint(); installRenderDecorators(); decoratePracticeSearchViews(); }, 900);
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
  else install();
}
