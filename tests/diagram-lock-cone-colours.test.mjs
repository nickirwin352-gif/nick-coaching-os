import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const precision = await readFile(new URL('../src/diagram-editor-precision-v2.js', import.meta.url), 'utf8');
const cones = await readFile(new URL('../src/diagram-cone-colours.js', import.meta.url), 'utf8');
const sessionState = await readFile(new URL('../src/session-state.js', import.meta.url), 'utf8');

test('precision pass loads before older pickup passes so exact targeting wins capture order', () => {
  const precisionIndex = sessionState.indexOf("import('./diagram-editor-precision-v2.js')");
  const pickupIndex = sessionState.indexOf("import('./diagram-editor-pickup-line-pass.js')");
  const holdIndex = sessionState.indexOf("import('./diagram-editor-hold-pickup-pitch-size.js')");
  assert.ok(precisionIndex >= 0 && precisionIndex < pickupIndex && pickupIndex < holdIndex);
});

test('movement and fallback hit areas are substantially tighter', () => {
  assert.match(precision, /stroke-width:22!important/);
  assert.match(precision, /objectPad = Math\.max\(\.35, 1\.1 \* scale\)/);
  assert.match(precision, /movementPad = Math\.max\(2\.5, 4\.5 \* scale\)/);
});

test('held object selection is snapshotted and reasserted until release', () => {
  assert.match(precision, /selectedIds:snapshotSelection\(s, objectId\)/);
  assert.match(precision, /primaryId:s\?\.primaryId \|\| objectId/);
  assert.match(precision, /function reassertLockedSelection/);
  assert.match(precision, /s\.selectedIds = new Set\(expected\)/);
  assert.match(precision, /event\.stopImmediatePropagation\(\)/);
});

test('cone colour controls offer useful coaching colours and persist on the diagram object', () => {
  for (const colour of ['orange', 'red', 'blue', 'yellow', 'white']) {
    assert.match(cones, new RegExp(`${colour}:\\{label:`));
  }
  assert.match(cones, /cone\.color = colour/);
  assert.match(cones, /dsPushHistory/);
  assert.match(cones, /Cone colour/);
  assert.match(cones, /data-cone-colour/);
});

test('cone colours style both the editor and calibrated diagram previews', () => {
  assert.match(cones, /#dsPitch \.dsObject\.cone\.\$\{key\}/);
  assert.match(cones, /\.calibratedMiniV2 \.dsObject\.cone\.\$\{key\}/);
  assert.match(cones, /linear-gradient\(180deg,\$\{colour\.top\},\$\{colour\.bottom\}\)/);
});

test('cone colour module is the final enhancement so later renderers cannot overwrite it', () => {
  const preset = sessionState.indexOf("import('./diagram-preset-manager.js')");
  const returnFlow = sessionState.indexOf("import('./session-return-sideline-setup.js')");
  const cone = sessionState.indexOf("import('./diagram-cone-colours.js')");
  assert.ok(cone > preset && cone > returnFlow);
});
