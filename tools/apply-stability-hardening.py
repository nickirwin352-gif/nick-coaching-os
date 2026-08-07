from pathlib import Path
import sys

INDEX = Path('index.html')
text = INDEX.read_text(encoding='utf-8')
original = text


def replace_exact(old, new, label, count=None):
    global text
    found = text.count(old)
    if found == 0:
        print(f'[skip] {label}: pattern not present (already patched?)')
        return
    if count is not None and found != count:
        raise SystemExit(f'{label}: expected {count} match(es), found {found}')
    text = text.replace(old, new, 1 if count == 1 else -1)
    print(f'[ok] {label}: replaced {found} match(es)')


# Extract the self-contained Firebase cloud adapter from the HTML monolith.
firebase_marker = '<script type="module">\nimport { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";'
if firebase_marker in text:
    start = text.index(firebase_marker)
    body_start = start + len('<script type="module">\n')
    end = text.index('\n</script>', body_start)
    firebase_code = text[body_start:end].rstrip() + '\n'
    firebase_path = Path('src/firebase-cloud.js')
    firebase_path.parent.mkdir(parents=True, exist_ok=True)
    firebase_path.write_text(firebase_code, encoding='utf-8')
    text = text[:start] + '<script type="module" src="./src/firebase-cloud.js"></script>' + text[end + len('\n</script>'):]
    print('[ok] extracted Firebase cloud adapter to src/firebase-cloud.js')
elif 'src="./src/firebase-cloud.js"' not in text:
    raise SystemExit('Could not find Firebase module block to extract')
else:
    print('[skip] Firebase module already extracted')

# Ensure the pure session-state helper module is loaded.
session_state_tag = '<script type="module" src="./src/session-state.js"></script>'
if session_state_tag not in text:
    text = text.replace('</head>', session_state_tag + '\n</head>', 1)
    print('[ok] added session-state module loader')

# Fix duplicate-session behaviour so every definition uses copy mode.
replace_exact(
    'function duplicateSession(i){loadSessionToPlanner(i);alert("Duplicated into Session Planner. Make your changes, then press Save Session.")}',
    'function duplicateSession(i){loadSessionToPlanner(i,"copy")}',
    'duplicate session copy mode'
)

# Add escaping utility and make newline rendering safe.
safe_fn = "function safe(s){return String(s).replace(/[^a-zA-Z0-9]/g,'')}"
escape_fn = safe_fn + "\nfunction escapeHtml(value){return String(value==null?'':value).replace(/[&<>\\\"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','\\\"':'&quot;',\"'\":'&#39;'}[ch]))}"
if 'function escapeHtml(value)' not in text:
    replace_exact(safe_fn, escape_fn, 'HTML escaping helper', count=1)
replace_exact(
    'function nl(x){return (x||"").replace(/\\n/g,"<br>")}',
    'function nl(x){return escapeHtml(x||"").replace(/\\n/g,"<br>")}',
    'safe newline renderer'
)

# Replace practiceDetail with an escaped renderer for all coach-entered fields.
practice_start = text.find('function practiceDetail(id,compact=false){')
practice_end = text.find('\nfunction renderPlannerPracticeOptions()', practice_start)
if practice_start != -1 and practice_end != -1:
    practice_fn = '''function practiceDetail(id,compact=false){
  let p=get(id);if(!p)return"";
  let mid=`sessionmini-${safe(id)}-${Math.random().toString(36).slice(2,7)}`;
  setTimeout(()=>drawMini(mid,p.diagram||[],p.pitchMode||"full"),0);
  return `<div class="practiceDetail"><div id="${mid}"></div><div><h3>${escapeHtml(p.stage||'Practice')}: ${escapeHtml(p.id||'')} · ${escapeHtml(p.name||'')}</h3><span class="pill">${escapeHtml(p.theme||'')}</span><span class="pill">${escapeHtml(p.players||'')}</span><span class="pill">${escapeHtml(p.time||'')}</span><p>${nl(p.desc||"")}</p><div class="practiceCols"><div class="infoBox"><b>Coaching Points</b><br>${nl(p.cp||"—")}</div><div class="infoBox"><b>Progressions</b><br>${nl(p.prog||"—")}</div><div class="infoBox"><b>Regressions</b><br>${nl(p.reg||"—")}</div>${p.condRules?`<div class="infoBox"><b>Conditioned Game Rules</b><br>${nl(p.condRules)}</div>`:""}</div></div></div>`
}'''
    text = text[:practice_start] + practice_fn + text[practice_end:]
    print('[ok] hardened practice detail rendering')

# Harden key planner previews/cards that still inject free-form text.
text = text.replace('<p>${p.desc||""}</p>', '<p>${nl(p.desc||"")}</p>')
text = text.replace('<p class="small">${p.desc||\'\'}</p>', '<p class="small">${nl(p.desc||\'\')}</p>')
text = text.replace('<p><b>Theme:</b> ${sTheme.value||""}</p>', '<p><b>Theme:</b> ${escapeHtml(sTheme.value||"")}</p>')

# Session-only diagram overrides: persist, restore, and keep aligned with drill operations.
helper_marker = 'function currentPlannerSession(){return {'
if 'function copyPlannerDiagramOverrides()' not in text:
    idx = text.find(helper_marker)
    if idx == -1:
        raise SystemExit('Could not locate currentPlannerSession')
    helper = '''function copyPlannerDiagramOverrides(){
  if(typeof plannerDiagramOverrides==='undefined'||!Array.isArray(plannerDiagramOverrides))return [];
  return plannerDiagramOverrides.map(item=>item==null?null:JSON.parse(JSON.stringify(item)));
}
function applyPlannerSessionState(next){plannerDrills=next.drills;plannerDiagramOverrides=next.overrides;}
'''
    text = text[:idx] + helper + text[idx:]
    print('[ok] added planner override helpers')

load_old = "plannerDrills=sessionDrillIds(s);reflect.value=s.reflect||'';"
load_new = "plannerDrills=sessionDrillIds(s);plannerDiagramOverrides=Array.isArray(s.diagramOverrides)?s.diagramOverrides.map(item=>item==null?null:JSON.parse(JSON.stringify(item))):plannerDrills.map(()=>null);reflect.value=s.reflect||'';"
replace_exact(load_old, load_new, 'restore session diagram overrides', count=1)

replace_exact(
    'drills:[...plannerDrills],reflect:reflect.value,rating:sessionRating.value};}',
    'drills:[...plannerDrills],diagramOverrides:copyPlannerDiagramOverrides(),reflect:reflect.value,rating:sessionRating.value};}',
    'current planner session override persistence',
    count=1
)
replace_exact(
    'drills:[...plannerDrills],reflect:reflect.value,rating:sessionRating.value};\n  if(!base.drills.length)',
    'drills:[...plannerDrills],diagramOverrides:copyPlannerDiagramOverrides(),reflect:reflect.value,rating:sessionRating.value};\n  if(!base.drills.length)',
    'saveSession override persistence',
    count=1
)

# Reset stale override state when starting a fresh/generated planner.
text = text.replace('plannerDrills=[];pickStage="Activation";', 'plannerDrills=[];plannerDiagramOverrides=[];pickStage="Activation";', 1)
text = text.replace('pickerThemeFilter=themeName||"";plannerDrills=[...drills];', 'pickerThemeFilter=themeName||"";plannerDrills=[...drills];plannerDiagramOverrides=plannerDrills.map(()=>null);', 1)

# Route library additions through the aligned planner helper.
text = text.replace('if(!plannerDrills.includes(id))plannerDrills.push(id);showBuildRoute', 'if(!plannerDrills.includes(id))addPracticeToSession(id);showBuildRoute', 1)

# Replace planner list mutations with tested session-state helpers.
operations = {
    'function addPracticeToSession(id){if(!id)return;plannerDrills.push(id);renderSessionDrillList();renderPreview();renderVisualPicker()}':
        'function addPracticeToSession(id){if(!id)return;applyPlannerSessionState(window.CoachingOSSessionState.addPractice(plannerDrills,plannerDiagramOverrides,id));renderSessionDrillList();renderPreview();renderVisualPicker()}',
    'function removeSessionDrill(index){plannerDrills.splice(index,1);renderSessionDrillList();renderPreview();renderVisualPicker()}':
        'function removeSessionDrill(index){applyPlannerSessionState(window.CoachingOSSessionState.removePracticeAt(plannerDrills,plannerDiagramOverrides,index));renderSessionDrillList();renderPreview();renderVisualPicker()}',
    'function removeAllInstancesFromSession(id){plannerDrills=plannerDrills.filter(x=>x!==id);renderSessionDrillList();renderPreview();renderVisualPicker()}':
        'function removeAllInstancesFromSession(id){applyPlannerSessionState(window.CoachingOSSessionState.removeAllPractices(plannerDrills,plannerDiagramOverrides,id));renderSessionDrillList();renderPreview();renderVisualPicker()}',
    'function moveSessionDrill(index,delta){const target=index+delta;if(target<0||target>=plannerDrills.length)return;[plannerDrills[index],plannerDrills[target]]=[plannerDrills[target],plannerDrills[index]];renderSessionDrillList();renderPreview()}':
        'function moveSessionDrill(index,delta){applyPlannerSessionState(window.CoachingOSSessionState.movePractice(plannerDrills,plannerDiagramOverrides,index,delta));renderSessionDrillList();renderPreview();renderVisualPicker()}',
    'function clearSessionDrills(){if(!plannerDrills.length)return;if(confirm("Remove all practices from this session?")){plannerDrills=[];renderSessionDrillList();renderPreview();renderVisualPicker()}}':
        'function clearSessionDrills(){if(!plannerDrills.length)return;if(confirm("Remove all practices from this session?")){plannerDrills=[];plannerDiagramOverrides=[];renderSessionDrillList();renderPreview();renderVisualPicker()}}'
}
for old, new in operations.items():
    replace_exact(old, new, old.split('{',1)[0])

if 'function duplicateSessionDrill(index)' not in text:
    anchor = 'function removeAllInstancesFromSession(id){applyPlannerSessionState(window.CoachingOSSessionState.removeAllPractices(plannerDrills,plannerDiagramOverrides,id));renderSessionDrillList();renderPreview();renderVisualPicker()}\n'
    duplicate_fn = 'function duplicateSessionDrill(index){applyPlannerSessionState(window.CoachingOSSessionState.duplicatePracticeAt(plannerDrills,plannerDiagramOverrides,index));renderSessionDrillList();renderPreview();renderVisualPicker()}\n'
    if anchor not in text:
        raise SystemExit('Could not insert duplicateSessionDrill helper')
    text = text.replace(anchor, anchor + duplicate_fn, 1)
    print('[ok] added missing duplicateSessionDrill implementation')

replace_exact(
    'function currentSidelinePractice(){if(!sidelineState)return null;return get(sidelineState.ids[sidelineState.practiceIndex])}',
    'function currentSidelinePractice(){if(!sidelineState)return null;const i=sidelineState.practiceIndex;return (typeof dsEffectiveSessionPractice==="function"?dsEffectiveSessionPractice(sidelineState.session,i):null)||get(sidelineState.ids[i])}',
    'sideline diagram override rendering',
    count=1
)

text = text.replace(
    "const minis=ids.map((id,index)=>{let p=get(id);",
    "const minis=ids.map((id,index)=>{let p=(typeof dsEffectiveSessionPractice==='function'?dsEffectiveSessionPractice(s,index):null)||get(id);",
    1
)

# Add useful coaching intelligence to the existing dashboard.
if 'function coachingInsightsMarkup(' not in text:
    marker = 'function renderDashboard(){'
    idx = text.find(marker)
    if idx == -1:
        raise SystemExit('Could not locate renderDashboard')
    helper = '''function coachingInsightsMarkup(sessions,counts){
  if(!sessions.length)return '<div class="notice" style="margin-top:16px"><b>Coaching insights</b><div class="small" style="margin-top:6px">Save a few sessions and this area will start surfacing coverage gaps, repeated practices and reflection carry-overs.</div></div>';
  const themeRows=Object.entries(counts).sort((a,b)=>a[1]-b[1]||a[0].localeCompare(b[0]));
  const gap=themeRows[0];
  const practiceCounts={};
  sessions.forEach(s=>sessionDrillIds(s).forEach(id=>practiceCounts[id]=(practiceCounts[id]||0)+1));
  const topPractice=Object.entries(practiceCounts).sort((a,b)=>b[1]-a[1])[0];
  const recent=[...sessions].sort((a,b)=>(b.date||'').localeCompare(a.date||'')).find(s=>(s.reflect||'').trim()||(s.objective||'').trim());
  const ratedByTheme={};
  sessions.filter(s=>Number(s.rating)).forEach(s=>{const key=s.theme||'Unassigned';(ratedByTheme[key]=ratedByTheme[key]||[]).push(Number(s.rating))});
  const bestTheme=Object.entries(ratedByTheme).map(([theme,ratings])=>[theme,ratings.reduce((a,b)=>a+b,0)/ratings.length,ratings.length]).sort((a,b)=>b[1]-a[1]||b[2]-a[2])[0];
  const insights=[];
  if(gap)insights.push(`<li><b>Coverage gap:</b> ${escapeHtml(gap[0])} has ${gap[1]} session${gap[1]===1?'':'s'} in this range.</li>`);
  if(topPractice&&topPractice[1]>1){const p=get(topPractice[0]);insights.push(`<li><b>Most reused practice:</b> ${escapeHtml(p?p.name:topPractice[0])} appears ${topPractice[1]} times. Consider whether repetition is deliberate or whether a fresh constraint would help.</li>`)}
  if(bestTheme)insights.push(`<li><b>Strongest rated theme:</b> ${escapeHtml(bestTheme[0])} averages ${bestTheme[1].toFixed(1)}/5 across ${bestTheme[2]} rated session${bestTheme[2]===1?'':'s'}.</li>`);
  if(recent&&recent.reflect)insights.push(`<li><b>Carry forward:</b> From ${escapeHtml(recent.date||'your latest session')}: ${nl(recent.reflect)}</li>`);
  else if(recent&&recent.objective)insights.push(`<li><b>Carry forward:</b> Revisit the latest objective: ${nl(recent.objective)}</li>`);
  return `<div class="notice" style="margin-top:16px"><b>Coaching insights</b><ul style="margin:8px 0 0;padding-left:20px;line-height:1.6">${insights.join('')}</ul></div>`;
}
'''
    text = text[:idx] + helper + text[idx:]
    dash_start = text.find('function renderDashboard(){', idx + len(helper))
    dash_end = text.find('\n\nfunction updateCloudStatus', dash_start)
    if dash_start == -1 or dash_end == -1:
        raise SystemExit('Could not bound renderDashboard for insights insertion')
    dash = text[dash_start:dash_end]
    if 'coachingInsightsMarkup(sessions,counts)' not in dash:
        close = dash.rfind('}')
        dash = dash[:close] + "box.insertAdjacentHTML('beforeend',coachingInsightsMarkup(sessions,counts));" + dash[close:]
        text = text[:dash_start] + dash + text[dash_end:]
    print('[ok] added coaching insights dashboard')

# Move the stale duplicate HTML file out of the root if present.
legacy = Path('index.html.html')
if legacy.exists():
    legacy_dir = Path('legacy')
    legacy_dir.mkdir(exist_ok=True)
    target = legacy_dir / 'index-pre-unified-editor.html'
    if not target.exists():
        legacy.rename(target)
        print('[ok] moved index.html.html into legacy/')

INDEX.write_text(text, encoding='utf-8')
print(f'index.html changed: {text != original}')
