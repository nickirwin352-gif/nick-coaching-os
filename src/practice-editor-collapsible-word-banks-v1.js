export const COLLAPSIBLE_WORD_BANKS_VERSION = 1;

export const COLLAPSIBLE_WORD_BANKS = Object.freeze([
  Object.freeze({ chipsId:'progChips', label:'Progressions Word Bank', summary:'Progressions word bank' }),
  Object.freeze({ chipsId:'regChips', label:'Regressions Word Bank', summary:'Regressions word bank' })
]);

const STYLE_ID = 'practiceEditorCollapsibleWordBanksV1Styles';
const DETAILS_CLASS = 'practiceEditorCompactWordBank';

function field(id) { return document.getElementById(id); }

function addStyles() {
  if (field(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .${DETAILS_CLASS}{margin:7px 0 5px;border:1px solid var(--border-soft);border-radius:10px;background:rgba(4,13,22,.24);overflow:hidden}
    .${DETAILS_CLASS}>summary{display:flex;align-items:center;justify-content:space-between;gap:8px;min-height:38px;padding:8px 10px;cursor:pointer;list-style:none;font-size:10px;font-weight:800;color:var(--text-dim);user-select:none;-webkit-tap-highlight-color:transparent}
    .${DETAILS_CLASS}>summary::-webkit-details-marker{display:none}
    .${DETAILS_CLASS}>summary::after{content:'Open';font-size:8.5px;font-weight:700;color:var(--text-faint);border:1px solid var(--border-soft);border-radius:999px;padding:3px 6px}
    .${DETAILS_CLASS}[open]>summary{border-bottom:1px solid var(--border-soft);color:var(--text)}
    .${DETAILS_CLASS}[open]>summary::after{content:'Close'}
    .${DETAILS_CLASS}>label{display:none!important}
    .${DETAILS_CLASS}>.chips{padding:8px 9px 9px;margin:0!important}
    @media(max-width:620px){.${DETAILS_CLASS}>summary{min-height:42px;font-size:10.5px}}
  `;
  document.head.appendChild(style);
}

function associatedLabel(chips, expectedText='') {
  const previous = chips?.previousElementSibling;
  if (previous?.tagName === 'LABEL') return previous;
  const card = chips?.closest('.card') || chips?.parentElement;
  if (!card) return null;
  return [...card.querySelectorAll('label')].find(label => String(label.textContent || '').trim() === expectedText) || null;
}

export function wrapWordBank(spec) {
  if (typeof document === 'undefined') return false;
  const chips = field(spec?.chipsId);
  if (!chips) return false;
  const existing = chips.closest(`details.${DETAILS_CLASS}`);
  if (existing) {
    existing.open = false;
    return true;
  }

  const label = associatedLabel(chips,spec?.label || '');
  const details = document.createElement('details');
  details.className = DETAILS_CLASS;
  details.dataset.wordBank = spec?.chipsId || '';
  details.open = false;

  const summary = document.createElement('summary');
  summary.textContent = spec?.summary || spec?.label || 'Word bank';
  summary.setAttribute('aria-label', `${summary.textContent}. Tap to open or close suggestions.`);
  details.appendChild(summary);

  const anchor = label || chips;
  anchor.parentNode?.insertBefore(details,anchor);
  if (label) details.appendChild(label);
  details.appendChild(chips);
  return true;
}

export function ensureCollapsibleWordBanks() {
  if (typeof document === 'undefined') return 0;
  addStyles();
  return COLLAPSIBLE_WORD_BANKS.reduce((count,spec) => count + (wrapWordBank(spec) ? 1 : 0),0);
}

export function collapsePracticeWordBanks() {
  if (typeof document === 'undefined') return 0;
  let count = 0;
  document.querySelectorAll(`details.${DETAILS_CLASS}`).forEach(details => {
    if (details.open) count += 1;
    details.open = false;
  });
  return count;
}

function resetSoon() {
  setTimeout(()=>{ ensureCollapsibleWordBanks(); collapsePracticeWordBanks(); },0);
  setTimeout(()=>{ ensureCollapsibleWordBanks(); collapsePracticeWordBanks(); },120);
}

function installEditorHooks() {
  let editOriginal;
  try { editOriginal = editPractice; } catch (_) { editOriginal = window.editPractice; }
  if (typeof editOriginal === 'function' && !editOriginal.__collapsibleWordBanksV1) {
    const wrapped = function(...args) {
      const result = editOriginal.apply(this,args);
      resetSoon();
      return result;
    };
    wrapped.__collapsibleWordBanksV1 = true;
    try { editPractice = wrapped; } catch (_) {}
    window.editPractice = wrapped;
  }

  let newOriginal;
  try { newOriginal = newPractice; } catch (_) { newOriginal = window.newPractice; }
  if (typeof newOriginal === 'function' && !newOriginal.__collapsibleWordBanksV1) {
    const wrapped = function(...args) {
      const result = newOriginal.apply(this,args);
      resetSoon();
      return result;
    };
    wrapped.__collapsibleWordBanksV1 = true;
    try { newPractice = wrapped; } catch (_) {}
    window.newPractice = wrapped;
  }
}

function install() {
  ensureCollapsibleWordBanks();
  collapsePracticeWordBanks();
  installEditorHooks();
  setTimeout(()=>{ ensureCollapsibleWordBanks(); installEditorHooks(); collapsePracticeWordBanks(); },300);
  setTimeout(()=>{ ensureCollapsibleWordBanks(); installEditorHooks(); },1200);
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
}
