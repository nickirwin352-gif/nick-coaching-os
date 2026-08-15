const STYLE_ID = 'sessionIntelligenceUxStyles';
const SUBTITLE_FIELD_ID = 'sessionSubtitleField';
const REVIEW_TOAST_ID = 'instantReviewSaveToast';
let reviewSessionRef = null;
let reviewObserver = null;
let pendingCloudSnapshot = null;
let cloudSyncRunning = false;
let cloudRetryCount = 0;

function appDb() {
  try { return typeof db !== 'undefined' ? db : window.db; }
  catch (_) { return window.db; }
}

function clone(value) {
  try { return typeof structuredClone === 'function' ? structuredClone(value) : JSON.parse(JSON.stringify(value)); }
  catch (_) { return JSON.parse(JSON.stringify(value)); }
}

function esc(value) {
  try { if (typeof escapeHtml === 'function') return escapeHtml(String(value ?? '')); } catch (_) {}
  return String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
}

function clampScore(value) {
  const number = Number(value) || 0;
  return number ? Math.max(1, Math.min(10, number)) : 0;
}

export function scoreOutOfTen(session = {}) {
  const value = Number(session?.review?.rating ?? session?.rating ?? 0);
  if (!value) return 0;
  if (session?.review?.scale === 10 || value > 5) return clampScore(value);
  return clampScore(value * 2);
}

function practiceScoreOutOfTen(review = {}, session = {}) {
  const value = Number(review?.effectiveness || 0);
  if (!value) return 0;
  if (session?.review?.scale === 10 || value > 5) return clampScore(value);
  return clampScore(value * 2);
}

export function trafficHue(score) {
  const value = clampScore(score);
  if (!value) return 0;
  if (value <= 5) return Math.round((value - 1) / 4 * 38);
  return Math.round(38 + (value - 5) / 5 * 87);
}

export function latestPracticeReview(sessions = [], practiceId = '') {
  const ordered = [...sessions].sort((a, b) => String(b?.review?.reviewedAt || b?.date || '').localeCompare(String(a?.review?.reviewedAt || a?.date || '')));
  for (const session of ordered) {
    const review = (session?.review?.practices || []).find(item => item?.practiceId === practiceId);
    if (!review) continue;
    return {
      session,
      review,
      score: practiceScoreOutOfTen(review, session),
      reasoning: String(review.reasoning || review.note || '').trim()
    };
  }
  return null;
}

function addStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    #${SUBTITLE_FIELD_ID}{margin-top:10px}#${SUBTITLE_FIELD_ID} label{margin-top:0}#${SUBTITLE_FIELD_ID} .sessionSubtitleHint{font-size:10.5px;color:var(--text-dim);margin-top:5px;line-height:1.35}
    .sessionSubtitleText{font-size:12px;font-weight:850;color:#bae6fd;margin:-2px 0 7px}.sessionPreviewSubtitle{margin:2px 0 10px;color:#bae6fd;font-weight:850;font-size:13px}
    .sessionLibraryCard.qualityRated,.recentSessionCard.qualityRated,.session.qualityRated{border-color:hsl(var(--quality-hue) 66% 39% / .78)!important;background:linear-gradient(135deg,hsl(var(--quality-hue) 52% 17% / .82),var(--surface-2) 62%)!important;box-shadow:inset 4px 0 0 hsl(var(--quality-hue) 72% 43%),0 10px 28px rgba(0,0,0,.17)!important}
    .qualityScoreBadge{display:inline-flex;align-items:center;justify-content:center;padding:4px 8px;border-radius:999px;font-size:11px;font-weight:950;white-space:nowrap;color:#fff;background:hsl(var(--quality-hue) 61% 31%);border:1px solid hsl(var(--quality-hue) 72% 48%)}
    .sessionLibraryMeta .qualityScoreBadge,.archiveTopMeta .qualityScoreBadge{margin:2px 4px 2px 0}
    .sessionReviewMemory,.practiceReviewMemory,.archiveReviewMemory{margin-top:9px;padding:8px 9px;border:1px solid hsl(var(--quality-hue,205) 48% 34% / .48);border-radius:10px;background:rgba(4,10,20,.34);font-size:11.5px;line-height:1.42;color:var(--text-dim)}
    .sessionReviewMemory b,.practiceReviewMemory b,.archiveReviewMemory b{color:var(--text)}.reviewMemoryReason{display:block;margin-top:3px;color:#dce7f5}
    #postSessionReviewOverlay .reviewPracticeGrid{display:grid!important;grid-template-columns:150px minmax(260px,1fr)!important;gap:8px 10px!important;align-items:start!important}
    #postSessionReviewOverlay .reviewEffectField{grid-column:1;grid-row:1}#postSessionReviewOverlay .reviewEngagementField{grid-column:1;grid-row:2}#postSessionReviewOverlay .reviewDecisionField{grid-column:1;grid-row:3}
    #postSessionReviewOverlay .reviewPracticeGrid>div.reviewReasoningField{display:block!important;grid-column:2;grid-row:1 / span 3;align-self:stretch}#postSessionReviewOverlay .reviewPracticeGrid>div.reviewReasoningField.reviewNoteHidden{display:block!important}
    #postSessionReviewOverlay .reviewReasoningField label{color:#bae6fd}#postSessionReviewOverlay .reviewReasoningField textarea{min-height:118px;resize:vertical;background:rgba(7,16,29,.82)}#postSessionReviewOverlay .reasoningHint{font-size:10px;color:var(--text-dim);margin-top:4px;line-height:1.35}
    .calSessionDot.sessionQualityDot{display:block!important;padding:4px 6px!important;border-radius:8px!important;white-space:normal!important;line-height:1.15!important;color:#fff!important;background:hsl(var(--quality-hue) 54% 22% / .9)!important;border-color:hsl(var(--quality-hue) 68% 42%)!important}.calSessionDot .calSessionTitle{display:block;font-size:10px;font-weight:850;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.calSessionDot .calSessionScore{display:block;margin-top:2px;font-size:10px;font-weight:950;color:#fff}.calSessionDot .calSessionSubtitle{display:block;margin-top:1px;font-size:8.5px;color:rgba(255,255,255,.78);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    #${REVIEW_TOAST_ID}{position:fixed;left:50%;bottom:calc(18px + env(safe-area-inset-bottom));transform:translateX(-50%);z-index:30000;padding:10px 14px;border-radius:999px;background:#0d1b2a;border:1px solid rgba(52,211,153,.42);box-shadow:0 14px 42px rgba(0,0,0,.4);font-size:12px;font-weight:850;color:#d1fae5;max-width:calc(100vw - 24px);white-space:nowrap}
    @media(max-width:760px){#postSessionReviewOverlay .reviewPracticeGrid{grid-template-columns:1fr!important}#postSessionReviewOverlay .reviewEffectField,#postSessionReviewOverlay .reviewEngagementField,#postSessionReviewOverlay .reviewDecisionField,#postSessionReviewOverlay .reviewReasoningField{grid-column:1!important;grid-row:auto!important}#postSessionReviewOverlay .reviewReasoningField textarea{min-height:96px}.sessionReviewMemory,.practiceReviewMemory,.archiveReviewMemory{font-size:11px}.calSessionDot.sessionQualityDot{padding:3px 4px!important}.calSessionDot .calSessionTitle,.calSessionDot .calSessionScore{font-size:9px}.calSessionDot .calSessionSubtitle{font-size:8px}}
  `;
  document.head.appendChild(style);
}

function setSignature(element, signature) {
  if (!element) return false;
  if (element.dataset.sessionIntelligenceSignature === signature) return false;
  element.dataset.sessionIntelligenceSignature = signature;
  return true;
}

function applyQuality(element, score) {
  if (!element) return;
  const value = Number(score) || 0;
  element.classList.toggle('qualityRated', value > 0);
  if (value) element.style.setProperty('--quality-hue', String(trafficHue(value)));
  else element.style.removeProperty('--quality-hue');
}

function scoreBadge(score, label = '') {
  const value = Number(score) || 0;
  return value ? `<span class="qualityScoreBadge" style="--quality-hue:${trafficHue(value)}">${value}/10${label ? ` · ${esc(label)}` : ''}</span>` : '';
}

function subtitleInput() { return document.getElementById('sessionSubtitle'); }
function currentSubtitle() { return String(subtitleInput()?.value || '').trim(); }

function ensureSubtitleField() {
  const theme = document.getElementById('sTheme');
  if (!theme || document.getElementById(SUBTITLE_FIELD_ID)) return;
  const wrap = document.createElement('div');
  wrap.id = SUBTITLE_FIELD_ID;
  wrap.innerHTML = `<label for="sessionSubtitle">Session Subtitle / Format</label><input id="sessionSubtitle" list="sessionSubtitleSuggestions" placeholder="e.g. Patterns, SSGs, Phase of Play, Unit Work"><datalist id="sessionSubtitleSuggestions"><option value="Patterns"><option value="SSGs"><option value="Phase of Play"><option value="Unit Work"><option value="Rondo"><option value="Opposed Practice"><option value="Unopposed Pattern"><option value="Game Based"></datalist><div class="sessionSubtitleHint">Keep the main theme broad, then use this for the specific type of session you ran.</div>`;
  theme.insertAdjacentElement('afterend', wrap);
  subtitleInput()?.addEventListener('input', () => {
    try { if (typeof renderPreview === 'function') renderPreview(); } catch (_) {}
    try { if (typeof renderCurrentSessionDock === 'function') renderCurrentSessionDock(); } catch (_) {}
  });
}

function decoratePreviewSubtitle() {
  const preview = document.getElementById('preview');
  if (!preview) return;
  preview.querySelector('.sessionPreviewSubtitle')?.remove();
  const subtitle = currentSubtitle();
  const heading = preview.querySelector('h2');
  if (!subtitle || !heading) return;
  const line = document.createElement('div');
  line.className = 'sessionPreviewSubtitle';
  line.textContent = subtitle;
  heading.insertAdjacentElement('afterend', line);
}

function wrapPlannerData() {
  let original;
  try { original = currentPlannerSession; } catch (_) { original = window.currentPlannerSession; }
  if (typeof original === 'function' && !original.__sessionSubtitle) {
    const wrapped = function(...args) { return { ...(original.apply(this, args) || {}), subtitle:currentSubtitle() }; };
    wrapped.__sessionSubtitle = true;
    try { currentPlannerSession = wrapped; } catch (_) {}
    window.currentPlannerSession = wrapped;
  }

  let loadOriginal;
  try { loadOriginal = loadSessionToPlanner; } catch (_) { loadOriginal = window.loadSessionToPlanner; }
  if (typeof loadOriginal === 'function' && !loadOriginal.__sessionSubtitle) {
    const wrapped = function(index, mode = 'edit') {
      const session = appDb()?.sessions?.[index];
      const result = loadOriginal.apply(this, arguments);
      ensureSubtitleField();
      if (subtitleInput()) subtitleInput().value = session?.subtitle || '';
      try { if (typeof renderPreview === 'function') renderPreview(); } catch (_) {}
      try { if (typeof renderCurrentSessionDock === 'function') renderCurrentSessionDock(); } catch (_) {}
      return result;
    };
    wrapped.__sessionSubtitle = true;
    try { loadSessionToPlanner = wrapped; } catch (_) {}
    window.loadSessionToPlanner = wrapped;
  }

  let resetOriginal;
  try { resetOriginal = resetSessionPlanner; } catch (_) { resetOriginal = window.resetSessionPlanner; }
  if (typeof resetOriginal === 'function' && !resetOriginal.__sessionSubtitle) {
    const wrapped = function(...args) {
      const result = resetOriginal.apply(this, args);
      ensureSubtitleField();
      if (subtitleInput()) subtitleInput().value = '';
      try { if (typeof renderPreview === 'function') renderPreview(); } catch (_) {}
      try { if (typeof renderCurrentSessionDock === 'function') renderCurrentSessionDock(); } catch (_) {}
      return result;
    };
    wrapped.__sessionSubtitle = true;
    try { resetSessionPlanner = wrapped; } catch (_) {}
    window.resetSessionPlanner = wrapped;
  }

  let draftOriginal;
  try { draftOriginal = applyDraftDetails; } catch (_) { draftOriginal = window.applyDraftDetails; }
  if (typeof draftOriginal === 'function' && !draftOriginal.__sessionSubtitle) {
    const wrapped = function(...args) {
      const result = draftOriginal.apply(this, args);
      ensureSubtitleField();
      if (subtitleInput()) subtitleInput().value = '';
      try { if (typeof renderPreview === 'function') renderPreview(); } catch (_) {}
      try { if (typeof renderCurrentSessionDock === 'function') renderCurrentSessionDock(); } catch (_) {}
      return result;
    };
    wrapped.__sessionSubtitle = true;
    try { applyDraftDetails = wrapped; } catch (_) {}
    window.applyDraftDetails = wrapped;
  }
}

function wrapPreviewAndDock() {
  let previewOriginal;
  try { previewOriginal = renderPreview; } catch (_) { previewOriginal = window.renderPreview; }
  if (typeof previewOriginal === 'function' && !previewOriginal.__sessionIntelligence) {
    const wrapped = function(...args) { const result = previewOriginal.apply(this, args); decoratePreviewSubtitle(); return result; };
    wrapped.__sessionIntelligence = true;
    try { renderPreview = wrapped; } catch (_) {}
    window.renderPreview = wrapped;
  }
  let dockOriginal;
  try { dockOriginal = renderCurrentSessionDock; } catch (_) { dockOriginal = window.renderCurrentSessionDock; }
  if (typeof dockOriginal === 'function' && !dockOriginal.__sessionSubtitle) {
    const wrapped = function(...args) {
      const result = dockOriginal.apply(this, args);
      const subtitle = currentSubtitle();
      const meta = document.getElementById('currentSessionDockMeta');
      const drawerMeta = document.getElementById('currentSessionDrawerMeta');
      if (subtitle && meta && !meta.textContent.includes(subtitle)) meta.textContent += ` · ${subtitle}`;
      if (subtitle && drawerMeta && !drawerMeta.textContent.includes(subtitle)) drawerMeta.textContent += ` · ${subtitle}`;
      return result;
    };
    wrapped.__sessionSubtitle = true;
    try { renderCurrentSessionDock = wrapped; } catch (_) {}
    window.renderCurrentSessionDock = wrapped;
  }
}

function resolveReviewSession() {
  if (reviewSessionRef) return reviewSessionRef;
  try { const side = typeof sidelineState !== 'undefined' ? sidelineState : window.sidelineState; if (side?.session) return side.session; } catch (_) {}
  const data = appDb();
  if (!data?.sessions?.length) return null;
  const meta = document.getElementById('reviewMeta')?.textContent || '';
  const title = document.getElementById('reviewTitle')?.textContent || '';
  const date = meta.split('·')[0]?.trim();
  return data.sessions.find(session => (!date || String(session.date || '') === date) && (!session.team || title.includes(session.team)) && (!session.theme || title.includes(session.theme))) || null;
}

function enhanceReasoningFields() {
  const overlay = document.getElementById('postSessionReviewOverlay');
  if (!overlay?.classList.contains('open')) return;
  const session = resolveReviewSession();
  [...overlay.querySelectorAll('.reviewPractice')].forEach((row, index) => {
    row.querySelector('.practiceEffect')?.closest('div')?.classList.add('reviewEffectField');
    row.querySelector('.practiceEngagement')?.closest('div')?.classList.add('reviewEngagementField');
    row.querySelector('.practiceDecision')?.closest('div')?.classList.add('reviewDecisionField');
    const textarea = row.querySelector('.practiceNote');
    const field = textarea?.closest('div');
    if (!textarea || !field) return;
    field.classList.remove('reviewNoteHidden');
    field.classList.add('reviewReasoningField');
    textarea.classList.add('practiceReasoning');
    const label = field.querySelector('label');
    if (label) label.textContent = 'Reasoning / Coach Feedback';
    textarea.placeholder = 'Why this score? Note a minor tweak, a major problem, or exactly what made it worth repeating.';
    const previous = session?.review?.practices?.[index];
    if (!textarea.value && (previous?.reasoning || previous?.note)) textarea.value = previous.reasoning || previous.note;
    if (!field.querySelector('.reasoningHint')) {
      const hint = document.createElement('div');
      hint.className = 'reasoningHint';
      hint.textContent = 'Saved with this practice so the score still makes sense when you consider using it again.';
      field.appendChild(hint);
    }
  });
}

function selectedChoice(name) { return document.querySelector(`[data-choice="${name}"] button.on`)?.dataset.value || ''; }
function summariseReview(review) { return [review.worked && `Worked: ${review.worked}`, review.didntWork && `Didn't: ${review.didntWork}`, review.repeat && `Repeat: ${review.repeat}`, review.changeNext && `Change next: ${review.changeNext}`].filter(Boolean).join('\n'); }

function showReviewToast(message) {
  let toast = document.getElementById(REVIEW_TOAST_ID);
  if (!toast) { toast = document.createElement('div'); toast.id = REVIEW_TOAST_ID; document.body.appendChild(toast); }
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => { toast.hidden = true; }, 2200);
}

function updateCloudStatusSafe(text) { try { if (typeof updateCloudStatus === 'function') updateCloudStatus(text, new Date().toLocaleString('en-GB')); } catch (_) {} }
function saveLocalSnapshot(data) { try { localStorage.setItem('nickCoachOSv3', JSON.stringify(data)); return true; } catch (error) { console.error('Local review save failed', error); return false; } }

async function flushReviewCloud() {
  if (cloudSyncRunning || !pendingCloudSnapshot) return;
  if (!window.nickCloud || typeof window.nickCloud.save !== 'function') {
    cloudRetryCount += 1;
    if (cloudRetryCount <= 12) setTimeout(flushReviewCloud, 900);
    else {
      updateCloudStatusSafe('Saved locally · cloud sync pending');
      try { const fallback = typeof store === 'function' ? store() : window.store?.(); if (fallback?.catch) fallback.catch(() => {}); } catch (_) {}
    }
    return;
  }
  cloudSyncRunning = true;
  const snapshot = pendingCloudSnapshot;
  pendingCloudSnapshot = null;
  cloudRetryCount = 0;
  try {
    await window.nickCloud.save(snapshot);
    try { lastCloudJson = JSON.stringify(snapshot); } catch (_) {}
    updateCloudStatusSafe('Saved to Firebase');
  } catch (error) {
    console.error('Background review sync failed', error);
    pendingCloudSnapshot = snapshot;
    updateCloudStatusSafe('Saved locally · cloud retry pending');
    setTimeout(flushReviewCloud, 1600);
  } finally {
    cloudSyncRunning = false;
    if (pendingCloudSnapshot) setTimeout(flushReviewCloud, 0);
  }
}

function queueReviewCloud(data) {
  pendingCloudSnapshot = clone(data);
  updateCloudStatusSafe('Saved locally · syncing…');
  setTimeout(flushReviewCloud, 0);
}

function closeReviewImmediately() {
  document.getElementById('postSessionReviewOverlay')?.classList.remove('open');
  document.body.style.overflow = '';
  reviewSessionRef = null;
}

function saveReviewInstantly(openDashboard) {
  const data = appDb(), session = resolveReviewSession();
  if (!data || !session) return false;
  const previous = session.review?.practices || [];
  const practices = [...document.querySelectorAll('#postSessionReviewOverlay .reviewPractice')].map((row, index) => {
    const reasoning = String(row.querySelector('.practiceReasoning,.practiceNote')?.value || '').trim();
    return { ...(previous[index] || {}), practiceId:row.dataset.practiceId, effectiveness:row.querySelector('.practiceEffect')?.value || '', engagement:row.querySelector('.practiceEngagement')?.value || '', decision:row.querySelector('.practiceDecision')?.value || '', reasoning, note:reasoning };
  });
  const review = {
    ...(session.review || {}), scale:10, objectiveOutcome:selectedChoice('objectiveOutcome'), rating:document.getElementById('reviewRating')?.value || '',
    worked:String(document.getElementById('reviewWorked')?.value || '').trim(), didntWork:String(document.getElementById('reviewDidnt')?.value || '').trim(), repeat:String(document.getElementById('reviewRepeat')?.value || '').trim(), changeNext:String(document.getElementById('reviewChange')?.value || '').trim(), practices, reviewedAt:new Date().toISOString()
  };
  session.review = review;
  session.rating = review.rating;
  session.reflect = summariseReview(review);
  const index = data.sessions.findIndex(item => item === session || (item.id && session.id && item.id === session.id));
  if (index >= 0) data.sessions[index] = session;
  const saved = saveLocalSnapshot(data);
  if (saved) { queueReviewCloud(data); showReviewToast('Review saved · syncing in background'); }
  else showReviewToast('Could not save review locally');
  closeReviewImmediately();
  document.dispatchEvent(new CustomEvent('coaching:review-saved', { detail:{ sessionId:session.id || '', rating:review.rating } }));
  try { window.renderSessionLibrary?.(); } catch (_) {}
  try { if (typeof renderRecentSessions === 'function') renderRecentSessions(); } catch (_) {}
  try { if (typeof renderArchive === 'function') renderArchive(); } catch (_) {}
  try { if (typeof renderVisualPicker === 'function') renderVisualPicker(); } catch (_) {}
  if (openDashboard) {
    document.querySelector('.tab[data-tab="dashboard"]')?.click();
    requestAnimationFrame(() => { try { if (typeof renderDashboard === 'function') renderDashboard(); else window.renderDashboard?.(); } catch (_) {} try { window.renderCoachingDashboardActions?.(); } catch (_) {} });
  }
  return true;
}

function installFastReviewSave() {
  if (window.__instantReviewSaveInstalled) return;
  window.__instantReviewSaveInstalled = true;
  window.addEventListener('click', event => {
    const button = event.target.closest?.('#reviewSaveClose,#reviewSaveDashboard');
    if (!button || !document.getElementById('postSessionReviewOverlay')?.classList.contains('open')) return;
    event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation();
    saveReviewInstantly(button.id === 'reviewSaveDashboard');
  }, true);
  window.addEventListener('online', () => { if (pendingCloudSnapshot) flushReviewCloud(); }, { passive:true });
}

function wrapReviewOpen() {
  const original = window.openPostSessionReview;
  if (typeof original !== 'function' || original.__sessionIntelligence) return;
  const wrapped = function(session, index) { reviewSessionRef = session || null; const result = original.apply(this, arguments); requestAnimationFrame(enhanceReasoningFields); setTimeout(enhanceReasoningFields, 60); return result; };
  wrapped.__sessionIntelligence = true;
  window.openPostSessionReview = wrapped;
}

function observeReview() {
  const overlay = document.getElementById('postSessionReviewOverlay');
  if (!overlay || reviewObserver) return;
  reviewObserver = new MutationObserver(() => { if (overlay.classList.contains('open')) requestAnimationFrame(enhanceReasoningFields); });
  reviewObserver.observe(overlay, { attributes:true, attributeFilter:['class'], childList:true, subtree:true });
}

function sessionMemoryMarkup(session) {
  const score = scoreOutOfTen(session);
  const overall = String(session?.review?.changeNext || session?.review?.repeat || '').trim();
  const firstPracticeReason = (session?.review?.practices || []).map(item => String(item.reasoning || item.note || '').trim()).find(Boolean) || '';
  const reason = overall || firstPracticeReason;
  if (!score && !reason) return '';
  return `<div class="sessionReviewMemory" style="--quality-hue:${trafficHue(score || 5)}"><b>Review memory · ${score ? `${score}/10` : 'Reviewed'}</b>${reason ? `<span class="reviewMemoryReason">${esc(reason)}</span>` : ''}</div>`;
}

function decorateSessionLibrary() {
  const data = appDb(), root = document.getElementById('sessionLibraryResults');
  if (!data || !root) return;
  [...root.querySelectorAll('.sessionLibraryCard')].forEach(card => {
    const index = Number(card.querySelector('[data-index]')?.dataset.index);
    const session = Number.isInteger(index) ? data.sessions?.[index] : null;
    if (!session) return;
    const score = scoreOutOfTen(session), reason = session.review?.changeNext || session.review?.repeat || session.review?.practices?.find(item => item.reasoning || item.note)?.reasoning || session.review?.practices?.find(item => item.note)?.note || '';
    const signature = JSON.stringify([session.id, session.subtitle, score, reason, session.review?.reviewedAt]);
    if (!setSignature(card, signature)) return;
    applyQuality(card, score);
    const heading = card.querySelector('h3');
    let subtitle = card.querySelector('.sessionSubtitleText');
    if (session.subtitle) { if (!subtitle) { subtitle = document.createElement('div'); subtitle.className = 'sessionSubtitleText'; heading?.insertAdjacentElement('afterend', subtitle); } subtitle.textContent = session.subtitle; }
    else subtitle?.remove();
    const meta = card.querySelector('.sessionLibraryMeta');
    if (meta) {
      [...meta.querySelectorAll('.pill')].forEach(pill => { if (/^[★☆]+$/.test((pill.textContent || '').trim())) pill.remove(); });
      meta.querySelector('.qualityScoreBadge')?.remove();
      if (score) meta.insertAdjacentHTML('beforeend', scoreBadge(score));
    }
    card.querySelector('.sessionReviewMemory')?.remove();
    card.querySelector('.sessionLibraryObjective')?.insertAdjacentHTML('afterend', sessionMemoryMarkup(session));
  });
}

function decorateRecentSessions() {
  const data = appDb(), box = document.getElementById('recentSessionList');
  if (!data || !box) return;
  const sessions = [...(data.sessions || [])].sort((a,b) => String(b.date || '').localeCompare(String(a.date || ''))).slice(0,12);
  [...box.querySelectorAll('.recentSessionCard')].forEach((card, index) => {
    const session = sessions[index]; if (!session) return;
    const score = scoreOutOfTen(session), reason = session.review?.changeNext || session.review?.repeat || session.review?.practices?.find(item => item.reasoning || item.note)?.reasoning || session.review?.practices?.find(item => item.note)?.note || '';
    const signature = JSON.stringify([session.id, session.subtitle, score, reason, session.review?.reviewedAt]);
    if (!setSignature(card, signature)) return;
    applyQuality(card, score);
    const heading = card.querySelector('h3');
    let subtitle = card.querySelector('.sessionSubtitleText');
    if (session.subtitle) { if (!subtitle) { subtitle = document.createElement('div'); subtitle.className = 'sessionSubtitleText'; heading?.insertAdjacentElement('afterend', subtitle); } subtitle.textContent = session.subtitle; }
    else subtitle?.remove();
    const stars = card.querySelector('.ratingStars');
    if (stars) stars.innerHTML = score ? scoreBadge(score) : '<span class="small">Not reviewed</span>';
    card.querySelector('.sessionReviewMemory')?.remove();
    card.querySelector('.sessionActions')?.insertAdjacentHTML('beforebegin', sessionMemoryMarkup(session));
  });
}

function decoratePracticePicker() {
  const data = appDb(), picker = document.getElementById('visualPicker');
  if (!data || !picker) return;
  [...picker.querySelectorAll('.pitchCard')].forEach(card => {
    const heading = card.querySelector('h3'), id = String(heading?.textContent || '').split(' · ')[0].trim();
    if (!id) return;
    const latest = latestPracticeReview(data.sessions || [], id);
    const signature = JSON.stringify([id, latest?.session?.id, latest?.score, latest?.reasoning, latest?.review?.decision]);
    if (!setSignature(card, signature)) return;
    card.querySelector('.practiceReviewMemory')?.remove();
    if (!latest || (!latest.score && !latest.reasoning)) return;
    const block = document.createElement('div');
    block.className = 'practiceReviewMemory';
    block.style.setProperty('--quality-hue', String(trafficHue(latest.score || 5)));
    block.innerHTML = `<b>Last review${latest.score ? ` · ${latest.score}/10` : ''}${latest.review?.decision ? ` · ${esc(latest.review.decision)}` : ''}</b>${latest.reasoning ? `<span class="reviewMemoryReason">${esc(latest.reasoning)}</span>` : ''}`;
    heading?.parentElement?.appendChild(block);
  });
}

function effectivePractice(session, index) {
  try { if (typeof dsEffectiveSessionPractice === 'function') return dsEffectiveSessionPractice(session, index); } catch (_) {}
  const data = appDb(), ids = Array.isArray(session?.drills) ? session.drills : [];
  return (data?.practices || []).find(practice => practice.id === ids[index]) || null;
}

function previewData(practice) {
  try { if (window.CoachingOSDiagramPreview?.previewDataForPractice) return window.CoachingOSDiagramPreview.previewDataForPractice(practice); } catch (_) {}
  const first = practice?.diagramSteps?.[0];
  return first?.diagram ? { diagram:first.diagram, pitchMode:first.pitchMode || practice.pitchMode || 'full' } : { diagram:practice?.diagram || [], pitchMode:practice?.pitchMode || 'full' };
}

function redrawHost(host, practice) {
  if (!host?.id || !practice) return;
  const source = previewData(practice);
  requestAnimationFrame(() => { try { if (typeof drawMini === 'function') drawMini(host.id, source.diagram, source.pitchMode); else window.drawMini?.(host.id, source.diagram, source.pitchMode); } catch (_) {} });
}

function archiveReasoningMarkup(session) {
  const ids = Array.isArray(session?.drills) ? session.drills : [];
  const rows = (session?.review?.practices || []).map((review, index) => {
    const reasoning = String(review.reasoning || review.note || '').trim();
    if (!reasoning) return '';
    const practice = effectivePractice(session, index), score = practiceScoreOutOfTen(review, session);
    return `<div class="archiveReviewMemory" style="--quality-hue:${trafficHue(score || 5)}"><b>${esc(practice?.name || ids[index] || `Practice ${index + 1}`)}${score ? ` · ${score}/10` : ''}${review.decision ? ` · ${esc(review.decision)}` : ''}</b><span class="reviewMemoryReason">${esc(reasoning)}</span></div>`;
  }).filter(Boolean).join('');
  return rows ? `<div class="archivePracticeReasoning"><h3 style="margin-bottom:7px">Practice review reasoning</h3>${rows}</div>` : '';
}

function fastUpdateSessionRating(session, value) {
  const data = appDb(); if (!data || !session) return;
  const score = Number(value) || 0;
  session.rating = score ? String(score) : '';
  session.review = { ...(session.review || {}), rating:score ? String(score) : '', scale:10, reviewedAt:session.review?.reviewedAt || new Date().toISOString() };
  saveLocalSnapshot(data); queueReviewCloud(data);
  try { if (typeof renderArchive === 'function') renderArchive(); } catch (_) {}
  try { window.renderSessionLibrary?.(); } catch (_) {}
}

function decorateArchiveCard(card, session) {
  if (!card || !session) return card;
  const score = scoreOutOfTen(session);
  applyQuality(card, score);
  const heading = card.querySelector('.archiveSessionTheme');
  if (session.subtitle && heading) { const subtitle = document.createElement('div'); subtitle.className = 'sessionSubtitleText'; subtitle.textContent = session.subtitle; heading.insertAdjacentElement('afterend', subtitle); }
  const meta = card.querySelector('.archiveTopMeta');
  if (meta) { [...meta.querySelectorAll('.pill')].forEach(pill => { if (/[★☆]/.test(pill.textContent || '')) pill.remove(); }); if (score) meta.insertAdjacentHTML('beforeend', scoreBadge(score)); }
  card.querySelectorAll('.ratingStars').forEach(node => { node.innerHTML = score ? scoreBadge(score) : '<span class="small">Not reviewed</span>'; });
  [...card.querySelectorAll('.favGrid > div')].forEach((wrapper, index) => redrawHost(wrapper.querySelector('div[id]'), effectivePractice(session, index)));
  [...card.querySelectorAll('.practiceDetail')].forEach((detail, index) => redrawHost(detail.firstElementChild, effectivePractice(session, index)));
  const actions = card.querySelector('.sessionActions'), reasoning = archiveReasoningMarkup(session);
  if (actions && reasoning) actions.insertAdjacentHTML('beforebegin', reasoning);
  const ratingSelect = actions?.querySelector('select');
  if (ratingSelect) {
    ratingSelect.innerHTML = '<option value="">Rate /10...</option>' + Array.from({length:10}, (_, i) => i + 1).map(value => `<option value="${value}">${value}/10</option>`).join('');
    ratingSelect.value = score ? String(score) : '';
    ratingSelect.dataset.tenScale = 'true';
    ratingSelect.onchange = () => fastUpdateSessionRating(session, ratingSelect.value);
  }
  return card;
}

function wrapBuildSessionCard() {
  let original;
  try { original = buildSessionCard; } catch (_) { original = window.buildSessionCard; }
  if (typeof original !== 'function' || original.__sessionIntelligence) return;
  const wrapped = function(session, index) { return decorateArchiveCard(original.apply(this, arguments), session); };
  wrapped.__sessionIntelligence = true;
  try { buildSessionCard = wrapped; } catch (_) {}
  window.buildSessionCard = wrapped;
}

function decorateCalendar() {
  const data = appDb(), calendar = document.getElementById('archiveCalendar');
  if (!data || !calendar) return;
  let month; try { month = archiveMonth; } catch (_) { month = new Date(); }
  const year = month.getFullYear(), monthIndex = month.getMonth();
  [...calendar.querySelectorAll('.calDay')].forEach(cell => {
    const day = Number(cell.querySelector('.calDate')?.textContent || 0); if (!day) return;
    const date = `${year}-${String(monthIndex + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const sessions = (data.sessions || []).filter(session => { if (session.date !== date) return false; try { return typeof matchesArchiveFilters === 'function' ? matchesArchiveFilters(session) : true; } catch (_) { return true; } }).slice(0,3);
    [...cell.querySelectorAll('.calSessionDot')].forEach((dot, index) => {
      const session = sessions[index]; if (!session) return;
      const score = scoreOutOfTen(session), signature = JSON.stringify([session.id, session.theme, session.subtitle, score]);
      if (!setSignature(dot, signature)) return;
      dot.classList.toggle('sessionQualityDot', score > 0);
      if (score) dot.style.setProperty('--quality-hue', String(trafficHue(score)));
      dot.innerHTML = `<span class="calSessionTitle">${esc(session.theme || 'Session')}</span>${session.subtitle ? `<span class="calSessionSubtitle">${esc(session.subtitle)}</span>` : ''}<span class="calSessionScore">${score ? `${score}/10` : 'Not reviewed'}</span>`;
    });
  });
}

function wrapRenderers() {
  let archiveOriginal;
  try { archiveOriginal = renderArchive; } catch (_) { archiveOriginal = window.renderArchive; }
  if (typeof archiveOriginal === 'function' && !archiveOriginal.__sessionIntelligence) {
    const wrapped = function(...args) { const result = archiveOriginal.apply(this, args); requestAnimationFrame(decorateCalendar); return result; };
    wrapped.__sessionIntelligence = true; try { renderArchive = wrapped; } catch (_) {} window.renderArchive = wrapped;
  }
  let recentOriginal;
  try { recentOriginal = renderRecentSessions; } catch (_) { recentOriginal = window.renderRecentSessions; }
  if (typeof recentOriginal === 'function' && !recentOriginal.__sessionIntelligence) {
    const wrapped = function(...args) { const result = recentOriginal.apply(this, args); requestAnimationFrame(decorateRecentSessions); return result; };
    wrapped.__sessionIntelligence = true; try { renderRecentSessions = wrapped; } catch (_) {} window.renderRecentSessions = wrapped;
  }
  let pickerOriginal;
  try { pickerOriginal = renderVisualPicker; } catch (_) { pickerOriginal = window.renderVisualPicker; }
  if (typeof pickerOriginal === 'function' && !pickerOriginal.__sessionIntelligence) {
    const wrapped = function(...args) { const result = pickerOriginal.apply(this, args); requestAnimationFrame(decoratePracticePicker); return result; };
    wrapped.__sessionIntelligence = true; try { renderVisualPicker = wrapped; } catch (_) {} window.renderVisualPicker = wrapped;
  }
}

function observeRoot(id, decorator) {
  const root = document.getElementById(id);
  if (!root || root.dataset.sessionIntelligenceObserved === 'true') return;
  root.dataset.sessionIntelligenceObserved = 'true';
  new MutationObserver(() => requestAnimationFrame(decorator)).observe(root, { childList:true, subtree:true });
}

function observeDecoratedAreas() {
  observeRoot('sessionLibraryResults', decorateSessionLibrary);
  observeRoot('recentSessionList', decorateRecentSessions);
  observeRoot('visualPicker', decoratePracticePicker);
  observeRoot('archiveCalendar', decorateCalendar);
}

function refreshDecorations() {
  ensureSubtitleField(); enhanceReasoningFields(); decorateSessionLibrary(); decorateRecentSessions(); decoratePracticePicker(); decorateCalendar(); decoratePreviewSubtitle();
}

function wrapReviewOpen() {
  const original = window.openPostSessionReview;
  if (typeof original !== 'function' || original.__sessionIntelligence) return;
  const wrapped = function(session, index) { reviewSessionRef = session || null; const result = original.apply(this, arguments); requestAnimationFrame(enhanceReasoningFields); setTimeout(enhanceReasoningFields, 60); return result; };
  wrapped.__sessionIntelligence = true;
  window.openPostSessionReview = wrapped;
}

function observeReview() {
  const overlay = document.getElementById('postSessionReviewOverlay');
  if (!overlay || reviewObserver) return;
  reviewObserver = new MutationObserver(() => { if (overlay.classList.contains('open')) requestAnimationFrame(enhanceReasoningFields); });
  reviewObserver.observe(overlay, { attributes:true, attributeFilter:['class'], childList:true, subtree:true });
}

function install() {
  addStyles(); ensureSubtitleField(); wrapPlannerData(); wrapPreviewAndDock(); wrapReviewOpen(); observeReview(); installFastReviewSave(); wrapBuildSessionCard(); wrapRenderers(); observeDecoratedAreas(); refreshDecorations();
  setTimeout(() => { ensureSubtitleField(); wrapPlannerData(); wrapPreviewAndDock(); wrapReviewOpen(); observeReview(); wrapBuildSessionCard(); wrapRenderers(); observeDecoratedAreas(); refreshDecorations(); }, 250);
  setTimeout(() => { ensureSubtitleField(); wrapPlannerData(); wrapReviewOpen(); observeDecoratedAreas(); refreshDecorations(); }, 900);
  document.addEventListener('coaching:review-saved', () => requestAnimationFrame(refreshDecorations));
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
  else install();
}
