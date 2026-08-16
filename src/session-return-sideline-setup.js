let sessionReturnContext = null;
let sidelineLastPracticeKey = '';
let sidelineFrame = 0;
let sidelineContentObserver = null;
let sidelineOverlayObserver = null;

export function makeSessionReturnContext(tab, scrollX = 0, scrollY = 0) {
  return {
    tab: String(tab || '').trim() || 'archive',
    scrollX: Number.isFinite(Number(scrollX)) ? Number(scrollX) : 0,
    scrollY: Number.isFinite(Number(scrollY)) ? Number(scrollY) : 0
  };
}

export function updateSaveSucceeded(updateButton) {
  return !!updateButton?.classList?.contains('hidden');
}

function activeTabName() {
  return document.querySelector('.tab.active[data-tab]')?.dataset?.tab || 'archive';
}

function captureSessionReturn(mode) {
  if ((mode || 'edit') !== 'edit') {
    sessionReturnContext = null;
    return;
  }
  sessionReturnContext = makeSessionReturnContext(activeTabName(), window.scrollX || 0, window.scrollY || 0);
}

function restoreSessionReturn(context) {
  if (!context) return;
  const tab = String(context.tab || 'archive');
  const button = [...document.querySelectorAll('.tab[data-tab]')].find(item => item.dataset.tab === tab);
  if (!button) return;

  button.click();
  const restoreScroll = () => window.scrollTo(context.scrollX || 0, context.scrollY || 0);
  requestAnimationFrame(restoreScroll);
  setTimeout(restoreScroll, 90);
  setTimeout(restoreScroll, 220);
}

function installSessionReturnFlow() {
  const currentLoad = window.loadSessionToPlanner;
  if (typeof currentLoad === 'function' && !currentLoad.__returnsToSourcePage) {
    const wrappedLoad = function(index, mode = 'edit', ...rest) {
      captureSessionReturn(mode);
      return currentLoad.call(this, index, mode, ...rest);
    };
    wrappedLoad.__returnsToSourcePage = true;
    window.loadSessionToPlanner = wrappedLoad;
  }

  const currentSave = window.saveSession;
  if (typeof currentSave === 'function' && !currentSave.__returnsToSourcePage) {
    const wrappedSave = async function(mode = 'new', ...rest) {
      const isUpdate = mode === 'update';
      const returnContext = isUpdate ? sessionReturnContext : null;
      const result = await Promise.resolve(currentSave.call(this, mode, ...rest));
      const updateButton = document.getElementById('updateSessionBtn');
      if (isUpdate && returnContext && updateSaveSucceeded(updateButton)) {
        sessionReturnContext = null;
        restoreSessionReturn(returnContext);
      }
      return result;
    };
    wrappedSave.__returnsToSourcePage = true;
    window.saveSession = wrappedSave;
  }
}

function sidelinePracticeKey(content) {
  const step = content?.querySelector('.sidelineStep')?.textContent?.trim() || '';
  const pitch = content?.querySelector('.sidelinePitch[id]')?.id || '';
  return step && pitch ? `${step}|${pitch}` : '';
}

function setSidelineSetupFirst(force = false) {
  const overlay = document.getElementById('grassOverlay');
  const content = document.getElementById('grassContent');
  if (!overlay?.classList.contains('open') || !content) return;

  const key = sidelinePracticeKey(content);
  if (!key) {
    sidelineLastPracticeKey = '';
    return;
  }
  if (!force && key === sidelineLastPracticeKey) return;
  sidelineLastPracticeKey = key;

  const buttons = [...content.querySelectorAll('.sidelineTabs button')];
  const setup = buttons.find(button => /^setup$/i.test((button.textContent || '').trim())) || buttons[0];
  if (!setup || setup.classList.contains('activeStage')) return;
  setup.click();
}

function queueSidelineSetup(force = false) {
  cancelAnimationFrame(sidelineFrame);
  sidelineFrame = requestAnimationFrame(() => {
    sidelineFrame = 0;
    setSidelineSetupFirst(force);
  });
}

function installSidelineSetupDefault() {
  const content = document.getElementById('grassContent');
  const overlay = document.getElementById('grassOverlay');
  if (!content || !overlay || typeof MutationObserver === 'undefined') return;

  sidelineContentObserver?.disconnect();
  sidelineContentObserver = new MutationObserver(() => queueSidelineSetup(false));
  sidelineContentObserver.observe(content, { childList: true, subtree: true });

  sidelineOverlayObserver?.disconnect();
  sidelineOverlayObserver = new MutationObserver(() => {
    if (overlay.classList.contains('open')) {
      sidelineLastPracticeKey = '';
      queueSidelineSetup(true);
    } else {
      sidelineLastPracticeKey = '';
    }
  });
  sidelineOverlayObserver.observe(overlay, { attributes: true, attributeFilter: ['class'] });

  if (overlay.classList.contains('open')) queueSidelineSetup(true);
}

function install() {
  installSessionReturnFlow();
  installSidelineSetupDefault();
  setTimeout(installSessionReturnFlow, 250);
  setTimeout(() => {
    installSessionReturnFlow();
    installSidelineSetupDefault();
  }, 900);
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
}
