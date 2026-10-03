import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';

const clarity = await readFile(new URL('../src/four-phase-builder-clarity-v2.js',import.meta.url),'utf8');
const dashboard = await readFile(new URL('../src/review-diagram-ten-scale.js',import.meta.url),'utf8');

test('builder label observer settles instead of starving navigation', () => {
  let observing = false;
  let pending = false;
  let callback;
  let writes = 0;
  const element = (initial='') => {
    let value = initial;
    return {
      get textContent(){return value;},
      set textContent(next){value=next;writes++;if(observing)pending=true;},
      setAttribute(){}, querySelectorAll(){return [];}
    };
  };
  const fields = {fourPhaseBuilderClarityV2Styles:{}, advancedBuilder:{}};
  for(const id of ['pickActivation','pickSkill','pickTactical','pickConditioned']) fields[id]=element('Legacy');
  for(const id of ['plannerStage','stage','filterStage']) fields[id]={options:[Object.assign(element('Activation'),{value:'Activation'})]};
  const context = vm.createContext({
    window:{}, document:{readyState:'complete',getElementById:id=>fields[id]||null,addEventListener(){}},
    setTimeout(){}, MutationObserver:class {
      constructor(fn){callback=fn;}
      observe(){observing=true;}
      disconnect(){observing=false;}
    }
  });
  vm.runInContext(clarity.replaceAll('export ',''),context);
  pending=true;
  let rounds=0;
  while(pending && rounds<20){pending=false;callback();rounds++;}
  assert.equal(pending,false,'observer must settle so clicks and timers can run');
  const stableWrites=writes;
  vm.runInContext('window.NickFourPhaseBuilderClarity.ensure()',context);
  assert.equal(writes,stableWrites,'an unchanged builder must not emit more text mutations');
  assert.equal(fields.pickActivation.textContent,'Prepare');
  // External rerenders still restore the desired labels.
  fields.pickActivation.textContent='Activation';
  pending=false;callback();
  assert.equal(fields.pickActivation.textContent,'Prepare');
});

test('dashboard score decoration does not schedule itself forever', () => {
  let writes=0;
  let html='average effectiveness <b>4/5</b>';
  const paragraph={textContent:'average effectiveness 4/5',get innerHTML(){return html;},set innerHTML(value){html=value;writes++;}};
  const card={querySelector:selector=>selector==='[data-progress]'?{dataset:{progress:'p1'}}:paragraph};
  const context=vm.createContext({document:{readyState:'loading',addEventListener(){},querySelector:()=>({querySelectorAll:()=>[card]})},window:{db:{sessions:[{review:{scoreScale:10,practices:[{practiceId:'p1',effectiveness:8}]}}]}}});
  vm.runInContext(dashboard.replaceAll('export ',''),context);
  vm.runInContext('patchDashboardScores()',context);
  const initialWrites=writes;
  vm.runInContext('patchDashboardScores()',context);
  assert.equal(writes,initialWrites,'unchanged scores must not recreate observed DOM');
  assert.match(html,/8\.0\/10/);
});
