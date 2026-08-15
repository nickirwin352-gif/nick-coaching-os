const STYLE_ID = 'sessionCalendarNavigationRatingStyles';
const HIGHLIGHT_CLASS = 'calendarJumpTarget';
let archiveWrapped = false;
let sessionLibraryWrapped = false;

function appDb() {
  try { return typeof db !== 'undefined' ? db : window.db; }
  catch (_) { return window.db; }
}

export function sessionScoreOutOfTen(session = {}) {
  const raw = Number(session?.review?.rating ?? session?.rating ?? 0);
  if (!raw) return 0;
  if (session?.review?.scale === 10 || raw > 5) return Math.max(1, Math.min(10, raw));
  return Math.max(1, Math.min(10, raw * 2));
}

export function sessionTrafficHue(score) {
  const value = Math.max(1, Math.min(10, Number(score) || 1));
  if (value <= 5) return Math.round(((value - 1) / 4) * 38);
  return Math.round(38 + ((value - 5) / 5) * 87);
}

export function sessionJumpKey(session = {}, index = -1) {
  if (session?.id) return `id:${session.id}`;
  return `date:${session?.date || 'unknown'}:${index}`;
}

function addStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    #sessionsLibraryView .sessionLibraryCard.sessionTrafficRated{
      border-color:hsl(var(--session-quality-hue) 68% 41% / .88)!important;
      background:linear-gradient(135deg,hsl(var(--session-quality-hue) 50% 17% / .92),var(--surface-2) 68%)!important;
      box-shadow:inset 5px 0 0 hsl(var(--session-quality-hue) 72% 44%),0 10px 28px rgba(0,0,0,.18)!important;
    }
    #sessionsLibraryView .sessionNumberRating{
      display:inline-flex;align-items:center;justify-content:center;min-width:50px;padding:4px 9px;border-radius:999px;
      color:#fff;background:hsl(var(--session-quality-hue) 62% 30%);border:1px solid hsl(var(--session-quality-hue) 72% 48%);
      font-size:11.5px;font-weight:950;line-height:1;white-space:nowrap;
    }
    #sessionsLibraryView .sessionQualityLegend{display:flex;gap:7px;align-items:center;flex-wrap:wrap;margin:8px 0 13px;padding:9px 10px;border:1px solid var(--border);border-radius:11px;background:var(--surface-2)}
    #sessionsLibraryView .sessionQualityLegend>span:first-child{font-size:11px;font-weight:900;color:var(--text-dim);margin-right:2px;text-transform:uppercase;letter-spacing:.04em}
    #sessionsLibraryView .sessionQualityLegendItem{display:inline-flex;align-items:center;gap:5px;font-size:10.5px;color:var(--text-dim)}
    #sessionsLibraryView .sessionQualityLegendDot{width:9px;height:9px;border-radius:50%;background:hsl(var(--legend-hue) 70% 43%);box-shadow:0 0 0 2px hsl(var(--legend-hue) 60% 30% / .28)}

    #archiveCalendar .calDay.hasSessionJump{cursor:pointer}
    #archiveCalendar .calDay.hasSessionJump:hover{outline:1px solid rgba(56,189,248,.55);outline-offset:-1px}
    #archiveCalendar .calDate.calendarJumpDate{text-decoration:underline;text-decoration-color:rgba(56,189,248,.5);text-underline-offset:3px}
    #archiveCalendar .calSessionDot[data-session-jump-key]{cursor:pointer}
    .session.${HIGHLIGHT_CLASS},.${HIGHLIGHT_CLASS}{
      animation:calendarSessionJumpPulse 1.8s ease-out;
      outline:3px solid rgba(56,189,248,.9)!important;
      outline-offset:4px;
    }
    @keyframes calendarSessionJumpPulse{
      0%{box-shadow:0 0 0 0 rgba(56,189,248,.7),var(--shadow)}
      45%{box-shadow:0 0 0 12px rgba(56,189,248,0),var(--shadow)}
      100%{box-shadow:var(--shadow)}
    }
    @media(max-width:720px){
      #sessionsLibraryView .sessionQualityLegend{gap:6px;padding:8px}
      #sessionsLibraryView .sessionNumberRating{min-width:46px;padding:4px 7px}
    }
  `;
  document.head.appendChild(style);
}

function scoreBadge(score) {
  if (!score) return '<span class="small sessionNotReviewed">Not reviewed</span>';
  const hue = sessionTrafficHue(score);
  return `<span class="sessionNumberRating" style="--session-quality-hue:${hue}">${score}/10</span>`;
}

function sessionFromLibraryCard(card) {
  const data = appDb();
  if (!data || !card) return { session:null, index:-1 };
  const control = card.querySelector('[data-index]');
  const index = Number(control?.dataset.index);
  if (!Number.isInteger(index) || index < 0) return { session:null, index:-1 };
  return { session:data.sessions?.[index] || null, index };
}

function ensureSessionLegend() {
  const view = document.getElementById('sessionsLibraryView');
  if (!view || view.querySelector('.sessionQualityLegend')) return;
  const results = document.getElementById('sessionLibraryResults');
  if (!results) return;
  const legend = document.createElement('div');
  legend.className = 'sessionQualityLegend';
  legend.innerHTML = `<span>Session rating</span>
    <span class="sessionQualityLegendItem"><i class="sessionQualityLegendDot" style="--legend-hue:0"></i>1–3 Needs work</span>
    <span class="sessionQualityLegendItem"><i class="sessionQualityLegendDot" style="--legend-hue:38"></i>4–6 Mixed</span>
    <span class="sessionQualityLegendItem"><i class="sessionQualityLegendDot" style="--legend-hue:82"></i>7–8 Strong</span>
    <span class="sessionQualityLegendItem"><i class="sessionQualityLegendDot" style="--legend-hue:125"></i>9–10 Excellent</span>`;
  results.insertAdjacentElement('beforebegin', legend);
}

function decorateSessionLibrary() {
  ensureSessionLegend();
  document.querySelectorAll('#sessionLibraryResults .sessionLibraryCard').forEach(card => {
    const { session, index } = sessionFromLibraryCard(card);
    if (!session) return;
    const score = sessionScoreOutOfTen(session);
    const hue = sessionTrafficHue(score || 5);
    card.dataset.sessionIndex = String(index);
    card.dataset.sessionJumpKey = sessionJumpKey(session,index);
    card.classList.toggle('sessionTrafficRated', !!score);
    if (score) card.style.setProperty('--session-quality-hue',String(hue));
    else card.style.removeProperty('--session-quality-hue');

    const meta = card.querySelector('.sessionLibraryMeta');
    if (!meta) return;
    [...meta.querySelectorAll('.pill')].forEach(pill => {
      const text = (pill.textContent || '').trim();
      if (/^[★☆]+$/.test(text)) pill.remove();
    });
    meta.querySelectorAll('.sessionNumberRating,.qualityScoreBadge,.sessionNotReviewed').forEach(node => node.remove());
    meta.insertAdjacentHTML('beforeend',scoreBadge(score));
  });
}

function scheduleSessionLibraryDecoration() {
  requestAnimationFrame(() => requestAnimationFrame(decorateSessionLibrary));
}

function installSessionLibraryHooks() {
  const tab = document.getElementById('sessionsLibraryTab');
  if (tab && tab.dataset.ratingHook !== 'true') {
    tab.dataset.ratingHook = 'true';
    tab.addEventListener('click',scheduleSessionLibraryDecoration);
  }
  const view = document.getElementById('sessionsLibraryView');
  if (view && view.dataset.ratingHook !== 'true') {
    view.dataset.ratingHook = 'true';
    view.addEventListener('input',scheduleSessionLibraryDecoration);
    view.addEventListener('change',scheduleSessionLibraryDecoration);
    view.addEventListener('click',event => {
      if (event.target.closest('#sessionLibraryClearFilters')) scheduleSessionLibraryDecoration();
    });
  }

  if (!sessionLibraryWrapped && typeof window.renderSessionLibrary === 'function') {
    const original = window.renderSessionLibrary;
    if (!original.__calendarRatingWrapped) {
      const wrapped = function(...args) {
        const result = original.apply(this,args);
        scheduleSessionLibraryDecoration();
        return result;
      };
      wrapped.__calendarRatingWrapped = true;
      window.renderSessionLibrary = wrapped;
    }
    sessionLibraryWrapped = true;
  }
  scheduleSessionLibraryDecoration();
}

function findArchiveCard(key) {
  return [...document.querySelectorAll('[data-session-jump-key]')]
    .find(element => element.dataset.sessionJumpKey === key && !element.closest('#archiveCalendar') && !element.closest('#sessionsLibraryView')) || null;
}

function markArchiveCard(card, session, index) {
  if (!card || !session) return card;
  const key = sessionJumpKey(session,index);
  card.dataset.sessionJumpKey = key;
  card.dataset.sessionIndex = String(index);
  card.dataset.sessionDate = String(session.date || '');
  if (!card.id) card.id = `archive-session-${String(index).replace(/[^0-9-]/g,'')}`;
  return card;
}

function wrapArchiveCards() {
  if (archiveWrapped) return;
  let original;
  try { original = buildSessionCard; } catch (_) { original = window.buildSessionCard; }
  if (typeof original !== 'function') return;
  if (original.__calendarJumpWrapped) { archiveWrapped = true; return; }
  const wrapped = function(session,index,...rest) {
    const card = original.call(this,session,index,...rest);
    return markArchiveCard(card,session,index);
  };
  wrapped.__calendarJumpWrapped = true;
  try { buildSessionCard = wrapped; } catch (_) {}
  window.buildSessionCard = wrapped;
  archiveWrapped = true;
}

function visibleSessionsForDate(date) {
  const data = appDb();
  return (data?.sessions || []).map((session,index) => ({ session,index })).filter(item => {
    if (item.session?.date !== date) return false;
    try { return typeof matchesArchiveFilters === 'function' ? matchesArchiveFilters(item.session) : true; }
    catch (_) { return true; }
  }).slice(0,3);
}

function currentCalendarMonth() {
  try { return archiveMonth instanceof Date ? archiveMonth : new Date(archiveMonth); }
  catch (_) { return new Date(); }
}

function decorateCalendarNavigation() {
  const calendar = document.getElementById('archiveCalendar');
  if (!calendar) return;
  const month = currentCalendarMonth();
  const year = month.getFullYear();
  const monthIndex = month.getMonth();

  [...calendar.querySelectorAll('.calDay')].forEach(cell => {
    const day = Number(cell.querySelector('.calDate')?.textContent || 0);
    if (!day) return;
    const date = `${year}-${String(monthIndex + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const items = visibleSessionsForDate(date);
    cell.dataset.sessionDate = date;
    cell.classList.toggle('hasSessionJump',items.length > 0);
    cell.querySelector('.calDate')?.classList.toggle('calendarJumpDate',items.length > 0);
    [...cell.querySelectorAll('.calSessionDot')].forEach((dot,dotIndex) => {
      const item = items[dotIndex];
      if (!item) {
        delete dot.dataset.sessionJumpKey;
        delete dot.dataset.sessionIndex;
        return;
      }
      dot.dataset.sessionJumpKey = sessionJumpKey(item.session,item.index);
      dot.dataset.sessionIndex = String(item.index);
      dot.title = `View ${item.session.theme || 'session'} · ${item.session.date || ''}${sessionScoreOutOfTen(item.session) ? ` · ${sessionScoreOutOfTen(item.session)}/10` : ''}`;
    });
  });
}

function highlightAndScroll(card) {
  if (!card) return false;
  document.querySelectorAll(`.${HIGHLIGHT_CLASS}`).forEach(node => node.classList.remove(HIGHLIGHT_CLASS));
  card.classList.add(HIGHLIGHT_CLASS);
  card.scrollIntoView({ behavior:'smooth', block:'start' });
  clearTimeout(card._calendarJumpTimer);
  card._calendarJumpTimer = setTimeout(() => card.classList.remove(HIGHLIGHT_CLASS),2200);
  return true;
}

function scrollToArchivedSession(key) {
  if (!key) return;
  const first = findArchiveCard(key);
  if (highlightAndScroll(first)) return;
  try { if (typeof renderArchive === 'function') renderArchive(); else window.renderArchive?.(); } catch (_) {}
  requestAnimationFrame(() => requestAnimationFrame(() => highlightAndScroll(findArchiveCard(key))));
}

function installCalendarClick() {
  const calendar = document.getElementById('archiveCalendar');
  if (!calendar || calendar.dataset.sessionJumpBound === 'true') return;
  calendar.dataset.sessionJumpBound = 'true';
  calendar.addEventListener('click',event => {
    const cell = event.target.closest('.calDay');
    if (!cell || !calendar.contains(cell)) return;
    const dot = event.target.closest('.calSessionDot[data-session-jump-key]');
    let key = dot?.dataset.sessionJumpKey || '';
    if (!key) {
      const firstDot = cell.querySelector('.calSessionDot[data-session-jump-key]');
      key = firstDot?.dataset.sessionJumpKey || '';
    }
    if (!key) return;
    event.preventDefault();
    scrollToArchivedSession(key);
  });
}

function wrapArchiveRender() {
  let original;
  try { original = renderArchive; } catch (_) { original = window.renderArchive; }
  if (typeof original !== 'function' || original.__calendarNavigationWrapped) return;
  const wrapped = function(...args) {
    const result = original.apply(this,args);
    requestAnimationFrame(() => {
      wrapArchiveCards();
      decorateCalendarNavigation();
      installCalendarClick();
    });
    return result;
  };
  wrapped.__calendarNavigationWrapped = true;
  try { renderArchive = wrapped; } catch (_) {}
  window.renderArchive = wrapped;
}

function install() {
  addStyles();
  installSessionLibraryHooks();
  wrapArchiveCards();
  wrapArchiveRender();
  decorateCalendarNavigation();
  installCalendarClick();
  setTimeout(() => {
    installSessionLibraryHooks();
    wrapArchiveCards();
    wrapArchiveRender();
    decorateCalendarNavigation();
    installCalendarClick();
  },300);
  setTimeout(() => {
    installSessionLibraryHooks();
    decorateCalendarNavigation();
  },900);
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',install,{ once:true });
  else install();
}
