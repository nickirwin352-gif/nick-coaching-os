const STYLE_ID = 'stickyEditorReturnStyles';
const BUTTON_ID = 'stickyDiagramBackToBuilder';

function addStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    body.stickyDiagramEditing .currentSessionDock{display:none!important}
    #${BUTTON_ID}{
      position:fixed;
      top:14px;
      left:14px;
      z-index:32000;
      display:none;
      align-items:center;
      gap:7px;
      padding:10px 14px;
      border:1px solid rgba(52,211,153,.48);
      border-radius:999px;
      background:rgba(10,17,32,.94);
      color:var(--turf);
      box-shadow:0 12px 34px rgba(0,0,0,.38);
      backdrop-filter:blur(10px);
      font-size:13px;
      font-weight:800;
    }
    body.stickyDiagramEditing #${BUTTON_ID}{display:inline-flex}
    #${BUTTON_ID}:hover{background:var(--turf-dim);border-color:var(--turf)}
    @media(max-width:600px){
      #${BUTTON_ID}{top:8px;left:8px;padding:9px 12px;font-size:12px}
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

function enterStickyDiagramEdit() {
  addStyles();
  ensureButton();
  document.body.classList.add('stickyDiagramEditing');
}

function clearStickyDiagramEdit() {
  document.body.classList.remove('stickyDiagramEditing');
}

function returnToAdvancedBuilder() {
  try {
    if (typeof dsClose === 'function') dsClose();
    else document.getElementById('diagramStudioOverlay')?.classList.remove('open');
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

function watchDiagramStudio() {
  const overlay = document.getElementById('diagramStudioOverlay');
  if (!overlay || overlay.__stickyReturnObserver) return;
  const observer = new MutationObserver(() => {
    if (!overlay.classList.contains('open')) clearStickyDiagramEdit();
  });
  observer.observe(overlay, { attributes:true, attributeFilter:['class'] });
  overlay.__stickyReturnObserver = observer;
}

function install() {
  addStyles();
  ensureButton();
  watchDiagramStudio();
  window.enterStickyDiagramEdit = enterStickyDiagramEdit;
  window.returnToAdvancedBuilder = returnToAdvancedBuilder;
  setTimeout(watchDiagramStudio, 250);
  setTimeout(watchDiagramStudio, 900);
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
  else install();
}
