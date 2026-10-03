import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import { createFilterState, filterPractices, hasActivePracticeFilters, sortWorkbenchPractices } from '../src/four-phase-practice-system-v1.js';

const drills=[
  {id:'new',name:'Z drill',practicePurpose:'transfer',createdAt:'2026-10-03T12:00:00Z',practiceFormat:'rondo'},
  {id:'old',name:'A drill',practicePurpose:'prepare',createdAt:'2026-10-01T12:00:00Z',updatedAt:'2026-10-04T12:00:00Z',practiceFormat:'rondo'},
  {id:'middle',name:'B drill',stage:'Skill Practice',createdAt:'2026-10-02T12:00:00Z',practiceFormat:'rondo'},
  {id:'execute',name:'C drill',practicePurpose:'execute',createdAt:'2026-10-02T13:00:00Z',practiceFormat:'wave'}
];

test('unfiltered workbench uses creation time, not name or last edit, without mutating the library',()=>{
  const original=[...drills];
  assert.deepEqual(sortWorkbenchPractices(drills).map(p=>p.id),['new','execute','middle','old']);
  assert.deepEqual(drills,original);
  assert.equal(hasActivePracticeFilters(createFilterState({search:'   '})),false);
});

test('every active filter type enables purpose order; clearing restores newest first',()=>{
  for(const key of ['phases','principles','subPrinciples','purposes','formats']){
    const filters=createFilterState({[key]:['selected']});
    assert.deepEqual(sortWorkbenchPractices(drills,filters).map(p=>p.id),['old','middle','execute','new']);
    filters[key].clear();
    assert.equal(sortWorkbenchPractices(drills,filters)[0].id,'new');
  }
  for(const seed of [{search:'drill'},{reviewOnly:true}]){
    assert.deepEqual(sortWorkbenchPractices(drills,createFilterState(seed)).map(p=>p.id),['old','middle','execute','new']);
  }
});

test('purpose ordering preserves strict matches and newest order within each purpose',()=>{
  const filters=createFilterState({formats:['rondo']});
  const matches=filterPractices([...drills,{...drills[1],id:'prepare-new',createdAt:'2026-10-03T13:00:00Z'}],filters);
  assert.deepEqual(sortWorkbenchPractices(matches,filters).map(p=>p.id),['prepare-new','old','middle','new']);
});

test('undated legacy drills retain a deterministic reverse-library fallback',()=>{
  const data=[{id:'first'},{id:'last',createdAt:'invalid'},{id:'dated',addedAt:'2026-10-01'}];
  assert.deepEqual(sortWorkbenchPractices(data).map(p=>p.id),['dated','last','first']);
});

const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
const save=html.match(/savePractice=async function\(\)\{[\s\S]*?\n\};/)[0];
async function saveFixture(existing,oldId=''){
  const context={db:{practices:existing},practiceDiagramStepsDraft:[{diagram:[],pitchMode:'full'}],diagram:[],pitchMode:'full',
    dsClone:value=>JSON.parse(JSON.stringify(value)),dsNormaliseObject:value=>value,dsRenderEditorPreview(){},alert(){},store:async()=>{}};
  for(const name of ['pid','pname','theme','stage','players','time','area','desc','prog','reg','cp','condRules','oldId'])context[name]={value:''};
  context.pid.value='saved';context.pname.value='Saved drill';context.oldId.value=oldId;
  vm.createContext(context);vm.runInContext(save,context);await context.savePractice();
  return context.db.practices.find(p=>p.id==='saved');
}

test('saving new drills records creation time; editing or renaming preserves it',async()=>{
  const fresh=await saveFixture([]);
  assert.ok(Number.isFinite(Date.parse(fresh.createdAt)));
  const edited=await saveFixture([{id:'old-id',name:'Original',createdAt:'2025-01-01T12:00:00Z'}],'old-id');
  assert.equal(edited.createdAt,'2025-01-01T12:00:00Z');
  const legacy=await saveFixture([{id:'old-id',name:'Original'}],'old-id');
  assert.equal(legacy.createdAt,undefined,'editing an undated drill must not invent a new creation date');
});
