export const NO_PRINCIPLE_DECISION_VERSION = 1;

function appDb() {
  try { return typeof db !== 'undefined' ? db : window.db; }
  catch (_) { return window.db; }
}

export function isManualNoPrinciple(practice={}) {
  return practice.noGameModelPrinciple === true && practice.organisationSource === 'manual';
}

function saveLocal() {
  const data = appDb();
  if (!data) return false;
  try {
    localStorage.setItem('nickCoachOSv3',JSON.stringify(data));
    return true;
  } catch (_) { return false; }
}

async function persist() {
  const localSaved = saveLocal();
  try {
    if (typeof store === 'function') { await store(); return true; }
    if (typeof window.store === 'function') { await window.store(); return true; }
  } catch (error) {
    console.warn('No-principle decision save failed; local copy retained',error);
  }
  return localSaved;
}

function refreshPracticeLibrary() {
  const search = document.getElementById('practiceMultiFilterSearchV4');
  if (search) search.dispatchEvent(new Event('input',{bubbles:true}));
}

export async function reassertNoPrincipleDecisions({persist:shouldPersist=false}={}) {
  const data = appDb();
  if (!data || !Array.isArray(data.practices)) return 0;
  let changed = 0;
  for (const practice of data.practices) {
    if (!isManualNoPrinciple(practice)) continue;
    const hadPrinciple = !!practice.primaryGameModelPrinciple || (Array.isArray(practice.gameModelPrinciples) && practice.gameModelPrinciples.length);
    const hadSuggestions = Array.isArray(practice.suggestedGameModelPrinciples) && practice.suggestedGameModelPrinciples.length;
    const neededReview = practice.organisationNeedsReview === true;
    const notManual = practice.organisationConfidence !== 'manual' || practice.organisationSource !== 'manual';
    if (hadPrinciple || hadSuggestions || neededReview || notManual) changed += 1;
    practice.primaryGameModelPrinciple = '';
    practice.gameModelPrinciples = [];
    practice.suggestedGameModelPrinciples = [];
    practice.organisationNeedsReview = false;
    practice.organisationConfidence = 'manual';
    practice.organisationSource = 'manual';
  }
  if (changed && shouldPersist) await persist();
  refreshPracticeLibrary();
  return changed;
}

function wrapAutoOrganiser() {
  const current = window.NickPracticeAutoOrganiser;
  if (!current || current.__noPrincipleWrapped) return;
  const original = current.organise;
  if (typeof original !== 'function') return;
  const wrapped = async function(...args) {
    const result = await original(...args);
    await reassertNoPrincipleDecisions({persist:true});
    return result;
  };
  window.NickPracticeAutoOrganiser = Object.freeze({ ...current, organise:wrapped, __noPrincipleWrapped:true });
}

function scheduleReassertions() {
  // The v4 organiser also runs its own startup passes. Reassert just after each one
  // so a deliberate "No principle" decision is never turned back into Needs Review.
  [650,1950,4350].forEach(delay => setTimeout(()=>reassertNoPrincipleDecisions({persist:true}),delay));
}

function install() {
  wrapAutoOrganiser();
  scheduleReassertions();
  setTimeout(wrapAutoOrganiser,100);
  setTimeout(wrapAutoOrganiser,600);
  window.NickPracticeNoPrincipleDecision = Object.freeze({
    version:NO_PRINCIPLE_DECISION_VERSION,
    isManualNoPrinciple,
    reassert:reassertNoPrincipleDecisions
  });
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
}
