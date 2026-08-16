import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sessionScoreOutOfTen, trafficHue } from '../src/calendar-sessions-hard-fix-v2.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const source = fs.readFileSync(path.join(root, 'src/calendar-sessions-hard-fix-v2.js'), 'utf8');
const state = fs.readFileSync(path.join(root, 'src/session-state.js'), 'utf8');

test('converts legacy five-point ratings to ten-point scores', () => {
  assert.equal(sessionScoreOutOfTen({ rating: 1 }), 2);
  assert.equal(sessionScoreOutOfTen({ rating: 5 }), 10);
  assert.equal(sessionScoreOutOfTen({ review: { rating: 4 } }), 8);
});

test('preserves explicit ten-point review ratings', () => {
  assert.equal(sessionScoreOutOfTen({ review: { rating: 6, scale: 10 }, rating: 3 }), 6);
  assert.equal(sessionScoreOutOfTen({ review: { rating: 10, scale: 10 } }), 10);
  assert.equal(sessionScoreOutOfTen({ rating: 8 }), 8);
});

test('traffic hue progresses from red through amber to green', () => {
  assert.ok(trafficHue(1) < trafficHue(5));
  assert.ok(trafficHue(5) < trafficHue(10));
});

test('calendar click intercept calls real cell renderer then scrolls to exact session', () => {
  assert.match(source, /event\.stopImmediatePropagation\(\)/);
  assert.match(source, /originalCellClick\.call\(cell\)/);
  assert.match(source, /data-session-index/);
  assert.match(source, /scrollIntoView\(\{ behavior: 'smooth', block: 'start' \}\)/);
  assert.match(source, /calendarHardJumpTarget/);
});

test('sessions cards remove stars and use native x out of 10 traffic badges', () => {
  assert.match(source, /\[★☆\]/);
  assert.match(source, /hardSessionScore/);
  assert.match(source, /\$\{score\}\/10/);
  assert.match(source, /hardSessionTraffic/);
  assert.match(source, /Session rating/);
});

test('archive rating selector is rebuilt as one to ten with no stars', () => {
  assert.match(source, /for \(let n = 1; n <= 10; n\+\+\)/);
  assert.match(source, />\$\{n\}\/10<\/option>/);
  assert.match(source, /Rate \/10/);
});

test('mutation observers keep behaviour after renders filters and cloud refreshes', () => {
  assert.match(source, /new MutationObserver/);
  assert.match(source, /sessionLibraryResults/);
  assert.match(source, /archiveCalendar/);
  assert.match(source, /archiveList/);
});

test('hard fix is loaded last after prior enhancement layers', () => {
  const oldIndex = state.indexOf("import('./session-calendar-navigation-rating.js')");
  const personalIndex = state.indexOf("import('./coaching-personalisation-automation.js')");
  const hardIndex = state.indexOf("import('./calendar-sessions-hard-fix-v2.js')");
  assert.ok(oldIndex >= 0 && personalIndex > oldIndex && hardIndex > personalIndex);
});
