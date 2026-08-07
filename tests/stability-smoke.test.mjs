import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');

test('Use as New Session always loads copy mode and has one canonical handler', () => {
  assert.doesNotMatch(html, /function duplicateSession\(i\)\{loadSessionToPlanner\(i\);/);
  assert.match(html, /function duplicateSession\(i\)\{loadSessionToPlanner\(i,"copy"\)/);
  assert.equal((html.match(/function duplicateSession\(i\)/g) || []).length, 1);
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

test('deleting a practice preserves session diagram alignment', () => {
  assert.match(html, /db\.sessions\.forEach\(s=>\{const next=window\.CoachingOSSessionState\.removeAllPractices\(sessionDrillIds\(s\),s\.diagramOverrides\|\|\[\],id\)/);
  assert.match(html, /s\.drills=next\.drills;s\.diagramOverrides=next\.overrides/);
});

test('blueprints preserve session-only diagram overrides', () => {
  assert.match(html, /diagramOverrides:copyPlannerDiagramOverrides\(\),isFavourite:false/);
  assert.match(html, /alignOverrides\(plannerDrills,t\.diagramOverrides\|\|\[\]\)/);
});

test('long-form rendered text is escaped before newline conversion', () => {
  assert.match(html, /function escapeHtml\(/);
  assert.match(html, /function nl\(x\)\{return escapeHtml\(x\|\|""\)\.replace/);
});

test('short coach-entered display fields and coaching-point list items are escaped', () => {
  assert.match(html, /function escapeJsSingleQuoted\(/);
  assert.doesNotMatch(html, /escapedId=p\.id\.replace/);
  assert.match(html, /visible\.map\(x=>`<li>\$\{escapeHtml\(x\)\}<\/li>`\)/);
  assert.match(html, /<strong>\$\{escapeHtml\(p\.id\)\} · \$\{escapeHtml\(p\.name\)\}<\/strong>/);
});

test('Firebase code is extracted from the HTML monolith', () => {
  assert.match(html, /src="\.\/src\/firebase-cloud\.js"/);
  assert.ok(fs.existsSync(new URL('../src/firebase-cloud.js', import.meta.url)));
});
