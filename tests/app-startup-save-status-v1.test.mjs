import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { APP_STARTUP_SAVE_STATUS_VERSION } from '../src/app-startup-save-status-v1.js';

const source = await readFile(new URL('../src/app-startup-save-status-v1.js', import.meta.url),'utf8');
const sessionState = await readFile(new URL('../src/session-state.js', import.meta.url),'utf8');

test('startup polish exposes a versioned clean loading shell', () => {
  assert.equal(APP_STARTUP_SAVE_STATUS_VERSION,1);
  assert.match(source,/nickAppStartupOverlayV1/);
  assert.match(source,/Loading your coaching workspace/);
  assert.match(source,/enhancementsReady && cloudResolved/);
  assert.match(source,/5000/);
});

test('global save status shows local and cloud state clearly', () => {
  assert.match(source,/Saved locally ✓ · Cloud synced ✓/);
  assert.match(source,/Saved locally ✓ · Cloud waiting/);
  assert.match(source,/Saved locally ✓ · Local only/);
  assert.match(source,/Saving…/);
  assert.match(source,/Syncing…/);
});

test('save status wraps store and cloud save without replacing app data format', () => {
  assert.match(source,/function wrapStore/);
  assert.match(source,/function wrapCloudSave/);
  assert.match(source,/localStorage\.setItem\('nickCoachOSv3'/);
  assert.match(source,/normaliseDbShape/);
});

test('startup polish is requested immediately and marked ready after enhancements', () => {
  const startup = sessionState.indexOf("import('./app-startup-save-status-v1.js')");
  const review = sessionState.indexOf("import('./post-session-review.js')");
  const visualFocus = sessionState.indexOf("import('./advanced-builder-visual-focus-v1.js')");
  const markReady = sessionState.indexOf('markEnhancementsReady');
  assert.ok(startup >= 0 && startup < review);
  assert.ok(visualFocus > review && markReady > visualFocus);
});
