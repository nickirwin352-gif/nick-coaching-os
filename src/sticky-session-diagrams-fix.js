const STYLE_ID = 'stickySessionDiagramFixStyles';
const STRIP_ID = 'currentSessionDockDiagramStrip';
let renderQueued = false;

function addStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    #${STRIP_ID}{
      grid-column:1/-1;
      display:flex!important;
      gap:8px;
      width:100%;
      min-width:0;
      overflow-x:auto;
      overflow-y:hidden;
      padding:6px 1px 2px;
      margin-top:2px;
      scrollbar-width:thin;
    }
    #${STRIP_ID}[hidden]{display:none!important}
    #${STRIP_ID} .stickyDiagramThumb{
      flex:0 0 132px;
      min-width:132px;
      padding:0;
      overflow:hidden;
      text-align:left;
      border:1px solid var(--border);
      border-radius:10px;
      background:var(--surface-3);
    }
    #${STRIP_ID} .stickyDiagramThumb:hover{border-color:var(--turf)}
    #${STRIP_ID} .stickyDiagramThumb .pitchMini{
      display:block!important;
      width:100%!important;
      max-width:none!important;
      height:76px!important;
      margin:0!important;
      border:0!important;
      border-radius:0!important;
    }
    #${STRIP_ID} .stickyDiagramLabel{
      padding:5px 7px 2px;
      font-size:10.5px;
      font-weight:800;
      color:var(--text);
      white-space:nowrap;
      overflow:hidden;
      text-overflow:ellipsis;
    }
    #${STRIP_ID} .stickyDiagramMeta{
      padding:0 7px 5px;
      font-size:9px;
      color:var(--text-dim);
      white-space:nowrap;
      overflow:hidden;
      text-overflow:ellipsis;
    }
    #${STRIP_ID} .stickyDiagramEmpty{
      color:var(--text-dim);
      font-size:12px;
      padding:3px 1px;
    }
    @media(max-width:850px){
      #${STRIP_ID}{display:flex!important;width:100%;max-width:100%;}
      #${STRIP_ID} .stickyDiagramThumb{flex-basis:112px;min-width:112px}
      #${STRIP_ID} .stickyDiagramThumb .pitchMini{height:64px!important}
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

function diagramSignature() {
  const drills = getPlannerDrills();
  return drills.map((id, index) => {
    const practice = getPractice(index);
    const override = practice && practice.sessionDiagramOverride ? '1' : '0';
    const count = Array.isArray(practice?.diagram) ? practice.diagram.length : 0;
    return `${id}:${override}:${count}`;
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
    button.title = `Open practice ${index + 1} diagram`;
    const diagramId = `sticky-fixed-${index}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,5)}`;
    button.innerHTML = `<div id="${diagramId}"></div><div class="stickyDiagramLabel">${index + 1}. ${escapeText(practice.name || id)}</div><div class="stickyDiagramMeta">${escapeText(practice.stage || '')}${practice.sessionDiagramOverride ? ' · Edited diagram' : ''}</div>`;
    button.addEventListener('click', () => {
      try {
        if (typeof openSessionDiagramStudio === 'function') openSessionDiagramStudio(index);
        else if (typeof openCurrentSessionDrawer === 'function') openCurrentSessionDrawer();
      } catch (_) {}
    });
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
