const STYLE_ID = 'diagramEditorPrecisionV2Styles';

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
    x:(clientX - rect.left) * d.w / rect.width,
    y:(clientY - rect.top) * d.h / rect.height
  };
}

function segmentDistance(point, a, b) {
  const ax = Number(a?.x || 0), ay = Number(a?.y || 0);
  const bx = Number(b?.x || 0), by = Number(b?.y || 0);
  const vx = bx - ax, vy = by - ay;
  const wx = point.x - ax, wy = point.y - ay;
  const len2 = vx * vx + vy * vy;
  const t = len2 ? Math.max(0, Math.min(1, (wx * vx + wy * vy) / len2)) : 0;
  return Math.hypot(point.x - (ax + vx * t), point.y - (ay + vy * t));
}

function exactFallbackObject(clientX, clientY) {
  const pitch = document.getElementById('dsPitch');
  const d = dims();
  const point = canvasPoint(clientX, clientY);
  if (!pitch || !d || !point) return null;
  const rect = pitch.getBoundingClientRect();
  const scale = Math.max(d.w / rect.width, d.h / rect.height);
  const objectPad = Math.max(.35, 1.1 * scale);
  const movementPad = Math.max(2.5, 4.5 * scale);

  const matches = objects().filter(object => {
    if (object.type === 'movement') {
      const points = Array.isArray(object.points) ? object.points : [];
      for (let index = 1; index < points.length; index += 1) {
        if (segmentDistance(point, points[index - 1], points[index]) <= movementPad) return true;
      }
      return false;
    }
    const x = Number(object.x || 0), y = Number(object.y || 0);
    const w = Number(object.w || (object.type === 'player' ? 36 : 28));
    const h = Number(object.h || (object.type === 'player' ? 36 : 28));
    const pad = object.type === 'zone' ? 0 : objectPad;
    return point.x >= x - pad && point.x <= x + w + pad && point.y >= y - pad && point.y <= y + h + pad;
  });

  const priority = object => object.type === 'movement' ? 500 : object.type === 'zone' ? 20 : 300;
  const area = object => object.type === 'movement' ? 1 : Math.max(1, Number(object.w || 28) * Number(object.h || 28));
  return matches.sort((a, b) => priority(b) - priority(a) || area(a) - area(b))[0] || null;
}

function directObject(event) {
  const id = event.target?.closest?.('.dsObject,.dsMovementHit')?.dataset?.id;
  return id ? objects().find(object => object.id === id) || null : null;
}

function activeLock() {
  try { return window.__coachDiagramPointerLock || null; }
  catch (_) { return null; }
}

function snapshotSelection(s, objectId) {
  const ids = s?.selectedIds ? [...s.selectedIds] : [objectId];
  return ids.length ? ids : [objectId];
}

function lockPointer(event, objectId, pitch) {
  const s = state();
  window.__coachDiagramPointerLock = {
    pointerId:event.pointerId,
    objectId,
    selectedIds:snapshotSelection(s, objectId),
    primaryId:s?.primaryId || objectId,
    startedAt:typeof performance !== 'undefined' ? performance.now() : Date.now(),
    strict:true
  };
  pitch.classList.add('coachPickupLocked');
  try { pitch.setPointerCapture?.(event.pointerId); } catch (_) {}
}

function releaseLock(pointerId = null) {
  const lock = activeLock();
  if (!lock || (pointerId !== null && lock.pointerId !== pointerId)) return;
  const pitch = document.getElementById('dsPitch');
  try {
    if (pitch?.hasPointerCapture?.(lock.pointerId)) pitch.releasePointerCapture(lock.pointerId);
  } catch (_) {}
  pitch?.classList.remove('coachPickupLocked');
  window.__coachDiagramPointerLock = null;
}

function reassertLockedSelection(event) {
  const lock = activeLock();
  if (!lock) return;
  if (event.pointerId !== lock.pointerId) {
    event.preventDefault();
    event.stopImmediatePropagation();
    return;
  }
  const s = state();
  if (!s || s.drag?.pointerId !== lock.pointerId || s.drag.kind !== 'move') return;
  const expected = lock.selectedIds || [lock.objectId];
  const current = s.selectedIds ? [...s.selectedIds] : [];
  const differs = current.length !== expected.length || expected.some(id => !s.selectedIds?.has(id));
  if (differs) s.selectedIds = new Set(expected);
  if (s.primaryId !== lock.primaryId) s.primaryId = lock.primaryId;
}

function precisionPointerDown(event) {
  if (event.button !== 0) return;
  const pitch = document.getElementById('dsPitch');
  const s = state();
  if (!pitch || !s || s.preview || !pitch.contains(event.target)) return;
  if (pitch.classList.contains('coachPasteArmed') || pitch.classList.contains('coachLineArmed')) return;
  if (event.target?.closest?.('.dsPointHandle,.dsResizeHandle,.dsRotateHandle')) return;

  if (activeLock()) {
    event.preventDefault();
    event.stopImmediatePropagation();
    return;
  }

  const object = directObject(event) || exactFallbackObject(event.clientX, event.clientY);
  if (!object || typeof dsObjectPointerDown !== 'function') return;

  event.preventDefault();
  event.stopImmediatePropagation();
  pitch.classList.remove('coachGroupSelecting');
  dsObjectPointerDown(event, object.id);
  if (s.drag?.kind === 'move' && s.drag.pointerId === event.pointerId) lockPointer(event, object.id, pitch);
}

function pointerUp(event) {
  const lock = activeLock();
  if (!lock) return;
  if (event.pointerId !== lock.pointerId) {
    event.preventDefault();
    event.stopImmediatePropagation();
    return;
  }
  requestAnimationFrame(() => releaseLock(event.pointerId));
}

function pointerCancel(event) {
  const lock = activeLock();
  if (!lock) return;
  if (event.pointerId !== lock.pointerId) {
    event.preventDefault();
    event.stopImmediatePropagation();
    return;
  }
  requestAnimationFrame(() => releaseLock(event.pointerId));
}

function addStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    /* Precise pointer targets: visible object first, only a very small fallback halo. */
    #diagramStudioInlineHost #dsPitch .dsMovementHit,
    #dsSessionDiagramHost #dsPitch .dsMovementHit{
      stroke-width:22!important;
      stroke-linecap:round!important;
      stroke-linejoin:round!important;
    }
    #dsPitch.coachPickupLocked{cursor:grabbing!important}
    #dsPitch.coachPickupLocked .dsObject.selected,
    #dsPitch.coachPickupLocked .dsObject.multiSelected{
      outline:3px solid #7dd3fc!important;
      outline-offset:2px!important;
      box-shadow:0 0 0 2px rgba(56,189,248,.32),0 6px 16px rgba(0,0,0,.35)!important;
    }
    @media(pointer:coarse){
      #diagramStudioInlineHost #dsPitch .dsMovementHit,
      #dsSessionDiagramHost #dsPitch .dsMovementHit{stroke-width:25!important}
    }
  `;
  document.head.appendChild(style);
}

function install() {
  addStyles();
  if (window.__coachPrecisionV2Installed) return;
  window.__coachPrecisionV2Installed = true;
  /* Loaded before the older pickup passes, so exact selection wins at window capture. */
  window.addEventListener('pointerdown', precisionPointerDown, true);
  window.addEventListener('pointermove', reassertLockedSelection, true);
  window.addEventListener('pointerup', pointerUp, true);
  window.addEventListener('pointercancel', pointerCancel, true);
  window.addEventListener('blur', () => releaseLock(), { passive:true });
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
  else install();
}
