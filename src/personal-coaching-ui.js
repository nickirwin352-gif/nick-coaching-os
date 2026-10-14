import {GAME_MODEL_PRINCIPLES,principleById,subPrincipleById} from './game-model-core.js?v=personal-model-1';
import {DELIVERY_FIELDS,principleDelivery,PERSONAL_POINTS,TECHNICAL_TOPICS} from './personal-coaching-model.js';
import {BANK_KINDS,buildPrincipleWordBanks} from './principle-word-bank-data.js?v=personal-model-1';
const field=id=>document.getElementById(id);
const data=()=>{try{return db;}catch{return window.db;}};
function element(tag,text){const el=document.createElement(tag);if(text)el.textContent=text;return el;}
function scopeDetail(main,sub){
 const saved=data()?.banks?.principleDelivery||{};
 const base=principleDelivery(main,saved);
 return sub?{...base,action:(PERSONAL_POINTS[sub]||[]).join(' · '),...(saved[`sub:${sub}`]||{})}:base;
}
const editors=new Map();
function makeEditor(host,mainId,subId=''){
 editors.set(host,{mainId,subId});host.dataset.edited='false';
 host.replaceChildren();
 const key=subId?`sub:${subId}`:mainId;
 const note=element('p','Personal draft from your answers. Edit each part to describe one coherent decision. Saved edits take priority.');note.className='small';host.append(note);
 const inputs={};const draft=scopeDetail(mainId,subId);
 for(const [name,label] of Object.entries(DELIVERY_FIELDS)){
  const wrapper=element('label',label);const input=element('textarea');input.rows=3;input.value=draft[name]||'';input.addEventListener('input',()=>host.dataset.edited='true');input.setAttribute('aria-label',label);wrapper.append(input);host.append(wrapper);inputs[name]=input;
 }
 const status=element('p');status.setAttribute('role','status');
 const save=element('button','Save this decision');save.type='button';
 save.onclick=async()=>{
  const db=data();if(!db)return;db.banks||={};db.banks.principleDelivery||={};
  const snapshot=Object.fromEntries(Object.entries(inputs).map(([key,input])=>[key,input.value.trim()]));
  db.banks.principleDelivery[key]=snapshot;save.disabled=true;
  try{await window.store();status.textContent='Saved on this device. The top bar shows cloud sync status.';}
  catch{status.textContent='Could not finish saving. Your text is still here; retry.';}
  finally{save.disabled=false;}
 };
 host.append(save,status);
}
function install(){
 const view=field('wordbank');if(!view||field('personalModelDecisions'))return;
 const panel=element('details');panel.id='personalModelDecisions';panel.className='card principleCompactList';
 panel.append(element('summary','Your game model · triggers, actions, alternatives, roles and outcomes'));
 const intro=element('p','Your principle is the anchor. The short cue paints the picture; the detail explains when and why. Start with your own match evidence and review across several sessions.');panel.append(intro);
 const main=element('select');main.setAttribute('aria-label','Decision principle');const sub=element('select');sub.setAttribute('aria-label','Decision sub-principle');
 for(const p of GAME_MODEL_PRINCIPLES){const option=element('option',p.message);option.value=p.id;main.append(option);}
 const editor=element('div');panel.append(main,sub,editor);
 const load=()=>makeEditor(editor,main.value,sub.value);
 const loadSubs=()=>{sub.replaceChildren();const all=element('option','Whole principle');all.value='';sub.append(all);for(const s of principleById(main.value).subPrinciples){const o=element('option',s.title);o.value=s.id;sub.append(o);}load();};
 window.addEventListener('coaching:data',()=>{for(const [host,scope]of editors){if(host.isConnected&&host.dataset.edited!=='true')makeEditor(host,scope.mainId,scope.subId);}});
 // Keep unsaved text for each selection without writing it to the cloud.
 const drafts=new Map();let scope='';
 const remember=()=>{if(scope)drafts.set(scope,[...editor.querySelectorAll('textarea')].map(x=>x.value));};
 const restore=()=>{scope=main.value+':'+sub.value;const saved=drafts.get(scope);if(saved){[...editor.querySelectorAll('textarea')].forEach((x,i)=>x.value=saved[i]);editor.dataset.edited='true';}};
 main.onchange=()=>{remember();loadSubs();restore();};sub.onchange=()=>{remember();load();restore();};loadSubs();restore();view.prepend(panel);
 const definitions=element('details');definitions.className='principleCompactList';definitions.append(element('summary','Shared meanings & decisions still to test'));
 for(const text of [
  'Furthest available: the longest useful pass the picture permits; a player or an intentional space, never a forced clearance.',
  'Aggressive: decisive intent, fast arrival and strong fair contact; remain connected and protect the centre.',
  'Back foot: receiving-foot choice to enable the next action. Open body: body orientation when forward space is visible. They are different decisions.',
  'Bounce: draw pressure. 1–2: beat a defender. Third man: play through pressure using the next runner’s angle.',
  'Width: touchline threat. Height: vertical threat beyond. Depth: support behind the ball.',
  'Counterpress: affect a reachable loss with connected support. Recover when the opponent escapes and runs at the final block. A three- or five-second trial remains undecided.',
  'Touch rules: no compulsory maximum-touch limit by default. Your final mention of fixed touch limits needs clarification; optional pass counts can create repetitions but should not hide an open window.',
  'Spare: seek +1 behind the press. Stepping into a remaining 1v1 needs a deliberate risk decision; do not assume cover exists.',
  'Restarts and specialist goalkeeper work remain provisional drafts. Training numbers and age group belong to each session, not permanent model rules.',
  'Match transfer: look for repeated behaviour when the relevant picture occurs. No opportunity is not evidence of failure. Keep short notes or clips; review your setup and intervention first.'
 ])definitions.append(element('p',text));panel.append(definitions);
 const technical=element('details');technical.className='card principleCompactList';technical.append(element('summary','Technical banks · sessions without a game-model link'));
 const topic=element('select');topic.setAttribute('aria-label','Technical bank topic');for(const [id,t]of Object.entries(TECHNICAL_TOPICS)){const o=element('option',t.label);o.value=id;topic.append(o);}technical.append(topic);
 const bankHost=element('div');technical.append(bankHost);const bankInputs={};for(const [key,label]of Object.entries(BANK_KINDS)){const d=element('details');d.append(element('summary',label));const input=element('textarea');input.rows=4;input.setAttribute('aria-label',label+' technical suggestions');d.append(input);bankHost.append(d);bankInputs[key]=input;}
 const technicalDrafts=new Map();let activeTopic=topic.value;
 const loadBank=()=>{const banks=buildPrincipleWordBanks({noGameModelLink:true,technicalTopic:topic.value},data()?.banks?.principleWordBanks||{});for(const k of Object.keys(bankInputs))bankInputs[k].value=banks[k].join('\n');};
 topic.onchange=()=>{technicalDrafts.set(activeTopic,Object.fromEntries(Object.entries(bankInputs).map(([k,v])=>[k,v.value])));loadBank();activeTopic=topic.value;const draft=technicalDrafts.get(activeTopic);if(draft)for(const k of Object.keys(bankInputs))bankInputs[k].value=draft[k];};loadBank();const saveBank=element('button','Save technical bank');saveBank.type='button';const status=element('p');status.setAttribute('role','status');saveBank.onclick=async()=>{const db=data();if(!db)return;db.banks||={};db.banks.principleWordBanks||={};db.banks.principleWordBanks[`technical:${topic.value}`]=Object.fromEntries(Object.entries(bankInputs).map(([key,input])=>[key,[...new Set(input.value.split('\n').map(s=>s.trim()).filter(Boolean))]]));try{await window.store();status.textContent='Saved on this device. See the top bar for cloud sync.';window.NickPrincipleWordBanks?.refresh();}catch{status.textContent='Save failed. Your edits are still here.';}};technical.append(saveBank,status);panel.after(technical);
 function cards(){
  document.querySelectorAll('[data-delivery-principle]').forEach(card=>{
   if(card.querySelector('.personalDecision'))return;
   const mainId=card.dataset.deliveryPrinciple;const details=element('details');details.className='personalDecision principleCompactList';details.append(element('summary','When, how, who & what to observe'));
   const content=element('div');details.append(content);details.addEventListener('toggle',()=>{if(details.open&&!content.childElementCount)makeEditor(content,mainId);});card.append(details);
  });
 }
 cards();document.addEventListener('click',e=>{if(e.target.closest?.('.tab'))setTimeout(cards,0);});
}
if(typeof window!=='undefined')install();
