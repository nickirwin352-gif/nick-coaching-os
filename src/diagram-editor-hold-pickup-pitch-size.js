const STYLE_ID = 'diagramEditorHoldPickupPitchSizeStyles';
const OBJECT_LINE_ID = 'diagramObjectLineTool';
let studioObserver = null;
let paletteObserver = null;

function state() {
  try { return typeof dsState !== 'undefined' ? dsState : null; }
  catch (_) { return null; }
}

function objects() {
  try { return typeof dsObjects === 'function' ? dsObjects() : []; }
  catch (_) { return []; }
}

function dims() {
  try {
    if (typeof dsPitchDimensions !== 'function' || typeof dsCurrentStep !== 'function') return null;
    return dsPitchDimensions(dsCurrentStep().pitchMode);
  } catch (_) { return null; }
}

function canvasPoint(clientX, clientY) {
  const pitch = document.getElementById('dsPitch');
  const d = dims();
  if (!pitch || !d) return null;
  const rect = pitch.getBoundingClientRect();
  if (!rect.width || !rect.height) return null;
  return {
    x: (clientX - rect.left) * d.w / rect.width,
    y: (clientY - rect.top) * d.h / rect.height
  };
}

function pointInObject(object, point, tolerance) {
  if (object.type === 'movement' && Array.isArray(object.points) && object.points.length > 1) {
    for (let i = 1; i < object.points.length; i += 1) {
      const a = object.points[i - 1], b = object.points[i];
      const vx = b.x - a.x, vy = b.y - a.y;
      const wx = point.x - a.x, wy = point.y - a.y;
      const len2 = vx * vx + vy * vy;
      const t = len2 ? Math.max(0, Math.min(1, (wx * vx + wy * vy) / len2)) : 0;
      const dx = point.x - (a.x + vx * t), dy = point.y - (a.y + vy * t);
      if (Math.hypot(dx, dy) <= tolerance) return true;
    }
    return false;
  }
  const x = Number(object.x || 0), y = Number(object.y || 0);
  const w = Number(object.w || (object.type === 'player' ? 36 : 28));
  const h = Number(object.h || (object.type === 'player' ? 36 : 28));
  return point.x >= x - tolerance && point.x <= x + w + tolerance && point.y >= y - tolerance && point.y <= y + h + tolerance;
}

function objectPriority(object) {
  if (object.type === 'movement') return 500;
  if (object.type === 'zone') return 20;
  return 300;
}

function objectArea(object) {
  if (object.type === 'movement') return 1;
  return Math.max(1, Number(object.w || 28) * Number(object.h || 28));
}

function directObject(event) {
  const id = event.target?.closest?.('.dsObject,.dsMovementHit')?.dataset?.id;
  return id ? objects().find(object => object.id === id) || null : null;
}

function objectAt(clientX, clientY) {
  const pitch = document.getElementById('dsPitch');
  const d = dims();
  const point = canvasPoint(clientX, clientY);
  if (!pitch || !d || !point) return null;
  const rect = pitch.getBoundingClientRect();
  const scale = Math.max(d.w / rect.width, d.h / rect.height);
  const movementTolerance = Math.max(7, 15 * scale);
  const objectTolerance = Math.max(1.5, 4.5 * scale);
  return objects()
    .filter(object => pointInObject(object, point, object.type === 'movement' ? movementTolerance : object.type === 'zone' ? 0 : objectTolerance))
    .sort((a, b) => objectPriority(b) - objectPriority(a) || objectArea(a) - objectArea(b))[0] || null;
}

function activePointerLock() {
  try { return window.__coachDiagramPointerLock || null; }
  catch (_) { return null; }
}

function lockPickupPointer(event, objectId, pitch) {
  if (!pitch) return;
  window.__coachDiagramPointerLock = {
    pointerId:event.pointerId,
    objectId,
    startedAt:typeof performance !== 'undefined' ? performance.now() : Date.now()
  };
  pitch.classList.add('coachPickupLocked');
  try { pitch.setPointerCapture?.(event.pointerId); } catch (_) {}
}

function releasePickupPointer(pointerId = null) {
  const lock = activePointerLock();
  if (!lock || (pointerId !== null && lock.pointerId !== pointerId)) return;
  const pitch = document.getElementById('dsPitch');
  try {
    if (pitch?.hasPointerCapture?.(lock.pointerId)) pitch.releasePointerCapture(lock.pointerId);
  } catch (_) {}
  pitch?.classList.remove('coachPickupLocked');
  window.__coachDiagramPointerLock = null;
}

function addStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    /* Pitch-first workspace: give the coaching picture the majority of the screen. */
    #editor{max-width:1780px!important;padding-left:12px!important;padding-right:12px!important}
    #editor .grid.two{grid-template-columns:minmax(285px,330px) minmax(0,1fr)!important;gap:12px!important}
    #diagramStudioInlineHost .diagramStudioOverlay.streamlinedInline{
      height:calc(100dvh - 86px)!important;min-height:800px!important;max-height:none!important;
    }
    #diagramStudioInlineHost .streamlinedInline .dsViewport{
      min-height:560px!important;flex:1 1 560px!important;
    }
    #diagramStudioInlineHost .streamlinedInline .dsHeader{min-height:50px!important;padding:6px 9px!important}
    #diagramStudioInlineHost .streamlinedInline .dsToolPanel{padding:5px 7px!important}
    #diagramStudioInlineHost .streamlinedInline .dsQuickInspector{min-height:34px!important;padding:4px 7px!important}
    #diagramStudioInlineHost .streamlinedInline .dsStatusBar{min-height:24px!important;height:24px!important;padding:3px 7px!important}
    #diagramStudioInlineHost .streamlinedInline .dsStepBar{min-height:46px!important;padding:5px 7px!important}

    /* Default behaviour is pickup. Group-select only becomes visible after empty-pitch drag starts. */
    #dsPitch,#dsPitch .dsObject,#dsPitch .dsMovementHit{cursor:grab!important}
    #dsPitch .dsObject:active,#dsPitch .dsMovementHit:active{cursor:grabbing!important}
    #dsPitch.coachGroupSelecting,#dsPitch.coachGroupSelecting *{cursor:crosshair!important}
    #dsPitch.coachLineArmed,#dsPitch.coachLineArmed *{cursor:crosshair!important}
    #dsPitch.coachPasteArmed,#dsPitch.coachPasteArmed *{cursor:copy!important}

    /* The resize control is deliberately tiny and circular so it cannot cover small cones/markers. */
    #diagramStudioInlineHost #dsPitch .dsResizeHandle,
    #dsSessionDiagramHost #dsPitch .dsResizeHandle{
      width:9px!important;height:9px!important;min-width:9px!important;min-height:9px!important;
      border-radius:50%!important;border-width:1.5px!important;
      transform:translate(4.5px,4.5px)!important;
      box-shadow:0 2px 5px rgba(0,0,0,.42)!important;
    }

    /* While a pointer is held, make the locked selection visually definite. */
    #dsPitch.coachPickupLocked{cursor:grabbing!important}
    #dsPitch.coachPickupLocked .dsObject.selected,
    #dsPitch.coachPickupLocked .dsObject.multiSelected{
      outline-width:3px!important;outline-color:#7dd3fc!important;
      box-shadow:0 0 0 2px rgba(56,189,248,.28),0 5px 14px rgba(0,0,0,.32)!important;
    }
    #dsPitch.coachPickupLocked .dsMovementVisible.dsMovementSelected{
      filter:drop-shadow(0 0 6px rgba(56,189,248,.95))!important;
    }

    /* The old Line control is removed from the workflow strip; it now lives with Objects. */
    #diagramCoachWorkflowBar [data-coach-basic-line]{display:none!important}
    #${OBJECT_LINE_ID}{display:flex;align-items:center;justify-content:center;gap:4px;min-width:54px}

    @media(pointer:coarse){
      #diagramStudioInlineHost #dsPitch .dsResizeHandle,
      #dsSessionDiagramHost #dsPitch .dsResizeHandle{
        width:10px!important;height:10px!important;min-width:10px!important;min-height:10px!important;
        transform:translate(4px,4px)!important;
      }
    }
    @media(max-width:1000px){
      #editor .grid.two{grid-template-columns:minmax(270px,310px) minmax(0,1fr)!important}
      #diagramStudioInlineHost .diagramStudioOverlay.streamlinedInline{height:calc(100dvh - 78px)!important;min-height:740px!important}
      #diagramStudioInlineHost .streamlinedInline .dsViewport{min-height:500px!important;flex-basis:500px!important}
    }
    @media(max-width:850px){
      #editor .grid.two{grid-template-columns:1fr!important}
      #diagramStudioInlineHost .diagramStudioOverlay.streamlinedInline{height:780px!important;min-height:700px!important}
      #diagramStudioInlineHost .streamlinedInline .dsViewport{min-height:440px!important;flex-basis:440px!important}
    }
    @media(max-width:560px){
      #editor{padding-left:6px!important;padding-right:6px!important}
      #diagramStudioInlineHost .diagramStudioOverlay.streamlinedInline{height:730px!important;min-height:650px!important}
      #diagramStudioInlineHost .streamlinedInline .dsViewport{min-height:390px!important;flex-basis:390px!important}
    }
  `;
  document.head.appendChild(style);
}

function forceObjectPickup(event) {
  if (event.button !== 0) return;
  const pitch = document.getElementById('dsPitch');
  const s = state();
  if (!pitch || !s || s.preview || !pitch.contains(event.target)) return;
  if (pitch.classList.contains('coachPasteArmed') || pitch.classList.contains('coachLineArmed')) return;
  if (event.target?.closest?.('.dsPointHandle,.dsResizeHandle,.dsRotateHandle')) return;

  const activeLock = activePointerLock();
  if (activeLock && activeLock.pointerId !== event.pointerId) {
    event.preventDefault();
    event.stopImmediatePropagation();
    return;
  }

  /* Prefer the object the pointer is genuinely over. Hit-testing is only a fallback. */
  const object = directObject(event) || objectAt(event.clientX, event.clientY);
  if (!object || typeof dsObjectPointerDown !== 'function') return;

  /* Pressing/holding over any object always begins pickup; box-select is reserved for true empty pitch. */
  event.preventDefault();
  event.stopImmediatePropagation();
  pitch.classList.remove('coachGroupSelecting');
  dsObjectPointerDown(event, object.id);
  if (s.drag?.kind === 'move' && s.drag.pointerId === event.pointerId) lockPickupPointer(event, object.id, pitch);
}

function guardLockedPointerMove(event) {
  const lock = activePointerLock();
  if (!lock || lock.pointerId === event.pointerId) return;
  event.preventDefault();
  event.stopImmediatePropagation();
}

function guardLockedPointerUp(event) {
  const lock = activePointerLock();
  if (!lock) return;
  if (lock.pointerId !== event.pointerId) {
    event.preventDefault();
    event.stopImmediatePropagation();
    return;
  }
  requestAnimationFrame(() => releasePickupPointer(event.pointerId));
}

function guardLockedPointerCancel(event) {
  const lock = activePointerLock();
  if (!lock) return;
  if (lock.pointerId !== event.pointerId) {
    event.preventDefault();
    event.stopImmediatePropagation();
    return;
  }
  const s = state();
  if (s?.drag?.pointerId === event.pointerId) {
    s.drag = null;
    s.guides = [];
    try { if (typeof dsRenderCanvas === 'function') dsRenderCanvas(); } catch (_) {}
  }
  releasePickupPointer(event.pointerId);
}

function keepGroupCursorHonest() {
  const pitch = document.getElementById('dsPitch');
  if (!pitch) return;
  const selecting = !!document.querySelector('.coachDragSelectBox');
  pitch.classList.toggle('coachGroupSelecting', selecting);
}

function findObjectsPaletteRow() {
  const panel = document.getElementById('dsToolPanel');
  if (!panel) return null;
  const rows = [...panel.querySelectorAll('.dsPaletteRow')];
  if (!rows.length) return null;
  const labelled = rows.find(row => /object|player|equipment/i.test(row.textContent || ''));
  return labelled || rows[0];
}

function ensureObjectLineButton() {
  const row = findObjectsPaletteRow();
  if (!row) return;
  let button = document.getElementById(OBJECT_LINE_ID);
  if (!button) {
    button = document.createElement('button');
    button.id = OBJECT_LINE_ID;
    button.type = 'button';
    button.className = 'dsPaletteButton';
    button.innerHTML = '<span aria-hidden="true">—</span><span>Line</span>';
    button.title = 'Plain line for marking areas, channels and boundaries';
    button.addEventListener('click', () => {
      const hiddenLineButton = document.querySelector('#diagramCoachWorkflowBar [data-coach-basic-line]');
      if (hiddenLineButton) hiddenLineButton.click();
    });
  }
  if (button.parentElement !== row) row.appendChild(button);
  const hiddenLineButton = document.querySelector('#diagramCoachWorkflowBar [data-coach-basic-line]');
  button.classList.toggle('activeStage', !!hiddenLineButton?.classList.contains('activeStage'));
}

function observePalette() {
  const panel = document.getElementById('dsToolPanel');
  if (!panel) return;
  paletteObserver?.disconnect();
  paletteObserver = new MutationObserver(() => requestAnimationFrame(ensureObjectLineButton));
  paletteObserver.observe(panel, { childList:true, subtree:true });
  ensureObjectLineButton();
}

function ensureUi() {
  const studio = document.getElementById('diagramStudioOverlay');
  if (!studio?.classList.contains('open')) {
    releasePickupPointer();
    return;
  }
  observePalette();
  ensureObjectLineButton();
  keepGroupCursorHonest();
  try { if (typeof dsFitPitch === 'function') dsFitPitch(); } catch (_) {}
}

function observeStudio() {
  const studio = document.getElementById('diagramStudioOverlay');
  if (!studio || studioObserver) return;
  studioObserver = new MutationObserver(() => {
    if (!studio.classList.contains('open')) {
      releasePickupPointer();
      return;
    }
    setTimeout(ensureUi, 0);
    setTimeout(ensureUi, 100);
  });
  studioObserver.observe(studio, { attributes:true, attributeFilter:['class'] });
}

function install() {
  addStyles();
  /* Window capture beats the older document-level group-selection handler. */
  window.addEventListener('pointerdown', forceObjectPickup, true);
  window.addEventListener('pointermove', guardLockedPointerMove, true);
  window.addEventListener('pointerup', guardLockedPointerUp, true);
  window.addEventListener('pointercancel', guardLockedPointerCancel, true);
  window.addEventListener('blur', () => releasePickupPointer(), { passive:true });
  document.addEventListener('pointermove', () => requestAnimationFrame(keepGroupCursorHonest), true);
  document.addEventListener('pointerup', () => requestAnimationFrame(keepGroupCursorHonest), true);
  document.addEventListener('pointercancel', () => requestAnimationFrame(keepGroupCursorHonest), true);
  observeStudio();
  ensureUi();
  setTimeout(ensureUi, 250);
  setTimeout(ensureUi, 900);
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
  else install();
}
