const STYLE_ID = 'diagramEditorPickupLinePassStyles';
const LINE_BUTTON_ATTR = 'data-coach-basic-line';
let lineMode = false;
let lineDraw = null;
let pitchObserver = null;
let studioObserver = null;
let lastPick = null;

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

function toast(message) {
  try { if (typeof dsToast === 'function') dsToast(message); } catch (_) {}
}

function addStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    /* Normal editing should always feel like a pickup tool, never permanent box-select. */
    #diagramStudioInlineHost .dsViewport,
    #dsSessionDiagramHost .dsViewport,
    #diagramStudioInlineHost #dsPitch,
    #dsSessionDiagramHost #dsPitch{cursor:grab!important}
    #diagramStudioInlineHost #dsPitch .dsObject,
    #dsSessionDiagramHost #dsPitch .dsObject,
    #diagramStudioInlineHost #dsPitch .dsMovementHit,
    #dsSessionDiagramHost #dsPitch .dsMovementHit{cursor:grab!important}
    #diagramStudioInlineHost #dsPitch .dsObject:active,
    #dsSessionDiagramHost #dsPitch .dsObject:active,
    #diagramStudioInlineHost #dsPitch .dsMovementHit:active,
    #dsSessionDiagramHost #dsPitch .dsMovementHit:active{cursor:grabbing!important}

    /* Box-selection cursor appears only after the drag has actually started. */
    #dsPitch.coachGroupSelecting,#dsPitch.coachGroupSelecting *{cursor:crosshair!important}
    #dsPitch.coachLineArmed,#dsPitch.coachLineArmed *{cursor:crosshair!important}
    #dsPitch.coachPasteArmed,#dsPitch.coachPasteArmed *{cursor:copy!important}

    /* Background areas stay visually behind smaller coaching objects. */
    #dsPitch .dsObject.zone{z-index:4!important}
    #dsPitch .dsSvg{z-index:16!important}
    #dsPitch .dsObject.player,#dsPitch .dsObject.ball,#dsPitch .dsObject.cone,
    #dsPitch .dsObject.goal,#dsPitch .dsObject.minigoal,#dsPitch .dsObject.pole,
    #dsPitch .dsObject.marker,#dsPitch .dsObject.mannequin,#dsPitch .dsObject.txt{z-index:30!important}

    /* Plain marking line: same generous pickup area, no arrow head. */
    #dsPitch .dsMovementVisible.line{stroke:white!important;stroke-width:3.5!important;stroke-dasharray:none!important;marker-end:none!important}
    #dsPitch .dsMovementVisible.line.dsMovementSelected{stroke:#38bdf8!important}
    .coachLinePreview{position:fixed;z-index:50010;height:3px;background:white;border-radius:999px;pointer-events:none;transform-origin:0 50%;box-shadow:0 0 0 1px rgba(0,0,0,.22)}

    #diagramCoachWorkflowBar [${LINE_BUTTON_ATTR}].activeStage{background:rgba(56,189,248,.14)!important;border-color:var(--sky)!important;color:#bae6fd!important}
  `;
  document.head.appendChild(style);
}

function canvasPoint(clientX, clientY) {
  const pitch = document.getElementById('dsPitch');
  const d = dims();
  if (!pitch || !d) return null;
  const rect = pitch.getBoundingClientRect();
  if (!rect.width || !rect.height) return null;
  return {
    x: Math.max(0, Math.min(d.w, (clientX - rect.left) * d.w / rect.width)),
    y: Math.max(0, Math.min(d.h, (clientY - rect.top) * d.h / rect.height))
  };
}

function objectBounds(object) {
  if (Array.isArray(object.points) && object.points.length) {
    const xs = object.points.map(point => Number(point.x || 0));
    const ys = object.points.map(point => Number(point.y || 0));
    return { left: Math.min(...xs), right: Math.max(...xs), top: Math.min(...ys), bottom: Math.max(...ys) };
  }
  const left = Number(object.x || 0);
  const top = Number(object.y || 0);
  const width = Number(object.w || 28);
  const height = Number(object.h || 28);
  return { left, right: left + width, top, bottom: top + height };
}

function pointInside(point, bounds, padding = 0) {
  return point.x >= bounds.left - padding && point.x <= bounds.right + padding && point.y >= bounds.top - padding && point.y <= bounds.bottom + padding;
}

function segmentDistance(point, a, b) {
  const ax = Number(a.x || 0), ay = Number(a.y || 0);
  const bx = Number(b.x || 0), by = Number(b.y || 0);
  const vx = bx - ax, vy = by - ay;
  const wx = point.x - ax, wy = point.y - ay;
  const len2 = vx * vx + vy * vy;
  const t = len2 ? Math.max(0, Math.min(1, (wx * vx + wy * vy) / len2)) : 0;
  const dx = point.x - (ax + vx * t), dy = point.y - (ay + vy * t);
  return Math.hypot(dx, dy);
}

function movementNear(object, point, tolerance) {
  const pts = Array.isArray(object.points) ? object.points : [];
  if (pts.length < 2) return false;
  for (let index = 1; index < pts.length; index += 1) {
    if (segmentDistance(point, pts[index - 1], pts[index]) <= tolerance) return true;
  }
  return false;
}

function priority(object) {
  if (object.type === 'movement') return 120;
  if (object.type === 'zone') return 10;
  if (object.type === 'txt') return 90;
  return 100;
}

function areaOf(object) {
  const bounds = objectBounds(object);
  return Math.max(1, (bounds.right - bounds.left) * (bounds.bottom - bounds.top));
}

function candidatesAt(clientX, clientY) {
  const point = canvasPoint(clientX, clientY);
  const pitch = document.getElementById('dsPitch');
  const d = dims();
  if (!point || !pitch || !d) return [];
  const rect = pitch.getBoundingClientRect();
  const tolerance = Math.max(10, 22 * Math.max(d.w / rect.width, d.h / rect.height));
  return objects().filter(object => {
    if (object.type === 'movement') return movementNear(object, point, tolerance);
    return pointInside(point, objectBounds(object), object.type === 'zone' ? 0 : tolerance * .22);
  }).sort((a, b) => priority(b) - priority(a) || areaOf(a) - areaOf(b));
}

function targetId(event) {
  return event.target?.closest?.('.dsObject,.dsMovementHit')?.dataset?.id || null;
}

function samePickSpot(event, candidates) {
  if (!lastPick) return false;
  if (performance.now() - lastPick.time > 900) return false;
  if (Math.hypot(event.clientX - lastPick.x, event.clientY - lastPick.y) > 8) return false;
  return lastPick.signature === candidates.map(item => item.id).join('|');
}

function smartPickup(event) {
  if (event.button !== 0 || lineMode) return;
  const pitch = document.getElementById('dsPitch');
  const s = state();
  if (!pitch || !s || s.preview || !pitch.contains(event.target)) return;
  if (pitch.classList.contains('coachPasteArmed')) return;
  if (event.target?.closest?.('.dsPointHandle,.dsResizeHandle,.dsRotateHandle')) return;

  const candidates = candidatesAt(event.clientX, event.clientY);
  if (candidates.length < 2) return;
  const signature = candidates.map(item => item.id).join('|');
  let index = 0;
  if (samePickSpot(event, candidates)) index = (lastPick.index + 1) % candidates.length;
  const chosen = candidates[index];
  lastPick = { x:event.clientX, y:event.clientY, time:performance.now(), signature, index };

  const currentTargetId = targetId(event);
  if (index === 0 && currentTargetId === chosen.id) return;
  if (typeof dsObjectPointerDown !== 'function') return;

  event.preventDefault();
  event.stopImmediatePropagation();
  dsObjectPointerDown(event, chosen.id);
  if (index > 0 || chosen.type === 'zone') {
    const label = chosen.type === 'movement' ? (chosen.movementType === 'line' ? 'line' : 'arrow') : chosen.type;
    toast(`Picked ${label} · click the same spot again to cycle stacked items`);
  }
}

function polishPlainLines() {
  document.querySelectorAll('#dsPitch .dsMovementVisible.line').forEach(path => path.removeAttribute('marker-end'));
}

function syncGroupCursor() {
  const pitch = document.getElementById('dsPitch');
  if (!pitch) return;
  pitch.classList.toggle('coachGroupSelecting', !!document.querySelector('.coachDragSelectBox'));
}

function drawLinePreview(clientX, clientY) {
  if (!lineDraw?.preview) return;
  const dx = clientX - lineDraw.startClientX;
  const dy = clientY - lineDraw.startClientY;
  const length = Math.hypot(dx, dy);
  const angle = Math.atan2(dy, dx) * 180 / Math.PI;
  Object.assign(lineDraw.preview.style, {
    left: `${lineDraw.startClientX}px`,
    top: `${lineDraw.startClientY}px`,
    width: `${length}px`,
    transform: `translateY(-1.5px) rotate(${angle}deg)`
  });
}

function setLineMode(enabled) {
  lineMode = !!enabled;
  if (!lineMode && lineDraw) cancelLineDraw();
  const pitch = document.getElementById('dsPitch');
  pitch?.classList.toggle('coachLineArmed', lineMode);
  const button = document.querySelector(`#diagramCoachWorkflowBar [${LINE_BUTTON_ATTR}]`);
  button?.classList.toggle('activeStage', lineMode);
  if (lineMode) toast('Line tool ready — drag anywhere on the pitch to mark an area');
}

function toggleLineMode() {
  setLineMode(!lineMode);
}

function startLineDraw(event) {
  if (!lineMode || event.button !== 0) return;
  const pitch = document.getElementById('dsPitch');
  const s = state();
  if (!pitch || !s || s.preview || !pitch.contains(event.target)) return;
  if (event.target?.closest?.('.dsPointHandle,.dsResizeHandle,.dsRotateHandle')) return;
  const startPitch = canvasPoint(event.clientX, event.clientY);
  if (!startPitch) return;

  event.preventDefault();
  event.stopImmediatePropagation();
  const preview = document.createElement('div');
  preview.className = 'coachLinePreview';
  document.body.appendChild(preview);
  lineDraw = {
    pointerId:event.pointerId,
    startClientX:event.clientX,
    startClientY:event.clientY,
    startPitch,
    preview
  };
  drawLinePreview(event.clientX, event.clientY);
}

function moveLineDraw(event) {
  if (!lineDraw || event.pointerId !== lineDraw.pointerId) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  drawLinePreview(event.clientX, event.clientY);
}

function finishLineDraw(event) {
  if (!lineDraw || event.pointerId !== lineDraw.pointerId) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  const current = lineDraw;
  lineDraw = null;
  current.preview?.remove();
  const endPitch = canvasPoint(event.clientX, event.clientY) || current.startPitch;
  const clientDistance = Math.hypot(event.clientX - current.startClientX, event.clientY - current.startClientY);
  if (clientDistance >= 8) {
    try { if (typeof dsPushHistory === 'function') dsPushHistory(); } catch (_) {}
    const movement = {
      id: typeof dsUid === 'function' ? dsUid('movement') : `movement-${Date.now().toString(36)}`,
      type:'movement', movementType:'line', points:[current.startPitch, endPitch], layer:'movement', z:12
    };
    objects().push(movement);
    const s = state();
    if (s?.selectedIds) s.selectedIds = new Set([movement.id]);
    if (s) s.primaryId = movement.id;
    try { if (typeof dsRenderAll === 'function') dsRenderAll(); } catch (_) {}
    toast('Line added — drag it to move it or use the end handles to adjust it');
  }
  setLineMode(false);
  setTimeout(() => { polishPlainLines(); ensureLineButton(); }, 0);
}

function cancelLineDraw() {
  lineDraw?.preview?.remove();
  lineDraw = null;
}

function ensureLineButton() {
  const bar = document.getElementById('diagramCoachWorkflowBar');
  if (!bar) return;
  let button = bar.querySelector(`[${LINE_BUTTON_ATTR}]`);
  if (!button) {
    button = document.createElement('button');
    button.type = 'button';
    button.setAttribute(LINE_BUTTON_ATTR, '');
    button.textContent = '— Line';
    button.title = 'Draw a plain line to mark channels, boundaries or practice areas';
    button.addEventListener('click', toggleLineMode);
    const progression = bar.querySelector('[data-coach-progression]');
    bar.insertBefore(button, progression || bar.querySelector('.coachWorkflowHint'));
  }
  button.classList.toggle('activeStage', lineMode);
}

function observePitch() {
  const pitch = document.getElementById('dsPitch');
  if (!pitch) return;
  pitchObserver?.disconnect();
  pitchObserver = new MutationObserver(() => {
    polishPlainLines();
    ensureLineButton();
    requestAnimationFrame(syncGroupCursor);
  });
  pitchObserver.observe(pitch, { childList:true, subtree:true });
  polishPlainLines();
}

function ensureUi() {
  const studio = document.getElementById('diagramStudioOverlay');
  if (!studio?.classList.contains('open')) return;
  ensureLineButton();
  observePitch();
  polishPlainLines();
  syncGroupCursor();
}

function observeStudio() {
  const studio = document.getElementById('diagramStudioOverlay');
  if (!studio || studioObserver) return;
  studioObserver = new MutationObserver(() => {
    if (!studio.classList.contains('open')) return;
    setTimeout(ensureUi, 0);
    setTimeout(ensureUi, 100);
  });
  studioObserver.observe(studio, { attributes:true, attributeFilter:['class'] });
}

function installPointerHandlers() {
  if (window.__diagramPickupLinePointerHandlers) return;
  window.__diagramPickupLinePointerHandlers = true;

  /* Window capture runs before the older document-level group-selection handler. */
  window.addEventListener('pointerdown', startLineDraw, true);
  window.addEventListener('pointerdown', smartPickup, true);
  window.addEventListener('pointermove', moveLineDraw, true);
  window.addEventListener('pointerup', finishLineDraw, true);
  window.addEventListener('pointercancel', event => {
    if (lineDraw && event.pointerId === lineDraw.pointerId) {
      cancelLineDraw();
      setLineMode(false);
    }
  }, true);

  document.addEventListener('pointermove', () => requestAnimationFrame(syncGroupCursor), true);
  document.addEventListener('pointerup', () => requestAnimationFrame(syncGroupCursor), true);
  document.addEventListener('pointercancel', () => requestAnimationFrame(syncGroupCursor), true);
}

function installKeyboard() {
  if (document.__diagramPickupLineKeyboard) return;
  document.__diagramPickupLineKeyboard = true;
  document.addEventListener('keydown', event => {
    const studio = document.getElementById('diagramStudioOverlay');
    if (!studio?.classList.contains('open') || event.target?.matches?.('input,textarea,select')) return;
    if (event.key.toLowerCase() === 'l' && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      toggleLineMode();
    }
    if (event.key === 'Escape' && lineMode) {
      event.preventDefault();
      setLineMode(false);
      toast('Line tool cancelled');
    }
  });
}

function install() {
  addStyles();
  installPointerHandlers();
  installKeyboard();
  observeStudio();
  ensureUi();
  setTimeout(() => { observeStudio(); ensureUi(); }, 250);
  setTimeout(() => { observeStudio(); ensureUi(); }, 900);
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
  else install();
}
