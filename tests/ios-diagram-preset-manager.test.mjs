import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PREVIEW_ARROW_SIZE, STUDIO_ARROW_SIZE, isIOSLike } from '../src/ios-diagram-calibration-v3.js';
import { clonePresetObjects, makePresetRecord } from '../src/diagram-preset-manager.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const iosSource = fs.readFileSync(path.join(root, 'src/ios-diagram-calibration-v3.js'), 'utf8');
const presetSource = fs.readFileSync(path.join(root, 'src/diagram-preset-manager.js'), 'utf8');
const stateSource = fs.readFileSync(path.join(root, 'src/session-state.js'), 'utf8');

test('iOS calibration uses compact consistent arrowheads instead of the old massive preview marker', () => {
  assert.equal(PREVIEW_ARROW_SIZE, 8);
  assert.equal(STUDIO_ARROW_SIZE, 8);
  assert.match(iosSource, /markerUnits', 'userSpaceOnUse'/);
  assert.match(iosSource, /calibratePreviewPitch/);
  assert.match(iosSource, /calibrateStudioPitch/);
  assert.doesNotMatch(iosSource, /markerWidth[^\n]*14/);
});

test('recognises iPhone iPad and touch iPad desktop user agent cases', () => {
  assert.equal(isIOSLike('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)', 'iPhone', 5), true);
  assert.equal(isIOSLike('Mozilla/5.0', 'MacIntel', 5), true);
  assert.equal(isIOSLike('Mozilla/5.0 (Windows NT 10.0)', 'Win32', 0), false);
});

test('iOS calibration reacts to visual viewport and orientation changes', () => {
  assert.match(iosSource, /window\.visualViewport/);
  assert.match(iosSource, /orientationchange/);
  assert.match(iosSource, /MutationObserver/);
  assert.match(iosSource, /iosDiagramDevice/);
});

test('preset clones receive fresh ids and keep movement attachments linked to cloned objects', () => {
  let n = 0;
  const source = [
    { id:'player-a', type:'player', x:10, y:10 },
    { id:'player-b', type:'player', x:50, y:10 },
    { id:'move-a', type:'movement', attachStart:'player-a', attachEnd:'player-b', points:[{x:20,y:20},{x:60,y:20}] }
  ];
  const result = clonePresetObjects(source, prefix => `${prefix}-copy-${++n}`);
  assert.notEqual(result[0].id, 'player-a');
  assert.notEqual(result[1].id, 'player-b');
  assert.equal(result[2].attachStart, result[0].id);
  assert.equal(result[2].attachEnd, result[1].id);
  assert.deepEqual(result[2].points, source[2].points);
});

test('preset records preserve pitch type and exact diagram snapshot', () => {
  const record = makePresetRecord('My Build Out', { pitchMode:'half', diagram:[{ id:'a', type:'player', x:44, y:90 }] }, '2026-08-16T10:00:00.000Z');
  assert.equal(record.name, 'My Build Out');
  assert.equal(record.pitchMode, 'half');
  assert.equal(record.itemCount, 1);
  assert.deepEqual(record.diagram[0], { id:'a', type:'player', x:44, y:90 });
});

test('preset manager stores custom presets inside cloud-backed banks and supports full ownership controls', () => {
  assert.match(presetSource, /diagramPresets/);
  assert.match(presetSource, /data\.banks\[STORE_KEY\]/);
  assert.match(presetSource, /Create Preset/);
  assert.match(presetSource, /Save Current Setup/);
  assert.match(presetSource, /Update from Current/);
  assert.match(presetSource, /Rename/);
  assert.match(presetSource, /Delete/);
  assert.match(presetSource, /Hide All Defaults/);
  assert.match(presetSource, /Show All Defaults/);
  assert.match(presetSource, /window\.nickCloud\.save/);
});

test('new calibration and preset manager load after existing diagram enhancement layers', () => {
  const preview = stateSource.indexOf("import('./diagram-preview-calibration-v2.js')");
  const workflow = stateSource.indexOf("import('./diagram-editor-coach-workflow.js')");
  const ios = stateSource.indexOf("import('./ios-diagram-calibration-v3.js')");
  const presets = stateSource.indexOf("import('./diagram-preset-manager.js')");
  assert.ok(preview >= 0 && workflow >= 0 && ios > preview && ios > workflow && presets > ios);
});
