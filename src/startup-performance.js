const STARTUP_WINDOW_MS = 1800;
const COALESCE_DELAY_MS = 90;

export function shouldCoalesceRender(installedAt, now) {
  return Number(now) - Number(installedAt) < STARTUP_WINDOW_MS;
}

function installStartupRenderCoalescing() {
  if (typeof window === 'undefined') return;
  const original = window.renderAll;
  if (typeof original !== 'function' || original.__startupCoalesced) return;

  const installedAt = performance.now();
  let timer = null;
  let idleHandle = null;
  let pendingThis = null;
  let pendingArgs = [];

  const flush = () => {
    timer = null;
    idleHandle = null;
    const context = pendingThis;
    const args = pendingArgs;
    pendingThis = null;
    pendingArgs = [];
    original.apply(context, args);
  };

  const wrapped = function(...args) {
    if (!shouldCoalesceRender(installedAt, performance.now())) return original.apply(this, args);
    pendingThis = this;
    pendingArgs = args;
    if (timer || idleHandle) return;

    if ('requestIdleCallback' in window) {
      idleHandle = requestIdleCallback(flush, { timeout: 260 });
    } else {
      timer = setTimeout(flush, COALESCE_DELAY_MS);
    }
  };
  wrapped.__startupCoalesced = true;
  wrapped.__originalRenderAll = original;
  window.renderAll = wrapped;
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') installStartupRenderCoalescing();
