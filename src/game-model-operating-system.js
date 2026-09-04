import {
  GAME_MODEL_VERSION,
  GAME_MODEL_DEFINITION,
  PLAYER_GAME_MODEL_ANSWER,
  GAME_MODEL_PRINCIPLES,
  GAME_MOMENTS,
  TECHNICAL_STANDARDS,
  PRACTICE_ROLES,
  LEARNING_EMPHASES,
  principleById,
  normaliseGameModelPlan,
  standardClarityForPrinciple
} from './game-model-core.js';

const STYLE_ID = 'gameModelOperatingSystemStyles';
const VIEW_ID = 'gameModel';
const TAB_ID = 'gameModelTab';
const MORE_TAB_ID = 'gameModelMoreTab';
const PLANNER_ID = 'gameModelImplementationPlan';
const SUMMARY_ID = 'gameModelImplementationSummary';

const PLAN_IDS = Object.freeze({
  playerProblem:'gmPlayerProblem',
  gameMoment:'gmGameMoment',
  primary:'gmPrimaryPrinciple',
  supporting:'gmSupportingPrinciple',
  emphasis:'gmLearningEmphasis'
});

let plannerObserver = null;
let refreshFrame = 0;

function escapeText(value) {
  try { if (typeof escapeHtml === 'function') return escapeHtml(String(value ?? '')); } catch (_) {}
  return String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
}

function field(id) { return document.getElementById(id); }

function appDb() {
  try { return typeof db !== 'undefined' ? db : window.db; }
  catch (_) { return window.db; }
}

function planFromSession(session = {}) {
  return normaliseGameModelPlan(session?.gameModelPlan || {});
}

function currentPlan() {
  return normaliseGameModelPlan({
    playerProblem:field(PLAN_IDS.playerProblem)?.value,
    gameMoment:field(PLAN_IDS.gameMoment)?.value,
    primaryPrincipleId:field(PLAN_IDS.primary)?.value,
    supportingPrincipleId:field(PLAN_IDS.supporting)?.value,
    emphasis:field(PLAN_IDS.emphasis)?.value
  });
}

function setCurrentPlan(value = {}) {
  const plan = normaliseGameModelPlan(value);
  if (field(PLAN_IDS.playerProblem)) field(PLAN_IDS.playerProblem).value = plan.playerProblem;
  if (field(PLAN_IDS.gameMoment)) field(PLAN_IDS.gameMoment).value = plan.gameMoment;
  if (field(PLAN_IDS.primary)) field(PLAN_IDS.primary).value = plan.primaryPrincipleId;
  if (field(PLAN_IDS.supporting)) field(PLAN_IDS.supporting).value = plan.supportingPrincipleId;
  if (field(PLAN_IDS.emphasis)) field(PLAN_IDS.emphasis).value = plan.emphasis;
  syncCoreFieldLocks();
  updatePlanUi();
}

function clearCurrentPlan() { setCurrentPlan({ emphasis:'recognise' }); }

function optionMarkup(items, selected = '') {
  return items.map(item => `<option value="${escapeText(item.id)}"${item.id === selected ? ' selected' : ''}>${escapeText(item.label || item.message || item.title)}</option>`).join('');
}

function addStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    #${VIEW_ID}{max-width:1180px}
    .gmOsHero{padding:20px;border:1px solid rgba(52,211,153,.28);border-radius:18px;background:linear-gradient(145deg,rgba(52,211,153,.1),rgba(56,189,248,.055));margin-bottom:14px}
    .gmOsHeroTop{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.gmOsHero h2{margin:0;font-size:22px}.gmOsHero p{margin:7px 0 0;line-height:1.55;color:#d8e4ef;max-width:900px}
    .gmOsVersion{flex:none;border:1px solid rgba(52,211,153,.4);background:rgba(52,211,153,.1);color:#a7f3d0;border-radius:999px;padding:5px 9px;font-size:10px;font-weight:950;letter-spacing:.06em;text-transform:uppercase}
    .gmPlayerAnswer{margin-top:13px;padding:12px 13px;border-radius:12px;background:rgba(3,12,20,.42);border:1px solid rgba(255,255,255,.09)}.gmPlayerAnswer b{display:block;color:#a7f3d0;font-size:10px;text-transform:uppercase;letter-spacing:.07em;margin-bottom:4px}.gmPlayerAnswer span{font-size:13px;line-height:1.5;color:#eef6ff}
    .gmOsSection{margin:14px 0}.gmOsSectionHead{display:flex;justify-content:space-between;align-items:flex-end;gap:10px;margin-bottom:8px}.gmOsSectionHead h3{margin:0;font-size:16px}.gmOsSectionHead span{font-size:11px;color:var(--text-dim)}
    .gmPrincipleGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.gmPrincipleCard{scroll-margin-top:145px;border:1px solid var(--border);border-radius:15px;background:linear-gradient(180deg,var(--surface),var(--surface-2));padding:14px}.gmPrincipleCard:target,.gmPrincipleCard.gmFocus{border-color:rgba(52,211,153,.75);box-shadow:0 0 0 2px rgba(52,211,153,.1)}
    .gmPrincipleTop{display:flex;gap:10px;align-items:flex-start}.gmPrincipleNum{width:26px;height:26px;flex:none;border-radius:8px;background:var(--turf-dim);color:var(--turf);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:950}.gmPrincipleTitle{font-size:10px;color:#93c5fd;font-weight:900;text-transform:uppercase;letter-spacing:.06em}.gmPrincipleMessage{font-size:18px;line-height:1.15;font-weight:950;color:#fff;margin-top:2px}
    .gmPrincipleRows{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:11px}.gmPrincipleRow{padding:9px;border-radius:10px;background:rgba(4,13,22,.36);border:1px solid rgba(255,255,255,.06)}.gmPrincipleRow b{display:block;font-size:9px;color:var(--text-faint);letter-spacing:.06em;text-transform:uppercase;margin-bottom:3px}.gmPrincipleRow span{display:block;font-size:11px;line-height:1.42;color:#d8e4ef}.gmPrincipleRow.full{grid-column:1/-1}
    .gmPrincipleQuestions{display:flex;gap:5px;flex-wrap:wrap;margin-top:8px}.gmPrincipleQuestions span{font-size:10px;border:1px solid rgba(56,189,248,.25);background:rgba(56,189,248,.06);color:#bae6fd;border-radius:999px;padding:4px 7px}.gmThemeLine{font-size:9.5px;color:var(--text-faint);margin-top:8px}
    .gmOsColumns{display:grid;grid-template-columns:1fr 1fr;gap:10px}.gmOsPanel{border:1px solid var(--border);border-radius:15px;background:var(--surface-2);padding:14px}.gmOsPanel h3{margin:0 0 4px;font-size:15px}.gmOsPanel>p{margin:0 0 10px;color:var(--text-dim);font-size:11px;line-height:1.45}.gmMiniList{display:grid;gap:6px}.gmMiniItem{padding:9px 10px;border-radius:10px;background:var(--surface-3);border:1px solid var(--border-soft)}.gmMiniItem b{font-size:11px;color:#eaf7ff}.gmMiniItem span{display:block;margin-top:2px;font-size:10.5px;line-height:1.4;color:var(--text-dim)}
    .gmMomentGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.gmMomentCard{padding:9px;border-radius:10px;border:1px solid var(--border-soft);background:rgba(4,13,22,.35)}.gmMomentCard b{font-size:11px;color:#a7f3d0}.gmMomentCard p{margin:3px 0;font-size:10.5px;color:#cbd5e1;line-height:1.35}.gmMomentCard small{color:var(--text-faint);font-size:9.5px}
    .gmStableFlex{display:grid;grid-template-columns:1fr 1fr;gap:8px}.gmStableFlex>div{padding:10px;border-radius:11px;border:1px solid var(--border-soft);background:rgba(4,13,22,.3)}.gmStableFlex b{display:block;font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:#a7f3d0}.gmStableFlex span{display:block;margin-top:4px;font-size:10.5px;color:var(--text-dim);line-height:1.4}

    #${PLANNER_ID}{margin:0 0 12px;padding:11px;border-radius:12px;border:1px solid rgba(251,191,36,.26);background:rgba(251,191,36,.035)}
    .gmPlanHead{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:7px}.gmPlanHead b{font-size:12px;color:#fde68a}.gmPlanHead span{display:block;margin-top:2px;font-size:9.5px;color:var(--text-faint);line-height:1.35}.gmPlanHead button{padding:5px 8px;font-size:10px;white-space:nowrap}
    .gmPlanGrid{display:grid;grid-template-columns:1fr 1fr;gap:7px}.gmPlanGrid .full{grid-column:1/-1}#${PLANNER_ID} label{margin-top:5px;font-size:9.5px}#${PLANNER_ID} textarea{min-height:48px}
    .gmStandardLine{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:8px;padding:8px 9px;border-radius:9px;border:1px solid rgba(52,211,153,.18);background:rgba(52,211,153,.045);font-size:9.5px;color:#a7f3d0}.gmStandardLine button{padding:5px 7px;font-size:9.5px}
    #${SUMMARY_ID}{margin-top:8px;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:5px}.gmPlanStep{border:1px solid var(--border-soft);background:rgba(4,13,22,.34);border-radius:9px;padding:7px}.gmPlanStep b{display:block;font-size:9px;color:#93c5fd;text-transform:uppercase;letter-spacing:.05em}.gmPlanStep span{display:block;font-size:9.5px;line-height:1.35;color:var(--text-dim);margin-top:2px}
    .gmCoreLocked{background-image:linear-gradient(90deg,rgba(52,211,153,.025),rgba(52,211,153,.025))}.gmCoreLockNote{font-size:9px;color:#86efac;margin-top:3px}

    @media(max-width:760px){.gmPrincipleGrid,.gmOsColumns,.gmPrincipleRows,.gmMomentGrid,.gmStableFlex{grid-template-columns:1fr}.gmPlanGrid{grid-template-columns:1fr}.gmPlanGrid .full{grid-column:auto}#${SUMMARY_ID}{grid-template-columns:1fr 1fr}.gmOsHero{padding:15px}.gmOsHeroTop{display:block}.gmOsVersion{display:inline-block;margin-top:8px}.gmPrincipleMessage{font-size:16px}}
  `;
  document.head.appendChild(style);
}

function principleCard(principle) {
  return `<article class="gmPrincipleCard" id="gameModelPrinciple-${escapeText(principle.id)}" data-principle-id="${escapeText(principle.id)}">
    <div class="gmPrincipleTop"><div class="gmPrincipleNum">${principle.number}</div><div><div class="gmPrincipleTitle">${escapeText(principle.title)} · ${escapeText(principle.principle)}</div><div class="gmPrincipleMessage">${escapeText(principle.message)}</div></div></div>
    <div class="gmPrincipleRows">
      <div class="gmPrincipleRow"><b>What it means</b><span>${escapeText(principle.meaning)}</span></div>
      <div class="gmPrincipleRow"><b>Why</b><span>${escapeText(principle.why)}</span></div>
      <div class="gmPrincipleRow full"><b>Picture to recognise</b><span>${escapeText(principle.picture)}</span></div>
    </div>
    <div class="gmPrincipleQuestions">${principle.questions.map(question => `<span>${escapeText(question)}</span>`).join('')}</div>
    <div class="gmThemeLine">Useful contexts: ${escapeText(principle.themes.join(' · '))}</div>
  </article>`;
}

function ensureGameModelView() {
  let view = document.getElementById(VIEW_ID);
  if (view) return view;
  view = document.createElement('section');
  view.id = VIEW_ID;
  view.className = 'view hidden';
  view.innerHTML = `
    <div class="gmOsHero">
      <div class="gmOsHeroTop"><div><h2>Our Game Model</h2><p>${escapeText(GAME_MODEL_DEFINITION)}</p></div><span class="gmOsVersion">Game Model v${escapeText(GAME_MODEL_VERSION)} · Core language</span></div>
      <div class="gmPlayerAnswer"><b>If a player is asked “How do we want to play?”</b><span>${escapeText(PLAYER_GAME_MODEL_ANSWER)}</span></div>
    </div>
    <section class="gmOsSection"><div class="gmOsSectionHead"><h3>Our seven messages</h3><span>Stable beliefs. Adapt the picture and solution, not the core language.</span></div><div class="gmPrincipleGrid">${GAME_MODEL_PRINCIPLES.map(principleCard).join('')}</div></section>
    <section class="gmOsSection gmOsColumns">
      <div class="gmOsPanel"><h3>How we train it</h3><p>The session is principle-driven; each practice has a clear job.</p><div class="gmMiniList">${PRACTICE_ROLES.map(role => `<div class="gmMiniItem"><b>${escapeText(role.label)}</b><span>${escapeText(role.description)}</span></div>`).join('')}</div></div>
      <div class="gmOsPanel"><h3>How the emphasis develops</h3><p>Early season can be more explicit about identity; later work can lean harder into execution while the principles stay visible.</p><div class="gmMiniList">${LEARNING_EMPHASES.map(item => `<div class="gmMiniItem"><b>${escapeText(item.label)}</b><span>${escapeText(item.description)}</span></div>`).join('')}</div></div>
    </section>
    <section class="gmOsSection gmOsColumns">
      <div class="gmOsPanel"><h3>Technical standards</h3><p>These are execution tools, not extra game-model principles.</p><div class="gmMiniList">${TECHNICAL_STANDARDS.map(item => `<div class="gmMiniItem"><b>${escapeText(item)}</b></div>`).join('')}</div></div>
      <div class="gmOsPanel"><h3>Themes are contexts</h3><p>The theme tells us where the problem is happening. The principle tells us what we believe should happen.</p><div class="gmMomentGrid">${GAME_MOMENTS.map(moment => `<div class="gmMomentCard"><b>${escapeText(moment.label)}</b><p>${escapeText(moment.description)}</p><small>${escapeText(moment.themes.join(' · '))}</small></div>`).join('')}</div></div>
    </section>
    <section class="gmOsSection gmOsPanel"><h3>What stays stable vs what can change</h3><p>This is how the model remains portable across teams, formations and opponents.</p><div class="gmStableFlex"><div><b>Core model · stable</b><span>The seven messages, their WHY and the football pictures they describe.</span></div><div><b>Team solutions · flexible</b><span>Formation, roles, rotations, pressing shape, rest defence and opponent-specific details can change without changing the belief.</span></div></div></section>`;
  document.body.appendChild(view);
  return view;
}

function showGameModelView(principleId = '') {
  ensureGameModelView();
  try {
    const active = document.querySelector('.tab.active');
    if (active?.dataset?.tab === 'library' && typeof saveLibraryState === 'function') saveLibraryState();
  } catch (_) {}
  document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
  document.querySelectorAll('.tab[data-tab="gameModel"]').forEach(tab => tab.classList.add('active'));
  document.querySelectorAll('.view').forEach(view => view.classList.add('hidden'));
  document.getElementById(VIEW_ID)?.classList.remove('hidden');
  try { if (typeof closeMoreSheet === 'function') closeMoreSheet(); } catch (_) {}
  if (principleId) {
    const target = document.getElementById(`gameModelPrinciple-${principleId}`);
    document.querySelectorAll('.gmPrincipleCard.gmFocus').forEach(card => card.classList.remove('gmFocus'));
    if (target) {
      target.classList.add('gmFocus');
      setTimeout(() => target.scrollIntoView({ behavior:'smooth', block:'start' }), 0);
    }
  } else {
    window.scrollTo(0, 0);
  }
}

function ensureNavigation() {
  const nav = document.querySelector('nav');
  if (nav && !document.getElementById(TAB_ID)) {
    const button = document.createElement('button');
    button.id = TAB_ID;
    button.type = 'button';
    button.className = 'tab';
    button.dataset.tab = VIEW_ID;
    button.textContent = 'Game Model';
    button.addEventListener('click', () => showGameModelView());
    const planner = nav.querySelector('.tab[data-tab="planner"]');
    if (planner) planner.insertAdjacentElement('afterend', button);
    else nav.appendChild(button);
  }
  const more = document.getElementById('moreSheet');
  if (more && !document.getElementById(MORE_TAB_ID)) {
    const button = document.createElement('button');
    button.id = MORE_TAB_ID;
    button.type = 'button';
    button.className = 'tab';
    button.dataset.tab = VIEW_ID;
    button.textContent = '🧭 Game Model';
    button.addEventListener('click', () => showGameModelView());
    more.prepend(button);
  }
}

function primaryOptions() {
  return `<option value="">Choose today’s primary principle</option>${GAME_MODEL_PRINCIPLES.map(item => `<option value="${item.id}">${escapeText(item.message)}</option>`).join('')}<option value="custom">Custom / session-specific</option>`;
}

function supportingOptions() {
  return `<option value="">No supporting principle</option>${GAME_MODEL_PRINCIPLES.map(item => `<option value="${item.id}">${escapeText(item.message)}</option>`).join('')}`;
}

function ensurePlannerPanel() {
  const card = document.getElementById('gameModelClarityCard');
  if (!card) return null;
  let panel = document.getElementById(PLANNER_ID);
  if (panel) return panel;
  panel = document.createElement('section');
  panel.id = PLANNER_ID;
  panel.innerHTML = `
    <div class="gmPlanHead"><div><b>Session implementation</b><span>Start with the player problem, choose the principle, then let the practices do a clear job.</span></div><button type="button" id="gmOpenGameModelBtn">View Game Model</button></div>
    <div class="gmPlanGrid">
      <div class="full"><label for="${PLAN_IDS.playerProblem}">PLAYER PROBLEM</label><textarea id="${PLAN_IDS.playerProblem}" placeholder="What are we seeing that we want players to understand or execute better?"></textarea></div>
      <div><label for="${PLAN_IDS.gameMoment}">GAME MOMENT</label><select id="${PLAN_IDS.gameMoment}"><option value="">Choose the game moment</option>${optionMarkup(GAME_MOMENTS)}</select></div>
      <div><label for="${PLAN_IDS.emphasis}">LEARNING EMPHASIS</label><select id="${PLAN_IDS.emphasis}">${optionMarkup(LEARNING_EMPHASES)}</select></div>
      <div><label for="${PLAN_IDS.primary}">PRIMARY PRINCIPLE</label><select id="${PLAN_IDS.primary}">${primaryOptions()}</select></div>
      <div><label for="${PLAN_IDS.supporting}">SUPPORTING PRINCIPLE · OPTIONAL</label><select id="${PLAN_IDS.supporting}">${supportingOptions()}</select></div>
    </div>
    <div class="gmStandardLine" id="gmCoreStandardLine"><span id="gmCoreStandardText">Choose a core principle to load its stable WHY, principle and player cue.</span><button type="button" id="gmUseCoreStandardBtn" disabled>Use Core Standard</button></div>
    <div id="${SUMMARY_ID}"></div>`;
  const head = card.querySelector('.gmClarityHead');
  if (head) head.insertAdjacentElement('afterend', panel);
  else card.prepend(panel);

  Object.values(PLAN_IDS).forEach(id => field(id)?.addEventListener('input', schedulePlanRefresh));
  field(PLAN_IDS.primary)?.addEventListener('change', () => {
    const primary = field(PLAN_IDS.primary)?.value || '';
    if (field(PLAN_IDS.supporting)?.value === primary) field(PLAN_IDS.supporting).value = '';
    applyPrimaryStandard(true);
    updatePlanUi();
  });
  field(PLAN_IDS.supporting)?.addEventListener('change', () => {
    if (field(PLAN_IDS.supporting)?.value && field(PLAN_IDS.supporting)?.value === field(PLAN_IDS.primary)?.value) field(PLAN_IDS.supporting).value = '';
    updatePlanUi();
  });
  document.getElementById('gmUseCoreStandardBtn')?.addEventListener('click', () => applyPrimaryStandard(true));
  document.getElementById('gmOpenGameModelBtn')?.addEventListener('click', () => showGameModelView(currentPlan().primaryPrincipleId));
  setCurrentPlan({ emphasis:'recognise' });
  return panel;
}

function dispatchInput(element) {
  if (!element) return;
  try { element.dispatchEvent(new Event('input', { bubbles:true })); } catch (_) {}
}

function syncCoreFieldLocks() {
  const primary = principleById(field(PLAN_IDS.primary)?.value || '');
  const lockedIds = ['gmWhy','gmPrinciple','gmPlayerCue'];
  lockedIds.forEach(id => {
    const target = field(id);
    if (!target) return;
    target.readOnly = !!primary;
    target.classList.toggle('gmCoreLocked', !!primary);
    target.setAttribute('aria-readonly', primary ? 'true' : 'false');
  });
  let note = document.getElementById('gmCoreLockNote');
  const cue = field('gmPlayerCue');
  if (primary && cue && !note) {
    note = document.createElement('div');
    note.id = 'gmCoreLockNote';
    note.className = 'gmCoreLockNote';
    note.textContent = 'Core WHY, principle and cue are locked for consistency. Adapt today’s picture and questions underneath.';
    cue.insertAdjacentElement('afterend', note);
  }
  if (!primary) note?.remove();
}

function applyPrimaryStandard(force = false) {
  const id = field(PLAN_IDS.primary)?.value || '';
  const principle = principleById(id);
  syncCoreFieldLocks();
  const button = document.getElementById('gmUseCoreStandardBtn');
  if (button) button.disabled = !principle;
  if (!principle) {
    updatePlanUi();
    return;
  }
  const clarity = standardClarityForPrinciple(principle.id);
  const map = [
    ['gmWhy', clarity.why, true],
    ['gmPrinciple', clarity.principle, true],
    ['gmPlayerCue', clarity.cue, true],
    ['gmPicture', clarity.picture, force],
    ['gmPlayerQuestions', clarity.questions.join('\n'), force]
  ];
  map.forEach(([id, value, shouldForce]) => {
    const target = field(id);
    if (!target) return;
    if (shouldForce || !String(target.value || '').trim()) {
      target.value = value;
      dispatchInput(target);
    }
  });
  updatePlanUi();
}

function roleStepMarkup(label, text) {
  return `<div class="gmPlanStep"><b>${escapeText(label)}</b><span>${escapeText(text)}</span></div>`;
}

function updatePlanUi() {
  const plan = currentPlan();
  const primary = principleById(plan.primaryPrincipleId);
  const supporting = principleById(plan.supportingPrincipleId);
  const emphasis = LEARNING_EMPHASES.find(item => item.id === plan.emphasis) || LEARNING_EMPHASES[1];
  const standardText = document.getElementById('gmCoreStandardText');
  const standardBtn = document.getElementById('gmUseCoreStandardBtn');
  if (standardBtn) standardBtn.disabled = !primary;
  if (standardText) {
    if (primary) standardText.textContent = `${primary.message} · stable WHY + cue locked; tailor the picture to today’s player problem.`;
    else if (plan.primaryPrincipleId === 'custom') standardText.textContent = 'Custom principle selected · core wording is unlocked for this session.';
    else standardText.textContent = 'Choose a core principle to load its stable WHY, principle and player cue.';
  }
  const summary = document.getElementById(SUMMARY_ID);
  if (summary) {
    const principleText = primary ? primary.message : (plan.primaryPrincipleId === 'custom' ? 'Custom principle' : 'Choose principle');
    const supportingText = supporting ? ` Support: ${supporting.message}` : '';
    summary.innerHTML = [
      roleStepMarkup('ACTIVATE · TOOLS', 'Bank touches and sharpen execution. Link the principle only when it is genuine.'),
      roleStepMarkup('SKILL · INTRODUCE', primary ? `Lightly expose “${principleText}” while coaching the tools.` : 'Use execution work or lightly introduce today’s picture.'),
      roleStepMarkup('TACTICAL · PICTURE', primary ? `Make the picture behind “${principleText}” obvious and repeatable.${supportingText}` : 'Make today’s football picture obvious and repeatable.'),
      roleStepMarkup(`${emphasis.label.toUpperCase()} · TRANSFER`, emphasis.description)
    ].join('');
  }
  syncCoreFieldLocks();
}

function schedulePlanRefresh() {
  cancelAnimationFrame(refreshFrame);
  refreshFrame = requestAnimationFrame(() => { refreshFrame = 0; updatePlanUi(); });
}

function installPlannerPersistence() {
  let originalPlanner;
  try { originalPlanner = currentPlannerSession; } catch (_) { originalPlanner = window.currentPlannerSession; }
  if (typeof originalPlanner === 'function' && !originalPlanner.__gameModelOperatingSystem) {
    const wrapped = function(...args) {
      return { ...(originalPlanner.apply(this, args) || {}), gameModelPlan:currentPlan() };
    };
    wrapped.__gameModelOperatingSystem = true;
    try { currentPlannerSession = wrapped; } catch (_) {}
    window.currentPlannerSession = wrapped;
  }

  let originalLoad;
  try { originalLoad = loadSessionToPlanner; } catch (_) { originalLoad = window.loadSessionToPlanner; }
  if (typeof originalLoad === 'function' && !originalLoad.__gameModelOperatingSystem) {
    const wrapped = function(index, mode = 'edit', ...rest) {
      const session = appDb()?.sessions?.[index];
      const result = originalLoad.call(this, index, mode, ...rest);
      setTimeout(() => { ensurePlannerPanel(); setCurrentPlan(planFromSession(session)); }, 0);
      return result;
    };
    wrapped.__gameModelOperatingSystem = true;
    try { loadSessionToPlanner = wrapped; } catch (_) {}
    window.loadSessionToPlanner = wrapped;
  }

  let originalReset;
  try { originalReset = resetSessionPlanner; } catch (_) { originalReset = window.resetSessionPlanner; }
  if (typeof originalReset === 'function' && !originalReset.__gameModelOperatingSystem) {
    const wrapped = function(...args) {
      const result = originalReset.apply(this, args);
      clearCurrentPlan();
      return result;
    };
    wrapped.__gameModelOperatingSystem = true;
    try { resetSessionPlanner = wrapped; } catch (_) {}
    window.resetSessionPlanner = wrapped;
  }

  let originalApplyDraft;
  try { originalApplyDraft = applyDraftDetails; } catch (_) { originalApplyDraft = window.applyDraftDetails; }
  if (typeof originalApplyDraft === 'function' && !originalApplyDraft.__gameModelOperatingSystem) {
    const wrapped = function(...args) {
      const result = originalApplyDraft.apply(this, args);
      clearCurrentPlan();
      return result;
    };
    wrapped.__gameModelOperatingSystem = true;
    try { applyDraftDetails = wrapped; } catch (_) {}
    window.applyDraftDetails = wrapped;
  }
}

function installBlueprintPersistence() {
  let originalSave;
  try { originalSave = saveCurrentAsBlueprint; } catch (_) { originalSave = window.saveCurrentAsBlueprint; }
  if (typeof originalSave === 'function' && !originalSave.__gameModelOperatingSystem) {
    const wrapped = function(...args) {
      const data = appDb();
      const before = data?.sessionTemplates?.length || 0;
      const plan = currentPlan();
      const result = originalSave.apply(this, args);
      const after = data?.sessionTemplates?.length || 0;
      if (after > before && data.sessionTemplates[after - 1]) {
        data.sessionTemplates[after - 1].gameModelPlan = plan;
        try { if (typeof store === 'function') store(); } catch (_) {}
      }
      return result;
    };
    wrapped.__gameModelOperatingSystem = true;
    try { saveCurrentAsBlueprint = wrapped; } catch (_) {}
    window.saveCurrentAsBlueprint = wrapped;
  }

  let originalUse;
  try { originalUse = useBlueprint; } catch (_) { originalUse = window.useBlueprint; }
  if (typeof originalUse === 'function' && !originalUse.__gameModelOperatingSystem) {
    const wrapped = function(index, ...rest) {
      const template = appDb()?.sessionTemplates?.[index];
      const result = originalUse.call(this, index, ...rest);
      setTimeout(() => setCurrentPlan(planFromSession(template)), 0);
      return result;
    };
    wrapped.__gameModelOperatingSystem = true;
    try { useBlueprint = wrapped; } catch (_) {}
    window.useBlueprint = wrapped;
  }
}

function watchPlanner() {
  const planner = document.getElementById('planner');
  if (!planner || typeof MutationObserver === 'undefined' || plannerObserver) return;
  plannerObserver = new MutationObserver(() => {
    if (!document.getElementById(PLANNER_ID) && document.getElementById('gameModelClarityCard')) ensurePlannerPanel();
  });
  plannerObserver.observe(planner, { childList:true, subtree:true });
}

function ensureAll() {
  ensureGameModelView();
  ensureNavigation();
  ensurePlannerPanel();
  installPlannerPersistence();
  installBlueprintPersistence();
  watchPlanner();
  updatePlanUi();
}

function install() {
  addStyles();
  window.NickGameModel = Object.freeze({
    version:GAME_MODEL_VERSION,
    definition:GAME_MODEL_DEFINITION,
    playerAnswer:PLAYER_GAME_MODEL_ANSWER,
    principles:GAME_MODEL_PRINCIPLES,
    moments:GAME_MOMENTS,
    technicalStandards:TECHNICAL_STANDARDS,
    practiceRoles:PRACTICE_ROLES,
    learningEmphases:LEARNING_EMPHASES,
    show:showGameModelView
  });
  ensureAll();
  setTimeout(ensureAll, 120);
  setTimeout(ensureAll, 500);
  setTimeout(ensureAll, 1300);
  document.addEventListener('click', event => {
    if (event.target.closest?.('[data-tab="planner"],button[onclick*="showBuildRoute"],button[onclick*="loadSessionToPlanner"]')) setTimeout(ensureAll, 0);
  }, true);
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
  else install();
}
