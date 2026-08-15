import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import {
  sessionScoreOutOfTen,
  sessionTrafficHue,
  sessionJumpKey
} from '../src/session-calendar-navigation-rating.js';

const source = fs.readFileSync(new URL('../src/session-calendar-navigation-rating.js', import.meta.url), 'utf8');
const sessionState = fs.readFileSync(new URL('../src/session-state.js', import.meta.url), 'utf8');

test('session scores are displayed on a ten point scale', () => {
  assert.equal(sessionScoreOutOfTen({ rating:'5' }), 10);
  assert.equal(sessionScoreOutOfTen({ rating:'3' }), 6);
  assert.equal(sessionScoreOutOfTen({ rating:'8', review:{ scale:10, rating:'8' } }), 8);
  assert.equal(sessionScoreOutOfTen({}), 0);
});

test('traffic hue moves from red through amber to green', () => {
  assert.equal(sessionTrafficHue(1), 0);
  assert.ok(sessionTrafficHue(5) >= 35 && sessionTrafficHue(5) <= 40);
  assert.ok(sessionTrafficHue(10) >= 120);
});

test('calendar jump keys prefer stable session ids', () => {
  assert.equal(sessionJumpKey({ id:'session-123', date:'2026-08-15' }, 4), 'id:session-123');
  assert.equal(sessionJumpKey({ date:'2026-08-15' }, 4), 'date:2026-08-15:4');
});

test('sessions tab uses numeric ratings and traffic-light cards', () => {
  assert.match(source, /sessionTrafficRated/);
  assert.match(source, /sessionNumberRating/);
  assert.match(source, /\$\{score\}\/10/);
  assert.match(source, /\^\[★☆\]\+\$/);
  assert.match(source, /Session rating/);
});

test('calendar entries navigate to matching archived session cards', () => {
  assert.match(source, /data-session-jump-key/);
  assert.match(source, /scrollIntoView\(\{ behavior:'smooth', block:'start' \}\)/);
  assert.match(source, /calendarJumpTarget/);
  assert.match(source, /cell\.querySelector\('\.calSessionDot\[data-session-jump-key\]'\)/);
});

test('session state loads the calendar navigation rating pass', () => {
  assert.match(sessionState, /session-calendar-navigation-rating\.js/);
});
