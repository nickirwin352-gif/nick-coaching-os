export const ADVANCED_BUILDER_VISUAL_FOCUS_VERSION = 1;
export const VISUAL_PICKER_PAGE_SIZE = 3;
export const SESSION_PREVIEW_PAGE_SIZE = 1;

const STYLE_ID = 'advancedBuilderVisualFocusV1Styles';
const PREVIEW_PAGER_ID = 'advancedBuilderPreviewPagerV1';
const PICKER_TOP_PAGER_ID = 'advancedBuilderPickerTopPagerV1';
const PICKER_BOTTOM_PAGER_ID = 'advancedBuilderPickerBottomPagerV1';

let previewPage = 0;
let previewCount = 0;
let pickerPage = 0;
let pickerKey = '';

function field(id) { return document.getElementById(id); }

function addStyles() {
  if (field(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    #planner>.grid.two{grid-template-columns:minmax(500px,.86fr) minmax(0,1.45fr);align-items:start}
    #preview{min-width:0}
    #preview .practiceDetail{display:block!important;padding:12px!important;margin:10px 0!important}
    #preview .practiceDetail>div:first-child{width:100%;min-width:0}
    #preview .practiceDetail .pitchMini{width:100%!important;max-width:none!important;height:300px!important;margin:0 0 12px!important;border-radius:12px!important}
    #preview .practiceDetail h3{font-size:15px!important;margin-top:2px!important}
    #preview .practiceCols{grid-template-columns:1fr!important}
    .advancedBuilderFocusPager{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 9px;margin:9px 0;border:1px solid rgba(56,189,248,.22);border-radius:11px;background:rgba(56,189,248,.045)}
    .advancedBuilderFocusPager .focusPagerMeta{min-width:0;font-size:10px;color:var(--text-dim);line-height:1.35}.advancedBuilderFocusPager .focusPagerMeta b{display:block;color:var(--text);font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .advancedBuilderFocusPager .focusPagerActions{display:flex;gap:5px;flex:none}.advancedBuilderFocusPager button{padding:5px 8px;font-size:10px}
    .advancedBuilderFocusPager button:disabled{opacity:.38;cursor:default}

    #visualPicker .pitchCard{grid-template-columns:minmax(420px,52%) minmax(0,1fr)!important;gap:14px!important;padding:13px!important;align-items:start!important}
    #visualPicker .pitchCard>div:nth-child(2){min-width:0}
    #visualPicker .pitchCard .pitchMini{width:100%!important;max-width:none!important;height:275px!important;margin:0!important;border-radius:11px!important}
    #visualPicker .pitchCard>div:last-child>p{line-height:1.45}
    #visualPicker .pitchCard>div:last-child>p:not(.small){display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:4;overflow:hidden}
    #visualPicker .pitchCard[hidden],#visualPicker .themeGroupHeader[hidden]{display:none!important}
    #${PICKER_TOP_PAGER_ID}{margin-top:10px;margin-bottom:10px}
    #${PICKER_BOTTOM_PAGER_ID}{margin-top:10px;margin-bottom:2px}

    @media(max-width:1100px){
      #planner>.grid.two{grid-template-columns:minmax(420px,.9fr) minmax(0,1.2fr)}
      #preview .practiceDetail .pitchMini{height:260px!important}
      #visualPicker .pitchCard{grid-template-columns:1fr!important}
      #visualPicker .pitchCard .pitchMini{height:300px!important}
    }
    @media(max-width:820px){
      #planner>.grid.two{grid-template-columns:1fr!important}
      #preview .practiceDetail .pitchMini{height:260px!important}
      #visualPicker .pitchCard .pitchMini{height:260px!important}
    }
    @media(max-width:620px){
      #preview .practiceDetail .pitchMini{height:220px!important}
      #visualPicker .pitchCard .pitchMini{height:225px!important}
      .advancedBuilderFocusPager{align-items:flex-start}.advancedBuilderFocusPager .focusPagerMeta{font-size:9px}.advancedBuilderFocusPager .focusPagerMeta b{font-size:10px}
    }
  `;
  document.head.appendChild(style);
}

function clamp(value,min,max) { return Math.max(min,Math.min(max,value)); }

function pagerMarkup({id,label,title,page,total,pageSize}) {
  const pages = Math.max(1,Math.ceil(total/pageSize));
  const safePage = clamp(page,0,pages-1);
  const start = total ? safePage * pageSize + 1 : 0;
  const end = Math.min(total,(safePage + 1) * pageSize);
  return `<div id="${id}" class="advancedBuilderFocusPager"><div class="focusPagerMeta"><b>${title || label}</b><span>${total ? `${label} ${start}${end>start?`–${end}`:''} of ${total}` : `No ${label.toLowerCase()}s`}</span></div><div class="focusPagerActions"><button type="button" data-focus-prev ${safePage<=0?'disabled':''}>← Previous</button><button type="button" data-focus-next ${safePage>=pages-1?'disabled':''}>Next →</button></div></div>`;
}

function previewDetails() {
  const preview = field('preview');
  if (!preview) return [];
  return [...preview.children].filter(el=>el.classList?.contains('practiceDetail'));
}

function previewTitle(detail,index) {
  return String(detail?.querySelector('h3')?.textContent || `Practice ${index + 1}`).trim();
}

function applyPreviewPage({resetOnIncrease=false}={}) {
  const preview = field('preview');
  if (!preview) return;
  field(PREVIEW_PAGER_ID)?.remove();
  const details = previewDetails();
  if (!details.length) { previewPage = 0; previewCount = 0; return; }
  if (resetOnIncrease && details.length > previewCount) previewPage = details.length - 1;
  previewCount = details.length;
  previewPage = clamp(previewPage,0,details.length-1);
  details.forEach((detail,index)=>{ detail.hidden = index !== previewPage; });
  const heading = preview.querySelector('h2');
  const pager = document.createElement('div');
  pager.innerHTML = pagerMarkup({id:PREVIEW_PAGER_ID,label:'Practice',title:previewTitle(details[previewPage],previewPage),page:previewPage,total:details.length,pageSize:SESSION_PREVIEW_PAGE_SIZE});
  const node = pager.firstElementChild;
  (heading || preview.firstElementChild)?.insertAdjacentElement('afterend',node);
  node.querySelector('[data-focus-prev]')?.addEventListener('click',()=>{ previewPage = clamp(previewPage-1,0,details.length-1); applyPreviewPage(); });
  node.querySelector('[data-focus-next]')?.addEventListener('click',()=>{ previewPage = clamp(previewPage+1,0,details.length-1); applyPreviewPage(); });
}

function currentPickerKey() {
  const stage = field('plannerStage')?.value || '';
  const theme = field('pickerThemeFilter')?.value || '';
  const search = field('pickerSearch')?.value || '';
  return [stage,theme,search.trim().toLowerCase()].join('|');
}

function pickerCards() {
  return [...(field('visualPicker')?.querySelectorAll('.pitchCard') || [])];
}

function syncThemeHeaders(cards) {
  const host = field('visualPicker');
  if (!host) return;
  const children = [...host.children];
  children.forEach((child,index)=>{
    if (!child.classList?.contains('themeGroupHeader')) return;
    let hasVisibleCard = false;
    for (let i=index+1;i<children.length;i+=1) {
      const next = children[i];
      if (next.classList?.contains('themeGroupHeader')) break;
      if (next.classList?.contains('pitchCard') && !next.hidden) { hasVisibleCard = true; break; }
    }
    child.hidden = !hasVisibleCard;
  });
}

function buildPickerPager(id,cards) {
  const pageCount = Math.max(1,Math.ceil(cards.length/VISUAL_PICKER_PAGE_SIZE));
  pickerPage = clamp(pickerPage,0,pageCount-1);
  const activeIndex = Math.min(cards.length-1,pickerPage*VISUAL_PICKER_PAGE_SIZE);
  const title = cards[activeIndex]?.querySelector('h3')?.textContent?.trim() || 'Practice options';
  const wrap = document.createElement('div');
  wrap.innerHTML = pagerMarkup({id,label:'Practice option',title,page:pickerPage,total:cards.length,pageSize:VISUAL_PICKER_PAGE_SIZE});
  const node = wrap.firstElementChild;
  node.querySelector('[data-focus-prev]')?.addEventListener('click',()=>{ pickerPage -= 1; applyPickerPage(); });
  node.querySelector('[data-focus-next]')?.addEventListener('click',()=>{ pickerPage += 1; applyPickerPage(); });
  return node;
}

function applyPickerPage({respectFilterChange=true}={}) {
  const host = field('visualPicker');
  if (!host) return;
  field(PICKER_TOP_PAGER_ID)?.remove();
  field(PICKER_BOTTOM_PAGER_ID)?.remove();
  const cards = pickerCards();
  const key = currentPickerKey();
  if (respectFilterChange && key !== pickerKey) { pickerKey = key; pickerPage = 0; }
  if (!cards.length) return;
  const pages = Math.max(1,Math.ceil(cards.length/VISUAL_PICKER_PAGE_SIZE));
  pickerPage = clamp(pickerPage,0,pages-1);
  const start = pickerPage * VISUAL_PICKER_PAGE_SIZE;
  const end = start + VISUAL_PICKER_PAGE_SIZE;
  cards.forEach((card,index)=>{ card.hidden = index < start || index >= end; });
  syncThemeHeaders(cards);
  const top = buildPickerPager(PICKER_TOP_PAGER_ID,cards);
  const bottom = buildPickerPager(PICKER_BOTTOM_PAGER_ID,cards);
  host.prepend(top);
  host.appendChild(bottom);
}

function wrapRenderer(name,after) {
  let original;
  try { original = globalThis[name]; } catch (_) { original = window[name]; }
  if (typeof original !== 'function' || original[`__visualFocusV1_${name}`]) return false;
  const wrapped = function(...args) {
    const beforeCount = name === 'renderPreview' ? previewDetails().length : 0;
    const result = original.apply(this,args);
    requestAnimationFrame(()=>after({beforeCount}));
    return result;
  };
  wrapped[`__visualFocusV1_${name}`] = true;
  try { globalThis[name] = wrapped; } catch (_) {}
  window[name] = wrapped;
  return true;
}

function installHooks() {
  wrapRenderer('renderPreview',({beforeCount})=>applyPreviewPage({resetOnIncrease:previewDetails().length>beforeCount}));
  wrapRenderer('renderVisualPicker',()=>applyPickerPage({respectFilterChange:true}));
}

function install() {
  addStyles();
  installHooks();
  applyPreviewPage();
  applyPickerPage({respectFilterChange:true});
  [100,350,900,1800].forEach(delay=>setTimeout(()=>{ installHooks(); applyPreviewPage(); applyPickerPage({respectFilterChange:true}); },delay));
  document.addEventListener('click',event=>{
    if (event.target.closest?.('[data-tab="planner"],button[onclick*="addPracticeToSession"],button[onclick*="removeSessionDrill"],button[onclick*="duplicateSessionDrill"]')) {
      setTimeout(()=>{ applyPreviewPage(); applyPickerPage({respectFilterChange:true}); },80);
    }
  },true);
  window.NickAdvancedBuilderVisualFocus = Object.freeze({
    version:ADVANCED_BUILDER_VISUAL_FOCUS_VERSION,
    pickerPageSize:VISUAL_PICKER_PAGE_SIZE,
    previewPageSize:SESSION_PREVIEW_PAGE_SIZE,
    refresh(){ applyPreviewPage(); applyPickerPage({respectFilterChange:true}); }
  });
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
}
