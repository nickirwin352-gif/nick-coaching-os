const STYLE_ID = 'practiceEditorStudioV2Styles';
const COMMAND_BAR_ID = 'dsV2CommandBar';
let studioObserver = null;
let resizeObserver = null;
let fitFrame = 0;

function state() {
  try { return typeof dsState !== 'undefined' ? dsState : null; }
  catch (_) { return null; }
}

function studio() { return document.getElementById('diagramStudioOverlay'); }
function viewport() { return document.getElementById('dsViewport'); }

function addStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    /* Diagram Studio V2: stable, pitch-first workspace. */
    #editor{max-width:1600px!important}
    #editor .grid.two{
      grid-template-columns:minmax(320px,370px) minmax(0,1fr)!important;
      gap:18px!important;
      align-items:start!important;
    }
    #editor .grid.two>.streamlinedStudioCard{
      position:sticky!important;
      top:112px!important;
      padding:0!important;
      overflow:visible!important;
      min-width:0!important;
      background:transparent!important;
      border:0!important;
      box-shadow:none!important;
    }
    #diagramStudioInlineHost{min-width:0;width:100%}
    #diagramStudioInlineHost .diagramStudioOverlay.streamlinedInline{
      position:relative!important;
      inset:auto!important;
      width:100%!important;
      height:clamp(650px,calc(100dvh - 126px),900px)!important;
      min-height:650px!important;
      max-height:900px!important;
      overflow:hidden!important;
      border:1px solid var(--border)!important;
      border-radius:18px!important;
      background:var(--surface-2)!important;
      box-shadow:0 18px 46px rgba(0,0,0,.28)!important;
    }
    #diagramStudioInlineHost .streamlinedInline .dsHeader{
      min-height:58px!important;
      height:auto!important;
      padding:9px 11px!important;
      background:linear-gradient(180deg,var(--surface),var(--surface-2))!important;
      border-bottom:1px solid var(--border)!important;
    }
    #diagramStudioInlineHost .streamlinedInline .dsHeaderTitle strong{font-size:15px!important}
    #diagramStudioInlineHost .streamlinedInline .dsHeaderTitle span{font-size:11px!important;color:var(--text-dim)!important}
    #diagramStudioInlineHost .streamlinedInline .dsHeaderActions{gap:5px!important}
    #diagramStudioInlineHost .streamlinedInline .dsHeaderActions button{padding:7px 9px!important;font-size:11px!important}
    #diagramStudioInlineHost .streamlinedInline .dsHeaderActions button[onclick*="dsFitPitch"]{display:none!important}

    /* Reliability fix: flexible column instead of a fixed row-count grid. */
    #diagramStudioInlineHost .streamlinedInline .dsBody{display:block!important;flex:1!important;min-height:0!important}
    #diagramStudioInlineHost .streamlinedInline .dsMain{
      height:100%!important;
      min-height:0!important;
      display:flex!important;
      flex-direction:column!important;
      background:#050912!important;
    }
    #diagramStudioInlineHost .streamlinedInline .dsToolPanel,
    #diagramStudioInlineHost .streamlinedInline .dsQuickInspector,
    #diagramStudioInlineHost .streamlinedInline #diagramGroupCopyTools,
    #diagramStudioInlineHost .streamlinedInline #${COMMAND_BAR_ID},
    #diagramStudioInlineHost .streamlinedInline .dsStatusBar{
      flex:0 0 auto!important;
    }
    #diagramStudioInlineHost .streamlinedInline .dsViewport{
      display:block!important;
      position:relative!important;
      flex:1 1 480px!important;
      height:auto!important;
      min-height:430px!important;
      overflow:hidden!important;
      border-top:1px solid rgba(255,255,255,.03)!important;
      border-bottom:1px solid rgba(255,255,255,.03)!important;
      background:radial-gradient(circle at center,rgba(52,211,153,.08),transparent 48%),linear-gradient(180deg,#07101b,#050912)!important;
    }
    #diagramStudioInlineHost .streamlinedInline .dsViewport:before{
      content:'PITCH';position:absolute;left:12px;top:10px;z-index:1;pointer-events:none;
      color:rgba(255,255,255,.28);font-size:9px;font-weight:900;letter-spacing:.14em;
    }
    #diagramStudioInlineHost .streamlinedInline .dsCanvasTransform{z-index:2}
    #diagramStudioInlineHost .streamlinedInline .dsPitch{
      border-width:2px!important;border-radius:8px!important;box-shadow:0 18px 48px rgba(0,0,0,.42)!important;
    }

    #${COMMAND_BAR_ID}{display:flex;align-items:center;gap:6px;flex-wrap:wrap;padding:7px 9px;background:rgba(9,15,27,.98);border-bottom:1px solid var(--border)}
    #${COMMAND_BAR_ID} button{padding:7px 9px;font-size:10.5px;white-space:nowrap}
    #${COMMAND_BAR_ID} .dsV2Primary{background:var(--turf-dim);border-color:rgba(52,211,153,.45);color:var(--turf)}
    #${COMMAND_BAR_ID} .dsV2Hint{margin-left:auto;color:var(--text-dim);font-size:10px;white-space:nowrap}
    #${COMMAND_BAR_ID} [data-v2-selected]{font-size:10px;color:var(--text-dim);white-space:nowrap}

    #diagramStudioInlineHost #diagramGroupCopyTools{padding:7px 9px!important;gap:5px!important;background:var(--surface-2)!important;border-bottom:1px solid var(--border)!important}
    #diagramStudioInlineHost #diagramGroupCopyTools:before{content:'GROUP TOOLS';color:var(--text-dim);font-size:9px;font-weight:900;letter-spacing:.08em;margin-right:2px}
    #diagramStudioInlineHost #diagramGroupCopyTools button{padding:7px 8px!important;font-size:10px!important}
    #diagramStudioInlineHost #diagramGroupCopyTools .groupCopyCount{font-size:9.5px!important}

    #diagramStudioInlineHost .streamlinedInline .dsToolPanel{padding:6px 8px!important;background:var(--surface-2)!important}
    #diagramStudioInlineHost .streamlinedInline .dsPaletteButton{height:46px!important;min-width:52px!important;border-radius:9px!important;padding:4px!important}
    #diagramStudioInlineHost .streamlinedInline .dsQuickInspector{min-height:40px!important;padding:5px 8px!important;background:#09111e!important}
    #diagramStudioInlineHost .streamlinedInline .dsStatusBar{min-height:29px!important;height:29px!important;padding:4px 8px!important;background:var(--surface-2)!important}
    #diagramStudioInlineHost .streamlinedInline .dsStepBar{flex:0 0 auto!important;min-height:54px!important;padding:6px 8px!important;background:var(--surface-2)!important;border-top:1px solid var(--border)!important}
    #diagramStudioInlineHost .streamlinedInline .dsStep{min-width:118px!important;padding:7px 9px!important;border-radius:9px!important}

    #diagramStudioInlineHost .dsObject.selected{outline:2px solid var(--sky)!important;outline-offset:2px}
    #diagramStudioInlineHost .dsObject.multiSelected{outline:2px solid var(--gold)!important;outline-offset:2px}
    #diagramStudioInlineHost .dsPointHandle{width:15px!important;height:15px!important;border-width:2px!important}
    #diagramStudioInlineHost .dsResizeHandle{width:15px!important;height:15px!important}
    #diagramStudioInlineHost .dsRotateHandle{width:23px!important;height:23px!important}

    @media(max-width:1000px){
      #editor .grid.two{grid-template-columns:minmax(300px,340px) minmax(0,1fr)!important}
      #diagramStudioInlineHost .diagramStudioOverlay.streamlinedInline{height:760px!important;min-height:650px!important}
      #${COMMAND_BAR_ID} .dsV2Hint{display:none}
    }
    @media(max-width:850px){
      #editor .grid.two{grid-template-columns:1fr!important;gap:12px!important}
      #editor .grid.two>.streamlinedStudioCard{position:relative!important;top:auto!important}
      #diagramStudioInlineHost .diagramStudioOverlay.streamlinedInline{height:720px!important;min-height:620px!important;max-height:none!important;border-radius:14px!important}
      #diagramStudioInlineHost .streamlinedInline .dsViewport{min-height:390px!important;flex-basis:390px!important}
      #diagramStudioInlineHost #diagramGroupCopyTools .groupCopyCount{width:100%;margin-left:0!important}
    }
    @media(max-width:560px){
      #diagramStudioInlineHost .diagramStudioOverlay.streamlinedInline{height:680px!important;min-height:590px!important}
      #diagramStudioInlineHost .streamlinedInline .dsViewport{min-height:340px!important;flex-basis:340px!important}
      #${COMMAND_BAR_ID}{padding:6px;gap:4px}
      #${COMMAND_BAR_ID} button{padding:7px 8px;font-size:10px}
    }
  `;
  document.head.appendChild(style);
}

function fitPitch() {
  const s = state();
  const v = viewport();
  if (!s || !v || !studio()?.classList.contains('open')) return;
  try {
    if (typeof dsPitchDimensions !== 'function' || typeof dsCurrentStep !== 'function') return;
    const dims = dsPitchDimensions(dsCurrentStep().pitchMode);
    if (!dims?.w || !dims?.h || v.clientWidth < 80 || v.clientHeight < 80) return;
    const pad = window.innerWidth < 600 ? 12 : 22;
    const scale = Math.min((v.clientWidth - pad * 2) / dims.w, (v.clientHeight - pad * 2) / dims.h);
    s.zoom = Math.max(.28, Math.min(1.6, scale));
    s.panX = 0;
    s.panY = 0;
    if (typeof dsApplyTransform === 'function') dsApplyTransform();
  } catch (_) {}
}

function queueFit() {
  cancelAnimationFrame(fitFrame);
  fitFrame = requestAnimationFrame(() => { fitFrame = 0; fitPitch(); });
}

function selectedCount() {
  const s = state();
  return s?.selectedIds?.size || 0;
}

function clickGroupTool(selector) {
  document.querySelector(`#diagramGroupCopyTools ${selector}`)?.click();
}

function addProgressionStep() {
  const s = state();
  if (!s) return;
  try {
    const previousCount = s.steps?.length || 0;
    if (typeof dsDuplicateStep === 'function') dsDuplicateStep();
    if ((s.steps?.length || 0) > previousCount) {
      const step = s.steps[s.currentStep];
      if (step) {
        step.name = `Progression ${s.currentStep + 1}`;
        step.kind = 'progression';
      }
      if (typeof dsRenderAll === 'function') dsRenderAll();
      try { if (typeof dsToast === 'function') dsToast('Progression created from this picture'); } catch (_) {}
      queueFit();
    }
  } catch (_) {}
}

function clearSelection() {
  const s = state();
  if (!s?.selectedIds) return;
  s.selectedIds.clear();
  s.primaryId = null;
  try { if (typeof dsRenderCanvas === 'function') dsRenderCanvas(); } catch (_) {}
  try { if (typeof dsRenderInspector === 'function') dsRenderInspector(); } catch (_) {}
  try { if (typeof dsRenderStatus === 'function') dsRenderStatus(); } catch (_) {}
  refreshCommandBar();
}

function refreshCommandBar() {
  const bar = document.getElementById(COMMAND_BAR_ID);
  if (!bar) return;
  const n = selectedCount();
  const selected = bar.querySelector('[data-v2-selected]');
  if (selected) selected.textContent = n ? `${n} selected` : 'Nothing selected';
  bar.querySelector('[data-v2-clear]')?.toggleAttribute('disabled', n === 0);
}

function ensureCommandBar() {
  const main = document.querySelector('#diagramStudioOverlay .dsMain');
  const vp = viewport();
  if (!main || !vp) return;
  let bar = document.getElementById(COMMAND_BAR_ID);
  if (!bar) {
    bar = document.createElement('div');
    bar.id = COMMAND_BAR_ID;
    bar.innerHTML = `
      <button type="button" class="dsV2Primary" data-v2-select>▱ Select Group</button>
      <button type="button" data-v2-progression>＋ Progression</button>
      <button type="button" data-v2-clear>Clear Selection</button>
      <span data-v2-selected>Nothing selected</span>
      <span class="dsV2Hint">Select a group, then copy it to another half or quarter</span>`;
    bar.querySelector('[data-v2-select]').addEventListener('click', () => clickGroupTool('[data-group-select]'));
    bar.querySelector('[data-v2-progression]').addEventListener('click', addProgressionStep);
    bar.querySelector('[data-v2-clear]').addEventListener('click', clearSelection);
    const groupTools = document.getElementById('diagramGroupCopyTools');
    if (groupTools?.parentElement === main) main.insertBefore(bar, groupTools);
    else main.insertBefore(bar, vp);
  }
  refreshCommandBar();
}

function polishLabels() {
  const group = document.getElementById('diagramGroupCopyTools');
  if (group) {
    const select = group.querySelector('[data-group-select]');
    if (select) select.textContent = '▱ Box Select';
    const x = group.querySelector('[data-copy-axis="x"]');
    if (x) x.textContent = '↔ Copy Side';
    const y = group.querySelector('[data-copy-axis="y"]');
    if (y) y.textContent = '↕ Copy Half';
    const xy = group.querySelector('[data-copy-axis="xy"]');
    if (xy) xy.textContent = '⇲ Copy Quarter';
  }
  const preview = document.getElementById('dsPreviewBtn');
  if (preview && !state()?.preview) preview.textContent = 'View Clean';
}

function watchViewport() {
  const v = viewport();
  if (!v || typeof ResizeObserver === 'undefined') return;
  resizeObserver?.disconnect();
  resizeObserver = new ResizeObserver(queueFit);
  resizeObserver.observe(v);
}

function onStudioReady() {
  if (!studio()?.classList.contains('open')) return;
  ensureCommandBar();
  polishLabels();
  watchViewport();
  queueFit();
  setTimeout(queueFit, 80);
  setTimeout(queueFit, 260);
}

function observeStudio() {
  const el = studio();
  if (!el || studioObserver) return;
  studioObserver = new MutationObserver(onStudioReady);
  studioObserver.observe(el, { attributes: true, attributeFilter: ['class'] });
}

function installKeyboard() {
  if (document.__diagramStudioV2Keyboard) return;
  document.__diagramStudioV2Keyboard = true;
  document.addEventListener('keydown', event => {
    if (!studio()?.classList.contains('open')) return;
    if (event.target?.matches?.('input,textarea,select')) return;
    if (event.key === 'Escape') clearSelection();
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'd') {
      if (!selectedCount()) return;
      event.preventDefault();
      clickGroupTool('[data-copy-axis="x"]');
    }
  });
}

function install() {
  addStyles();
  observeStudio();
  installKeyboard();
  onStudioReady();
  window.addEventListener('resize', queueFit, { passive: true });
  setTimeout(onStudioReady, 250);
  setTimeout(onStudioReady, 900);
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
}
