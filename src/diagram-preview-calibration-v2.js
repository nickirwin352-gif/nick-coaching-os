const STYLE_ID = 'diagramPreviewCalibrationV2Styles';
const hostStates = new WeakMap();
let markerCounter = 0;

export function previewDataForPractice(practice = {}) {
  const steps = Array.isArray(practice.diagramSteps) ? practice.diagramSteps : [];
  const first = steps[0];
  if (first && Array.isArray(first.diagram)) {
    return { diagram: first.diagram, pitchMode: first.pitchMode || practice.pitchMode || 'full' };
  }
  return { diagram: Array.isArray(practice.diagram) ? practice.diagram : [], pitchMode: practice.pitchMode || 'full' };
}

function parseMode(mode = 'full') {
  try { if (typeof dsParseMode === 'function') return dsParseMode(mode); } catch (_) {}
  const portrait = String(mode || '').startsWith('portrait:');
  return { portrait, core: portrait ? String(mode).slice(9) : String(mode || 'full') };
}

function logicalDimensions(mode = 'full') {
  try { if (typeof dsPitchDimensions === 'function') return dsPitchDimensions(mode); } catch (_) {}
  return parseMode(mode).portrait ? { w:520, h:900 } : { w:900, h:520 };
}

function normalise(value, index) {
  try { if (typeof dsNormaliseObject === 'function') return dsNormaliseObject(value, index); } catch (_) {}
  return value || {};
}

function escapeText(value) {
  try { if (typeof dsEscape === 'function') return dsEscape(value || ''); } catch (_) {}
  return String(value || '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
}

function movementPath(object, sourceDiagram) {
  try { if (typeof dsMovementPathForDiagram === 'function') return dsMovementPathForDiagram(object, sourceDiagram); } catch (_) {}
  const points = Array.isArray(object.points) ? object.points : [];
  if (points.length < 2) return '';
  if (points.length === 3) return `M ${points[0].x} ${points[0].y} Q ${points[1].x} ${points[1].y} ${points[2].x} ${points[2].y}`;
  return points.map((point, index) => `${index ? 'L' : 'M'} ${point.x} ${point.y}`).join(' ');
}

function goalEnd(side) {
  return `<div class="previewSixYard ${side}"></div><div class="previewGoal ${side}"></div><div class="previewPenaltySpot ${side}"></div>`;
}

function fieldMarkup(mode) {
  const { core } = parseMode(mode);
  if (core === 'blank') return '';
  if (core === 'half') return `<div class="previewHalf"></div><div class="previewCentreCircle"></div><div class="previewBox right"></div>${goalEnd('right')}`;
  if (core === 'finalThird') return `<div class="previewFinalThird"></div><div class="previewBox right"></div>${goalEnd('right')}`;
  if (core === 'penalty') return `<div class="previewBox left"></div>${goalEnd('left')}`;

  let markup = `<div class="previewHalf"></div><div class="previewCentreCircle"></div><div class="previewBox left"></div><div class="previewBox right"></div>${goalEnd('left')}${goalEnd('right')}`;
  if (core === 'thirds') markup += '<div class="previewThird a"></div><div class="previewThird b"></div>';
  if (core === 'central') markup += '<div class="previewCentral"></div>';
  if (core === 'wide') markup += '<div class="previewWide left"></div><div class="previewWide right"></div>';
  if (core === 'quarters') markup += '<div class="previewQuarterV"></div><div class="previewQuarterH"></div>';
  return markup;
}

function addStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .pitchMini.calibratedMiniV2{
      position:relative!important;display:block!important;width:100%!important;height:auto!important;max-width:100%!important;max-height:none!important;
      min-width:0!important;min-height:0!important;margin:0 auto!important;overflow:hidden!important;border-radius:10px;
      aspect-ratio:var(--preview-aspect)!important;background:linear-gradient(180deg,#1e7a4c,#166534)!important;
      border:1px solid rgba(255,255,255,.38);box-shadow:inset 0 0 30px rgba(0,0,0,.16);
    }
    .pitchMini.calibratedMiniV2.previewFutsal{background:linear-gradient(180deg,#1976a3,#155b82)!important}
    .pitchMini.calibratedMiniV2>*{box-sizing:border-box}
    .calibratedMiniV2 .previewHalf{position:absolute;left:50%;top:0;bottom:0;width:1.5px;background:rgba(255,255,255,.58);pointer-events:none}
    .calibratedMiniV2 .previewCentreCircle{position:absolute;left:50%;top:50%;width:12.45%;aspect-ratio:1;border:1.5px solid rgba(255,255,255,.58);border-radius:50%;transform:translate(-50%,-50%);pointer-events:none}
    .calibratedMiniV2 .previewBox{position:absolute;top:29.81%;width:10.56%;height:40.38%;border:2px solid rgba(255,255,255,.72);pointer-events:none}
    .calibratedMiniV2 .previewBox.left{left:0;border-left:0}.calibratedMiniV2 .previewBox.right{right:0;border-right:0}
    .calibratedMiniV2 .previewSixYard{position:absolute;top:40.58%;width:4.23%;height:18.85%;border:2px solid rgba(255,255,255,.78);pointer-events:none}
    .calibratedMiniV2 .previewSixYard.left{left:0;border-left:0}.calibratedMiniV2 .previewSixYard.right{right:0;border-right:0}
    .calibratedMiniV2 .previewGoal{position:absolute;top:43.46%;width:1.57%;height:13.08%;border:2px solid rgba(255,255,255,.96);background:repeating-linear-gradient(0deg,rgba(255,255,255,.14) 0 1px,transparent 1px 5px);pointer-events:none}
    .calibratedMiniV2 .previewGoal.left{left:0;border-left:0}.calibratedMiniV2 .previewGoal.right{right:0;border-right:0}
    .calibratedMiniV2 .previewPenaltySpot{position:absolute;top:50%;width:5px;height:5px;margin-top:-2.5px;border-radius:50%;background:rgba(255,255,255,.9);pointer-events:none}
    .calibratedMiniV2 .previewPenaltySpot.left{left:8%}.calibratedMiniV2 .previewPenaltySpot.right{right:8%}
    .calibratedMiniV2 .previewThird{position:absolute;top:0;bottom:0;width:1.5px;background:rgba(255,255,255,.34);pointer-events:none}.calibratedMiniV2 .previewThird.a{left:33.333%}.calibratedMiniV2 .previewThird.b{left:66.666%}
    .calibratedMiniV2 .previewCentral{position:absolute;top:0;bottom:0;left:38%;right:38%;border-left:1.5px dashed rgba(255,255,255,.45);border-right:1.5px dashed rgba(255,255,255,.45);pointer-events:none}
    .calibratedMiniV2 .previewWide{position:absolute;top:0;bottom:0;width:23%;pointer-events:none}.calibratedMiniV2 .previewWide.left{left:0;border-right:1.5px dashed rgba(255,255,255,.45)}.calibratedMiniV2 .previewWide.right{right:0;border-left:1.5px dashed rgba(255,255,255,.45)}
    .calibratedMiniV2 .previewQuarterV,.calibratedMiniV2 .previewQuarterH{position:absolute;background:rgba(255,255,255,.45);pointer-events:none}.calibratedMiniV2 .previewQuarterV{left:50%;top:0;bottom:0;width:1.5px}.calibratedMiniV2 .previewQuarterH{top:50%;left:0;right:0;height:1.5px}
    .calibratedMiniV2 .previewFinalThird{position:absolute;inset:0;background:linear-gradient(90deg,transparent 0 66%,rgba(255,255,255,.035) 66% 100%);pointer-events:none}

    .calibratedMiniV2.portrait .previewHalf{left:0;right:0;top:50%;bottom:auto;width:auto;height:1.5px}
    .calibratedMiniV2.portrait .previewBox{left:29.81%;top:auto;width:40.38%;height:10.56%}
    .calibratedMiniV2.portrait .previewBox.left{top:0;border-top:0;border-left:2px solid rgba(255,255,255,.72)}.calibratedMiniV2.portrait .previewBox.right{top:auto;bottom:0;border-bottom:0;border-right:2px solid rgba(255,255,255,.72)}
    .calibratedMiniV2.portrait .previewSixYard{left:40.58%;top:auto;width:18.85%;height:4.23%}.calibratedMiniV2.portrait .previewSixYard.left{top:0;border-top:0;border-left:2px solid rgba(255,255,255,.78)}.calibratedMiniV2.portrait .previewSixYard.right{top:auto;bottom:0;border-bottom:0;border-right:2px solid rgba(255,255,255,.78)}
    .calibratedMiniV2.portrait .previewGoal{left:43.46%;top:auto;width:13.08%;height:1.57%;background:repeating-linear-gradient(90deg,rgba(255,255,255,.14) 0 1px,transparent 1px 5px)}.calibratedMiniV2.portrait .previewGoal.left{top:0;border-top:0;border-left:2px solid rgba(255,255,255,.96)}.calibratedMiniV2.portrait .previewGoal.right{top:auto;bottom:0;border-bottom:0;border-right:2px solid rgba(255,255,255,.96)}
    .calibratedMiniV2.portrait .previewPenaltySpot{left:50%;top:auto;margin-left:-2.5px;margin-top:0}.calibratedMiniV2.portrait .previewPenaltySpot.left{top:8%}.calibratedMiniV2.portrait .previewPenaltySpot.right{top:auto;bottom:8%}
    .calibratedMiniV2.portrait .previewThird{left:0;right:0;width:auto;height:1.5px}.calibratedMiniV2.portrait .previewThird.a{top:33.333%}.calibratedMiniV2.portrait .previewThird.b{top:66.666%}
    .calibratedMiniV2.portrait .previewCentral{left:0;right:0;top:38%;bottom:38%;border:0;border-top:1.5px dashed rgba(255,255,255,.45);border-bottom:1.5px dashed rgba(255,255,255,.45)}
    .calibratedMiniV2.portrait .previewWide{left:0;right:0;width:auto;height:23%}.calibratedMiniV2.portrait .previewWide.left{top:0;border:0;border-bottom:1.5px dashed rgba(255,255,255,.45)}.calibratedMiniV2.portrait .previewWide.right{top:auto;bottom:0;border:0;border-top:1.5px dashed rgba(255,255,255,.45)}

    .calibratedMiniV2 .dsObject{position:absolute!important;min-width:0!important;min-height:0!important;margin:0!important;box-sizing:border-box!important}
    .calibratedMiniV2 .dsObject.zone{z-index:4!important}.calibratedMiniV2 svg{z-index:12}.calibratedMiniV2 .dsObject:not(.zone){z-index:20!important}
    .calibratedMiniV2 .dsObject span{line-height:1.05}

    /* Contexts can size the host; the pitch always preserves the saved diagram aspect ratio. */
    .advancedBuilderDiagram>div[id],.recentSessionPracticeDiagram,.reviewPracticeDiagram>div[id],.stickyViewerDiagram,.stickyDiagramThumb>div[id],.diagramOverviewCard>div[id],.favGrid>div>div[id]{width:100%;min-width:0}
    @media(max-width:720px){.pitchMini.calibratedMiniV2{border-radius:8px}}
  `;
  document.head.appendChild(style);
}

function renderHost(host, state) {
  if (!host?.isConnected) return;
  const mode = state.mode || 'full';
  const dims = logicalDimensions(mode);
  const parsed = parseMode(mode);
  const source = Array.isArray(state.diagram) ? state.diagram : [];
  const normalized = source.map(normalise);
  const markerId = `coach-mini-arrow-${++markerCounter}`;
  const width = host.clientWidth || host.getBoundingClientRect().width || 320;
  const scale = Math.max(.16, width / dims.w);

  host.innerHTML = '';
  const pitch = document.createElement('div');
  pitch.className = `pitchMini calibratedMiniV2 ${parsed.portrait ? 'portrait ' : ''}${parsed.core === 'futsal' ? 'previewFutsal' : ''}`;
  pitch.style.setProperty('--preview-aspect', `${dims.w} / ${dims.h}`);
  pitch.innerHTML = fieldMarkup(mode);
  host.appendChild(pitch);

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${dims.w} ${dims.h}`);
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  svg.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;overflow:hidden;pointer-events:none';
  svg.innerHTML = `<defs><marker id="${markerId}" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="14" refX="12" refY="5" orient="auto"><path d="M0,0 L0,10 L14,5 z" fill="context-stroke"></path></marker></defs>`;
  pitch.appendChild(svg);

  normalized.forEach(object => {
    if (object.type === 'movement') {
      const pathData = movementPath(object, source);
      if (!pathData) return;
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      const type = object.movementType || 'pass';
      const stroke = type === 'press' ? '#fb7185' : type === 'shot' ? '#fbbf24' : '#ffffff';
      path.setAttribute('d', pathData);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', stroke);
      path.setAttribute('stroke-width', type === 'line' ? '4' : '5');
      path.setAttribute('stroke-linecap', 'round');
      path.setAttribute('stroke-linejoin', 'round');
      if (type === 'run') path.setAttribute('stroke-dasharray', '11 9');
      if (type !== 'line') path.setAttribute('marker-end', `url(#${markerId})`);
      svg.appendChild(path);
      return;
    }

    const element = document.createElement('div');
    element.className = `dsObject ${object.type || ''} ${object.color || ''} ${object.zoneShape || ''}`;
    element.style.left = `${(Number(object.x) || 0) / dims.w * 100}%`;
    element.style.top = `${(Number(object.y) || 0) / dims.h * 100}%`;
    element.style.width = `${(Number(object.w) || 30) / dims.w * 100}%`;
    element.style.height = `${(Number(object.h) || 30) / dims.h * 100}%`;
    element.style.transform = `rotate(${Number(object.rot) || 0}deg)`;
    element.style.transformOrigin = 'center center';
    element.style.fontSize = `${Math.max(6, Math.min(12, 10 * scale))}px`;
    if (object.type === 'player' || object.type === 'txt') {
      element.innerHTML = `<span>${escapeText(object.label || '')}</span>${object.role ? `<span class="dsRole">${escapeText(object.role)}</span>` : ''}`;
    } else if (object.type === 'zone' && object.label) {
      element.innerHTML = `<span>${escapeText(object.label)}</span>`;
    }
    pitch.appendChild(element);
  });
}

function calibratedDrawMini(id, diagram, mode = 'full') {
  const host = document.getElementById(id);
  if (!host) return;
  let state = hostStates.get(host);
  if (!state) {
    state = { diagram:[], mode:'full', observer:null, frame:0 };
    if ('ResizeObserver' in window) {
      state.observer = new ResizeObserver(() => {
        if (!host.isConnected) { state.observer?.disconnect(); return; }
        cancelAnimationFrame(state.frame);
        state.frame = requestAnimationFrame(() => renderHost(host, state));
      });
      state.observer.observe(host);
    }
    hostStates.set(host, state);
  }
  state.diagram = Array.isArray(diagram) ? diagram : [];
  state.mode = mode || 'full';
  renderHost(host, state);
}

function overrideDrawMini() {
  try { drawMini = calibratedDrawMini; } catch (_) {}
  window.drawMini = calibratedDrawMini;
  window.CoachingOSDiagramPreview = { draw: calibratedDrawMini, previewDataForPractice };
}

function refreshVisibleDiagramViews() {
  const calls = ['renderVisualPicker', 'renderSessionDrillList', 'renderPreview', 'renderRecentSessions', 'renderArchive'];
  calls.forEach(name => {
    try { if (typeof window[name] === 'function') window[name](); } catch (_) {}
  });
  try { if (document.getElementById('sessionLibraryResults') && typeof window.renderSessionLibrary === 'function') window.renderSessionLibrary(); } catch (_) {}
}

function install() {
  addStyles();
  overrideDrawMini();
  requestAnimationFrame(refreshVisibleDiagramViews);
  setTimeout(() => { overrideDrawMini(); refreshVisibleDiagramViews(); }, 350);
  window.addEventListener('orientationchange', () => setTimeout(refreshVisibleDiagramViews, 80), { passive:true });
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
  else install();
}
