import { principleById } from './game-model-core.js';
import { GAME_CONTEXTS, PRACTICE_PURPOSES_V3, PRACTICE_FORMATS } from './game-context-practice-system-v3.js';

export const PRACTICE_TAG_SAVE_VERSION = 6;

function appDb() {
  try { return typeof db !== 'undefined' ? db : window.db; }
  catch (_) { return window.db; }
}

function field(id) { return document.getElementById(id); }
function validId(items,id='') { return items.some(item=>item.id===String(id||'')) ? String(id) : ''; }

export function normaliseManualTagDraft(value={}) {
  const context = validId(GAME_CONTEXTS,value.gameContext);
  const purpose = validId(PRACTICE_PURPOSES_V3,value.practicePurpose);
  const format = validId(PRACTICE_FORMATS,value.practiceFormat);
  const primary = principleById(value.primaryPrincipleId)?.id || '';
  const supports = [...new Set((Array.isArray(value.supportingPrincipleIds)?value.supportingPrincipleIds:[])
    .map(id=>principleById(id)?.id).filter(Boolean).filter(id=>id!==primary))];
  return { gameContext:context, practicePurpose:purpose, practiceFormat:format, primaryPrincipleId:primary, supportingPrincipleIds:supports };
}

export function applyManualPracticeTags(practice={}, draft={}) {
  const next = normaliseManualTagDraft(draft);
  if (next.gameContext) practice.gameContext = next.gameContext;
  if (next.practicePurpose) practice.practicePurpose = next.practicePurpose;
  if (next.practiceFormat) practice.practiceFormat = next.practiceFormat;
  practice.primaryGameModelPrinciple = next.primaryPrincipleId;
  practice.gameModelPrinciples = [...new Set([next.primaryPrincipleId,...next.supportingPrincipleIds].filter(Boolean))];
  practice.noGameModelPrinciple = practice.gameModelPrinciples.length === 0;
  practice.suggestedGameModelPrinciples = [];
  practice.organisationNeedsReview = false;
  practice.organisationConfidence = 'manual';
  practice.organisationSource = 'manual';
  practice.organisationVersion = 4;
  practice.manualTagSaveVersion = PRACTICE_TAG_SAVE_VERSION;
  return practice;
}

function captureEditorDraft() {
  const supports = [...document.querySelectorAll('#practiceArchitectureEditorPanelV3 .gmV3SupportTag input:checked')]
    .map(input=>input.value);
  return normaliseManualTagDraft({
    gameContext:field('gmV3PracticeContext')?.value,
    practicePurpose:field('gmV3PracticePurpose')?.value,
    practiceFormat:field('gmV3PracticeFormat')?.value,
    primaryPrincipleId:field('gmV3PrimaryPrinciple')?.value,
    supportingPrincipleIds:supports
  });
}

function findPracticeById(id='') {
  return appDb()?.practices?.find(item=>String(item.id)===String(id)) || null;
}

function saveLocalImmediately() {
  const data = appDb();
  if (!data) return false;
  try {
    localStorage.setItem('nickCoachOSv3',JSON.stringify(data));
    return true;
  } catch (_) { return false; }
}

async function persistReliable() {
  const localSaved = saveLocalImmediately();
  let cloudSaved = false;
  try {
    cloudSaved = !!(await window.NickPracticeTagPersistence?.flush?.());
  } catch (error) {
    console.warn('Practice tag cloud flush deferred; durable local decision retained',error);
  }
  if (!cloudSaved) {
    setTimeout(()=>window.NickPracticeTagPersistence?.flush?.(),450);
    setTimeout(()=>window.NickPracticeTagPersistence?.flush?.(),1600);
  }
  return { localSaved, cloudAttempted:cloudSaved, ok:localSaved };
}

function toast(message,kind='ok') {
  let el = field('practiceTagSaveToastV5');
  if (!el) {
    el = document.createElement('div');
    el.id = 'practiceTagSaveToastV5';
    el.style.cssText = 'position:fixed;left:50%;bottom:calc(18px + env(safe-area-inset-bottom));transform:translateX(-50%);z-index:14000;padding:9px 13px;border-radius:999px;background:#0f172a;border:1px solid rgba(255,255,255,.18);box-shadow:0 10px 30px rgba(0,0,0,.28);font-size:12px;font-weight:800;color:#e2e8f0;max-width:calc(100vw - 24px);white-space:nowrap';
    el.setAttribute('role','status');
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.style.borderColor = kind==='warn' ? 'rgba(251,191,36,.55)' : 'rgba(52,211,153,.5)';
  el.hidden = false;
  clearTimeout(el._hideTimer);
  el._hideTimer = setTimeout(()=>{ el.hidden=true; },2200);
}

async function finalisePractice(practiceId,draft,{quiet=false}={}) {
  const practice = findPracticeById(practiceId);
  if (!practice) return false;
  applyManualPracticeTags(practice,draft);
  window.NickPracticeTagPersistence?.remember?.(practiceId,draft);
  const result = await persistReliable();
  if (!quiet) toast(result.ok ? (practice.noGameModelPrinciple ? 'Practice saved · No principle ✓' : 'Practice tags saved ✓') : 'Tags could not be stored locally',result.ok?'ok':'warn');
  if (practice.noGameModelPrinciple) {
    setTimeout(()=>window.NickPracticeNoPrincipleDecision?.reassert?.({persist:false}),40);
  } else {
    setTimeout(()=>window.NickPracticeAutoOrganiser?.organise?.(),40);
  }
  setTimeout(()=>window.NickPracticeTagPersistence?.apply?.(),120);
  return result.ok;
}

function wrapSavePractice() {
  let original;
  try { original = savePractice; } catch (_) { original = window.savePractice; }
  if (typeof original !== 'function' || original.__practiceTagSaveReliabilityV6) return;
  const wrapped = function(...args) {
    const draft = captureEditorDraft();
    const targetId = field('pid')?.value?.trim() || field('oldId')?.value?.trim() || '';
    const hasRequiredFields = !!(targetId && field('pname')?.value?.trim());
    const result = original.apply(this,args);
    if (hasRequiredFields) {
      setTimeout(()=>finalisePractice(targetId,draft),25);
      setTimeout(()=>finalisePractice(targetId,draft,{quiet:true}),280);
    }
    return result;
  };
  wrapped.__practiceTagSaveReliabilityV6 = true;
  try { savePractice = wrapped; } catch (_) {}
  window.savePractice = wrapped;
}

function reinforceSuggestionButtons() {
  document.addEventListener('click',event=>{
    const libraryButton = event.target.closest?.('[data-v4-use-suggestion]');
    if (libraryButton) {
      const practiceId = libraryButton.dataset.v4PracticeId || '';
      const principleId = libraryButton.dataset.v4UseSuggestion || '';
      const practice = findPracticeById(practiceId);
      if (!practice || !principleById(principleId)) return;
      const existing = Array.isArray(practice.gameModelPrinciples) ? practice.gameModelPrinciples : [];
      const draft = {
        gameContext:practice.gameContext,
        practicePurpose:practice.practicePurpose,
        practiceFormat:practice.practiceFormat,
        primaryPrincipleId:principleId,
        supportingPrincipleIds:existing.filter(id=>id!==principleId)
      };
      setTimeout(()=>finalisePractice(practiceId,draft),35);
      return;
    }

    const editorButton = event.target.closest?.('[data-v4-editor-suggestion]');
    if (editorButton) {
      toast('Suggestion selected · press Save Practice to confirm');
    }
  },true);
}

function addEditorSaveHint() {
  const panel = field('practiceArchitectureEditorPanelV3');
  if (!panel || field('practiceTagSaveHintV5')) return;
  const hint = document.createElement('div');
  hint.id = 'practiceTagSaveHintV5';
  hint.style.cssText = 'margin-top:7px;padding:7px 8px;border:1px solid rgba(52,211,153,.2);border-radius:9px;background:rgba(52,211,153,.045);font-size:9px;color:#a7f3d0;line-height:1.4';
  hint.textContent = 'Manual tags are authoritative and survive refresh/cloud loading. Saving clears “Needs review”. Leaving Principle blank deliberately saves No principle.';
  panel.appendChild(hint);
}

function ensureAll() {
  wrapSavePractice();
  addEditorSaveHint();
}

function install() {
  ensureAll();
  setTimeout(ensureAll,120);
  setTimeout(ensureAll,500);
  setTimeout(ensureAll,1400);
  reinforceSuggestionButtons();
  document.addEventListener('click',event=>{
    if (event.target.closest?.('[data-tab="editor"],[data-v4-edit-practice],button[onclick*="editPractice"],button[onclick*="newPractice"]')) {
      setTimeout(ensureAll,80);
    }
  },true);
  window.NickPracticeTagSave = Object.freeze({ version:PRACTICE_TAG_SAVE_VERSION, applyManualPracticeTags, normaliseManualTagDraft });
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
}
