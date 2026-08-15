const STYLE_ID = 'reviewDiagramTenScaleStyles';
let reviewObserver = null;
let dashboardObserver = null;
let currentReviewSession = null;
let originalOpenReview = null;

function appDb() {
  try { return typeof db !== 'undefined' ? db : window.db; }
  catch (_) { return window.db; }
}

function addStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    #postSessionReviewOverlay .reviewShell{max-width:1320px!important}
    #postSessionReviewOverlay .reviewGrid{grid-template-columns:minmax(330px,.82fr) minmax(0,1.45fr)!important;gap:14px!important}
    #postSessionReviewOverlay .reviewPractice{border:1px solid var(--border);background:var(--surface-2);border-radius:14px;padding:11px;margin-top:10px}
    #postSessionReviewOverlay .reviewPractice>h3{margin:0 0 9px!important;font-size:14px!important}
    #postSessionReviewOverlay .reviewPracticeBody{display:grid;grid-template-columns:230px minmax(0,1fr);gap:12px;align-items:center}
    #postSessionReviewOverlay .reviewPracticeDiagram{min-width:0;border:1px solid var(--border);border-radius:10px;overflow:hidden;background:#0d3f2d}
    #postSessionReviewOverlay .reviewPracticeDiagram .pitchMini{width:100%!important;max-width:none!important;height:132px!important;margin:0!important;border:0!important;border-radius:0!important}
    #postSessionReviewOverlay .reviewDiagramCaption{padding:5px 7px;font-size:9.5px;font-weight:800;color:var(--text-dim);background:var(--surface-3);border-top:1px solid var(--border)}
    #postSessionReviewOverlay .reviewPracticeGrid{grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:8px!important}
    #postSessionReviewOverlay .reviewPracticeGrid>div.reviewNoteHidden{display:none!important}
    #postSessionReviewOverlay .reviewScaleHint{margin:5px 0 2px;padding:7px 9px;border-radius:9px;background:rgba(56,189,248,.08);border:1px solid rgba(56,189,248,.22);font-size:10.5px;color:var(--text-dim);line-height:1.4}
    #postSessionReviewOverlay #reviewRating,#postSessionReviewOverlay .practiceEffect{font-weight:800}
    @media(max-width:980px){
      #postSessionReviewOverlay .reviewGrid{grid-template-columns:1fr!important}
      #postSessionReviewOverlay .reviewPracticeBody{grid-template-columns:210px minmax(0,1fr)}
    }
    @media(max-width:650px){
      #postSessionReviewOverlay .reviewPracticeBody{grid-template-columns:1fr}
      #postSessionReviewOverlay .reviewPracticeDiagram .pitchMini{height:170px!important}
      #postSessionReviewOverlay .reviewPracticeGrid{grid-template-columns:1fr!important}
    }
  `;
  document.head.appendChild(style);
}

function scoreLabel(score, practice = false) {
  const overall = ['','Very poor','Poor','Well below standard','Below standard','Mixed','Good','Very good','Great','Excellent','Flawless'];
  const effectiveness = ['','Ineffective','Very limited','Limited','Below target','Mixed','Useful','Good','Very good','Excellent','Outstanding'];
  return (practice ? effectiveness : overall)[score] || '';
}

function scoreOptions(current, practice = false) {
  const value = Number(current) || 0;
  return '<option value="">Choose...</option>' + Array.from({ length:10 }, (_, i) => i + 1).map(score => `<option value="${score}" ${value === score ? 'selected' : ''}>${score}/10 · ${scoreLabel(score, practice)}</option>`).join('');
}

function resolveSession() {
  if (currentReviewSession) return currentReviewSession;
  try {
    const side = typeof sidelineState !== 'undefined' ? sidelineState : window.sidelineState;
    if (side?.session) return side.session;
  } catch (_) {}
  const data = appDb();
  if (!data?.sessions?.length) return null;
  const meta = document.getElementById('reviewMeta')?.textContent || '';
  const title = document.getElementById('reviewTitle')?.textContent || '';
  const date = meta.split('·')[0]?.trim();
  return data.sessions.find(session => {
    if (date && String(session.date || '') !== date) return false;
    if (session.team && !title.includes(session.team)) return false;
    if (session.theme && !title.includes(session.theme)) return false;
    return true;
  }) || null;
}

function legacyScoreToTen(value, session) {
  const number = Number(value) || 0;
  if (!number) return 0;
  if (session?.review?.scale === 10) return Math.min(10, number);
  return number <= 5 ? number * 2 : Math.min(10, number);
}

function effectivePractice(session, index, id) {
  try {
    if (session && typeof dsEffectiveSessionPractice === 'function') {
      const practice = dsEffectiveSessionPractice(session, index);
      if (practice) return practice;
    }
  } catch (_) {}
  const data = appDb();
  const base = (data?.practices || []).find(practice => practice.id === id) || null;
  if (!base) return null;
  const override = session?.diagramOverrides?.[index];
  return override ? { ...base, ...override } : base;
}

function drawReviewDiagram(targetId, practice) {
  if (!practice) return;
  const first = (practice.diagramSteps && practice.diagramSteps[0]) || { diagram:practice.diagram || [], pitchMode:practice.pitchMode || 'full' };
  setTimeout(() => {
    try {
      if (typeof drawMini === 'function') drawMini(targetId, first.diagram || [], first.pitchMode || practice.pitchMode || 'full');
      else if (typeof window.drawMini === 'function') window.drawMini(targetId, first.diagram || [], first.pitchMode || practice.pitchMode || 'full');
    } catch (_) {}
  }, 0);
}

function enhanceReview() {
  const overlay = document.getElementById('postSessionReviewOverlay');
  if (!overlay?.classList.contains('open')) return;
  const session = resolveSession();
  const rating = document.getElementById('reviewRating');
  if (rating && rating.dataset.tenScale !== 'true') {
    const current = legacyScoreToTen(rating.value, session);
    rating.innerHTML = scoreOptions(current, false);
    rating.value = current ? String(current) : '';
    rating.dataset.tenScale = 'true';
    if (!rating.parentElement.querySelector('.reviewScaleHint')) {
      const hint = document.createElement('div');
      hint.className = 'reviewScaleHint';
      hint.textContent = '10-point session scale · 6 Good · 8 Great · 9 Excellent · 10 Flawless';
      rating.insertAdjacentElement('afterend', hint);
    }
  }

  const rows = [...overlay.querySelectorAll('.reviewPractice')];
  rows.forEach((row, rowIndex) => {
    const index = Number(row.dataset.index || rowIndex);
    const id = row.dataset.practiceId || '';
    const effect = row.querySelector('.practiceEffect');
    if (effect && effect.dataset.tenScale !== 'true') {
      const oldPractice = session?.review?.practices?.[index];
      const current = legacyScoreToTen(effect.value || oldPractice?.effectiveness, session);
      effect.innerHTML = scoreOptions(current, true);
      effect.value = current ? String(current) : '';
      effect.dataset.tenScale = 'true';
    }

    const note = row.querySelector('.practiceNote');
    if (note?.parentElement) note.parentElement.classList.add('reviewNoteHidden');

    let body = row.querySelector('.reviewPracticeBody');
    const grid = row.querySelector('.reviewPracticeGrid');
    if (!body && grid) {
      body = document.createElement('div');
      body.className = 'reviewPracticeBody';
      const visual = document.createElement('div');
      visual.className = 'reviewPracticeDiagram';
      const target = document.createElement('div');
      target.id = `review-practice-diagram-${index}`;
      const caption = document.createElement('div');
      caption.className = 'reviewDiagramCaption';
      caption.textContent = 'SESSION DIAGRAM';
      visual.append(target, caption);
      row.insertBefore(body, grid);
      body.append(visual, grid);
      drawReviewDiagram(target.id, effectivePractice(session, index, id));
    } else if (body) {
      const target = body.querySelector('[id^="review-practice-diagram-"]');
      if (target && !target.querySelector('.pitchMini')) drawReviewDiagram(target.id, effectivePractice(session, index, id));
    }
  });
}

function normalisedPracticeAverage(practiceId) {
  const data = appDb();
  const scores = [];
  (data?.sessions || []).forEach(session => {
    (session.review?.practices || []).forEach(review => {
      if (review.practiceId !== practiceId) return;
      const score = legacyScoreToTen(review.effectiveness, session);
      if (score) scores.push(score);
    });
  });
  return scores.length ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
}

function patchDashboardScores() {
  const panel = document.querySelector('.dashboardActionPanel');
  if (!panel) return;
  panel.querySelectorAll('.dashboardActionCard').forEach(card => {
    const progress = card.querySelector('[data-progress]');
    const paragraph = card.querySelector('p');
    if (!progress || !paragraph || !/average effectiveness/i.test(paragraph.textContent || '')) return;
    const average = normalisedPracticeAverage(progress.dataset.progress);
    if (!average) return;
    paragraph.innerHTML = paragraph.innerHTML.replace(/average effectiveness\s*<b>[^<]*<\/b>/i, `average effectiveness <b>${average.toFixed(1)}/10</b>`);
  });
}

function markTenScaleOnSave(event) {
  const button = event.target.closest?.('#reviewSaveClose,#reviewSaveDashboard');
  if (!button) return;
  const session = resolveSession();
  if (!session) return;
  queueMicrotask(() => {
    if (!session.review) return;
    session.review.scale = 10;
    try {
      const result = typeof store === 'function' ? store() : window.store?.();
      if (result?.catch) result.catch(() => {});
    } catch (_) {}
  });
}

function wrapOpenReview() {
  if (originalOpenReview || typeof window.openPostSessionReview !== 'function') return;
  originalOpenReview = window.openPostSessionReview;
  window.openPostSessionReview = function(session, index) {
    currentReviewSession = session || null;
    const result = originalOpenReview.apply(this, arguments);
    requestAnimationFrame(enhanceReview);
    setTimeout(enhanceReview, 50);
    return result;
  };
}

function observeReview() {
  const overlay = document.getElementById('postSessionReviewOverlay');
  if (!overlay || reviewObserver) return;
  overlay.addEventListener('click', markTenScaleOnSave, true);
  reviewObserver = new MutationObserver(() => {
    if (overlay.classList.contains('open')) requestAnimationFrame(enhanceReview);
    else currentReviewSession = null;
  });
  reviewObserver.observe(overlay, { attributes:true, attributeFilter:['class'], childList:true, subtree:true });
}

function observeDashboard() {
  const dashboard = document.getElementById('dashboard');
  if (!dashboard || dashboardObserver) return;
  dashboardObserver = new MutationObserver(() => requestAnimationFrame(patchDashboardScores));
  dashboardObserver.observe(dashboard, { childList:true, subtree:true });
  patchDashboardScores();
}

function install() {
  addStyles();
  wrapOpenReview();
  observeReview();
  observeDashboard();
  enhanceReview();
  patchDashboardScores();
  setTimeout(() => { wrapOpenReview(); observeReview(); observeDashboard(); enhanceReview(); patchDashboardScores(); }, 250);
  setTimeout(() => { wrapOpenReview(); observeReview(); observeDashboard(); enhanceReview(); patchDashboardScores(); }, 900);
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
  else install();
}
