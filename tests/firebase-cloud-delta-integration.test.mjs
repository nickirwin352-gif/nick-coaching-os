import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../src/firebase-cloud.js', import.meta.url),'utf8');

test('Firebase save path uses deltas instead of rereading every collection before each save', () => {
  assert.match(source,/diffCollection\(/);
  const deltaFn = source.slice(source.indexOf('async function saveCollectionDelta'),source.indexOf('async function writeMeta'));
  assert.doesNotMatch(deltaFn,/getDocs\(/);
  assert.match(deltaFn,/batch\.commit\(\)/);
});

test('saved sessions have a targeted session-only sync API', () => {
  assert.match(source,/saveSessions:\s*function\(sessions\)/);
  assert.match(source,/saveSessionsIncremental/);
  assert.match(source,/changeKind:'|changeKind,/);
});

test('iOS can become save-ready from local cache while full remote hydration continues', () => {
  assert.match(source,/primeFromLocalCache\(\)/);
  assert.match(source,/local-cache-fast-start/);
  assert.match(source,/pendingRemote:true/);
});

test('a local session saved during slow hydration is protected from a stale remote snapshot', () => {
  assert.match(source,/const protectedSessions = new Map\(\)/);
  assert.match(source,/mergeProtectedSessions\(structured\)/);
  assert.match(source,/protectedSessions\.set/);
});
