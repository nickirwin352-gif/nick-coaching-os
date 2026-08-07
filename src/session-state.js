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
  import('./mobile-reliability.js').catch(error => console.warn('Mobile reliability patch failed to load', error));
  import('./display-calibration.js').catch(error => console.warn('Display calibration patch failed to load', error));
  import('./sideline-glance-layout.js').catch(error => console.warn('Sideline glance layout patch failed to load', error));
  import('./post-session-review.js')
    .then(() => import('./review-integrations.js'))
    .catch(error => console.warn('Post-session review patch failed to load', error));
}
