export function cloneOverride(value) {
  return value == null ? null : JSON.parse(JSON.stringify(value));
}

export function alignOverrides(drills = [], overrides = []) {
  const next = Array.isArray(overrides) ? overrides.map(cloneOverride) : [];
  while (next.length < drills.length) next.push(null);
  if (next.length > drills.length) next.length = drills.length;
  return next;
}

export function addPractice(drills = [], overrides = [], id) {
  const nextDrills = [...drills, id];
  const nextOverrides = alignOverrides(drills, overrides);
  nextOverrides.push(null);
  return { drills: nextDrills, overrides: nextOverrides };
}

export function removePracticeAt(drills = [], overrides = [], index) {
  const nextDrills = [...drills];
  const nextOverrides = alignOverrides(drills, overrides);
  if (index < 0 || index >= nextDrills.length) return { drills: nextDrills, overrides: nextOverrides };
  nextDrills.splice(index, 1);
  nextOverrides.splice(index, 1);
  return { drills: nextDrills, overrides: nextOverrides };
}

export function removeAllPractices(drills = [], overrides = [], id) {
  const aligned = alignOverrides(drills, overrides);
  const nextDrills = [];
  const nextOverrides = [];
  drills.forEach((drillId, index) => {
    if (drillId === id) return;
    nextDrills.push(drillId);
    nextOverrides.push(cloneOverride(aligned[index]));
  });
  return { drills: nextDrills, overrides: nextOverrides };
}

export function duplicatePracticeAt(drills = [], overrides = [], index) {
  const nextDrills = [...drills];
  const nextOverrides = alignOverrides(drills, overrides);
  if (index < 0 || index >= nextDrills.length) return { drills: nextDrills, overrides: nextOverrides };
  nextDrills.splice(index + 1, 0, nextDrills[index]);
  nextOverrides.splice(index + 1, 0, cloneOverride(nextOverrides[index]));
  return { drills: nextDrills, overrides: nextOverrides };
}

export function movePractice(drills = [], overrides = [], index, delta) {
  const target = index + delta;
  const nextDrills = [...drills];
  const nextOverrides = alignOverrides(drills, overrides);
  if (index < 0 || index >= nextDrills.length || target < 0 || target >= nextDrills.length) {
    return { drills: nextDrills, overrides: nextOverrides };
  }
  [nextDrills[index], nextDrills[target]] = [nextDrills[target], nextDrills[index]];
  [nextOverrides[index], nextOverrides[target]] = [nextOverrides[target], nextOverrides[index]];
  return { drills: nextDrills, overrides: nextOverrides };
}

const api = {
  cloneOverride,
  alignOverrides,
  addPractice,
  removePracticeAt,
  removeAllPractices,
  duplicatePracticeAt,
  movePractice
};

if (typeof window !== 'undefined') window.CoachingOSSessionState = api;

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  const startupPolishReady = import('./app-startup-save-status-v1.js')
    .catch(error => { console.warn('Startup/save status patch failed to load', error); return null; });
  const practiceTagPersistenceReady = import('./practice-tag-persistence-v6.js')
    .catch(error => { console.warn('Practice tag persistence patch failed to load', error); return null; });
  import('./mobile-reliability.js').catch(error => console.warn('Mobile reliability patch failed to load', error));
  import('./display-calibration.js').catch(error => console.warn('Display calibration patch failed to load', error));
  import('./sideline-glance-layout.js').catch(error => console.warn('Sideline glance layout patch failed to load', error));
  import('./post-session-review.js')
    .then(() => import('./review-integrations.js'))
    .then(() => import('./session-library-speed-v2.js'))
    .then(() => import('./startup-performance.js'))
    .then(() => import('./session-usability-pass.js'))
    .then(() => import('./practice-editor-unified.js'))
    .then(() => import('./builder-session-visuals.js'))
    .then(() => import('./sticky-session-diagrams-fix.js'))
    .then(() => import('./sticky-editor-return.js'))
    .then(() => import('./practice-editor-interaction-revamp.js'))
    .then(() => import('./diagram-group-copy-tools.js'))
    .then(() => import('./practice-editor-studio-v2.js'))
    .then(() => import('./diagram-editor-coach-workflow.js'))
    .then(() => import('./diagram-editor-precision-v2.js'))
    .then(() => import('./diagram-editor-pickup-line-pass.js'))
    .then(() => import('./diagram-editor-hold-pickup-pitch-size.js'))
    .then(() => import('./editor-pitch-builder-cleanup.js'))
    .then(() => import('./review-diagram-ten-scale.js'))
    .then(() => import('./diagram-preview-calibration-v2.js'))
    .then(() => import('./session-intelligence-observer-guard.js'))
    .then(() => import('./session-intelligence-v2.js'))
    .then(() => import('./session-library-intelligence-hook.js'))
    .then(() => import('./practice-id-system.js'))
    .then(() => import('./session-calendar-navigation-rating.js'))
    .then(() => import('./coaching-personalisation-automation.js'))
    .then(() => import('./calendar-sessions-hard-fix-v2.js'))
    .then(() => import('./ios-diagram-calibration-v3.js'))
    .then(() => import('./diagram-preset-manager.js'))
    .then(() => import('./session-return-sideline-setup.js'))
    .then(() => import('./diagram-cone-colours.js'))
    .then(() => import('./game-model-clarity-framework.js'))
    .then(() => import('./game-model-operating-system.js'))
    .then(() => import('./game-model-visual-playbook.js'))
    .then(() => import('./game-model-practice-architecture-v2.js'))
    .then(() => import('./game-context-practice-system-v3.js'))
    .then(() => practiceTagPersistenceReady)
    .then(() => import('./practice-library-auto-organiser-v4.js'))
    .then(() => import('./practice-tag-save-reliability-v5.js'))
    .then(() => import('./practice-no-principle-decision-v1.js'))
    .then(() => import('./practice-editor-collapsible-word-banks-v1.js'))
    .then(() => import('./advanced-builder-visual-focus-v1.js'))
    .then(() => import('./practice-filter-workbench-v5.js'))
    .then(() => startupPolishReady)
    .then(() => { window.NickStartupPolish?.markEnhancementsReady?.(); })
    .catch(error => {
      console.warn('Coaching OS enhancement patch failed to load', error);
      window.NickStartupPolish?.markEnhancementsReady?.({degraded:true});
    });
}
