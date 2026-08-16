const STYLE_ID = 'diagramPresetManagerStyles';
const OVERLAY_ID = 'diagramPresetManagerOverlay';
const STORE_KEY = 'diagramPresets';
const SETTINGS_KEY = 'diagramPresetSettings';
let cloudTimer = 0;
let studioObserver = null;
let toolPanelWrapped = false;

const DEFAULT_PRESETS = Object.freeze([
  { id:'coach:possession', label:'4v2 Possession Box', selector:'[data-coach-preset="possession"]' },
  { id:'coach:buildout', label:'5v3 Build Out', selector:'[data-coach-preset="buildout"]' },
  { id:'coach:press442', label:'4-4-2 Press', selector:'[data-coach-preset="press442"]' },
  { id:'coach:wide', label:'3v2 Wide Overload', selector:'[data-coach-preset="wide"]' },
  { id:'coach:finishing', label:'Finishing Pattern', selector:'[data-coach-preset="finishing"]' },
  { id:'coach:rondogoals', label:'6v3 + Mini Goals', selector:'[data-coach-preset="rondogoals"]' },
  { id:'base:4v2', label:'4v2 Rondo', text:'4v2 Rondo' },
  { id:'base:6v6', label:'6v6 + 3', text:'6v6 + 3' },
  { id:'base:433', label:'4-3-3', text:'4-3-3' },
  { id:'base:4231', label:'4-2-3-1', text:'4-2-3-1' },
  { id:'base:zones', label:'3 Zones', text:'3 Zones' },
  { id:'base:finishing', label:'Finishing', text:'Finishing' }
]);

function appDb() {
  try { return typeof db !== 'undefined' ? db : window.db; }
  catch (_) { return window.db || null; }
}

function clone(value) {
  try { if (typeof dsClone === 'function') return dsClone(value); } catch (_) {}
  return JSON.parse(JSON.stringify(value == null ? null : value));
}

function uid(prefix = 'obj') {
  try { if (typeof dsUid === 'function') return dsUid(prefix); } catch (_) {}
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`;
}

function toast(message) {
  try { if (typeof dsToast === 'function') return dsToast(message); } catch (_) {}
  console.info(message);
}

function escapeText(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
}

function ensureStore() {
  const data = appDb();
  if (!data) return { presets:[], settings:{ hiddenDefaults:[] } };
  if (!data.banks || typeof data.banks !== 'object') data.banks = {};
  if (!Array.isArray(data.banks[STORE_KEY])) data.banks[STORE_KEY] = [];
  if (!data.banks[SETTINGS_KEY] || typeof data.banks[SETTINGS_KEY] !== 'object') data.banks[SETTINGS_KEY] = { hiddenDefaults:[] };
  if (!Array.isArray(data.banks[SETTINGS_KEY].hiddenDefaults)) data.banks[SETTINGS_KEY].hiddenDefaults = [];
  return { presets:data.banks[STORE_KEY], settings:data.banks[SETTINGS_KEY] };
}

function persistPresets() {
  const data = appDb();
  if (!data) return;
  try { localStorage.setItem('nickCoachOSv3', JSON.stringify(data)); } catch (_) {}
  clearTimeout(cloudTimer);
  cloudTimer = setTimeout(async () => {
    try {
      if (!window.nickCloud || typeof window.nickCloud.save !== 'function') return;
      await window.nickCloud.save(JSON.parse(JSON.stringify(appDb())));
      try { lastCloudJson = JSON.stringify(appDb()); } catch (_) {}
    } catch (error) {
      console.warn('Diagram preset cloud sync will retry on the next normal save', error);
    }
  }, 550);
}

export function clonePresetObjects(source = [], idFactory = prefix => `${prefix}-${Math.random().toString(36).slice(2,8)}`) {
  const list = Array.isArray(source) ? source : [];
  const idMap = new Map();
  list.forEach(object => {
    const oldId = object?.id;
    if (oldId) idMap.set(oldId, idFactory(object.type || 'obj'));
  });
  return list.map(object => {
    const next = JSON.parse(JSON.stringify(object || {}));
    next.id = idMap.get(object?.id) || idFactory(object?.type || 'obj');
    if (next.attachStart) next.attachStart = idMap.get(next.attachStart) || null;
    if (next.attachEnd) next.attachEnd = idMap.get(next.attachEnd) || null;
    return next;
  });
}

function currentStep() {
  try { return typeof dsCurrentStep === 'function' ? dsCurrentStep() : null; }
  catch (_) { return null; }
}

function currentSnapshot() {
  const step = currentStep();
  if (!step) return null;
  let diagram = [];
  try { diagram = Array.isArray(step.diagram) ? step.diagram : (typeof dsObjects === 'function' ? dsObjects() : []); } catch (_) {}
  return {
    pitchMode: step.pitchMode || 'full',
    diagram: clone(diagram || []),
    itemCount: Array.isArray(diagram) ? diagram.length : 0
  };
}

function presetId() { return `preset-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`; }

export function makePresetRecord(name, snapshot, now = new Date().toISOString()) {
  return {
    id:presetId(),
    name:String(name || '').trim(),
    pitchMode:snapshot?.pitchMode || 'full',
    diagram:JSON.parse(JSON.stringify(snapshot?.diagram || [])),
    itemCount:Array.isArray(snapshot?.diagram) ? snapshot.diagram.length : 0,
    createdAt:now,
    updatedAt:now,
    useCount:0
  };
}

function createPreset(name) {
  const clean = String(name || '').trim();
  if (!clean) return false;
  const snapshot = currentSnapshot();
  if (!snapshot) return false;
  const { presets } = ensureStore();
  if (presets.some(item => String(item.name || '').toLowerCase() === clean.toLowerCase())) {
    toast('That preset name already exists — rename it or update the existing preset');
    return false;
  }
  presets.unshift(makePresetRecord(clean, snapshot));
  persistPresets();
  refreshPresetUi(true);
  toast(`Preset saved · ${clean}`);
  return true;
}

function replaceStepWithPreset(preset) {
  const step = currentStep();
  if (!step || !preset) return false;
  const current = Array.isArray(step.diagram) ? step.diagram : [];
  if (current.length && !confirm(`Replace this diagram with “${preset.name}”? You can Undo afterwards.`)) return false;
  try { if (typeof dsPushHistory === 'function') dsPushHistory(); } catch (_) {}
  step.pitchMode = preset.pitchMode || 'full';
  step.diagram = clonePresetObjects(preset.diagram || [], prefix => uid(prefix));
  try {
    if (typeof dsState !== 'undefined' && dsState) {
      dsState.selectedIds = new Set();
      dsState.primaryId = null;
    }
  } catch (_) {}
  preset.useCount = Number(preset.useCount || 0) + 1;
  preset.lastUsedAt = new Date().toISOString();
  persistPresets();
  try { if (typeof dsRenderAll === 'function') dsRenderAll(); } catch (_) {}
  requestAnimationFrame(() => {
    try { if (typeof dsFitPitch === 'function') dsFitPitch(); } catch (_) {}
    refreshPresetUi();
  });
  toast(`Loaded preset · ${preset.name}`);
  return true;
}

function updatePreset(id) {
  const snapshot = currentSnapshot();
  const { presets } = ensureStore();
  const preset = presets.find(item => item.id === id);
  if (!preset || !snapshot) return;
  if (!confirm(`Replace “${preset.name}” with the setup currently on the pitch?`)) return;
  preset.pitchMode = snapshot.pitchMode;
  preset.diagram = clone(snapshot.diagram);
  preset.itemCount = snapshot.itemCount;
  preset.updatedAt = new Date().toISOString();
  persistPresets();
  renderManager();
  refreshPresetUi(true);
  toast(`Updated preset · ${preset.name}`);
}

function renamePreset(id) {
  const { presets } = ensureStore();
  const preset = presets.find(item => item.id === id);
  if (!preset) return;
  const name = prompt('Preset name', preset.name || '');
  if (name == null) return;
  const clean = name.trim();
  if (!clean) return;
  if (presets.some(item => item.id !== id && String(item.name || '').toLowerCase() === clean.toLowerCase())) return toast('That preset name already exists');
  preset.name = clean;
  preset.updatedAt = new Date().toISOString();
  persistPresets();
  renderManager();
  refreshPresetUi(true);
}

function deletePreset(id) {
  const { presets } = ensureStore();
  const index = presets.findIndex(item => item.id === id);
  if (index < 0) return;
  if (!confirm(`Delete preset “${presets[index].name}”?`)) return;
  presets.splice(index, 1);
  persistPresets();
  renderManager();
  refreshPresetUi(true);
  toast('Preset deleted');
}

function basePresetButton(label) {
  return [...document.querySelectorAll('#dsToolPanel .dsPresetChip')].find(button => (button.textContent || '').trim() === label) || null;
}

function defaultButton(item) {
  if (item.selector) return document.querySelector(`#diagramCoachPresetShelf ${item.selector}`);
  if (item.text) return basePresetButton(item.text);
  return null;
}

function useDefault(id) {
  const item = DEFAULT_PRESETS.find(preset => preset.id === id);
  if (!item) return;
  const button = defaultButton(item);
  if (!button) return toast('That default preset is not available in this editor view');
  button.click();
  closeManager();
}

function setDefaultHidden(id, hidden) {
  const { settings } = ensureStore();
  const values = new Set(settings.hiddenDefaults || []);
  if (hidden) values.add(id); else values.delete(id);
  settings.hiddenDefaults = [...values];
  persistPresets();
  applyHiddenDefaults();
  renderManager();
}

function applyHiddenDefaults() {
  const { settings } = ensureStore();
  const hidden = new Set(settings.hiddenDefaults || []);
  DEFAULT_PRESETS.forEach(item => {
    const button = defaultButton(item);
    if (!button) return;
    button.hidden = hidden.has(item.id);
    button.style.display = hidden.has(item.id) ? 'none' : '';
  });
}

function addStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    #diagramCoachPresetShelf .coachPresetHead{align-items:center!important;flex-wrap:wrap}
    .userPresetHeadActions{display:flex;gap:5px;margin-left:auto;flex-wrap:wrap}
    .userPresetHeadActions button{padding:6px 8px!important;font-size:9.5px!important}
    .userPresetQuick{border-color:rgba(56,189,248,.45)!important;background:rgba(56,189,248,.10)!important;color:#d7f2ff!important}
    .userPresetQuick:before{content:'★ ';color:var(--gold)}
    #${OVERLAY_ID}{position:fixed;inset:0;z-index:60000;background:rgba(3,7,18,.88);display:flex;align-items:center;justify-content:center;padding:18px;backdrop-filter:blur(8px)}
    #${OVERLAY_ID} .presetManagerShell{width:min(900px,100%);max-height:min(820px,92dvh);overflow:auto;border:1px solid var(--border);border-radius:18px;background:var(--surface);box-shadow:0 30px 90px rgba(0,0,0,.6)}
    #${OVERLAY_ID} .presetManagerHead{position:sticky;top:0;z-index:2;display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding:15px 16px;background:rgba(13,21,36,.96);border-bottom:1px solid var(--border);backdrop-filter:blur(8px)}
    #${OVERLAY_ID} .presetManagerHead h2{margin:0 0 3px;font-size:18px}
    #${OVERLAY_ID} .presetManagerBody{padding:15px}
    #${OVERLAY_ID} .presetCreateRow{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;padding:11px;border:1px solid rgba(52,211,153,.3);border-radius:12px;background:rgba(52,211,153,.06);margin-bottom:15px}
    #${OVERLAY_ID} .presetCreateRow input{margin:0}
    #${OVERLAY_ID} .presetSectionTitle{display:flex;align-items:end;justify-content:space-between;gap:8px;margin:15px 0 8px}
    #${OVERLAY_ID} .presetSectionTitle h3{margin:0;font-size:14px}
    #${OVERLAY_ID} .presetList{display:grid;gap:7px}
    #${OVERLAY_ID} .presetManagerItem{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:10px;padding:10px 11px;border:1px solid var(--border-soft);border-radius:11px;background:var(--surface-2)}
    #${OVERLAY_ID} .presetManagerItem strong{display:block;font-size:13px}
    #${OVERLAY_ID} .presetManagerItem .small{font-size:10.5px;margin-top:2px}
    #${OVERLAY_ID} .presetItemActions{display:flex;gap:5px;flex-wrap:wrap;justify-content:flex-end}
    #${OVERLAY_ID} .presetItemActions button{padding:6px 8px;font-size:10px}
    #${OVERLAY_ID} .presetEmpty{padding:14px;border:1px dashed var(--border);border-radius:10px;color:var(--text-dim);font-size:12px}
    #${OVERLAY_ID} .presetDefaultsTools{display:flex;gap:6px;flex-wrap:wrap;margin-top:9px}
    @media(max-width:650px){
      #${OVERLAY_ID}{padding:7px;align-items:flex-end}
      #${OVERLAY_ID} .presetManagerShell{max-height:94dvh;border-radius:16px 16px 8px 8px}
      #${OVERLAY_ID} .presetManagerBody{padding:10px}
      #${OVERLAY_ID} .presetCreateRow{grid-template-columns:1fr}
      #${OVERLAY_ID} .presetManagerItem{grid-template-columns:1fr}
      #${OVERLAY_ID} .presetItemActions{justify-content:flex-start}
      #${OVERLAY_ID} .presetItemActions button{flex:1 1 auto;min-height:38px}
      .userPresetHeadActions{width:100%;margin-left:0}.userPresetHeadActions button{flex:1}
    }
  `;
  document.head.appendChild(style);
}

function renderQuickShelf(force = false) {
  const shelf = document.getElementById('diagramCoachPresetShelf');
  const row = shelf?.querySelector('.coachPresetRow');
  const head = shelf?.querySelector('.coachPresetHead');
  if (!shelf || !row || !head) return;
  const { presets } = ensureStore();
  const signature = presets.map(item => `${item.id}:${item.name}:${item.updatedAt || ''}`).join('|');
  if (force || shelf.dataset.userPresetSignature !== signature) {
    row.querySelectorAll('.userPresetQuick').forEach(button => button.remove());
    [...presets].reverse().forEach(preset => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'userPresetQuick';
      button.dataset.userPresetId = preset.id;
      button.textContent = preset.name;
      button.title = `Use your preset · ${preset.name}`;
      button.addEventListener('click', () => replaceStepWithPreset(preset));
      row.prepend(button);
    });
    shelf.dataset.userPresetSignature = signature;
  }
  let actions = head.querySelector('.userPresetHeadActions');
  if (!actions) {
    actions = document.createElement('div');
    actions.className = 'userPresetHeadActions';
    actions.innerHTML = '<button type="button" data-create-preset>＋ Create Preset</button><button type="button" data-manage-presets>Manage Presets</button>';
    actions.querySelector('[data-create-preset]').addEventListener('click', () => openManager(true));
    actions.querySelector('[data-manage-presets]').addEventListener('click', () => openManager(false));
    head.appendChild(actions);
  }
  const heading = head.querySelector('b');
  if (heading) heading.textContent = presets.length ? `★ My Presets · ${presets.length}` : '⚽ Coaching Presets';
  const note = head.querySelector('span:not(.userPresetHeadActions span)');
  if (note) note.textContent = presets.length ? 'Your saved setups first · defaults can be hidden below' : 'Build your setup once, then save it exactly how you want it';
}

function refreshPresetUi(force = false) {
  renderQuickShelf(force);
  applyHiddenDefaults();
}

function managerCustomMarkup() {
  const { presets } = ensureStore();
  if (!presets.length) return '<div class="presetEmpty">No custom presets yet. Build the picture you want on the pitch, give it a name above, and save it.</div>';
  return `<div class="presetList">${presets.map(preset => `<div class="presetManagerItem" data-manager-preset="${escapeText(preset.id)}"><div><strong>${escapeText(preset.name)}</strong><div class="small">${escapeText(preset.pitchMode || 'full')} · ${Number(preset.itemCount ?? preset.diagram?.length ?? 0)} objects · used ${Number(preset.useCount || 0)} times</div></div><div class="presetItemActions"><button type="button" data-preset-action="use">Use</button><button type="button" data-preset-action="update">Update from Current</button><button type="button" data-preset-action="rename">Rename</button><button type="button" class="danger" data-preset-action="delete">Delete</button></div></div>`).join('')}</div>`;
}

function managerDefaultsMarkup() {
  const { settings } = ensureStore();
  const hidden = new Set(settings.hiddenDefaults || []);
  return `<div class="presetList">${DEFAULT_PRESETS.map(item => `<div class="presetManagerItem" data-default-preset="${escapeText(item.id)}"><div><strong>${escapeText(item.label)}</strong><div class="small">Built-in preset · ${hidden.has(item.id) ? 'hidden from editor' : 'shown in editor'}</div></div><div class="presetItemActions"><button type="button" data-default-action="use">Use</button><button type="button" data-default-action="toggle">${hidden.has(item.id) ? 'Show' : 'Hide'}</button></div></div>`).join('')}</div><div class="presetDefaultsTools"><button type="button" data-hide-defaults>Hide All Defaults</button><button type="button" data-show-defaults>Show All Defaults</button></div>`;
}

function renderManager() {
  const overlay = document.getElementById(OVERLAY_ID);
  if (!overlay) return;
  const body = overlay.querySelector('.presetManagerBody');
  if (!body) return;
  body.innerHTML = `<div class="presetCreateRow"><input id="newDiagramPresetName" type="text" maxlength="60" placeholder="Preset name · e.g. My 6v4 Build Out"><button type="button" class="primary" data-save-current-preset>Save Current Setup</button></div><div class="presetSectionTitle"><h3>My Presets</h3><span class="small">These save the pitch type and every object exactly where you placed it.</span></div>${managerCustomMarkup()}<div class="presetSectionTitle"><h3>Built-in Presets</h3><span class="small">Hide any of these you do not want cluttering the editor.</span></div>${managerDefaultsMarkup()}`;
  body.querySelector('[data-save-current-preset]')?.addEventListener('click', () => {
    const input = document.getElementById('newDiagramPresetName');
    if (createPreset(input?.value || '')) {
      renderManager();
      setTimeout(() => document.getElementById('newDiagramPresetName')?.focus(), 0);
    } else input?.focus();
  });
  body.querySelector('#newDiagramPresetName')?.addEventListener('keydown', event => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    body.querySelector('[data-save-current-preset]')?.click();
  });
  body.querySelectorAll('[data-manager-preset]').forEach(row => row.addEventListener('click', event => {
    const button = event.target.closest('[data-preset-action]');
    if (!button) return;
    const id = row.dataset.managerPreset;
    const preset = ensureStore().presets.find(item => item.id === id);
    if (button.dataset.presetAction === 'use') { if (preset && replaceStepWithPreset(preset)) closeManager(); }
    if (button.dataset.presetAction === 'update') updatePreset(id);
    if (button.dataset.presetAction === 'rename') renamePreset(id);
    if (button.dataset.presetAction === 'delete') deletePreset(id);
  }));
  body.querySelectorAll('[data-default-preset]').forEach(row => row.addEventListener('click', event => {
    const button = event.target.closest('[data-default-action]');
    if (!button) return;
    const id = row.dataset.defaultPreset;
    if (button.dataset.defaultAction === 'use') useDefault(id);
    if (button.dataset.defaultAction === 'toggle') {
      const hidden = new Set(ensureStore().settings.hiddenDefaults || []);
      setDefaultHidden(id, !hidden.has(id));
    }
  }));
  body.querySelector('[data-hide-defaults]')?.addEventListener('click', () => {
    ensureStore().settings.hiddenDefaults = DEFAULT_PRESETS.map(item => item.id); persistPresets(); applyHiddenDefaults(); renderManager();
  });
  body.querySelector('[data-show-defaults]')?.addEventListener('click', () => {
    ensureStore().settings.hiddenDefaults = []; persistPresets(); applyHiddenDefaults(); renderManager();
  });
}

function openManager(focusCreate = false) {
  let overlay = document.getElementById(OVERLAY_ID);
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = OVERLAY_ID;
    overlay.innerHTML = `<div class="presetManagerShell" role="dialog" aria-modal="true" aria-label="Diagram Preset Manager"><div class="presetManagerHead"><div><h2>Diagram Presets</h2><div class="small">You control this library. Save your own setups and remove the defaults you do not use.</div></div><button type="button" data-close-preset-manager>Close</button></div><div class="presetManagerBody"></div></div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', event => { if (event.target === overlay) closeManager(); });
    overlay.querySelector('[data-close-preset-manager]')?.addEventListener('click', closeManager);
  }
  renderManager();
  if (focusCreate) setTimeout(() => document.getElementById('newDiagramPresetName')?.focus(), 40);
}

function closeManager() { document.getElementById(OVERLAY_ID)?.remove(); }

function wrapToolPanel() {
  if (toolPanelWrapped) return;
  const base = window.dsRenderToolPanel;
  if (typeof base !== 'function' || base.__presetManagerWrapped) return;
  const wrapped = function(...args) {
    const result = base.apply(this, args);
    requestAnimationFrame(refreshPresetUi);
    return result;
  };
  wrapped.__presetManagerWrapped = true;
  try { dsRenderToolPanel = wrapped; } catch (_) {}
  window.dsRenderToolPanel = wrapped;
  toolPanelWrapped = true;
}

function observeStudio() {
  const studio = document.getElementById('diagramStudioOverlay');
  if (!studio || studioObserver) return;
  let frame = 0;
  studioObserver = new MutationObserver(records => {
    const shouldRefresh = records.some(record => record.type === 'childList' || (record.type === 'attributes' && record.target === studio));
    if (!shouldRefresh) return;
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => refreshPresetUi());
  });
  studioObserver.observe(studio, { childList:true, subtree:true, attributes:true, attributeFilter:['class'] });
}

function install() {
  addStyles();
  ensureStore();
  wrapToolPanel();
  observeStudio();
  refreshPresetUi(true);
  setTimeout(() => { wrapToolPanel(); observeStudio(); refreshPresetUi(true); }, 250);
  setTimeout(() => { wrapToolPanel(); observeStudio(); refreshPresetUi(true); }, 900);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && document.getElementById(OVERLAY_ID)) closeManager();
  });
}

if (typeof window !== 'undefined') {
  window.openDiagramPresetManager = openManager;
  window.refreshDiagramPresetUi = refreshPresetUi;
}
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
  else install();
}
