const STYLE_ID = 'diagramCoachWorkflowStyles';
const BAR_ID = 'diagramCoachWorkflowBar';
const PRESET_ID = 'diagramCoachPresetShelf';
let dragSelect = null;
let clipboard = null;
let pasteArmed = false;
let pitchObserver = null;
let studioObserver = null;

function state() {
  try { return typeof dsState !== 'undefined' ? dsState : null; }
  catch (_) { return null; }
}

function objects() {
  try { return typeof dsObjects === 'function' ? dsObjects() : []; }
  catch (_) { return []; }
}

function dims() {
  try {
    if (typeof dsPitchDimensions !== 'function' || typeof dsCurrentStep !== 'function') return null;
    return dsPitchDimensions(dsCurrentStep().pitchMode);
  } catch (_) { return null; }
}

function clone(value) {
  try { return typeof dsClone === 'function' ? dsClone(value) : JSON.parse(JSON.stringify(value)); }
  catch (_) { return JSON.parse(JSON.stringify(value)); }
}

function uid(prefix) {
  try { if (typeof dsUid === 'function') return dsUid(prefix); } catch (_) {}
  return `${prefix || 'obj'}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`;
}

function toast(message) {
  try { if (typeof dsToast === 'function') dsToast(message); } catch (_) {}
}

function addStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    /* Bigger invisible hit target: easier to grab, same visual arrow weight. */
    #diagramStudioInlineHost .dsMovementHit,
    #dsSessionDiagramHost .dsMovementHit{
      stroke-width:38!important;
      stroke-linecap:round!important;
      stroke-linejoin:round!important;
      pointer-events:stroke!important;
      touch-action:none!important;
      cursor:grab!important;
    }
    #diagramStudioInlineHost .dsMovementHit:active,
    #dsSessionDiagramHost .dsMovementHit:active{cursor:grabbing!important}
    #diagramStudioInlineHost .dsMovementVisible.dsMovementHover,
    #dsSessionDiagramHost .dsMovementVisible.dsMovementHover{
      filter:drop-shadow(0 0 5px rgba(56,189,248,.95));
    }
    #diagramStudioInlineHost .dsPointHandle,
    #dsSessionDiagramHost .dsPointHandle{
      width:22px!important;height:22px!important;border-width:3px!important;
      box-shadow:0 0 0 4px rgba(56,189,248,.16),0 5px 14px rgba(0,0,0,.35)!important;
    }

    /* V2's older selection strip is superseded by this simpler workflow bar. */
    #diagramStudioInlineHost #dsV2CommandBar{display:none!important}

    #${BAR_ID}{
      flex:0 0 auto;display:flex;align-items:center;gap:6px;flex-wrap:wrap;
      padding:7px 9px;border-bottom:1px solid var(--border);background:#09111e;
    }
    #${BAR_ID} button{padding:7px 9px;font-size:10.5px;white-space:nowrap}
    #${BAR_ID} .coachWorkflowPrimary{background:var(--turf-dim);border-color:rgba(52,211,153,.45);color:var(--turf)}
    #${BAR_ID} .coachWorkflowPaste{background:rgba(56,189,248,.10);border-color:rgba(56,189,248,.38);color:#bae6fd}
    #${BAR_ID} .coachWorkflowHint{margin-left:auto;color:var(--text-dim);font-size:10px;white-space:nowrap}
    #${BAR_ID}.pasteArmed{box-shadow:inset 0 -2px 0 var(--sky)}

    #${PRESET_ID}{
      flex:0 0 auto;padding:7px 9px;border-bottom:1px solid var(--border);
      background:linear-gradient(180deg,rgba(15,46,34,.55),rgba(9,17,30,.98));
    }
    #${PRESET_ID} .coachPresetHead{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px}
    #${PRESET_ID} .coachPresetHead b{font-size:10px;color:var(--turf);text-transform:uppercase;letter-spacing:.08em}
    #${PRESET_ID} .coachPresetHead span{font-size:9.5px;color:var(--text-dim)}
    #${PRESET_ID} .coachPresetRow{display:flex;gap:5px;overflow-x:auto;padding-bottom:1px}
    #${PRESET_ID} button{min-width:max-content;padding:7px 9px;font-size:10px;background:var(--surface);border-color:var(--border)}

    .coachDragSelectBox{
      position:fixed;z-index:50000;pointer-events:none;border:2px solid var(--sky);
      background:rgba(56,189,248,.14);border-radius:6px;
      box-shadow:0 0 0 1px rgba(56,189,248,.18),0 10px 30px rgba(0,0,0,.18);
    }
    #dsPitch.coachPasteArmed{cursor:copy!important}
    #dsPitch.coachPasteArmed *{cursor:copy!important}

    @media(max-width:700px){
      #${BAR_ID}{gap:4px;padding:6px}
      #${BAR_ID} button{padding:8px 8px;font-size:10px}
      #${BAR_ID} .coachWorkflowHint{width:100%;margin-left:0}
      #${PRESET_ID}{padding:6px}
      #${PRESET_ID} .coachPresetHead span{display:none}
    }
  `;
  document.head.appendChild(style);
}

function selected() {
  const s = state();
  if (!s?.selectedIds) return [];
  return objects().filter(item => s.selectedIds.has(item.id));
}

function renderSelectionState() {
  const bar = document.getElementById(BAR_ID);
  if (!bar) return;
  const n = selected().length;
  const copyBtn = bar.querySelector('[data-coach-copy]');
  const deleteBtn = bar.querySelector('[data-coach-delete]');
  if (copyBtn) copyBtn.disabled = n === 0;
  if (deleteBtn) deleteBtn.disabled = n === 0;
  const pasteBtn = bar.querySelector('[data-coach-paste]');
  if (pasteBtn) pasteBtn.disabled = !clipboard;
  const hint = bar.querySelector('.coachWorkflowHint');
  if (hint) {
    if (pasteArmed) hint.textContent = 'Click anywhere on the pitch to paste the group there';
    else if (n) hint.textContent = `${n} selected · drag any selected item to move the group`;
    else hint.textContent = 'Drag a box on empty pitch to select a group';
  }
  bar.classList.toggle('pasteArmed', pasteArmed);
  document.getElementById('dsPitch')?.classList.toggle('coachPasteArmed', pasteArmed);
}

function refreshCanvas() {
  try { if (typeof dsRenderCanvas === 'function') dsRenderCanvas(); } catch (_) {}
  try { if (typeof dsRenderInspector === 'function') dsRenderInspector(); } catch (_) {}
  try { if (typeof dsRenderStatus === 'function') dsRenderStatus(); } catch (_) {}
  requestAnimationFrame(() => { bindArrowHover(); renderSelectionState(); });
}

function newObject(type, extras = {}) {
  try { if (typeof dsNewObject === 'function') return dsNewObject(type, extras); } catch (_) {}
  return { id: uid(type), type, x: 0, y: 0, w: 30, h: 30, ...extras };
}

function addPlayer(x, y, color, label, role = '') {
  objects().push(newObject('player', { x, y, color, label, role }));
}
function addBall(x, y) { objects().push(newObject('ball', { x, y })); }
function addMiniGoal(x, y, rot = 0) { objects().push(newObject('minigoal', { x, y, rot })); }
function addGoal(x, y, rot = 0) { objects().push(newObject('goal', { x, y, rot })); }
function addCone(x, y) { objects().push(newObject('cone', { x, y })); }
function addZone(x, y, w, h, label = '') { objects().push(newObject('zone', { x, y, w, h, zoneShape:'rectangle', label })); }
function addMovement(type, points, extras = {}) {
  objects().push({ id:uid('movement'), type:'movement', movementType:type, points:clone(points), layer:'movement', z:12, ...extras });
}

function clearForPreset() {
  const list = objects();
  if (list.length && !confirm('Replace this diagram with the coaching preset? You can Undo afterwards.')) return false;
  try { if (typeof dsPushHistory === 'function') dsPushHistory(); } catch (_) {}
  list.splice(0, list.length);
  const s = state();
  s?.selectedIds?.clear();
  if (s) s.primaryId = null;
  return true;
}

function presetPossessionBox(d) {
  const x=d.w*.08,y=d.h*.19,w=d.w*.36,h=d.h*.62;
  addZone(x,y,w,h,'POSSESSION');
  addPlayer(x+18,y+18,'blue','1'); addPlayer(x+w-42,y+18,'blue','2');
  addPlayer(x+18,y+h-42,'blue','3'); addPlayer(x+w-42,y+h-42,'blue','4');
  addPlayer(x+w*.43,y+h*.38,'orange','D1'); addPlayer(x+w*.56,y+h*.58,'orange','D2');
  addMiniGoal(x-30,y+h*.24,90); addMiniGoal(x+w+4,y+h*.62,90);
  addBall(x+38,y+h-54);
}

function presetBuildOut(d) {
  const L=d.w*.06,R=d.w*.47;
  addGoal(L-28,d.h*.44,90);
  addPlayer(L+28,d.h*.48,'green','GK','Goalkeeper');
  addPlayer(L+105,d.h*.27,'blue','4','CB'); addPlayer(L+105,d.h*.68,'blue','5','CB');
  addPlayer(L+205,d.h*.14,'blue','2','FB'); addPlayer(L+205,d.h*.81,'blue','3','FB');
  addPlayer(L+225,d.h*.48,'blue','6','6');
  addPlayer(R-70,d.h*.34,'orange','9','Press'); addPlayer(R-70,d.h*.62,'orange','10','Press');
  addPlayer(R-12,d.h*.48,'orange','8','Screen 6');
  addMiniGoal(R+18,d.h*.18,90); addMiniGoal(R+18,d.h*.76,90);
  addBall(L+58,d.h*.51);
  addMovement('pass',[{x:L+55,y:d.h*.51},{x:L+132,y:d.h*.31}]);
  addMovement('press',[{x:R-48,y:d.h*.37},{x:L+148,y:d.h*.31}]);
}

function presetPress442(d) {
  const x0=d.w*.07,x1=d.w*.45;
  addPlayer(x0,d.h*.48,'green','GK');
  addPlayer(x0+85,d.h*.18,'blue','2'); addPlayer(x0+85,d.h*.38,'blue','4');
  addPlayer(x0+85,d.h*.60,'blue','5'); addPlayer(x0+85,d.h*.80,'blue','3');
  addPlayer(x0+185,d.h*.49,'blue','6');
  addPlayer(x1-55,d.h*.39,'orange','9','Press'); addPlayer(x1-55,d.h*.60,'orange','10','Protect');
  addPlayer(x1+20,d.h*.18,'orange','11','Inside-out'); addPlayer(x1+20,d.h*.81,'orange','7','Inside-out');
  addPlayer(x1+40,d.h*.38,'orange','8'); addPlayer(x1+40,d.h*.62,'orange','6');
  addBall(x0+95,d.h*.40);
  addMovement('press',[{x:x1-35,y:d.h*.42},{x:x0+118,y:d.h*.40}]);
  addMovement('press',[{x:x1+38,y:d.h*.20},{x:x0+118,y:d.h*.19}]);
}

function presetWideOverload(d) {
  const x=d.w*.08,y=d.h*.10,w=d.w*.38,h=d.h*.80;
  addZone(x,y,w,h,'WIDE OVERLOAD');
  addPlayer(x+55,y+h*.18,'blue','7'); addPlayer(x+160,y+h*.34,'blue','8'); addPlayer(x+75,y+h*.62,'blue','2');
  addPlayer(x+220,y+h*.27,'orange','D1'); addPlayer(x+210,y+h*.58,'orange','D2');
  addMiniGoal(x+w-36,y+18,90); addMiniGoal(x+w-36,y+h-42,90);
  addBall(x+72,y+h*.20);
  addMovement('run',[{x:x+76,y+h*.66},{x:x+205,y+h*.72}]);
  addMovement('pass',[{x:x+78,y+h*.22},{x:x+170,y+h*.37}]);
}

function presetFinishing(d) {
  const x=d.w*.08,R=d.w*.47;
  addGoal(R,d.h*.40,90); addPlayer(R-48,d.h*.48,'green','GK');
  addPlayer(x+70,d.h*.49,'blue','10'); addPlayer(x+175,d.h*.50,'blue','9');
  addPlayer(x+105,d.h*.17,'blue','11'); addPlayer(x+105,d.h*.80,'blue','7');
  addPlayer(x+220,d.h*.35,'orange','CB1'); addPlayer(x+220,d.h*.63,'orange','CB2');
  addBall(x+86,d.h*.52); addCone(x+25,d.h*.35); addCone(x+25,d.h*.67);
  addMovement('pass',[{x:x+96,y:d.h*.52},{x:x+190,y:d.h*.52}]);
  addMovement('run',[{x:x+118,y:d.h*.20},{x:x+228,y:d.h*.36}]);
  addMovement('shot',[{x:x+195,y:d.h*.52},{x:R-22,y:d.h*.50}]);
}

function presetRondoGoals(d) {
  const x=d.w*.07,y=d.h*.20,w=d.w*.38,h=d.h*.60;
  addZone(x,y,w,h,'6v3 → SCORE');
  const blue=[[.08,.15],[.48,.08],[.88,.15],[.08,.80],[.48,.88],[.88,.80]];
  blue.forEach((p,i)=>addPlayer(x+w*p[0]-12,y+h*p[1]-12,'blue',String(i+1)));
  [[.38,.37],[.60,.43],[.49,.62]].forEach((p,i)=>addPlayer(x+w*p[0]-12,y+h*p[1]-12,'orange','D'+(i+1)));
  addMiniGoal(x+w+8,y+h*.20,90); addMiniGoal(x+w+8,y+h*.68,90);
  addBall(x+w*.17,y+h*.20);
}

const PRESETS = {
  possession:{ label:'4v2 Possession Box', build:presetPossessionBox },
  buildout:{ label:'5v3 Build Out', build:presetBuildOut },
  press442:{ label:'4-4-2 Press', build:presetPress442 },
  wide:{ label:'3v2 Wide Overload', build:presetWideOverload },
  finishing:{ label:'Finishing Pattern', build:presetFinishing },
  rondogoals:{ label:'6v3 + Mini Goals', build:presetRondoGoals }
};

function applyPreset(key) {
  const preset=PRESETS[key], d=dims();
  if (!preset || !d || !state()) return;
  if (!clearForPreset()) return;
  preset.build(d);
  try { if (typeof dsRenderAll === 'function') dsRenderAll(); else refreshCanvas(); } catch (_) { refreshCanvas(); }
  toast(`${preset.label} loaded on the left side — adapt or copy it for progressions`);
  setTimeout(() => { ensureUi(); bindArrowHover(); }, 20);
}

function ensurePresetShelf() {
  const main=document.querySelector('#diagramStudioOverlay .dsMain');
  const tool=document.getElementById('dsToolPanel');
  if (!main || !tool) return;
  let shelf=document.getElementById(PRESET_ID);
  if (!shelf) {
    shelf=document.createElement('div'); shelf.id=PRESET_ID;
    shelf.innerHTML=`<div class="coachPresetHead"><b>⚽ Coaching Setups</b><span>Real starting pictures · intentionally built on the left side for progressions</span></div><div class="coachPresetRow">${Object.entries(PRESETS).map(([key,p])=>`<button type="button" data-coach-preset="${key}">${p.label}</button>`).join('')}</div>`;
    shelf.querySelectorAll('[data-coach-preset]').forEach(btn=>btn.addEventListener('click',()=>applyPreset(btn.dataset.coachPreset)));
    main.insertBefore(shelf,tool);
  }
}

function createWorkflowBar() {
  const main=document.querySelector('#diagramStudioOverlay .dsMain');
  const vp=document.getElementById('dsViewport');
  if (!main || !vp) return;
  let bar=document.getElementById(BAR_ID);
  if (!bar) {
    bar=document.createElement('div'); bar.id=BAR_ID;
    bar.innerHTML=`
      <button type="button" class="coachWorkflowPrimary" data-coach-copy>⧉ Copy Selection</button>
      <button type="button" class="coachWorkflowPaste" data-coach-paste>⌖ Paste Again</button>
      <button type="button" data-coach-mirror="x">↔ Mirror Side</button>
      <button type="button" data-coach-mirror="y">↕ Mirror Half</button>
      <button type="button" data-coach-progression>＋ Progression</button>
      <button type="button" data-coach-delete>Delete Selected</button>
      <span class="coachWorkflowHint">Drag a box on empty pitch to select a group</span>`;
    bar.querySelector('[data-coach-copy]').addEventListener('click', copySelection);
    bar.querySelector('[data-coach-paste]').addEventListener('click', armPasteAgain);
    bar.querySelectorAll('[data-coach-mirror]').forEach(btn=>btn.addEventListener('click',()=>document.querySelector(`#diagramGroupCopyTools [data-copy-axis="${btn.dataset.coachMirror}"]`)?.click()));
    bar.querySelector('[data-coach-progression]').addEventListener('click',()=>{ try { if(typeof dsDuplicateStep==='function') dsDuplicateStep(); } catch(_){} });
    bar.querySelector('[data-coach-delete]').addEventListener('click',()=>{ try { if(typeof dsDeleteSelected==='function') dsDeleteSelected(); } catch(_){} });
    main.insertBefore(bar,vp);
  }
  renderSelectionState();
}

function objectBounds(o) {
  if (Array.isArray(o.points) && o.points.length) {
    const xs=o.points.map(p=>Number(p.x||0)), ys=o.points.map(p=>Number(p.y||0));
    return {left:Math.min(...xs),right:Math.max(...xs),top:Math.min(...ys),bottom:Math.max(...ys)};
  }
  const left=Number(o.x||0), top=Number(o.y||0), w=Number(o.w||24), h=Number(o.h||24);
  return {left,right:left+w,top,bottom:top+h};
}

function boundsFor(items) {
  const boxes=items.map(objectBounds);
  return {left:Math.min(...boxes.map(b=>b.left)),right:Math.max(...boxes.map(b=>b.right)),top:Math.min(...boxes.map(b=>b.top)),bottom:Math.max(...boxes.map(b=>b.bottom))};
}

function canvasPoint(clientX,clientY) {
  const pitch=document.getElementById('dsPitch'), d=dims();
  if (!pitch || !d) return null;
  const r=pitch.getBoundingClientRect();
  if (!r.width || !r.height) return null;
  return {x:(clientX-r.left)*d.w/r.width,y:(clientY-r.top)*d.h/r.height};
}

function intersects(a,b) { return a.left<=b.right && a.right>=b.left && a.top<=b.bottom && a.bottom>=b.top; }

function startBoxSelect(event) {
  const pitch=document.getElementById('dsPitch'), s=state();
  if (!pitch || !s || !pitch.contains(event.target) || s.preview || s.drag) return;
  if (pasteArmed) {
    event.preventDefault(); event.stopImmediatePropagation();
    const p=canvasPoint(event.clientX,event.clientY); if(p) pasteAt(p);
    return;
  }
  if (event.target.closest?.('.dsObject,.dsPointHandle,.dsResizeHandle,.dsRotateHandle,.dsMovementHit')) return;
  const p=canvasPoint(event.clientX,event.clientY); if(!p)return;
  dragSelect={pointerId:event.pointerId,startClientX:event.clientX,startClientY:event.clientY,startPitch:p,active:false,box:null};
}

function moveBoxSelect(event) {
  if (!dragSelect || event.pointerId!==dragSelect.pointerId) return;
  const dx=event.clientX-dragSelect.startClientX, dy=event.clientY-dragSelect.startClientY;
  if (!dragSelect.active && Math.hypot(dx,dy)<7) return;
  if (!dragSelect.active) {
    dragSelect.active=true;
    const box=document.createElement('div'); box.className='coachDragSelectBox'; document.body.appendChild(box); dragSelect.box=box;
  }
  event.preventDefault(); event.stopImmediatePropagation();
  const left=Math.min(dragSelect.startClientX,event.clientX), top=Math.min(dragSelect.startClientY,event.clientY);
  Object.assign(dragSelect.box.style,{left:`${left}px`,top:`${top}px`,width:`${Math.abs(dx)}px`,height:`${Math.abs(dy)}px`});
}

function finishBoxSelect(event) {
  if (!dragSelect || event.pointerId!==dragSelect.pointerId) return;
  const current=dragSelect; dragSelect=null;
  if (!current.active) return;
  event.preventDefault(); event.stopImmediatePropagation();
  current.box?.remove();
  const end=canvasPoint(event.clientX,event.clientY)||current.startPitch;
  const area={left:Math.min(current.startPitch.x,end.x),right:Math.max(current.startPitch.x,end.x),top:Math.min(current.startPitch.y,end.y),bottom:Math.max(current.startPitch.y,end.y)};
  const matches=objects().filter(o=>intersects(area,objectBounds(o)));
  const s=state(); if(!s)return;
  s.selectedIds=new Set(matches.map(o=>o.id)); s.primaryId=matches[0]?.id||null;
  refreshCanvas();
  if(matches.length) toast(`${matches.length} item${matches.length===1?'':'s'} selected — drag to move or copy them`);
}

function copySelection() {
  const items=selected(); if(!items.length)return;
  const b=boundsFor(items);
  clipboard={items:clone(items),bounds:b}; pasteArmed=true;
  renderSelectionState();
  toast(`Copied ${items.length} item${items.length===1?'':'s'} — click where you want the copy`);
}

function armPasteAgain() {
  if(!clipboard)return; pasteArmed=true; renderSelectionState(); toast('Click the pitch where you want the copy');
}

function pasteAt(point) {
  if(!clipboard)return;
  const d=dims(), s=state(); if(!d||!s)return;
  const b=clipboard.bounds, centerX=(b.left+b.right)/2, centerY=(b.top+b.bottom)/2;
  let dx=point.x-centerX, dy=point.y-centerY;
  dx=Math.max(-b.left,Math.min(d.w-b.right,dx));
  dy=Math.max(-b.top,Math.min(d.h-b.bottom,dy));
  try { if(typeof dsPushHistory==='function') dsPushHistory(); } catch(_){}
  const idMap=new Map(clipboard.items.map(o=>[o.id,uid(o.type||'obj')]));
  const copies=clipboard.items.map(source=>{
    const o=clone(source); o.id=idMap.get(source.id);
    if(Array.isArray(o.points)) o.points=o.points.map(p=>({...p,x:Number(p.x||0)+dx,y:Number(p.y||0)+dy}));
    else { o.x=Number(o.x||0)+dx; o.y=Number(o.y||0)+dy; }
    if(o.attachStart) o.attachStart=idMap.get(o.attachStart)||null;
    if(o.attachEnd) o.attachEnd=idMap.get(o.attachEnd)||null;
    return o;
  });
  objects().push(...copies); s.selectedIds=new Set(copies.map(o=>o.id)); s.primaryId=copies[0]?.id||null;
  pasteArmed=false; refreshCanvas(); toast(`Pasted ${copies.length} item${copies.length===1?'':'s'} here`);
}

function bindArrowHover() {
  document.querySelectorAll('#dsPitch .dsMovementHit').forEach(hit=>{
    if(hit.__coachGrabBound)return; hit.__coachGrabBound=true;
    const visible=hit.previousElementSibling;
    hit.addEventListener('pointerenter',()=>visible?.classList.add('dsMovementHover'));
    hit.addEventListener('pointerleave',()=>visible?.classList.remove('dsMovementHover'));
  });
}

function observePitch() {
  const pitch=document.getElementById('dsPitch'); if(!pitch)return;
  pitchObserver?.disconnect();
  pitchObserver=new MutationObserver(()=>{bindArrowHover();renderSelectionState();});
  pitchObserver.observe(pitch,{childList:true,subtree:true});
  bindArrowHover();
}

function installPointerWorkflow() {
  if(document.__coachDiagramPointerWorkflow)return;
  document.__coachDiagramPointerWorkflow=true;
  document.addEventListener('pointerdown',startBoxSelect,true);
  document.addEventListener('pointermove',moveBoxSelect,true);
  document.addEventListener('pointerup',finishBoxSelect,true);
  document.addEventListener('pointercancel',event=>{
    if(!dragSelect||event.pointerId!==dragSelect.pointerId)return;
    dragSelect.box?.remove(); dragSelect=null;
  },true);
}

function installKeyboard() {
  if(document.__coachDiagramKeyboard)return;
  document.__coachDiagramKeyboard=true;
  document.addEventListener('keydown',event=>{
    const studio=document.getElementById('diagramStudioOverlay');
    if(!studio?.classList.contains('open')||event.target?.matches?.('input,textarea,select'))return;
    if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='c'&&selected().length){event.preventDefault();copySelection();}
    if(event.key==='Escape'&&pasteArmed){pasteArmed=false;renderSelectionState();toast('Paste cancelled');}
  });
}

function ensureUi() {
  const studio=document.getElementById('diagramStudioOverlay');
  if(!studio?.classList.contains('open'))return;
  ensurePresetShelf(); createWorkflowBar(); observePitch(); renderSelectionState();
}

function observeStudio() {
  const studio=document.getElementById('diagramStudioOverlay');
  if(!studio||studioObserver)return;
  studioObserver=new MutationObserver(()=>{if(studio.classList.contains('open')){setTimeout(ensureUi,0);setTimeout(ensureUi,100);}});
  studioObserver.observe(studio,{attributes:true,attributeFilter:['class']});
}

function install() {
  addStyles(); installPointerWorkflow(); installKeyboard(); observeStudio(); ensureUi();
  setTimeout(()=>{observeStudio();ensureUi();},250);
  setTimeout(()=>{observeStudio();ensureUi();},900);
}

if(typeof window!=='undefined'&&typeof document!=='undefined'){
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
}
