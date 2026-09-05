import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  createStrictFilterState,
  matchesStrictPracticeFilters,
  filterPracticesStrict,
  strictPracticeArchitecture
} from '../src/practice-filter-workbench-v5.js';

const source = await readFile(new URL('../src/practice-filter-workbench-v5.js', import.meta.url), 'utf8');
const sessionState = await readFile(new URL('../src/session-state.js', import.meta.url), 'utf8');

const practices = [
  {
    id:'BU-ARRIVE', name:'Build out arrival', gameContext:'build-out', practicePurpose:'recognise', practiceFormat:'possession-box',
    primaryGameModelPrinciple:'arrive', gameModelPrinciples:['arrive']
  },
  {
    id:'BU-MOVE', name:'Build out free player', gameContext:'build-out', practicePurpose:'recognise', practiceFormat:'directional-possession',
    primaryGameModelPrinciple:'move-free', gameModelPrinciples:['move-free']
  },
  {
    id:'PROG-ARRIVE', name:'Progress arrival', gameContext:'progress', practicePurpose:'recognise', practiceFormat:'possession-box',
    primaryGameModelPrinciple:'arrive', gameModelPrinciples:['arrive']
  },
  {
    id:'BU-NONE', name:'Build out technical', gameContext:'build-out', practicePurpose:'prepare', practiceFormat:'passing-activation',
    noGameModelPrinciple:true, suggestedGameModelPrinciples:['arrive']
  }
];

test('a selected context is an exact gate', () => {
  const filters = createStrictFilterState({ contexts:['build-out'] });
  assert.deepEqual(filterPracticesStrict(practices,filters).map(p=>p.id), ['BU-ARRIVE','BU-MOVE','BU-NONE']);
  assert.equal(matchesStrictPracticeFilters(practices[2],filters), false);
});

test('different filter rows combine with AND', () => {
  const filters = createStrictFilterState({ contexts:['build-out'], principles:['arrive'] });
  assert.deepEqual(filterPracticesStrict(practices,filters).map(p=>p.id), ['BU-ARRIVE']);
});

test('multiple choices inside one row use OR while rows still use AND', () => {
  const filters = createStrictFilterState({ contexts:['build-out','progress'], principles:['arrive'], formats:['possession-box'] });
  assert.deepEqual(filterPracticesStrict(practices,filters).map(p=>p.id), ['BU-ARRIVE','PROG-ARRIVE']);
});

test('suggested principles never leak into strict principle results', () => {
  const filters = createStrictFilterState({ contexts:['build-out'], principles:['arrive'] });
  assert.equal(matchesStrictPracticeFilters(practices[3],filters), false);
  assert.deepEqual(strictPracticeArchitecture(practices[3]).principles, []);
});

test('purpose and format are also exact gates', () => {
  const filters = createStrictFilterState({ contexts:['build-out'], purposes:['recognise'], formats:['directional-possession'] });
  assert.deepEqual(filterPracticesStrict(practices,filters).map(p=>p.id), ['BU-MOVE']);
});

test('workbench and finder are built from the same strict filter engine', () => {
  assert.match(source, /function renderResults\(group,filters\)/);
  assert.match(source, /filterPracticesStrict\(appDb\(\)\?\.practices\|\|\[\],filters\)/);
  assert.match(source, /Find Practices · Same Exact Workbench/);
  assert.match(source, /No exact matches/);
});

test('finder session defaults are only seeded on reset or session change, not every render', () => {
  assert.match(source, /function resetFinderToSession\(\)/);
  const renderStart = source.indexOf('function renderResults(group,filters)');
  const renderEnd = source.indexOf('function resetFinderToSession()');
  assert.ok(renderStart >= 0 && renderEnd > renderStart);
  assert.doesNotMatch(source.slice(renderStart,renderEnd), /resetFinderToSession\(\)/);
});

test('strict filter module loads after the existing organiser and builder visual pass', () => {
  const organiser = sessionState.indexOf("import('./practice-library-auto-organiser-v4.js')");
  const builder = sessionState.indexOf("import('./advanced-builder-visual-focus-v1.js')");
  const strict = sessionState.indexOf("import('./practice-filter-workbench-v5.js')");
  assert.ok(organiser >= 0 && strict > organiser);
  assert.ok(builder >= 0 && strict > builder);
});
