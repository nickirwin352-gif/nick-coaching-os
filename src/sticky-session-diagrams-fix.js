const STYLE_ID = 'stickySessionDiagramFixStyles';
const STRIP_ID = 'currentSessionDockDiagramStrip';
const VIEWER_ID = 'stickySessionDiagramViewer';
let renderQueued = false;

function addStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    #currentSessionDockPills{display:none!important}
    #${STRIP_ID}{
      grid-column:1/-1;
      display:flex!important;
      gap:10px;
      width:100%;
      min-width:0;
      overflow-x:auto;
      overflow-y:hidden;
      padding:8px 1px 3px;
      margin-top:4px;
      scrollbar-width:thin;
    }
    #${STRIP_ID}[hidden]{display:none!important}
    #${STRIP_ID} .stickyDiagramThumb{
      flex:0 0 188px;
      min-width:188px;
      padding:0;
      overflow:hidden;
      text-align:left;
      border:1px solid var(--border);
      border-radius:12px;
      background:var(--surface-3);
      box-shadow:0 7px 18px rgba(0,0,0,.18);
    }
    #${STRIP_ID} .stickyDiagramThumb:hover{border-color:var(--turf)}
    #${STRIP_ID} .stickyDiagramThumb .pitchMini{
      display:block!important;
      width:100%!important;
      max-width:none!important;
      height:106px!important;
      margin:0!important;
      border:0!important;
      border-radius:0!important;
    }
    #${STRIP_ID} .stickyDiagramLabel{
      padding:7px 9px 2px;
      font-size:12px;
      font-weight:800;
      color:var(--text);
      white-space:nowrap;
      overflow:hidden;
      text-overflow:ellipsis;
    }
    #${STRIP_ID} .stickyDiagramMeta{
      padding:0 9px 7px;
      font-size:10px;
      color:var(--text-dim);
      white-space:nowrap;
      overflow:hidden;
      text-overflow:ellipsis;
    }
    #${STRIP_ID} .stickyDiagramEmpty{color:var(--text-dim);font-size:12px;padding:3px 1px}

    #${VIEWER_ID}{position:fixed;inset:0;z-index:24000;display:none;align-items:center;justify-content:center;padding:18px;background:rgba(3,7,18,.82);backdrop-filter:blur(8px)}
    #${VIEWER_ID}.open{display:flex}
    #${VIEWER_ID} .stickyViewerCard{width:min(900px,96vw);max-height:92dvh;overflow:auto;background:var(--surface);border:1px solid var(--border);border-radius:18px;box-shadow:0 28px 80px rgba(0,0,0,.55)}
    #${VIEWER_ID} .stickyViewerHeader{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;padding:16px 18px;border-bottom:1px solid var(--border-soft)}
    #${VIEWER_ID} .stickyViewerHeader h3{margin:0 0 4px;font-size:18px}
    #${VIEWER_ID} .stickyViewerHeader .small{margin:0}
    #${VIEWER_ID} .stickyViewerDiagram{padding:16px}
    #${VIEWER_ID} .stickyViewerDiagram .pitchMini{width:100%!important;max-width:none!important;height:min(54vw,480px)!important;min-height:260px;margin:0!important}
    #${VIEWER_ID} .stickyViewerActions{display:flex;justify-content:flex-end;gap:9px;flex-wrap:wrap;padding:0 16px 16px}
    #${VIEWER_ID} .stickyViewerCloseX{flex:none;min-width:42px}

    @media(max-width:850px){
      #${STRIP_ID}{display:flex!important;width:100%;max-width:100%;gap:9px}
      #${STRIP_ID} .stickyDiagramThumb{flex-basis:158px;min-width:158px}
      #${STRIP_ID} .stickyDiagramThumb .pitchMini{height:90px!important}
      #${VIEWER_ID}{padding:10px}
      #${VIEWER_ID} .stickyViewerDiagram .pitchMini{height:52vw!important;min-height:220px}
    }
    @media(max-width:520px){
      #${STRIP_ID} .stickyDiagramThumb{flex-basis:148px;min-width:148px}
      #${STRIP_ID} .stickyDiagramThumb .pitchMini{height:84px!important}
      #${VIEWER_ID} .stickyViewerHeader{padding:13px}
      #${VIEWER_ID} .stickyViewerDiagram{padding:10px}
      #${VIEWER_ID} .stickyViewerActions{padding:0 10px 10px}
      #${VIEWER_ID} .stickyViewerDiagram .pitchMini{height:58vw!important;min-height:200px}
    }
  `;
  document.head.appendChild(style);
}

function getPlannerDrills() {
  try { return Array.isArray(plannerDrills) ? plannerDrills : []; }
  catch (_) { return []; }
}

function getPractice(index) {
  try {
    if (typeof dsCurrentPlannerPractice === 'function') return dsCurrentPlannerPractice(index);
  } catch (_) {}
  try {
    const drills = getPlannerDrills();
    return typeof get === 'function' ? get(drills[index]) : null;
  } catch (_) { return null; }
}

function escapeText(value) {
  try { return escapeHtml(String(value ?? '')); }
  catch (_) { return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
}

function ensureStrip() {
  const dock = document.querySelector('.currentSessionDock');
  if (!dock) return null;
  let strip = document.getElementById(STRIP_ID);
  if (!strip) {
    strip = document.createElement('div');
    strip.id = STRIP_ID;
    strip.setAttribute('aria-label', 'Current session practice diagrams');
    const actions = dock.querySelector('.currentSessionDockActions');
    if (actions) dock.insertBefore(strip, actions);
    else dock.appendChild(strip);
  }
  return strip;
}

function ensureViewer() {
  let viewer = document.getElementById(VIEWER_ID);
  if (viewer) return viewer;
  viewer = document.createElement('div');
  viewer.id = VIEWER_ID;
  viewer.setAttribute('role', 'dialog');
  viewer.setAttribute('aria-modal', 'true');
  viewer.innerHTML = `
    <div class="stickyViewerCard">
      <div class="stickyViewerHeader">
        <div><h3 id="stickyViewerTitle">Practice diagram</h3><p class="small" id="stickyViewerMeta"></p></div>
        <button type="button" class="stickyViewerCloseX" data-sticky-viewer-close aria-label="Close diagram">✕</button>
      </div>
      <div class="stickyViewerDiagram" id="stickyViewerDiagram"></div>
      <div class="stickyViewerActions">
        <button type="button" data-sticky-viewer-close>Close</button>
        <button type="button" class="primary" id="stickyViewerEdit">Edit Diagram</button>
      </div>
    </div>`;
  viewer.addEventListener('click', event => {
    if (event.target === viewer || event.target.closest?.('[data-sticky-viewer-close]')) closeViewer();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && viewer.classList.contains('open')) closeViewer();
  });
  document.body.appendChild(viewer);
  return viewer;
}

function closeViewer() {
  const viewer = document.getElementById(VIEWER_ID);
  if (!viewer) return;
  viewer.classList.remove('open');
  document.body.style.overflow = viewer.dataset.previousOverflow || '';
}

function openViewer(index) {
  const practice = getPractice(index);
  if (!practice) return;
  const viewer = ensureViewer();
  const title = viewer.querySelector('#stickyViewerTitle');
  const meta = viewer.querySelector('#stickyViewerMeta');
  const diagramHost = viewer.querySelector('#stickyViewerDiagram');
  const edit = viewer.querySelector('#stickyViewerEdit');
  title.textContent = `${index + 1}. ${practice.name || 'Practice'}`;
  meta.textContent = [practice.stage, practice.time, practice.sessionDiagramOverride ? 'Session-edited diagram' : 'Master practice diagram'].filter(Boolean).join(' · ');
  diagramHost.innerHTML = '';
  viewer.dataset.previousOverflow = document.body.style.overflow || '';
  viewer.classList.add('open');
  document.body.style.overflow = 'hidden';
  edit.onclick = () => {
    closeViewer();
    try {
      if (typeof window.enterStickyDiagramEdit === 'function') window.enterStickyDiagramEdit();
      if (typeof openSessionDiagramStudio === 'function') openSessionDiagramStudio(index);
      else document.body.classList.remove('stickyDiagramEditing');
    } catch (_) {
      document.body.classList.remove('stickyDiagramEditing');
    }
  };
  requestAnimationFrame(() => {
    try {
      if (typeof drawMini === 'function') drawMini('stickyViewerDiagram', practice.diagram || [], practice.pitchMode || 'full');
    } catch (_) {}
  });
}

function diagramSignature() {
  const drills = getPlannerDrills();
  return drills.map((id, index) => {
    const practice = getPractice(index);
    const override = practice && practice.sessionDiagramOverride ? '1' : '0';
    const diagram = Array.isArray(practice?.diagram) ? practice.diagram : [];
    const first = diagram[0] ? JSON.stringify(diagram[0]).slice(0,80) : '';
    return `${id}:${override}:${diagram.length}:${first}`;
  }).join('|');
}

function drawMiniSafe(id, practice) {
  requestAnimationFrame(() => {
    try {
      if (typeof drawMini === 'function') drawMini(id, practice?.diagram || [], practice?.pitchMode || 'full');
    } catch (_) {}
  });
}

function renderStrip(force = false) {
  addStyles();
  const strip = ensureStrip();
  if (!strip) return;
  const drills = getPlannerDrills();
  const signature = diagramSignature();
  if (!force && strip.dataset.signature === signature) return;
  strip.dataset.signature = signature;
  strip.innerHTML = '';

  if (!drills.length) {
    strip.innerHTML = '<span class="stickyDiagramEmpty">Your current session diagrams will appear here.</span>';
    return;
  }

  drills.forEach((id, index) => {
    const practice = getPractice(index);
    if (!practice) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'stickyDiagramThumb';
    button.title = `View practice ${index + 1} diagram`;
    const diagramId = `sticky-fixed-${index}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,5)}`;
    button.innerHTML = `<div id="${diagramId}"></div><div class="stickyDiagramLabel">${index + 1}. ${escapeText(practice.name || id)}</div><div class="stickyDiagramMeta">${escapeText(practice.stage || '')}${practice.sessionDiagramOverride ? ' · Edited diagram' : ''}</div>`;
    button.addEventListener('click', () => openViewer(index));
    strip.appendChild(button);
    drawMiniSafe(diagramId, practice);
  });
}

function scheduleRender(force = false) {
  if (renderQueued) return;
  renderQueued = true;
  requestAnimationFrame(() => {
    renderQueued = false;
    renderStrip(force);
  });
}

function observeDock() {
  const dock = document.querySelector('.currentSessionDock');
  if (!dock || dock.__stickyDiagramFixObserver) return;
  const observer = new MutationObserver(mutations => {
    if (mutations.some(m => m.target.closest?.(`#${STRIP_ID}`))) return;
    scheduleRender(true);
  });
  observer.observe(dock, { childList:true, subtree:true, characterData:true });
  dock.__stickyDiagramFixObserver = observer;
}

function wrapRenderFunction() {
  const original = window.renderCurrentSessionDock;
  if (typeof original !== 'function' || original.__dedicatedStickyDiagramFix) return;
  const wrapped = function(...args) {
    const result = original.apply(this, args);
    scheduleRender(true);
    return result;
  };
  wrapped.__dedicatedStickyDiagramFix = true;
  window.renderCurrentSessionDock = wrapped;
}

function install() {
  addStyles();
  ensureViewer();
  wrapRenderFunction();
  renderStrip(true);
  observeDock();
  setTimeout(() => { renderStrip(true); observeDock(); }, 150);
  setTimeout(() => { renderStrip(true); observeDock(); }, 700);
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
  else install();
}
