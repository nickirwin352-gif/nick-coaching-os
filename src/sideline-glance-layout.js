export function sidelineGlanceCss(){return `
.sidelineQuickActions{display:none!important}
@media(max-width:850px){
  .sidelineShell{height:calc(100dvh - 58px);overflow:hidden;padding:7px 8px 8px;gap:6px;grid-template-rows:auto minmax(0,1fr) auto}
  .sidelineTop{gap:6px}.sidelineStep{font-size:11px}.sidelineTop .small{font-size:11px;line-height:1.2}
  .sidelineTimers{gap:6px}.sidelineTimer{padding:4px 6px;min-width:0}.sidelineTimer span{font-size:9px}.sidelineTimer b{font-size:16px}
  .sidelinePractice{min-height:0;overflow:hidden;grid-template-columns:1fr;grid-template-rows:auto minmax(0,1fr);gap:6px}
  .sidelineVisual,.sidelineInfo{padding:7px;border-radius:12px;min-height:0}
  .sidelineVisual{display:block}.sidelineTitle h1{font-size:17px;line-height:1.15;margin:0 0 2px}.sidelineMeta{font-size:10.5px;line-height:1.2;margin-bottom:4px}
  .sidelinePitch{height:min(30dvh,245px);min-height:150px;display:flex;align-items:center;justify-content:center;overflow:hidden}
  .sidelinePitch .pitchMini{min-height:0!important;max-height:100%!important;margin:0!important}
  .sidelineInfo{display:grid;grid-template-rows:auto minmax(0,1fr);gap:4px;overflow:hidden}
  .sidelineInfo>.sidelineTabs{position:sticky;top:0;z-index:4;background:var(--surface-2);padding-bottom:2px;grid-template-columns:repeat(4,minmax(0,1fr));gap:4px}
  .sidelineInfo>.sidelineTabs button{font-size:10px;padding:7px 2px;min-height:34px}
  .sidelineTextPanel{min-height:0;overflow-y:auto;-webkit-overflow-scrolling:touch;font-size:13px;line-height:1.38;padding:3px 5px 2px}
  .sidelineTextPanel h3{font-size:14px;margin:0 0 5px}.sidelineTextPanel p{margin:0 0 6px}.sidelineTextPanel ol{padding-left:20px}.sidelineTextPanel li{margin:0 0 6px}
  .sidelineControls{grid-template-columns:1fr auto auto 1fr;gap:4px}.sidelineControls button{min-height:42px;padding:7px 5px;font-size:11.5px}.sidelineControls .primary{font-size:12.5px}
}
@media(max-width:430px) and (max-height:780px){
  .sidelinePitch{height:min(27dvh,205px);min-height:135px}
  .sidelineTextPanel{font-size:12.3px;line-height:1.32}
  .sidelineTitle h1{font-size:16px}.sidelineMeta{font-size:10px}
}
`}

function install(){
  if(typeof window==='undefined'||typeof document==='undefined'||window.__sidelineGlanceLayoutInstalled)return;
  window.__sidelineGlanceLayoutInstalled=true;
  const style=document.createElement('style');style.dataset.sidelineGlanceLayout='true';style.textContent=sidelineGlanceCss();document.head.appendChild(style);
  const clean=()=>document.querySelectorAll('.sidelineQuickActions').forEach(el=>el.remove());
  clean();
  const content=document.getElementById('grassContent');
  if(content&&'MutationObserver'in window){const observer=new MutationObserver(()=>clean());observer.observe(content,{childList:true,subtree:true})}
  document.addEventListener('click',ev=>{if(ev.target.closest?.('[onclick*="renderSidelinePractice"], [onclick*="setSidelineTab"], [onclick*="changeSidelinePractice"]'))requestAnimationFrame(clean)},true);
}

if(typeof window!=='undefined'&&typeof document!=='undefined'){
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
}
