const STYLE_ID = 'editorPitchBuilderCleanupStyles';
const RESET_BAR_ID = 'advancedBuilderResetBar';
let studioObserver = null;
let builderObserver = null;

function addStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    /* The coach does not need the old Setup / Step management strip in normal editing. */
    #diagramStudioInlineHost .dsStepBar,
    #dsSessionDiagramHost .dsStepBar{display:none!important}

    /* Use nearly all available editor space for the pitch. */
    #editor{max-width:1920px!important;padding-left:8px!important;padding-right:8px!important}
    #editor .grid.two{grid-template-columns:minmax(270px,300px) minmax(0,1fr)!important;gap:9px!important}
    #diagramStudioInlineHost .diagramStudioOverlay.streamlinedInline{
      height:calc(100dvh - 70px)!important;min-height:840px!important;max-height:none!important;
    }
    #diagramStudioInlineHost .streamlinedInline .dsViewport{
      min-height:650px!important;flex:1 1 650px!important;padding:5px!important;
    }
    #diagramStudioInlineHost .streamlinedInline .dsMain{min-height:0!important}
    #diagramStudioInlineHost .streamlinedInline .dsHeader{min-height:46px!important;padding:5px 8px!important}
    #diagramStudioInlineHost .streamlinedInline .dsToolPanel{padding:4px 6px!important}
    #diagramStudioInlineHost .streamlinedInline .dsQuickInspector{min-height:30px!important;padding:3px 6px!important}
    #diagramStudioInlineHost .streamlinedInline .dsStatusBar{min-height:21px!important;height:21px!important;padding:2px 6px!important}

    /* Proper football markings: 18-yard box, 6-yard box and fixed goalmouths. */
    #dsPitch .dsBox{border-width:3px!important;border-color:rgba(255,255,255,.78)!important;pointer-events:none}
    #dsPitch .dsSixYard{position:absolute;top:211px;width:38px;height:98px;border:3px solid rgba(255,255,255,.82);pointer-events:none;z-index:2}
    #dsPitch .dsSixYard.left{left:0;border-left:0}
    #dsPitch .dsSixYard.right{right:0;border-right:0}
    #dsPitch .dsGoalMouth{position:absolute;top:226px;width:14px;height:68px;border:3px solid rgba(255,255,255,.96);background:repeating-linear-gradient(0deg,rgba(255,255,255,.14) 0 2px,transparent 2px 7px);pointer-events:none;z-index:3}
    #dsPitch .dsGoalMouth.left{left:0;border-left:0}
    #dsPitch .dsGoalMouth.right{right:0;border-right:0}
    #dsPitch .dsPenaltySpot{position:absolute;top:50%;width:7px;height:7px;margin-top:-3.5px;border-radius:50%;background:rgba(255,255,255,.9);pointer-events:none;z-index:2}
    #dsPitch .dsPenaltySpot.left{left:72px}
    #dsPitch .dsPenaltySpot.right{right:72px}

    #dsPitch.portrait .dsSixYard{left:211px;top:auto;width:98px;height:38px}
    #dsPitch.portrait .dsSixYard.left{top:0;border-top:0;border-left:3px solid rgba(255,255,255,.82)}
    #dsPitch.portrait .dsSixYard.right{top:auto;bottom:0;border-bottom:0;border-right:3px solid rgba(255,255,255,.82)}
    #dsPitch.portrait .dsGoalMouth{left:226px;top:auto;width:68px;height:14px;background:repeating-linear-gradient(90deg,rgba(255,255,255,.14) 0 2px,transparent 2px 7px)}
    #dsPitch.portrait .dsGoalMouth.left{top:0;border-top:0;border-left:3px solid rgba(255,255,255,.96)}
    #dsPitch.portrait .dsGoalMouth.right{top:auto;bottom:0;border-bottom:0;border-right:3px solid rgba(255,255,255,.96)}
    #dsPitch.portrait .dsPenaltySpot{left:50%;top:auto;margin-left:-3.5px;margin-top:0}
    #dsPitch.portrait .dsPenaltySpot.left{top:72px}
    #dsPitch.portrait .dsPenaltySpot.right{top:auto;bottom:72px}

    /* Make clearing the current Advanced Builder session obvious. */
    #${RESET_BAR_ID}{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:10px 0 13px;padding:11px 12px;border:1px solid rgba(251,113,133,.34);border-radius:12px;background:rgba(127,29,29,.12)}
    #${RESET_BAR_ID} .builderResetCopy{min-width:0}
    #${RESET_BAR_ID} .builderResetTitle{font-weight:850;font-size:13px;color:var(--text)}
    #${RESET_BAR_ID} .builderResetMeta{font-size:11px;color:var(--text-dim);margin-top:2px}
    #${RESET_BAR_ID} button{flex:none;border-color:rgba(251,113,133,.55);color:#fecdd3;background:rgba(127,29,29,.24)}
    #${RESET_BAR_ID} button:disabled{opacity:.45;cursor:not-allowed}
    .drillBuilder>div.row:first-child>button.danger{font-weight:850!important;padding:9px 12px!important}

    @media(max-width:1100px){
      #editor .grid.two{grid-template-columns:minmax(260px,290px) minmax(0,1fr)!important}
      #diagramStudioInlineHost .streamlinedInline .dsViewport{min-height:590px!important;flex-basis:590px!important}
    }
    @media(max-width:850px){
      #editor .grid.two{grid-template-columns:1fr!important}
      #diagramStudioInlineHost .diagramStudioOverlay.streamlinedInline{height:820px!important;min-height:760px!important}
      #diagramStudioInlineHost .streamlinedInline .dsViewport{min-height:490px!important;flex-basis:490px!important}
    }
    @media(max-width:560px){
      #diagramStudioInlineHost .diagramStudioOverlay.streamlinedInline{height:770px!important;min-height:700px!important}
      #diagramStudioInlineHost .streamlinedInline .dsViewport{min-height:430px!important;flex-basis:430px!important}
      #${RESET_BAR_ID}{align-items:stretch;flex-direction:column}
      #${RESET_BAR_ID} button{width:100%}
    }
  `;
  document.head.appendChild(style);
}

function goalEnd(side) {
  return `<div class="dsSixYard ${side}"></div><div class="dsGoalMouth ${side}"></div><div class="dsPenaltySpot ${side}"></div>`;
}

function enhancedPitchMarkup(mode) {
  let parsed;
  try { parsed = typeof dsParseMode === 'function' ? dsParseMode(mode) : { core:String(mode || 'full').split(':').pop() }; }
  catch (_) { parsed = { core:'full' }; }
  const core = parsed.core || 'full';
  if (core === 'blank') return '';
  if (core === 'half') return `<div class="dsHalf"></div><div class="dsCircle"></div><div class="dsBox right"></div>${goalEnd('right')}`;
  if (core === 'finalThird') return `<div class="dsFinalShade"></div><div class="dsBox right"></div>${goalEnd('right')}<div class="dsCircle" style="left:66%"></div>`;
  if (core === 'penalty') return `<div class="dsBox left" style="left:0;top:80px;width:280px;height:360px"></div>${goalEnd('left')}<div class="dsCircle" style="left:250px"></div>`;

  let lines = `<div class="dsHalf"></div><div class="dsCircle"></div><div class="dsBox left"></div><div class="dsBox right"></div>${goalEnd('left')}${goalEnd('right')}`;
  if (core === 'thirds') lines += '<div class="dsThirdLine a"></div><div class="dsThirdLine b"></div>';
  if (core === 'central') lines += '<div class="dsChannel"></div>';
  if (core === 'wide') lines += '<div class="dsWideChannel"></div><div class="dsWideChannel right"></div>';
  if (core === 'quarters') lines += '<div class="dsQuarterV"></div><div class="dsQuarterH"></div>';
  return lines;
}

function installPitchMarkup() {
  try { dsPitchMarkup = enhancedPitchMarkup; }
  catch (_) { window.dsPitchMarkup = enhancedPitchMarkup; }
  try { if (typeof dsRenderCanvas === 'function' && typeof dsState !== 'undefined' && dsState) dsRenderCanvas(); } catch (_) {}
  try { if (typeof dsFitPitch === 'function') requestAnimationFrame(dsFitPitch); } catch (_) {}
}

function plannerCount() {
  try { return Array.isArray(plannerDrills) ? plannerDrills.length : 0; }
  catch (_) { return 0; }
}

function ensureBuilderReset() {
  const list = document.getElementById('sessionDrillList');
  const builder = list?.closest('.drillBuilder');
  if (!builder) return;
  const existingSmall = builder.querySelector(':scope > .row button.danger');
  if (existingSmall) {
    existingSmall.textContent = 'Clear Current Session';
    existingSmall.title = 'Remove every practice from the current session';
  }
  let bar = document.getElementById(RESET_BAR_ID);
  if (!bar) {
    bar = document.createElement('div');
    bar.id = RESET_BAR_ID;
    bar.innerHTML = '<div class="builderResetCopy"><div class="builderResetTitle">Current session</div><div class="builderResetMeta"></div></div><button type="button">🗑 Clear Current Session</button>';
    bar.querySelector('button').addEventListener('click', () => {
      try { if (typeof clearSessionDrills === 'function') clearSessionDrills(); else window.clearSessionDrills?.(); }
      catch (_) {}
      requestAnimationFrame(ensureBuilderReset);
    });
    builder.parentElement?.insertBefore(bar, builder);
  }
  const count = plannerCount();
  const meta = bar.querySelector('.builderResetMeta');
  const button = bar.querySelector('button');
  if (meta) meta.textContent = count ? `${count} practice${count === 1 ? '' : 's'} selected · use this to start this session again` : 'No practices selected yet';
  if (button) button.disabled = count === 0;
}

function observeBuilder() {
  const list = document.getElementById('sessionDrillList');
  if (!list) return;
  builderObserver?.disconnect();
  builderObserver = new MutationObserver(() => requestAnimationFrame(ensureBuilderReset));
  builderObserver.observe(list, { childList:true, subtree:true });
  ensureBuilderReset();
}

function ensureStudio() {
  const studio = document.getElementById('diagramStudioOverlay');
  if (!studio?.classList.contains('open')) return;
  installPitchMarkup();
  const stepBar = document.getElementById('dsStepBar');
  if (stepBar) stepBar.setAttribute('aria-hidden','true');
}

function observeStudio() {
  const studio = document.getElementById('diagramStudioOverlay');
  if (!studio || studioObserver) return;
  studioObserver = new MutationObserver(() => {
    if (studio.classList.contains('open')) {
      setTimeout(ensureStudio, 0);
      setTimeout(ensureStudio, 100);
    }
  });
  studioObserver.observe(studio, { attributes:true, attributeFilter:['class'] });
}

function install() {
  addStyles();
  installPitchMarkup();
  observeStudio();
  observeBuilder();
  ensureBuilderReset();
  setTimeout(() => { installPitchMarkup(); observeStudio(); observeBuilder(); ensureBuilderReset(); }, 250);
  setTimeout(() => { installPitchMarkup(); observeBuilder(); ensureBuilderReset(); }, 900);
  window.addEventListener('resize', () => { try { if (typeof dsFitPitch === 'function') dsFitPitch(); } catch (_) {} }, { passive:true });
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
  else install();
}
