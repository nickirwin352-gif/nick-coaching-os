import test from 'node:test';
import assert from 'node:assert/strict';
import { GAME_MODEL_PRINCIPLES, GAME_SUB_PRINCIPLES } from '../src/game-model-core.js';
import { BANK_KINDS, SUB_PRACTICE_SUGGESTIONS, buildPrincipleWordBanks, resolveBankContext } from '../src/principle-word-bank-data.js';
import { renderBank, toggleSuggestion, wrapSupportingList, SUPPORTING_LISTS } from '../src/principle-word-banks.js';

test('all nine principles and 27 sub-principles have complete relevant banks',()=>{
  assert.equal(Object.keys(SUB_PRACTICE_SUGGESTIONS).length,27);
  for(const main of GAME_MODEL_PRINCIPLES){
    for(const sub of main.subPrinciples){
      const bank=buildPrincipleWordBanks({principleIds:[main.id],subPrincipleIds:[sub.id]});
      for(const kind of Object.keys(BANK_KINDS))assert.ok(bank[kind].length,`${sub.id}: ${kind}`);
      assert.deepEqual(bank.cp,[sub.description]);
      assert.ok(bank.links[0].includes(main.message));
      for(const other of main.subPrinciples.filter(x=>x.id!==sub.id))assert.ok(!bank.cp.includes(other.description));
    }
  }
});

test('phase and principle changes remove stale sub-principle suggestions',()=>{
  const context={principleIds:['screen-shuffle-squeeze'],subPrincipleIds:['create-separation'],phaseIds:['out-of-possession']};
  const resolved=resolveBankContext(context);
  assert.equal(resolved.subs.length,0);
  const bank=buildPrincipleWordBanks(context);
  assert.equal(bank.cp.length,3);
  assert.ok(bank.cp.every(text=>!text.includes('Move to lose')));
  assert.deepEqual(resolveBankContext({...context,phaseIds:['in-possession']}),{principles:[],subs:[]});
  assert.equal(resolveBankContext({subPrincipleIds:['create-separation']}).principles[0].id,'arrive-affect-away');
});

test('empty selection and explicit no-link never fall back to unrelated theme text',()=>{
  for(const context of [{},{principleIds:['not-real']},{principleIds:['arrive-affect-away'],noGameModelLink:true}]){
    assert.ok(Object.values(buildPrincipleWordBanks(context)).every(list=>list.length===0));
  }
});

test('custom banks are scoped and persisted values survive JSON storage',()=>{
  const custom=JSON.parse(JSON.stringify({
    'principle:arrive-affect-away':{cp:['Whole principle custom']},
    'sub:create-separation':{cp:['Personal separation cue'],reg:[]}
  }));
  const main={principleIds:['arrive-affect-away']};
  assert.deepEqual(buildPrincipleWordBanks(main,custom).cp,['Whole principle custom']);
  const sub=buildPrincipleWordBanks({...main,subPrincipleIds:['create-separation']},custom);
  assert.deepEqual(sub.cp,['Personal separation cue']);assert.deepEqual(sub.reg,[]);
  assert.ok(!buildPrincipleWordBanks({principleIds:['screen-shuffle-squeeze']},custom).cp.includes('Personal separation cue'));
});

test('clicking suggestions toggles only that line and preserves coach-written text',()=>{
  assert.equal(toggleSuggestion('My own coaching note','Create separation'),'My own coaching note\nCreate separation');
  assert.equal(toggleSuggestion('My own coaching note\nCreate separation','Create separation'),'My own coaching note');
});

test('bank refresh is idempotent and does not rewrite coach input when selection changes',()=>{
  const previousWindow=globalThis.window,previousDocument=globalThis.document;
  let subs=['create-separation'];let replacements=0;
  const input={value:'Keep my own note',hasAttribute:()=>true};
  const host={dataset:{},children:[],replaceChildren(){this.children=[];replacements++;},appendChild(child){this.children.push(child);}};
  const element=()=>({classList:{toggle(){}},setAttribute(){},addEventListener(type,fn){this[type]=fn;}});
  globalThis.window={db:{banks:{}}};
  globalThis.document={getElementById:id=>({cpChips:host,cp:input,fpeNoLink:{checked:false}}[id]||null),createElement:element,
    querySelectorAll:selector=>(selector.includes('data-fpe-principle')?['arrive-affect-away']:selector.includes('data-fpe-sub')?subs:['in-possession']).map(value=>({value}))};
  try{
    renderBank('cpChips');const count=replacements;
    renderBank('cpChips');assert.equal(replacements,count);
    subs=['move-after-action'];renderBank('cpChips');
    assert.equal(input.value,'Keep my own note');
    assert.equal(host.children[1].textContent,GAME_SUB_PRINCIPLES.find(s=>s.id==='move-after-action').description);
    assert.equal(renderBank('unrelated-list'),false);
  }finally{globalThis.window=previousWindow;globalThis.document=previousDocument;}
});

test('supporting wrappers preserve open state and exclude the browsing tools',()=>{
  assert.ok(!SUPPORTING_LISTS.some(([id])=>['fourPhasePracticeWorkbench','fourPhasePracticeFinder','visualPicker','sessionDrillList'].includes(id)));
  const details={open:true};
  assert.equal(wrapSupportingList({closest:()=>details},'Again'),false);
  assert.equal(details.open,true);
  assert.equal(wrapSupportingList({closest:()=>null,matches:()=>true},'Workbench'),false);
});
