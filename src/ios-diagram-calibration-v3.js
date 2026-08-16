const STYLE_ID = 'iosDiagramCalibrationV3Styles';
export const PREVIEW_ARROW_SIZE = 8;
export const STUDIO_ARROW_SIZE = 8;
let documentObserver = null;
let viewportTimer = 0;
let lastViewportSize = '';

export function isIOSLike(userAgent = (typeof navigator !== 'undefined' ? navigator.userAgent : ''), platform = (typeof navigator !== 'undefined' ? navigator.platform : ''), maxTouchPoints = (typeof navigator !== 'undefined' ? navigator.maxTouchPoints : 0)) {
  return /iPad|iPhone|iPod/i.test(String(userAgent || '')) || (String(platform || '') === 'MacIntel' && Number(maxTouchPoints || 0) > 1);
}

function addStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    /* Final diagram calibration. Keep old CSS arrows small if a legacy preview ever appears. */
    .pitchMini .arrow:after,.pitchMini .runline:after{
      right:-5px!important;top:-3px!important;border-left-width:7px!important;border-top-width:4px!important;border-bottom-width:4px!important;
    }
    .pitchMini.iosCalibratedV3{
      width:100%!important;max-width:100%!important;height:auto!important;min-width:0!important;
      -webkit-transform:translateZ(0);transform:translateZ(0);contain:layout paint;
    }
    .pitchMini.iosCalibratedV3 svg{overflow:hidden!important;shape-rendering:geometricPrecision}
    .pitchMini.iosCalibratedV3 .dsObject{backface-visibility:hidden;-webkit-backface-visibility:hidden}
    .pitchMini.iosCalibratedV3 .dsObject span{font-size:clamp(7px,2.15vw,11px)!important;line-height:1!important}
    .pitchMini.iosCalibratedV3 .dsObject .dsRole{font-size:clamp(5.5px,1.65vw,8px)!important;line-height:1!important}
    .pitchMini.iosCalibratedV3 .dsObject.player{border-width:1.5px!important}
    .pitchMini.iosCalibratedV3 .dsObject.goal,.pitchMini.iosCalibratedV3 .dsObject.minigoal{border-width:1.5px!important}

    body.iosDiagramDevice #editor .arrow:after,
    body.iosDiagramDevice #diagramStudioOverlay .arrow:after{
      right:-6px!important;top:-4px!important;border-left-width:8px!important;border-top-width:5px!important;border-bottom-width:5px!important;
    }
    body.iosDiagramDevice #diagramStudioOverlay .dsMovementHit{stroke-width:44!important;stroke-linecap:round!important;stroke-linejoin:round!important}
    body.iosDiagramDevice #diagramStudioOverlay .dsPointHandle{min-width:24px!important;min-height:24px!important}

    @media(max-width:720px){
      .advancedBuilderDiagram>div[id],.recentSessionPracticeDiagram,.reviewPracticeDiagram>div[id],
      .stickyViewerDiagram,.stickyDiagramThumb>div[id],.diagramOverviewCard>div[id],.favGrid>div>div[id],
      .practicePreview>div[id],.sidelinePitch{width:100%!important;max-width:100%!important;min-width:0!important}
      .pitchMini.iosCalibratedV3{border-radius:7px!important}
    }
    @media(max-width:560px) and (pointer:coarse){
      body.iosDiagramDevice #diagramStudioInlineHost .streamlinedInline .dsViewport,
      body.iosDiagramDevice #dsSessionDiagramHost .streamlinedInline .dsViewport{
        min-height:380px!important;flex-basis:380px!important;
      }
    }
  `;
  document.head.appendChild(style);
}

function markerPath(marker, size) {
  const path = marker?.querySelector('path');
  if (!path) return;
  path.setAttribute('d', `M0,0 L0,${size} L${size},${size / 2} z`);
}

export function calibrateSvgMarker(marker, size = PREVIEW_ARROW_SIZE) {
  if (!marker) return false;
  const value = Math.max(6, Math.min(10, Number(size) || PREVIEW_ARROW_SIZE));
  marker.setAttribute('markerWidth', String(value));
  marker.setAttribute('markerHeight', String(value));
  marker.setAttribute('refX', String(value - 0.6));
  marker.setAttribute('refY', String(value / 2));
  marker.setAttribute('markerUnits', 'userSpaceOnUse');
  markerPath(marker, value);
  marker.dataset.calibratedV3 = 'true';
  return true;
}

function movementWidth(path) {
  const stroke = (path.getAttribute('stroke') || '').toLowerCase();
  const dash = path.getAttribute('stroke-dasharray');
  if (stroke === '#fb7185' || stroke.includes('251,113,133')) return 3.8;
  if (stroke === '#fbbf24' || stroke.includes('251,191,36')) return 4;
  if (dash) return 3.4;
  if (!path.getAttribute('marker-end')) return 3;
  return 3.4;
}

export function calibratePreviewPitch(pitch) {
  if (!pitch) return false;
  pitch.classList.add('iosCalibratedV3');
  pitch.querySelectorAll('svg marker').forEach(marker => calibrateSvgMarker(marker, PREVIEW_ARROW_SIZE));
  pitch.querySelectorAll('svg path[stroke]').forEach(path => {
    if (path.closest('marker')) return;
    path.setAttribute('stroke-width', String(movementWidth(path)));
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
  });
  return true;
}

export function calibrateStudioPitch(pitch = (typeof document !== 'undefined' ? document.getElementById('dsPitch') : null)) {
  if (!pitch) return false;
  ['dsArrowHead', 'dsPressHead'].forEach(id => calibrateSvgMarker(pitch.querySelector(`#${id}`), STUDIO_ARROW_SIZE));
  pitch.querySelectorAll('.dsMovementVisible').forEach(path => {
    if (path.classList.contains('press')) path.setAttribute('stroke-width', '4');
    else if (path.classList.contains('shot')) path.setAttribute('stroke-width', '4.2');
    else path.setAttribute('stroke-width', '3.4');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
  });
  return true;
}

function calibrateNode(node) {
  if (!(node instanceof Element)) return;
  if (node.matches('.pitchMini')) calibratePreviewPitch(node);
  node.querySelectorAll?.('.pitchMini').forEach(calibratePreviewPitch);
  if (node.id === 'dsPitch') calibrateStudioPitch(node);
  else if (node.querySelector?.('#dsPitch')) calibrateStudioPitch(node.querySelector('#dsPitch'));
}

function calibrateAll() {
  document.querySelectorAll('.pitchMini').forEach(calibratePreviewPitch);
  calibrateStudioPitch();
}

function installDrawMiniWrapper() {
  const base = window.drawMini;
  if (typeof base !== 'function' || base.__iosCalibratedV3) return;
  const wrapped = function(...args) {
    const result = base.apply(this, args);
    const id = args[0];
    requestAnimationFrame(() => {
      const host = document.getElementById(id);
      host?.querySelectorAll('.pitchMini').forEach(calibratePreviewPitch);
    });
    return result;
  };
  wrapped.__iosCalibratedV3 = true;
  wrapped.__baseDrawMini = base;
  try { drawMini = wrapped; } catch (_) {}
  window.drawMini = wrapped;
  if (window.CoachingOSDiagramPreview) window.CoachingOSDiagramPreview.draw = wrapped;
}

function installDocumentObserver() {
  if (documentObserver) return;
  documentObserver = new MutationObserver(records => {
    let studioChanged = false;
    records.forEach(record => {
      record.addedNodes.forEach(node => {
        if (node.nodeType !== 1) return;
        calibrateNode(node);
        if (node.id === 'dsPitch' || node.querySelector?.('#dsPitch')) studioChanged = true;
      });
    });
    if (studioChanged) requestAnimationFrame(calibrateStudioPitch);
  });
  documentObserver.observe(document.body, { childList:true, subtree:true });
}

function refreshResponsiveViews() {
  const calls = ['renderVisualPicker','renderSessionDrillList','renderPreview','renderRecentSessions','renderArchive'];
  calls.forEach(name => {
    try { if (typeof window[name] === 'function') window[name](); } catch (_) {}
  });
  try { if (typeof window.renderSessionLibrary === 'function' && document.getElementById('sessionLibraryResults')) window.renderSessionLibrary(); } catch (_) {}
  try { if (typeof window.dsFitPitch === 'function') window.dsFitPitch(); } catch (_) {}
  requestAnimationFrame(calibrateAll);
}

function scheduleViewportRefresh() {
  const vv = window.visualViewport;
  const width = Math.round(vv?.width || window.innerWidth || 0);
  const height = Math.round(vv?.height || window.innerHeight || 0);
  const key = `${width}x${height}`;
  if (key === lastViewportSize) return;
  lastViewportSize = key;
  clearTimeout(viewportTimer);
  viewportTimer = setTimeout(refreshResponsiveViews, 120);
}

function installViewportCalibration() {
  window.addEventListener('orientationchange', () => setTimeout(refreshResponsiveViews, 90), { passive:true });
  window.addEventListener('resize', scheduleViewportRefresh, { passive:true });
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', scheduleViewportRefresh, { passive:true });
    window.visualViewport.addEventListener('scroll', () => requestAnimationFrame(calibrateStudioPitch), { passive:true });
  }
}

function install() {
  addStyles();
  if (isIOSLike()) document.body.classList.add('iosDiagramDevice');
  installDrawMiniWrapper();
  installDocumentObserver();
  installViewportCalibration();
  calibrateAll();
  setTimeout(() => { installDrawMiniWrapper(); calibrateAll(); }, 300);
  setTimeout(() => { installDrawMiniWrapper(); calibrateAll(); }, 1000);
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
  else install();
}
