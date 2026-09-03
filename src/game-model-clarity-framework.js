const STYLE_ID = 'gameModelClarityFrameworkStyles';
const CARD_ID = 'gameModelClarityCard';
const PREVIEW_ID = 'gameModelClarityPreview';
const SIDELINE_ID = 'gameModelSidelineClarity';
const REVIEW_ID = 'gameModelReviewClarity';

const FIELD_IDS = Object.freeze({
  why:'gmWhy',
  principle:'gmPrinciple',
  picture:'gmPicture',
  cue:'gmPlayerCue',
  questions:'gmPlayerQuestions'
});

let sidelineObserver = null;
let sessionLibraryObserver = null;
let archiveObserver = null;
let reviewObserver = null;
let refreshFrame = 0;

function appDb() {
  try { return typeof db !== 'undefined' ? db : window.db; }
  catch (_) { return window.db; }
}

function escapeText(value) {
  try { if (typeof escapeHtml === 'function') return escapeHtml(String(value ?? '')); } catch (_) {}
  return String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
}

function field(id) { return document.getElementById(id); }

function cleanQuestion(value) {
  return String(value || '').trim().replace(/^[-•\d.)\s]+/, '').trim();
}

function questionArray(value) {
  if (Array.isArray(value)) return value.map(cleanQuestion).filter(Boolean).slice(0, 5);
  return String(value || '').split(/\n+/).map(cleanQuestion).filter(Boolean).slice(0, 5);
}

export function normaliseClarity(value = {}) {
  return {
    why:String(value?.why || '').trim(),
    principle:String(value?.principle || '').trim(),
    picture:String(value?.picture || '').trim(),
    cue:String(value?.cue || value?.playerCue || '').trim(),
    questions:questionArray(value?.questions || value?.playerQuestions || [])
  };
}

export function clarityCompleteness(value = {}) {
  const clarity = normaliseClarity(value);
  const completed = [clarity.why, clarity.principle, clarity.picture, clarity.cue, clarity.questions.length].filter(Boolean).length;
  return { completed, total:5, complete:completed === 5 };
}

export function playerCueWordCount(value = '') {
  return String(value || '').trim().split(/\s+/).filter(Boolean).length;
}

function sessionClarity(session = {}) {
  return normaliseClarity(session?.gameModelClarity || {
    why:session?.gameModelWhy,
    principle:session?.gameModelPrinciple,
    picture:session?.gameModelPicture,
    cue:session?.gameModelCue,
    questions:session?.gameModelQuestions
  });
}

function currentClarity() {
  return normaliseClarity({
    why:field(FIELD_IDS.why)?.value,
    principle:field(FIELD_IDS.principle)?.value,
    picture:field(FIELD_IDS.picture)?.value,
    cue:field(FIELD_IDS.cue)?.value,
    questions:field(FIELD_IDS.questions)?.value
  });
}

function setCurrentClarity(value = {}) {
  const clarity = normaliseClarity(value);
  if (field(FIELD_IDS.why)) field(FIELD_IDS.why).value = clarity.why;
  if (field(FIELD_IDS.principle)) field(FIELD_IDS.principle).value = clarity.principle;
  if (field(FIELD_IDS.picture)) field(FIELD_IDS.picture).value = clarity.picture;
  if (field(FIELD_IDS.cue)) field(FIELD_IDS.cue).value = clarity.cue;
  if (field(FIELD_IDS.questions)) field(FIELD_IDS.questions).value = clarity.questions.join('\n');
  updateClarityUi();
}

function clearCurrentClarity() { setCurrentClarity({}); }

function addStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    #${CARD_ID}{margin:14px 0;padding:13px;border:1px solid rgba(56,189,248,.28);border-radius:14px;background:linear-gradient(145deg,rgba(56,189,248,.075),rgba(52,211,153,.035))}
    .gmClarityHead{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:8px}
    .gmClarityHead strong{display:block;font-size:14px;color:#eaf7ff}.gmClarityHead small{display:block;margin-top:2px;color:var(--text-dim);font-size:10.5px;line-height:1.35}
    .gmClarityStatus{flex:none;border:1px solid var(--border);border-radius:999px;padding:4px 8px;font-size:10px;font-weight:950;color:var(--text-dim);background:var(--surface-2)}
    .gmClarityStatus.complete{color:#d1fae5;border-color:rgba(52,211,153,.5);background:rgba(52,211,153,.1)}
    #${CARD_ID} label{display:flex;align-items:baseline;justify-content:space-between;gap:8px;margin-top:9px;color:#dbeafe}
    #${CARD_ID} label span{font-size:9px;font-weight:650;text-transform:none;letter-spacing:0;color:var(--text-faint)}
    #${CARD_ID} textarea{min-height:54px;resize:vertical}#${CARD_ID} #${FIELD_IDS.questions}{min-height:68px}
    .gmCueMeta{display:flex;justify-content:space-between;gap:8px;margin-top:4px;font-size:9.5px;color:var(--text-faint)}.gmCueMeta.warn{color:#fbbf24}
    .gmPlayerPreview{margin-top:11px;padding:10px;border:1px solid rgba(52,211,153,.24);border-radius:11px;background:rgba(4,13,18,.36)}
    .gmPlayerPreviewLabel{font-size:9px;font-weight:950;letter-spacing:.08em;text-transform:uppercase;color:var(--turf)}
    .gmPlayerCue{font-size:17px;font-weight:950;line-height:1.15;color:#fff;margin-top:4px}.gmPlayerPicture{font-size:11.5px;line-height:1.4;color:#cbd5e1;margin-top:5px}
    .gmQuestionChips{display:flex;gap:5px;flex-wrap:wrap;margin-top:7px}.gmQuestionChip{font-size:10px;line-height:1.25;padding:4px 7px;border:1px solid rgba(56,189,248,.25);border-radius:999px;color:#bae6fd;background:rgba(56,189,248,.06)}
    .gmClarityActions{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}.gmClarityActions button{flex:1 1 150px;padding:7px 9px;font-size:11px}
    .gmClarityCheck{margin-top:7px;font-size:10px;line-height:1.4;color:var(--text-dim)}.gmClarityCheck.good{color:#a7f3d0}.gmClarityCheck.warn{color:#fde68a}

    #${PREVIEW_ID},.gmSavedClarity{margin:9px 0;padding:9px 10px;border-radius:11px;border:1px solid rgba(56,189,248,.2);background:rgba(5,15,27,.34)}
    #${PREVIEW_ID} .gmPlayerCue,.gmSavedClarity .gmPlayerCue{font-size:14px}.gmSavedPrinciple{font-size:10px;font-weight:900;color:#93c5fd;text-transform:uppercase;letter-spacing:.05em}.gmSavedPicture{font-size:11px;color:var(--text-dim);line-height:1.35;margin-top:3px}

    #${SIDELINE_ID}{margin:0 0 10px;padding:11px 12px;border-radius:13px;border:1px solid rgba(255,255,255,.22);background:linear-gradient(135deg,rgba(3,18,12,.93),rgba(5,20,35,.9));box-shadow:0 8px 22px rgba(0,0,0,.22)}
    #${SIDELINE_ID} .gmSidelinePrinciple{font-size:10px;font-weight:950;text-transform:uppercase;letter-spacing:.07em;color:#a7f3d0}
    #${SIDELINE_ID} .gmPlayerCue{font-size:20px;margin-top:5px}#${SIDELINE_ID} .gmPlayerPicture{font-size:12px;color:#e2e8f0}
    #${SIDELINE_ID} details{margin-top:7px;font-size:10.5px;color:#cbd5e1}#${SIDELINE_ID} summary{cursor:pointer;color:#94a3b8;font-weight:800}

    #${REVIEW_ID}{margin:10px 0;padding:10px;border-radius:11px;border:1px solid rgba(56,189,248,.22);background:rgba(7,17,30,.45)}
    #${REVIEW_ID} .gmReviewPrompt{margin-top:7px;font-size:10.5px;color:#cbd5e1;line-height:1.45}

    @media(max-width:700px){#${CARD_ID}{padding:10px;margin:10px 0}.gmPlayerCue{font-size:15px}#${SIDELINE_ID} .gmPlayerCue{font-size:18px}.gmClarityActions button{flex-basis:100%}}
  `;
  document.head.appendChild(style);
}

function playerPreviewMarkup(clarity, compact = false) {
  const q = clarity.questions || [];
  if (!clarity.cue && !clarity.picture && !q.length) return '<div class="gmPlayerPicture">Complete the picture, cue and questions to create the player-facing message.</div>';
  return `${clarity.cue ? `<div class="gmPlayerCue">${escapeText(clarity.cue)}</div>` : ''}${clarity.picture ? `<div class="gmPlayerPicture">${escapeText(clarity.picture)}</div>` : ''}${q.length ? `<div class="gmQuestionChips">${q.slice(0, compact ? 3 : 5).map(question => `<span class="gmQuestionChip">${escapeText(question)}</span>`).join('')}</div>` : ''}`;
}

function ensureBuilderCard() {
  const theme = document.getElementById('sTheme');
  if (!theme) return null;
  let card = document.getElementById(CARD_ID);
  if (card) return card;
  card = document.createElement('section');
  card.id = CARD_ID;
  card.innerHTML = `
    <div class="gmClarityHead"><div><strong>Game Model · Session Clarity</strong><small>Coach logic first. Player message second. Every session should point back to a clear football picture.</small></div><span class="gmClarityStatus" id="gmClarityStatus">0/5</span></div>
    <label for="${FIELD_IDS.why}">WHY <span>Why is this worth doing?</span></label><textarea id="${FIELD_IDS.why}" placeholder="The reason this behaviour matters — the problem it solves or advantage it creates."></textarea>
    <label for="${FIELD_IDS.principle}">PRINCIPLE <span>The transferable belief</span></label><input id="${FIELD_IDS.principle}" placeholder="e.g. Move them to break them">
    <label for="${FIELD_IDS.picture}">PICTURE <span>What should the player recognise?</span></label><textarea id="${FIELD_IDS.picture}" placeholder="Describe the recognisable football picture, not a memorised pattern."></textarea>
    <label for="${FIELD_IDS.cue}">PLAYER CUE <span>Aim for 3–8 words</span></label><input id="${FIELD_IDS.cue}" maxlength="90" placeholder="e.g. Break them. If not, move them."><div class="gmCueMeta" id="gmCueMeta"><span>Short enough to use live</span><span id="gmCueCount">0 words</span></div>
    <label for="${FIELD_IDS.questions}">PLAYER QUESTIONS <span>One per line · ideally 1–3</span></label><textarea id="${FIELD_IDS.questions}" placeholder="Can we break them?\nWho have they left free?\nWhat do I need to move?"></textarea>
    <div class="gmPlayerPreview"><div class="gmPlayerPreviewLabel">Player message</div><div id="gmLivePlayerPreview"></div></div>
    <div class="gmClarityCheck" id="gmClarityCheckText">Build the five parts, then keep the language stable across training.</div>
    <div class="gmClarityActions"><button type="button" id="gmCheckClarityBtn">Check Clarity</button><button type="button" id="gmExportEvidenceBtn">Export Coaching Evidence</button></div>`;
  const subtitle = document.getElementById('sessionSubtitleField');
  if (subtitle) subtitle.insertAdjacentElement('afterend', card);
  else theme.insertAdjacentElement('afterend', card);
  Object.values(FIELD_IDS).forEach(id => field(id)?.addEventListener('input', scheduleRefresh));
  document.getElementById('gmCheckClarityBtn')?.addEventListener('click', showClarityCheck);
  document.getElementById('gmExportEvidenceBtn')?.addEventListener('click', exportCoachingEvidence);
  updateClarityUi();
  return card;
}

function clarityCheckMessage(clarity = currentClarity()) {
  const missing = [];
  if (!clarity.why) missing.push('WHY');
  if (!clarity.principle) missing.push('PRINCIPLE');
  if (!clarity.picture) missing.push('PICTURE');
  if (!clarity.cue) missing.push('PLAYER CUE');
  if (!clarity.questions.length) missing.push('PLAYER QUESTIONS');
  const cueWords = playerCueWordCount(clarity.cue);
  const notes = [];
  if (missing.length) notes.push(`Missing: ${missing.join(', ')}`);
  if (clarity.cue && cueWords > 8) notes.push(`Player cue is ${cueWords} words — see if it can be reduced to 3–8.`);
  if (clarity.questions.length > 3) notes.push('There are more than 3 player questions — choose the questions that best expose understanding.');
  if (!notes.length) notes.push('Clear: the session has a why, principle, picture, short cue and player questions.');
  return { message:notes.join(' '), good:!missing.length && cueWords <= 8 && clarity.questions.length <= 3 };
}

function showClarityCheck() {
  updateClarityUi();
  const result = clarityCheckMessage();
  const target = document.getElementById('gmClarityCheckText');
  if (target) {
    target.textContent = result.message;
    target.classList.toggle('good', result.good);
    target.classList.toggle('warn', !result.good);
  }
}

function updateClarityUi() {
  const clarity = currentClarity();
  const status = clarityCompleteness(clarity);
  const badge = document.getElementById('gmClarityStatus');
  if (badge) {
    badge.textContent = `${status.completed}/5`;
    badge.classList.toggle('complete', status.complete);
  }
  const words = playerCueWordCount(clarity.cue);
  const cueCount = document.getElementById('gmCueCount');
  if (cueCount) cueCount.textContent = `${words} ${words === 1 ? 'word' : 'words'}`;
  document.getElementById('gmCueMeta')?.classList.toggle('warn', words > 8);
  const live = document.getElementById('gmLivePlayerPreview');
  if (live) live.innerHTML = playerPreviewMarkup(clarity);
  decoratePlannerPreview();
}

function scheduleRefresh() {
  cancelAnimationFrame(refreshFrame);
  refreshFrame = requestAnimationFrame(() => {
    refreshFrame = 0;
    updateClarityUi();
    decorateSavedSessions();
    decorateSideline();
  });
}

function decoratePlannerPreview() {
  const preview = document.getElementById('preview');
  if (!preview) return;
  preview.querySelector(`#${PREVIEW_ID}`)?.remove();
  const clarity = currentClarity();
  if (!clarity.principle && !clarity.cue && !clarity.picture) return;
  const block = document.createElement('div');
  block.id = PREVIEW_ID;
  block.innerHTML = `${clarity.principle ? `<div class="gmSavedPrinciple">${escapeText(clarity.principle)}</div>` : ''}${playerPreviewMarkup(clarity, true)}`;
  const heading = preview.querySelector('h2');
  if (heading) heading.insertAdjacentElement('afterend', block);
  else preview.prepend(block);
}

function installPlannerPersistence() {
  let originalPlanner;
  try { originalPlanner = currentPlannerSession; } catch (_) { originalPlanner = window.currentPlannerSession; }
  if (typeof originalPlanner === 'function' && !originalPlanner.__gameModelClarity) {
    const wrapped = function(...args) {
      return { ...(originalPlanner.apply(this, args) || {}), gameModelClarity:currentClarity() };
    };
    wrapped.__gameModelClarity = true;
    try { currentPlannerSession = wrapped; } catch (_) {}
    window.currentPlannerSession = wrapped;
  }

  let originalLoad;
  try { originalLoad = loadSessionToPlanner; } catch (_) { originalLoad = window.loadSessionToPlanner; }
  if (typeof originalLoad === 'function' && !originalLoad.__gameModelClarity) {
    const wrapped = function(index, mode = 'edit', ...rest) {
      const session = appDb()?.sessions?.[index];
      const result = originalLoad.call(this, index, mode, ...rest);
      setTimeout(() => { ensureBuilderCard(); setCurrentClarity(sessionClarity(session)); }, 0);
      return result;
    };
    wrapped.__gameModelClarity = true;
    try { loadSessionToPlanner = wrapped; } catch (_) {}
    window.loadSessionToPlanner = wrapped;
  }

  let originalReset;
  try { originalReset = resetSessionPlanner; } catch (_) { originalReset = window.resetSessionPlanner; }
  if (typeof originalReset === 'function' && !originalReset.__gameModelClarity) {
    const wrapped = function(...args) {
      const result = originalReset.apply(this, args);
      clearCurrentClarity();
      return result;
    };
    wrapped.__gameModelClarity = true;
    try { resetSessionPlanner = wrapped; } catch (_) {}
    window.resetSessionPlanner = wrapped;
  }

  let originalApplyDraft;
  try { originalApplyDraft = applyDraftDetails; } catch (_) { originalApplyDraft = window.applyDraftDetails; }
  if (typeof originalApplyDraft === 'function' && !originalApplyDraft.__gameModelClarity) {
    const wrapped = function(...args) {
      const result = originalApplyDraft.apply(this, args);
      clearCurrentClarity();
      return result;
    };
    wrapped.__gameModelClarity = true;
    try { applyDraftDetails = wrapped; } catch (_) {}
    window.applyDraftDetails = wrapped;
  }

  let originalRenderPreview;
  try { originalRenderPreview = renderPreview; } catch (_) { originalRenderPreview = window.renderPreview; }
  if (typeof originalRenderPreview === 'function' && !originalRenderPreview.__gameModelClarity) {
    const wrapped = function(...args) {
      const result = originalRenderPreview.apply(this, args);
      decoratePlannerPreview();
      return result;
    };
    wrapped.__gameModelClarity = true;
    try { renderPreview = wrapped; } catch (_) {}
    window.renderPreview = wrapped;
  }
}

function installBlueprintPersistence() {
  let originalSaveBlueprint;
  try { originalSaveBlueprint = saveCurrentAsBlueprint; } catch (_) { originalSaveBlueprint = window.saveCurrentAsBlueprint; }
  if (typeof originalSaveBlueprint === 'function' && !originalSaveBlueprint.__gameModelClarity) {
    const wrapped = function(...args) {
      const data = appDb();
      const before = data?.sessionTemplates?.length || 0;
      const clarity = currentClarity();
      const result = originalSaveBlueprint.apply(this, args);
      const after = data?.sessionTemplates?.length || 0;
      if (after > before && data.sessionTemplates[after - 1]) {
        data.sessionTemplates[after - 1].gameModelClarity = clarity;
        try { if (typeof store === 'function') store(); } catch (_) {}
      }
      return result;
    };
    wrapped.__gameModelClarity = true;
    try { saveCurrentAsBlueprint = wrapped; } catch (_) {}
    window.saveCurrentAsBlueprint = wrapped;
  }

  let originalUseBlueprint;
  try { originalUseBlueprint = useBlueprint; } catch (_) { originalUseBlueprint = window.useBlueprint; }
  if (typeof originalUseBlueprint === 'function' && !originalUseBlueprint.__gameModelClarity) {
    const wrapped = function(index, ...rest) {
      const template = appDb()?.sessionTemplates?.[index];
      const result = originalUseBlueprint.call(this, index, ...rest);
      setTimeout(() => setCurrentClarity(sessionClarity(template)), 0);
      return result;
    };
    wrapped.__gameModelClarity = true;
    try { useBlueprint = wrapped; } catch (_) {}
    window.useBlueprint = wrapped;
  }
}

function sessionIndexFromElement(element) {
  const explicit = element?.querySelector?.('[data-index]')?.dataset?.index;
  if (explicit !== undefined && /^\d+$/.test(explicit)) return Number(explicit);
  const button = element?.querySelector?.('button[onclick*="openGrassView("],button[onclick*="loadSessionToPlanner("],button[onclick*="duplicateSession("]');
  const source = button?.getAttribute('onclick') || '';
  const match = source.match(/(?:openGrassView|loadSessionToPlanner|duplicateSession)\((\d+)/);
  return match ? Number(match[1]) : -1;
}

function decorateSavedCard(card) {
  const index = sessionIndexFromElement(card);
  if (index < 0) return;
  const session = appDb()?.sessions?.[index];
  if (!session) return;
  const clarity = sessionClarity(session);
  let block = card.querySelector('.gmSavedClarity');
  if (!clarity.principle && !clarity.cue && !clarity.picture) { block?.remove(); return; }
  if (!block) {
    block = document.createElement('div');
    block.className = 'gmSavedClarity';
    const actions = card.querySelector('.sessionLibraryActions,.sessionActions,.archiveSessionActions');
    if (actions) actions.insertAdjacentElement('beforebegin', block);
    else card.appendChild(block);
  }
  const key = JSON.stringify([clarity.principle, clarity.cue, clarity.picture]);
  if (block.dataset.key === key) return;
  block.dataset.key = key;
  block.innerHTML = `${clarity.principle ? `<div class="gmSavedPrinciple">${escapeText(clarity.principle)}</div>` : ''}${clarity.cue ? `<div class="gmPlayerCue">${escapeText(clarity.cue)}</div>` : ''}${clarity.picture ? `<div class="gmSavedPicture">${escapeText(clarity.picture)}</div>` : ''}`;
}

function decorateSavedSessions() {
  document.querySelectorAll('#sessionLibraryResults .sessionLibraryCard,#archiveList .session').forEach(decorateSavedCard);
}

function watchSavedSessions() {
  const library = document.getElementById('sessionLibraryResults');
  if (library && typeof MutationObserver !== 'undefined') {
    sessionLibraryObserver?.disconnect();
    sessionLibraryObserver = new MutationObserver(() => requestAnimationFrame(decorateSavedSessions));
    sessionLibraryObserver.observe(library, { childList:true, subtree:false });
  }
  const archive = document.getElementById('archiveList');
  if (archive && typeof MutationObserver !== 'undefined') {
    archiveObserver?.disconnect();
    archiveObserver = new MutationObserver(() => requestAnimationFrame(decorateSavedSessions));
    archiveObserver.observe(archive, { childList:true, subtree:false });
  }
}

function installSidelineHook() {
  let original;
  try { original = openGrassView; } catch (_) { original = window.openGrassView; }
  if (typeof original === 'function' && !original.__gameModelClarity) {
    const wrapped = function(index, ...rest) {
      window.__gameModelSidelineSessionIndex = Number(index);
      const result = original.call(this, index, ...rest);
      setTimeout(decorateSideline, 0);
      setTimeout(decorateSideline, 80);
      return result;
    };
    wrapped.__gameModelClarity = true;
    try { openGrassView = wrapped; } catch (_) {}
    window.openGrassView = wrapped;
  }
}

function decorateSideline() {
  const content = document.getElementById('grassContent');
  if (!content) return;
  const index = Number(window.__gameModelSidelineSessionIndex);
  const session = Number.isInteger(index) ? appDb()?.sessions?.[index] : null;
  const clarity = sessionClarity(session || {});
  let block = document.getElementById(SIDELINE_ID);
  if (!clarity.principle && !clarity.cue && !clarity.picture && !clarity.questions.length) { block?.remove(); return; }
  if (!block) {
    block = document.createElement('section');
    block.id = SIDELINE_ID;
    content.prepend(block);
  }
  const key = JSON.stringify(clarity);
  if (block.dataset.key === key) return;
  block.dataset.key = key;
  block.innerHTML = `${clarity.principle ? `<div class="gmSidelinePrinciple">${escapeText(clarity.principle)}</div>` : ''}${playerPreviewMarkup(clarity)}${clarity.why ? `<details><summary>Why are we doing this?</summary><div style="margin-top:5px">${escapeText(clarity.why)}</div></details>` : ''}`;
}

function watchSideline() {
  const content = document.getElementById('grassContent');
  if (!content || typeof MutationObserver === 'undefined') return;
  sidelineObserver?.disconnect();
  sidelineObserver = new MutationObserver(() => requestAnimationFrame(decorateSideline));
  sidelineObserver.observe(content, { childList:true, subtree:false });
}

function activeReviewSession() {
  const overlay = document.getElementById('postSessionReviewOverlay');
  if (!overlay?.classList.contains('open')) return null;
  const title = overlay.querySelector('h2,h3')?.textContent || '';
  const data = appDb();
  const sessionId = overlay.dataset.sessionId;
  if (sessionId) return data?.sessions?.find(item => String(item.id) === String(sessionId)) || null;
  try {
    if (typeof reviewSessionIndex === 'number') return data?.sessions?.[reviewSessionIndex] || null;
  } catch (_) {}
  return data?.sessions?.find(item => title.includes(item.date || '') && title.includes(item.theme || '')) || null;
}

function decorateReview() {
  const overlay = document.getElementById('postSessionReviewOverlay');
  if (!overlay?.classList.contains('open')) return;
  const session = activeReviewSession();
  const clarity = sessionClarity(session || {});
  let block = document.getElementById(REVIEW_ID);
  if (!clarity.principle && !clarity.cue && !clarity.picture) { block?.remove(); return; }
  if (!block) {
    block = document.createElement('section');
    block.id = REVIEW_ID;
    const firstPractice = overlay.querySelector('.reviewPractice');
    if (firstPractice) firstPractice.insertAdjacentElement('beforebegin', block);
    else overlay.querySelector('.postReviewBody,.reviewBody')?.prepend(block);
  }
  if (!block) return;
  block.innerHTML = `<div class="gmSavedPrinciple">Clarity check · ${escapeText(clarity.principle || 'Session principle')}</div>${playerPreviewMarkup(clarity, true)}<div class="gmReviewPrompt"><b>Review the learning, not just the practice:</b> Did players recognise the picture? Did the cue help them solve it? Which question exposed whether they understood why?</div>`;
}

function watchReview() {
  const overlay = document.getElementById('postSessionReviewOverlay');
  if (!overlay || typeof MutationObserver === 'undefined' || reviewObserver) return;
  reviewObserver = new MutationObserver(() => {
    if (overlay.classList.contains('open')) setTimeout(decorateReview, 0);
  });
  reviewObserver.observe(overlay, { attributes:true, attributeFilter:['class'] });
}

function evidencePractice(practice = {}) {
  return {
    id:practice.id || '', name:practice.name || '', stage:practice.stage || '', theme:practice.theme || '', players:practice.players || '', time:practice.time || '',
    description:practice.desc || practice.description || '', coachingPoints:practice.cp || practice.coachingPoints || '', progressions:practice.prog || practice.progressions || '', regressions:practice.reg || practice.regressions || '',
    rules:practice.rules || '', objective:practice.objective || '', gameModelLinks:practice.links || '', cues:practice.cues || '', favourite:!!practice.isFavourite
  };
}

function evidenceSession(session = {}) {
  return {
    id:session.id || '', date:session.date || '', team:session.team || '', theme:session.theme || '', subtitle:session.subtitle || '', objective:session.objective || '',
    gameModelClarity:sessionClarity(session), legacyGameModelLinks:session.links || '', legacyCoachCues:session.cues || '', reflection:session.reflect || '', rating:session.rating || '',
    practiceIds:Array.isArray(session.drills) ? [...session.drills] : [], review:session.review || null
  };
}

export function buildCoachingEvidence(data = {}) {
  return {
    exportedAt:new Date().toISOString(),
    purpose:'Evidence pack for refining a stable, clear and portable coaching game model.',
    framework:['WHY','PRINCIPLE','PICTURE','PLAYER CUE','PLAYER QUESTIONS'],
    sessions:(data.sessions || []).map(evidenceSession),
    practices:(data.practices || []).map(evidencePractice),
    sessionTemplates:(data.sessionTemplates || []).map(template => ({ id:template.id || '', name:template.name || '', theme:template.theme || '', objective:template.objective || '', gameModelClarity:sessionClarity(template), practiceIds:Array.isArray(template.drills) ? [...template.drills] : [] }))
  };
}

function exportCoachingEvidence() {
  const evidence = buildCoachingEvidence(appDb() || {});
  const blob = new Blob([JSON.stringify(evidence, null, 2)], { type:'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  const date = new Date().toISOString().slice(0, 10);
  anchor.href = url;
  anchor.download = `coaching-evidence-${date}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  try { if (typeof dsToast === 'function') dsToast('Coaching evidence exported'); } catch (_) {}
}

function ensureAll() {
  ensureBuilderCard();
  installPlannerPersistence();
  installBlueprintPersistence();
  installSidelineHook();
  watchSideline();
  watchSavedSessions();
  watchReview();
  decoratePlannerPreview();
  decorateSavedSessions();
  decorateSideline();
  decorateReview();
}

function install() {
  addStyles();
  ensureAll();
  setTimeout(ensureAll, 120);
  setTimeout(ensureAll, 450);
  setTimeout(ensureAll, 1200);
  document.addEventListener('click', event => {
    if (event.target.closest?.('[data-tab="planner"],button[onclick*="showBuildRoute"],button[onclick*="loadSessionToPlanner"],button[onclick*="openGrassView"]')) setTimeout(ensureAll, 0);
  }, true);
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
  else install();
}
