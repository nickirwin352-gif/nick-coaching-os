import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {cloudSaveFeedback} from '../src/cloud-save-feedback.js';
import {SUB_DELIVERY_CUES,buildPrincipleWordBanks} from '../src/principle-word-bank-data.js';
import {GAME_SUB_PRINCIPLES} from '../src/game-model-core.js';
import {createBankDrafts} from '../src/principle-word-banks.js';
import {calibrateStudioPitch} from '../src/ios-diagram-calibration-v3.js';

test('only confirmed cloud saves claim a backup; failures and local saves do not',()=>{
  for(const text of ['Firebase save failed','Firebase not available','Saved locally · cloud retry pending','Saved locally · syncing…','Firebase connected','Connecting to Firebase...']){
    assert.notEqual(cloudSaveFeedback(text).main,'Saved everywhere',text);
  }
  assert.equal(cloudSaveFeedback('Saved to Firebase').main,'Saved everywhere');
  assert.equal(cloudSaveFeedback('Saved to Firebase',false).state,'error');
  assert.equal(cloudSaveFeedback('Saved locally · syncing…').state,'syncing');
  assert.equal(cloudSaveFeedback('Firebase save failed').state,'error');
});
test('all sub-principles have brief, scoped delivery cues',()=>{
  assert.equal(Object.keys(SUB_DELIVERY_CUES).length,27);
  for(const sub of GAME_SUB_PRINCIPLES){
    const cues=buildPrincipleWordBanks({subPrincipleIds:[sub.id]}).cues;
    assert.deepEqual(cues,SUB_DELIVERY_CUES[sub.id]);
    assert.ok(cues.length>=3);
    assert.ok(cues.every(cue=>cue.split(/\s+/).length<=2&&cue.length<20));
    assert.ok(!cues.includes(sub.description));
  }
});
test('switching word-bank scopes retains each draft and saves cannot erase newer edits',()=>{
  const drafts=createBankDrafts();
  const a={cp:'Separate',cues:'Explode'},b={cp:'Compact',cues:'Shift'};
  drafts.put('principle:a',a);drafts.put('sub:b',b);
  assert.deepEqual(drafts.get('principle:a'),a);
  drafts.put('principle:a',{...a,cues:'Disguise'});
  drafts.clearIfUnchanged('principle:a',a);
  assert.equal(drafts.get('principle:a').cues,'Disguise');
  drafts.clearIfUnchanged('sub:b',b);
  assert.equal(drafts.get('sub:b'),null);
  assert.ok(drafts.hasAny());
});
test('diagram calibration rejects animation timestamps and schedules without forwarding them',()=>{
  assert.equal(calibrateStudioPitch(123.45),false);
  const selectors=[];
  assert.equal(calibrateStudioPitch({querySelector:id=>(selectors.push(id),null),querySelectorAll:()=>[]}),true);
  assert.equal(selectors.length,2);
  const source=fs.readFileSync(new URL('../src/ios-diagram-calibration-v3.js',import.meta.url),'utf8');
  assert.ok(!source.includes('requestAnimationFrame(calibrateStudioPitch)'));
});
