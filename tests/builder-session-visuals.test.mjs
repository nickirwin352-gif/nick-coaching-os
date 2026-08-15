import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../src/builder-session-visuals.js', import.meta.url), 'utf8');
const sticky = await readFile(new URL('../src/sticky-session-diagrams-fix.js', import.meta.url), 'utf8');

test('advanced builder renders diagrams above selected practices', () => {
  assert.match(source, /advancedBuilderDiagram/);
  assert.match(source, /dsCurrentPlannerPractice/);
  assert.match(source, /drawMini/);
});

test('sticky bar has one dedicated diagram renderer', () => {
  assert.doesNotMatch(source, /renderStickySessionDiagrams/);
  assert.match(sticky, /currentSessionDockDiagramStrip/);
  assert.match(sticky, /stickyDiagramThumb/);
  assert.match(sticky, /#currentSessionDockPills\{display:none!important\}/);
});

test('sticky diagram click opens viewer before editor', () => {
  assert.match(sticky, /openViewer\(index\)/);
  assert.match(sticky, /stickySessionDiagramViewer/);
  assert.match(sticky, /Edit Diagram/);
  assert.match(sticky, /openSessionDiagramStudio\(index\)/);
  assert.match(sticky, /View practice/);
});

test('sticky diagram thumbnails are larger than the old compact cards', () => {
  assert.match(sticky, /flex:0 0 188px/);
  assert.match(sticky, /height:106px!important/);
});

test('copy previous session can reveal practices and all diagrams', () => {
  assert.match(source, /View Practices/);
  assert.match(source, /recentSessionPracticePanel/);
  assert.match(source, /openAllSessionDiagrams/);
  assert.match(source, /dsEffectiveSessionPractice/);
});
