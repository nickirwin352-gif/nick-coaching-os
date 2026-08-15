const STYLE_ID = 'diagramGroupCopyToolsStyles';
const TOOLBAR_ID = 'diagramGroupCopyTools';
let selectMode = false;
let dragState = null;

function addStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    #${TOOLBAR_ID}{
      display:flex;
      align-items:center;
      gap:6px;
      flex-wrap:wrap;
      padding:7px 8px;
      border-bottom:1px solid var(--border-soft);
      background:var(--surface-2);
    }
    #${TOOLBAR_ID} button{padding:7px 9px;font-size:11px;white-space:nowrap}
    #${TOOLBAR_ID} button.activeStage{background:var(--turf-dim);border-color:var(--turf);color:var(--turf)}
    #${TOOLBAR_ID} .groupCopyCount{font-size:10.5px;color:var(--text-dim);margin-left:auto;white-space:nowrap}
    #dsViewport.groupSelectArmed{cursor:crosshair!important}
    #dsViewport.groupSelectArmed *{cursor:crosshair!important}
    .dsGroupSelectionBox{
      position:fixed;
      z-index:40000;
      pointer-events:none;
      border:2px solid var(--sky);
      background:rgba(56,189,248,.13);
      border-radius:5px;
      box-shadow:0 0 0 1px rgba(56,189,248,.16);
    }
    @media(max-width:700px){
      #${TOOLBAR_ID}{gap:5px;padding:6px}
      #${TOOLBAR_ID} button{padding:8px 8px;font-size:10.5px}
      #${TOOLBAR_ID} .groupCopyCount{width:100%;margin-left:0}
    }
  `;
  document.head.appendChild(style);
}

function getState() {
  try { return typeof dsState !== 'undefined' ? dsState : null; }
  catch (_) { return null; }
}

function getObjects() {
  try { return typeof dsObjects === 'function' ? dsObjects() : []; }
  catch (_) { return []; }
}

function getDims() {
  try {
    if (typeof dsPitchDimensions !== 'function' || typeof dsCurrentStep !== 'function') return null;
    return dsPitchDimensions(dsCurrentStep().pitchMode);
  } catch (_) { return null; }
}

function selectedObjects() {
  const state = getState();
  if (!state?.selectedIds) return [];
  const ids = state.selectedIds;
  return getObjects().filter(object => ids.has(object.id));
}

function selectedCount() {
  return selectedObjects().length;
}

function updateToolbar() {
  const toolbar = document.getElementById(TOOLBAR_ID);
  if (!toolbar) return;
  toolbar.querySelector('[data-group-select]')?.classList.toggle('activeStage', selectMode);
  const count = toolbar.querySelector('.groupCopyCount');
  if (count) {
    const n = selectedCount();
    count.textContent = n ? `${n} selected · copy them together` : 'Select a group, then copy it';
  }
  toolbar.querySelectorAll('[data-copy-axis]').forEach(button => {
    button.disabled = selectedCount() === 0;
  });
  document.getElementById('dsViewport')?.classList.toggle('groupSelectArmed', selectMode);
}

function ensureToolbar() {
  const main = document.querySelector('#diagramStudioOverlay .dsMain');
  const viewport = document.getElementById('dsViewport');
  if (!main || !viewport) return null;
  let toolbar = document.getElementById(TOOLBAR_ID);
  if (!toolbar) {
    toolbar = document.createElement('div');
    toolbar.id = TOOLBAR_ID;
    toolbar.innerHTML = `
      <button type="button" data-group-select>▱ Select Group</button>
      <button type="button" data-copy-axis="x" title="Duplicate the selected setup onto the other left/right side">Copy ↔ Other Side</button>
      <button type="button" data-copy-axis="y" title="Duplicate the selected setup onto the other top/bottom half">Copy ↕ Other Half</button>
      <button type="button" data-copy-axis="xy" title="Duplicate the selected setup into the diagonally opposite quarter">Copy ⇲ Opposite Quarter</button>
      <span class="groupCopyCount">Select a group, then copy it</span>`;
    toolbar.querySelector('[data-group-select]').addEventListener('click', () => {
      selectMode = !selectMode;
      updateToolbar();
    });
    toolbar.querySelectorAll('[data-copy-axis]').forEach(button => {
      button.addEventListener('click', () => copySelection(button.dataset.copyAxis));
    });
    main.insertBefore(toolbar, viewport);
  }
  updateToolbar();
  return toolbar;
}

function cloneValue(value) {
  try { return typeof dsClone === 'function' ? dsClone(value) : JSON.parse(JSON.stringify(value)); }
  catch (_) { return value; }
}

function newId(prefix) {
  try { if (typeof dsUid === 'function') return dsUid(prefix); }
  catch (_) {}
  return `${prefix || 'obj'}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`;
}

function mirrorRotation(rotation, axis) {
  const r = Number(rotation || 0);
  if (axis === 'x') return 180 - r;
  if (axis === 'y') return -r;
  return r + 180;
}

function mirrorObject(source, axis, dims, idMap) {
  const copy = cloneValue(source);
  copy.id = idMap.get(source.id);

  if (Array.isArray(copy.points)) {
    copy.points = copy.points.map(point => ({
      ...point,
      x: axis.includes('x') ? dims.w - point.x : point.x,
      y: axis.includes('y') ? dims.h - point.y : point.y
    }));
  } else {
    const width = Number(copy.w || 0);
    const height = Number(copy.h || 0);
    if (axis.includes('x')) copy.x = dims.w - Number(copy.x || 0) - width;
    if (axis.includes('y')) copy.y = dims.h - Number(copy.y || 0) - height;
    if ('rot' in copy) copy.rot = mirrorRotation(copy.rot, axis);
  }

  if (copy.attachStart && idMap.has(copy.attachStart)) copy.attachStart = idMap.get(copy.attachStart);
  else if (copy.attachStart) copy.attachStart = null;
  if (copy.attachEnd && idMap.has(copy.attachEnd)) copy.attachEnd = idMap.get(copy.attachEnd);
  else if (copy.attachEnd) copy.attachEnd = null;

  return copy;
}

function copySelection(axis) {
  const state = getState();
  const dims = getDims();
  const selected = selectedObjects();
  if (!state || !dims || !selected.length) return;

  try { if (typeof dsPushHistory === 'function') dsPushHistory(); } catch (_) {}

  const idMap = new Map(selected.map(object => [object.id, newId(object.type || 'obj')]));
  const copies = selected.map(object => mirrorObject(object, axis, dims, idMap));
  getObjects().push(...copies);
  state.selectedIds = new Set(copies.map(object => object.id));
  state.primaryId = copies[0]?.id || null;
  selectMode = false;

  try { if (typeof dsRenderAll === 'function') dsRenderAll(); }
  catch (_) {
    try { if (typeof dsRenderCanvas === 'function') dsRenderCanvas(); } catch (_) {}
  }
  try {
    if (typeof dsToast === 'function') {
      const label = axis === 'x' ? 'other side' : axis === 'y' ? 'other half' : 'opposite quarter';
      dsToast(`Copied ${copies.length} item${copies.length === 1 ? '' : 's'} to the ${label}`);
    }
  } catch (_) {}
  requestAnimationFrame(() => { ensureToolbar(); updateToolbar(); });
}

function pointFromClient(clientX, clientY) {
  const pitch = document.getElementById('dsPitch');
  const dims = getDims();
  if (!pitch || !dims) return null;
  const rect = pitch.getBoundingClientRect();
  return {
    x: Math.max(0, Math.min(dims.w, (clientX - rect.left) * dims.w / rect.width)),
    y: Math.max(0, Math.min(dims.h, (clientY - rect.top) * dims.h / rect.height))
  };
}

function objectBounds(object) {
  if (Array.isArray(object.points) && object.points.length) {
    const xs = object.points.map(point => point.x);
    const ys = object.points.map(point => point.y);
    return { left: Math.min(...xs), right: Math.max(...xs), top: Math.min(...ys), bottom: Math.max(...ys) };
  }
  const left = Number(object.x || 0);
  const top = Number(object.y || 0);
  return {
    left,
    top,
    right: left + Number(object.w || 20),
    bottom: top + Number(object.h || 20)
  };
}

function intersects(a, b) {
  return a.left <= b.right && a.right >= b.left && a.top <= b.bottom && a.bottom >= b.top;
}

function startGroupSelect(event) {
  if (!selectMode) return;
  const viewport = document.getElementById('dsViewport');
  if (!viewport || !viewport.contains(event.target)) return;
  if (event.target.closest?.('.dsObject,.dsPointHandle,.dsResizeHandle,.dsRotateHandle,.dsMovementHit')) return;

  const startPitch = pointFromClient(event.clientX, event.clientY);
  if (!startPitch) return;
  event.preventDefault();
  event.stopImmediatePropagation();

  const box = document.createElement('div');
  box.className = 'dsGroupSelectionBox';
  document.body.appendChild(box);
  dragState = {
    pointerId: event.pointerId,
    startClientX: event.clientX,
    startClientY: event.clientY,
    startPitch,
    box
  };
  drawSelectionBox(event.clientX, event.clientY);
}

function drawSelectionBox(clientX, clientY) {
  if (!dragState) return;
  const left = Math.min(dragState.startClientX, clientX);
  const top = Math.min(dragState.startClientY, clientY);
  const width = Math.abs(clientX - dragState.startClientX);
  const height = Math.abs(clientY - dragState.startClientY);
  Object.assign(dragState.box.style, {
    left: `${left}px`, top: `${top}px`, width: `${width}px`, height: `${height}px`
  });
}

function moveGroupSelect(event) {
  if (!dragState || event.pointerId !== dragState.pointerId) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  drawSelectionBox(event.clientX, event.clientY);
}

function finishGroupSelect(event) {
  if (!dragState || event.pointerId !== dragState.pointerId) return;
  event.preventDefault();
  event.stopImmediatePropagation();

  const endPitch = pointFromClient(event.clientX, event.clientY) || dragState.startPitch;
  const selection = {
    left: Math.min(dragState.startPitch.x, endPitch.x),
    right: Math.max(dragState.startPitch.x, endPitch.x),
    top: Math.min(dragState.startPitch.y, endPitch.y),
    bottom: Math.max(dragState.startPitch.y, endPitch.y)
  };
  dragState.box.remove();
  dragState = null;

  const state = getState();
  if (!state) return;
  const matches = getObjects().filter(object => intersects(selection, objectBounds(object)));
  state.selectedIds = new Set(matches.map(object => object.id));
  state.primaryId = matches[0]?.id || null;
  selectMode = false;

  try { if (typeof dsRenderCanvas === 'function') dsRenderCanvas(); } catch (_) {}
  try { if (typeof dsRenderInspector === 'function') dsRenderInspector(); } catch (_) {}
  try { if (typeof dsRenderStatus === 'function') dsRenderStatus(); } catch (_) {}
  updateToolbar();
}

function installSelectionListeners() {
  if (document.__diagramGroupCopyListeners) return;
  document.__diagramGroupCopyListeners = true;
  document.addEventListener('pointerdown', startGroupSelect, true);
  document.addEventListener('pointermove', moveGroupSelect, true);
  document.addEventListener('pointerup', finishGroupSelect, true);
  document.addEventListener('pointercancel', event => {
    if (!dragState || event.pointerId !== dragState.pointerId) return;
    dragState.box.remove();
    dragState = null;
    selectMode = false;
    updateToolbar();
  }, true);
}

function observeStudio() {
  const studio = document.getElementById('diagramStudioOverlay');
  if (!studio || studio.__groupCopyObserver) return;
  const observer = new MutationObserver(() => {
    if (!studio.classList.contains('open')) return;
    ensureToolbar();
    requestAnimationFrame(updateToolbar);
  });
  observer.observe(studio, { attributes: true, attributeFilter: ['class'] });
  studio.__groupCopyObserver = observer;
}

function install() {
  addStyles();
  installSelectionListeners();
  ensureToolbar();
  observeStudio();
  setTimeout(() => { ensureToolbar(); observeStudio(); }, 250);
  setTimeout(() => { ensureToolbar(); observeStudio(); }, 900);
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
}
