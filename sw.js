/* Nick's Coaching OS · offline-first application shell.
   Network-first while online; verified locally cached app assets when disconnected. */
const CACHE_NAME='nick-coaching-os-offline-v1';
const ASSETS=["./","./index.html","./manifest.webmanifest","./icons/coaching-mark.svg","./src/coaching-memory-workflow-v1.js","./src/practice-display-order.js","./src/advanced-builder-visual-focus-v1.js","./src/app-startup-save-status-v1.js","./src/builder-session-visuals.js","./src/calendar-sessions-hard-fix-v2.js","./src/cloud-save-feedback.js","./src/cloud-sync-delta-v1.js","./src/coaching-domain.js","./src/coaching-loop.js","./src/coaching-personalisation-automation.js","./src/diagram-cone-colours.js","./src/diagram-editor-coach-workflow.js","./src/diagram-editor-hold-pickup-pitch-size.js","./src/diagram-editor-pickup-line-pass.js","./src/diagram-editor-precision-v2.js","./src/diagram-group-copy-tools.js","./src/diagram-preset-manager.js","./src/diagram-preview-calibration-v2.js","./src/display-calibration.js","./src/editor-pitch-builder-cleanup.js","./src/firebase-cloud.js","./src/four-phase-builder-clarity-v2.js","./src/four-phase-game-model-diagrams-v2.js","./src/four-phase-game-model-os-v1.js","./src/four-phase-practice-persistence-v1.js","./src/four-phase-practice-system-v1.js","./src/game-context-practice-system-v3.js","./src/game-model-clarity-framework.js","./src/game-model-core.js","./src/game-model-operating-system.js","./src/game-model-practice-architecture-v2.js","./src/game-model-visual-playbook.js","./src/ios-diagram-calibration-v3.js","./src/local-test-cloud.js","./src/mobile-reliability.js","./src/observe-render.js","./src/passing-fundamentals.js","./src/persistence-client.js","./src/personal-coaching-model.js","./src/personal-coaching-ui.js","./src/post-session-review.js","./src/practice-editor-collapsible-word-banks-v1.js","./src/practice-editor-interaction-revamp.js","./src/practice-editor-studio-v2.js","./src/practice-editor-unified.js","./src/practice-filter-workbench-v5.js","./src/practice-id-system.js","./src/practice-library-auto-organiser-v4.js","./src/practice-no-principle-decision-v1.js","./src/practice-tag-persistence-v6.js","./src/practice-tag-save-reliability-v5.js","./src/principle-word-bank-data.js","./src/principle-word-banks.js","./src/retired-bank-phrases.js","./src/review-diagram-ten-scale.js","./src/review-integrations.js","./src/session-calendar-navigation-rating.js","./src/session-identity.js","./src/session-intelligence-observer-guard.js","./src/session-intelligence-v2.js","./src/session-library-intelligence-hook.js","./src/session-library-speed-v2.js","./src/session-library-speed.js","./src/session-return-sideline-setup.js","./src/session-state.js","./src/session-usability-pass.js","./src/sideline-glance-layout.js","./src/startup-performance.js","./src/sticky-editor-return.js","./src/sticky-session-diagrams-fix.js","./src/sync-engine.js","./src/sync-presentation.js","./src/visual-refresh-v1.css"];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(Promise.all([
    caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('nick-coaching-os-offline-')&&key!==CACHE_NAME).map(key=>caches.delete(key)))),
    self.clients.claim()
  ]));
});
self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin)return; // Never cache Firebase/auth/CDN or user API traffic.
  if(!url.pathname.startsWith(new URL(self.registration.scope).pathname))return;
  event.respondWith((async()=>{
    try{
      const response=await fetch(request);
      if(response.ok){const cache=await caches.open(CACHE_NAME);cache.put(request,response.clone()).catch(()=>{});}
      return response;
    }catch(error){
      const cache=await caches.open(CACHE_NAME);
      const exact=await cache.match(request,{ignoreSearch:true});
      if(exact)return exact;
      if(request.mode==='navigate'){
        const fallback=await cache.match('./index.html');
        if(fallback)return fallback;
      }
      throw error;
    }
  })());
});
