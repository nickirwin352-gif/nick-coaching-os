import { GAME_MODEL_PRINCIPLES, principleById } from './game-model-core.js';
import { BANK_KINDS, buildPrincipleWordBanks, resolveBankContext } from './principle-word-bank-data.js';
import { ensureCollapsibleWordBanks } from './practice-editor-collapsible-word-banks-v1.js';

const BANK_TARGETS={cpChips:['cp','cp','practice'],progChips:['prog','prog','practice'],regChips:['reg','reg','practice'],condGameChips:['cond','condRules','practice'],objChips:['obj','objective','session'],linkChips:['links','links','session'],cueChips:['cues','cues','session'],reflectChips:['reflect','reflect','session'],gmSuccessChips:['obj','gmSuccessLooksLike','session']};
const field=id=>document.getElementById(id);
function appDb(){try{return typeof db!=='undefined'?db:window.db;}catch(_){return window.db;}}
function selected(selector){return [...document.querySelectorAll(selector)].map(el=>el.value);}
function contextFor(scope){
  if(scope==='practice')return {
    principleIds:selected('#fourPhasePracticeEditor [data-fpe-principle] input:checked'),
    subPrincipleIds:selected('#fourPhasePracticeEditor [data-fpe-sub] input:checked'),
    phaseIds:selected('#fourPhasePracticeEditor [data-fpe-phase] input:checked'),
    noGameModelLink:field('fpeNoLink')?.checked===true
  };
  const plan=window.NickFourPhaseGameModel?.currentPlan?.()||{};
  return {principleIds:[plan.primaryPrincipleId].filter(Boolean),subPrincipleIds:plan.subPrincipleIds||[],phaseIds:[plan.gamePhase].filter(Boolean)};
}
export function toggleSuggestion(value,text){
  const lines=String(value||'').split('\n');
  return lines.some(line=>line.trim()===text)?lines.filter(line=>line.trim()!==text).join('\n'):[value,text].filter(Boolean).join('\n');
}
export function renderBank(id){
  const spec=BANK_TARGETS[id];if(!spec)return false;
  const host=field(id);if(!host)return true;
  const [kind,target,scope]=spec;
  const context=contextFor(scope);
  const values=buildPrincipleWordBanks(context,appDb()?.banks?.principleWordBanks||{})[kind];
  const resolved=resolveBankContext(context);
  const names=resolved.subs.length?resolved.subs.map(x=>x.title):resolved.principles.map(x=>x.message);
  const input=field(target);
  if(input&&!input.hasAttribute('aria-label'))input.setAttribute('aria-label',BANK_KINDS[kind]);
  const signature=JSON.stringify([values,names,input?.value||'',context.noGameModelLink]);
  if(host.dataset.principleBankSignature===signature)return true;
  host.dataset.principleBankSignature=signature;
  host.replaceChildren();
  const note=document.createElement('p');note.className='small principleBankContext';
  note.textContent=names.length?names.join(' · '):context.noGameModelLink?'No Game Model link selected — write your own suggestions below.':'Choose a main principle above to see relevant suggestions.';
  host.appendChild(note);
  for(const text of values){
    const button=document.createElement('button');button.type='button';button.className='chip';button.textContent=text;
    const chosen=String(input?.value||'').split('\n').some(line=>line.trim()===text);
    button.setAttribute('aria-pressed',String(chosen));button.classList.toggle('on',chosen);
    button.addEventListener('click',()=>{
      if(!input)return;
      input.value=toggleSuggestion(input.value,text);
      input.dispatchEvent(new Event('input',{bubbles:true}));
      renderBank(id);
      if(scope==='session')window.renderPreview?.();
    });
    host.appendChild(button);
  }
  return true;
}

// Explicit targets avoid collapsing either of the two primary browsing tools.
export const SUPPORTING_LISTS=Object.freeze([
  ['fpePhases','Choose phases'],['fpePrinciples','Choose main principles'],['fpeSubs','Choose sub-principles'],
  ['gmSubPrinciplePicker','Choose sub-principles'],['favList','Favourite practices'],
  ['practiceList','Legacy practice list'],['blueprintList','Saved blueprints'],
  ['recentSessionList','Previous sessions'],['archiveList','Sessions on the selected date']
]);
export function wrapSupportingList(element,label){
  if(!element||element.closest('details.principleCompactList'))return false;
  if(element.matches('#fourPhasePracticeWorkbench,#fourPhasePracticeFinder,#visualPicker')||element.querySelector('#fourPhasePracticeWorkbench,#fourPhasePracticeFinder,#visualPicker'))return false;
  const details=document.createElement('details');details.className='principleCompactList';
  const summary=document.createElement('summary');summary.textContent=label;
  element.parentNode.insertBefore(details,element);details.append(summary,element);
  return true;
}
export function ensureSupportingLists(){
  for(const [id,label] of SUPPORTING_LISTS)wrapSupportingList(field(id),label);
  document.querySelectorAll('#gameModel .fpPhaseSection').forEach(section=>wrapSupportingList(section.querySelector('.fpPrincipleGrid'),'Principles and coaching detail'));
}
function ensureSuccessBank(){
  const input=field('gmSuccessLooksLike');if(!input||field('gmSuccessChips'))return;
  const host=document.createElement('div');host.id='gmSuccessChips';host.className='chips';input.before(host);
  // Keep the editable success target visible; only suggestions are collapsible.
  wrapSupportingList(host,'Learning objective suggestions');
}
export function refresh(){
  ensureSuccessBank();
  for(const id of Object.keys(BANK_TARGETS))renderBank(id);
  const rules=field('condRulesBlock');if(rules)rules.style.display='block';
  ensureCollapsibleWordBanks();ensureSupportingLists();
}
function option(value,text){const item=document.createElement('option');item.value=value;item.textContent=text;return item;}
function installManager(){
  const view=field('wordbank');if(!view||field('principleBankManager'))return;
  const legacy=view.querySelector('.grid.three');
  wrapSupportingList(legacy,'Previous theme banks (reference only)');
  const panel=document.createElement('div');panel.className='card';panel.id='principleBankManager';
  panel.innerHTML='<h2>Principle Word Banks</h2><p class="small">Choose a principle, then optionally a sub-principle. Suggestions follow these choices in the practice editor and session builder. Edit one suggestion per line.</p><label for="principleBankMain">Main principle</label><select id="principleBankMain"></select><label for="principleBankSub">Sub-principle</label><select id="principleBankSub"></select><div id="principleBankFields"></div><button type="button" id="savePrincipleBanks">Save these word banks</button><p id="principleBankSaveStatus" role="status"></p>';
  view.prepend(panel);
  const main=field('principleBankMain');const sub=field('principleBankSub');
  GAME_MODEL_PRINCIPLES.forEach(item=>main.append(option(item.id,item.message)));
  const inputs={};
  for(const [key,label] of Object.entries(BANK_KINDS)){
    const details=document.createElement('details');details.className='principleCompactList';
    const summary=document.createElement('summary');summary.textContent=label;
    const input=document.createElement('textarea');input.setAttribute('aria-label',label+' suggestions');input.rows=5;inputs[key]=input;
    details.append(summary,input);field('principleBankFields').append(details);
  }
  const scope=()=>sub.value?`sub:${sub.value}`:`principle:${main.value}`;
  const load=()=>{
    const banks=buildPrincipleWordBanks({principleIds:[main.value],subPrincipleIds:sub.value?[sub.value]:[]},appDb()?.banks?.principleWordBanks||{});
    for(const key of Object.keys(inputs))inputs[key].value=banks[key].join('\n');
    field('principleBankSaveStatus').textContent='';
  };
  const loadSubs=()=>{sub.replaceChildren(option('','Whole principle'));principleById(main.value).subPrinciples.forEach(item=>sub.append(option(item.id,item.title)));load();};
  main.addEventListener('change',loadSubs);sub.addEventListener('change',load);loadSubs();
  field('savePrincipleBanks').addEventListener('click',async()=>{
    const data=appDb();if(!data)return;
    data.banks ||= {};data.banks.principleWordBanks ||= {};
    data.banks.principleWordBanks[scope()]=Object.fromEntries(Object.entries(inputs).map(([key,input])=>[key,[...new Set(input.value.split('\n').map(x=>x.trim()).filter(Boolean))]]));
    const status=field('principleBankSaveStatus');
    try{await window.store();status.textContent='Word banks saved.';refresh();}
    catch(error){status.textContent='Could not finish saving. Please retry.';console.error('Principle bank save failed',error);}
  });
}
function install(){
  const style=document.createElement('style');style.textContent=`
    .principleCompactList{border:1px solid var(--border-soft);border-radius:12px;margin:8px 0;background:var(--surface-2);padding:0 10px}
    .principleCompactList>summary{cursor:pointer;padding:11px 0;font-weight:800;font-size:12px;color:var(--text)}
    .principleCompactList[open]>summary{margin-bottom:8px;border-bottom:1px solid var(--border-soft)}
    .principleBankContext{flex-basis:100%;margin:3px 0 7px}.chips button.chip{white-space:normal;text-align:left}
    .chips button.chip[aria-pressed="true"]{border-color:var(--turf);background:var(--turf-dim)}
    @media print{details.principleCompactList>summary{display:none}details.principleCompactList>*:not(summary){display:block}}
  `;document.head.appendChild(style);
  window.NickPrincipleWordBanks=Object.freeze({refresh,renderBank,ensureSupportingLists});
  installManager();refresh();
  document.addEventListener('input',event=>{for(const [id,[,target]] of Object.entries(BANK_TARGETS))if(event.target.id===target)renderBank(id);});
  // No DOM observers: refresh only after explicit selection, rendering or navigation.
  document.addEventListener('click',event=>{if(event.target.closest?.('.tab,[onclick*="showBuildRoute"]'))setTimeout(refresh,0);});
}
if(typeof window!=='undefined'&&typeof document!=='undefined'){
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
}
