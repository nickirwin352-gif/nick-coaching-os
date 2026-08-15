export function filterSessions(sessions = [], { search = '', team = '', theme = '' } = {}, practiceLookup = () => null) {
  const q = String(search || '').trim().toLowerCase();
  return [...sessions]
    .filter(session => !team || String(session.team || '') === team)
    .filter(session => !theme || String(session.theme || '') === theme)
    .filter(session => {
      if (!q) return true;
      const practiceNames = (session.drills || session.practiceIds || []).map(id => {
        const practice = practiceLookup(id);
        return practice ? `${practice.name || ''} ${practice.stage || ''} ${practice.theme || ''}` : String(id || '');
      }).join(' ');
      return [session.date, session.team, session.theme, session.objective, session.cues, session.reflect, practiceNames]
        .join(' ')
        .toLowerCase()
        .includes(q);
    })
    .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')) || String(b.id || '').localeCompare(String(a.id || '')));
}

export function sessionDiagramItems(session = {}, practiceLookup = () => null, effectivePractice = null) {
  const ids = Array.isArray(session.drills) ? session.drills : (Array.isArray(session.practiceIds) ? session.practiceIds : []);
  return ids.map((id, index) => {
    const practice = (typeof effectivePractice === 'function' ? effectivePractice(session, index) : null) || practiceLookup(id) || {};
    return {
      id,
      index,
      name: practice.name || id || `Practice ${index + 1}`,
      stage: practice.stage || '',
      time: practice.time || '',
      diagram: Array.isArray(practice.diagram) ? practice.diagram : [],
      pitchMode: practice.pitchMode || 'full'
    };
  });
}

const STYLE_ID = 'sessionLibrarySpeedStyles';
let cloudSyncRunning = false;
let pendingCloudSnapshot = null;
let cloudRetryTimer = null;

function appDb() {
  try { return db; } catch (_) { return typeof window !== 'undefined' ? window.db : null; }
}

function practiceById(id) {
  try { return get(id); } catch (_) {
    const data = appDb();
    return data && Array.isArray(data.practices) ? data.practices.find(p => p.id === id) : null;
  }
}

function esc(value) {
  try { return escapeHtml(String(value ?? '')); } catch (_) {
    return String(value ?? '').replace(/[&<>\"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;', "'": '&#39;' }[char]));
  }
}

function addStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    #sessionsLibraryView{padding:22px;max-width:1450px;margin:auto}
    .sessionLibraryToolbar{display:grid;grid-template-columns:minmax(220px,1.5fr) minmax(150px,.7fr) minmax(150px,.7fr);gap:10px;margin:14px 0}
    .sessionLibrarySummary{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin:8px 0 12px}
    .sessionLibraryGrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:12px}
    .sessionLibraryCard{background:linear-gradient(180deg,var(--surface),var(--surface-2));border:1px solid var(--border-soft);border-radius:16px;padding:14px}
    .sessionLibraryCard h3{margin:4px 0 7px;font-size:17px}
    .sessionLibraryMeta{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:9px}
    .sessionLibraryObjective{min-height:36px;color:var(--text-dim);font-size:13px;line-height:1.45}
    .sessionLibraryActions{display:flex;gap:6px;flex-wrap:wrap;margin-top:12px}
    .sessionLibraryActions button{flex:1 1 118px}
    .diagramOverviewOverlay,.sessionDetailOverlay{position:fixed;inset:0;z-index:10000;background:rgba(5,8,16,.96);overflow:auto;padding:max(16px,env(safe-area-inset-top)) 16px max(24px,env(safe-area-inset-bottom))}
    .diagramOverviewShell,.sessionDetailShell{max-width:1180px;margin:0 auto}
    .diagramOverviewHead,.sessionDetailHead{position:sticky;top:0;z-index:5;display:flex;align-items:center;justify-content:space-between;gap:12px;background:rgba(5,8,16,.94);padding:8px 0 12px;backdrop-filter:blur(8px)}
    .diagramOverviewHead h2,.sessionDetailHead h2{margin:0;font-size:20px}
    .diagramOverviewGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
    .diagramOverviewCard{background:var(--surface-2);border:1px solid var(--border);border-radius:14px;padding:12px;min-width:0}
    .diagramOverviewCard h3{margin:0 0 8px;font-size:15px}
    .diagramOverviewCard .pitchMini{max-width:none!important;width:100%!important;margin:0 auto}
    .fastSaveToast{position:fixed;left:50%;bottom:calc(18px + env(safe-area-inset-bottom));transform:translateX(-50%);z-index:12000;background:var(--surface);border:1px solid var(--border);border-radius:999px;padding:9px 14px;box-shadow:var(--shadow);font-size:13px;font-weight:700;white-space:nowrap;max-width:calc(100vw - 24px)}
    .plannerDiagramOverviewButton{margin:0 0 12px;width:100%}
    @media(max-width:720px){#sessionsLibraryView{padding:14px}.sessionLibraryToolbar{grid-template-columns:1fr}.sessionLibraryGrid{grid-template-columns:1fr}.diagramOverviewGrid{grid-template-columns:1fr}.diagramOverviewOverlay,.sessionDetailOverlay{padding-left:10px;padding-right:10px}}
  `;
  document.head.appendChild(style);
}

function toast(message, duration = 1900) {
  let el = document.getElementById('fastSaveToast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'fastSaveToast';
    el.className = 'fastSaveToast';
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.hidden = false;
  clearTimeout(el._hideTimer);
  el._hideTimer = setTimeout(() => { el.hidden = true; }, duration);
}

function updateStatus(text) {
  try { updateCloudStatus(text, new Date().toLocaleString('en-GB')); } catch (_) {}
}

async function flushCloudSync() {
  if (cloudSyncRunning || !pendingCloudSnapshot) return;
  let ready = false;
  try { ready = !!cloudReady; } catch (_) { ready = true; }
  if (!ready || !window.nickCloud || typeof window.nickCloud.save !== 'function') {
    clearTimeout(cloudRetryTimer);
    cloudRetryTimer = setTimeout(flushCloudSync, 650);
    return;
  }
  cloudSyncRunning = true;
  const snapshot = pendingCloudSnapshot;
  pendingCloudSnapshot = null;
  try {
    await window.nickCloud.save(snapshot);
    try { lastCloudJson = JSON.stringify(snapshot); } catch (_) {}
    updateStatus('Saved to Firebase');
    toast('Saved to cloud');
  } catch (error) {
    console.error('Background session sync failed', error);
    pendingCloudSnapshot = snapshot;
    updateStatus('Saved locally · cloud retry pending');
    clearTimeout(cloudRetryTimer);
    cloudRetryTimer = setTimeout(flushCloudSync, 1500);
  } finally {
    cloudSyncRunning = false;
    if (pendingCloudSnapshot) queueMicrotask(flushCloudSync);
  }
}

function persistFast() {
  const data = appDb();
  try { db = typeof normaliseDbShape === 'function' ? normaliseDbShape(data) : data; } catch (_) {}
  const current = appDb();
  localStorage.setItem('nickCoachOSv3', JSON.stringify(current));
  pendingCloudSnapshot = JSON.parse(JSON.stringify(current));
  updateStatus('Saved locally · syncing…');
  toast('Saved · syncing in background');
  queueMicrotask(flushCloudSync);
  const render = () => { try { renderAll(); } catch (_) {} };
  if ('requestIdleCallback' in window) requestIdleCallback(render, { timeout: 1200 });
  else setTimeout(render, 0);
}

function installFastSessionSave() {
  let original;
  try { original = saveSession; } catch (_) { original = window.saveSession; }
  if (original && original.__fastSessionSave) return;
  const fastSave = function(mode = 'new') {
    try {
      if (typeof dsEnsurePlannerOverrides === 'function') dsEnsurePlannerOverrides();
      const base = typeof currentPlannerSession === 'function' ? currentPlannerSession() : {
        date: sDate.value || new Date().toISOString().slice(0, 10), team: team.value, theme: sTheme.value, objective: objective.value,
        links: links.value, cues: cues.value, drills: [...plannerDrills], diagramOverrides: typeof copyPlannerDiagramOverrides === 'function' ? copyPlannerDiagramOverrides() : [],
        reflect: reflect.value, rating: sessionRating.value
      };
      if (!Array.isArray(base.drills) || !base.drills.length) return alert('Add at least one practice before saving the session.');
      const data = appDb();
      if (mode === 'update' && editingSessionId) {
        const index = data.sessions.findIndex(session => session.id === editingSessionId);
        if (index < 0) return alert('The original session could not be found.');
        data.sessions[index] = { ...data.sessions[index], ...base, id: editingSessionId };
      } else {
        const id = typeof makeLocalId === 'function' ? makeLocalId('session') : `session-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        data.sessions.push({ ...base, id });
      }
      persistFast();
      try { resetSessionPlanner(); } catch (_) {}
      try { showBuildRoute('home'); } catch (_) {}
      toast(mode === 'update' ? 'Session updated · syncing' : 'Session saved · syncing');
      return true;
    } catch (error) {
      console.error('Fast session save failed; falling back to original save', error);
      return original ? original(mode) : undefined;
    }
  };
  fastSave.__fastSessionSave = true;
  try { saveSession = fastSave; } catch (_) { window.saveSession = fastSave; }
  window.saveSession = fastSave;
}

function getEffectivePractice(session, index) {
  try { if (typeof dsEffectiveSessionPractice === 'function') return dsEffectiveSessionPractice(session, index); } catch (_) {}
  const ids = Array.isArray(session.drills) ? session.drills : [];
  return practiceById(ids[index]);
}

function plannerAsSession() {
  try { return currentPlannerSession(); } catch (_) {
    let drills = [];
    try { drills = [...plannerDrills]; } catch (_) {}
    return { drills, diagramOverrides: [] };
  }
}

function closeOverlay(id) { document.getElementById(id)?.remove(); }

export function openAllSessionDiagrams(sessionOrIndex = null, title = '') {
  const data = appDb();
  let session;
  if (Number.isInteger(sessionOrIndex)) session = data?.sessions?.[sessionOrIndex];
  else if (sessionOrIndex && typeof sessionOrIndex === 'object') session = sessionOrIndex;
  else session = plannerAsSession();
  if (!session) return;
  const items = sessionDiagramItems(session, practiceById, getEffectivePractice);
  if (!items.length) return alert('There are no practices in this session yet.');
  closeOverlay('diagramOverviewOverlay');
  const overlay = document.createElement('div');
  overlay.id = 'diagramOverviewOverlay';
  overlay.className = 'diagramOverviewOverlay';
  overlay.innerHTML = `<div class="diagramOverviewShell"><div class="diagramOverviewHead"><div><h2>${esc(title || session.theme || 'All Session Diagrams')}</h2><div class="small">${esc(session.date || '')}${session.team ? ` · ${esc(session.team)}` : ''} · ${items.length} practices</div></div><button type="button" id="closeDiagramOverview">Close</button></div><div class="diagramOverviewGrid">${items.map((item, i) => `<article class="diagramOverviewCard"><h3>${i + 1}. ${esc(item.stage ? `${item.stage} · ` : '')}${esc(item.name)}</h3>${item.time ? `<div class="small" style="margin-bottom:7px">${esc(item.time)}</div>` : ''}<div id="diagram-overview-${i}"></div></article>`).join('')}</div></div>`;
  document.body.appendChild(overlay);
  document.getElementById('closeDiagramOverview')?.addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', event => { if (event.target === overlay) overlay.remove(); });
  items.forEach((item, i) => setTimeout(() => { try { drawMini(`diagram-overview-${i}`, item.diagram, item.pitchMode); } catch (error) { console.error('Diagram overview render failed', error); } }, 0));
}

function openSessionDetail(index) {
  const data = appDb();
  const session = data?.sessions?.[index];
  if (!session) return;
  closeOverlay('sessionDetailOverlay');
  const overlay = document.createElement('div');
  overlay.id = 'sessionDetailOverlay';
  overlay.className = 'sessionDetailOverlay';
  overlay.innerHTML = `<div class="sessionDetailShell"><div class="sessionDetailHead"><h2>${esc(session.date || '')} · ${esc(session.theme || 'Session')}</h2><button type="button" id="closeSessionDetail">Close</button></div><div id="sessionDetailContent"></div></div>`;
  document.body.appendChild(overlay);
  const content = document.getElementById('sessionDetailContent');
  try { content.appendChild(buildSessionCard(session, index)); } catch (_) { content.innerHTML = `<p>${esc(session.objective || '')}</p>`; }
  document.getElementById('closeSessionDetail')?.addEventListener('click', () => overlay.remove());
}

function uniqueValues(values) { return [...new Set(values.filter(Boolean).map(String))].sort((a, b) => a.localeCompare(b)); }

function renderSessionLibrary() {
  const root = document.getElementById('sessionLibraryResults');
  if (!root) return;
  const data = appDb();
  const sessions = filterSessions(data?.sessions || [], {
    search: document.getElementById('sessionLibrarySearch')?.value || '',
    team: document.getElementById('sessionLibraryTeam')?.value || '',
    theme: document.getElementById('sessionLibraryTheme')?.value || ''
  }, practiceById);
  const count = document.getElementById('sessionLibraryCount');
  if (count) count.textContent = `${sessions.length} ${sessions.length === 1 ? 'session' : 'sessions'}`;
  if (!sessions.length) { root.innerHTML = '<div class="notice">No saved sessions match those filters.</div>'; return; }
  root.innerHTML = `<div class="sessionLibraryGrid">${sessions.map(session => {
    const index = data.sessions.indexOf(session);
    const drills = Array.isArray(session.drills) ? session.drills : [];
    return `<article class="sessionLibraryCard"><div class="small">${esc(session.date || 'No date')}${session.team ? ` · ${esc(session.team)}` : ''}</div><h3>${esc(session.theme || 'Session')}</h3><div class="sessionLibraryMeta"><span class="pill">${drills.length} ${drills.length === 1 ? 'practice' : 'practices'}</span>${session.rating ? `<span class="pill">${'★'.repeat(Number(session.rating) || 0)}</span>` : ''}${session.review ? '<span class="pill">Reviewed</span>' : ''}</div><div class="sessionLibraryObjective"><b>Objective:</b> ${esc(session.objective || '—')}</div><div class="sessionLibraryActions"><button type="button" data-session-action="view" data-index="${index}">View Session</button><button type="button" data-session-action="diagrams" data-index="${index}">🗺 All Diagrams</button><button type="button" data-session-action="sideline" data-index="${index}">▶ Sideline</button><button type="button" data-session-action="edit" data-index="${index}">Edit</button></div></article>`;
  }).join('')}</div>`;
}

function showSessionLibrary() {
  document.querySelectorAll('.view').forEach(view => view.classList.add('hidden'));
  document.getElementById('sessionsLibraryView')?.classList.remove('hidden');
  document.querySelectorAll('nav .tab').forEach(tab => tab.classList.remove('active'));
  document.getElementById('sessionsLibraryTab')?.classList.add('active');
  renderSessionLibrary();
  window.scrollTo(0, 0);
}

function installSessionLibrary() {
  if (document.getElementById('sessionsLibraryView')) return;
  const nav = document.querySelector('nav');
  if (!nav) return;
  const button = document.createElement('button');
  button.id = 'sessionsLibraryTab'; button.type = 'button'; button.className = 'tab'; button.textContent = 'Sessions';
  const archiveTab = nav.querySelector('[data-tab="archive"]');
  if (archiveTab) nav.insertBefore(button, archiveTab); else nav.appendChild(button);
  const view = document.createElement('section');
  view.id = 'sessionsLibraryView'; view.className = 'view hidden';
  view.innerHTML = `<div class="card"><h2>Saved Sessions</h2><p class="small">Every saved session in one place. Search it, open it, start Sideline Mode, or view every diagram in one tap.</p><div class="sessionLibraryToolbar"><input id="sessionLibrarySearch" type="search" placeholder="Search objective, practice, theme…" aria-label="Search saved sessions"><select id="sessionLibraryTeam" aria-label="Filter sessions by team"><option value="">All teams</option></select><select id="sessionLibraryTheme" aria-label="Filter sessions by theme"><option value="">All themes</option></select></div><div class="sessionLibrarySummary"><b id="sessionLibraryCount">0 sessions</b><button type="button" id="sessionLibraryClearFilters">Clear filters</button></div><div id="sessionLibraryResults"></div></div>`;
  document.body.appendChild(view);
  const data = appDb();
  const teamSelect = document.getElementById('sessionLibraryTeam');
  uniqueValues((data?.sessions || []).map(s => s.team)).forEach(value => teamSelect.insertAdjacentHTML('beforeend', `<option value="${esc(value)}">${esc(value)}</option>`));
  const themeSelect = document.getElementById('sessionLibraryTheme');
  uniqueValues((data?.sessions || []).map(s => s.theme)).forEach(value => themeSelect.insertAdjacentHTML('beforeend', `<option value="${esc(value)}">${esc(value)}</option>`));
  button.addEventListener('click', showSessionLibrary);
  ['sessionLibrarySearch', 'sessionLibraryTeam', 'sessionLibraryTheme'].forEach(id => document.getElementById(id)?.addEventListener('input', renderSessionLibrary));
  document.getElementById('sessionLibraryClearFilters')?.addEventListener('click', () => {
    document.getElementById('sessionLibrarySearch').value = ''; document.getElementById('sessionLibraryTeam').value = ''; document.getElementById('sessionLibraryTheme').value = ''; renderSessionLibrary();
  });
  document.getElementById('sessionLibraryResults')?.addEventListener('click', event => {
    const control = event.target.closest('[data-session-action]'); if (!control) return;
    const index = Number(control.dataset.index);
    if (control.dataset.sessionAction === 'view') openSessionDetail(index);
    if (control.dataset.sessionAction === 'diagrams') openAllSessionDiagrams(index);
    if (control.dataset.sessionAction === 'sideline') { try { openGrassView(index); } catch (_) {} }
    if (control.dataset.sessionAction === 'edit') { try { loadSessionToPlanner(index); } catch (_) {} }
  });
}

function injectPlannerDiagramButton() {
  const previewEl = document.getElementById('preview');
  if (!previewEl || document.getElementById('plannerDiagramOverviewButton')) return;
  let hasDrills = false; try { hasDrills = Array.isArray(plannerDrills) && plannerDrills.length > 0; } catch (_) {}
  if (!hasDrills) return;
  const button = document.createElement('button');
  button.id = 'plannerDiagramOverviewButton'; button.className = 'plannerDiagramOverviewButton'; button.type = 'button'; button.textContent = '🗺 View All Diagrams';
  button.addEventListener('click', () => openAllSessionDiagrams(null, 'Current Session · All Diagrams'));
  previewEl.prepend(button);
}

function wrapPreview() {
  let original; try { original = renderPreview; } catch (_) { original = window.renderPreview; }
  if (!original || original.__diagramOverviewWrapped) return;
  const wrapped = function(...args) { const result = original.apply(this, args); injectPlannerDiagramButton(); return result; };
  wrapped.__diagramOverviewWrapped = true;
  try { renderPreview = wrapped; } catch (_) { window.renderPreview = wrapped; }
  window.renderPreview = wrapped; injectPlannerDiagramButton();
}

function wrapSessionCards() {
  let original; try { original = buildSessionCard; } catch (_) { original = window.buildSessionCard; }
  if (!original || original.__allDiagramsWrapped) return;
  const wrapped = function(session, index, ...rest) {
    const card = original.call(this, session, index, ...rest);
    if (card && !card.querySelector('[data-all-diagrams]')) {
      const actions = card.querySelector('.sessionActions') || card;
      const button = document.createElement('button'); button.type = 'button'; button.dataset.allDiagrams = '1'; button.textContent = '🗺 View All Diagrams';
      button.addEventListener('click', event => { event.stopPropagation(); openAllSessionDiagrams(index); }); actions.appendChild(button);
    }
    return card;
  };
  wrapped.__allDiagramsWrapped = true;
  try { buildSessionCard = wrapped; } catch (_) { window.buildSessionCard = wrapped; }
  window.buildSessionCard = wrapped;
}

function install() { addStyles(); installFastSessionSave(); installSessionLibrary(); wrapPreview(); wrapSessionCards(); }

if (typeof window !== 'undefined') {
  window.openAllSessionDiagrams = openAllSessionDiagrams;
  window.openSessionDetail = openSessionDetail;
  window.renderSessionLibrary = renderSessionLibrary;
}
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true }); else install();
}
