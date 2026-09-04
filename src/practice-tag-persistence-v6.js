import { principleById } from './game-model-core.js';
import { GAME_CONTEXTS, PRACTICE_PURPOSES_V3, PRACTICE_FORMATS } from './game-context-practice-system-v3.js';

export const PRACTICE_TAG_PERSISTENCE_VERSION = 6;
export const PRACTICE_TAG_DECISIONS_KEY = 'nickCoachPracticeTagDecisionsV1';

let cloudHydrated = false;
let cloudFlushBusy = false;
let renderBusy = false;

function appDb() {
  try { return typeof db !== 'undefined' ? db : window.db; }
  catch (_) { return window.db; }
}

function validId(items,id='') {
  return items.some(item=>item.id===String(id||'')) ? String(id) : '';
}

function cleanDecision(value={}) {
  const primary = principleById(value.primaryPrincipleId)?.id || '';
  const supporting = [...new Set((Array.isArray(value.supportingPrincipleIds)?value.supportingPrincipleIds:[])
    .map(id=>principleById(id)?.id).filter(Boolean).filter(id=>id!==primary))];
  return {
    gameContext:validId(GAME_CONTEXTS,value.gameContext),
    practicePurpose:validId(PRACTICE_PURPOSES_V3,value.practicePurpose),
    practiceFormat:validId(PRACTICE_FORMATS,value.practiceFormat),
    primaryPrincipleId:primary,
    supportingPrincipleIds:supporting,
    explicitNoPrinciple:!primary && supporting.length===0,
    updatedAt:Number(value.updatedAt || Date.now())
  };
}

export function readPracticeTagDecisions() {
  try {
    const raw = JSON.parse(localStorage.getItem(PRACTICE_TAG_DECISIONS_KEY) || '{}');
    return raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  } catch (_) { return {}; }
}

function writePracticeTagDecisions(value) {
  try {
    localStorage.setItem(PRACTICE_TAG_DECISIONS_KEY,JSON.stringify(value || {}));
    return true;
  } catch (_) { return false; }
}

export function applyStoredDecision(practice={}, rawDecision={}) {
  const decision = cleanDecision(rawDecision);
  if (decision.gameContext) practice.gameContext = decision.gameContext;
  if (decision.practicePurpose) practice.practicePurpose = decision.practicePurpose;
  if (decision.practiceFormat) practice.practiceFormat = decision.practiceFormat;
  practice.primaryGameModelPrinciple = decision.primaryPrincipleId;
  practice.gameModelPrinciples = [...new Set([decision.primaryPrincipleId,...decision.supportingPrincipleIds].filter(Boolean))];
  practice.noGameModelPrinciple = decision.explicitNoPrinciple;
  practice.suggestedGameModelPrinciples = [];
  practice.organisationNeedsReview = false;
  practice.organisationConfidence = 'manual';
  practice.organisationSource = 'manual';
  practice.organisationVersion = 4;
  practice.manualTagSaveVersion = Math.max(Number(practice.manualTagSaveVersion || 0),PRACTICE_TAG_PERSISTENCE_VERSION);
  practice.manualTagPersistenceVersion = PRACTICE_TAG_PERSISTENCE_VERSION;
  return practice;
}

export function applyStoredDecisionsToData(data, decisions=readPracticeTagDecisions()) {
  if (!data || !Array.isArray(data.practices)) return 0;
  let changed = 0;
  for (const practice of data.practices) {
    const decision = decisions[String(practice.id || '')];
    if (!decision) continue;
    const before = JSON.stringify({
      gameContext:practice.gameContext,
      practicePurpose:practice.practicePurpose,
      practiceFormat:practice.practiceFormat,
      primaryGameModelPrinciple:practice.primaryGameModelPrinciple,
      gameModelPrinciples:practice.gameModelPrinciples,
      noGameModelPrinciple:practice.noGameModelPrinciple,
      suggestedGameModelPrinciples:practice.suggestedGameModelPrinciples,
      organisationNeedsReview:practice.organisationNeedsReview,
      organisationConfidence:practice.organisationConfidence,
      organisationSource:practice.organisationSource
    });
    applyStoredDecision(practice,decision);
    const after = JSON.stringify({
      gameContext:practice.gameContext,
      practicePurpose:practice.practicePurpose,
      practiceFormat:practice.practiceFormat,
      primaryGameModelPrinciple:practice.primaryGameModelPrinciple,
      gameModelPrinciples:practice.gameModelPrinciples,
      noGameModelPrinciple:practice.noGameModelPrinciple,
      suggestedGameModelPrinciples:practice.suggestedGameModelPrinciples,
      organisationNeedsReview:practice.organisationNeedsReview,
      organisationConfidence:practice.organisationConfidence,
      organisationSource:practice.organisationSource
    });
    if (before !== after) changed += 1;
  }
  return changed;
}

function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

export function mergeManualTagDecisionsIntoCloud(data) {
  const copy = clone(data);
  if (!copy) return copy;
  applyStoredDecisionsToData(copy);
  return copy;
}

function saveMainLocal(data=appDb()) {
  if (!data) return false;
  try {
    localStorage.setItem('nickCoachOSv3',JSON.stringify(data));
    return true;
  } catch (_) { return false; }
}

function seedDecisionFromPractice(practice={}) {
  const hasManualEvidence = practice.organisationSource === 'manual' && (
    Number(practice.manualTagSaveVersion || 0) >= 5 ||
    practice.noGameModelPrinciple === true ||
    !!practice.primaryGameModelPrinciple ||
    (Array.isArray(practice.gameModelPrinciples) && practice.gameModelPrinciples.length)
  );
  if (!hasManualEvidence || !practice.id) return null;
  const primary = principleById(practice.primaryGameModelPrinciple)?.id || '';
  const all = [...new Set((Array.isArray(practice.gameModelPrinciples)?practice.gameModelPrinciples:[])
    .map(id=>principleById(id)?.id).filter(Boolean))];
  return cleanDecision({
    gameContext:practice.gameContext,
    practicePurpose:practice.practicePurpose,
    practiceFormat:practice.practiceFormat,
    primaryPrincipleId:primary,
    supportingPrincipleIds:all.filter(id=>id!==primary),
    updatedAt:Date.now()
  });
}

export function seedDecisionsFromLocalSnapshot() {
  let local;
  try { local = JSON.parse(localStorage.getItem('nickCoachOSv3') || 'null'); }
  catch (_) { local = null; }
  const current = readPracticeTagDecisions();
  let changed = false;
  for (const practice of local?.practices || []) {
    const id = String(practice?.id || '');
    if (!id || current[id]) continue;
    const decision = seedDecisionFromPractice(practice);
    if (!decision) continue;
    current[id] = decision;
    changed = true;
  }
  if (changed) writePracticeTagDecisions(current);
  return changed;
}

export function rememberPracticeTagDecision(practiceId,draft={}) {
  const id = String(practiceId || '');
  if (!id) return false;
  const decisions = readPracticeTagDecisions();
  decisions[id] = cleanDecision({ ...draft, updatedAt:Date.now() });
  writePracticeTagDecisions(decisions);
  const data = appDb();
  if (data) {
    applyStoredDecisionsToData(data,decisions);
    saveMainLocal(data);
  }
  scheduleCloudFlush(80);
  return true;
}

function legacyCloudReady() {
  if (cloudHydrated) return true;
  try { return typeof cloudReady !== 'undefined' && !!cloudReady; }
  catch (_) { return false; }
}

export async function flushManualTagDecisionsToCloud() {
  if (cloudFlushBusy || !legacyCloudReady()) return false;
  const data = appDb();
  if (!data || !window.nickCloud || typeof window.nickCloud.save !== 'function') return false;
  cloudFlushBusy = true;
  try {
    applyStoredDecisionsToData(data);
    saveMainLocal(data);
    await window.nickCloud.save(clone(data));
    return true;
  } catch (error) {
    console.warn('Manual practice tag cloud flush failed; durable local decision retained',error);
    return false;
  } finally {
    cloudFlushBusy = false;
  }
}

function scheduleCloudFlush(delay=250) {
  clearTimeout(scheduleCloudFlush._timer);
  scheduleCloudFlush._timer = setTimeout(()=>flushManualTagDecisionsToCloud(),delay);
}

function wrapNickCloud() {
  const cloud = window.nickCloud;
  if (!cloud || cloud.__practiceTagPersistenceV6) return false;

  const originalSave = typeof cloud.save === 'function' ? cloud.save.bind(cloud) : null;
  const originalListen = typeof cloud.listen === 'function' ? cloud.listen.bind(cloud) : null;
  const originalGetCurrent = typeof cloud.getCurrent === 'function' ? cloud.getCurrent.bind(cloud) : null;

  if (originalSave) {
    cloud.save = async function(data) {
      return await originalSave(mergeManualTagDecisionsIntoCloud(data));
    };
  }

  if (originalGetCurrent) {
    cloud.getCurrent = async function(...args) {
      const current = await originalGetCurrent(...args);
      cloudHydrated = true;
      const merged = mergeManualTagDecisionsIntoCloud(current);
      scheduleCloudFlush(120);
      return merged;
    };
  }

  if (originalListen) {
    cloud.listen = function(callback,...rest) {
      return originalListen(function(cloudDoc) {
        cloudHydrated = true;
        const mergedDoc = cloudDoc && cloudDoc.data ? { ...cloudDoc, data:mergeManualTagDecisionsIntoCloud(cloudDoc.data) } : cloudDoc;
        const result = callback(mergedDoc);
        scheduleCloudFlush(160);
        return result;
      },...rest);
    };
  }

  try { Object.defineProperty(cloud,'__practiceTagPersistenceV6',{value:true,configurable:false}); }
  catch (_) { cloud.__practiceTagPersistenceV6 = true; }
  return true;
}

function renderIfNeeded(changed) {
  if (!changed || renderBusy) return;
  renderBusy = true;
  try {
    if (typeof renderAll === 'function') renderAll();
    else if (typeof window.renderAll === 'function') window.renderAll();
  } catch (_) {}
  renderBusy = false;
}

export function reconcileManualTagDecisions() {
  const data = appDb();
  if (!data) return 0;
  const changed = applyStoredDecisionsToData(data);
  if (changed) {
    saveMainLocal(data);
    renderIfNeeded(changed);
    scheduleCloudFlush(250);
  }
  return changed;
}

function install() {
  // Capture any manual tags that were saved locally by the previous version before
  // Firebase gets a chance to replace the page state with an older cloud snapshot.
  seedDecisionsFromLocalSnapshot();
  reconcileManualTagDecisions();

  [0,20,80,180,400,800,1400,2400].forEach(delay=>setTimeout(wrapNickCloud,delay));
  [120,450,900,1600,2800,4500].forEach(delay=>setTimeout(reconcileManualTagDecisions,delay));

  // Ongoing low-cost guard for a listener that was attached before this patch loaded.
  setInterval(()=>{
    wrapNickCloud();
    reconcileManualTagDecisions();
  },1500);

  window.NickPracticeTagPersistence = Object.freeze({
    version:PRACTICE_TAG_PERSISTENCE_VERSION,
    key:PRACTICE_TAG_DECISIONS_KEY,
    remember:rememberPracticeTagDecision,
    apply:reconcileManualTagDecisions,
    mergeIncoming:mergeManualTagDecisionsIntoCloud,
    flush:flushManualTagDecisionsToCloud,
    read:readPracticeTagDecisions
  });
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') install();
