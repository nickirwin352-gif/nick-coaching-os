export const FOUR_PHASE_BUILDER_CLARITY_VERSION = 2;

const STYLE_ID='fourPhaseBuilderClarityV2Styles';
const PATH_ID='fourPhasePurposePathV2';

export const LEGACY_STAGE_TO_PURPOSE = Object.freeze({
  'Activation':'Prepare',
  'Skill Practice':'Recognise',
  'Tactical Practice':'Execute',
  'Conditioned Game':'Transfer'
});

function field(id){return document.getElementById(id);}
function appDb(){try{return typeof db!=='undefined'?db:window.db;}catch(_){return window.db;}}
function purposeLabelForStage(stage=''){return LEGACY_STAGE_TO_PURPOSE[String(stage||'')]||String(stage||'');}
function practiceById(id=''){
  try{if(typeof get==='function')return get(id);}catch(_){}
  return appDb()?.practices?.find(item=>String(item.id)===String(id))||null;
}
function plannerIds(){
  try{return Array.isArray(plannerDrills)?plannerDrills:[];}catch(_){return Array.isArray(window.plannerDrills)?window.plannerDrills:[];}
}
function practicePurposeLabel(practice={}){
  const id=String(practice.practicePurpose||'');
  const explicit={prepare:'Prepare',recognise:'Recognise',execute:'Execute',transfer:'Transfer'}[id];
  return explicit||purposeLabelForStage(practice.stage)||'Purpose';
}

function addStyles(){
  if(field(STYLE_ID))return;
  const style=document.createElement('style');style.id=STYLE_ID;
  style.textContent=`
    #${PATH_ID}{margin:0 0 12px;padding:10px 11px;border:1px solid rgba(52,211,153,.25);border-radius:12px;background:linear-gradient(135deg,rgba(52,211,153,.065),rgba(56,189,248,.025))}
    .fpPurposePathTitle{font-size:10px;font-weight:900;color:#dff8ed;margin-bottom:6px}.fpPurposePath{display:flex;gap:6px;align-items:center;flex-wrap:wrap}.fpPurposeStep{display:inline-flex;align-items:center;gap:5px;padding:5px 8px;border-radius:999px;border:1px solid rgba(52,211,153,.24);background:rgba(52,211,153,.06);font-size:9px;font-weight:850;color:#a7f3d0}.fpPurposeArrow{font-size:9px;color:var(--text-faint)}
    .fpPurposeHint{margin-top:6px;font-size:9px;color:var(--text-dim);line-height:1.4}
    #fourPhaseSessionPlan{order:-1}
    @media(max-width:620px){.fpPurposePath{gap:4px}.fpPurposeStep{font-size:8.5px;padding:5px 7px}}
  `;
  document.head.appendChild(style);
}

function reorderGameModelBeforeCueBank(){
  const advanced=field('advancedBuilder');
  const panel=field('fourPhaseSessionPlan');
  const cues=field('cues');
  if(!advanced||!panel||!cues)return;
  const details=cues.closest('.card');
  if(!details||!details.contains(panel))return;
  const dateTeamRow=[...details.children].find(el=>el.classList?.contains('row')&&el.querySelector('#sDate')&&el.querySelector('#team'));
  if(dateTeamRow && dateTeamRow.nextElementSibling!==panel)dateTeamRow.insertAdjacentElement('afterend',panel);
  const cueLabel=cues.previousElementSibling;
  if(cueLabel?.tagName==='LABEL')cueLabel.textContent="Coaching Cue Bank";
}

function relabelSelect(select){
  if(!select)return;
  [...select.options].forEach(option=>{
    const label=LEGACY_STAGE_TO_PURPOSE[option.value];
    if(label)option.textContent=label;
  });
}
function relabelPurposeControls(){
  const buttons=[
    ['pickActivation','Prepare','Activation → Prepare'],
    ['pickSkill','Recognise','Skill Practice → Recognise'],
    ['pickTactical','Execute','Tactical Practice → Execute'],
    ['pickConditioned','Transfer','Conditioned Game → Transfer']
  ];
  buttons.forEach(([id,label,title])=>{
    const button=field(id);if(!button)return;
    button.textContent=label;button.title=title;button.setAttribute('aria-label',title);
  });
  ['plannerStage','stage','filterStage'].forEach(id=>relabelSelect(field(id)));
  const visual=field('visualPicker');
  const card=visual?.closest('.card');
  if(card){
    const intro=[...card.querySelectorAll('p.small')].find(p=>/Pick a stage/i.test(p.textContent||''));
    if(intro)intro.textContent='Choose the practice purpose first. Format stays separate, so use Format when you want a particular session structure.';
  }
}

function ensurePurposePath(){
  const finder=field('fourPhasePracticeFinder');
  if(!finder||field(PATH_ID))return;
  const strip=document.createElement('div');strip.id=PATH_ID;
  strip.innerHTML=`<div class="fpPurposePathTitle">SESSION PURPOSE PATHWAY</div><div class="fpPurposePath"><span class="fpPurposeStep">Prepare</span><span class="fpPurposeArrow">→</span><span class="fpPurposeStep">Recognise</span><span class="fpPurposeArrow">→</span><span class="fpPurposeStep">Execute</span><span class="fpPurposeArrow">→</span><span class="fpPurposeStep">Transfer</span></div><div class="fpPurposeHint">Legacy stages now map to these four purposes. <b>Format is independent</b> — choose Rondo, Wave, Phase of Play, Conditioned Game, etc. only when the physical structure matters.</div>`;
  const head=finder.querySelector('.fpwHead');
  if(head)head.insertAdjacentElement('afterend',strip);else finder.prepend(strip);
  const description=finder.querySelector('.fpwHead p');
  if(description)description.textContent='Your session Phase, Main Principle and Sub-Principles start the search. Then choose the job of the practice today and, only if useful, the format you want.';
}

function decorateSessionRows(){
  const ids=plannerIds();
  ['sessionDrillList','currentSessionDrawerList'].forEach(boxId=>{
    const box=field(boxId);if(!box)return;
    [...box.querySelectorAll('.sessionDrillRow')].forEach((row,index)=>{
      const practice=practiceById(ids[index]);
      if(!practice)return;
      const firstPill=row.querySelector('.pill');
      if(firstPill){
        firstPill.textContent=practicePurposeLabel(practice);
        firstPill.dataset.purposeMapped='true';
      }
    });
  });
}
function replaceLeadingStageText(node,practice){
  if(!node||!practice)return;
  const label=practicePurposeLabel(practice);
  for(const child of [...node.childNodes]){
    if(child.nodeType!==Node.TEXT_NODE)continue;
    const current=child.nodeValue||'';
    const stage=String(practice.stage||'');
    if(stage&&current.includes(stage))child.nodeValue=current.replace(stage,label);
  }
}
function decoratePreview(){
  const preview=field('preview');if(!preview)return;
  const ids=plannerIds();
  [...preview.querySelectorAll('.practiceDetail')].forEach((detail,index)=>{
    const practice=practiceById(ids[index]);
    replaceLeadingStageText(detail.querySelector('h3'),practice);
  });
}

function wrapRenderer(name,after){
  let original;
  try{original=window[name]||eval(name);}catch(_){original=window[name];}
  if(typeof original!=='function'||original.__fourPhaseBuilderClarityV2)return;
  const wrapped=function(...args){
    const result=original.apply(this,args);
    try{after();}catch(_){}
    return result;
  };
  wrapped.__fourPhaseBuilderClarityV2=true;
  try{eval(name+' = wrapped');}catch(_){}
  window[name]=wrapped;
}

function ensureAll(){
  addStyles();
  reorderGameModelBeforeCueBank();
  relabelPurposeControls();
  ensurePurposePath();
  decorateSessionRows();
  decoratePreview();
}

function install(){
  ensureAll();
  wrapRenderer('renderSessionDrillList',decorateSessionRows);
  wrapRenderer('renderPreview',decoratePreview);
  wrapRenderer('renderVisualPicker',relabelPurposeControls);
  [80,250,700,1500,3000].forEach(delay=>setTimeout(ensureAll,delay));
  const advanced=field('advancedBuilder');
  if(advanced&&typeof MutationObserver!=='undefined'){
    const observer=new MutationObserver(()=>ensureAll());
    observer.observe(advanced,{childList:true,subtree:true});
  }
  document.addEventListener('click',event=>{
    if(event.target.closest?.('[data-tab="planner"],[onclick*="showBuildRoute"],#pickActivation,#pickSkill,#pickTactical,#pickConditioned'))setTimeout(ensureAll,30);
  },true);
  window.NickFourPhaseBuilderClarity=Object.freeze({version:FOUR_PHASE_BUILDER_CLARITY_VERSION,ensure:ensureAll,purposeLabelForStage});
}

if(typeof window!=='undefined'&&typeof document!=='undefined'){
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
}
