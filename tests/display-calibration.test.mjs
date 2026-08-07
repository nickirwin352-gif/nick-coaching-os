import test from 'node:test';
import assert from 'node:assert/strict';
import { fitLogicalDiagram } from '../src/display-calibration.js';

test('landscape preview preserves the 900x520 diagram ratio', () => {
  const fit = fitLogicalDiagram(340, 0, {w:900,h:520});
  assert.equal(fit.width, 340);
  assert.ok(Math.abs(fit.height - 196.4444444444) < 0.001);
  assert.ok(Math.abs(fit.scale - (340/900)) < 0.000001);
});

test('sideline diagram fits inside both width and height without stretching', () => {
  const fit = fitLogicalDiagram(600, 250, {w:900,h:520});
  assert.ok(fit.width < 600);
  assert.equal(fit.height, 250);
  assert.ok(Math.abs((fit.width / fit.height) - (900/520)) < 0.000001);
});

test('portrait diagram is contained without changing its logical ratio', () => {
  const fit = fitLogicalDiagram(320, 400, {w:520,h:900});
  assert.equal(fit.height, 400);
  assert.ok(Math.abs((fit.width / fit.height) - (520/900)) < 0.000001);
});
