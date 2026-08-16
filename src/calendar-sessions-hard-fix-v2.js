const STYLE_ID = 'calendarSessionsHardFixV2Styles';
const HIGHLIGHT_CLASS = 'calendarHardJumpTarget';
let installed = false;
let sessionObserver = null;
let calendarObserver = null;
let archiveObserver = null;
let themeObserver = null;

export function sessionScoreOutOfTen(session = {}) {
  const reviewRaw = Number(session?.review?.rating || 0);
  const sessionRaw = Number(session?.rating || 0);
  const raw = reviewRaw || sessionRaw;
  if (!raw) return 0;
  if (session?.review?.scale === 10 || raw > 5) return Math.max(1, Math.min(10, Math.round(raw)));
  return Math.max(1, Math.min(10, Math.round(raw * 2)));
}

export function trafficHue(score) {
  const value = Math.max(1, Math.min(10, Number(score) || 1));
  if (value <= 5) return Math.round(((value - 1) / 4) * 40);
  return Math.round(40 + ((value - 5) / 5) * 85);
}

function appDb() {
  try { return typeof db !== 'undefined' ? db : window.db; }
  catch (_) { return window.db; }
}

function matchesArchive(session) {
  try { return typeof matchesArchiveFilters === 'function' ? matchesArchiveFilters(session) : true; }
  catch (_) { return true; }
}

function visibleSessionsForDate(date) {
  const data = appDb();
  return (data?.sessions || [])
    .map((session, index) => ({ session, index }))
    .filter(item => item.session?.date === date && matchesArchive(item.session));
}

function currentArchiveMonthParts() {
  try {
    const month = archiveMonth instanceof Date ? archiveMonth : new Date(archiveMonth);
    return { year: month.getFullYear(), monthIndex: month.getMonth() };
  } catch (_) {
    const now = new Date();
    return { year: now.getFullYear(), monthIndex: now.getMonth() };
  }
}

function addStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    #archiveCalendar .calDay.calendarJumpReady{cursor:pointer;transition:transform .12s ease,outline-color .12s ease}
    #archiveCalendar .calDay.calendarJumpReady:hover{outline:2px solid rgba(56,189,248,.55);outline-offset:-2px;transform:translateY(-1px)}
    #archiveCalendar .calDate.calendarJumpReadyDate{text-decoration:underline;text-decoration-thickness:1px;text-decoration-color:rgba(56,189,248,.65);text-underline-offset:3px}
    #archiveCalendar .calSessionDot.hardRatedDot{border-left:4px solid hsl(var(--session-quality-hue) 72% 45%);padding-left:6px}
    #archiveCalendar .calMiniScore{display:inline-flex;margin-left:5px;padding:1px 5px;border-radius:999px;background:hsl(var(--session-quality-hue) 58% 27%);border:1px solid hsl(var(--session-quality-hue) 68% 42%);color:#fff;font-size:9px;font-weight:950;line-height:1.25;white-space:nowrap}
    .hardSessionTraffic{--session-quality-hue:40;border-color:hsl(var(--session-quality-hue) 64% 42% / .9)!important;box-shadow:inset 5px 0 0 hsl(var(--session-quality-hue) 72% 43%),0 10px 28px rgba(0,0,0,.16)!important;background:linear-gradient(135deg,hsl(var(--session-quality-hue) 48% 17% / .9),var(--surface-2) 70%)!important}
    .hardSessionScore{display:inline-flex;align-items:center;justify-content:center;min-width:48px;padding:4px 8px;border-radius:999px;background:hsl(var(--session-quality-hue) 60% 28%);border:1px solid hsl(var(--session-quality-hue) 72% 45%);color:#fff;font-size:11px;font-weight:950;line-height:1;white-space:nowrap}
    .hardSessionScore.unrated{--session-quality-hue:215;background:var(--surface-3);border-color:var(--border);color:var(--text-dim);min-width:auto}
    .hardSessionQualityLegend{display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin:8px 0 13px;padding:9px 10px;border:1px solid var(--border);border-radius:11px;background:var(--surface-2)}
    .hardSessionQualityLegend>strong{font-size:10px;color:var(--text-dim);text-transform:uppercase;letter-spacing:.05em;margin-right:2px}
    .hardLegendItem{display:inline-flex;align-items:center;gap:4px;font-size:10px;color:var(--text-dim)}
    .hardLegendDot{width:9px;height:9px;border-radius:50%;background:hsl(var(--legend-hue) 70% 43%)}
    #archiveList .session{scroll-margin-top:138px}
    .${HIGHLIGHT_CLASS}{animation:calendarHardJump 2.1s ease-out;outline:3px solid rgba(56,189,248,.95)!important;outline-offset:4px}
    @keyframes calendarHardJump{0%{box-shadow:0 0 0 0 rgba(56,189,248,.7),var(--shadow)}45%{box-shadow:0 0 0 13px rgba(56,189,248,0),var(--shadow)}100%{box-shadow:var(--shadow)}}
    @media(max-width:720px){#archiveList .session{scroll-margin-top:112px}.hardSessionQualityLegend{gap:5px;padding:8px}.hardSessionScore{min-width:44px;padding:4px 7px}.calMiniScore{font-size:8.5px!important}}
  `;
  document.head.appendChild(style);
}

function scoreMarkup(score) {
  if (!score) return '<span class="hardSessionScore unrated">Not reviewed</span>';
  const hue = trafficHue(score);
  return `<span class="hardSessionScore" style="--session-quality-hue:${hue}">${score}/10</span>`;
}

function applyTraffic(card, session) {
  if (!card || !session) return;
  const score = sessionScoreOutOfTen(session);
  card.classList.toggle('hardSessionTraffic', !!score);
  if (score) card.style.setProperty('--session-quality-hue', String(trafficHue(score)));
  else card.style.removeProperty('--session-quality-hue');
}

function ensureLegend() {
  const root = document.getElementById('sessionLibraryResults');
  if (!root) return;
  const view = document.getElementById('sessionsLibraryView');
  if (!view || view.querySelector('.hardSessionQualityLegend')) return;
  const legend = document.createElement('div');
  legend.className = 'hardSessionQualityLegend';
  legend.innerHTML = `<strong>Session rating</strong>
    <span class="hardLegendItem"><i class="hardLegendDot" style="--legend-hue:0"></i>1–3 Needs work</span>
    <span class="hardLegendItem"><i class="hardLegendDot" style="--legend-hue:40"></i>4–6 Mixed</span>
    <span class="hardLegendItem"><i class="hardLegendDot" style="--legend-hue:83"></i>7–8 Strong</span>
    <span class="hardLegendItem"><i class="hardLegendDot" style="--legend-hue:125"></i>9–10 Excellent</span>`;
  root.insertAdjacentElement('beforebegin', legend);
}

function sessionForLibraryCard(card) {
  const control = card?.querySelector('[data-index]');
  const index = Number(control?.dataset.index);
  const data = appDb();
  if (!Number.isInteger(index) || index < 0 || !data?.sessions?.[index]) return null;
  return { session: data.sessions[index], index };
}

function decorateSessionLibrary() {
  const root = document.getElementById('sessionLibraryResults');
  if (!root) return;
  ensureLegend();
  root.querySelectorAll('.sessionLibraryCard').forEach(card => {
    const found = sessionForLibraryCard(card);
    if (!found) return;
    const { session, index } = found;
    card.dataset.sessionIndex = String(index);
    applyTraffic(card, session);
    const meta = card.querySelector('.sessionLibraryMeta');
    if (!meta) return;
    [...meta.querySelectorAll('.pill')].forEach(pill => {
      const text = (pill.textContent || '').trim();
      if (/[★☆]/.test(text)) pill.remove();
    });
    meta.querySelectorAll('.sessionNumberRating,.qualityScoreBadge,.sessionNotReviewed').forEach(node => node.remove());
    const score = sessionScoreOutOfTen(session);
    let badge = meta.querySelector('.hardSessionScore');
    if (!badge) {
      meta.insertAdjacentHTML('beforeend', scoreMarkup(score));
      badge = meta.querySelector('.hardSessionScore:last-child');
    }
    if (badge) {
      badge.classList.toggle('unrated', !score);
      badge.textContent = score ? `${score}/10` : 'Not reviewed';
      if (score) badge.style.setProperty('--session-quality-hue', String(trafficHue(score)));
      else badge.style.removeProperty('--session-quality-hue');
    }
  });
}

function dateForCalendarCell(cell) {
  const day = Number(cell?.querySelector('.calDate')?.textContent || 0);
  if (!day) return '';
  const { year, monthIndex } = currentArchiveMonthParts();
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function decorateCalendar() {
  const calendar = document.getElementById('archiveCalendar');
  if (!calendar) return;
  calendar.querySelectorAll('.calDay').forEach(cell => {
    const date = dateForCalendarCell(cell);
    if (!date) return;
    const items = visibleSessionsForDate(date);
    cell.dataset.sessionDate = date;
    cell.classList.toggle('calendarJumpReady', items.length > 0);
    cell.querySelector('.calDate')?.classList.toggle('calendarJumpReadyDate', items.length > 0);
    const dots = [...cell.querySelectorAll('.calSessionDot')];
    dots.forEach((dot, dotIndex) => {
      const item = items[dotIndex];
      const badge = dot.querySelector('.calMiniScore');
      if (!item) {
        if (badge) badge.remove();
        dot.classList.remove('hardRatedDot');
        dot.style.removeProperty('--session-quality-hue');
        delete dot.dataset.sessionIndex;
        return;
      }
      dot.dataset.sessionIndex = String(item.index);
      const score = sessionScoreOutOfTen(item.session);
      if (!score) {
        if (badge) badge.remove();
        dot.classList.remove('hardRatedDot');
        dot.style.removeProperty('--session-quality-hue');
        return;
      }
      const hue = trafficHue(score);
      dot.classList.add('hardRatedDot');
      dot.style.setProperty('--session-quality-hue', String(hue));
      if (!badge) {
        dot.insertAdjacentHTML('beforeend', `<span class="calMiniScore" style="--session-quality-hue:${hue}">${score}/10</span>`);
      } else {
        const text = `${score}/10`;
        if (badge.textContent !== text) badge.textContent = text;
        badge.style.setProperty('--session-quality-hue', String(hue));
      }
    });
  });
}

function sortedArchiveDayItems(date) {
  return visibleSessionsForDate(date).sort((a, b) => String(a.session?.team || '').localeCompare(String(b.session?.team || '')));
}

function replaceArchiveRatingUi(card, session, index) {
  const score = sessionScoreOutOfTen(session);
  applyTraffic(card, session);
  card.dataset.sessionIndex = String(index);

  const topMeta = card.querySelector('.archiveTopMeta');
  if (topMeta) {
    [...topMeta.querySelectorAll('.pill')].forEach(pill => {
      if (/[★☆]/.test(pill.textContent || '')) pill.remove();
    });
    let badge = topMeta.querySelector('.hardSessionScore');
    if (!badge) {
      topMeta.insertAdjacentHTML('beforeend', scoreMarkup(score));
      badge = topMeta.querySelector('.hardSessionScore:last-child');
    }
    if (badge) {
      badge.classList.toggle('unrated', !score);
      badge.textContent = score ? `${score}/10` : 'Not reviewed';
      if (score) badge.style.setProperty('--session-quality-hue', String(trafficHue(score)));
      else badge.style.removeProperty('--session-quality-hue');
    }
  }

  card.querySelectorAll('.ratingStars').forEach(el => {
    const text = score ? `${score}/10` : 'Not reviewed';
    if (el.textContent !== text) el.textContent = text;
  });

  const select = card.querySelector('.sessionActions select');
  if (select && select.dataset.tenScale !== 'true') {
    select.dataset.tenScale = 'true';
    const options = ['<option value="">Rate /10...</option>'];
    for (let n = 1; n <= 10; n++) options.push(`<option value="${n}" ${score === n ? 'selected' : ''}>${n}/10</option>`);
    select.innerHTML = options.join('');
  } else if (select) {
    select.value = score ? String(score) : '';
  }
}

function decorateArchiveList(date = '') {
  const list = document.getElementById('archiveList');
  if (!list) return;
  const selectedDate = date || list.closest('#archiveCalendarWrap')?.querySelector('#selectedArchiveTitle')?.textContent?.slice(0, 10) || '';
  const items = sortedArchiveDayItems(selectedDate);
  const cards = [...list.querySelectorAll(':scope > .session')];
  cards.forEach((card, position) => {
    const item = items[position];
    if (!item) return;
    replaceArchiveRatingUi(card, item.session, item.index);
  });
}

function parseSessionIndexFromCard(card) {
  const button = card?.querySelector('button[onclick*="openGrassView("],button[onclick*="loadSessionToPlanner("],button[onclick*="duplicateSession("]');
  const source = button?.getAttribute('onclick') || '';
  const match = source.match(/(?:openGrassView|loadSessionToPlanner|duplicateSession)\((\d+)/);
  return match ? Number(match[1]) : -1;
}

function decorateArchiveTheme() {
  const wrap = document.getElementById('archiveThemeWrap');
  const data = appDb();
  if (!wrap || !data) return;
  wrap.querySelectorAll('.sessionCard').forEach(card => {
    const index = parseSessionIndexFromCard(card);
    const session = data.sessions?.[index];
    if (!session) return;
    const score = sessionScoreOutOfTen(session);
    applyTraffic(card, session);
    card.dataset.sessionIndex = String(index);
    const small = card.querySelector('.small');
    if (small) {
      const practices = Array.isArray(session.drills) ? session.drills.length : 0;
      small.textContent = `${practices} ${practices === 1 ? 'practice' : 'practices'} · ${score ? `${score}/10` : 'Not reviewed'}`;
    }
  });
}

function highlightAndScroll(card) {
  if (!card) return false;
  document.querySelectorAll(`.${HIGHLIGHT_CLASS}`).forEach(node => node.classList.remove(HIGHLIGHT_CLASS));
  card.classList.add(HIGHLIGHT_CLASS);
  card.scrollIntoView({ behavior: 'smooth', block: 'start' });
  clearTimeout(card._hardJumpTimer);
  card._hardJumpTimer = setTimeout(() => card.classList.remove(HIGHLIGHT_CLASS), 2300);
  return true;
}

function scrollToArchiveIndex(index, date) {
  const run = () => {
    decorateArchiveList(date);
    const target = document.querySelector(`#archiveList .session[data-session-index="${index}"]`) || document.querySelector('#archiveList .session');
    highlightAndScroll(target);
  };
  requestAnimationFrame(() => requestAnimationFrame(run));
}

function onCalendarClick(event) {
  const calendar = document.getElementById('archiveCalendar');
  const cell = event.target.closest?.('.calDay');
  if (!calendar || !cell || !calendar.contains(cell)) return;
  const date = cell.dataset.sessionDate || dateForCalendarCell(cell);
  const items = visibleSessionsForDate(date);
  if (!items.length) return;

  const dot = event.target.closest?.('.calSessionDot');
  const requestedIndex = Number(dot?.dataset.sessionIndex);
  const index = Number.isInteger(requestedIndex) && requestedIndex >= 0 ? requestedIndex : items[0].index;
  const originalCellClick = cell.onclick;

  event.preventDefault();
  event.stopImmediatePropagation();

  if (typeof originalCellClick === 'function') originalCellClick.call(cell);
  else {
    try { selectedArchiveDate = date; renderArchive(); }
    catch (_) { try { window.renderArchive?.(); } catch (_) {} }
  }
  scrollToArchiveIndex(index, date);
}

function scheduleAll() {
  requestAnimationFrame(() => {
    decorateCalendar();
    decorateSessionLibrary();
    decorateArchiveList();
    decorateArchiveTheme();
  });
}

function installObservers() {
  const calendar = document.getElementById('archiveCalendar');
  if (calendar && !calendar.dataset.hardJumpV2) {
    calendar.dataset.hardJumpV2 = 'true';
    calendar.addEventListener('click', onCalendarClick, true);
    calendarObserver = new MutationObserver(() => requestAnimationFrame(decorateCalendar));
    calendarObserver.observe(calendar, { childList: true, subtree: true });
  }

  const results = document.getElementById('sessionLibraryResults');
  if (results && !results.dataset.hardRatingV2) {
    results.dataset.hardRatingV2 = 'true';
    sessionObserver = new MutationObserver(() => requestAnimationFrame(decorateSessionLibrary));
    sessionObserver.observe(results, { childList: true, subtree: true });
  }

  const list = document.getElementById('archiveList');
  if (list && !list.dataset.hardRatingV2) {
    list.dataset.hardRatingV2 = 'true';
    archiveObserver = new MutationObserver(() => requestAnimationFrame(() => decorateArchiveList()));
    archiveObserver.observe(list, { childList: true, subtree: true });
  }

  const theme = document.getElementById('archiveThemeWrap');
  if (theme && !theme.dataset.hardRatingV2) {
    theme.dataset.hardRatingV2 = 'true';
    themeObserver = new MutationObserver(() => requestAnimationFrame(decorateArchiveTheme));
    themeObserver.observe(theme, { childList: true, subtree: true });
  }
}

function install() {
  if (installed) return;
  installed = true;
  addStyles();
  installObservers();
  scheduleAll();
  document.addEventListener('click', event => {
    if (event.target.closest?.('#sessionsLibraryTab,[data-tab="archive"],#archiveViewCalendar,#archiveViewTheme')) {
      setTimeout(() => { installObservers(); scheduleAll(); }, 0);
    }
  }, true);
  setTimeout(() => { installObservers(); scheduleAll(); }, 250);
  setTimeout(() => { installObservers(); scheduleAll(); }, 900);
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  window.CalendarSessionsHardFixV2 = { sessionScoreOutOfTen, trafficHue, decorateCalendar, decorateSessionLibrary };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
}
