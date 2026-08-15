const GUARDED_ROOTS = [
  'sessionLibraryResults',
  'recentSessionList',
  'visualPicker',
  'archiveCalendar',
  'sessionDrillList',
  'currentSessionDockDiagramStrip'
];

function markRoots() {
  GUARDED_ROOTS.forEach(id => {
    const element = document.getElementById(id);
    if (element) element.dataset.intelligenceV2Observed = 'true';
  });
}

function guardReviewOverlayObservers() {
  if (window.__reviewOverlayObserverGuardInstalled || typeof MutationObserver === 'undefined') return;
  window.__reviewOverlayObserverGuardInstalled = true;
  const nativeObserve = MutationObserver.prototype.observe;
  MutationObserver.prototype.observe = function(target, options = {}) {
    if (target?.id === 'postSessionReviewOverlay' && (options.childList || options.subtree)) {
      options = { ...options, childList:false, subtree:false, attributes:true, attributeFilter:['class'] };
    }
    return nativeObserve.call(this, target, options);
  };
}

function install() {
  guardReviewOverlayObservers();
  markRoots();
  requestAnimationFrame(markRoots);
  setTimeout(markRoots, 100);
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
  else install();
}
