import test from 'node:test';
import assert from 'node:assert/strict';
import { shouldCoalesceRender } from '../src/startup-performance.js';

test('startup renders coalesce only during the short startup window', () => {
  assert.equal(shouldCoalesceRender(100, 500), true);
  assert.equal(shouldCoalesceRender(100, 1899), true);
  assert.equal(shouldCoalesceRender(100, 1900), false);
  assert.equal(shouldCoalesceRender(100, 2500), false);
});
