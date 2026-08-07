export function fitLogicalDiagram(availableWidth, availableHeight, dims) {
  const logicalWidth = Math.max(1, Number(dims?.w) || 1);
  const logicalHeight = Math.max(1, Number(dims?.h) || 1);
  const widthLimit = Math.max(1, Number(availableWidth) || logicalWidth);
  const heightLimit = Math.max(0, Number(availableHeight) || 0);
  let width = widthLimit;
  let height = width * logicalHeight / logicalWidth;
  if (heightLimit > 0 && height > heightLimit) {
    height = heightLimit;
    width = height * logicalWidth / logicalHeight;
  }
  return { width, height, scale: width / logicalWidth };
}

function installDisplayCalibration() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.__coachingOSDisplayCalibrationInstalled) return;
  window.__coachingOSDisplayCalibrationInstalled = true;

  const hostStates = new WeakMap();

  const logicalDimensions = mode => {
    try {
      if (typeof dsPitchDimensions === 'function') return dsPitchDimensions(mode);
    } catch (_) {}
    return String(mode || '').startsWith('portrait:') ? {w:520,h:900} : {w:900,h:520};
  };

  const parseModeSafe = mode => {
    try {
      if (typeof dsParseMode === 'function') return dsParseMode(mode);
    } catch (_) {}
    const portrait = String(mode || '').startsWith('portrait:');
    return {portrait,core:portrait?String(mode).slice(9):String(mode || 'full')};
  };

  const normalise = (value, index) => {
    try {
      if (typeof dsNormaliseObject === 'function') return dsNormaliseObject(value, index);
    } catch (_) {}
    return value || {};
  };

  const movementPath = (obj, diagram) => {
    try {
      if (typeof dsMovementPathForDiagram === 'function') return dsMovementPathForDiagram(obj, diagram);
    } catch (_) {}
    const pts = obj?.points || [];
    if (pts.length < 2) return '';
    if (pts.length === 3) return `M ${pts[0].x} ${pts[0].y} Q ${pts[1].x} ${pts[1].y} ${pts[2].x} ${pts[2].y}`;
    return pts.map((p,i)=>(i?'L':'M')+` ${p.x} ${p.y}`).join(' ');
  };

  const fieldMarkup = mode => {
    try {
      if (typeof dsMiniBase === 'function') return dsMiniBase(mode);
    } catch (_) {}
    return '<div class="miniHalf"></div><div class="miniCirc"></div>';
  };

  const escapeText = value => {
    try {
      if (typeof dsEscape === 'function') return dsEscape(value || '');
    } catch (_) {}
    return String(value || '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  };

  function measureHost(host, dims) {
    const width = host.clientWidth || host.getBoundingClientRect().width || dims.w;
    let height = host.clientHeight || 0;
    if (!host.classList.contains('sidelinePitch')) height = 0;
    return fitLogicalDiagram(width, height, dims);
  }

  function renderHost(host, state) {
    if (!host?.isConnected) return;
    const mode = state.mode || 'full';
    const dims = logicalDimensions(mode);
    const parsed = parseModeSafe(mode);
    const fit = measureHost(host, dims);
    const markerId = `mini-arrow-${String(host.id || 'pitch').replace(/[^a-zA-Z0-9_-]/g,'')}`;

    host.innerHTML = '';
    const pitch = document.createElement('div');
    pitch.className = `pitchMini calibratedMini ${parsed.portrait?'portrait':''}`;
    pitch.style.position = 'relative';
    pitch.style.margin = '0 auto';
    pitch.style.width = `${fit.width}px`;
    pitch.style.height = `${fit.height}px`;
    pitch.style.minWidth = '0';
    pitch.style.minHeight = '0';
    pitch.style.maxWidth = '100%';
    pitch.style.maxHeight = '100%';
    pitch.style.flex = 'none';
    pitch.style.aspectRatio = `${dims.w} / ${dims.h}`;
    pitch.innerHTML = parsed.core === 'blank' ? '' : fieldMarkup(mode);
    if (parsed.core === 'futsal') pitch.style.background = 'linear-gradient(180deg,#1976a3,#155b82)';
    host.appendChild(pitch);

    const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('viewBox',`0 0 ${dims.w} ${dims.h}`);
    svg.setAttribute('preserveAspectRatio','xMidYMid meet');
    svg.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;overflow:hidden;pointer-events:none';
    svg.innerHTML = `<defs><marker id="${markerId}" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="white"></path></marker></defs>`;
    pitch.appendChild(svg);

    (state.diagram || []).map(normalise).forEach(obj => {
      if (obj.type === 'movement') {
        const path = document.createElementNS('http://www.w3.org/2000/svg','path');
        path.setAttribute('d', movementPath(obj, state.diagram));
        path.setAttribute('class', `dsMovementVisible ${obj.movementType || 'pass'}`);
        path.setAttribute('marker-end', `url(#${markerId})`);
        svg.appendChild(path);
        return;
      }
      const el = document.createElement('div');
      el.className = `dsObject ${obj.type || ''} ${obj.color || ''} ${obj.zoneShape || ''}`;
      el.style.left = `${(Number(obj.x) || 0) * fit.scale}px`;
      el.style.top = `${(Number(obj.y) || 0) * fit.scale}px`;
      el.style.width = `${(Number(obj.w) || 30) * fit.scale}px`;
      el.style.height = `${(Number(obj.h) || 30) * fit.scale}px`;
      el.style.transform = `rotate(${Number(obj.rot) || 0}deg)`;
      el.style.transformOrigin = 'center center';
      el.style.fontSize = `${Math.max(6,10*fit.scale)}px`;
      if (obj.type === 'player' || obj.type === 'txt') {
        el.innerHTML = `<span>${escapeText(obj.label || '')}</span>${obj.role?`<span class="dsRole">${escapeText(obj.role)}</span>`:''}`;
      }
      pitch.appendChild(el);
    });
  }

  const calibratedDrawMini = function(id, diagram, mode='full') {
    const host = document.getElementById(id);
    if (!host) return;
    let state = hostStates.get(host);
    if (!state) {
      state = {diagram:[],mode:'full',frame:0,observer:null};
      if ('ResizeObserver' in window) {
        state.observer = new ResizeObserver(() => {
          if (!host.isConnected) { state.observer.disconnect(); return; }
          if (state.frame) cancelAnimationFrame(state.frame);
          state.frame = requestAnimationFrame(() => { state.frame = 0; renderHost(host,state); });
        });
        state.observer.observe(host);
      }
      hostStates.set(host,state);
    }
    state.diagram = Array.isArray(diagram) ? diagram : [];
    state.mode = mode || 'full';
    renderHost(host,state);
  };

  try {
    if (typeof drawMini === 'function') {
      drawMini = calibratedDrawMini;
      window.drawMini = calibratedDrawMini;
    }
  } catch (_) {
    window.drawMini = calibratedDrawMini;
  }

  window.addEventListener('orientationchange', () => {
    requestAnimationFrame(() => {
      document.querySelectorAll('.sidelinePitch[id], .practicePreview [id^="mini-"], #dsEditorPreview').forEach(host => {
        const state = hostStates.get(host);
        if (state) renderHost(host,state);
      });
    });
  }, {passive:true});
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installDisplayCalibration, {once:true});
  else installDisplayCalibration();
}
