const STYLE_ID = 'sessionIntelligenceV2Styles';
const SUBTITLE_WRAP_ID = 'sessionSubtitleField';
const TOAST_ID = 'instantReviewSaveToast';
let activeReviewSession = null;
let pendingCloudSnapshot = null;
let cloudSyncRunning = false;
let reviewObserver = null;

function appDb() {
  try { return typeof db !== 'undefined' ? db : window.db; }
  catch (_) { return window.db; }
}

function escapeText(value) {
  try { if (typeof escapeHtml === 'function') return escapeHtml(String(value ?? '')); } catch (_) {}
  return String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}

function clone(value) {
  try { return typeof structuredClone === 'function' ? structuredClone(value) : JSON.parse(JSON.stringify(value)); }
  catch (_) { return JSON.parse(JSON.stringify(value)); }
}

function clampScore(value) {
  const number = Number(value) || 0;
  return number ? Math.max(1, Math.min(10, number)) : 0;
}

export function scoreOutOfTen(session = {}) {
  const raw = Number(session?.review?.rating ?? session?.rating ?? 0);
  if (!raw) return 0;
  if (session?.review?.scale === 10 || raw > 5) return clampScore(raw);
  return clampScore(raw * 2);
}

function practiceScoreOutOfTen(review = {}, session = {}) {
  const raw = Number(review?.effectiveness || 0);
  if (!raw) return 0;
  if (session?.review?.scale === 10 || raw > 5) return clampScore(raw);
  return clampScore(raw * 2);
}

export function trafficHue(score) {
  const value = clampScore(score);
  if (!value) return 0;
  if (value <= 5) return Math.round(((value - 1) / 4) * 38);
  return Math.round(38 + ((value - 5) / 5) * 87);
}

export function latestPracticeReview(sessions = [], practiceId = '') {
  const ordered = [...sessions].sort((a,b) => String(b?.review?.reviewedAt || b?.date || '').localeCompare(String(a?.review?.reviewedAt || a?.date || '')));
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
    #${SUBTITLE_WRAP_ID}{margin-top:10px}
    #${SUBTITLE_WRAP_ID} label{margin-top:0}
    #${SUBTITLE_WRAP_ID} .sessionSubtitleHint{font-size:10.5px;color:var(--text-dim);line-height:1.35;margin-top:5px}
    .sessionSubtitleText{font-size:12px;font-weight:850;color:#bae6fd;margin:-2px 0 7px}
    .sessionPreviewSubtitle{font-size:13px;font-weight:850;color:#bae6fd;margin:2px 0 10px}

    .sessionLibraryCard.qualityRated,.recentSessionCard.qualityRated,.session.qualityRated{
      border-color:hsl(var(--quality-hue) 66% 39% / .78)!important;
      background:linear-gradient(135deg,hsl(var(--quality-hue) 52% 17% / .82),var(--surface-2) 62%)!important;
      box-shadow:inset 4px 0 0 hsl(var(--quality-hue) 72% 43%),0 10px 28px rgba(0,0,0,.17)!important;
    }
    .qualityScoreBadge{display:inline-flex;align-items:center;justify-content:center;padding:4px 8px;border-radius:999px;color:#fff;background:hsl(var(--quality-hue) 61% 31%);border:1px solid hsl(var(--quality-hue) 72% 48%);font-size:11px;font-weight:950;white-space:nowrap}
    .sessionReviewMemory,.practiceReviewMemory,.archiveReviewMemory{margin-top:9px;padding:8px 9px;border:1px solid hsl(var(--quality-hue,205) 48% 34% / .48);border-radius:10px;background:rgba(4,10,20,.34);font-size:11.5px;line-height:1.42;color:var(--text-dim)}
    .sessionReviewMemory b,.practiceReviewMemory b,.archiveReviewMemory b{color:var(--text)}
    .reviewMemoryReason{display:block;margin-top:3px;color:#dce7f5}

    #postSessionReviewOverlay .reviewPracticeGrid{display:grid!important;grid-template-columns:150px minmax(260px,1fr)!important;gap:8px 10px!important;align-items:start!important}
    #postSessionReviewOverlay .reviewEffectField{grid-column:1;grid-row:1}
    #postSessionReviewOverlay .reviewEngagementField{grid-column:1;grid-row:2}
    #postSessionReviewOverlay .reviewDecisionField{grid-column:1;grid-row:3}
    #postSessionReviewOverlay .reviewPracticeGrid>div.reviewReasoningField{display:block!important;grid-column:2;grid-row:1 / span 3;align-self:stretch}
    #postSessionReviewOverlay .reviewPracticeGrid>div.reviewReasoningField.reviewNoteHidden{display:block!important}
    #postSessionReviewOverlay .reviewReasoningField label{color:#bae6fd}
    #postSessionReviewOverlay .reviewReasoningField textarea{min-height:118px;resize:vertical;background:rgba(7,16,29,.82)}
    #postSessionReviewOverlay .reasoningHint{font-size:10px;color:var(--text-dim);line-height:1.35;margin-top:4px}

    .calSessionDot.sessionQualityDot{display:block!important;padding:4px 6px!important;border-radius:8px!important;white-space:normal!important;line-height:1.15!important;color:#fff!important;background:hsl(var(--quality-hue) 54% 22% / .9)!important;border-color:hsl(var(--quality-hue) 68% 42%)!important}
    .calSessionTitle{display:block;font-size:10px;font-weight:850;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .calSessionSubtitle{display:block;margin-top:1px;font-size:8.5px;color:rgba(255,255,255,.78);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .calSessionScore{display:block;margin-top:2px;font-size:10px;font-weight:950;color:#fff}

    #${TOAST_ID}{position:fixed;left:50%;bottom:calc(18px + env(safe-area-inset-bottom));transform:translateX(-50%);z-index:30000;padding:10px 14px;border-radius:999px;background:#0d1b2a;border:1px solid rgba(52,211,153,.42);box-shadow:0 14px 42px rgba(0,0,0,.4);font-size:12px;font-weight:850;color:#d1fae5;max-width:calc(100vw - 24px);white-space:nowrap}

    @media(max-width:760px){
      #postSessionReviewOverlay .reviewPracticeGrid{grid-template-columns:1fr!important}
      #postSessionReviewOverlay .reviewEffectField,#postSessionReviewOverlay .reviewEngagementField,#postSessionReviewOverlay .reviewDecisionField,#postSessionReviewOverlay .reviewReasoningField{grid-column:1!important;grid-row:auto!important}
      #postSessionReviewOverlay .reviewReasoningField textarea{min-height:96px}
      .sessionReviewMemory,.practiceReviewMemory,.archiveReviewMemory{font-size:11px}
      .calSessionDot.sessionQualityDot{padding:3px 4px!important}.calSessionTitle,.calSessionScore{font-size:9px}.calSessionSubtitle{font-size:8px}
    }
  `;
  document.head.appendChild(style);
}

function qualityBadge(score) {
  return score ? `<span class="qualityScoreBadge" style="--quality-hue:${trafficHue(score)}">${score}/10</span>` : '';
}

function applyQuality(element, score) {
  if (!element) return;
  element.classList.toggle('qualityRated', !!score);
  if (score) element.style.setProperty('--quality-hue', String(trafficHue(score)));
  else element.style.removeProperty('--quality-hue');
}

function sessionSubtitleInput() { return document.getElementById('sessionSubtitle'); }
function currentSubtitle() { return String(sessionSubtitleInput()?.value || '').trim(); }

function ensureSubtitleField() {
  const theme = document.getElementById('sTheme');
  if (!theme || document.getElementById(SUBTITLE_WRAP_ID)) return;
  const wrap = document.createElement('div');
  wrap.id = SUBTITLE_WRAP_ID;
  wrap.innerHTML = `<label for="sessionSubtitle">Session Subtitle / Format</label><input id="sessionSubtitle" list="sessionSubtitleSuggestions" placeholder="e.g. Patterns, SSGs, Phase of Play"><datalist id="sessionSubtitleSuggestions"><option value="Patterns"><option value="SSGs"><option value="Phase of Play"><option value="Unit Work"><option value="Rondo"><option value="Opposed Practice"><option value="Unopposed Pattern"><option value="Game Based"></datalist><div class="sessionSubtitleHint">Use the theme for the topic, then this for the specific format or emphasis.</div>`;
  theme.insertAdjacentElement('afterend', wrap);
  sessionSubtitleInput()?.addEventListener('input', () => {
    try { if (typeof renderPreview === 'function') renderPreview(); } catch (_) {}
    try { if (typeof renderCurrentSessionDock === 'function') renderCurrentSessionDock(); } catch (_) {}
  });
}

function decoratePlannerPreview() {
  const preview = document.getElementById('preview');
  if (!preview) return;
  preview.querySelector('.sessionPreviewSubtitle')?.remove();
  if (!currentSubtitle()) return;
  const heading = preview.querySelector('h2');
  if (!heading) return;
  const line = document.createElement('div');
  line.className = 'sessionPreviewSubtitle';
  line.textContent = currentSubtitle();
  heading.insertAdjacentElement('afterend', line);
}

function installPlannerSubtitle() {
  let plannerOriginal;
  try { plannerOriginal = currentPlannerSession; } catch (_) { plannerOriginal = window.currentPlannerSession; }
  if (typeof plannerOriginal === 'function' && !plannerOriginal.__subtitleV2) {
    const wrapped = function(...args) { return { ...(plannerOriginal.apply(this,args) || {}), subtitle:currentSubtitle() }; };
    wrapped.__subtitleV2 = true;
    try { currentPlannerSession = wrapped; } catch (_) {}
    window.currentPlannerSession = wrapped;
  }

  let loadOriginal;
  try { loadOriginal = loadSessionToPlanner; } catch (_) { loadOriginal = window.loadSessionToPlanner; }
  if (typeof loadOriginal === 'function' && !loadOriginal.__subtitleV2) {
    const wrapped = function(index, mode='edit') {
      const session = appDb()?.sessions?.[index];
      const result = loadOriginal.apply(this,arguments);
      ensureSubtitleField();
      if (sessionSubtitleInput()) sessionSubtitleInput().value = session?.subtitle || '';
      try { if (typeof renderPreview === 'function') renderPreview(); } catch (_) {}
      try { if (typeof renderCurrentSessionDock === 'function') renderCurrentSessionDock(); } catch (_) {}
      return result;
    };
    wrapped.__subtitleV2 = true;
    try { loadSessionToPlanner = wrapped; } catch (_) {}
    window.loadSessionToPlanner = wrapped;
  }

  let resetOriginal;
  try { resetOriginal = resetSessionPlanner; } catch (_) { resetOriginal = window.resetSessionPlanner; }
  if (typeof resetOriginal === 'function' && !resetOriginal.__subtitleV2) {
    const wrapped = function(...args) {
      const result = resetOriginal.apply(this,args);
      ensureSubtitleField();
      if (sessionSubtitleInput()) sessionSubtitleInput().value = '';
      return result;
    };
    wrapped.__subtitleV2 = true;
    try { resetSessionPlanner = wrapped; } catch (_) {}
    window.resetSessionPlanner = wrapped;
  }

  let previewOriginal;
  try { previewOriginal = renderPreview; } catch (_) { previewOriginal = window.renderPreview; }
  if (typeof previewOriginal === 'function' && !previewOriginal.__subtitleV2) {
    const wrapped = function(...args) { const result = previewOriginal.apply(this,args); decoratePlannerPreview(); return result; };
    wrapped.__subtitleV2 = true;
    try { renderPreview = wrapped; } catch (_) {}
    window.renderPreview = wrapped;
  }

  let dockOriginal;
  try { dockOriginal = renderCurrentSessionDock; } catch (_) { dockOriginal = window.renderCurrentSessionDock; }
  if (typeof dockOriginal === 'function' && !dockOriginal.__subtitleV2) {
    const wrapped = function(...args) {
      const result = dockOriginal.apply(this,args);
      const subtitle = currentSubtitle();
      const meta = document.getElementById('currentSessionDockMeta');
      const drawerMeta = document.getElementById('currentSessionDrawerMeta');
      if (subtitle && meta && !meta.textContent.includes(subtitle)) meta.textContent += ` · ${subtitle}`;
      if (subtitle && drawerMeta && !drawerMeta.textContent.includes(subtitle)) drawerMeta.textContent += ` · ${subtitle}`;
      return result;
    };
    wrapped.__subtitleV2 = true;
    try { renderCurrentSessionDock = wrapped; } catch (_) {}
    window.renderCurrentSessionDock = wrapped;
  }
}

function resolveReviewSession() {
  if (activeReviewSession) return activeReviewSession;
  try { const state = typeof sidelineState !== 'undefined' ? sidelineState : window.sidelineState; if (state?.session) return state.session; } catch (_) {}
  const data = appDb();
  const title = document.getElementById('reviewTitle')?.textContent || '';
  const date = (document.getElementById('reviewMeta')?.textContent || '').split('·')[0]?.trim();
  return (data?.sessions || []).find(session => (!date || String(session.date || '') === date) && (!session.team || title.includes(session.team)) && (!session.theme || title.includes(session.theme))) || null;
}

function enhanceReviewReasoning() {
  const overlay = document.getElementById('postSessionReviewOverlay');
  if (!overlay?.classList.contains('open')) return;
  const session = resolveReviewSession();
  [...overlay.querySelectorAll('.reviewPractice')].forEach((row,index) => {
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
    textarea.placeholder = 'Why this score? Was it a minor tweak, a major issue, or something worth repeating?';
    const old = session?.review?.practices?.[index];
    if (!textarea.value && (old?.reasoning || old?.note)) textarea.value = old.reasoning || old.note;
    if (!field.querySelector('.reasoningHint')) {
      const hint = document.createElement('div');
      hint.className = 'reasoningHint';
      hint.textContent = 'Saved with the practice and shown again when you consider reusing it.';
      field.appendChild(hint);
    }

    const diagramHost = row.querySelector('[id^="review-practice-diagram-"]');
    const practice = effectivePractice(session,index);
    if (diagramHost && practice) drawPractice(diagramHost,practice);
  });
}

function selectedChoice(name) { return document.querySelector(`[data-choice="${name}"] button.on`)?.dataset.value || ''; }
function summariseReview(review) { return [review.worked&&`Worked: ${review.worked}`,review.didntWork&&`Didn't: ${review.didntWork}`,review.repeat&&`Repeat: ${review.repeat}`,review.changeNext&&`Change next: ${review.changeNext}`].filter(Boolean).join('\n'); }

function showToast(message) {
  let toast = document.getElementById(TOAST_ID);
  if (!toast) { toast = document.createElement('div'); toast.id = TOAST_ID; document.body.appendChild(toast); }
  toast.textContent = message; toast.hidden = false; clearTimeout(toast._timer); toast._timer = setTimeout(() => { toast.hidden = true; },2200);
}

function saveLocal(data) {
  try { localStorage.setItem('nickCoachOSv3',JSON.stringify(data)); return true; }
  catch (error) { console.error('Review local save failed',error); return false; }
}

function cloudStatus(text) { try { if (typeof updateCloudStatus === 'function') updateCloudStatus(text,new Date().toLocaleString('en-GB')); } catch (_) {} }

async function flushCloud() {
  if (cloudSyncRunning || !pendingCloudSnapshot) return;
  if (!window.nickCloud || typeof window.nickCloud.save !== 'function') { setTimeout(flushCloud,900); return; }
  cloudSyncRunning = true;
  const snapshot = pendingCloudSnapshot;
  pendingCloudSnapshot = null;
  try {
    await window.nickCloud.save(snapshot);
    try { lastCloudJson = JSON.stringify(snapshot); } catch (_) {}
    cloudStatus('Saved to Firebase');
  } catch (error) {
    console.error('Background review sync failed',error);
    pendingCloudSnapshot = snapshot;
    cloudStatus('Saved locally · cloud retry pending');
    setTimeout(flushCloud,1600);
  } finally {
    cloudSyncRunning = false;
    if (pendingCloudSnapshot) setTimeout(flushCloud,0);
  }
}

function queueCloud(data) {
  pendingCloudSnapshot = clone(data);
  cloudStatus('Saved locally · syncing…');
  setTimeout(flushCloud,0);
}

function closeReviewNow() {
  document.getElementById('postSessionReviewOverlay')?.classList.remove('open');
  document.body.style.overflow = '';
  activeReviewSession = null;
}

function saveReviewInstant(openDashboard) {
  const data = appDb(), session = resolveReviewSession();
  if (!data || !session) return false;
  const previous = session.review?.practices || [];
  const practices = [...document.querySelectorAll('#postSessionReviewOverlay .reviewPractice')].map((row,index) => {
    const reasoning = String(row.querySelector('.practiceReasoning,.practiceNote')?.value || '').trim();
    return { ...(previous[index] || {}), practiceId:row.dataset.practiceId, effectiveness:row.querySelector('.practiceEffect')?.value || '', engagement:row.querySelector('.practiceEngagement')?.value || '', decision:row.querySelector('.practiceDecision')?.value || '', reasoning, note:reasoning };
  });
  const review = {
    ...(session.review || {}), scale:10, objectiveOutcome:selectedChoice('objectiveOutcome'), rating:document.getElementById('reviewRating')?.value || '',
    worked:String(document.getElementById('reviewWorked')?.value || '').trim(), didntWork:String(document.getElementById('reviewDidnt')?.value || '').trim(), repeat:String(document.getElementById('reviewRepeat')?.value || '').trim(), changeNext:String(document.getElementById('reviewChange')?.value || '').trim(), practices, reviewedAt:new Date().toISOString()
  };
  session.review = review; session.rating = review.rating; session.reflect = summariseReview(review);
  const index = (data.sessions || []).findIndex(item => item === session || (item.id && session.id && item.id === session.id));
  if (index >= 0) data.sessions[index] = session;
  if (saveLocal(data)) { queueCloud(data); showToast('Review saved · syncing in background'); } else showToast('Review could not be saved locally');
  closeReviewNow();
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

function installInstantReviewSave() {
  if (window.__sessionIntelligenceReviewSaveV2) return;
  window.__sessionIntelligenceReviewSaveV2 = true;
  window.addEventListener('click',event => {
    const button = event.target.closest?.('#reviewSaveClose,#reviewSaveDashboard');
    if (!button || !document.getElementById('postSessionReviewOverlay')?.classList.contains('open')) return;
    event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation();
    saveReviewInstant(button.id === 'reviewSaveDashboard');
  },true);
  window.addEventListener('online',() => { if (pendingCloudSnapshot) flushCloud(); },{passive:true});
}

function installReviewOpen() {
  const original = window.openPostSessionReview;
  if (typeof original !== 'function' || original.__sessionIntelligenceV2) return;
  const wrapped = function(session,index) {
    activeReviewSession = session || null;
    const result = original.apply(this,arguments);
    requestAnimationFrame(enhanceReviewReasoning);
    setTimeout(enhanceReviewReasoning,60);
    return result;
  };
  wrapped.__sessionIntelligenceV2 = true;
  window.openPostSessionReview = wrapped;
}

function effectivePractice(session,index) {
  try { if (typeof dsEffectiveSessionPractice === 'function') return dsEffectiveSessionPractice(session,index); } catch (_) {}
  const data = appDb(), ids = Array.isArray(session?.drills) ? session.drills : [];
  return (data?.practices || []).find(item => item.id === ids[index]) || null;
}

function plannerPractice(index) {
  try { if (typeof dsCurrentPlannerPractice === 'function') return dsCurrentPlannerPractice(index); } catch (_) {}
  try { const id = plannerDrills[index]; return typeof get === 'function' ? get(id) : null; } catch (_) { return null; }
}

function previewData(practice) {
  try { if (window.CoachingOSDiagramPreview?.previewDataForPractice) return window.CoachingOSDiagramPreview.previewDataForPractice(practice); } catch (_) {}
  const first = practice?.diagramSteps?.[0];
  return first?.diagram ? {diagram:first.diagram,pitchMode:first.pitchMode || practice.pitchMode || 'full'} : {diagram:practice?.diagram || [],pitchMode:practice?.pitchMode || 'full'};
}

function drawPractice(host,practice) {
  if (!host || !practice) return;
  if (!host.id) host.id = `coach-preview-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,6)}`;
  const data = previewData(practice);
  requestAnimationFrame(() => { try { if (typeof drawMini === 'function') drawMini(host.id,data.diagram,data.pitchMode); else window.drawMini?.(host.id,data.diagram,data.pitchMode); } catch (_) {} });
}

function rerenderKnownDiagrams() {
  [...document.querySelectorAll('#sessionDrillList .advancedBuilderDiagram')].forEach((wrapper,index) => drawPractice(wrapper.querySelector('div[id]'),plannerPractice(index)));
  [...document.querySelectorAll('#currentSessionDockDiagramStrip .stickyDiagramThumb')].forEach((button,index) => drawPractice(button.querySelector('div[id]'),plannerPractice(index)));

  const data = appDb();
  const recentSessions = [...(data?.sessions || [])].sort((a,b) => String(b.date || '').localeCompare(String(a.date || ''))).slice(0,12);
  [...document.querySelectorAll('#recentSessionList .recentSessionCard')].forEach((card,sessionIndex) => {
    const session = recentSessions[sessionIndex];
    [...card.querySelectorAll('.recentSessionPracticeDiagram')].forEach((host,index) => drawPractice(host,effectivePractice(session,index)));
  });

  [...document.querySelectorAll('#postSessionReviewOverlay .reviewPractice')].forEach((row,index) => drawPractice(row.querySelector('[id^="review-practice-diagram-"]'),effectivePractice(resolveReviewSession(),index)));

  const picker = document.getElementById('visualPicker');
  [...(picker?.querySelectorAll('.pitchCard') || [])].forEach(card => {
    const id = String(card.querySelector('h3')?.textContent || '').split(' · ')[0].trim();
    const practice = (data?.practices || []).find(item => item.id === id);
    drawPractice(card.querySelector('div[id^="vmini-"]'),practice);
  });
}

function sessionMemory(session) {
  const score = scoreOutOfTen(session);
  const reason = String(session?.review?.changeNext || session?.review?.repeat || (session?.review?.practices || []).find(item => item.reasoning || item.note)?.reasoning || (session?.review?.practices || []).find(item => item.note)?.note || '').trim();
  if (!score && !reason) return '';
  return `<div class="sessionReviewMemory" style="--quality-hue:${trafficHue(score || 5)}"><b>Review memory · ${score ? `${score}/10` : 'Reviewed'}</b>${reason ? `<span class="reviewMemoryReason">${escapeText(reason)}</span>` : ''}</div>`;
}

function decorateSessionLibrary() {
  const data = appDb(), root = document.getElementById('sessionLibraryResults');
  if (!data || !root) return;
  [...root.querySelectorAll('.sessionLibraryCard')].forEach(card => {
    const index = Number(card.querySelector('[data-index]')?.dataset.index), session = Number.isInteger(index) ? data.sessions[index] : null;
    if (!session) return;
    const score = scoreOutOfTen(session);
    applyQuality(card,score);
    card.querySelector('.sessionSubtitleText')?.remove();
    if (session.subtitle) card.querySelector('h3')?.insertAdjacentHTML('afterend',`<div class="sessionSubtitleText">${escapeText(session.subtitle)}</div>`);
    const meta = card.querySelector('.sessionLibraryMeta');
    if (meta) {
      [...meta.querySelectorAll('.pill')].forEach(pill => { if (/^[★☆]+$/.test((pill.textContent || '').trim())) pill.remove(); });
      meta.querySelector('.qualityScoreBadge')?.remove();
      if (score) meta.insertAdjacentHTML('beforeend',qualityBadge(score));
    }
    card.querySelector('.sessionReviewMemory')?.remove();
    card.querySelector('.sessionLibraryObjective')?.insertAdjacentHTML('afterend',sessionMemory(session));
  });
}

function decorateRecentSessions() {
  const data = appDb(), root = document.getElementById('recentSessionList');
  if (!data || !root) return;
  const sessions = [...(data.sessions || [])].sort((a,b) => String(b.date || '').localeCompare(String(a.date || ''))).slice(0,12);
  [...root.querySelectorAll('.recentSessionCard')].forEach((card,index) => {
    const session = sessions[index]; if (!session) return;
    const score = scoreOutOfTen(session);
    applyQuality(card,score);
    card.querySelector('.sessionSubtitleText')?.remove();
    if (session.subtitle) card.querySelector('h3')?.insertAdjacentHTML('afterend',`<div class="sessionSubtitleText">${escapeText(session.subtitle)}</div>`);
    const rating = card.querySelector('.ratingStars'); if (rating) rating.innerHTML = score ? qualityBadge(score) : '<span class="small">Not reviewed</span>';
    card.querySelector('.sessionReviewMemory')?.remove();
    card.querySelector('.sessionActions')?.insertAdjacentHTML('beforebegin',sessionMemory(session));
  });
}

function decoratePracticePicker() {
  const data = appDb(), root = document.getElementById('visualPicker');
  if (!data || !root) return;
  [...root.querySelectorAll('.pitchCard')].forEach(card => {
    const id = String(card.querySelector('h3')?.textContent || '').split(' · ')[0].trim();
    card.querySelector('.practiceReviewMemory')?.remove();
    const latest = latestPracticeReview(data.sessions || [],id);
    if (!latest || (!latest.score && !latest.reasoning)) return;
    const memory = document.createElement('div');
    memory.className = 'practiceReviewMemory';
    memory.style.setProperty('--quality-hue',String(trafficHue(latest.score || 5)));
    memory.innerHTML = `<b>Last review${latest.score ? ` · ${latest.score}/10` : ''}${latest.review.decision ? ` · ${escapeText(latest.review.decision)}` : ''}</b>${latest.reasoning ? `<span class="reviewMemoryReason">${escapeText(latest.reasoning)}</span>` : ''}`;
    card.querySelector('h3')?.parentElement?.appendChild(memory);
  });
}

function practiceReasoningMarkup(session) {
  const ids = Array.isArray(session?.drills) ? session.drills : [];
  const rows = (session?.review?.practices || []).map((review,index) => {
    const reasoning = String(review.reasoning || review.note || '').trim();
    if (!reasoning) return '';
    const practice = effectivePractice(session,index), score = practiceScoreOutOfTen(review,session);
    return `<div class="archiveReviewMemory" style="--quality-hue:${trafficHue(score || 5)}"><b>${escapeText(practice?.name || ids[index] || `Practice ${index+1}`)}${score ? ` · ${score}/10` : ''}${review.decision ? ` · ${escapeText(review.decision)}` : ''}</b><span class="reviewMemoryReason">${escapeText(reasoning)}</span></div>`;
  }).filter(Boolean).join('');
  return rows ? `<div class="archivePracticeReasoning"><h3>Practice review reasoning</h3>${rows}</div>` : '';
}

function fastArchiveRating(session,value) {
  const data = appDb(), score = Number(value) || 0;
  if (!data || !session) return;
  session.rating = score ? String(score) : '';
  session.review = {...(session.review || {}),rating:score ? String(score) : '',scale:10,reviewedAt:session.review?.reviewedAt || new Date().toISOString()};
  if (saveLocal(data)) queueCloud(data);
  try { if (typeof renderArchive === 'function') renderArchive(); } catch (_) {}
  try { window.renderSessionLibrary?.(); } catch (_) {}
}

function decorateArchiveCard(card,session) {
  if (!card || !session) return card;
  const score = scoreOutOfTen(session);
  applyQuality(card,score);
  if (session.subtitle) card.querySelector('.archiveSessionTheme')?.insertAdjacentHTML('afterend',`<div class="sessionSubtitleText">${escapeText(session.subtitle)}</div>`);
  const meta = card.querySelector('.archiveTopMeta');
  if (meta) {
    [...meta.querySelectorAll('.pill')].forEach(pill => { if (/[★☆]/.test(pill.textContent || '')) pill.remove(); });
    if (score) meta.insertAdjacentHTML('beforeend',qualityBadge(score));
  }
  card.querySelectorAll('.ratingStars').forEach(node => { node.innerHTML = score ? qualityBadge(score) : '<span class="small">Not reviewed</span>'; });
  [...card.querySelectorAll('.favGrid > div')].forEach((wrapper,index) => drawPractice(wrapper.querySelector('div[id]'),effectivePractice(session,index)));
  [...card.querySelectorAll('.practiceDetail')].forEach((detail,index) => drawPractice(detail.firstElementChild,effectivePractice(session,index)));
  const actions = card.querySelector('.sessionActions');
  if (actions) {
    actions.insertAdjacentHTML('beforebegin',practiceReasoningMarkup(session));
    const select = actions.querySelector('select');
    if (select) {
      select.innerHTML = '<option value="">Rate /10...</option>' + Array.from({length:10},(_,i)=>i+1).map(value => `<option value="${value}">${value}/10</option>`).join('');
      select.value = score ? String(score) : '';
      select.onchange = () => fastArchiveRating(session,select.value);
    }
  }
  return card;
}

function installArchiveCardWrapper() {
  let original;
  try { original = buildSessionCard; } catch (_) { original = window.buildSessionCard; }
  if (typeof original !== 'function' || original.__sessionIntelligenceV2) return;
  const wrapped = function(session,index) { return decorateArchiveCard(original.apply(this,arguments),session); };
  wrapped.__sessionIntelligenceV2 = true;
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
    const date = `${year}-${String(monthIndex+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const sessions = (data.sessions || []).filter(session => {
      if (session.date !== date) return false;
      try { return typeof matchesArchiveFilters === 'function' ? matchesArchiveFilters(session) : true; } catch (_) { return true; }
    }).slice(0,3);
    [...cell.querySelectorAll('.calSessionDot')].forEach((dot,index) => {
      const session = sessions[index]; if (!session) return;
      const score = scoreOutOfTen(session);
      dot.classList.toggle('sessionQualityDot',!!score);
      if (score) dot.style.setProperty('--quality-hue',String(trafficHue(score)));
      dot.innerHTML = `<span class="calSessionTitle">${escapeText(session.theme || 'Session')}</span>${session.subtitle ? `<span class="calSessionSubtitle">${escapeText(session.subtitle)}</span>` : ''}<span class="calSessionScore">${score ? `${score}/10` : 'Not reviewed'}</span>`;
    });
  });
}

function installRendererWrappers() {
  let archiveOriginal;
  try { archiveOriginal = renderArchive; } catch (_) { archiveOriginal = window.renderArchive; }
  if (typeof archiveOriginal === 'function' && !archiveOriginal.__sessionIntelligenceV2) {
    const wrapped = function(...args) { const result = archiveOriginal.apply(this,args); requestAnimationFrame(() => { decorateCalendar(); rerenderKnownDiagrams(); }); return result; };
    wrapped.__sessionIntelligenceV2 = true; try { renderArchive = wrapped; } catch (_) {} window.renderArchive = wrapped;
  }
  let recentOriginal;
  try { recentOriginal = renderRecentSessions; } catch (_) { recentOriginal = window.renderRecentSessions; }
  if (typeof recentOriginal === 'function' && !recentOriginal.__sessionIntelligenceV2) {
    const wrapped = function(...args) { const result = recentOriginal.apply(this,args); requestAnimationFrame(() => { decorateRecentSessions(); rerenderKnownDiagrams(); }); return result; };
    wrapped.__sessionIntelligenceV2 = true; try { renderRecentSessions = wrapped; } catch (_) {} window.renderRecentSessions = wrapped;
  }
  let pickerOriginal;
  try { pickerOriginal = renderVisualPicker; } catch (_) { pickerOriginal = window.renderVisualPicker; }
  if (typeof pickerOriginal === 'function' && !pickerOriginal.__sessionIntelligenceV2) {
    const wrapped = function(...args) { const result = pickerOriginal.apply(this,args); requestAnimationFrame(() => { decoratePracticePicker(); rerenderKnownDiagrams(); }); return result; };
    wrapped.__sessionIntelligenceV2 = true; try { renderVisualPicker = wrapped; } catch (_) {} window.renderVisualPicker = wrapped;
  }
}

function observeRoot(id,callback) {
  const root = document.getElementById(id);
  if (!root || root.dataset.intelligenceV2Observed === 'true') return;
  root.dataset.intelligenceV2Observed = 'true';
  let queued = false;
  new MutationObserver(() => {
    if (queued) return; queued = true;
    requestAnimationFrame(() => { queued = false; callback(); });
  }).observe(root,{childList:true,subtree:true});
}

function observeViews() {
  observeRoot('sessionLibraryResults',decorateSessionLibrary);
  observeRoot('recentSessionList',() => { decorateRecentSessions(); rerenderKnownDiagrams(); });
  observeRoot('visualPicker',() => { decoratePracticePicker(); rerenderKnownDiagrams(); });
  observeRoot('archiveCalendar',decorateCalendar);
  observeRoot('sessionDrillList',rerenderKnownDiagrams);
  observeRoot('currentSessionDockDiagramStrip',rerenderKnownDiagrams);
}

function refreshAll() {
  ensureSubtitleField(); decoratePlannerPreview(); enhanceReviewReasoning(); decorateSessionLibrary(); decorateRecentSessions(); decoratePracticePicker(); decorateCalendar(); rerenderKnownDiagrams();
}

function install() {
  addStyles(); ensureSubtitleField(); installPlannerSubtitle(); installReviewOpen(); installInstantReviewSave(); installArchiveCardWrapper(); installRendererWrappers();
  const overlay = document.getElementById('postSessionReviewOverlay');
  if (overlay && !reviewObserver) { reviewObserver = new MutationObserver(() => { if (overlay.classList.contains('open')) requestAnimationFrame(enhanceReviewReasoning); }); reviewObserver.observe(overlay,{attributes:true,attributeFilter:['class'],childList:true,subtree:true}); }
  observeViews(); refreshAll();
  setTimeout(() => { ensureSubtitleField(); installPlannerSubtitle(); installReviewOpen(); installArchiveCardWrapper(); installRendererWrappers(); observeViews(); refreshAll(); },250);
  setTimeout(() => { ensureSubtitleField(); installPlannerSubtitle(); installReviewOpen(); observeViews(); refreshAll(); },900);
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
}
