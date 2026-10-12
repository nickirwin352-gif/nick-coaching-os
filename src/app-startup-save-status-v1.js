import {subscribe,status} from './persistence-client.js';
import {syncPresentation} from './sync-presentation.js';
export const APP_STARTUP_SAVE_STATUS_VERSION = 2;

const STYLE_ID = 'nickAppStartupSaveStatusV1Styles';
const OVERLAY_ID = 'nickAppStartupOverlayV1';
const SAVE_ID = 'nickGlobalSaveStatusV1';

let enhancementsReady = false;
let cloudResolved = false;
let overlayReleased = false;
let cloudObserver = null;
let releaseTimer = null;
let storeWrapped = false;

function field(id) { return document.getElementById(id); }

function addStyles() {
  if (field(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    #${OVERLAY_ID}{position:fixed;inset:0;z-index:50000;display:flex;align-items:center;justify-content:center;padding:24px;background:
      radial-gradient(900px 460px at 20% 0%,rgba(52,211,153,.13),transparent 60%),
      radial-gradient(760px 420px at 100% 10%,rgba(56,189,248,.10),transparent 55%),#07101d;color:#eaeef7;font-family:var(--font,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif);transition:opacity .2s ease,visibility .2s ease}
    #${OVERLAY_ID}.leaving{opacity:0;visibility:hidden;pointer-events:none}
    .nickBootCard{width:min(420px,calc(100vw - 36px));padding:24px 22px;border-radius:22px;border:1px solid rgba(148,163,184,.16);background:linear-gradient(180deg,rgba(18,26,44,.94),rgba(9,18,32,.96));box-shadow:0 28px 70px rgba(0,0,0,.42);text-align:center}
    .nickBootLogo{width:56px;height:56px;margin:0 auto 13px;border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:27px;background:linear-gradient(135deg,#34d399,#0ea5e9);box-shadow:0 12px 28px rgba(52,211,153,.22)}
    .nickBootTitle{font-size:20px;font-weight:900;letter-spacing:-.02em}.nickBootText{margin-top:5px;color:#9aa7bc;font-size:12px}
    .nickBootDots{display:flex;justify-content:center;gap:6px;margin-top:16px}.nickBootDots span{width:7px;height:7px;border-radius:50%;background:#34d399;animation:nickBootPulse 1.05s infinite ease-in-out}.nickBootDots span:nth-child(2){animation-delay:.14s}.nickBootDots span:nth-child(3){animation-delay:.28s}
    @keyframes nickBootPulse{0%,70%,100%{opacity:.25;transform:scale(.85)}35%{opacity:1;transform:scale(1)}}
    header h1{margin-right:auto}
    #${SAVE_ID}{display:inline-flex;align-items:center;gap:6px;min-height:32px;padding:6px 10px;border:1px solid var(--border,#25324a);border-radius:999px;background:var(--surface-2,#0d1524);font-size:10.5px;font-weight:800;color:var(--text-dim,#8b96ac);white-space:nowrap;transition:border-color .15s,color .15s,background .15s}
    #${SAVE_ID} .saveDot{width:7px;height:7px;border-radius:50%;background:#64748b;flex:none}
    #${SAVE_ID}.saving{color:#bae6fd;border-color:rgba(56,189,248,.35)}#${SAVE_ID}.saving .saveDot{background:#38bdf8;box-shadow:0 0 0 3px rgba(56,189,248,.10)}
    #${SAVE_ID}.ok{color:#bbf7d0;border-color:rgba(52,211,153,.30)}#${SAVE_ID}.ok .saveDot{background:#34d399}
    #${SAVE_ID}.warn{color:#fde68a;border-color:rgba(251,191,36,.30)}#${SAVE_ID}.warn .saveDot{background:#fbbf24}
    #${SAVE_ID}.bad{color:#fecdd3;border-color:rgba(251,113,133,.35)}#${SAVE_ID}.bad .saveDot{background:#fb7185}
    @media(max-width:720px){header{gap:7px}#cloudPillTop{display:none!important}#${SAVE_ID}{font-size:9.5px;padding:6px 8px}.nickBootCard{padding:21px 18px}}
  `;
  document.head.appendChild(style);
}

function ensureOverlay() {
  if (field(OVERLAY_ID) || overlayReleased) return;
  const overlay = document.createElement('div');
  overlay.id = OVERLAY_ID;
  overlay.setAttribute('role','status');
  overlay.setAttribute('aria-live','polite');
  overlay.innerHTML = `<div class="nickBootCard"><div class="nickBootLogo">⚽</div><div class="nickBootTitle">Nick's Coaching OS</div><div class="nickBootText" id="nickBootTextV1">Loading your coaching workspace…</div><div class="nickBootDots"><span></span><span></span><span></span></div></div>`;
  document.body.appendChild(overlay);
}

function ensureSaveIndicator() {
  let el = field(SAVE_ID);
  if (el) return el;
  const header = document.querySelector('header');
  if (!header) return null;
  el = document.createElement('div');
  el.id = SAVE_ID;
  el.setAttribute('role','status');
  el.setAttribute('aria-live','polite');
  el.innerHTML = '<span class="saveDot"></span><span class="saveText">Preparing…</span>';
  const cloud = field('cloudPillTop');
  if (cloud?.parentNode === header) cloud.insertAdjacentElement('afterend',el);
  else header.appendChild(el);
  return el;
}

export function setSaveStatus(text,kind='') {
  const el = ensureSaveIndicator();
  if (!el) return false;
  el.classList.remove('saving','ok','warn','bad');
  if (kind) el.classList.add(kind);
  const label = el.querySelector('.saveText');
  if (label) label.textContent = text;
  return true;
}

function cloudText() { return String(field('cloudPillLabel')?.textContent || '').trim(); }
function cloudIsResolved(text=cloudText()) { return /connected|saved|not available|failed/i.test(text); }
function cloudIsHealthy(text=cloudText()) { return /saved to firebase|saved to cloud|cloud synced|cloud sync complete/i.test(text) && !/fail|retry|pending|syncing|offline|error/i.test(text); }

function refreshSaveStatusFromCloud() {
 const presentation=syncPresentation(status());
 setSaveStatus(presentation.text,presentation.kind);
 cloudResolved=status().connected;maybeReleaseOverlay();
 const label=field('cloudPillLabel');if(label&&label.textContent!==presentation.text)label.textContent=presentation.text;
 if(field('cloudStatus'))field('cloudStatus').value=presentation.text;
}

function releaseOverlay() {
  if (overlayReleased) return;
  overlayReleased = true;
  clearTimeout(releaseTimer);
  const overlay = field(OVERLAY_ID);
  if (!overlay) return;
  overlay.classList.add('leaving');
  setTimeout(()=>overlay.remove(),230);
}

function maybeReleaseOverlay() {
  if (overlayReleased) return;
  // Local data is already rendered. Remote sync must not block the workspace.
  if (enhancementsReady) releaseOverlay();
}

export function markEnhancementsReady({degraded=false}={}) {
  enhancementsReady = true;
  const text = field('nickBootTextV1');
  if (text) text.textContent = degraded ? 'Opening Coaching OS…' : 'Ready.';
  maybeReleaseOverlay();
}

function install() {
  addStyles();
  ensureOverlay();
  ensureSaveIndicator();
  subscribe(refreshSaveStatusFromCloud);
  releaseTimer = setTimeout(()=>{
    if (!cloudResolved) {
      cloudResolved = true;
      refreshSaveStatusFromCloud();
    }
    if (!enhancementsReady) enhancementsReady = true;
    releaseOverlay();
  },5000);
  window.NickStartupPolish = Object.freeze({
    version:APP_STARTUP_SAVE_STATUS_VERSION,
    markEnhancementsReady,
    setSaveStatus
  });
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
}
