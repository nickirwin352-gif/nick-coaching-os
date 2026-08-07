function installReviewIntegrations(){
  if(typeof window==='undefined'||typeof document==='undefined'||window.__reviewIntegrationsInstalled)return;
  window.__reviewIntegrationsInstalled=true;

  try{
    if(typeof window.addSessionDrill!=='function'&&typeof addPracticeToSession==='function'){
      window.addSessionDrill=id=>addPracticeToSession(id);
    }
  }catch(_){}

  try{
    const original=typeof buildSessionCard==='function'?buildSessionCard:window.buildSessionCard;
    if(typeof original==='function'&&!original.__reviewButtonWrapped){
      const wrapped=function(session,index,...rest){
        const card=original.call(this,session,index,...rest);
        const actions=card?.querySelector?.('.sessionActions');
        if(actions&&!actions.querySelector('[data-session-review]')){
          const button=document.createElement('button');
          button.type='button';
          button.dataset.sessionReview='true';
          button.textContent=session?.review?.reviewedAt?'Edit Review':'Review Session';
          button.addEventListener('click',()=>window.openPostSessionReview?.(session,index));
          actions.insertBefore(button,actions.firstChild);
        }
        return card;
      };
      wrapped.__reviewButtonWrapped=true;
      window.buildSessionCard=wrapped;
      try{buildSessionCard=wrapped}catch(_){}
    }
  }catch(_){}
}

if(typeof window!=='undefined'&&typeof document!=='undefined'){
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installReviewIntegrations,{once:true});
  else installReviewIntegrations();
}
