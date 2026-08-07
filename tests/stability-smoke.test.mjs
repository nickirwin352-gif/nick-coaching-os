import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');

test('Use as New Session always loads copy mode', () => {
  assert.doesNotMatch(html, /function duplicateSession\(i\)\{loadSessionToPlanner\(i\);/);
  assert.match(html, /function duplicateSession\(i\)\{loadSessionToPlanner\(i,"copy"\)/);
});

test('saved sessions persist session-only diagram overrides', () => {
  assert.match(html, /diagramOverrides:copyPlannerDiagramOverrides\(\)/);
  assert.match(html, /plannerDiagramOverrides=Array\.isArray\(s\.diagramOverrides\)/);
});

test('planner drill operations use aligned session-state helpers', () => {
  assert.match(html, /CoachingOSSessionState\.duplicatePracticeAt/);
  assert.match(html, /CoachingOSSessionState\.movePractice/);
  assert.match(html, /CoachingOSSessionState\.removePracticeAt/);
});

test('long-form rendered text is escaped before newline conversion', () => {
  assert.match(html, /function escapeHtml\(/);
  assert.match(html, /function nl\(x\)\{return escapeHtml\(x\|\|""\)\.replace/);
});

test('Firebase code is extracted from the HTML monolith', () => {
  assert.match(html, /src="\.\/src\/firebase-cloud\.js"/);
  assert.ok(fs.existsSync(new URL('../src/firebase-cloud.js', import.meta.url)));
});
