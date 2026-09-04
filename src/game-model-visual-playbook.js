import {
  GAME_MODEL_PRINCIPLES,
  GAME_MOMENTS,
  principleById,
  normaliseGameModelPlan,
  linkedPracticesForPrinciple
} from './game-model-core.js';

const STYLE_ID = 'gameModelVisualPlaybookStyles';
const TABS_ID = 'gmVisualMomentTabs';
const SUCCESS_ID = 'gmSuccessLooksLike';
const SUCCESS_BANNER_ID = 'gmSuccessTargetBanner';
const SIDELINE_SUCCESS_ID = 'gmSidelineSuccessTarget';
let activeMoment = 'all';
let installedPersistence = false;

function escapeText(value) {
  try { if (typeof escapeHtml === 'function') return escapeHtml(String(value ?? '')); } catch (_) {}
  return String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
}

function appDb() {
  try { return typeof db !== 'undefined' ? db : window.db; }
  catch (_) { return window.db; }
}

function addStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    #gameModel{max-width:1280px}
    #${TABS_ID}{display:flex;gap:6px;overflow:auto;padding:2px 0 10px;scrollbar-width:none}#${TABS_ID}::-webkit-scrollbar{display:none}
    .gmVisualMomentTab{white-space:nowrap;padding:7px 10px;font-size:10.5px;background:var(--surface-2);color:var(--text-dim)}.gmVisualMomentTab.active{background:var(--turf-dim);border-color:rgba(52,211,153,.45);color:#a7f3d0}
    #gameModel .gmPrincipleGrid{grid-template-columns:1fr;gap:12px}
    #gameModel .gmPrincipleCard{padding:15px;border-radius:17px}
    .gmVisualBody{display:grid;grid-template-columns:minmax(310px,.95fr) minmax(0,1.05fr);gap:12px;margin-top:12px;align-items:start}
    .gmPictureCompare{display:grid;grid-template-columns:1fr 1fr;gap:7px}.gmPicturePanel{border-radius:12px;padding:8px;border:1px solid var(--border-soft);background:rgba(4,13,22,.38)}.gmPicturePanel.good{border-color:rgba(52,211,153,.3)}.gmPicturePanel.bad{border-color:rgba(251,113,133,.25)}
    .gmPictureLabel{display:flex;align-items:center;justify-content:space-between;gap:6px;margin-bottom:6px;font-size:9px;font-weight:950;text-transform:uppercase;letter-spacing:.06em}.gmPicturePanel.good .gmPictureLabel{color:#86efac}.gmPicturePanel.bad .gmPictureLabel{color:#fda4af}
    .gmConceptDiagram{display:block;width:100%;aspect-ratio:16/9;border-radius:8px;background:#14532d}.gmPictureExplain{font-size:9.5px;line-height:1.35;color:var(--text-dim);margin-top:6px}
    .gmPracticeLinks{margin-top:12px;padding-top:11px;border-top:1px solid var(--border-soft)}.gmPracticeLinksHead{display:flex;align-items:flex-end;justify-content:space-between;gap:8px;margin-bottom:7px}.gmPracticeLinksHead b{font-size:10.5px;color:#eaf7ff}.gmPracticeLinksHead span{font-size:9px;color:var(--text-faint)}
    .gmLinkedPracticeGrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px}.gmLinkedPractice{min-width:0;border:1px solid var(--border-soft);border-radius:11px;background:rgba(4,13,22,.35);overflow:hidden}.gmPracticePreview{height:92px;overflow:hidden;background:#102a20}.gmPracticePreview .pitchMini{width:100%!important;max-width:none!important;height:92px!important;margin:0!important;border:0!important;border-radius:0!important}.gmPracticeNoDiagram{height:92px;display:flex;align-items:center;justify-content:center;padding:8px;text-align:center;color:var(--text-faint);font-size:9px;background:linear-gradient(135deg,rgba(22,101,52,.35),rgba(15,23,42,.6))}
    .gmLinkedPracticeText{padding:8px}.gmLinkedPracticeText strong{display:block;font-size:10.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.gmLinkedPracticeText span{display:block;margin-top:2px;font-size:9px;color:var(--text-faint);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.gmLinkedPracticeText button{width:100%;margin-top:6px;padding:5px 7px;font-size:9px}.gmPracticeEmpty,.gmVisualEmpty{padding:11px;border:1px dashed var(--border);border-radius:11px;color:var(--text-faint);font-size:9.5px;line-height:1.45}
    #${SUCCESS_ID}{min-height:54px}#${SUCCESS_BANNER_ID}{display:none;margin-top:8px;padding:9px 10px;border:1px solid rgba(56,189,248,.25);border-radius:10px;background:rgba(56,189,248,.055);font-size:10px;line-height:1.4;color:#dbeafe}#${SUCCESS_BANNER_ID}.show{display:block}#${SUCCESS_BANNER_ID} b{color:#7dd3fc;text-transform:uppercase;letter-spacing:.06em;font-size:9px;margin-right:5px}
    #${SIDELINE_SUCCESS_ID}{margin:0 0 9px;padding:9px 10px;border-radius:11px;border:1px solid rgba(56,189,248,.28);background:rgba(3,14,24,.78)}#${SIDELINE_SUCCESS_ID} b{display:block;font-size:9px;text-transform:uppercase;letter-spacing:.07em;color:#7dd3fc;margin-bottom:3px}#${SIDELINE_SUCCESS_ID} span{font-size:11px;line-height:1.4;color:#e0f2fe}
    @media(max-width:900px){.gmVisualBody{grid-template-columns:1fr}.gmLinkedPracticeGrid{grid-template-columns:1fr 1fr}}
    @media(max-width:700px){.gmPictureCompare{grid-template-columns:1fr}.gmLinkedPracticeGrid{grid-template-columns:1fr 1fr}}
  `;
  document.head.appendChild(style);
}

function svgDot(x, y, type = 'us', label = '') {
  const fill = type === 'them' ? '#fb7185' : type === 'support' ? '#34d399' : '#38bdf8';
  const text = label ? `<text x="${x}" y="${y + 3}" text-anchor="middle" font-size="8" font-weight="800" fill="#06111d">${escapeText(label)}</text>` : '';
  return `<g><circle cx="${x}" cy="${y}" r="9" fill="${fill}" stroke="#f8fafc" stroke-width="2"/>${text}</g>`;
}

function svgBall(x, y) { return `<circle cx="${x}" cy="${y}" r="4" fill="#fff" stroke="#0f172a" stroke-width="1.5"/>`; }
function svgLabel(x, y, text) { return `<text x="${x}" y="${y}" text-anchor="middle" font-size="9" font-weight="800" fill="#f8fafc" paint-order="stroke" stroke="#0f172a" stroke-width="2.5">${escapeText(text)}</text>`; }
function svgZone(x, y, width, height, bad = false) { const tone = bad ? '#fb7185' : '#34d399'; return `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="7" fill="${tone}" fill-opacity=".1" stroke="${tone}" stroke-opacity=".75" stroke-width="2" stroke-dasharray="5 4"/>`; }
function svgArrow(x1, y1, x2, y2, markerId, dashed = false) { return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#fbbf24" stroke-width="3" stroke-linecap="round" ${dashed ? 'stroke-dasharray="6 5"' : ''} marker-end="url(#${markerId})"/>`; }

function sceneFor(principleId, good, marker) {
  switch (principleId) {
    case 'move-free': return good
      ? `${svgDot(70,90,'us','B')}${svgBall(78,92)}${svgDot(126,90,'them','D')}${svgDot(196,90,'support','F')}${svgDot(232,90,'them','D')}${svgArrow(132,90,94,90,marker,true)}${svgArrow(82,90,184,90,marker)}${svgLabel(122,68,'Press comes')}${svgLabel(196,68,'Free')}`
      : `${svgDot(70,90,'us','B')}${svgBall(78,92)}${svgDot(122,90,'them','D')}${svgDot(166,90,'us','F')}${svgDot(192,90,'them','D')}${svgArrow(82,90,154,90,marker)}${svgLabel(137,68,'Forced')}`;
    case 'behind-beneath': return good
      ? `${svgDot(92,95,'us','B')}${svgBall(100,98)}${svgDot(130,128,'support','U')}${svgDot(178,70,'us','R')}${svgDot(204,62,'them','D')}${svgDot(204,112,'them','D')}${svgArrow(180,70,252,70,marker)}${svgLabel(247,52,'Behind')}${svgLabel(130,151,'Beneath')}`
      : `${svgDot(92,95,'us','B')}${svgBall(100,98)}${svgDot(126,68,'us','1')}${svgDot(132,95,'us','2')}${svgDot(126,122,'us','3')}${svgDot(184,68,'them','D')}${svgDot(184,116,'them','D')}${svgLabel(135,151,'No depth')}`;
    case 'arrive': return good
      ? `${svgZone(176,55,58,70)}${svgDot(82,90,'us','B')}${svgBall(90,93)}${svgDot(150,138,'us','A')}${svgDot(218,90,'them','D')}${svgArrow(154,132,194,104,marker)}${svgArrow(94,90,188,90,marker,true)}${svgLabel(205,48,'Space first')}${svgLabel(161,158,'Arrive')}`
      : `${svgZone(176,55,58,70,true)}${svgDot(82,90,'us','B')}${svgBall(90,93)}${svgDot(196,90,'us','A')}${svgDot(218,90,'them','D')}${svgLabel(202,145,'Lives there')}`;
    case 'break-open': return good
      ? `${svgDot(82,90,'us','B')}${svgBall(90,93)}${svgDot(156,48,'them','D')}${svgDot(156,132,'them','D')}${svgZone(143,70,27,40)}${svgDot(234,90,'support','F')}${svgArrow(94,90,222,90,marker)}${svgLabel(158,64,'Window')}${svgLabel(230,68,'Break')}`
      : `${svgDot(82,90,'us','B')}${svgBall(90,93)}${svgDot(156,48,'them','D')}${svgDot(156,132,'them','D')}${svgZone(143,70,27,40,true)}${svgDot(82,48,'us','S')}${svgArrow(82,82,82,58,marker)}${svgLabel(125,66,'Window wasted')}`;
    case 'protect-inside': return good
      ? `${svgZone(126,48,54,84)}${svgDot(214,90,'them','B')}${svgBall(206,93)}${svgDot(157,66,'us','1')}${svgDot(142,90,'us','2')}${svgDot(157,114,'us','3')}${svgArrow(218,84,266,50,marker)}${svgLabel(153,42,'Inside closed')}${svgLabel(263,73,'Show out')}`
      : `${svgZone(137,55,42,70,true)}${svgDot(214,90,'them','B')}${svgBall(206,93)}${svgDot(154,52,'us','1')}${svgDot(154,132,'us','2')}${svgArrow(204,90,116,90,marker)}${svgLabel(154,42,'Centre open')}`;
    case 'connected': return good
      ? `${svgDot(218,90,'them','B')}${svgBall(210,93)}${svgDot(174,90,'us','P')}${svgDot(142,66,'support','C')}${svgDot(142,114,'support','C')}${svgArrow(184,90,204,90,marker)}${svgArrow(146,68,164,82,marker,true)}${svgArrow(146,112,164,98,marker,true)}${svgLabel(151,42,'Press + cover')}`
      : `${svgDot(218,90,'them','B')}${svgBall(210,93)}${svgDot(174,90,'us','P')}${svgDot(84,52,'support','C')}${svgDot(84,132,'support','C')}${svgArrow(184,90,204,90,marker)}${svgZone(118,56,42,68,true)}${svgLabel(132,46,'Gap behind')}`;
    case 'win-or-inside': return good
      ? `${svgBall(166,90)}${svgDot(144,68,'us','1')}${svgDot(144,112,'us','2')}${svgDot(202,90,'them','B')}${svgDot(90,55,'support','3')}${svgDot(90,125,'support','4')}${svgArrow(148,72,160,84,marker)}${svgArrow(148,108,160,96,marker)}${svgArrow(96,57,125,78,marker,true)}${svgArrow(96,123,125,102,marker,true)}${svgLabel(171,48,'Close = hunt')}${svgLabel(100,151,'Far = inside')}`
      : `${svgBall(194,90)}${svgDot(150,90,'them','B')}${svgDot(120,48,'us','1')}${svgDot(96,72,'us','2')}${svgDot(78,116,'support','3')}${svgArrow(116,52,184,84,marker)}${svgArrow(92,75,184,87,marker)}${svgArrow(82,112,184,94,marker)}${svgZone(106,88,48,48,true)}${svgLabel(130,151,'Everyone chases')}`;
    default: return '';
  }
}

function principleDiagram(principle, good = true) {
  const mode = good ? 'good' : 'bad';
  const marker = `gm-vp-${principle.id}-${mode}`;
  return `<svg class="gmConceptDiagram" viewBox="0 0 320 180" role="img" aria-label="${escapeText(`${good ? 'Good' : 'Bad'} picture for ${principle.message}`)}"><defs><marker id="${marker}" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#fbbf24"/></marker></defs><rect x="4" y="4" width="312" height="172" rx="8" fill="#166534" stroke="rgba(255,255,255,.7)" stroke-width="2"/><line x1="160" y1="4" x2="160" y2="176" stroke="rgba(255,255,255,.42)"/><circle cx="160" cy="90" r="25" fill="none" stroke="rgba(255,255,255,.35)"/>${sceneFor(principle.id,good,marker)}</svg>`;
}

function hasDiagram(practice = {}) {
  if (Array.isArray(practice.diagram) && practice.diagram.length) return true;
  return Array.isArray(practice.diagramSteps) && practice.diagramSteps.some(step => Array.isArray(step?.diagram) && step.diagram.length);
}

function previewData(practice = {}) {
  try { if (window.CoachingOSDiagramPreview?.previewDataForPractice) return window.CoachingOSDiagramPreview.previewDataForPractice(practice); } catch (_) {}
  const first = Array.isArray(practice.diagramSteps) ? practice.diagramSteps.find(step => Array.isArray(step?.diagram) && step.diagram.length) : null;
  return first ? { diagram:first.diagram, pitchMode:first.pitchMode || practice.pitchMode || 'full' } : { diagram:practice.diagram || [], pitchMode:practice.pitchMode || 'full' };
}

function practiceLinks(principle) {
  const practices = linkedPracticesForPrinciple(appDb()?.practices || [], principle.id, 4);
  if (!practices.length) return '<div class="gmPracticeEmpty">No strong practice matches yet. As your library grows, genuine matches will appear here automatically.</div>';
  return `<div class="gmLinkedPracticeGrid">${practices.map((practice,index) => {
    const id = String(practice.id || '');
    const hostId = `gm-vp-practice-${principle.id}-${index}`;
    return `<article class="gmLinkedPractice"><div ${hasDiagram(practice) ? `class="gmPracticePreview" id="${hostId}" data-gm-preview="${escapeText(id)}"` : 'class="gmPracticeNoDiagram"'}>${hasDiagram(practice) ? '' : 'Useful match · no saved diagram yet'}</div><div class="gmLinkedPracticeText"><strong>${escapeText(practice.name || id || 'Practice')}</strong><span>${escapeText([practice.stage,practice.theme].filter(Boolean).join(' · '))}</span><button type="button" data-gm-open-practice="${escapeText(id)}">Open practice</button></div></article>`;
  }).join('')}</div>`;
}

function visualPrincipleCard(principle) {
  return `<article class="gmPrincipleCard" id="gameModelPrinciple-${escapeText(principle.id)}"><div class="gmPrincipleTop"><div class="gmPrincipleNum">${principle.number}</div><div><div class="gmPrincipleTitle">${escapeText(principle.title)} · ${escapeText(principle.principle)}</div><div class="gmPrincipleMessage">${escapeText(principle.message)}</div></div></div><div class="gmVisualBody"><div class="gmPictureCompare"><div class="gmPicturePanel good"><div class="gmPictureLabel"><span>Good picture</span><span>✓</span></div>${principleDiagram(principle,true)}<div class="gmPictureExplain">${escapeText(principle.good)}</div></div><div class="gmPicturePanel bad"><div class="gmPictureLabel"><span>Bad picture</span><span>×</span></div>${principleDiagram(principle,false)}<div class="gmPictureExplain">${escapeText(principle.bad)}</div></div></div><div><div class="gmPrincipleRows"><div class="gmPrincipleRow"><b>What it means</b><span>${escapeText(principle.meaning)}</span></div><div class="gmPrincipleRow"><b>Why</b><span>${escapeText(principle.why)}</span></div><div class="gmPrincipleRow full"><b>Picture to recognise</b><span>${escapeText(principle.picture)}</span></div></div><div class="gmPrincipleQuestions">${principle.questions.map(question => `<span>${escapeText(question)}</span>`).join('')}</div><div class="gmThemeLine">Useful contexts: ${escapeText(principle.themes.join(' · '))}</div></div></div><div class="gmPracticeLinks"><div class="gmPracticeLinksHead"><b>Practices that can teach this</b><span>Suggested from your library</span></div>${practiceLinks(principle)}</div></article>`;
}

function renderPracticeDiagrams() {
  document.querySelectorAll('[data-gm-preview]').forEach(host => {
    if (host.dataset.rendered === '1') return;
    const practice = appDb()?.practices?.find(item => String(item.id) === String(host.dataset.gmPreview));
    if (!practice) return;
    const data = previewData(practice);
    if (!data.diagram?.length) return;
    host.dataset.rendered = '1';
    requestAnimationFrame(() => {
      try {
        const renderer = typeof drawMini === 'function' ? drawMini : window.drawMini;
        if (typeof renderer === 'function') renderer(host.id,data.diagram,data.pitchMode);
      } catch (_) { host.dataset.rendered = '0'; }
    });
  });
}

function enhanceGameModelView() {
  const view = document.getElementById('gameModel');
  if (!view) return;
  const section = [...view.querySelectorAll('.gmOsSection')].find(item => /seven messages|see the picture/i.test(item.querySelector('h3')?.textContent || ''));
  const grid = section?.querySelector('.gmPrincipleGrid');
  if (!section || !grid) return;
  const head = section.querySelector('.gmOsSectionHead');
  if (head) {
    const h3 = head.querySelector('h3');
    const span = head.querySelector('span');
    if (h3) h3.textContent = 'See the picture';
    if (span) span.textContent = 'Filter by game moment. Compare the picture we want with the one we want to avoid.';
  }
  let tabs = document.getElementById(TABS_ID);
  if (!tabs) {
    tabs = document.createElement('div');
    tabs.id = TABS_ID;
    grid.insertAdjacentElement('beforebegin',tabs);
  }
  const tabData = [{id:'all',label:'All principles'},...GAME_MOMENTS.map(item => ({id:item.id,label:item.label}))];
  tabs.innerHTML = tabData.map(item => `<button type="button" class="gmVisualMomentTab${activeMoment === item.id ? ' active' : ''}" data-gm-moment="${escapeText(item.id)}">${escapeText(item.label)}</button>`).join('');
  const principles = activeMoment === 'all' ? GAME_MODEL_PRINCIPLES : GAME_MODEL_PRINCIPLES.filter(item => item.moments.includes(activeMoment));
  grid.innerHTML = principles.length ? principles.map(visualPrincipleCard).join('') : `<div class="gmVisualEmpty">This game moment can still contain valuable technical, physical or restart work without forcing one of the seven core principles onto it.</div>`;
  renderPracticeDiagrams();
}

function ensureSuccessField() {
  const panel = document.getElementById('gameModelImplementationPlan');
  const grid = panel?.querySelector('.gmPlanGrid');
  if (!grid || document.getElementById(SUCCESS_ID)) return;
  const playerProblem = document.getElementById('gmPlayerProblem')?.closest('div');
  const wrapper = document.createElement('div');
  wrapper.className = 'full';
  wrapper.innerHTML = `<label for="${SUCCESS_ID}">SUCCESS LOOKS LIKE</label><textarea id="${SUCCESS_ID}" placeholder="What observable behaviour will tell us the picture is transferring today?"></textarea>`;
  if (playerProblem) playerProblem.insertAdjacentElement('afterend',wrapper); else grid.prepend(wrapper);
  const standard = panel.querySelector('.gmStandardLine');
  const banner = document.createElement('div');
  banner.id = SUCCESS_BANNER_ID;
  if (standard) standard.insertAdjacentElement('afterend',banner); else panel.appendChild(banner);
  document.getElementById(SUCCESS_ID)?.addEventListener('input',updateSuccessUi);
  document.getElementById('gmPrimaryPrinciple')?.addEventListener('change',updateSuccessUi);
  updateSuccessUi();
}

function successValue() { return String(document.getElementById(SUCCESS_ID)?.value || '').trim(); }

function setSuccessValue(value = '') {
  ensureSuccessField();
  const target = document.getElementById(SUCCESS_ID);
  if (target) target.value = String(value || '');
  updateSuccessUi();
}

function updateSuccessUi() {
  const target = document.getElementById(SUCCESS_ID);
  const primary = principleById(document.getElementById('gmPrimaryPrinciple')?.value || '');
  if (target && !target.value.trim()) target.placeholder = primary ? `e.g. ${primary.good}` : 'What observable behaviour will tell us the picture is transferring today?';
  const banner = document.getElementById(SUCCESS_BANNER_ID);
  if (banner) {
    const value = successValue();
    banner.classList.toggle('show',!!value);
    banner.innerHTML = value ? `<b>Success looks like</b>${escapeText(value)}` : '';
  }
}

function installSuccessPersistence() {
  if (installedPersistence) return;
  installedPersistence = true;
  let originalPlanner;
  try { originalPlanner = currentPlannerSession; } catch (_) { originalPlanner = window.currentPlannerSession; }
  if (typeof originalPlanner === 'function' && !originalPlanner.__gameModelVisualSuccess) {
    const wrapped = function(...args) {
      const session = originalPlanner.apply(this,args) || {};
      session.gameModelPlan = normaliseGameModelPlan({ ...(session.gameModelPlan || {}), successLooksLike:successValue() });
      return session;
    };
    wrapped.__gameModelVisualSuccess = true;
    try { currentPlannerSession = wrapped; } catch (_) {}
    window.currentPlannerSession = wrapped;
  }

  let originalLoad;
  try { originalLoad = loadSessionToPlanner; } catch (_) { originalLoad = window.loadSessionToPlanner; }
  if (typeof originalLoad === 'function' && !originalLoad.__gameModelVisualSuccess) {
    const wrapped = function(index,...rest) {
      const session = appDb()?.sessions?.[index];
      const result = originalLoad.call(this,index,...rest);
      setTimeout(() => setSuccessValue(session?.gameModelPlan?.successLooksLike || ''),0);
      return result;
    };
    wrapped.__gameModelVisualSuccess = true;
    try { loadSessionToPlanner = wrapped; } catch (_) {}
    window.loadSessionToPlanner = wrapped;
  }

  let originalReset;
  try { originalReset = resetSessionPlanner; } catch (_) { originalReset = window.resetSessionPlanner; }
  if (typeof originalReset === 'function' && !originalReset.__gameModelVisualSuccess) {
    const wrapped = function(...args) { const result = originalReset.apply(this,args); setSuccessValue(''); return result; };
    wrapped.__gameModelVisualSuccess = true;
    try { resetSessionPlanner = wrapped; } catch (_) {}
    window.resetSessionPlanner = wrapped;
  }

  let originalDraft;
  try { originalDraft = applyDraftDetails; } catch (_) { originalDraft = window.applyDraftDetails; }
  if (typeof originalDraft === 'function' && !originalDraft.__gameModelVisualSuccess) {
    const wrapped = function(...args) { const result = originalDraft.apply(this,args); setSuccessValue(''); return result; };
    wrapped.__gameModelVisualSuccess = true;
    try { applyDraftDetails = wrapped; } catch (_) {}
    window.applyDraftDetails = wrapped;
  }

  let originalSaveBlueprint;
  try { originalSaveBlueprint = saveCurrentAsBlueprint; } catch (_) { originalSaveBlueprint = window.saveCurrentAsBlueprint; }
  if (typeof originalSaveBlueprint === 'function' && !originalSaveBlueprint.__gameModelVisualSuccess) {
    const wrapped = function(...args) {
      const data = appDb();
      const before = data?.sessionTemplates?.length || 0;
      const result = originalSaveBlueprint.apply(this,args);
      const after = data?.sessionTemplates?.length || 0;
      if (after > before && data.sessionTemplates[after - 1]) {
        data.sessionTemplates[after - 1].gameModelPlan = normaliseGameModelPlan({ ...(data.sessionTemplates[after - 1].gameModelPlan || {}), successLooksLike:successValue() });
        try { if (typeof store === 'function') store(); } catch (_) {}
      }
      return result;
    };
    wrapped.__gameModelVisualSuccess = true;
    try { saveCurrentAsBlueprint = wrapped; } catch (_) {}
    window.saveCurrentAsBlueprint = wrapped;
  }

  let originalUseBlueprint;
  try { originalUseBlueprint = useBlueprint; } catch (_) { originalUseBlueprint = window.useBlueprint; }
  if (typeof originalUseBlueprint === 'function' && !originalUseBlueprint.__gameModelVisualSuccess) {
    const wrapped = function(index,...rest) {
      const template = appDb()?.sessionTemplates?.[index];
      const result = originalUseBlueprint.call(this,index,...rest);
      setTimeout(() => setSuccessValue(template?.gameModelPlan?.successLooksLike || ''),0);
      return result;
    };
    wrapped.__gameModelVisualSuccess = true;
    try { useBlueprint = wrapped; } catch (_) {}
    window.useBlueprint = wrapped;
  }

  let originalGrass;
  try { originalGrass = openGrassView; } catch (_) { originalGrass = window.openGrassView; }
  if (typeof originalGrass === 'function' && !originalGrass.__gameModelVisualSuccess) {
    const wrapped = function(index,...rest) {
      const result = originalGrass.call(this,index,...rest);
      setTimeout(() => decorateSidelineSuccess(index),0);
      setTimeout(() => decorateSidelineSuccess(index),80);
      return result;
    };
    wrapped.__gameModelVisualSuccess = true;
    try { openGrassView = wrapped; } catch (_) {}
    window.openGrassView = wrapped;
  }
}

function decorateSidelineSuccess(index) {
  const content = document.getElementById('grassContent');
  if (!content) return;
  const session = appDb()?.sessions?.[Number(index)];
  const success = String(session?.gameModelPlan?.successLooksLike || '').trim();
  let block = document.getElementById(SIDELINE_SUCCESS_ID);
  if (!success) { block?.remove(); return; }
  if (!block) {
    block = document.createElement('section');
    block.id = SIDELINE_SUCCESS_ID;
    const clarity = document.getElementById('gameModelSidelineClarity');
    if (clarity) clarity.insertAdjacentElement('afterend',block); else content.prepend(block);
  }
  block.innerHTML = `<b>Success looks like</b><span>${escapeText(success)}</span>`;
}

function openPractice(event,id) {
  try {
    if (typeof window.editPracticeFromList === 'function') return window.editPracticeFromList(event,id);
    if (typeof window.editPractice === 'function') {
      window.editPractice(String(id));
      setTimeout(() => window.dsOpenPracticeStudio?.(),0);
    }
  } catch (_) {}
}

function ensureAll() {
  ensureSuccessField();
  enhanceGameModelView();
  updateSuccessUi();
}

function install() {
  addStyles();
  ensureAll();
  installSuccessPersistence();
  setTimeout(ensureAll,150);
  setTimeout(ensureAll,550);
  setTimeout(ensureAll,1400);
  document.addEventListener('click',event => {
    const moment = event.target.closest?.('[data-gm-moment]');
    if (moment && moment.closest('#gameModel')) {
      activeMoment = moment.dataset.gmMoment || 'all';
      enhanceGameModelView();
      return;
    }
    const practice = event.target.closest?.('[data-gm-open-practice]');
    if (practice && practice.closest('#gameModel')) {
      openPractice(event,practice.dataset.gmOpenPractice || '');
      return;
    }
    if (event.target.closest?.('[data-tab="gameModel"],#gmOpenGameModelBtn,[data-tab="planner"],button[onclick*="showBuildRoute"],button[onclick*="loadSessionToPlanner"]')) setTimeout(ensureAll,0);
  },true);
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
}
