import {principleById} from './game-model-core.js?v=personal-model-1';
import {buildPrincipleWordBanks} from './principle-word-bank-data.js?v=bank-fix-1';

/* User-authored language is kept verbatim and scoped to an explicit main principle.
   No external AI, account or network call is required. */
const TYPES=['cp','prog','reg','cond','cues','reflect'];
const CARD_SELECTOR='#practiceList .item[data-practice-id],#visualPicker .pitchCard,.fpwCard,.pfV5Card,.gmV4Card,.gmV4FinderCard,.sessionDrillRow';
function appDb(){try{return typeof db!=='undefined'?db:window.db;}catch(_){return window.db;}}
function text(value){return String(value||'').trim();}
function norm(value){return text(value).replace(/\s+/g,' ').toLocaleLowerCase();}
function esc(value){return String(value||'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));}
function phrases(input){
  return [...new Set(String(input||'').split(/\r?\n|[•;]/).map(x=>x.replace(/^[\s\-*]+/,'').trim())
    .filter(x=>x.length>=7&&x.length<=160&&x.split(/\s+/).length>=2))];
}
function principleFor(practice={},session={}){
  const candidates=[practice.gameModelPrincipleIds?.[0],practice.primaryGameModelPrinciple,practice.gameModelPrinciples?.[0],
    session.gameModelPlan?.primaryPrincipleId,session.review?.gameModelV2?.primaryPrincipleId];
  return candidates.find(id=>principleById(id))||'';
}
export function practiceReviewHistory(sessions=[],id=''){
  return (sessions||[]).flatMap(session=>(session?.review?.practices||[]).filter(r=>String(r.practiceId)===String(id))
    .map(review=>({review,date:String(session.date||''),team:String(session.team||''),
      reviewedAt:String(session.review?.reviewedAt||session.date||''),sessionId:session.id||''})))
    .sort((a,b)=>b.reviewedAt.localeCompare(a.reviewedAt));
}
function ensureBanks(db){
  if(!db||typeof db!=='object')return null;
  db.banks ||= {};db.banks.principleWordBanks ||= {};db.banks.coachingInbox ||= [];
  return db.banks;
}
export function capturePhrase(db,principleId,kind,input,source=''){
  if(!TYPES.includes(kind))return 0;
  const bank=ensureBanks(db);if(!bank)return 0;
  let count=0;
  for(const phrase of phrases(input)){
    const main=principleById(principleId);
    if(!main){
      const key=norm(kind+'|'+phrase);
      if(bank.coachingInbox.some(item=>norm(item.kind+'|'+item.text)===key))continue;
      bank.coachingInbox.push({kind,text:phrase,source,date:new Date().toISOString()});count++;continue;
    }
    const scope='principle:'+main.id;
    const own=bank.principleWordBanks[scope]||{};
    const built=buildPrincipleWordBanks({principleIds:[main.id]},bank.principleWordBanks)[kind]||[];
    const current=Array.isArray(own[kind])?own[kind]:built;
    if(current.some(item=>norm(item)===norm(phrase)))continue;
    bank.principleWordBanks[scope]={...own,[kind]:[...current,phrase]};count++;
  }
  return count;
}
export function capturePracticeNotes(db,practice={},previous={}){
  const main=principleFor(practice);
  const fields={cp:'cp',prog:'prog',reg:'reg',condRules:'cond',deliveryCues:'cues'};
  let count=0;
  for(const [field,kind] of Object.entries(fields)){
    if(text(practice[field])===text(previous[field]))continue;
    count+=capturePhrase(db,main,kind,practice[field],practice.name||practice.id||'Practice');
  }
  return count;
}
export function captureSessionReview(db,session={}){
  const review=session.review||{},main=principleFor({},session);
  let count=0;
  for(const [field,kind] of [['worked','reflect'],['didntWork','reflect'],['repeat','cues'],['changeNext','cues']])
    count+=capturePhrase(db,main,kind,review[field],'Session '+String(session.date||''));
  for(const row of review.practices||[]){
    const practice=(db?.practices||[]).find(item=>String(item.id)===String(row.practiceId))||{};
    count+=capturePhrase(db,principleFor(practice,session),'reflect',row.reasoning||row.note,
      'Practice '+String(practice.name||row.practiceId));
  }
  return count;
}
function persist(db){try{return window.store?.()||window.NickPersistence?.enqueue?.(db);}catch(error){console.warn('Coaching phrase save failed',error);}}
function refreshWordBanks(){
  try{window.NickPrincipleWordBanks?.refresh?.();}catch(_){}
  window.dispatchEvent(new Event('coaching:data'));
}
function presentHistory(id){
  const db=appDb(),practice=db?.practices?.find(p=>String(p.id)===String(id));
  const history=practiceReviewHistory(db?.sessions||[],id).slice(0,12);
  if(!history.length)return;
  let modal=document.getElementById('coachingHistoryDialog');
  if(!modal){modal=document.createElement('dialog');modal.id='coachingHistoryDialog';modal.className='coachingHistoryDialog';
    document.body.appendChild(modal);}
  modal.replaceChildren();
  const head=document.createElement('div');head.className='historyDialogHeader';
  const title=document.createElement('div');const heading=document.createElement('h2');
  heading.textContent=practice?.name||id;
  const subtitle=document.createElement('p');subtitle.textContent=history.length+' recent reviewed use'+(history.length===1?'':'s');
  title.append(heading,subtitle);
  const close=document.createElement('button');close.type='button';close.textContent='Close';close.onclick=()=>modal.close();
  head.append(title,close);modal.append(head);
  for(const item of history){
    const entry=document.createElement('section');entry.className='historyEntry';
    const score=item.review.effectiveness?String(item.review.effectiveness)+'/10':'Not rated';
    const line=document.createElement('strong');line.textContent=(item.date||'Undated')+' · '+(item.team||'Team')+' · '+score;
    const decision=document.createElement('span');decision.className='historyDecision';
    decision.textContent=item.review.decision||'No decision';entry.append(line,decision);
    const reasoning=text(item.review.reasoning||item.review.note);
    const note=document.createElement('p');note.textContent=reasoning||'No written feedback for this use';entry.append(note);
    modal.append(entry);
  }
  modal.addEventListener('click',event=>{if(event.target===modal)modal.close();},{once:true});
  if(typeof modal.showModal==='function')modal.showModal();else modal.setAttribute('open','');
}
function practiceId(card,db){
  let id=card.dataset.practiceId||card.dataset.pfv5Practice||card.dataset.v4Practice||card.dataset.fpwPractice;
  if(!id)id=card.querySelector('[data-fpw-session],[data-fpw-edit],[data-v4-toggle-session-practice]')?.dataset.fpwSession
    ||card.querySelector('[data-fpw-edit]')?.dataset.fpwEdit
    ||card.querySelector('[data-v4-toggle-session-practice]')?.dataset.v4ToggleSessionPractice;
  if(!id)id=(card.querySelector('h4,h3,b,strong')?.textContent||'').split(' · ')[0].trim().replace(/^\d+\.\s*/,'');
  return (db?.practices||[]).some(p=>String(p.id)===String(id))?id:'';
}
function addHistoryButtons(){
  const db=appDb();if(!db?.sessions?.length)return;
  document.querySelectorAll(CARD_SELECTOR).forEach(card=>{
    if(card.querySelector('.coachingHistoryButton'))return;
    const id=practiceId(card,db),history=id?practiceReviewHistory(db.sessions,id):[];
    if(!history.length)return;
    const button=document.createElement('button');button.type='button';
    button.className='coachingHistoryButton';button.dataset.coachingHistory=id;
    button.title='Previous coaching feedback · '+history.length+' review'+(history.length===1?'':'s');
    button.setAttribute('aria-label','View previous review notes for '+(db.practices.find(p=>p.id===id)?.name||id));
    button.textContent='ⓘ '+history.length;
    const decision=String(history[0].review.decision||'');
    if(decision==='Adapt'||decision==='Drop')button.classList.add('attention');
    const actions=card.querySelector('.fpwActions,.pfV5CardActions,.gmV4Actions,.sessionDrillActions,.practicePreviewActions');
    if(actions)actions.append(button);else card.append(button);
  });
}
let pending=false;
function schedule(){if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;addHistoryButtons();});}
function compactReview(session){
  const overlay=document.getElementById('postSessionReviewOverlay');
  if(!overlay?.classList.contains('open'))return;
  const root=overlay.querySelector('#reviewBody');
  if(!root||root.dataset.coachingCompact==='1')return;
  root.dataset.coachingCompact='1';
  overlay.classList.add('coachingCompactReview');
  const first=root.querySelector('.reviewCard:has(#reviewRating)');
  if(first){
    first.classList.add('coachingQuickOutcome');
    const h=first.querySelector('h2');if(h)h.textContent='1 · Quick session reflection';
    for(const id of ['reviewDidnt','reviewRepeat']){
      const field=document.getElementById(id);if(field){field.hidden=true;const label=field.previousElementSibling;if(label?.tagName==='LABEL')label.hidden=true;}
    }
    const objective=root.querySelector('[data-choice="objectiveOutcome"]');
    if(objective){objective.hidden=true;const label=objective.previousElementSibling;if(label?.tagName==='LABEL')label.hidden=true;}
    for(const [id,label] of [['reviewWorked','What worked?'],['reviewChange','One adjustment for next time']]){
      const field=document.getElementById(id);if(!field)continue;
      const heading=field.previousElementSibling;if(heading?.tagName==='LABEL')heading.textContent=label;
      const suggestions=bankSuggestions(session,id==='reviewWorked'?'reflect':'cues').slice(0,5);
      addPhrasePicker(field,suggestions);
    }
    const intro=document.createElement('p');intro.className='coachingQuickHint';
    intro.textContent='Choose a rating, capture one win and one adjustment. Tap a word-bank phrase or write your own; your wording is saved for future sessions.';
    first.querySelector('h2')?.after(intro);
  }
  root.querySelectorAll('.reviewPractice').forEach(row=>{
    const engagement=row.querySelector('.practiceEngagement');
    if(engagement){engagement.closest('div').hidden=true;}
    const decision=row.querySelector('.practiceDecision');
    if(decision){const label=decision.closest('div')?.querySelector('label');if(label)label.textContent='Next use';}
    const reasoning=row.querySelector('.practiceReasoning,.practiceNote');
    if(reasoning){
      const label=reasoning.closest('div')?.querySelector('label');if(label)label.textContent='One thing to remember (optional)';
      const practice=appDb()?.practices?.find(p=>String(p.id)===String(row.dataset.practiceId));
      addPhrasePicker(reasoning,bankSuggestions({...session,gameModelPlan:{
        ...session.gameModelPlan,primaryPrincipleId:principleFor(practice,session)}} ,'cp').slice(0,5));
    }
  });
  root.querySelectorAll('#fourPhaseReviewCard .fpReviewScores,#fourPhaseReviewCard .fpReviewEvidence').forEach(el=>el.hidden=true);
}
function bankSuggestions(session,kind){
  const main=principleFor({},session);if(!main)return [];
  return buildPrincipleWordBanks({principleIds:[main]},appDb()?.banks?.principleWordBanks||{})[kind]||[];
}
function addPhrasePicker(input,entries){
  if(!entries.length||input.parentElement.querySelector('.coachingPhrasePicker'))return;
  const details=document.createElement('details');details.className='coachingPhrasePicker';
  const summary=document.createElement('summary');summary.textContent='Use a word-bank phrase';details.append(summary);
  const chips=document.createElement('div');chips.className='coachingPhraseChips';
  for(const phrase of entries){
    const button=document.createElement('button');button.type='button';button.textContent=phrase;
    button.onclick=()=>{
      const lines=input.value.split('\n').map(x=>x.trim());
      if(!lines.includes(phrase))input.value=[input.value.trim(),phrase].filter(Boolean).join('\n');
      input.dispatchEvent(new Event('input',{bubbles:true}));details.open=false;
    };
    chips.append(button);
  }
  details.append(chips);input.after(details);
}
function renderInbox(){
  const host=document.getElementById('principleBankManager');
  if(!host)return;
  let section=document.getElementById('coachingPhraseInbox');
  if(!section){section=document.createElement('section');section.id='coachingPhraseInbox';host.append(section);}
  const inbox=appDb()?.banks?.coachingInbox||[];
  section.replaceChildren();
  const h=document.createElement('h3');h.textContent='Unassigned coaching quotes ('+inbox.length+')';section.append(h);
  const intro=document.createElement('p');intro.className='small';
  intro.textContent='Notes without a recorded main principle wait here safely. Choose a principle to file them into the right word bank.';
  section.append(intro);
  if(!inbox.length)return;
  import('./game-model-core.js?v=personal-model-1').then(({GAME_MODEL_PRINCIPLES})=>{
    for(const item of inbox.slice(0,30)){
      const row=document.createElement('div');row.className='coachingInboxRow';
      const quote=document.createElement('q');quote.textContent=item.text;
      const select=document.createElement('select');
      for(const p of GAME_MODEL_PRINCIPLES){const option=document.createElement('option');option.value=p.id;option.textContent=p.message;select.append(option);}
      const save=document.createElement('button');save.type='button';save.textContent='File quote';
      save.onclick=async()=>{
        const db=appDb();if(!db)return;
        capturePhrase(db,select.value,item.kind,item.text,item.source);
        db.banks.coachingInbox=db.banks.coachingInbox.filter(x=>x!==item);
        await persist(db);refreshWordBanks();renderInbox();
      };
      row.append(quote,select,save);section.append(row);
    }
  });
}
function install(){
  const style=document.createElement('style');style.textContent=
  '.coachingHistoryButton{font-size:11px!important;min-height:29px!important;padding:4px 8px!important;margin:5px 0;border-color:#42685f!important;color:#a7e4ce!important;background:#16332e!important}.coachingHistoryButton.attention{border-color:#bf985e!important;color:#ffe0a5!important;background:#443222!important}.coachingHistoryDialog{width:min(600px,calc(100vw - 24px));max-height:85dvh;overflow:auto;background:var(--surface);color:var(--text);border:1px solid var(--border);border-radius:18px;padding:20px;box-shadow:0 28px 85px #000b}.coachingHistoryDialog::backdrop{background:rgba(3,8,15,.8)}.historyDialogHeader{display:flex;align-items:start;justify-content:space-between;gap:14px}.historyDialogHeader h2{margin:0}.historyDialogHeader p{color:var(--text-dim);margin:4px 0 18px}.historyEntry{padding:12px 0;border-top:1px solid var(--border);font-size:13px}.historyEntry p{white-space:pre-wrap;color:var(--text-dim);margin:5px 0}.historyDecision{margin-left:12px;color:var(--turf)}#postSessionReviewOverlay.coachingCompactReview .reviewGrid{grid-template-columns:minmax(260px,.72fr) minmax(0,1.28fr)!important}#postSessionReviewOverlay.coachingCompactReview .reviewPracticeGrid{grid-template-columns:120px minmax(0,1fr)!important}#postSessionReviewOverlay.coachingCompactReview .reviewPracticeGrid>div[hidden],.coachingCompactReview #fourPhaseReviewCard [hidden]{display:none!important}#postSessionReviewOverlay.coachingCompactReview .reviewPracticeGrid>div.reviewReasoningField{grid-column:2!important;grid-row:1 / span 2!important}.coachingQuickHint{color:var(--text-dim);font-size:12px;line-height:1.5}#postSessionReviewOverlay.coachingCompactReview [hidden]{display:none!important}.coachingPhrasePicker{margin:9px 0}.coachingPhrasePicker summary{cursor:pointer;font-size:11px;color:var(--turf);font-weight:700}.coachingPhraseChips{display:flex;flex-wrap:wrap;gap:5px;margin:7px 0}.coachingPhraseChips button{font-size:10px;padding:5px 8px;min-height:30px;text-align:left}#postSessionReviewOverlay.coachingCompactReview #fourPhaseReviewCard{display:none!important}.coachingInboxRow{display:grid;grid-template-columns:minmax(0,1fr) minmax(120px,.6fr) auto;gap:8px;align-items:center;margin:7px 0;padding:9px;border:1px solid var(--border);border-radius:10px}.coachingInboxRow q{font-size:12px;line-height:1.4}@media(max-width:700px){.coachingCompactReview .reviewGrid,#postSessionReviewOverlay.coachingCompactReview .reviewPracticeGrid{grid-template-columns:1fr!important}#postSessionReviewOverlay.coachingCompactReview .reviewPracticeGrid>div.reviewReasoningField{grid-column:1!important;grid-row:auto!important}.coachingInboxRow{grid-template-columns:1fr}}';
  document.head.append(style);
  const oldSave=window.savePractice;
  if(typeof oldSave==='function'&&!oldSave.__coachingNotesCaptured){
    const wrapped=async function(...args){
      const db=appDb(),id=document.getElementById('oldId')?.value||document.getElementById('pid')?.value;
      const before={...((db?.practices||[]).find(p=>p.id===id)||{})};
      const result=await oldSave.apply(this,args);
      const current=appDb(),saved=(current?.practices||[]).find(p=>p.id===document.getElementById('pid')?.value);
      if(saved&&capturePracticeNotes(current,saved,before)){await persist(current);refreshWordBanks();}
      return result;
    };
    wrapped.__coachingNotesCaptured=true;window.savePractice=wrapped;
  }
  const open=window.openPostSessionReview;
  if(typeof open==='function'&&!open.__coachingCompact){
    const wrapped=function(session,index,...rest){
      const result=open.call(this,session,index,...rest);
      requestAnimationFrame(()=>compactReview(session));
      setTimeout(()=>compactReview(session),100);
      return result;
    };
    wrapped.__coachingCompact=true;window.openPostSessionReview=wrapped;
  }
  document.addEventListener('click',event=>{
    const button=event.target.closest?.('[data-coaching-history]');
    if(!button)return;
    event.preventDefault();event.stopPropagation();presentHistory(button.dataset.coachingHistory);
  },true);
  const watch=new MutationObserver(records=>{
    if(records.some(r=>[...r.addedNodes].some(n=>n.nodeType===1&&(n.matches?.(CARD_SELECTOR)||n.querySelector?.(CARD_SELECTOR)))))schedule();
  });
  watch.observe(document.body,{subtree:true,childList:true});schedule();
  window.addEventListener('coaching:data',()=>{schedule();renderInbox();});
  document.addEventListener('click',event=>{if(event.target.closest?.('[data-tab="wordbank"]'))setTimeout(renderInbox,50);});
  window.NickCoachingMemory={captureReview: (session,db)=>captureSessionReview(db,session),history:practiceReviewHistory,render: schedule};
}
if(typeof window!=='undefined'&&typeof document!=='undefined'){
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
}
