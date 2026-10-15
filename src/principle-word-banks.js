import {TECHNICAL_TOPICS} from './personal-coaching-model.js?v=bank-fix-1';
import { GAME_MODEL_PRINCIPLES, principleById } from './game-model-core.js?v=personal-model-1';
import { BANK_KINDS, buildPrincipleWordBanks, resolveBankContext } from './principle-word-bank-data.js?v=bank-fix-1';
import { ensureCollapsibleWordBanks } from './practice-editor-collapsible-word-banks-v1.js?v=principle-banks-3';

const BANK_TARGETS={practiceCueChips:['cues','practiceDeliveryCues','practice'],cpChips:['cp','cp','practice'],progChips:['prog','prog','practice'],regChips:['reg','reg','practice'],condGameChips:['cond','condRules','practice'],objChips:['obj','objective','session'],linkChips:['links','links','session'],cueChips:['cues','cues','session'],reflectChips:['reflect','reflect','session'],gmSuccessChips:['obj','gmSuccessLooksLike','session']};
const field=id=>document.getElementById(id);
function appDb(){try{return typeof db!=='undefined'?db:window.db;}catch(_){return window.db;}}
function selected(selector){return [...document.querySelectorAll(selector)].map(el=>el.value);}
function contextFor(scope){
  if(scope==='practice')return {
    principleIds:selected('#fourPhasePracticeEditor [data-fpe-principle] input:checked'),
    subPrincipleIds:selected('#fourPhasePracticeEditor [data-fpe-sub] input:checked'),
    phaseIds:selected('#fourPhasePracticeEditor [data-fpe-phase] input:checked'),
    noGameModelLink:field('fpeNoLink')?.checked===true,
    practicePurpose:field('fpePurpose')?.value,practiceFormat:field('fpeFormat')?.value,technicalTopic:field('technicalBankTopic')?.value,
    passingFundamentals:selected('#fourPhasePracticeEditor [data-fpe-fundamental] input:checked')
  };
  const plan=window.NickFourPhaseGameModel?.currentPlan?.()||{};
  return {principleIds:[plan.primaryPrincipleId].filter(Boolean),subPrincipleIds:plan.subPrincipleIds||[],phaseIds:[plan.gamePhase].filter(Boolean)};
}
export function toggleSuggestion(value,text){
  const lines=String(value||'').split('\n');
  return lines.some(line=>line.trim()===text)?lines.filter(line=>line.trim()!==text).join('\n'):[value,text].filter(Boolean).join('\n');
}
export function applySuggestion(target,text){
  // Editors can replace their fields: resolve the live node at click time.
  const input=field(target);if(!input)return false;
  input.value=toggleSuggestion(input.value,text);
  input.dispatchEvent(new Event('input',{bubbles:true}));
  input.dispatchEvent(new Event('change',{bubbles:true}));
  return true;
}
export function renderBank(id){
  const spec=BANK_TARGETS[id];if(!spec)return false;
  const host=field(id);if(!host)return true;
  const [kind,target,scope]=spec;
  const context=contextFor(scope);
  const values=buildPrincipleWordBanks(context,appDb()?.banks?.principleWordBanks||{},[...(appDb()?.practices||[]),...(appDb()?.sessions||[]).map(s=>({...s,gameModelPhaseIds:[s.gameModelPlan?.gamePhase].filter(Boolean),gameModelPrincipleIds:[s.gameModelPlan?.primaryPrincipleId].filter(Boolean),gameModelSubPrincipleIds:s.gameModelPlan?.subPrincipleIds||[],deliveryCues:s.cues}))])[kind];
  const resolved=resolveBankContext(context);
  const names=resolved.subs.length?resolved.subs.map(x=>x.title):resolved.principles.map(x=>x.message);
  const input=field(target);
  if(input&&!input.hasAttribute('aria-label'))input.setAttribute('aria-label',BANK_KINDS[kind]);
  const signature=JSON.stringify([values,names,input?.value||'',context.noGameModelLink]);
  if(host.dataset.principleBankSignature===signature)return true;
  host.dataset.principleBankSignature=signature;
  const moreOpen=host.querySelector?.('details.bankMore')?.open||false;
  host.replaceChildren();
  const note=document.createElement('p');note.className='small principleBankContext';
  note.textContent=names.length?names.join(' · '):context.noGameModelLink?'Technical bank · '+(TECHNICAL_TOPICS[context.technicalTopic]?.label||'matched to your practice format'):'Choose a phase or principle above to see relevant suggestions.';
  host.appendChild(note);
  let more;
  if(values.length>8){
    more=document.createElement('details');more.className='bankMore';more.open=moreOpen;
    const summary=document.createElement('summary');summary.textContent=`More suggestions (${values.length-8})`;more.appendChild(summary);
  }
  for(const [index,text] of values.entries()){
    const button=document.createElement('button');button.type='button';button.className='chip';button.textContent=text;
    const chosen=String(input?.value||'').split('\n').some(line=>line.trim()===text);
    button.setAttribute('aria-pressed',String(chosen));button.classList.toggle('on',chosen);
    button.addEventListener('click',()=>{
      if(!applySuggestion(target,text))return;
      renderBank(id);
      if(scope==='session')window.renderPreview?.();
    });
    (index<8?host:more).appendChild(button);
  }
  if(more)host.appendChild(more);
  return true;
}

// Explicit targets avoid collapsing either of the two primary browsing tools.
export const SUPPORTING_LISTS=Object.freeze([
  ['personalLanguageCard','My previous coaching language'],['fpePhases','Choose phases'],['fpePrinciples','Choose main principles'],['fpeSubs','Choose sub-principles'],
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
  const cueInput=field('practiceDeliveryCues');
  if(cueInput&&!field('practiceCueChips')){
    const host=document.createElement('div');host.id='practiceCueChips';host.className='chips';
    cueInput.before(host);wrapSupportingList(host,'Short delivery cue suggestions');
  }
  const editor=field('fourPhasePracticeEditor');
  if(editor&&!field('technicalBankTopic')){
    const box=document.createElement('div');box.id='technicalBankChoice';
    const label=document.createElement('label');label.htmlFor='technicalBankTopic';label.textContent='Technical word bank';
    const select=document.createElement('select');select.id='technicalBankTopic';select.append(option('','Match practice format'));
    Object.entries(TECHNICAL_TOPICS).forEach(([id,t])=>select.append(option(id,t.label)));
    box.append(label,select);editor.append(box);
  }
  if(field('technicalBankChoice'))field('technicalBankChoice').hidden=!field('fpeNoLink')?.checked;
  ensureSuccessBank();
  for(const id of Object.keys(BANK_TARGETS))renderBank(id);
  const rules=field('condRulesBlock');if(rules)rules.style.display='block';
  ensureCollapsibleWordBanks();ensureSupportingLists();
}
function fillBlank(scope){
  const banks=buildPrincipleWordBanks(contextFor(scope),appDb()?.banks?.principleWordBanks||{});
  let changed=0;
  for(const [, [kind,target,bankScope]] of Object.entries(BANK_TARGETS)){
    if(bankScope!==scope)continue;
    const input=field(target);
    if(!input||input.value.trim()||!banks[kind].length)continue;
    input.value=banks[kind].slice(0,kind==='cp'?4:2).join('\n');
    input.dispatchEvent(new Event('input',{bubbles:true}));changed++;
  }
  refresh();window.renderPreview?.();return changed;
}
function option(value,text){const item=document.createElement('option');item.value=value;item.textContent=text;return item;}
export function createBankDrafts(){
  const drafts=new Map();
  return {
    put:(key,value)=>drafts.set(key,{...value}),
    get:key=>drafts.has(key)?{...drafts.get(key)}:null,
    hasAny:()=>drafts.size>0,
    clearIfUnchanged(key,snapshot){if(JSON.stringify(drafts.get(key))===JSON.stringify(snapshot))drafts.delete(key);}
  };
}
function installManager(){
  const view=field('wordbank');if(!view||field('principleBankManager'))return;
  const legacy=view.querySelector('.grid.three');
  if(legacy)legacy.hidden=true; // Retired fallback UI; saved historical data remains intact.
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
  const drafts=createBankDrafts();
  let activeScope='';
  const values=()=>Object.fromEntries(Object.entries(inputs).map(([key,input])=>[key,input.value]));
  for(const input of Object.values(inputs))input.addEventListener('input',()=>{
    drafts.put(activeScope,values());
    field('principleBankSaveStatus').textContent='Draft kept for this selection. Save to apply your changes.';
  });
  window.addEventListener('beforeunload',event=>{if(drafts.hasAny()){event.preventDefault();event.returnValue='';}});
  const scope=()=>sub.value?`sub:${sub.value}`:`principle:${main.value}`;
  const load=()=>{
    const banks=buildPrincipleWordBanks({principleIds:[main.value],subPrincipleIds:sub.value?[sub.value]:[]},appDb()?.banks?.principleWordBanks||{});
    activeScope=scope();
    const draft=drafts.get(activeScope);
    for(const key of Object.keys(inputs))inputs[key].value=draft?.[key]??banks[key].join('\n');
    field('principleBankSaveStatus').textContent=draft?'Unsaved draft restored for this selection.':'';
  };
  const loadSubs=()=>{sub.replaceChildren(option('','Whole principle'));principleById(main.value).subPrinciples.forEach(item=>sub.append(option(item.id,item.title)));load();};
  main.addEventListener('change',loadSubs);sub.addEventListener('change',load);loadSubs();
  window.addEventListener('coaching:data',()=>{if(!drafts.get(activeScope))load();refresh();});
  field('savePrincipleBanks').addEventListener('click',async()=>{
    const data=appDb();if(!data)return;
    const savedScope=activeScope;const savedDraft=values();
    data.banks ||= {};data.banks.principleWordBanks ||= {};
    data.banks.principleWordBanks[savedScope]=Object.fromEntries(Object.entries(inputs).map(([key,input])=>[key,[...new Set(input.value.split('\n').map(x=>x.trim()).filter(Boolean))]]));
    const status=field('principleBankSaveStatus');
    try{
      await window.store();
      drafts.clearIfUnchanged(savedScope,savedDraft);
      if(activeScope===savedScope)status.textContent=drafts.get(savedScope)?'Earlier changes saved. Your newer edits are still a draft.':'Word banks saved on this device. See the top bar for cloud sync status.';
      refresh();
    }
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
  window.NickPrincipleWordBanks=Object.freeze({refresh,renderBank,ensureSupportingLists,fillBlank});
  installManager();refresh();
  document.addEventListener('change',event=>{if(event.target.closest?.('#fourPhasePracticeEditor'))refresh();});
  document.addEventListener('input',event=>{for(const [id,[,target]] of Object.entries(BANK_TARGETS))if(event.target.id===target)renderBank(id);});
  // No DOM observers: refresh only after explicit selection, rendering or navigation.
  document.addEventListener('click',event=>{if(event.target.closest?.('.tab,[onclick*="showBuildRoute"]'))setTimeout(refresh,0);});
}
if(typeof window!=='undefined'&&typeof document!=='undefined'){
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
}
