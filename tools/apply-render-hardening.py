from pathlib import Path

INDEX = Path('index.html')
text = INDEX.read_text(encoding='utf-8')
original = text


def replace_once(old, new, label, required=True):
    global text
    if old not in text:
        if required:
            raise SystemExit(f'{label}: expected pattern not found')
        print(f'[skip] {label}')
        return
    text = text.replace(old, new, 1)
    print(f'[ok] {label}')


def replace_function(name, next_name, new_source):
    global text
    start = text.find(f'function {name}(')
    end = text.find(f'\nfunction {next_name}(', start)
    if start == -1 or end == -1:
        raise SystemExit(f'Could not bound function {name}')
    text = text[:start] + new_source.rstrip() + text[end:]
    print(f'[ok] replaced {name}')


if 'function escapeJsSingleQuoted(value)' not in text:
    marker = 'function escapeHtml(value){return String(value==null?\'\':value).replace(/[&<>\\\"\']/g,ch=>({\'&\':\'&amp;\',\'<\':\'&lt;\',\'>\':\'&gt;\',\'\\\"\':\'&quot;\',"\'":\'&#39;\'}[ch]))}'
    if marker not in text:
        raise SystemExit('escapeHtml helper not found')
    helper = marker + "\nfunction escapeJsSingleQuoted(value){return String(value==null?'':value).replace(/\\\\/g,'\\\\\\\\').replace(/'/g,\"\\\\'\").replace(/\\r/g,'\\\\r').replace(/\\n/g,'\\\\n').replace(/\\u2028/g,'\\\\u2028').replace(/\\u2029/g,'\\\\u2029')}"
    text = text.replace(marker, helper, 1)
    print('[ok] added inline JS string escaping')

text = text.replace(
    'function opts(stage){return \'<option value="">Select...</option>\'+db.practices.filter(p=>p.stage===stage).map(p=>`<option value="${p.id}">${p.id} · ${p.name}</option>`).join("")}',
    'function opts(stage){return \'<option value="">Select...</option>\'+db.practices.filter(p=>p.stage===stage).map(p=>`<option value="${escapeHtml(p.id)}">${escapeHtml(p.id)} · ${escapeHtml(p.name)}</option>`).join("")}'
)
text = text.replace(
    "function populateDiagramSourceSelect(){let sel=document.getElementById('diagramSourceSelect');if(!sel)return;let cur=sel.value;sel.innerHTML='<option value=\"\">Choose practice...</option>'+db.practices.map(p=>`<option value=\"${p.id}\">${p.id} · ${p.name}</option>`).join('');sel.value=cur;}",
    "function populateDiagramSourceSelect(){let sel=document.getElementById('diagramSourceSelect');if(!sel)return;let cur=sel.value;sel.innerHTML='<option value=\"\">Choose practice...</option>'+db.practices.map(p=>`<option value=\"${escapeHtml(p.id)}\">${escapeHtml(p.id)} · ${escapeHtml(p.name)}</option>`).join('');sel.value=cur;}"
)

render_list = '''function renderList(){
  let q=search.value.toLowerCase(),ft=filterTheme.value,fs=filterStage.value,ff=(document.getElementById("filterFav")||{}).checked;
  practiceList.innerHTML="";if(document.getElementById("favList"))favList.innerHTML="";
  let favs=db.practices.filter(p=>p.isFavourite);
  favs.forEach(p=>{let f=document.createElement("div");f.className="favCard";f.onclick=()=>editPractice(p.id);f.innerHTML=`<b>⭐ ${escapeHtml(p.id)}</b><br><span class="small">${escapeHtml(p.name)}</span><br><span class="pill">${escapeHtml(p.theme)}</span>`;favList&&favList.appendChild(f)});
  if(favList && !favs.length)favList.innerHTML='<p class="small">No favourites yet. Star your core practices.</p>';
  db.practices.filter(p=>(!ft||p.theme==ft)&&(!fs||p.stage==fs)&&(!ff||p.isFavourite)&&JSON.stringify(p).toLowerCase().includes(q)).forEach(p=>{
    let d=document.createElement("div"), escapedId=escapeHtml(escapeJsSingleQuoted(p.id));
    d.className="item";d.dataset.practiceId=p.id;d.onclick=ev=>togglePracticePreview(ev,p.id);
    d.innerHTML=`<div class="row" style="align-items:center"><div><strong>${escapeHtml(p.id)} · ${escapeHtml(p.name)}</strong><span class="pill">${escapeHtml(p.theme)}</span><span class="pill">${escapeHtml(p.stage)}</span><div class="small">${escapeHtml(p.players||"Players not set")} · ${escapeHtml(p.time||"Time not set")} · Used ${practiceUsageCount(p.id)} times</div></div><div class="row" style="flex:none;gap:6px"><button onclick="togglePracticePreview(event,'${escapedId}')">View</button><button onclick="editPracticeFromList(event,'${escapedId}')">Edit</button><button class="starBtn ${p.isFavourite?'starred':''}" onclick="toggleFav(event,'${escapedId}')">${p.isFavourite?'★':'☆'}</button></div></div><div class="practicePreview" id="practice-preview-${safe(p.id)}"><div id="mini-${safe(p.id)}"></div><div><h3>${escapeHtml(p.name)}</h3><p>${nl(p.desc||'No setup description yet.')}</p><div class="practiceCols"><div class="infoBox"><b>Coaching Points</b>${nl(p.cp||'—')}</div><div class="infoBox"><b>Progressions</b>${nl(p.prog||'—')}</div><div class="infoBox"><b>Regressions</b>${nl(p.reg||'—')}</div></div><div class="practicePreviewActions"><button class="primary" onclick="editPracticeFromList(event,'${escapedId}')">Edit Practice</button><button onclick="addPracticeFromLibrary(event,'${escapedId}')">Add to Session Draft</button></div></div></div>`;
    practiceList.appendChild(d);
  });
}'''
replace_function('renderList', 'toggleFav', render_list)

delete_practice = '''function deletePractice(){
let id=oldId.value||pid.value;
if(id&&confirm("Delete this practice? It will also be removed from any archived sessions and blueprints that use it.")){
  db.practices=db.practices.filter(p=>p.id!==id);
  db.sessions.forEach(s=>{const next=window.CoachingOSSessionState.removeAllPractices(sessionDrillIds(s),s.diagramOverrides||[],id);s.drills=next.drills;s.diagramOverrides=next.overrides});
  db.sessionTemplates.forEach(t=>{const next=window.CoachingOSSessionState.removeAllPractices(sessionDrillIds(t),t.diagramOverrides||[],id);t.drills=next.drills;t.diagramOverrides=next.overrides});
  applyPlannerSessionState(window.CoachingOSSessionState.removeAllPractices(plannerDrills,plannerDiagramOverrides,id));
  clearForm();
  store();
}
}'''
replace_function('deletePractice', 'base', delete_practice)

replace_once(
    'practiceSel.innerHTML=\'<option value="">Choose a practice...</option>\'+practices.map(p=>`<option value="${p.id}">${p.id} · ${p.name} (${p.theme})</option>`).join("");',
    'practiceSel.innerHTML=\'<option value="">Choose a practice...</option>\'+practices.map(p=>`<option value="${escapeHtml(p.id)}">${escapeHtml(p.id)} · ${escapeHtml(p.name)} (${escapeHtml(p.theme)})</option>`).join("");',
    'planner practice options'
)

session_list = '''function renderSessionDrillList(){
  const boxes=[document.getElementById("sessionDrillList"),document.getElementById("currentSessionDrawerList")].filter(Boolean);
  const markup=!plannerDrills.length?'<div class="emptyDrills">No practices added yet. Choose a practice to begin building the session.</div>':plannerDrills.map((id,index)=>{const p=get(id);return `<div class="sessionDrillRow"><div class="sessionDrillNumber">${index+1}</div><div><b>${p?(escapeHtml(p.id)+' · '+escapeHtml(p.name)):escapeHtml(id)}</b><div><span class="pill">${p?escapeHtml(p.stage):'Missing practice'}</span>${p&&p.theme?`<span class="pill">${escapeHtml(p.theme)}</span>`:''}${p&&p.time?`<span class="pill">${escapeHtml(p.time)}</span>`:''}</div></div><div class="sessionDrillActions"><button onclick="moveSessionDrill(${index},-1)" ${index===0?'disabled':''}>↑</button><button onclick="moveSessionDrill(${index},1)" ${index===plannerDrills.length-1?'disabled':''}>↓</button><button onclick="duplicateSessionDrill(${index})">Duplicate</button><button class="danger" onclick="removeSessionDrill(${index})">Remove</button></div></div>`}).join("");
  boxes.forEach(box=>box.innerHTML=markup);renderCurrentSessionDock();
}'''
replace_function('renderSessionDrillList', 'renderCurrentSessionDock', session_list)
text = text.replace('`<span class="pill">${i+1}. ${p.name}</span>`', '`<span class="pill">${i+1}. ${escapeHtml(p.name)}</span>`')

text = text.replace(
    'card.innerHTML=`<div class="pickBadge">${inSession?"✓":"+"}</div><div id="vmini-${safe(p.id)}"></div><div><h3 style="margin:0">${p.id} · ${p.name}</h3><span class="pill">${p.theme}</span><span class="pill">${p.stage}</span><span class="pill">${p.players||""}</span><p>${nl(p.desc||"")}</p>',
    'card.innerHTML=`<div class="pickBadge">${inSession?"✓":"+"}</div><div id="vmini-${safe(p.id)}"></div><div><h3 style="margin:0">${escapeHtml(p.id)} · ${escapeHtml(p.name)}</h3><span class="pill">${escapeHtml(p.theme)}</span><span class="pill">${escapeHtml(p.stage)}</span><span class="pill">${escapeHtml(p.players||"")}</span><p>${nl(p.desc||"")}</p>'
)
text = text.replace('header.innerHTML=`<h4>${t}${t===themeValue?', 'header.innerHTML=`<h4>${escapeHtml(t)}${t===themeValue?')

text = text.replace(
    "card.innerHTML=`<h3>${t.isFavourite?'⭐ ':''}${t.name||t.theme||'Session Blueprint'}</h3><span class=\"pill\">${t.theme||'Mixed theme'}</span>",
    "card.innerHTML=`<h3>${t.isFavourite?'⭐ ':''}${escapeHtml(t.name||t.theme||'Session Blueprint')}</h3><span class=\"pill\">${escapeHtml(t.theme||'Mixed theme')}</span>"
)
text = text.replace(
    "card.innerHTML=`<h3>${s.theme||'Session'} · ${s.team||'No team'}</h3><span class=\"pill\">${s.date||'No date'}</span>",
    "card.innerHTML=`<h3>${escapeHtml(s.theme||'Session')} · ${escapeHtml(s.team||'No team')}</h3><span class=\"pill\">${escapeHtml(s.date||'No date')}</span>"
)
text = text.replace('and the ${themeName} theme.</p>', 'and the ${escapeHtml(themeName)} theme.</p>')
text = text.replace('<h3>${index+1}. ${p.name}</h3><span class="pill">${p.stage}</span><span class="pill">${p.time||\'Flexible time\'}</span><span class="pill">${p.players||\'Flexible numbers\'}</span>', '<h3>${index+1}. ${escapeHtml(p.name)}</h3><span class="pill">${escapeHtml(p.stage)}</span><span class="pill">${escapeHtml(p.time||\'Flexible time\')}</span><span class="pill">${escapeHtml(p.players||\'Flexible numbers\')}</span>')

text = text.replace('`<div class="calSessionDot">${s.theme||\'Session\'}</div>`', '`<div class="calSessionDot">${escapeHtml(s.theme||\'Session\')}</div>`')
text = text.replace('${index+1}. ${p?p.stage:id}', '${index+1}. ${p?escapeHtml(p.stage):escapeHtml(id)}')
text = text.replace('${s.date||"No date"}${s.team?` · ${s.team}`:""}', '${escapeHtml(s.date||"No date")}${s.team?` · ${escapeHtml(s.team)}`:""}')
text = text.replace('${s.theme||"Session"}</h3>', '${escapeHtml(s.theme||"Session")}</h3>')
text = text.replace('box.innerHTML=`<h3>${t} <span class="small"', 'box.innerHTML=`<h3>${escapeHtml(t)} <span class="small"')
text = text.replace('<div><b>${s.date}</b> · ${s.team||\'No team\'}<div class="small">', '<div><b>${escapeHtml(s.date||\'\')}</b> · ${escapeHtml(s.team||\'No team\')}<div class="small">')

text = text.replace("${s.team||'No team'} · ${s.theme||'Session'} · ${s.date||''}", "${escapeHtml(s.team||'No team')} · ${escapeHtml(s.theme||'Session')} · ${escapeHtml(s.date||'')}")
text = text.replace('<h1>${p.name}</h1><div class="sidelineMeta">${p.players||\'Players flexible\'} · ${p.time||\'Time flexible\'} · ${p.area||\'Area flexible\'} · ${p.stage}</div>', '<h1>${escapeHtml(p.name)}</h1><div class="sidelineMeta">${escapeHtml(p.players||\'Players flexible\')} · ${escapeHtml(p.time||\'Time flexible\')} · ${escapeHtml(p.area||\'Area flexible\')} · ${escapeHtml(p.stage)}</div>')
text = text.replace('Quick note · ${p.name}</b>', 'Quick note · ${escapeHtml(p.name)}</b>')
text = text.replace('visible.map(x=>`<li>${x}</li>`)', 'visible.map(x=>`<li>${escapeHtml(x)}</li>`)')
text = text.replace("<p>${s.team||'Team'} · ${s.theme||'Session'}</p>", "<p>${escapeHtml(s.team||'Team')} · ${escapeHtml(s.theme||'Session')}</p>")

text = text.replace("<b>${most?most[0]:'—'}</b>", "<b>${most?escapeHtml(most[0]):'—'}</b>")
text = text.replace("<b>${least?least[0]:'—'}</b>", "<b>${least?escapeHtml(least[0]):'—'}</b>")
text = text.replace('`<div class="dashBarRow"><div><b>${theme}</b>', '`<div class="dashBarRow"><div><b>${escapeHtml(theme)}</b>')

text = text.replace('drills:[...plannerDrills],isFavourite:false,useCount:0', 'drills:[...plannerDrills],diagramOverrides:copyPlannerDiagramOverrides(),isFavourite:false,useCount:0')
old_use_blueprint = 'function useBlueprint(index){const t=db.sessionTemplates[index];if(!t)return;t.useCount=Number(t.useCount||0)+1;applyDraftDetails("",t.theme||"",sessionDrillIds(t));objective.value=t.objective||objective.value;links.value=t.links||"";cues.value=t.cues||"";localStorage.setItem("nickCoachOSv3",JSON.stringify(db));renderPreview()}'
new_use_blueprint = 'function useBlueprint(index){const t=db.sessionTemplates[index];if(!t)return;t.useCount=Number(t.useCount||0)+1;applyDraftDetails("",t.theme||"",sessionDrillIds(t));plannerDiagramOverrides=window.CoachingOSSessionState.alignOverrides(plannerDrills,t.diagramOverrides||[]);objective.value=t.objective||objective.value;links.value=t.links||"";cues.value=t.cues||"";localStorage.setItem("nickCoachOSv3",JSON.stringify(db));renderSessionDrillList();renderPreview()}'
if old_use_blueprint in text:
    text = text.replace(old_use_blueprint, new_use_blueprint, 1)

dupe = 'function duplicateSession(i){loadSessionToPlanner(i,"copy")}'
if text.count(dupe) > 1:
    first = text.find(dupe)
    second = text.find(dupe, first + len(dupe))
    text = text[:second] + text[second + len(dupe):]
    print('[ok] removed redundant duplicateSession declaration')

INDEX.write_text(text, encoding='utf-8')
print(f'index.html changed: {text != original}')
