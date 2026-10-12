// Decoration must never observe its own writes or redraw miniature diagrams forever.
export function observeRender(root,render){
 if(!root)return null;
 let queued=false;
 const options={childList:true,subtree:true};
 const observer=new MutationObserver(records=>{
  if(root.closest?.('.view.hidden'))return;
  if(records.every(r=>r.target.closest?.('.pitchMini,svg,.fpwPitch')))return;
  if(queued)return;queued=true;
  requestAnimationFrame(()=>{
   queued=false;observer.disconnect();
   try{render();}finally{observer.observe(root,options);}
  });
 });
 observer.observe(root,options);return observer;
}
