const STYLE_ID = 'diagramConeColourStyles';
const CONTROL_ID = 'dsConeColourControl';
const COLOURS = {
  orange:{label:'Orange',top:'#fb923c',bottom:'#ea580c',edge:'#fed7aa'},
  red:{label:'Red',top:'#ef4444',bottom:'#b91c1c',edge:'#fecaca'},
  blue:{label:'Blue',top:'#3b82f6',bottom:'#1d4ed8',edge:'#bfdbfe'},
  yellow:{label:'Yellow',top:'#facc15',bottom:'#ca8a04',edge:'#fef08a'},
  white:{label:'White',top:'#f8fafc',bottom:'#cbd5e1',edge:'#ffffff'}
};
let pitchObserver = null;
let inspectorObserver = null;
let studioObserver = null;
let refreshFrame = 0;

function state() {
  try { return typeof dsState !== 'undefined' ? dsState : null; }
  catch (_) { return null; }
}

function objects() {
  try { return typeof dsObjects === 'function' ? dsObjects() : []; }
  catch (_) { return []; }
}

function selectedCone() {
  const s = state();
  if (!s?.primaryId || !s.selectedIds?.has(s.primaryId)) return null;
  const object = objects().find(item => item.id === s.primaryId);
  return object?.type === 'cone' ? object : null;
}

function coneColour(object) {
  const value = String(object?.color || 'orange').toLowerCase();
  return COLOURS[value] ? value : 'orange';
}

function addStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  const coneRules = Object.entries(COLOURS).map(([key,colour]) => `
    #dsPitch .dsObject.cone.${key},
    .calibratedMiniV2 .dsObject.cone.${key},
    .pitchMini .dsObject.cone.${key}{
      background:linear-gradient(180deg,${colour.top},${colour.bottom})!important;
      border-bottom-color:${colour.edge}!important;
    }`).join('');
  style.textContent = `
    ${coneRules}
    #${CONTROL_ID}{display:flex;align-items:center;gap:5px;flex-wrap:wrap;margin-left:auto;padding-left:8px}
    #${CONTROL_ID} .coneColourLabel{font-size:10px;font-weight:800;color:var(--text-dim);white-space:nowrap;margin-right:2px}
    #${CONTROL_ID} button{
      width:24px!important;height:24px!important;min-width:24px!important;min-height:24px!important;
      padding:0!important;border-radius:50%!important;border:2px solid rgba(255,255,255,.28)!important;
      box-shadow:0 2px 6px rgba(0,0,0,.28)!important;position:relative;
    }
    #${CONTROL_ID} button:after{content:'';position:absolute;inset:4px;border-radius:50%;background:var(--cone-chip)}
    #${CONTROL_ID} button.activeStage{border-color:#fff!important;box-shadow:0 0 0 2px var(--sky),0 2px 7px rgba(0,0,0,.35)!important}
    @media(max-width:700px){
      #${CONTROL_ID}{width:100%;margin-left:0;padding-left:0;margin-top:4px}
      #${CONTROL_ID} button{width:27px!important;height:27px!important;min-width:27px!important;min-height:27px!important}
    }
  `;
  document.head.appendChild(style);
}

function setConeColour(colour) {
  const cone = selectedCone();
  if (!cone || !COLOURS[colour] || coneColour(cone) === colour) return;
  try { if (typeof dsPushHistory === 'function') dsPushHistory(); } catch (_) {}
  cone.color = colour;
  try { if (typeof dsRenderCanvas === 'function') dsRenderCanvas(); } catch (_) {}
  try { if (typeof dsRenderInspector === 'function') dsRenderInspector(); } catch (_) {}
  try { if (typeof dsRenderStatus === 'function') dsRenderStatus(); } catch (_) {}
  try { if (typeof dsToast === 'function') dsToast(`${COLOURS[colour].label} cone`); } catch (_) {}
  queueRefresh();
}

function makeControl(cone) {
  const control = document.createElement('div');
  control.id = CONTROL_ID;
  control.innerHTML = '<span class="coneColourLabel">Cone colour</span>';
  const current = coneColour(cone);
  Object.entries(COLOURS).forEach(([key,colour]) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.coneColour = key;
    button.title = `${colour.label} cone`;
    button.setAttribute('aria-label', `${colour.label} cone`);
    button.style.setProperty('--cone-chip', colour.top);
    button.classList.toggle('activeStage', key === current);
    button.addEventListener('pointerdown', event => event.stopPropagation());
    button.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      setConeColour(key);
    });
    control.appendChild(button);
  });
  return control;
}

function ensureControl() {
  const existing = document.getElementById(CONTROL_ID);
  const cone = selectedCone();
  if (!cone) {
    existing?.remove();
    return;
  }
  const inspector = document.querySelector('#diagramStudioOverlay .dsQuickInspector') || document.querySelector('#dsSessionDiagramHost .dsQuickInspector');
  if (!inspector) return;
  if (!existing || existing.parentElement !== inspector) {
    existing?.remove();
    inspector.appendChild(makeControl(cone));
    return;
  }
  const current = coneColour(cone);
  existing.querySelectorAll('[data-cone-colour]').forEach(button => {
    button.classList.toggle('activeStage', button.dataset.coneColour === current);
  });
}

function ensureConeClasses() {
  const byId = new Map(objects().filter(item => item.type === 'cone').map(item => [item.id, coneColour(item)]));
  document.querySelectorAll('#dsPitch .dsObject.cone[data-id]').forEach(element => {
    const colour = byId.get(element.dataset.id) || 'orange';
    Object.keys(COLOURS).forEach(key => element.classList.toggle(key, key === colour));
  });
}

function queueRefresh() {
  cancelAnimationFrame(refreshFrame);
  refreshFrame = requestAnimationFrame(() => {
    refreshFrame = 0;
    ensureConeClasses();
    ensureControl();
  });
}

function watchPitch() {
  const pitch = document.getElementById('dsPitch');
  if (!pitch || typeof MutationObserver === 'undefined') return;
  pitchObserver?.disconnect();
  pitchObserver = new MutationObserver(queueRefresh);
  pitchObserver.observe(pitch, { childList:true, subtree:false });
}

function watchInspector() {
  const inspector = document.querySelector('#diagramStudioOverlay .dsQuickInspector') || document.querySelector('#dsSessionDiagramHost .dsQuickInspector');
  if (!inspector || typeof MutationObserver === 'undefined') return;
  inspectorObserver?.disconnect();
  inspectorObserver = new MutationObserver(queueRefresh);
  inspectorObserver.observe(inspector, { childList:true, subtree:false });
}

function ensureUi() {
  watchPitch();
  watchInspector();
  queueRefresh();
}

function watchStudio() {
  const studio = document.getElementById('diagramStudioOverlay');
  if (!studio || studioObserver || typeof MutationObserver === 'undefined') return;
  studioObserver = new MutationObserver(() => {
    if (studio.classList.contains('open')) {
      setTimeout(ensureUi, 0);
      setTimeout(ensureUi, 100);
    } else {
      document.getElementById(CONTROL_ID)?.remove();
    }
  });
  studioObserver.observe(studio, { attributes:true, attributeFilter:['class'] });
}

function install() {
  addStyles();
  watchStudio();
  ensureUi();
  setTimeout(ensureUi, 300);
  setTimeout(ensureUi, 900);
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
  else install();
}
