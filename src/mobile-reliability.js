export function mapClientPoint(point, metrics, dims) {
  const scaleX = metrics.offsetWidth ? metrics.rectWidth / metrics.offsetWidth : 1;
  const scaleY = metrics.offsetHeight ? metrics.rectHeight / metrics.offsetHeight : 1;
  const contentLeft = metrics.rectLeft + (metrics.borderLeft || 0) * scaleX;
  const contentTop = metrics.rectTop + (metrics.borderTop || 0) * scaleY;
  const contentWidth = Math.max(1, (metrics.clientWidth || metrics.offsetWidth || dims.w) * scaleX);
  const contentHeight = Math.max(1, (metrics.clientHeight || metrics.offsetHeight || dims.h) * scaleY);
  return {
    x: (point.clientX - contentLeft) * dims.w / contentWidth,
    y: (point.clientY - contentTop) * dims.h / contentHeight
  };
}

export function anchoredPan(midpoint, viewportRect, anchor, dims, zoom) {
  const centerX = viewportRect.left + viewportRect.width / 2;
  const centerY = viewportRect.top + viewportRect.height / 2;
  return {
    x: midpoint.x - centerX - (anchor.x - dims.w / 2) * zoom,
    y: midpoint.y - centerY - (anchor.y - dims.h / 2) * zoom
  };
}

function installBrowserReliabilityFixes() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.__coachingOSMobileReliabilityInstalled) return;
  window.__coachingOSMobileReliabilityInstalled = true;

  const style = document.createElement('style');
  style.dataset.mobileReliability = 'true';
  style.textContent = `
    @media (max-width:850px){
      #diagramStudioInlineHost .diagramStudioOverlay.streamlinedInline,
      #dsSessionDiagramHost .diagramStudioOverlay.streamlinedInline{
        height:min(68dvh,calc(100dvh - 90px))!important;
        min-height:min(420px,calc(100dvh - 90px))!important;
        max-height:calc(100dvh - 90px)!important;
      }
      .streamlinedInline .dsViewport{min-height:220px!important}
      .streamlinedInline .dsToolPanel,.streamlinedInline .dsQuickInspector{-webkit-overflow-scrolling:touch}
    }
  `;
  document.head.appendChild(style);

  const safeState = () => {
    try { return typeof dsState !== 'undefined' ? dsState : null; } catch (_) { return null; }
  };
  const studioOpen = () => document.getElementById('diagramStudioOverlay')?.classList.contains('open');
  const pitchMetrics = pitch => {
    const rect = pitch.getBoundingClientRect();
    const css = getComputedStyle(pitch);
    return {
      rectLeft: rect.left,
      rectTop: rect.top,
      rectWidth: rect.width,
      rectHeight: rect.height,
      offsetWidth: pitch.offsetWidth,
      offsetHeight: pitch.offsetHeight,
      clientWidth: pitch.clientWidth,
      clientHeight: pitch.clientHeight,
      borderLeft: parseFloat(css.borderLeftWidth) || 0,
      borderTop: parseFloat(css.borderTopWidth) || 0
    };
  };

  try {
    if (typeof dsCanvasPoint === 'function' && typeof dsPitchDimensions === 'function' && typeof dsCurrentStep === 'function') {
      dsCanvasPoint = function(ev) {
        const pitch = document.getElementById('dsPitch');
        if (!pitch) return {x:0,y:0};
        const dims = dsPitchDimensions(dsCurrentStep().pitchMode);
        return mapClientPoint(ev, pitchMetrics(pitch), dims);
      };
      window.dsCanvasPoint = dsCanvasPoint;
    }
  } catch (_) {}

  const captureOnViewport = ev => {
    const viewport = document.getElementById('dsViewport');
    if (!viewport || ev.pointerId == null || !viewport.setPointerCapture) return;
    try { viewport.setPointerCapture(ev.pointerId); } catch (_) {}
  };

  const wrapCapture = name => {
    try {
      const original = window[name];
      if (typeof original !== 'function' || original.__mobileCaptureWrapped) return;
      const wrapped = function(ev, ...args) {
        const result = original.call(this, ev, ...args);
        captureOnViewport(ev);
        return result;
      };
      wrapped.__mobileCaptureWrapped = true;
      window[name] = wrapped;
    } catch (_) {}
  };
  ['dsObjectPointerDown','dsMovementPointDown','dsResizePointerDown','dsRotatePointerDown'].forEach(wrapCapture);

  try {
    const originalMove = window.dsPointerMove;
    if (typeof originalMove === 'function' && !originalMove.__mobileRafWrapped) {
      document.removeEventListener('pointermove', originalMove);
      let pending = null;
      let frame = 0;
      const move = ev => {
        const state = safeState();
        if (!state?.drag) return;
        pending = {
          clientX: ev.clientX,
          clientY: ev.clientY,
          pointerId: ev.pointerId,
          pointerType: ev.pointerType,
          buttons: ev.buttons
        };
        if (frame) return;
        frame = requestAnimationFrame(() => {
          frame = 0;
          const next = pending;
          pending = null;
          if (next && safeState()?.drag) originalMove(next);
        });
      };
      move.__mobileRafWrapped = true;
      document.addEventListener('pointermove', move);
      window.dsPointerMove = move;
    }
  } catch (_) {}

  const touches = new Map();
  let pinch = null;
  const midpoint = values => ({
    x: (values[0].x + values[1].x) / 2,
    y: (values[0].y + values[1].y) / 2
  });

  document.addEventListener('pointerdown', ev => {
    if (ev.pointerType !== 'touch' || !studioOpen()) return;
    const target = ev.target.closest?.('.dsObject');
    touches.set(ev.pointerId, {x:ev.clientX,y:ev.clientY,targetId:target?.dataset?.id || null});
    if (touches.size !== 2) return;
    const values = [...touches.values()];
    if (values[0].targetId && values[0].targetId === values[1].targetId) {
      pinch = {kind:'object'};
      return;
    }
    try {
      const state = safeState();
      const viewport = document.getElementById('dsViewport');
      if (!state || !viewport || typeof dsCanvasPoint !== 'function' || typeof dsPitchDimensions !== 'function' || typeof dsCurrentStep !== 'function') return;
      const mid = midpoint(values);
      pinch = {
        kind:'canvas',
        anchor: dsCanvasPoint({clientX:mid.x,clientY:mid.y}),
        dims: dsPitchDimensions(dsCurrentStep().pitchMode)
      };
    } catch (_) { pinch = null; }
  }, {capture:true});

  document.addEventListener('pointermove', ev => {
    if (ev.pointerType !== 'touch' || !touches.has(ev.pointerId)) return;
    const old = touches.get(ev.pointerId);
    touches.set(ev.pointerId, {...old,x:ev.clientX,y:ev.clientY});
    if (pinch?.kind !== 'canvas' || touches.size < 2) return;
    try {
      const state = safeState();
      const viewport = document.getElementById('dsViewport');
      if (!state || !viewport) return;
      const mid = midpoint([...touches.values()]);
      const pan = anchoredPan(mid, viewport.getBoundingClientRect(), pinch.anchor, pinch.dims, state.zoom);
      state.panX = pan.x;
      state.panY = pan.y;
      if (typeof dsApplyTransform === 'function') dsApplyTransform();
    } catch (_) {}
  }, {capture:true,passive:false});

  const clearTouch = ev => {
    if (ev.pointerType !== 'touch') return;
    touches.delete(ev.pointerId);
    if (touches.size < 2) pinch = null;
  };
  document.addEventListener('pointerup', clearTouch, {capture:true});
  document.addEventListener('pointercancel', clearTouch, {capture:true});

  let fitFrame = 0;
  const scheduleFit = () => {
    if (fitFrame) cancelAnimationFrame(fitFrame);
    fitFrame = requestAnimationFrame(() => {
      fitFrame = 0;
      const state = safeState();
      if (!state || state.drag || touches.size || !studioOpen()) return;
      try { if (typeof dsFitPitch === 'function') dsFitPitch(); } catch (_) {}
    });
  };
  window.addEventListener('resize', scheduleFit, {passive:true});
  window.addEventListener('orientationchange', () => setTimeout(scheduleFit, 80), {passive:true});
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', scheduleFit, {passive:true});
  }
  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(scheduleFit);
    const viewport = document.getElementById('dsViewport');
    if (viewport) observer.observe(viewport);
  }

  const refreshDashboard = () => {
    try { if (typeof renderDashboard === 'function') renderDashboard(); } catch (_) {}
  };
  document.addEventListener('click', ev => {
    const tab = ev.target.closest?.('.tab[data-tab="dashboard"]');
    if (!tab) return;
    requestAnimationFrame(refreshDashboard);
  });

  try {
    if (typeof renderAll === 'function' && !renderAll.__dashboardRefreshWrapped) {
      const originalRenderAll = renderAll;
      const wrapped = function(...args) {
        const result = originalRenderAll.apply(this,args);
        if (!document.getElementById('dashboard')?.classList.contains('hidden')) refreshDashboard();
        return result;
      };
      wrapped.__dashboardRefreshWrapped = true;
      renderAll = wrapped;
      window.renderAll = wrapped;
    }
  } catch (_) {}
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installBrowserReliabilityFixes, {once:true});
  else installBrowserReliabilityFixes();
}
