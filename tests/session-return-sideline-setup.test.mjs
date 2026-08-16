import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { makeSessionReturnContext, updateSaveSucceeded } from '../src/session-return-sideline-setup.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const source = fs.readFileSync(path.join(root, 'src/session-return-sideline-setup.js'), 'utf8');
const state = fs.readFileSync(path.join(root, 'src/session-state.js'), 'utf8');

test('normalises the page and scroll position used after an existing-session update', () => {
  assert.deepEqual(makeSessionReturnContext('archive', 12, 640), { tab:'archive', scrollX:12, scrollY:640 });
  assert.deepEqual(makeSessionReturnContext('', 'bad', null), { tab:'archive', scrollX:0, scrollY:0 });
});

test('only treats an update as successful after the planner update control has reset', () => {
  assert.equal(updateSaveSucceeded({ classList:{ contains:value => value === 'hidden' } }), true);
  assert.equal(updateSaveSucceeded({ classList:{ contains:() => false } }), false);
  assert.equal(updateSaveSucceeded(null), false);
});

test('editing a saved session captures the source tab before opening Build', () => {
  assert.match(source, /captureSessionReturn\(mode\)/);
  assert.match(source, /\.tab\.active\[data-tab\]/);
  assert.match(source, /window\.scrollX/);
  assert.match(source, /window\.scrollY/);
  assert.match(source, /window\.loadSessionToPlanner = wrappedLoad/);
});

test('successful Update Existing Session restores the source tab and scroll instead of staying on Build', () => {
  assert.match(source, /mode === 'update'/);
  assert.match(source, /updateSaveSucceeded\(updateButton\)/);
  assert.match(source, /restoreSessionReturn\(returnContext\)/);
  assert.match(source, /button\.click\(\)/);
  assert.match(source, /window\.scrollTo\(context\.scrollX \|\| 0, context\.scrollY \|\| 0\)/);
});

test('failed validation does not throw the coach away from the builder', () => {
  const restoreBlock = source.match(/if \(isUpdate && returnContext && updateSaveSucceeded\(updateButton\)\) \{[\s\S]*?\n      \}/)?.[0] || '';
  assert.match(restoreBlock, /restoreSessionReturn/);
});

test('Sideline Mode selects Setup on each newly rendered practice but allows manual Coaching afterwards', () => {
  assert.match(source, /sidelinePracticeKey/);
  assert.match(source, /key === sidelineLastPracticeKey/);
  assert.match(source, /\^setup\$/i);
  assert.match(source, /setup\.click\(\)/);
  assert.match(source, /sidelineLastPracticeKey = key/);
});

test('Sideline setup default watches both practice changes and a fresh overlay opening', () => {
  assert.match(source, /sidelineContentObserver = new MutationObserver/);
  assert.match(source, /sidelineOverlayObserver = new MutationObserver/);
  assert.match(source, /overlay\.classList\.contains\('open'\)/);
  assert.match(source, /queueSidelineSetup\(true\)/);
});

test('the flow fix loads last after the preset manager', () => {
  const presets = state.indexOf("import('./diagram-preset-manager.js')");
  const flow = state.indexOf("import('./session-return-sideline-setup.js')");
  assert.ok(presets >= 0 && flow > presets);
});
