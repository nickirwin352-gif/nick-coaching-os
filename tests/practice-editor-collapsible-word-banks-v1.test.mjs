import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { COLLAPSIBLE_WORD_BANKS, COLLAPSIBLE_WORD_BANKS_VERSION } from '../src/practice-editor-collapsible-word-banks-v1.js';

const source = await readFile(new URL('../src/practice-editor-collapsible-word-banks-v1.js', import.meta.url),'utf8');
const sessionState = await readFile(new URL('../src/session-state.js', import.meta.url),'utf8');

test('coaching points, progression and regression banks are collapsed', () => {
  assert.equal(COLLAPSIBLE_WORD_BANKS_VERSION,3);
  assert.deepEqual(COLLAPSIBLE_WORD_BANKS.map(item=>item.chipsId),['cpChips','progChips','regChips','condGameChips','objChips','linkChips','cueChips','reflectChips']);
});

test('word banks use explicit accessible buttons rather than native summary toggles',()=>{
  assert.match(source,/document\.createElement\('button'\)/);
  assert.match(source,/button\.type='button'/);
  assert.match(source,/aria-expanded/);assert.match(source,/aria-controls/);
  assert.doesNotMatch(source,/document\.createElement\('details'\)/);
});

test('practice changes reset once without delayed collapse racing a tap',()=>{
  assert.match(source,/editPractice/);assert.match(source,/newPractice/);
  assert.match(source,/resetBanks\(\)/);
  assert.doesNotMatch(source,/setTimeout\([^\n]*collapsePracticeWordBanks/);
});

test('compact bank patch loads after the four-phase practice system', () => {
  const fourPhase = sessionState.indexOf("import('./four-phase-practice-system-v1.js?v=personal-model-1')");
  const banks = sessionState.indexOf("import('./practice-editor-collapsible-word-banks-v1.js?v=ios-banks-1')");
  assert.ok(fourPhase >= 0 && banks > fourPhase);
});


test('open-close state stays coherent and does not modify suggestion content',async()=>{
  const {setBankExpanded}=await import('../src/practice-editor-collapsible-word-banks-v1.js');
  const attributes={};const button={setAttribute:(k,v)=>attributes[k]=v};
  const panel={hidden:true,content:'Keep this coaching cue'};
  const wrapper={querySelector:q=>q==='.bankDisclosureButton'?button:panel};
  assert.equal(setBankExpanded(wrapper,true),true);assert.equal(panel.hidden,false);assert.equal(attributes['aria-expanded'],'true');
  setBankExpanded(wrapper,true);assert.equal(panel.hidden,false);
  setBankExpanded(wrapper,false);assert.equal(panel.hidden,true);assert.equal(attributes['aria-expanded'],'false');assert.equal(panel.content,'Keep this coaching cue');
});
