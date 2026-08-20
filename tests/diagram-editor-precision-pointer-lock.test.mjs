import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const hold = await readFile(new URL('../src/diagram-editor-hold-pickup-pitch-size.js', import.meta.url), 'utf8');
const overlap = await readFile(new URL('../src/diagram-editor-pickup-line-pass.js', import.meta.url), 'utf8');

test('resize control is a genuinely small circular target rather than covering small equipment', () => {
  assert.match(hold, /width:9px!important;height:9px!important/);
  assert.match(hold, /border-radius:50%!important/);
  assert.match(hold, /transform:translate\(4\.5px,4\.5px\)!important/);
  assert.match(hold, /@media\(pointer:coarse\)/);
  assert.match(hold, /width:10px!important;height:10px!important/);
});

test('normal pickup prefers the DOM object genuinely under the pointer before fallback hit testing', () => {
  assert.match(hold, /function directObject\(event\)/);
  assert.match(hold, /const object = directObject\(event\) \|\| objectAt/);
  assert.match(hold, /const objectTolerance = Math\.max\(1\.5, 4\.5 \* scale\)/);
  assert.match(hold, /const movementTolerance = Math\.max\(7, 15 \* scale\)/);
});

test('held object captures its pointer and remains locked until that same pointer releases', () => {
  assert.match(hold, /window\.__coachDiagramPointerLock/);
  assert.match(hold, /pitch\.setPointerCapture\?\.\(event\.pointerId\)/);
  assert.match(hold, /function guardLockedPointerMove/);
  assert.match(hold, /lock\.pointerId === event\.pointerId/);
  assert.match(hold, /function guardLockedPointerUp/);
  assert.match(hold, /requestAnimationFrame\(\(\) => releasePickupPointer\(event\.pointerId\)\)/);
});

test('secondary touch or pointer cannot replace or cancel the object already being held', () => {
  assert.match(hold, /activeLock && activeLock\.pointerId !== event\.pointerId/);
  assert.match(hold, /event\.stopImmediatePropagation\(\)/);
  assert.match(overlap, /activeLock && activeLock\.pointerId !== event\.pointerId/);
  assert.match(overlap, /lockPickupPointer\(event, chosen\.id, pitch\)/);
});

test('stacked-object cycling is narrower and starts with the real pointer target', () => {
  assert.match(overlap, /const movementTolerance = Math\.max\(7, 15 \* scale\)/);
  assert.match(overlap, /const objectPadding = Math\.max\(1\.5, 4\.5 \* scale\)/);
  assert.match(overlap, /const currentTargetId = targetId\(event\)/);
  assert.match(overlap, /candidates\.findIndex\(item => item\.id === currentTargetId\)/);
  assert.match(overlap, /if \(!cycled && currentTargetId === chosen\.id\) return/);
});

test('locked hold gets a concrete visual state without changing normal object size', () => {
  assert.match(hold, /#dsPitch\.coachPickupLocked/);
  assert.match(hold, /outline-width:3px!important/);
  assert.match(hold, /dsMovementVisible\.dsMovementSelected/);
});
