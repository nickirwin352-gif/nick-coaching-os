import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../src/builder-session-visuals.js', import.meta.url), 'utf8');

test('advanced builder renders diagrams above selected practices', () => {
  assert.match(source, /advancedBuilderDiagram/);
  assert.match(source, /dsCurrentPlannerPractice/);
  assert.match(source, /drawMini/);
});

test('advanced builder sticky bar renders session diagram thumbnails', () => {
  assert.match(source, /currentSessionDiagramStrip/);
  assert.match(source, /currentSessionDiagramThumb/);
  assert.match(source, /renderStickySessionDiagrams/);
  assert.match(source, /renderCurrentSessionDock/);
  assert.match(source, /openSessionDiagramStudio/);
});

test('copy previous session can reveal practices and all diagrams', () => {
  assert.match(source, /View Practices/);
  assert.match(source, /recentSessionPracticePanel/);
  assert.match(source, /openAllSessionDiagrams/);
  assert.match(source, /dsEffectiveSessionPractice/);
});
