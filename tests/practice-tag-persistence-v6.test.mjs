import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  PRACTICE_TAG_PERSISTENCE_VERSION,
  PRACTICE_TAG_DECISIONS_KEY,
  applyStoredDecision,
  applyStoredDecisionsToData,
  mergeManualTagDecisionsIntoCloud
} from '../src/practice-tag-persistence-v6.js';

const source = await readFile(new URL('../src/practice-tag-persistence-v6.js', import.meta.url),'utf8');
const sessionState = await readFile(new URL('../src/session-state.js', import.meta.url),'utf8');

function withLocalStorage(entries,fn) {
  const map = new Map(Object.entries(entries || {}));
  const previous = globalThis.localStorage;
  globalThis.localStorage = {
    getItem:key => map.has(key) ? map.get(key) : null,
    setItem:(key,value) => map.set(key,String(value)),
    removeItem:key => map.delete(key)
  };
  try { return fn(map); }
  finally {
    if (previous === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = previous;
  }
}

test('manual decision overrides a stale cloud practice after refresh', () => {
  withLocalStorage({
    [PRACTICE_TAG_DECISIONS_KEY]:JSON.stringify({
      'SP-1':{
        gameContext:'build-out',
        practicePurpose:'recognise',
        practiceFormat:'possession-box',
        primaryPrincipleId:'arrive',
        supportingPrincipleIds:['move-free'],
        updatedAt:123
      }
    })
  },() => {
    const cloud = { practices:[{
      id:'SP-1',
      gameContext:'progress',
      practicePurpose:'execute',
      practiceFormat:'skill-practice',
      primaryGameModelPrinciple:'move-free',
      gameModelPrinciples:['move-free'],
      suggestedGameModelPrinciples:['arrive'],
      organisationNeedsReview:true,
      organisationSource:'auto-v4'
    }] };
    const merged = mergeManualTagDecisionsIntoCloud(cloud);
    const practice = merged.practices[0];
    assert.equal(practice.gameContext,'build-out');
    assert.equal(practice.practicePurpose,'recognise');
    assert.equal(practice.practiceFormat,'possession-box');
    assert.equal(practice.primaryGameModelPrinciple,'arrive');
    assert.deepEqual(practice.gameModelPrinciples,['arrive','move-free']);
    assert.equal(practice.organisationNeedsReview,false);
    assert.equal(practice.organisationSource,'manual');
    assert.equal(practice.manualTagPersistenceVersion,PRACTICE_TAG_PERSISTENCE_VERSION);
  });
});

test('an explicit no-principle decision stays out of Needs Review', () => {
  const practice = {
    id:'A-TECH',
    primaryGameModelPrinciple:'arrive',
    gameModelPrinciples:['arrive'],
    suggestedGameModelPrinciples:['move-free'],
    organisationNeedsReview:true
  };
  applyStoredDecision(practice,{
    gameContext:'player-development',
    practicePurpose:'prepare',
    practiceFormat:'passing-activation',
    primaryPrincipleId:'',
    supportingPrincipleIds:[],
    updatedAt:456
  });
  assert.equal(practice.primaryGameModelPrinciple,'');
  assert.deepEqual(practice.gameModelPrinciples,[]);
  assert.equal(practice.noGameModelPrinciple,true);
  assert.deepEqual(practice.suggestedGameModelPrinciples,[]);
  assert.equal(practice.organisationNeedsReview,false);
  assert.equal(practice.organisationConfidence,'manual');
});

test('stored decisions are reapplied to the current database after an async overwrite', () => {
  withLocalStorage({
    [PRACTICE_TAG_DECISIONS_KEY]:JSON.stringify({
      'SP-2':{
        gameContext:'create-finish',
        practicePurpose:'transfer',
        practiceFormat:'conditioned-game',
        primaryPrincipleId:'behind-beneath',
        supportingPrincipleIds:[],
        updatedAt:789
      }
    })
  },() => {
    const data = { practices:[{ id:'SP-2', organisationNeedsReview:true, organisationSource:'auto-v4' }] };
    assert.equal(applyStoredDecisionsToData(data),1);
    assert.equal(data.practices[0].primaryGameModelPrinciple,'behind-beneath');
    assert.equal(data.practices[0].organisationNeedsReview,false);
    assert.equal(applyStoredDecisionsToData(data),0);
  });
});

test('persistence patch protects both incoming cloud loads and outgoing cloud saves', () => {
  assert.match(source,/cloud\.listen = function/);
  assert.match(source,/mergeManualTagDecisionsIntoCloud\(cloudDoc\.data\)/);
  assert.match(source,/cloud\.save = async function/);
  assert.match(source,/mergeManualTagDecisionsIntoCloud\(data\)/);
  assert.match(source,/setInterval\(\(\)=>/);
});

test('refresh persistence starts before the auto organiser is allowed to run', () => {
  const start = sessionState.indexOf("import('./practice-tag-persistence-v6.js')");
  const awaitPersistence = sessionState.indexOf('practiceTagPersistenceReady');
  const organiser = sessionState.indexOf("import('./practice-library-auto-organiser-v4.js')");
  assert.ok(start >= 0 && awaitPersistence >= 0 && organiser > awaitPersistence);
});
