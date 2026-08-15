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

function install() {
  markRoots();
  requestAnimationFrame(markRoots);
  setTimeout(markRoots, 100);
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
  else install();
}
