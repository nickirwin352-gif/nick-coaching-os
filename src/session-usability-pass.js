let copiedSessionIndex = null;
let selectedSessionIndex = null;

function addStyles() {
  if (document.getElementById('sessionUsabilityStyles')) return;
  const style = document.createElement('style');
  style.id = 'sessionUsabilityStyles';
  style.textContent = `
    .sessionLibraryCard.sessionSelected{border-color:var(--turf);background:linear-gradient(180deg,var(--turf-dim),var(--surface-2));box-shadow:0 0 0 2px rgba(52,211,153,.16)}
    .sessionLibraryCard.sessionSelected [data-session-action="view"]{background:var(--turf);color:#04160f;border-color:var(--turf)}
    .saveStateBanner{position:fixed;left:50%;top:calc(12px + env(safe-area-inset-top));transform:translateX(-50%);z-index:20000;display:flex;align-items:center;gap:10px;width:min(620px,calc(100vw - 24px));padding:13px 16px;border-radius:14px;border:1px solid var(--border);background:var(--surface);box-shadow:0 18px 42px rgba(0,0,0,.45);font-weight:800;transition:opacity .18s,transform .18s}
    .saveStateBanner[hidden]{display:none}
    .saveStateBanner .saveStateIcon{width:28px;height:28px;border-radius:50%;display:grid;place-items:center;background:var(--turf-dim);color:var(--turf);flex:none}
    .saveStateBanner .saveStateText{min-width:0;flex:1}
    .saveStateBanner .saveStateMain{font-size:14px}
    .saveStateBanner .saveStateSub{font-size:12px;color:var(--text-dim);font-weight:600;margin-top:2px}
    .saveStateBanner.syncing .saveStateIcon{animation:savePulse .85s ease-in-out infinite alternate}
    .saveStateBanner.error{border-color:var(--coral)}
    .saveStateBanner.error .saveStateIcon{background:rgba(251,113,133,.12);color:var(--coral)}
    @keyframes savePulse{from{transform:scale(.9);opacity:.65}to{transform:scale(1.06);opacity:1}}
    .copiedSessionTools{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin:0 0 14px;padding:12px 14px;border:1px solid rgba(52,211,153,.32);background:var(--turf-dim);border-radius:14px}
    .copiedSessionTools .copiedActions{display:flex;gap:7px;flex-wrap:wrap}
    .quickDiagramToolbar{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin:10px 0 12px}
    .quickSuggestionDiagram{margin:0 0 10px}
    .quickSuggestionDiagram .pitchMini{width:100%!important;max-width:none!important;height:180px!important;margin:0}
    @media(max-width:640px){.saveStateBanner{top:calc(8px + env(safe-area-inset-top));padding:12px}.copiedSessionTools{align-items:stretch}.copiedSessionTools .copiedActions{width:100%}.copiedSessionTools button{flex:1 1 130px}}
  `;
  document.head.appendChild(style);
}

function ensureSaveBanner() {
  let banner = document.getElementById('saveStateBanner');
  if (banner) return banner;
  banner = document.createElement('div');
  banner.id = 'saveStateBanner';
  banner.className = 'saveStateBanner';
  banner.hidden = true;
  banner.innerHTML = '<div class="saveStateIcon">✓</div><div class="saveStateText"><div class="saveStateMain"></div><div class="saveStateSub"></div></div>';
  document.body.appendChild(banner);
  return banner;
}

function showSaveState(main, sub = '', state = 'saved', duration = 2600) {
  const banner = ensureSaveBanner();
  banner.className = `saveStateBanner ${state}`;
  banner.querySelector('.saveStateIcon').textContent = state === 'syncing' ? '↻' : state === 'error' ? '!' : '✓';
  banner.querySelector('.saveStateMain').textContent = main;
  banner.querySelector('.saveStateSub').textContent = sub;
  banner.hidden = false;
  clearTimeout(banner._hideTimer);
  if (duration) banner._hideTimer = setTimeout(() => { banner.hidden = true; }, duration);
}
window.showSaveState = showSaveState;

function installSaveFeedback() {
  const existing = window.saveSession;
  if (typeof existing === 'function' && !existing.__pronouncedSaveFeedback) {
    const wrapped = function(...args) {
      showSaveState('Session saved on this device', 'Syncing to cloud in the background…', 'syncing', 0);
      const result = existing.apply(this, args);
      if (result === false) showSaveState('Session was not saved', 'Check the session and try again.', 'error', 3200);
      return result;
    };
    wrapped.__pronouncedSaveFeedback = true;
    window.saveSession = wrapped;
  }

  const cloudLabel = document.getElementById('cloudPillLabel');
  if (!cloudLabel) return;
  const reflectCloudState = () => {
    const text = (cloudLabel.textContent || '').toLowerCase();
    if (text.includes('saved') || text.includes('firebase')) showSaveState('Saved everywhere', 'Local save complete · cloud sync complete', 'saved', 2100);
    else if (text.includes('retry') || text.includes('failed') || text.includes('error')) showSaveState('Saved on this device', 'Cloud sync will retry automatically.', 'error', 4200);
    else if (text.includes('sync') || text.includes('saving')) showSaveState('Saved on this device', 'Syncing to cloud in the background…', 'syncing', 0);
  };
  new MutationObserver(reflectCloudState).observe(cloudLabel, { childList: true, characterData: true, subtree: true });
}

function clearSessionSelection() {
  selectedSessionIndex = null;
  document.querySelectorAll('.sessionLibraryCard.sessionSelected').forEach(card => card.classList.remove('sessionSelected'));
  document.querySelectorAll('[data-session-action="view"]').forEach(button => { if (button.textContent === 'Close Session') button.textContent = 'View Session'; });
}

function markSessionSelection(index, control) {
  clearSessionSelection();
  selectedSessionIndex = index;
  const card = control?.closest('.sessionLibraryCard');
  if (card) card.classList.add('sessionSelected');
  if (control) control.textContent = 'Close Session';
}

function installSessionViewToggle() {
  document.addEventListener('click', event => {
    const control = event.target.closest?.('[data-session-action="view"]');
    if (!control || !document.getElementById('sessionLibraryResults')?.contains(control)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const index = Number(control.dataset.index);
    const overlay = document.getElementById('sessionDetailOverlay');
    if (overlay && selectedSessionIndex === index) {
      overlay.remove();
      clearSessionSelection();
      return;
    }
    if (overlay) overlay.remove();
    if (typeof window.openSessionDetail === 'function') window.openSessionDetail(index);
    const nextOverlay = document.getElementById('sessionDetailOverlay');
    if (nextOverlay) nextOverlay.dataset.sessionIndex = String(index);
    markSessionSelection(index, control);
  }, true);

  document.addEventListener('click', event => {
    if (event.target.closest?.('#closeSessionDetail')) setTimeout(clearSessionSelection, 0);
  }, true);

  const observer = new MutationObserver(() => {
    if (selectedSessionIndex !== null && !document.getElementById('sessionDetailOverlay')) clearSessionSelection();
  });
  observer.observe(document.body, { childList: true });
}

function injectCopiedSessionTools() {
  document.getElementById('copiedSessionTools')?.remove();
  if (!Number.isInteger(copiedSessionIndex)) return;
  const advanced = document.getElementById('advancedRoute') || document.getElementById('planner');
  if (!advanced) return;
  const box = document.createElement('div');
  box.id = 'copiedSessionTools';
  box.className = 'copiedSessionTools';
  box.innerHTML = '<div><b>Copied session is ready</b><div class="small">Use the same quick viewing tools before you make changes.</div></div><div class="copiedActions"><button type="button" data-copy-action="source">View Original</button><button type="button" data-copy-action="diagrams">🗺 All Diagrams</button><button type="button" data-copy-action="sideline">▶ Sideline Draft</button></div>';
  const header = advanced.querySelector('.routeHeader');
  if (header?.nextSibling) advanced.insertBefore(box, header.nextSibling); else advanced.prepend(box);
  box.addEventListener('click', event => {
    const button = event.target.closest('[data-copy-action]');
    if (!button) return;
    if (button.dataset.copyAction === 'source' && typeof window.openSessionDetail === 'function') window.openSessionDetail(copiedSessionIndex);
    if (button.dataset.copyAction === 'diagrams' && typeof window.openAllSessionDiagrams === 'function') window.openAllSessionDiagrams(null, 'Copied Session Draft · All Diagrams');
    if (button.dataset.copyAction === 'sideline') { try { startPlannerSideline(); } catch (_) {} }
  });
}

function installCopySessionTools() {
  const original = window.duplicateSession;
  if (typeof original !== 'function' || original.__copySessionTools) return;
  const wrapped = function(index, ...rest) {
    copiedSessionIndex = Number(index);
    const result = original.call(this, index, ...rest);
    setTimeout(injectCopiedSessionTools, 0);
    return result;
  };
  wrapped.__copySessionTools = true;
  window.duplicateSession = wrapped;
}

function quickBuildIds() {
  try {
    const themeName = document.getElementById('quickTheme')?.value || themes[0];
    const total = Number(document.getElementById('quickDuration')?.value || 75);
    const playersCount = Number(document.getElementById('quickPlayers')?.value || 14);
    return suggestedPracticeIds(themeName, total, playersCount) || [];
  } catch (_) { return []; }
}

function enrichQuickBuildDiagrams() {
  const box = document.getElementById('scratchSuggestions');
  if (!box) return;
  const ids = quickBuildIds();
  const card = box.querySelector('.card');
  if (!card || !ids.length) return;

  let toolbar = card.querySelector('.quickDiagramToolbar');
  if (!toolbar) {
    toolbar = document.createElement('div');
    toolbar.className = 'quickDiagramToolbar';
    toolbar.innerHTML = '<div class="small"><b>Diagrams ready now</b> · see every suggested practice visually before building.</div><button type="button" class="primary">🗺 View All Suggested Diagrams</button>';
    card.querySelector('p')?.after(toolbar);
    toolbar.querySelector('button').addEventListener('click', () => {
      if (typeof window.openAllSessionDiagrams === 'function') window.openAllSessionDiagrams({ drills: ids, diagramOverrides: Array(ids.length).fill(null) }, 'Quick Build · Suggested Diagrams');
    });
  }

  box.querySelectorAll('.scratchSuggestion').forEach((suggestion, index) => {
    if (suggestion.querySelector('.quickSuggestionDiagram')) return;
    const practiceId = ids[index];
    let practice = null;
    try { practice = get(practiceId); } catch (_) {}
    if (!practice) return;
    const host = document.createElement('div');
    host.className = 'quickSuggestionDiagram';
    host.id = `quick-suggestion-diagram-${index}-${Date.now().toString(36)}`;
    suggestion.prepend(host);
    requestAnimationFrame(() => { try { drawMini(host.id, practice.diagram || [], practice.pitchMode || 'full'); } catch (_) {} });
  });
}

function installQuickBuildDiagrams() {
  const originalRender = window.renderScratchSuggestions;
  if (typeof originalRender === 'function' && !originalRender.__quickDiagrams) {
    const wrappedRender = function(...args) {
      const result = originalRender.apply(this, args);
      enrichQuickBuildDiagrams();
      return result;
    };
    wrappedRender.__quickDiagrams = true;
    window.renderScratchSuggestions = wrappedRender;
  }

  const originalCreate = window.createSuggestedSession;
  if (typeof originalCreate === 'function' && !originalCreate.__quickDiagramCreate) {
    const wrappedCreate = function(...args) {
      const ids = quickBuildIds();
      const result = originalCreate.apply(this, args);
      setTimeout(() => {
        try { renderPreview(); } catch (_) {}
        if (ids.length) showSaveState('Quick Build ready', 'All practice diagrams are available immediately in Session Preview.', 'saved', 2600);
      }, 0);
      return result;
    };
    wrappedCreate.__quickDiagramCreate = true;
    window.createSuggestedSession = wrappedCreate;
  }
}

function install() {
  addStyles();
  installSaveFeedback();
  installSessionViewToggle();
  installCopySessionTools();
  installQuickBuildDiagrams();
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
}
