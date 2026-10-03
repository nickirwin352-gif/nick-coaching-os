import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { GAME_MODEL_PRINCIPLES, GAME_SUB_PRINCIPLES } from '../src/game-model-core.js';
import {
  FOUR_PHASE_GAME_MODEL_VISUAL_VERSION,
  GAME_MODEL_VISUALS,
  GAME_MODEL_VISUAL_SUB_IDS,
  visualForSubPrinciple
} from '../src/four-phase-game-model-diagrams-v2.js';

const source=await readFile(new URL('../src/four-phase-game-model-diagrams-v2.js',import.meta.url),'utf8');
const sessionState=await readFile(new URL('../src/session-state.js',import.meta.url),'utf8');

test('every main principle and every sub-principle has a coaching picture', () => {
  assert.equal(FOUR_PHASE_GAME_MODEL_VISUAL_VERSION,2);
  assert.deepEqual(Object.keys(GAME_MODEL_VISUALS),GAME_MODEL_PRINCIPLES.map(item=>item.id));
  assert.equal(GAME_MODEL_VISUAL_SUB_IDS.length,27);
  assert.deepEqual([...GAME_MODEL_VISUAL_SUB_IDS].sort(),GAME_SUB_PRINCIPLES.map(item=>item.id).sort());
  for(const sub of GAME_SUB_PRINCIPLES){
    const visual=visualForSubPrinciple(sub.id);
    assert.ok(visual,`missing visual for ${sub.id}`);
    assert.ok(visual.caption.length>20);
    assert.ok(visual.cue.length>5);
    assert.ok(visual.players.length>=4);
  }
});

test('pictures explicitly protect principles from becoming fixed patterns', () => {
  assert.match(source,/Recognition pictures, not fixed patterns/);
  assert.match(source,/exact positions, formation and route can change/);
  assert.match(source,/role="img"/);
  assert.match(source,/data-visual-sub/);
});

test('diagram language consistently distinguishes ball, movement, pressure and recovery', () => {
  assert.match(source,/Ball/);
  assert.match(source,/Movement/);
  assert.match(source,/Pressure/);
  assert.match(source,/Recovery/);
  assert.match(source,/stroke-dasharray/);
});

test('game-model diagrams load directly after the four-phase game model', () => {
  const model=sessionState.indexOf("import('./four-phase-game-model-os-v1.js')");
  const diagrams=sessionState.indexOf("import('./four-phase-game-model-diagrams-v2.js')");
  const practices=sessionState.indexOf("import('./four-phase-practice-system-v1.js')");
  assert.ok(model>=0&&diagrams>model&&practices>diagrams);
});
