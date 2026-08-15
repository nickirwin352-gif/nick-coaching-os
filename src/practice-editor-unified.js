const STYLE_ID = 'practiceEditorUnifiedStyles';

function addUnifiedEditorStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    #editor .grid.two{grid-template-columns:minmax(330px,390px) minmax(0,1fr);align-items:start}
    #editor .grid.two>.card:first-child{position:sticky;top:116px;max-height:calc(100dvh - 135px);overflow:auto}
    #editor .grid.two>.streamlinedStudioCard{visibility:visible}
    #editor .streamlinedStudioCard{background:transparent;border:0;box-shadow:none;padding:0!important;min-width:0;overflow:hidden}
    #editor .streamlinedStudioCard>h2{display:none!important}
    #editor .card:first-child h2{margin-bottom:10px}
    #editor .card:first-child h2:after{content:' · Text';color:var(--text-dim);font-weight:600;font-size:12px}
    #diagramStudioInlineHost .diagramStudioOverlay.streamlinedInline{display:none!important}
    #diagramStudioInlineHost .diagramStudioOverlay.streamlinedInline.open{display:flex!important}
    #diagramStudioInlineHost .dsHeaderTitle strong{font-size:16px}
    #diagramStudioInlineHost .dsHeaderTitle span{display:block!important}
    #diagramStudioInlineHost #dsDoneBtn{display:none!important}
    #diagramStudioInlineHost .dsModePill{display:none!important}
    #editor:not(.unifiedWorkspaceReady) #diagramStudioInlineHost{visibility:hidden}
    #editor.unifiedWorkspaceReady #diagramStudioInlineHost{visibility:visible}
    .streamlinedInline.diagramStudioOverlay{height:min(820px,calc(100dvh - 124px));min-height:680px}
    .streamlinedInline .dsToolPanel{padding:5px 7px}
    .streamlinedInline .dsPaletteRows{gap:4px}
    .streamlinedInline .dsPaletteRow{gap:4px}
    .streamlinedInline .dsPaletteButton{height:48px;min-width:54px;padding:3px!important}
    .streamlinedInline .dsQuickInspector{min-height:42px;padding:5px 7px}
    .streamlinedInline .dsStepBar{min-height:48px;padding:5px 7px}
    .streamlinedInline .dsStep{min-width:105px;padding:5px 7px}
    .streamlinedInline .dsViewport{min-height:430px;cursor:crosshair}
    @media(max-width:850px){
      #editor .grid.two{display:grid!important;grid-template-columns:1fr!important}
      #editor .grid.two>.card:first-child{order:1;position:relative;top:auto;max-height:none;overflow:visible}
      #editor .grid.two>.streamlinedStudioCard{order:2}
      .streamlinedInline.diagramStudioOverlay{height:68dvh;min-height:540px}
    }
  `;
  document.head.appendChild(style);
}

function activateEditorView() {
  const active = document.querySelector('.tab.active');
  if (active?.dataset?.tab === 'library' && typeof saveLibraryState === 'function') saveLibraryState();
  document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
  document.querySelectorAll('.tab[data-tab="editor"]').forEach(tab => tab.classList.add('active'));
  document.querySelectorAll('.view').forEach(view => view.classList.add('hidden'));
  const editor = document.getElementById('editor');
  editor?.classList.remove('hidden', 'unifiedWorkspaceReady');
  try { closeMoreSheet(); } catch (_) {}
}

function ensureInlineStudio() {
  if (!document.getElementById('diagramStudioOverlay')) {
    try { dsInjectUi(); } catch (_) {}
  }
  const studio = document.getElementById('diagramStudioOverlay');
  if (studio && !studio.parentElement?.matches('#diagramStudioInlineHost')) {
    try { dsMoveStudioTo('practice'); } catch (_) {}
  }
  return studio;
}

function refreshPracticeControls() {
  try { renderPracticeCpChips(); } catch (_) {}
  try { renderConditionedGameChips(); } catch (_) {}
  try { renderChipBox('progChips', db.banks.prog, 'prog'); } catch (_) {}
  try { renderChipBox('regChips', db.banks.reg, 'reg'); } catch (_) {}
  try { toggleConditionedRulesBlock(); } catch (_) {}
  try { populateDiagramSourceSelect(); } catch (_) {}
}

function finishWorkspaceOpen() {
  const editor = document.getElementById('editor');
  const studio = ensureInlineStudio();
  if (!editor || !studio) return;

  try {
    if (typeof dsState !== 'undefined' && dsState?.source === 'session') {
      try { dsSyncInlineDraft(true); } catch (_) {}
      dsState = null;
    }
  } catch (_) {}

  const formPracticeId = document.getElementById('oldId')?.value || document.getElementById('pid')?.value || '';
  try {
    if (typeof dsState !== 'undefined' && dsState?.source === 'practice' && String(dsState.practiceId || '') !== String(formPracticeId || '')) {
      dsState = null;
      studio.classList.remove('open', 'dsPreviewMode');
    }
  } catch (_) {}

  try {
    if (typeof dsState === 'undefined' || !dsState || dsState.source !== 'practice') dsOpenPracticeStudio();
    else {
      dsMoveStudioTo('practice');
      studio.classList.add('open');
      dsState.preview = false;
      studio.classList.remove('dsPreviewMode');
      dsRenderAll();
    }
  } catch (_) {}

  const title = document.getElementById('dsTitle');
  if (title) title.textContent = `${document.getElementById('pname')?.value || 'New Practice'} Diagram`;
  const subtitle = document.getElementById('dsSubtitle');
  if (subtitle) subtitle.textContent = 'Write the practice on the left and build the diagram here';
  const preview = document.getElementById('dsPreviewBtn');
  if (preview) preview.textContent = 'Preview';
  const done = document.getElementById('dsDoneBtn');
  if (done) done.style.display = 'none';
  studio.classList.add('open');
  editor.classList.add('unifiedWorkspaceReady');
  window.scrollTo(0, 0);
  requestAnimationFrame(() => { try { dsFitPitch(); } catch (_) {} });
}

function installUnifiedPracticeEditor() {
  addUnifiedEditorStyles();

  window.newPractice = function() {
    try { saveLibraryState(); } catch (_) {}
    try { clearForm(); } catch (_) {}
    refreshPracticeControls();
    activateEditorView();
    finishWorkspaceOpen();
  };

  window.editPractice = function(id) {
    try { saveLibraryState(); } catch (_) {}
    let practice = null;
    try { practice = db.practices.find(item => String(item.id) === String(id)); } catch (_) {}
    if (!practice) return;

    const studio = document.getElementById('diagramStudioOverlay');
    try {
      if (typeof dsState !== 'undefined' && dsState) {
        dsState = null;
        studio?.classList.remove('open', 'dsPreviewMode');
      }
    } catch (_) {}

    oldId.value = practice.id;
    pid.value = practice.id;
    pname.value = practice.name;
    theme.value = practice.theme;
    stage.value = practice.stage;
    players.value = practice.players || '';
    time.value = practice.time || '';
    area.value = practice.area || '';
    desc.value = practice.desc || '';
    prog.value = practice.prog || '';
    reg.value = practice.reg || '';
    cp.value = practice.cp || '';
    condRules.value = practice.condRules || '';

    try {
      practiceDiagramStepsDraft = dsPracticeSteps(practice);
      diagram = dsClone(practiceDiagramStepsDraft[0].diagram);
      pitchMode = practiceDiagramStepsDraft[0].pitchMode;
    } catch (_) {
      diagram = Array.isArray(practice.diagram) ? JSON.parse(JSON.stringify(practice.diagram)) : [];
      pitchMode = practice.pitchMode || 'full';
    }
    try { selected = null; selectedSet.clear(); draw(); } catch (_) {}
    try { dsRenderEditorPreview(); } catch (_) {}
    refreshPracticeControls();
    activateEditorView();
    finishWorkspaceOpen();
  };

  window.editPracticeFromList = function(event, id) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    window.editPractice(String(id));
  };

  document.querySelectorAll('.tab[data-tab="editor"]').forEach(oldButton => {
    const button = oldButton.cloneNode(true);
    oldButton.replaceWith(button);
    button.onclick = event => {
      event.preventDefault();
      activateEditorView();
      ensureInlineStudio();
      if (!document.getElementById('oldId')?.value && !document.getElementById('pname')?.value) {
        try { clearForm(); } catch (_) {}
        refreshPracticeControls();
      }
      finishWorkspaceOpen();
    };
  });

  document.getElementById('pname')?.addEventListener('input', () => {
    const title = document.getElementById('dsTitle');
    if (title) title.textContent = `${pname.value || 'New Practice'} Diagram`;
  });

  document.getElementById('editor')?.classList.remove('unifiedWorkspaceReady');
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installUnifiedPracticeEditor, { once: true });
  else installUnifiedPracticeEditor();
}

export { installUnifiedPracticeEditor };
