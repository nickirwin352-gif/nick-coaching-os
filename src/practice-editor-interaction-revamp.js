const STYLE_ID = 'practiceEditorInteractionRevampStyles';
let pitchObserver = null;
let viewportResizeObserver = null;
let fitQueued = false;

function addStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    /* Keep Diagram Studio simple: one large fitted pitch, no manual zoom/pan controls. */
    #diagramStudioOverlay .dsZoomControls{display:none!important}
    #diagramStudioOverlay .dsStatusBar{justify-content:flex-start!important;min-height:31px;height:31px;padding-inline:10px}
    #diagramStudioOverlay .dsViewport{touch-action:none;overscroll-behavior:contain}

    /* Give the Add/Edit practice diagram as much useful screen space as possible. */
    #editor .grid.two>.streamlinedStudioCard{
      position:sticky;
      top:116px;
      align-self:start;
      min-height:0;
      padding:8px!important;
    }
    #diagramStudioInlineHost .diagramStudioOverlay.streamlinedInline{
      height:calc(100dvh - 132px)!important;
      min-height:620px!important;
      max-height:none!important;
      border-radius:14px!important;
    }
    #diagramStudioInlineHost .streamlinedInline .dsHeader{height:48px!important;padding:6px 8px!important}
    #diagramStudioInlineHost .streamlinedInline .dsToolPanel{padding-block:6px!important}
    #diagramStudioInlineHost .streamlinedInline .dsQuickInspector{min-height:38px!important}
    #diagramStudioInlineHost .streamlinedInline .dsStepBar{min-height:48px!important;padding:5px 7px!important}
    #diagramStudioInlineHost .streamlinedInline .dsViewport{min-height:0!important}

    /* Smaller, cleaner legacy arrow tips too. */
    #editor .arrow:after{
      right:-6px!important;
      top:-4px!important;
      border-left-width:8px!important;
      border-top-width:6px!important;
      border-bottom-width:6px!important;
    }

    @media(max-width:850px){
      #editor .grid.two>.streamlinedStudioCard{position:relative;top:auto}
      #diagramStudioInlineHost .diagramStudioOverlay.streamlinedInline{
        height:78dvh!important;
        min-height:560px!important;
      }
    }
    @media(max-height:760px) and (min-width:851px){
      #diagramStudioInlineHost .diagramStudioOverlay.streamlinedInline{
        height:calc(100dvh - 112px)!important;
        min-height:520px!important;
      }
    }
  `;
  document.head.appendChild(style);
}

function studioIsOpen() {
  const studio = document.getElementById('diagramStudioOverlay');
  return !!studio?.classList.contains('open');
}

function setSmoothDragDefaults() {
  try {
    if (typeof dsState === 'undefined' || !dsState) return;
    dsState.snap = false;
    dsState.panMode = false;
    dsState.panX = 0;
    dsState.panY = 0;
    const panButton = document.getElementById('dsPanBtn');
    panButton?.classList.remove('activeStage');
  } catch (_) {}
}

function shrinkArrowheads() {
  const pitch = document.getElementById('dsPitch');
  if (!pitch) return;
  ['dsArrowHead', 'dsPressHead'].forEach(id => {
    const marker = pitch.querySelector(`#${id}`);
    if (!marker) return;
    marker.setAttribute('markerWidth', '7');
    marker.setAttribute('markerHeight', '7');
    marker.setAttribute('refX', '6.4');
    marker.setAttribute('refY', '3.5');
    marker.setAttribute('markerUnits', 'userSpaceOnUse');
    const path = marker.querySelector('path');
    if (path) path.setAttribute('d', 'M0,0 L0,7 L7,3.5 z');
  });
}

function installPitchObserver() {
  const pitch = document.getElementById('dsPitch');
  if (!pitch) return;
  if (pitchObserver) pitchObserver.disconnect();
  pitchObserver = new MutationObserver(() => shrinkArrowheads());
  pitchObserver.observe(pitch, { childList: true, subtree: true });
  shrinkArrowheads();
}

function fitPitchLarge() {
  if (!studioIsOpen()) return;
  try {
    if (typeof dsState === 'undefined' || !dsState) return;
    const viewport = document.getElementById('dsViewport');
    if (!viewport || typeof dsPitchDimensions !== 'function' || typeof dsCurrentStep !== 'function') return;
    const dims = dsPitchDimensions(dsCurrentStep().pitchMode);
    const horizontalRoom = Math.max(120, viewport.clientWidth - 14);
    const verticalRoom = Math.max(120, viewport.clientHeight - 14);
    const scale = Math.max(.25, Math.min(2.5, horizontalRoom / dims.w, verticalRoom / dims.h));
    dsState.zoom = scale;
    dsState.panX = 0;
    dsState.panY = 0;
    if (typeof dsApplyTransform === 'function') dsApplyTransform();
  } catch (_) {}
}

function scheduleFit() {
  if (fitQueued) return;
  fitQueued = true;
  requestAnimationFrame(() => {
    fitQueued = false;
    fitPitchLarge();
  });
}

function replaceFitFunction() {
  if (typeof window.dsFitPitch !== 'function' || window.dsFitPitch.__largeFixedPitch) return;
  const replacement = function() {
    setSmoothDragDefaults();
    fitPitchLarge();
  };
  replacement.__largeFixedPitch = true;
  window.dsFitPitch = replacement;
}

function throttleGlobalDuringDrag(name) {
  const original = window[name];
  if (typeof original !== 'function' || original.__smoothDragThrottle) return;
  let frame = 0;
  let queuedThis = null;
  let queuedArgs = null;
  const wrapped = function(...args) {
    let dragging = false;
    try { dragging = typeof dsState !== 'undefined' && !!dsState?.drag; } catch (_) {}
    if (!dragging) {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      queuedArgs = null;
      queuedThis = null;
      return original.apply(this, args);
    }
    queuedThis = this;
    queuedArgs = args;
    if (!frame) {
      frame = requestAnimationFrame(() => {
        frame = 0;
        const callThis = queuedThis;
        const callArgs = queuedArgs || [];
        queuedThis = null;
        queuedArgs = null;
        original.apply(callThis, callArgs);
      });
    }
  };
  wrapped.__smoothDragThrottle = true;
  window[name] = wrapped;
}

function disableWheelZoom() {
  if (document.__practiceEditorWheelZoomDisabled) return;
  document.__practiceEditorWheelZoomDisabled = true;
  document.addEventListener('wheel', event => {
    if (!event.target?.closest?.('#dsViewport')) return;
    /* Stop Diagram Studio's wheel listener, but leave the browser default alone so normal page scrolling still works. */
    event.stopImmediatePropagation();
  }, { capture: true, passive: true });
}

function watchStudio() {
  const studio = document.getElementById('diagramStudioOverlay');
  if (!studio || studio.__interactionRevampObserver) return;
  const observer = new MutationObserver(() => {
    if (!studio.classList.contains('open')) return;
    setSmoothDragDefaults();
    installPitchObserver();
    scheduleFit();
  });
  observer.observe(studio, { attributes: true, attributeFilter: ['class'] });
  studio.__interactionRevampObserver = observer;
}

function watchViewportSize() {
  const viewport = document.getElementById('dsViewport');
  if (!viewport || typeof ResizeObserver === 'undefined') return;
  viewportResizeObserver?.disconnect();
  viewportResizeObserver = new ResizeObserver(() => scheduleFit());
  viewportResizeObserver.observe(viewport);
}

function install() {
  addStyles();
  replaceFitFunction();
  throttleGlobalDuringDrag('dsRenderCanvas');
  throttleGlobalDuringDrag('dsRenderInspector');
  disableWheelZoom();
  watchStudio();
  watchViewportSize();
  installPitchObserver();
  setSmoothDragDefaults();
  scheduleFit();
  window.addEventListener('resize', scheduleFit, { passive: true });
  setTimeout(() => { replaceFitFunction(); watchStudio(); watchViewportSize(); installPitchObserver(); scheduleFit(); }, 250);
  setTimeout(() => { replaceFitFunction(); watchStudio(); watchViewportSize(); installPitchObserver(); scheduleFit(); }, 900);
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
}
