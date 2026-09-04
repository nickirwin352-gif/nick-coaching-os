import { GAME_MODEL_PRINCIPLES, principleById, LEARNING_EMPHASES } from './game-model-core.js';
import {
  GAME_CONTEXTS,
  PRACTICE_PURPOSES_V3,
  PRACTICE_FORMATS,
  inferGameContext,
  inferPurposeV3,
  inferFormatV3,
  practiceArchitecture
} from './game-context-practice-system-v3.js';

export const AUTO_ORGANISATION_VERSION = 4;

const KNOWN_EVIDENCE_OVERRIDES = Object.freeze({
  'A-BU1': { primary:'move-free', supports:['break-open'] },
  'A-DT1': { primary:'connected', supports:['win-or-inside'] },
  'A-HP1': { primary:'protect-inside', supports:['connected'] },
  'A-PA2': { primary:'arrive', supports:[] },
  'A-PA14': { primary:'arrive', supports:[] },
  'A-PA16': { primary:'move-free', supports:[] },
  'CG-BU3': { primary:'move-free', supports:['break-open'] },
  'CG-BU4': { primary:'arrive', supports:['move-free','break-open'] },
  'CG-CC1': { primary:'behind-beneath', supports:['arrive','break-open'] },
  'SP-AT2': { primary:'break-open', supports:['behind-beneath'] },
  'SP-AT6': { primary:'behind-beneath', supports:['break-open'] },
  'SP-AT8': { primary:'behind-beneath', supports:['break-open'] },
  'SP-BU4': { primary:'arrive', supports:['move-free','break-open'] },
  'SP-CP3': { primary:'win-or-inside', supports:['connected'] },
  'SP-DT3': { primary:'win-or-inside', supports:['connected'] },
  'SP-FI1': { primary:'behind-beneath', supports:['arrive'] },
  'SP-FI2': { primary:'behind-beneath', supports:['arrive'] },
  'SP-FI3': { primary:'behind-beneath', supports:['arrive'] },
  'SP-FI4': { primary:'behind-beneath', supports:['arrive'] },
  'SP-MP3': { primary:'move-free', supports:['arrive','behind-beneath'] },
  'TP-BU2': { primary:'move-free', supports:['break-open'] },
  'TP-BU3': { primary:'move-free', supports:['break-open'] },
  'TP-CC1': { primary:'arrive', supports:['behind-beneath'] },
  'TP-DT1': { primary:'win-or-inside', supports:['connected'] },
  'TP-DT2': { primary:'connected', supports:['win-or-inside'] },
  'TP-HP2': { primary:'protect-inside', supports:['connected'] },
  'TP-MB1': { primary:'protect-inside', supports:['connected'] },
  'TP-WO6': { primary:'arrive', supports:['move-free'] }
});

const PRINCIPLE_EVIDENCE = Object.freeze({
  'move-free': Object.freeze([
    ['free player',8],['spare player',8],['attract pressure',8],['space left',7],
    ['create overload',6],['overload',4],['third man',4],['create angles',3],['switch play',2]
  ]),
  'behind-beneath': Object.freeze([
    ['support underneath',9],['underneath and beyond',9],['run in behind',8],['runs in behind',8],
    ['in behind',6],['last line',7],['depth',4],['beyond',3],['supporting run',4],['high line',2]
  ]),
  'arrive': Object.freeze([
    ['dip in and out',10],['vacate',9],['timing of arrival',9],['arrive',8],['late midfield',8],
    ['late run',7],['timing of run',7],['blindside',6],['box occupation',7],['peel off',5],['different lines',5]
  ]),
  'break-open': Object.freeze([
    ['play forward',8],['break lines',9],['breaking lines',9],['first pass forward',9],['eliminate',9],
    ['through ball',7],['attack with pace',7],['split',5],['drive',4],['progress',4],['penetrate',6]
  ]),
  'protect-inside': Object.freeze([
    ['protect centre',10],['protect center',10],['force out wide',10],['force wide',9],
    ['inside first',10],['central route',8],['compact middle',8],['show outside',7],['show wide',7],['screen',4]
  ]),
  'connected': Object.freeze([
    ['press as a group',10],['press as a unit',10],['press together',10],['stay connected',10],
    ['pressure cover',9],['cover and balance',9],['cover',5],['balance',5],['stay compact',7],
    ['squeeze',6],['collective',5],['communicate',3]
  ]),
  'win-or-inside': Object.freeze([
    ['recover inside',11],['recover compact',10],['counter press',10],['counterpress',10],
    ['react after loss',10],['after loss',8],['regain',8],['defensive transition',6],
    ['transition mentality',7],['recover',4]
  ])
});

const LIBRARY_ID = 'practiceMultiFilterLibraryV4';
const FINDER_ID = 'practiceMultiFilterFinderV4';
const SESSION_LIBRARY_ID = 'sessionMultiFilterLibraryV4';
const STYLE_ID = 'practiceAutoOrganiserV4Styles';

const libraryFilters = { contexts:new Set(), principles:new Set(), purposes:new Set(), formats:new Set(), search:'', reviewOnly:false };
const finderFilters = { contexts:new Set(), principles:new Set(), purposes:new Set(), formats:new Set(), search:'' };
const sessionFilters = { contexts:new Set(), principles:new Set(), emphases:new Set(), search:'' };
let finderSeedContext = '';
let finderSeedPrinciple = '';
let migrationBusy = false;
let editPracticeWrapped = false;

function appDb() {
  try { return typeof db !== 'undefined' ? db : window.db; }
  catch (_) { return window.db; }
}

function field(id) { return document.getElementById(id); }
function esc(value) {
  try { if (typeof escapeHtml === 'function') return escapeHtml(String(value ?? '')); } catch (_) {}
  return String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}
function contextById(id='') { return GAME_CONTEXTS.find(item => item.id === String(id || '')) || null; }
function purposeById(id='') { return PRACTICE_PURPOSES_V3.find(item => item.id === String(id || '')) || null; }
function formatById(id='') { return PRACTICE_FORMATS.find(item => item.id === String(id || '')) || null; }

function practiceText(practice={}) {
  return [
    practice.id, practice.name, practice.theme, practice.stage, practice.desc, practice.description,
    practice.cp, practice.coachingPoints, practice.prog, practice.progressions, practice.reg,
    practice.regressions, practice.rules, practice.condRules, practice.objective, practice.cues
  ].filter(Boolean).join(' ').toLowerCase();
}

export function inferFormatV4(practice={}) {
  if (formatById(practice.practiceFormat)) return practice.practiceFormat;
  const text = practiceText(practice);
  const name = String(practice.name || '').toLowerCase();
  const theme = String(practice.theme || '').toLowerCase();
  const stage = String(practice.stage || '').toLowerCase();
  if (theme.includes('set play')) return 'set-play';
  if (theme.includes('fitness') || /conditioning|aerobic|anaerobic|speed endurance|repeat sprint|yoyo/.test(text)) return 'physical';
  if (/wave|repeated attack|transition wave/.test(text)) return 'wave';
  if (/phase of play|phase play/.test(text)) return 'phase-play';
  if (/rondo/.test(name) || /\brondo\b/.test(text)) return 'rondo';
  if (/small sided|small-sided|\bssg\b/.test(text)) return 'small-sided-game';
  if (stage.includes('conditioned')) return 'conditioned-game';
  if (/directional possession|directional|end zone|target player|mini goals|four goals|4 goals/.test(text)) return 'directional-possession';
  if (/possession box|positional possession|keep ball/.test(text)) return 'possession-box';
  if (/4v4\+2|4v4\+3|4v4\+4|5v5\+2|6v6\+2/.test(name) && /possession|neutral|wall player|free player|dip in and out|keep/.test(text)) return 'possession-box';
  if (theme.includes('finishing') || /finishing|finish|shoot|strike/.test(name)) return 'finishing';
  if (theme.includes('1v1') || theme.includes('duel') || /\b1v1\b|duel/.test(name)) return 'duel';
  if (/pattern|rehearsal|rotation|unopposed/.test(text)) return 'pattern';
  if (/unit work|unit practice|back four|front three|midfield unit/.test(text)) return 'unit-practice';
  if (stage.includes('activation')) return 'passing-activation';
  if (stage.includes('tactical')) return 'opposed-tactical';
  if (stage.includes('skill')) return 'skill-practice';
  return inferFormatV3(practice) || 'other';
}

function principleEvidenceScores(practice={}) {
  const text = practiceText(practice);
  const scores = GAME_MODEL_PRINCIPLES.map(principle => {
    let score = 0;
    for (const [phrase,weight] of PRINCIPLE_EVIDENCE[principle.id] || []) {
      if (text.includes(phrase)) score += weight;
    }
    if ((principle.themes || []).some(theme => String(practice.theme || '').toLowerCase() === String(theme).toLowerCase())) score += 1;
    return { id:principle.id, score };
  });
  return scores.sort((a,b) => b.score - a.score || (principleById(a.id)?.number || 99) - (principleById(b.id)?.number || 99));
}

export function principleMatchForPractice(practice={}) {
  const override = KNOWN_EVIDENCE_OVERRIDES[String(practice.id || '')];
  if (override) return { primary:override.primary, supports:[...override.supports], suggestions:[], confidence:'high', source:'evidence-override' };

  const ranked = principleEvidenceScores(practice);
  const top = ranked[0] || { id:'',score:0 };
  const second = ranked[1] || { id:'',score:0 };
  if (top.score >= 9 && top.score - second.score >= 2) {
    const supports = ranked.slice(1,4).filter(item => item.score >= 7 && item.score <= top.score).map(item => item.id);
    return { primary:top.id, supports, suggestions:[], confidence:'high', source:'evidence-rule' };
  }
  if (top.score >= 7 && top.score - second.score >= 3) {
    return { primary:top.id, supports:[], suggestions:[], confidence:'medium', source:'evidence-rule' };
  }
  const suggestions = ranked.filter(item => item.score >= 5).slice(0,3).map(item => item.id);
  return { primary:'', supports:[], suggestions, confidence:suggestions.length ? 'review' : 'none', source:'evidence-rule' };
}

export function inferPurposeV4(practice={}) {
  if (purposeById(practice.practicePurpose)) return practice.practicePurpose;
  const stage = String(practice.stage || '').toLowerCase();
  const theme = String(practice.theme || '').toLowerCase();
  const format = inferFormatV4(practice);
  if (stage.includes('activation')) return 'prepare';
  if (format === 'physical') return 'prepare';
  if (stage.includes('conditioned') || format === 'conditioned-game' || format === 'small-sided-game') return 'transfer';
  if (stage.includes('tactical') || format === 'phase-play' || format === 'opposed-tactical') return 'recognise';
  if (['possession-box','directional-possession','rondo','wave'].includes(format)) {
    const match = principleMatchForPractice(practice);
    return match.primary || match.suggestions.length ? 'recognise' : 'execute';
  }
  if (theme.includes('finishing') || theme.includes('1v1') || theme.includes('duel')) return 'execute';
  if (stage.includes('skill')) return 'execute';
  return inferPurposeV3(practice) || 'execute';
}

function existingPrinciples(practice={}) {
  const ids = [practice.primaryGameModelPrinciple, ...(Array.isArray(practice.gameModelPrinciples) ? practice.gameModelPrinciples : [])]
    .map(id => principleById(id)?.id).filter(Boolean);
  return [...new Set(ids)];
}

export function autoOrganisePractice(practice={}, { force=false }={}) {
  const hadExplicit = !!(
    contextById(practice.gameContext) ||
    purposeById(practice.practicePurpose) ||
    formatById(practice.practiceFormat) ||
    existingPrinciples(practice).length
  );
  let changed = false;

  if (force || !contextById(practice.gameContext)) {
    const next = inferGameContext(practice) || 'player-development';
    if (practice.gameContext !== next) { practice.gameContext = next; changed = true; }
  }
  if (force || !purposeById(practice.practicePurpose)) {
    const next = inferPurposeV4(practice);
    if (practice.practicePurpose !== next) { practice.practicePurpose = next; changed = true; }
  }
  if (force || !formatById(practice.practiceFormat)) {
    const next = inferFormatV4(practice);
    if (practice.practiceFormat !== next) { practice.practiceFormat = next; changed = true; }
  }

  const currentIds = existingPrinciples(practice);
  if (force || !currentIds.length) {
    const match = principleMatchForPractice(practice);
    if (match.primary) {
      const ids = [...new Set([match.primary,...match.supports].filter(Boolean))];
      if (practice.primaryGameModelPrinciple !== match.primary) { practice.primaryGameModelPrinciple = match.primary; changed = true; }
      if (JSON.stringify(practice.gameModelPrinciples || []) !== JSON.stringify(ids)) { practice.gameModelPrinciples = ids; changed = true; }
      practice.suggestedGameModelPrinciples = [];
      practice.organisationConfidence = match.confidence;
      practice.organisationNeedsReview = match.confidence === 'medium';
    } else {
      practice.suggestedGameModelPrinciples = match.suggestions;
      practice.organisationConfidence = match.confidence;
      practice.organisationNeedsReview = !!match.suggestions.length || inferFormatV4(practice) === 'other';
    }
  } else {
    practice.organisationConfidence = practice.organisationConfidence || 'manual';
    practice.organisationNeedsReview = practice.organisationNeedsReview === true;
  }

  if (!hadExplicit && practice.organisationSource !== 'auto-v4') {
    practice.organisationSource = 'auto-v4';
    changed = true;
  } else if (hadExplicit && !practice.organisationSource) {
    practice.organisationSource = 'manual';
    changed = true;
  }
  if (practice.organisationVersion !== AUTO_ORGANISATION_VERSION) {
    practice.organisationVersion = AUTO_ORGANISATION_VERSION;
    changed = true;
  }
  return changed;
}

async function persistDb() {
  try {
    if (typeof store === 'function') return await store();
    if (typeof window.store === 'function') return await window.store();
  } catch (error) {
    console.warn('Auto-organisation save failed', error);
  }
}

export async function organiseExistingPractices({ force=false }={}) {
  if (migrationBusy) return 0;
  const data = appDb();
  if (!data || !Array.isArray(data.practices) || !data.practices.length) return 0;
  migrationBusy = true;
  let changed = 0;
  try {
    for (const practice of data.practices) if (autoOrganisePractice(practice,{force})) changed += 1;
    if (changed) await persistDb();
    renderPracticeLibraryV4();
    renderFinderV4();
    renderSessionLibraryV4();
    return changed;
  } finally {
    migrationBusy = false;
  }
}

function addStyles() {
  if (field(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    #practiceArchitectureBrowserV3,#gameContextPracticeFinder,#sessionLibraryGameModelToolbar,#sessionLibraryGameModelResults{display:none!important}
    #${LIBRARY_ID},#${FINDER_ID},#${SESSION_LIBRARY_ID}{border:1px solid rgba(56,189,248,.25);background:linear-gradient(145deg,rgba(56,189,248,.045),rgba(52,211,153,.025))}
    .gmV4Hero{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.gmV4Hero h2,.gmV4Hero h3{margin:0}.gmV4Hero p{margin:4px 0 0;max-width:850px;font-size:11px;color:var(--text-dim);line-height:1.45}
    .gmV4FilterBlock{margin-top:10px;padding:9px;border:1px solid var(--border-soft);border-radius:11px;background:rgba(4,13,22,.28)}.gmV4FilterTitle{display:flex;justify-content:space-between;gap:8px;align-items:center;margin-bottom:6px}.gmV4FilterTitle b{font-size:10px;color:#dbeafe;text-transform:uppercase;letter-spacing:.06em}.gmV4FilterTitle span{font-size:9px;color:var(--text-faint)}
    .gmV4Chips{display:flex;flex-wrap:wrap;gap:5px}.gmV4Chip{padding:5px 7px;font-size:9px;border-radius:999px}.gmV4Chip.on{background:var(--turf);border-color:var(--turf);color:#04160f}.gmV4Chip.seed{box-shadow:0 0 0 1px rgba(251,191,36,.55) inset}.gmV4Chip.review{border-color:rgba(251,191,36,.35);color:#fde68a}
    .gmV4Controls{display:grid;grid-template-columns:1fr auto auto;gap:7px;align-items:center;margin-top:10px}.gmV4Controls input{min-width:0}.gmV4Selected{display:flex;gap:5px;flex-wrap:wrap;margin-top:8px;min-height:22px}.gmV4Selected span{font-size:8.5px;padding:4px 6px;border-radius:999px;background:rgba(56,189,248,.08);border:1px solid rgba(56,189,248,.2);color:#bae6fd}
    .gmV4Stats{display:flex;justify-content:space-between;gap:8px;align-items:center;margin:10px 0 7px;font-size:10px;color:var(--text-dim)}.gmV4Grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.gmV4Card{border:1px solid var(--border-soft);background:var(--surface-2);border-radius:12px;padding:9px;min-width:0}.gmV4Card.review{border-color:rgba(251,191,36,.28)}.gmV4CardTop{display:flex;justify-content:space-between;gap:6px;align-items:flex-start}.gmV4Card h4{font-size:11px;margin:0;line-height:1.3}.gmV4Badge{font-size:7.8px;padding:3px 5px;border-radius:999px;border:1px solid rgba(255,255,255,.12);white-space:nowrap;color:var(--text-dim)}.gmV4Badge.warn{color:#fde68a;border-color:rgba(251,191,36,.3)}
    .gmV4Meta{font-size:9px;color:var(--text-faint);line-height:1.45;margin-top:4px}.gmV4Tags{display:flex;gap:4px;flex-wrap:wrap;margin-top:6px}.gmV4Tags span{font-size:8px;padding:3px 5px;border-radius:999px;border:1px solid rgba(56,189,248,.2);color:#bae6fd}.gmV4Tags span.primary{color:#a7f3d0;border-color:rgba(52,211,153,.3)}.gmV4Suggestion{margin-top:6px;padding:6px;border-radius:8px;background:rgba(251,191,36,.05);border:1px solid rgba(251,191,36,.18);font-size:8.5px;color:#fde68a;line-height:1.35}.gmV4Suggestion button{padding:3px 5px;font-size:8px;margin:3px 3px 0 0}.gmV4Actions{display:flex;gap:5px;margin-top:7px}.gmV4Actions button{padding:5px 7px;font-size:9px}
    .gmV4FinderGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;margin-top:8px}.gmV4FinderCard{border:1px solid var(--border-soft);border-radius:11px;padding:8px;background:var(--surface-2);display:grid;grid-template-columns:100px 1fr;gap:8px}.gmV4FinderPitch{min-height:78px}.gmV4FinderCard h4{font-size:10.5px;margin:0 0 3px}.gmV4FinderCard button{padding:5px 7px;font-size:9px;margin-top:5px}
    .gmV4EditorReview{margin-top:7px;padding:7px 8px;border:1px solid rgba(251,191,36,.2);border-radius:9px;background:rgba(251,191,36,.045);font-size:9px;color:#fde68a;line-height:1.4}.gmV4EditorReview button{padding:4px 6px;font-size:8.5px;margin:4px 4px 0 0}
    .gmV4SessionGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.gmV4SessionCard{border:1px solid var(--border-soft);border-radius:12px;background:var(--surface-2);padding:10px}.gmV4SessionCard h3{margin:3px 0 6px;font-size:14px}.gmV4SessionMeta{display:flex;gap:4px;flex-wrap:wrap}.gmV4SessionProblem{font-size:9.5px;color:var(--text-dim);line-height:1.45;margin-top:7px}.gmV4PurposeMix{display:flex;gap:4px;flex-wrap:wrap;margin-top:6px}.gmV4PurposeMix span{font-size:8px;padding:3px 5px;border-radius:999px;border:1px solid var(--border-soft);color:var(--text-dim)}
    @media(max-width:850px){.gmV4Grid,.gmV4SessionGrid{grid-template-columns:1fr 1fr}.gmV4Controls{grid-template-columns:1fr}.gmV4Hero{display:block}}
    @media(max-width:620px){.gmV4Grid,.gmV4SessionGrid,.gmV4FinderGrid{grid-template-columns:1fr}.gmV4FinderCard{grid-template-columns:92px 1fr}}
  `;
  document.head.appendChild(style);
}

function setToggle(set,value,on) {
  if (on) set.add(value); else set.delete(value);
}

function chipGroupMarkup(kind, items, selected, { labelFn=item=>item.label || item.message }={}) {
  return `<div class="gmV4Chips">${items.map(item => {
    const value = item.id;
    const on = selected.has(value);
    return `<button type="button" class="gmV4Chip${on?' on':''}" data-v4-filter-kind="${kind}" data-v4-filter-value="${esc(value)}">${esc(labelFn(item))}</button>`;
  }).join('')}</div>`;
}

function selectedSummaryMarkup(filters) {
  const values = [];
  filters.contexts?.forEach(id => values.push(contextById(id)?.label || id));
  filters.principles?.forEach(id => values.push(principleById(id)?.message || id));
  filters.purposes?.forEach(id => values.push(purposeById(id)?.label || id));
  filters.formats?.forEach(id => values.push(formatById(id)?.label || id));
  filters.emphases?.forEach(id => values.push(LEARNING_EMPHASES.find(item=>item.id===id)?.label || id));
  if (filters.reviewOnly) values.push('Needs review');
  return values.length ? values.map(value=>`<span>${esc(value)}</span>`).join('') : '<span>No filters selected · showing everything</span>';
}

function architectureForFilter(practice={}) {
  const a = practiceArchitecture(practice);
  return {
    context:a.gameContext || inferGameContext(practice),
    purpose:purposeById(practice.practicePurpose)?.id || inferPurposeV4(practice),
    format:formatById(practice.practiceFormat)?.id || inferFormatV4(practice),
    primary:principleById(practice.primaryGameModelPrinciple)?.id || a.primaryPrincipleId || '',
    principles:[...new Set([...(a.principleIds || []),...(Array.isArray(practice.gameModelPrinciples)?practice.gameModelPrinciples:[])].map(id=>principleById(id)?.id).filter(Boolean))]
  };
}

function matchMultiFilter(practice,filters) {
  const a = architectureForFilter(practice);
  if (filters.contexts?.size && !filters.contexts.has(a.context)) return false;
  if (filters.purposes?.size && !filters.purposes.has(a.purpose)) return false;
  if (filters.formats?.size && !filters.formats.has(a.format)) return false;
  if (filters.principles?.size && ![...filters.principles].some(id=>a.principles.includes(id))) return false;
  if (filters.reviewOnly && !practice.organisationNeedsReview) return false;
  const q = String(filters.search || '').trim().toLowerCase();
  if (q) {
    const text = [practiceText(practice),contextById(a.context)?.label,purposeById(a.purpose)?.label,formatById(a.format)?.label,...a.principles.map(id=>principleById(id)?.message)].filter(Boolean).join(' ').toLowerCase();
    if (!text.includes(q)) return false;
  }
  return true;
}

function practiceCardMarkup(practice,{finder=false}={}) {
  const a = architectureForFilter(practice);
  const primary = principleById(a.primary);
  const supports = a.principles.filter(id=>id!==a.primary).map(id=>principleById(id)?.message).filter(Boolean);
  const suggestions = (practice.suggestedGameModelPrinciples || []).map(id=>principleById(id)).filter(Boolean);
  const review = !!practice.organisationNeedsReview;
  const confidence = practice.organisationConfidence || 'manual';
  return `<article class="gmV4Card${review?' review':''}" data-v4-practice="${esc(practice.id)}">
    <div class="gmV4CardTop"><h4>${esc(practice.id)} · ${esc(practice.name || 'Unnamed practice')}</h4><span class="gmV4Badge${review?' warn':''}">${review?'Review':'✓ '+esc(confidence)}</span></div>
    <div class="gmV4Meta">${esc(contextById(a.context)?.label || 'Context not set')} · ${esc(purposeById(a.purpose)?.label || 'Purpose not set')}<br>${esc(formatById(a.format)?.label || 'Format not set')}${practice.stage?` · ${esc(practice.stage)}`:''}</div>
    <div class="gmV4Tags">${primary?`<span class="primary">Primary · ${esc(primary.message)}</span>`:''}${supports.map(text=>`<span>${esc(text)}</span>`).join('')}${!primary?'<span>No principle forced</span>':''}</div>
    ${suggestions.length?`<div class="gmV4Suggestion">Possible principle${suggestions.length>1?'s':''}: ${suggestions.map(item=>esc(item.message)).join(' · ')}<br>${suggestions.map(item=>`<button type="button" data-v4-use-suggestion="${esc(item.id)}" data-v4-practice-id="${esc(practice.id)}">Use ${esc(item.message)}</button>`).join('')}</div>`:''}
    ${finder?'':`<div class="gmV4Actions"><button type="button" data-v4-edit-practice="${esc(practice.id)}">Edit tags / practice</button></div>`}
  </article>`;
}

async function useSuggestion(practiceId,principleId) {
  const practice = appDb()?.practices?.find(item=>String(item.id)===String(practiceId));
  const principle = principleById(principleId);
  if (!practice || !principle) return;
  practice.primaryGameModelPrinciple = principle.id;
  practice.gameModelPrinciples = [...new Set([principle.id,...existingPrinciples(practice)])];
  practice.suggestedGameModelPrinciples = [];
  practice.organisationNeedsReview = false;
  practice.organisationConfidence = 'manual';
  practice.organisationSource = 'manual';
  practice.organisationVersion = AUTO_ORGANISATION_VERSION;
  await persistDb();
  renderPracticeLibraryV4();
  renderFinderV4();
}

function renderPracticeLibraryV4() {
  const panel = field(LIBRARY_ID);
  const results = field('practiceMultiFilterResultsV4');
  if (!panel || !results) return;
  const practices = (appDb()?.practices || []).filter(p=>matchMultiFilter(p,libraryFilters));
  const reviewCount = (appDb()?.practices || []).filter(p=>p.organisationNeedsReview).length;
  const shown = practices.slice(0,72);
  field('practiceMultiFilterSelectedV4').innerHTML = selectedSummaryMarkup(libraryFilters);
  field('practiceMultiFilterCountV4').textContent = `${practices.length} match${practices.length===1?'':'es'} · ${reviewCount} need review`;
  results.innerHTML = shown.length ? `<div class="gmV4Grid">${shown.map(p=>practiceCardMarkup(p)).join('')}</div>${practices.length>shown.length?`<div class="small" style="margin-top:8px">Showing first ${shown.length}. Add another filter to narrow the list.</div>`:''}` : '<div class="notice">No practices match that combination. Remove one filter or review the practice tags.</div>';
}

function ensurePracticeLibraryV4() {
  const library = field('library');
  if (!library || field(LIBRARY_ID)) return;
  const panel = document.createElement('section');
  panel.id = LIBRARY_ID;
  panel.className = 'card';
  panel.innerHTML = `<div class="gmV4Hero"><div><h2>Practice Library · Multi-Filter</h2><p>Select several things at once. <b>OR within a row, AND between rows:</b> for example Build Out + “Arrive. Don’t live there.” + Possession Box + Recognise. Auto-matches are already saved; anything uncertain is clearly marked for review.</p></div><span class="pill">Game-model workbench</span></div>
    <div class="gmV4FilterBlock"><div class="gmV4FilterTitle"><b>1 · Game Context</b><span>Where does the football problem live?</span></div>${chipGroupMarkup('library-context',GAME_CONTEXTS,libraryFilters.contexts)}</div>
    <div class="gmV4FilterBlock"><div class="gmV4FilterTitle"><b>2 · Principle</b><span>What football idea are we developing?</span></div>${chipGroupMarkup('library-principle',GAME_MODEL_PRINCIPLES,libraryFilters.principles,{labelFn:item=>item.message})}</div>
    <div class="gmV4FilterBlock"><div class="gmV4FilterTitle"><b>3 · Practice Purpose</b><span>What job is the practice doing?</span></div>${chipGroupMarkup('library-purpose',PRACTICE_PURPOSES_V3,libraryFilters.purposes)}</div>
    <div class="gmV4FilterBlock"><div class="gmV4FilterTitle"><b>4 · Format</b><span>What does the practice physically look like?</span></div>${chipGroupMarkup('library-format',PRACTICE_FORMATS,libraryFilters.formats)}</div>
    <div class="gmV4Controls"><input id="practiceMultiFilterSearchV4" type="search" placeholder="Search name, ID, coaching detail..."><button type="button" class="gmV4Chip review" id="practiceMultiFilterReviewV4">Needs review only</button><button type="button" id="practiceMultiFilterClearV4">Clear filters</button></div>
    <div class="gmV4Selected" id="practiceMultiFilterSelectedV4"></div><div class="gmV4Stats"><b id="practiceMultiFilterCountV4"></b><span>Click any combination · selections stay active together</span></div><div id="practiceMultiFilterResultsV4"></div>`;
  const old = field('practiceArchitectureBrowserV3') || field('practiceArchitectureBrowser');
  if (old) old.insertAdjacentElement('beforebegin',panel); else library.prepend(panel);

  panel.addEventListener('click',event=>{
    const chip = event.target.closest?.('[data-v4-filter-kind]');
    if (chip) {
      const kind = chip.dataset.v4FilterKind;
      const value = chip.dataset.v4FilterValue;
      const map = {'library-context':libraryFilters.contexts,'library-principle':libraryFilters.principles,'library-purpose':libraryFilters.purposes,'library-format':libraryFilters.formats};
      const set = map[kind];
      if (set) setToggle(set,value,!set.has(value));
      chip.classList.toggle('on',set?.has(value));
      renderPracticeLibraryV4();
      return;
    }
    const edit = event.target.closest?.('[data-v4-edit-practice]');
    if (edit) { window.editPractice?.(edit.dataset.v4EditPractice); return; }
    const suggestion = event.target.closest?.('[data-v4-use-suggestion]');
    if (suggestion) { useSuggestion(suggestion.dataset.v4PracticeId,suggestion.dataset.v4UseSuggestion); return; }
  });
  field('practiceMultiFilterSearchV4')?.addEventListener('input',event=>{ libraryFilters.search=event.target.value || ''; renderPracticeLibraryV4(); });
  field('practiceMultiFilterReviewV4')?.addEventListener('click',event=>{ libraryFilters.reviewOnly=!libraryFilters.reviewOnly; event.currentTarget.classList.toggle('on',libraryFilters.reviewOnly); renderPracticeLibraryV4(); });
  field('practiceMultiFilterClearV4')?.addEventListener('click',()=>{
    libraryFilters.contexts.clear(); libraryFilters.principles.clear(); libraryFilters.purposes.clear(); libraryFilters.formats.clear(); libraryFilters.search=''; libraryFilters.reviewOnly=false;
    if (field('practiceMultiFilterSearchV4')) field('practiceMultiFilterSearchV4').value='';
    field('practiceMultiFilterReviewV4')?.classList.remove('on');
    ensureFilterChipVisuals(panel,libraryFilters,'library');
    renderPracticeLibraryV4();
  });
  renderPracticeLibraryV4();
}

function ensureFilterChipVisuals(panel,filters,prefix) {
  const map = {
    [`${prefix}-context`]:filters.contexts,
    [`${prefix}-principle`]:filters.principles,
    [`${prefix}-purpose`]:filters.purposes,
    [`${prefix}-format`]:filters.formats,
    [`${prefix}-emphasis`]:filters.emphases
  };
  panel?.querySelectorAll('[data-v4-filter-kind]').forEach(chip=>chip.classList.toggle('on',map[chip.dataset.v4FilterKind]?.has(chip.dataset.v4FilterValue) || false));
}

function currentSessionContext() { return field('gmGameContext')?.value || ''; }
function currentSessionPrinciple() { return field('gmPrimaryPrinciple')?.value || ''; }

function syncFinderSeeds() {
  const context = currentSessionContext();
  const principle = currentSessionPrinciple();
  if (finderSeedContext && finderSeedContext !== context) finderFilters.contexts.delete(finderSeedContext);
  if (finderSeedPrinciple && finderSeedPrinciple !== principle) finderFilters.principles.delete(finderSeedPrinciple);
  if (context) finderFilters.contexts.add(context);
  if (principleById(principle)) finderFilters.principles.add(principle);
  finderSeedContext = context;
  finderSeedPrinciple = principleById(principle)?.id || '';
}

function practiceInCurrentSession(id) {
  try { return Array.isArray(plannerDrills) && plannerDrills.includes(id); }
  catch (_) { return false; }
}

function finderScore(practice) {
  const a = architectureForFilter(practice);
  let score = 0;
  if (finderSeedContext && a.context===finderSeedContext) score += 8;
  if (finderSeedPrinciple && a.primary===finderSeedPrinciple) score += 12;
  else if (finderSeedPrinciple && a.principles.includes(finderSeedPrinciple)) score += 8;
  if (practice.isFavourite || practice.favourite) score += 2;
  if (practiceInCurrentSession(practice.id)) score += 1;
  if (practice.organisationNeedsReview) score -= 2;
  return score;
}

function finderCardMarkup(practice,index) {
  const a = architectureForFilter(practice);
  const primary = principleById(a.primary);
  const inSession = practiceInCurrentSession(practice.id);
  const pitchId = `gm-v4-finder-${String(practice.id||index).replace(/[^a-zA-Z0-9_-]/g,'-')}-${index}`;
  return `<article class="gmV4FinderCard"><div class="gmV4FinderPitch" id="${pitchId}"></div><div><h4>${esc(practice.id)} · ${esc(practice.name)}</h4><div class="gmV4Meta">${esc(contextById(a.context)?.label || '')} · ${esc(purposeById(a.purpose)?.label || '')}<br>${esc(formatById(a.format)?.label || '')}${primary?` · ${esc(primary.message)}`:''}</div><button type="button" class="${inSession?'':'primary'}" data-v4-toggle-session-practice="${esc(practice.id)}">${inSession?'✓ In session · remove':'＋ Add to session'}</button></div></article>`;
}

function drawFinder(rows) {
  rows.forEach((practice,index)=>{
    const pitchId = `gm-v4-finder-${String(practice.id||index).replace(/[^a-zA-Z0-9_-]/g,'-')}-${index}`;
    setTimeout(()=>{ try { if (typeof drawMini === 'function') drawMini(pitchId,practice.diagram||[],practice.pitchMode||'full'); else window.drawMini?.(pitchId,practice.diagram||[],practice.pitchMode||'full'); } catch (_) {} },0);
  });
}

function renderFinderV4() {
  const panel = field(FINDER_ID);
  const results = field('practiceMultiFilterFinderResultsV4');
  if (!panel || !results) return;
  syncFinderSeeds();
  ensureFilterChipVisuals(panel,finderFilters,'finder');
  panel.querySelectorAll('[data-v4-filter-kind="finder-context"]').forEach(chip=>chip.classList.toggle('seed',chip.dataset.v4FilterValue===finderSeedContext));
  panel.querySelectorAll('[data-v4-filter-kind="finder-principle"]').forEach(chip=>chip.classList.toggle('seed',chip.dataset.v4FilterValue===finderSeedPrinciple));
  const rows = (appDb()?.practices || []).filter(p=>matchMultiFilter(p,finderFilters)).sort((a,b)=>finderScore(b)-finderScore(a) || String(a.name||'').localeCompare(String(b.name||''))).slice(0,30);
  field('practiceMultiFilterFinderSelectedV4').innerHTML = selectedSummaryMarkup(finderFilters);
  field('practiceMultiFilterFinderCountV4').textContent = `${rows.length} best matches shown`;
  results.innerHTML = rows.length ? `<div class="gmV4FinderGrid">${rows.map(finderCardMarkup).join('')}</div>` : '<div class="small" style="margin-top:8px">No practices match that exact combination. Remove one chip or edit practice tags.</div>';
  drawFinder(rows);
}

function ensureFinderV4() {
  const oldFinder = field('gameContextPracticeFinder');
  const card = field('visualPicker')?.closest('.card');
  if (!card || field(FINDER_ID)) return;
  const panel = document.createElement('section');
  panel.id = FINDER_ID;
  panel.innerHTML = `<div class="gmV4Hero"><div><h3>Find practices · combine filters</h3><p>Your session Context and Primary Principle are highlighted as the starting point. Add more contexts, principles, purposes or formats without losing the other selections.</p></div><span class="pill">AND between rows</span></div>
    <div class="gmV4FilterBlock"><div class="gmV4FilterTitle"><b>Context</b><span>Multiple allowed</span></div>${chipGroupMarkup('finder-context',GAME_CONTEXTS,finderFilters.contexts)}</div>
    <div class="gmV4FilterBlock"><div class="gmV4FilterTitle"><b>Principle</b><span>Multiple allowed</span></div>${chipGroupMarkup('finder-principle',GAME_MODEL_PRINCIPLES,finderFilters.principles,{labelFn:item=>item.message})}</div>
    <div class="gmV4FilterBlock"><div class="gmV4FilterTitle"><b>Purpose</b><span>Prepare / Recognise / Execute / Transfer</span></div>${chipGroupMarkup('finder-purpose',PRACTICE_PURPOSES_V3,finderFilters.purposes)}</div>
    <div class="gmV4FilterBlock"><div class="gmV4FilterTitle"><b>Format</b><span>Possession, wave, game, pattern...</span></div>${chipGroupMarkup('finder-format',PRACTICE_FORMATS,finderFilters.formats)}</div>
    <div class="gmV4Controls"><input id="practiceMultiFilterFinderSearchV4" placeholder="Search within this combination..."><button type="button" id="practiceMultiFilterFinderResetV4">Reset to session</button><span></span></div>
    <div class="gmV4Selected" id="practiceMultiFilterFinderSelectedV4"></div><div class="gmV4Stats"><b id="practiceMultiFilterFinderCountV4"></b><span>Gold outline = session default</span></div><div id="practiceMultiFilterFinderResultsV4"></div>`;
  if (oldFinder) oldFinder.insertAdjacentElement('beforebegin',panel);
  else {
    const h2 = [...card.querySelectorAll('h2')].find(h=>h.textContent.includes('Build the Session')) || card.querySelector('h2');
    if (h2) h2.insertAdjacentElement('afterend',panel); else card.prepend(panel);
  }
  panel.addEventListener('click',event=>{
    const chip = event.target.closest?.('[data-v4-filter-kind]');
    if (chip) {
      const map = {'finder-context':finderFilters.contexts,'finder-principle':finderFilters.principles,'finder-purpose':finderFilters.purposes,'finder-format':finderFilters.formats};
      const set = map[chip.dataset.v4FilterKind];
      const value = chip.dataset.v4FilterValue;
      if (set) setToggle(set,value,!set.has(value));
      renderFinderV4();
      return;
    }
    const toggle = event.target.closest?.('[data-v4-toggle-session-practice]');
    if (toggle) { window.togglePracticeInSession?.(toggle.dataset.v4ToggleSessionPractice); setTimeout(renderFinderV4,30); }
  });
  field('practiceMultiFilterFinderSearchV4')?.addEventListener('input',event=>{ finderFilters.search=event.target.value || ''; renderFinderV4(); });
  field('practiceMultiFilterFinderResetV4')?.addEventListener('click',()=>{
    finderFilters.contexts.clear(); finderFilters.principles.clear(); finderFilters.purposes.clear(); finderFilters.formats.clear(); finderFilters.search='';
    if (field('practiceMultiFilterFinderSearchV4')) field('practiceMultiFilterFinderSearchV4').value='';
    finderSeedContext=''; finderSeedPrinciple=''; syncFinderSeeds(); renderFinderV4();
  });
  ['gmGameContext','gmPrimaryPrinciple'].forEach(id=>field(id)?.addEventListener('change',()=>{ syncFinderSeeds(); renderFinderV4(); }));
  renderFinderV4();
}

function practicePurposeMix(session={}) {
  const counts = new Map();
  for (const id of session.drills || []) {
    const practice = appDb()?.practices?.find(p=>String(p.id)===String(id));
    if (!practice) continue;
    const purpose = architectureForFilter(practice).purpose;
    counts.set(purpose,(counts.get(purpose)||0)+1);
  }
  return [...counts.entries()].map(([id,count])=>`${purposeById(id)?.label || id} ${count}`);
}

function sessionMatches(session) {
  const plan = session.gameModelPlan || {};
  const context = plan.gameContext || inferGameContext(session);
  const principles = [plan.primaryPrincipleId,plan.supportingPrincipleId].map(id=>principleById(id)?.id).filter(Boolean);
  if (sessionFilters.contexts.size && !sessionFilters.contexts.has(context)) return false;
  if (sessionFilters.principles.size && ![...sessionFilters.principles].some(id=>principles.includes(id))) return false;
  if (sessionFilters.emphases.size && !sessionFilters.emphases.has(plan.emphasis)) return false;
  const q = sessionFilters.search.trim().toLowerCase();
  if (q) {
    const practiceNames = (session.drills || []).map(id=>appDb()?.practices?.find(p=>p.id===id)?.name || id).join(' ');
    const text = [session.date,session.team,plan.playerProblem,plan.successLooksLike,contextById(context)?.label,...principles.map(id=>principleById(id)?.message),practiceNames].filter(Boolean).join(' ').toLowerCase();
    if (!text.includes(q)) return false;
  }
  return true;
}

function renderSessionLibraryV4() {
  const panel = field(SESSION_LIBRARY_ID);
  const results = field('sessionMultiFilterResultsV4');
  if (!panel || !results) return;
  const sessions = [...(appDb()?.sessions || [])].filter(sessionMatches).sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')));
  field('sessionMultiFilterSelectedV4').innerHTML = selectedSummaryMarkup(sessionFilters);
  field('sessionMultiFilterCountV4').textContent = `${sessions.length} ${sessions.length===1?'session':'sessions'}`;
  results.innerHTML = sessions.length ? `<div class="gmV4SessionGrid">${sessions.map(session=>{
    const index = appDb().sessions.indexOf(session);
    const plan = session.gameModelPlan || {};
    const context = contextById(plan.gameContext || inferGameContext(session));
    const primary = principleById(plan.primaryPrincipleId);
    const emphasis = LEARNING_EMPHASES.find(item=>item.id===plan.emphasis);
    const mix = practicePurposeMix(session);
    return `<article class="gmV4SessionCard"><div class="small">${esc(session.date || 'No date')}${session.team?` · ${esc(session.team)}`:''}</div><h3>${esc(context?.label || session.theme || 'Session')}</h3><div class="gmV4SessionMeta">${primary?`<span class="pill">${esc(primary.message)}</span>`:''}${emphasis?`<span class="pill">${esc(emphasis.label)}</span>`:''}<span class="pill">${(session.drills||[]).length} practices</span></div><div class="gmV4SessionProblem"><b>Player problem:</b> ${esc(plan.playerProblem || 'Legacy session — no player problem saved')}${plan.successLooksLike?`<br><b>Success:</b> ${esc(plan.successLooksLike)}`:''}</div><div class="gmV4PurposeMix">${mix.map(item=>`<span>${esc(item)}</span>`).join('')}</div><div class="gmV4Actions"><button data-v4-session="view" data-index="${index}">View</button><button data-v4-session="diagrams" data-index="${index}">🗺 Diagrams</button><button data-v4-session="edit" data-index="${index}">Edit</button></div></article>`;
  }).join('')}</div>` : '<div class="notice">No saved sessions match that combination.</div>';
}

function ensureSessionLibraryV4() {
  const view = field('sessionsLibraryView');
  const card = view?.querySelector('.card');
  if (!card || field(SESSION_LIBRARY_ID)) return;
  const panel = document.createElement('section');
  panel.id = SESSION_LIBRARY_ID;
  panel.className = 'card';
  panel.innerHTML = `<div class="gmV4Hero"><div><h2>Saved Sessions · Multi-Filter</h2><p>Find sessions by several layers at once: Context + Principle + Learning Emphasis, then see the mix of Prepare / Recognise / Execute / Transfer practices inside each session.</p></div><span class="pill">Session library</span></div>
    <div class="gmV4FilterBlock"><div class="gmV4FilterTitle"><b>Game Context</b><span>Multiple allowed</span></div>${chipGroupMarkup('session-context',GAME_CONTEXTS,sessionFilters.contexts)}</div>
    <div class="gmV4FilterBlock"><div class="gmV4FilterTitle"><b>Principle</b><span>Primary or supporting</span></div>${chipGroupMarkup('session-principle',GAME_MODEL_PRINCIPLES,sessionFilters.principles,{labelFn:item=>item.message})}</div>
    <div class="gmV4FilterBlock"><div class="gmV4FilterTitle"><b>Learning Emphasis</b><span>Understand / Recognise / Execute / Adapt</span></div>${chipGroupMarkup('session-emphasis',LEARNING_EMPHASES,sessionFilters.emphases)}</div>
    <div class="gmV4Controls"><input id="sessionMultiFilterSearchV4" type="search" placeholder="Search player problem, practice, team..."><button type="button" id="sessionMultiFilterClearV4">Clear filters</button><span></span></div>
    <div class="gmV4Selected" id="sessionMultiFilterSelectedV4"></div><div class="gmV4Stats"><b id="sessionMultiFilterCountV4"></b><span>Selections stay active together</span></div><div id="sessionMultiFilterResultsV4"></div>`;
  card.insertAdjacentElement('afterend',panel);
  panel.addEventListener('click',event=>{
    const chip = event.target.closest?.('[data-v4-filter-kind]');
    if (chip) {
      const map = {'session-context':sessionFilters.contexts,'session-principle':sessionFilters.principles,'session-emphasis':sessionFilters.emphases};
      const set = map[chip.dataset.v4FilterKind];
      const value = chip.dataset.v4FilterValue;
      if (set) setToggle(set,value,!set.has(value));
      renderSessionLibraryV4();
      return;
    }
    const action = event.target.closest?.('[data-v4-session]');
    if (action) {
      const index = Number(action.dataset.index);
      if (action.dataset.v4Session==='view') window.openSessionDetail?.(index);
      if (action.dataset.v4Session==='diagrams') window.openAllSessionDiagrams?.(index);
      if (action.dataset.v4Session==='edit') window.loadSessionToPlanner?.(index);
    }
  });
  field('sessionMultiFilterSearchV4')?.addEventListener('input',event=>{ sessionFilters.search=event.target.value || ''; renderSessionLibraryV4(); });
  field('sessionMultiFilterClearV4')?.addEventListener('click',()=>{
    sessionFilters.contexts.clear(); sessionFilters.principles.clear(); sessionFilters.emphases.clear(); sessionFilters.search='';
    if (field('sessionMultiFilterSearchV4')) field('sessionMultiFilterSearchV4').value='';
    ensureFilterChipVisuals(panel,sessionFilters,'session'); renderSessionLibraryV4();
  });
  renderSessionLibraryV4();
}

function renderEditorReviewHint(practice={}) {
  const panel = field('practiceArchitectureEditorPanelV3');
  if (!panel) return;
  panel.querySelector('.gmV4EditorReview')?.remove();
  const box = document.createElement('div');
  box.className = 'gmV4EditorReview';
  const suggestions = (practice.suggestedGameModelPrinciples || []).map(id=>principleById(id)).filter(Boolean);
  if (practice.organisationNeedsReview) {
    box.innerHTML = `<b>Auto-match needs your eye.</b> Context / Purpose / Format have been saved, but the principle was not forced.${suggestions.length?` Suggested: ${suggestions.map(item=>esc(item.message)).join(' · ')}<br>${suggestions.map(item=>`<button type="button" data-v4-editor-suggestion="${item.id}">Use ${esc(item.message)}</button>`).join('')}`:''}`;
  } else {
    box.innerHTML = `<b>Organisation saved.</b> ${esc(practice.organisationSource || 'manual')} · ${esc(practice.organisationConfidence || 'manual')} confidence. You can change any field above.`;
  }
  panel.appendChild(box);
  box.addEventListener('click',event=>{
    const button = event.target.closest?.('[data-v4-editor-suggestion]');
    if (!button) return;
    const select = field('gmV3PrimaryPrinciple');
    if (select) { select.value=button.dataset.v4EditorSuggestion; select.dispatchEvent(new Event('change',{bubbles:true})); }
  });
}

function installEditorReviewHook() {
  if (editPracticeWrapped) return;
  let original;
  try { original = editPractice; } catch (_) { original = window.editPractice; }
  if (typeof original !== 'function') return;
  const wrapped = function(id,...rest) {
    const practice = appDb()?.practices?.find(item=>String(item.id)===String(id));
    const result = original.call(this,id,...rest);
    setTimeout(()=>renderEditorReviewHint(practice || {}),180);
    return result;
  };
  try { editPractice = wrapped; } catch (_) {}
  window.editPractice = wrapped;
  editPracticeWrapped = true;
}

function watchViews() {
  document.addEventListener('click',event=>{
    if (event.target.closest?.('[data-tab="library"],[data-tab="planner"],[data-tab="editor"],#sessionsLibraryTab,button[onclick*="showBuildRoute"],button[onclick*="loadSessionToPlanner"]')) {
      setTimeout(ensureAll,0);
      setTimeout(()=>{ renderPracticeLibraryV4(); renderFinderV4(); renderSessionLibraryV4(); },120);
    }
  },true);
}

function ensureAll() {
  addStyles();
  ensurePracticeLibraryV4();
  ensureFinderV4();
  ensureSessionLibraryV4();
  installEditorReviewHook();
}

function install() {
  ensureAll();
  setTimeout(ensureAll,150);
  setTimeout(ensureAll,600);
  setTimeout(ensureAll,1500);
  setTimeout(()=>organiseExistingPractices(),500);
  setTimeout(()=>organiseExistingPractices(),1800);
  setTimeout(()=>organiseExistingPractices(),4200);
  watchViews();
  window.NickPracticeAutoOrganiser = Object.freeze({
    version:AUTO_ORGANISATION_VERSION,
    organise:organiseExistingPractices,
    inferPurpose:inferPurposeV4,
    inferFormat:inferFormatV4,
    principleMatch:principleMatchForPractice,
    filters:{ library:libraryFilters, finder:finderFilters, sessions:sessionFilters }
  });
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
}
