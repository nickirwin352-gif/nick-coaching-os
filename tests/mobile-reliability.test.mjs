import test from 'node:test';
import assert from 'node:assert/strict';
import { mapClientPoint, anchoredPan } from '../src/mobile-reliability.js';

test('maps touch coordinates through the pitch content box', () => {
  const point = mapClientPoint(
    {clientX: 253, clientY: 153},
    {
      rectLeft: 100, rectTop: 50, rectWidth: 456, rectHeight: 266,
      offsetWidth: 912, offsetHeight: 532,
      clientWidth: 900, clientHeight: 520,
      borderLeft: 6, borderTop: 6
    },
    {w:900,h:520}
  );
  assert.equal(Math.round(point.x), 300);
  assert.equal(Math.round(point.y), 200);
});

test('anchored pan keeps a logical pitch point under the pinch midpoint', () => {
  const pan = anchoredPan(
    {x:300,y:250},
    {left:0,top:0,width:400,height:400},
    {x:600,y:260},
    {w:900,h:520},
    0.5
  );
  assert.equal(pan.x, 25);
  assert.equal(pan.y, 50);
});
