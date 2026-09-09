import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCollectionState, diffCollection, stableStringify } from '../src/cloud-sync-delta-v1.js';

test('stableStringify ignores object key order', () => {
  assert.equal(stableStringify({b:2,a:{d:4,c:3}}), stableStringify({a:{c:3,d:4},b:2}));
});

test('delta only upserts the changed saved session', () => {
  const before = [
    {id:'s1',date:'2026-09-01',team:'U18',drills:['a']},
    {id:'s2',date:'2026-09-02',team:'U18',drills:['b']}
  ];
  const previous = buildCollectionState(before,item=>item.id);
  const after = [
    before[0],
    {...before[1], drills:['b','c']}
  ];
  const delta = diffCollection(after,item=>item.id,previous);
  assert.equal(delta.changed,1);
  assert.deepEqual(delta.upserts.map(item=>item.id),['s2']);
  assert.deepEqual(delta.deletes,[]);
});

test('delta detects deletion without rewriting unchanged items', () => {
  const previous = buildCollectionState([{id:'a',n:1},{id:'b',n:2}],item=>item.id);
  const delta = diffCollection([{id:'b',n:2}],item=>item.id,previous);
  assert.equal(delta.changed,1);
  assert.deepEqual(delta.upserts,[]);
  assert.deepEqual(delta.deletes,['a']);
});
