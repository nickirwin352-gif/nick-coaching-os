const STYLE_ID = 'stickyEditorReturnStyles';
const BUTTON_ID = 'stickyDiagramBackToBuilder';
const SESSION_HOST_ID = 'dsSessionDiagramHost';

function addStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    body.stickyDiagramEditing #currentSessionDock,
    body.stickyDiagramEditing .currentSessionDock{display:none!important}
    body.stickyDiagramEditing #${BUTTON_ID}{display:inline-flex!important}
    #${BUTTON_ID}{
      position:fixed;
      top:14px;
      left:14px;
      z-index:32000;
      display:none;
      align-items:center;
      gap:7px;
      padding:11px 15px;
      border:1px solid rgba(52,211,153,.58);
      border-radius:999px;
      background:rgba(10,17,32,.97);
      color:var(--turf);
      box-shadow:0 12px 34px rgba(0,0,0,.42);
      backdrop-filter:blur(10px);
      font-size:13px;
      font-weight:850;
    }
    #${BUTTON_ID}:hover{background:var(--turf-dim);border-color:var(--turf)}
    body.stickyDiagramEditing #${SESSION_HOST_ID}{margin-top:0!important}
    body.stickyDiagramEditing #dsSessionEditBanner{
      position:sticky;
      top:0;
      z-index:25;
      display:flex!important;
      padding:11px 12px;
      margin:0 0 8px;
      border:1px solid rgba(52,211,153,.4);
      background:rgba(8,20,31,.97);
      box-shadow:0 10px 25px -18px rgba(0,0,0,.9);
      backdrop-filter:blur(10px);
    }
    body.stickyDiagramEditing #dsSessionEditBanner b{color:var(--turf)}
    body.stickyDiagramEditing #dsSessionEditBanner button{
      background:var(--turf)!important;
      color:#04160f!important;
      border-color:var(--turf)!important;
      white-space:nowrap;
    }
    @media(max-width:600px){
      #${BUTTON_ID}{top:8px;left:8px;padding:9px 12px;font-size:12px}
      body.stickyDiagramEditing #dsSessionEditBanner{align-items:stretch;gap:8px}
      body.stickyDiagramEditing #dsSessionEditBanner button{width:100%}
    }
  `;
  document.head.appendChild(style);
}

function ensureButton() {
  let button = document.getElementById(BUTTON_ID);
  if (button) return button;
  button = document.createElement('button');
  button.id = BUTTON_ID;
  button.type = 'button';
  button.textContent = '← Back to Advanced Builder';
  button.setAttribute('aria-label', 'Return to Advanced Builder');
  button.addEventListener('click', returnToAdvancedBuilder);
  document.body.appendChild(button);
  return button;
}

function sessionHost() {
  return document.getElementById(SESSION_HOST_ID);
}

function sessionEditorIsActive() {
  return !!sessionHost()?.classList.contains('active');
}

function tuneSessionBanner() {
  const banner = document.getElementById('dsSessionEditBanner');
  if (!banner) return;
  const copy = banner.querySelector('div');
  const title = copy?.querySelector('b');
  const detail = copy?.querySelector('.small');
  const button = banner.querySelector('button');
  if (title) title.textContent = 'Editing this session diagram';
  if (detail) detail.textContent = 'Changes apply only to this session. Return to Advanced Builder when you are finished.';
  if (button && !button.__advancedBuilderReturn) {
    button.textContent = '← Back to Advanced Builder';
    button.removeAttribute('onclick');
    button.addEventListener('click', returnToAdvancedBuilder);
    button.__advancedBuilderReturn = true;
  }
}

function syncEditingState() {
  const active = sessionEditorIsActive();
  document.body.classList.toggle('stickyDiagramEditing', active);
  if (active) tuneSessionBanner();
}

function enterStickyDiagramEdit() {
  addStyles();
  ensureButton();
  document.body.classList.add('stickyDiagramEditing');
  requestAnimationFrame(() => {
    tuneSessionBanner();
    syncEditingState();
  });
}

function clearStickyDiagramEdit() {
  document.body.classList.remove('stickyDiagramEditing');
}

function returnToAdvancedBuilder(event) {
  event?.preventDefault?.();
  try {
    if (typeof dsClose === 'function') dsClose();
  } catch (_) {}
  clearStickyDiagramEdit();
  try {
    if (typeof showBuildRoute === 'function') showBuildRoute('advanced');
  } catch (_) {}
  try {
    if (typeof renderCurrentSessionDock === 'function') renderCurrentSessionDock();
  } catch (_) {}
  requestAnimationFrame(() => {
    const target = document.getElementById('advancedBuilder');
    if (target) target.scrollIntoView({ block:'start', behavior:'smooth' });
  });
}

function watchSessionHost() {
  const host = sessionHost();
  if (!host || host.__stickyReturnObserver) return false;
  tuneSessionBanner();
  const observer = new MutationObserver(() => syncEditingState());
  observer.observe(host, { attributes:true, attributeFilter:['class'] });
  host.__stickyReturnObserver = observer;
  syncEditingState();
  return true;
}

function install() {
  addStyles();
  ensureButton();
  window.enterStickyDiagramEdit = enterStickyDiagramEdit;
  window.returnToAdvancedBuilder = returnToAdvancedBuilder;
  if (!watchSessionHost()) {
    const observer = new MutationObserver(() => {
      if (watchSessionHost()) observer.disconnect();
    });
    observer.observe(document.body, { childList:true, subtree:true });
  }
  setTimeout(() => { watchSessionHost(); syncEditingState(); }, 250);
  setTimeout(() => { watchSessionHost(); syncEditingState(); }, 900);
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
  else install();
}
