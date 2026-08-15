const STYLE_ID = 'builderSessionVisualStyles';

function addStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    #sessionDrillList .sessionDrillRow{grid-template-columns:42px minmax(0,1fr) auto;align-items:start}
    #sessionDrillList .advancedBuilderDiagram{grid-column:1/-1;order:-1;margin:-2px -2px 2px;border-radius:12px;overflow:hidden;border:1px solid var(--border-soft);background:var(--surface-2)}
    #sessionDrillList .advancedBuilderDiagram .pitchMini{width:100%!important;max-width:none!important;height:220px!important;margin:0!important;border:0!important;border-radius:0!important}
    #sessionDrillList .advancedBuilderDiagramLabel{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:7px 9px;border-top:1px solid var(--border-soft);font-size:11px;color:var(--text-dim)}
    .recentSessionPracticeToggle.activeStage{background:var(--turf);color:#04160f;border-color:var(--turf)}
    .recentSessionPracticePanel{display:none;margin-top:12px;padding-top:12px;border-top:1px solid var(--border-soft)}
    .recentSessionPracticePanel.open{display:block}
    .recentSessionPracticeList{display:grid;gap:10px;margin-top:9px}
    .recentSessionPracticeItem{border:1px solid var(--border-soft);background:var(--surface-3);border-radius:12px;padding:10px}
    .recentSessionPracticeItemHead{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:7px}
    .recentSessionPracticeItemHead b{font-size:13px}
    .recentSessionPracticeDiagram .pitchMini{width:100%!important;max-width:none!important;height:170px!important;margin:0!important}
    .recentSessionPracticeActions{display:flex;gap:7px;flex-wrap:wrap;margin-top:8px}
    #currentSessionDockPills.currentSessionDiagramStrip{display:flex;gap:8px;overflow-x:auto;overflow-y:hidden;padding:5px 1px 2px;scrollbar-width:thin;max-width:min(760px,68vw)}
    .currentSessionDiagramThumb{flex:0 0 132px;min-width:132px;border:1px solid var(--border);border-radius:10px;overflow:hidden;background:var(--surface-3);cursor:pointer;transition:border-color .15s,transform .08s}
    .currentSessionDiagramThumb:hover{border-color:var(--turf)}
    .currentSessionDiagramThumb:active{transform:scale(.98)}
    .currentSessionDiagramThumb .pitchMini{width:100%!important;max-width:none!important;height:76px!important;margin:0!important;border:0!important;border-radius:0!important}
    .currentSessionDiagramThumbLabel{padding:5px 7px;font-size:10.5px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--text)}
    .currentSessionDiagramThumbMeta{display:flex;align-items:center;justify-content:space-between;gap:4px;padding:0 7px 5px;font-size:9px;color:var(--text-dim)}
    .currentSessionDiagramMore{flex:0 0 auto;display:flex;align-items:center;justify-content:center;min-width:70px;padding:0 8px;border:1px dashed var(--border);border-radius:10px;color:var(--text-dim);font-size:11px;font-weight:800}
    @media(max-width:720px){
      #sessionDrillList .advancedBuilderDiagram .pitchMini{height:185px!important}.recentSessionPracticeDiagram .pitchMini{height:155px!important}
      #currentSessionDockPills.currentSessionDiagramStrip{display:flex!important;max-width:100%;width:100%;padding-top:4px}
      .currentSessionDiagramThumb{flex-basis:112px;min-width:112px}.currentSessionDiagramThumb .pitchMini{height:64px!important}
    }
  `;
  document.head.appendChild(style);
}

function escapeText(value) {
  try { return escapeHtml(String(value ?? '')); }
  catch (_) { return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
}

function plannerPracticeAt(index) {
  try {
    if (typeof dsCurrentPlannerPractice === 'function') return dsCurrentPlannerPractice(index);
  } catch (_) {}
  try {
    const id = plannerDrills[index];
    return typeof get === 'function' ? get(id) : null;
  } catch (_) { return null; }
}

function savedSessionPractice(session, index) {
  try {
    if (typeof dsEffectiveSessionPractice === 'function') return dsEffectiveSessionPractice(session, index);
  } catch (_) {}
  try {
    const ids = typeof sessionDrillIds === 'function' ? sessionDrillIds(session) : (session.drills || []);
    return typeof get === 'function' ? get(ids[index]) : null;
  } catch (_) { return null; }
}

function drawWhenReady(id, practice) {
  if (!id || !practice) return;
  requestAnimationFrame(() => {
    try { drawMini(id, practice.diagram || [], practice.pitchMode || 'full'); } catch (_) {}
  });
}

function enrichAdvancedBuilderRows() {
  const list = document.getElementById('sessionDrillList');
  if (!list) return;
  const rows = [...list.querySelectorAll('.sessionDrillRow')];
  rows.forEach((row, index) => {
    if (row.querySelector('.advancedBuilderDiagram')) return;
    const practice = plannerPracticeAt(index);
    if (!practice) return;
    const host = document.createElement('div');
    host.className = 'advancedBuilderDiagram';
    const diagramId = `advanced-builder-diagram-${index}-${Date.now().toString(36)}`;
    host.innerHTML = `<div id="${diagramId}"></div><div class="advancedBuilderDiagramLabel"><span>Practice ${index + 1} diagram</span>${practice.sessionDiagramOverride ? '<span class="sessionDiagramBadge">Session diagram</span>' : ''}</div>`;
    row.prepend(host);
    drawWhenReady(diagramId, practice);
  });
}

function installAdvancedBuilderDiagrams() {
  const original = window.renderSessionDrillList;
  if (typeof original !== 'function' || original.__builderDiagrams) return;
  const wrapped = function(...args) {
    const result = original.apply(this, args);
    enrichAdvancedBuilderRows();
    return result;
  };
  wrapped.__builderDiagrams = true;
  window.renderSessionDrillList = wrapped;
}

function renderStickySessionDiagrams() {
  const strip = document.getElementById('currentSessionDockPills');
  if (!strip) return;
  let drills = [];
  try { drills = Array.isArray(plannerDrills) ? plannerDrills : []; } catch (_) {}
  strip.classList.add('currentSessionDiagramStrip');
  if (!drills.length) {
    strip.innerHTML = '<span class="currentSessionDockEmpty">Your current session diagrams will appear here.</span>';
    return;
  }
  strip.innerHTML = '';
  drills.forEach((id, index) => {
    const practice = plannerPracticeAt(index);
    if (!practice) return;
    const thumb = document.createElement('button');
    thumb.type = 'button';
    thumb.className = 'currentSessionDiagramThumb';
    thumb.title = `Practice ${index + 1}: ${practice.name || id}`;
    const diagramId = `sticky-session-diagram-${index}-${Date.now().toString(36)}`;
    thumb.innerHTML = `<div id="${diagramId}"></div><div class="currentSessionDiagramThumbLabel">${index + 1}. ${escapeText(practice.name || id)}</div><div class="currentSessionDiagramThumbMeta"><span>${escapeText(practice.stage || '')}</span>${practice.sessionDiagramOverride ? '<span>Edited</span>' : ''}</div>`;
    thumb.addEventListener('click', () => {
      try {
        if (typeof openSessionDiagramStudio === 'function') openSessionDiagramStudio(index);
        else if (typeof openCurrentSessionDrawer === 'function') openCurrentSessionDrawer();
      } catch (_) {}
    });
    strip.appendChild(thumb);
    drawWhenReady(diagramId, practice);
  });
}

function installStickySessionDiagrams() {
  const original = window.renderCurrentSessionDock;
  if (typeof original !== 'function' || original.__stickySessionDiagrams) return;
  const wrapped = function(...args) {
    const result = original.apply(this, args);
    renderStickySessionDiagrams();
    return result;
  };
  wrapped.__stickySessionDiagrams = true;
  window.renderCurrentSessionDock = wrapped;
}

function renderRecentSessionPracticePanel(card, session, sessionIndex) {
  let panel = card.querySelector('.recentSessionPracticePanel');
  if (panel) return panel;
  panel = document.createElement('div');
  panel.className = 'recentSessionPracticePanel';
  const ids = typeof sessionDrillIds === 'function' ? sessionDrillIds(session) : (session.drills || []);
  panel.innerHTML = `<div class="small"><b>Practices in this session</b> · ${ids.length} ${ids.length === 1 ? 'practice' : 'practices'}</div><div class="recentSessionPracticeList"></div>`;
  const list = panel.querySelector('.recentSessionPracticeList');
  ids.forEach((id, index) => {
    const practice = savedSessionPractice(session, index);
    const item = document.createElement('div');
    item.className = 'recentSessionPracticeItem';
    const diagramId = `recent-session-${sessionIndex}-${index}-${Date.now().toString(36)}`;
    item.innerHTML = `<div class="recentSessionPracticeItemHead"><div><b>${index + 1}. ${escapeText(practice?.name || id)}</b><div class="small">${escapeText(practice?.stage || '')}${practice?.time ? ` · ${escapeText(practice.time)}` : ''}</div></div>${practice?.sessionDiagramOverride ? '<span class="sessionDiagramBadge">Session diagram</span>' : ''}</div><div class="recentSessionPracticeDiagram" id="${diagramId}"></div>`;
    list.appendChild(item);
    if (practice) drawWhenReady(diagramId, practice);
  });
  card.appendChild(panel);
  return panel;
}

function enrichRecentSessions() {
  const box = document.getElementById('recentSessionList');
  if (!box) return;
  const sessions = (db.sessions || []).slice().sort((a,b) => (b.date || '').localeCompare(a.date || '')).slice(0,12);
  const cards = [...box.querySelectorAll('.recentSessionCard')];
  cards.forEach((card, visibleIndex) => {
    if (card.querySelector('.recentSessionPracticeToggle')) return;
    const session = sessions[visibleIndex];
    if (!session) return;
    const actualIndex = db.sessions.indexOf(session);
    const actions = card.querySelector('.sessionActions');
    if (!actions) return;
    const view = document.createElement('button');
    view.type = 'button';
    view.className = 'recentSessionPracticeToggle';
    view.textContent = 'View Practices';
    const all = document.createElement('button');
    all.type = 'button';
    all.textContent = '🗺 All Diagrams';
    actions.append(view, all);
    view.addEventListener('click', () => {
      const panel = renderRecentSessionPracticePanel(card, session, actualIndex);
      const opening = !panel.classList.contains('open');
      panel.classList.toggle('open', opening);
      view.classList.toggle('activeStage', opening);
      view.textContent = opening ? 'Hide Practices' : 'View Practices';
    });
    all.addEventListener('click', () => {
      if (typeof window.openAllSessionDiagrams === 'function') window.openAllSessionDiagrams(actualIndex, `${session.theme || 'Session'} · All Diagrams`);
    });
  });
}

function installRecentSessionPracticeViews() {
  const original = window.renderRecentSessions;
  if (typeof original !== 'function' || original.__practiceViews) return;
  const wrapped = function(...args) {
    const result = original.apply(this, args);
    enrichRecentSessions();
    return result;
  };
  wrapped.__practiceViews = true;
  window.renderRecentSessions = wrapped;
}

function install() {
  addStyles();
  installAdvancedBuilderDiagrams();
  installStickySessionDiagrams();
  installRecentSessionPracticeViews();
  enrichAdvancedBuilderRows();
  renderStickySessionDiagrams();
  enrichRecentSessions();
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
}
