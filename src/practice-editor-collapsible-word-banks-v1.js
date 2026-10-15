export const COLLAPSIBLE_WORD_BANKS_VERSION = 3;

export const COLLAPSIBLE_WORD_BANKS = Object.freeze([
  Object.freeze({ chipsId:'cpChips', label:'Coaching Points Word Bank', summary:'Coaching points word bank' }),
  Object.freeze({ chipsId:'progChips', label:'Progressions Word Bank', summary:'Progressions word bank' }),
  Object.freeze({ chipsId:'regChips', label:'Regressions Word Bank', summary:'Regressions word bank' }),
  Object.freeze({ chipsId:'condGameChips', label:'Conditioned Game Rules / Constraints Word Bank', summary:'Rules / constraints suggestions' }),
  Object.freeze({ chipsId:'objChips', label:'Session Objective Bank', summary:'Session objective suggestions' }),
  Object.freeze({ chipsId:'linkChips', label:'Game Model Links Bank', summary:'Game model link suggestions' }),
  Object.freeze({ chipsId:'cueChips', label:"Coach's Cues Bank", summary:'Coaching cue suggestions' }),
  Object.freeze({ chipsId:'reflectChips', label:'Reflection Bank', summary:'Reflection suggestions' })
]);

const STYLE_ID = 'practiceEditorCollapsibleWordBanksV1Styles';
const DETAILS_CLASS = 'practiceEditorCompactWordBank';

function field(id) { return document.getElementById(id); }

function addStyles() {
  if (field(STYLE_ID)) return;
  const style=document.createElement('style');style.id=STYLE_ID;
  style.textContent=`
    .${DETAILS_CLASS}{margin:7px 0 5px;border:1px solid var(--border-soft);border-radius:10px;background:rgba(4,13,22,.24);overflow:hidden}
    .bankDisclosureButton{display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;min-height:44px;padding:10px;border:0;border-radius:0;background:transparent;color:var(--text);text-align:left;font-size:12px;font-weight:800;cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
    .bankDisclosureButton::after{content:'Open';font-size:10px;color:var(--text-dim)}
    .bankDisclosureButton[aria-expanded="true"]::after{content:'Close'}
    .bankDisclosureButton:focus-visible{outline:2px solid var(--turf);outline-offset:-3px}
    .bankDisclosurePanel[hidden]{display:none!important}
    .bankDisclosurePanel:not([hidden]){display:block!important}
    .bankDisclosurePanel>.chips{padding:8px 9px 9px;margin:0!important}
    .bankDisclosurePanel>label{display:none!important}
  `;document.head.appendChild(style);
}

export function setBankExpanded(wrapper,expanded){
  const button=wrapper?.querySelector('.bankDisclosureButton');
  const panel=wrapper?.querySelector('.bankDisclosurePanel');
  if(!button||!panel)return false;
  button.setAttribute('aria-expanded',String(expanded));panel.hidden=!expanded;
  return true;
}

function associatedLabel(chips, expectedText='') {
  const previous = chips?.previousElementSibling;
  if (previous?.tagName === 'LABEL') return previous;
  const card = chips?.closest('.card') || chips?.parentElement;
  if (!card) return null;
  return [...card.querySelectorAll('label')].find(label => String(label.textContent || '').trim() === expectedText) || null;
}

export function wrapWordBank(spec) {
  if(typeof document==='undefined')return false;
  const chips=field(spec?.chipsId);if(!chips)return false;
  if(chips.closest(`.${DETAILS_CLASS}`))return true;
  const label=associatedLabel(chips,spec?.label||'');
  const wrapper=document.createElement('div');wrapper.className=DETAILS_CLASS;
  wrapper.dataset.wordBank=spec.chipsId;
  if(chips.classList.contains('fourPhaseLegacyHidden'))wrapper.classList.add('fourPhaseLegacyHidden');
  const button=document.createElement('button');button.type='button';button.className='bankDisclosureButton';
  button.textContent=spec.summary||spec.label||'Word bank';
  const panel=document.createElement('div');panel.id=`${spec.chipsId}Panel`;panel.className='bankDisclosurePanel';
  button.setAttribute('aria-controls',panel.id);button.setAttribute('aria-expanded','false');panel.hidden=true;
  button.addEventListener('click',event=>{
    event.preventDefault();
    setBankExpanded(wrapper,button.getAttribute('aria-expanded')!=='true');
  });
  const anchor=label||chips;anchor.parentNode?.insertBefore(wrapper,anchor);
  wrapper.append(button,panel);if(label)panel.appendChild(label);panel.appendChild(chips);
  return true;
}

export function ensureCollapsibleWordBanks() {
  if (typeof document === 'undefined') return 0;
  addStyles();
  return COLLAPSIBLE_WORD_BANKS.reduce((count,spec) => count + (wrapWordBank(spec) ? 1 : 0),0);
}

export function collapsePracticeWordBanks(){
  if(typeof document==='undefined')return 0;
  let count=0;
  document.querySelectorAll(`.${DETAILS_CLASS}`).forEach(wrapper=>{
    if(wrapper.querySelector('.bankDisclosureButton')?.getAttribute('aria-expanded')==='true')count++;
    setBankExpanded(wrapper,false);
  });return count;
}

function resetBanks(){
  // Reset once, synchronously when a practice changes. Never close after a tap.
  ensureCollapsibleWordBanks();collapsePracticeWordBanks();
}

function installEditorHooks() {
  let editOriginal;
  try { editOriginal = editPractice; } catch (_) { editOriginal = window.editPractice; }
  if (typeof editOriginal === 'function' && !editOriginal.__collapsibleWordBanksV1) {
    const wrapped = function(...args) {
      const result = editOriginal.apply(this,args);
      resetBanks();
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
      resetBanks();
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
  setTimeout(()=>{ ensureCollapsibleWordBanks(); installEditorHooks(); },300);
  setTimeout(()=>{ ensureCollapsibleWordBanks(); installEditorHooks(); },1200);
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
}
