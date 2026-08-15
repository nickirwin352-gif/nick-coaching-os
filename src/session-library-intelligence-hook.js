function appDb() {
  try { return typeof db !== 'undefined' ? db : window.db; }
  catch (_) { return window.db; }
}

function scoreOutOfTen(session = {}) {
  const raw = Number(session?.review?.rating ?? session?.rating ?? 0);
  if (!raw) return 0;
  if (session?.review?.scale === 10 || raw > 5) return Math.max(1, Math.min(10, raw));
  return Math.max(1, Math.min(10, raw * 2));
}

function trafficHue(score) {
  const value = Number(score) || 0;
  if (!value) return 0;
  if (value <= 5) return Math.round(((value - 1) / 4) * 38);
  return Math.round(38 + ((value - 5) / 5) * 87);
}

function escapeText(value) {
  try { if (typeof escapeHtml === 'function') return escapeHtml(String(value ?? '')); } catch (_) {}
  return String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}

function sessionReason(session) {
  const practice = (session?.review?.practices || []).find(item => item.reasoning || item.note);
  return String(session?.review?.changeNext || session?.review?.repeat || practice?.reasoning || practice?.note || '').trim();
}

function decorateSessionLibrary() {
  const data = appDb();
  const root = document.getElementById('sessionLibraryResults');
  if (!data || !root) return;
  [...root.querySelectorAll('.sessionLibraryCard')].forEach(card => {
    const index = Number(card.querySelector('[data-index]')?.dataset.index);
    const session = Number.isInteger(index) ? data.sessions?.[index] : null;
    if (!session) return;
    const score = scoreOutOfTen(session);
    const reason = sessionReason(session);
    const signature = JSON.stringify([session.id, session.subtitle || '', score, reason, session.review?.reviewedAt || '']);
    if (card.dataset.sessionLibraryIntelligence === signature) return;
    card.dataset.sessionLibraryIntelligence = signature;

    card.classList.toggle('qualityRated', !!score);
    if (score) card.style.setProperty('--quality-hue', String(trafficHue(score)));
    else card.style.removeProperty('--quality-hue');

    card.querySelector('.sessionSubtitleText')?.remove();
    if (session.subtitle) card.querySelector('h3')?.insertAdjacentHTML('afterend', `<div class="sessionSubtitleText">${escapeText(session.subtitle)}</div>`);

    const meta = card.querySelector('.sessionLibraryMeta');
    if (meta) {
      [...meta.querySelectorAll('.pill')].forEach(pill => { if (/^[★☆]+$/.test((pill.textContent || '').trim())) pill.remove(); });
      meta.querySelector('.qualityScoreBadge')?.remove();
      if (score) meta.insertAdjacentHTML('beforeend', `<span class="qualityScoreBadge" style="--quality-hue:${trafficHue(score)}">${score}/10</span>`);
    }

    card.querySelector('.sessionReviewMemory')?.remove();
    if (score || reason) {
      const memory = `<div class="sessionReviewMemory" style="--quality-hue:${trafficHue(score || 5)}"><b>Review memory · ${score ? `${score}/10` : 'Reviewed'}</b>${reason ? `<span class="reviewMemoryReason">${escapeText(reason)}</span>` : ''}</div>`;
      card.querySelector('.sessionLibraryObjective')?.insertAdjacentHTML('afterend', memory);
    }
  });
}

function wrapLibrary() {
  const original = window.renderSessionLibrary;
  if (typeof original !== 'function' || original.__sessionLibraryIntelligenceHook) return;
  const wrapped = function(...args) {
    const result = original.apply(this, args);
    requestAnimationFrame(decorateSessionLibrary);
    return result;
  };
  wrapped.__sessionLibraryIntelligenceHook = true;
  window.renderSessionLibrary = wrapped;
}

function install() {
  wrapLibrary();
  decorateSessionLibrary();
  setTimeout(() => { wrapLibrary(); decorateSessionLibrary(); }, 250);
  setTimeout(() => { wrapLibrary(); decorateSessionLibrary(); }, 900);
  document.addEventListener('coaching:review-saved', () => requestAnimationFrame(decorateSessionLibrary));
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
  else install();
}
