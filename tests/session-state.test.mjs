import test from 'node:test';
import assert from 'node:assert/strict';
import {
  alignOverrides,
  addPractice,
  removePracticeAt,
  removeAllPractices,
  duplicatePracticeAt,
  movePractice
} from '../src/session-state.js';

test('alignOverrides pads old sessions without overrides', () => {
  assert.deepEqual(alignOverrides(['a', 'b'], []), [null, null]);
});

test('adding a practice adds a matching empty override', () => {
  assert.deepEqual(addPractice(['a'], [{ pitchMode: 'full' }], 'b'), {
    drills: ['a', 'b'],
    overrides: [{ pitchMode: 'full' }, null]
  });
});

test('removing a practice removes its matching override', () => {
  const result = removePracticeAt(['a', 'b', 'c'], [{ n: 1 }, { n: 2 }, { n: 3 }], 1);
  assert.deepEqual(result.drills, ['a', 'c']);
  assert.deepEqual(result.overrides, [{ n: 1 }, { n: 3 }]);
});

test('removing all copies preserves override alignment', () => {
  const result = removeAllPractices(['a', 'b', 'a', 'c'], [{ n: 1 }, { n: 2 }, { n: 3 }, { n: 4 }], 'a');
  assert.deepEqual(result.drills, ['b', 'c']);
  assert.deepEqual(result.overrides, [{ n: 2 }, { n: 4 }]);
});

test('duplicating a practice deep-clones its session override', () => {
  const original = { diagram: [{ x: 1 }] };
  const result = duplicatePracticeAt(['a'], [original], 0);
  result.overrides[1].diagram[0].x = 99;
  assert.equal(result.overrides[0].diagram[0].x, 1);
  assert.deepEqual(result.drills, ['a', 'a']);
});

test('moving a practice moves its override with it', () => {
  const result = movePractice(['a', 'b'], [{ n: 1 }, { n: 2 }], 0, 1);
  assert.deepEqual(result.drills, ['b', 'a']);
  assert.deepEqual(result.overrides, [{ n: 2 }, { n: 1 }]);
});
