// Register a same-origin service worker only on HTTPS/localhost.
// All coaching data remains in the existing local save/outbox system.
export function registerOfflineShell(){
  if(typeof navigator==='undefined'||!('serviceWorker' in navigator))return Promise.resolve(false);
  return navigator.serviceWorker.register('./sw.js',{scope:'./'}).then(reg=>{
    const flag=document.getElementById('offlineReadyStatus');
    if(flag){flag.textContent='Offline app installed · data saves locally while disconnected';}
    return reg;
  }).catch(error=>{console.warn('Offline app shell could not be installed',error);return false;});
}
if(typeof window!=='undefined'&&typeof document!=='undefined'){
  const go=()=>registerOfflineShell();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',go,{once:true});else go();
}
