import { GAME_MODEL_PRINCIPLES, subPrincipleById } from './game-model-core.js';

export const FOUR_PHASE_GAME_MODEL_VISUAL_VERSION = 2;

const STYLE_ID = 'fourPhaseGameModelDiagramStylesV2';
const NOTE_ID = 'fourPhaseVisualNoteV2';

const C = Object.freeze({
  blue:'#2563eb',
  orange:'#f97316',
  white:'#f8fafc',
  cyan:'#38bdf8',
  coral:'#fb7185',
  gold:'#fbbf24',
  green:'#22c55e',
  dark:'#07111f'
});

function freezeScene(caption,cue,players=[],paths=[],zones=[],labels=[]){
  return Object.freeze({
    caption,
    cue,
    players:Object.freeze(players.map(Object.freeze)),
    paths:Object.freeze(paths.map(Object.freeze)),
    zones:Object.freeze(zones.map(Object.freeze)),
    labels:Object.freeze(labels.map(Object.freeze))
  });
}
const blue=(x,y,label)=>({team:'blue',x,y,label});
const orange=(x,y,label)=>({team:'orange',x,y,label});
const ball=(x,y)=>({team:'ball',x,y,label:''});
const path=(x1,y1,x2,y2,type='pass',bend=0)=>({x1,y1,x2,y2,type,bend});
const zone=(x,y,w,h,label='SPACE')=>({x,y,w,h,label});
const label=(x,y,text)=>({x,y,text});

export const GAME_MODEL_VISUALS = Object.freeze({
  'arrive-affect-away':Object.freeze({
    'create-separation':freezeScene(
      'The space is empty first. The 8 loses the marker, then arrives as the pass becomes available.',
      'Move to lose. Arrive with space.',
      [blue(185,270,'6'),blue(420,340,'8'),blue(690,225,'9'),orange(410,260,'M'),orange(610,220,'D'),ball(195,285)],
      [path(425,330,505,250,'run',-22),path(215,280,505,250,'pass')],
      [zone(475,205,125,95,'ARRIVE')],
      [label(305,365,'separate first')]
    ),
    'arrive-to-affect':freezeScene(
      'The 8 arrives side-on between lines with the next action already visible: forward, combine or carry.',
      'Arrive ready to affect.',
      [blue(190,285,'6'),blue(470,260,'8'),blue(700,185,'9'),blue(690,335,'W'),orange(430,170,'M'),orange(430,360,'M'),orange(615,260,'D'),ball(478,276)],
      [path(210,280,455,260,'pass'),path(490,255,675,190,'option'),path(490,270,665,330,'option'),path(495,260,590,260,'run')],
      [zone(445,215,105,95,'AFFECT')]
    ),
    'move-after-action':freezeScene(
      'After the first action, the passer immediately clears or reappears in a new lane instead of admiring the pass.',
      'Play. Move. Become useful again.',
      [blue(210,285,'8'),blue(455,260,'9'),blue(660,330,'W'),orange(430,170,'D'),orange(560,285,'D'),ball(455,276)],
      [path(225,280,440,260,'pass'),path(220,270,330,190,'run',-25),path(470,255,645,325,'option')],
      [zone(285,145,115,95,'NEXT SPACE')],
      [label(185,350,'do not stay')]
    )
  }),
  'rotate-replace-release':Object.freeze({
    'movement-triggers-movement':freezeScene(
      'One movement starts the next: the winger comes inside, the 8 rotates out, and the full-back advances into the space created.',
      'One moves. The next reacts.',
      [blue(185,365,'CB'),blue(300,400,'FB'),blue(430,290,'8'),blue(610,155,'W'),orange(520,260,'D'),orange(650,300,'D'),ball(190,380)],
      [path(610,155,520,225,'run',20),path(430,290,565,380,'run',-18),path(300,400,445,410,'run',12)],
      [zone(430,350,170,100,'ROTATION')],
      [label(505,130,'movement provokes movement')]
    ),
    'replace-the-threat':freezeScene(
      'When one player vacates width or depth, another player replaces that threat so the team does not collapse towards the ball.',
      'Vacate it? Replace it.',
      [blue(190,285,'6'),blue(435,160,'W'),blue(410,330,'8'),blue(675,260,'9'),orange(545,175,'D'),orange(545,335,'D'),ball(200,300)],
      [path(435,160,520,255,'run',18),path(410,330,455,160,'run',-16)],
      [zone(390,105,120,95,'WIDTH')],
      [label(575,410,'keep the threat alive')]
    ),
    'release-the-rotation':freezeScene(
      'The rotation moves a defender. The next action attacks the lane that defender has just left before the defence can recover.',
      'Move them, then release it.',
      [blue(190,285,'6'),blue(390,330,'8'),blue(570,185,'W'),blue(735,255,'9'),orange(500,255,'D'),orange(645,300,'D'),ball(195,300)],
      [path(390,330,475,235,'run',20),path(500,255,465,235,'defender'),path(210,285,610,350,'pass',-20),path(610,350,720,270,'option')],
      [zone(535,300,135,90,'FREE LANE')],
      [label(485,120,'release before reset')]
    )
  }),
  'combine-commit-cover':Object.freeze({
    'connect-the-attack':freezeScene(
      'The first forward pass connects through a bounce or third-player action so the attack can travel through units, not in isolated jumps.',
      'Connect through the next player.',
      [blue(165,285,'CB'),blue(355,260,'8'),blue(520,315,'10'),blue(710,225,'9'),orange(440,170,'M'),orange(575,235,'D'),ball(170,300)],
      [path(185,285,340,260,'pass'),path(370,260,505,315,'pass'),path(520,305,690,230,'pass')],
      [zone(325,225,230,120,'CONNECT')],
      [label(450,385,'bounce / third player')]
    ),
    'commit-bodies-beyond':freezeScene(
      'At least one player threatens beyond while others attack the box or last line. The defence has to protect depth as well as the ball.',
      'Someone has to go beyond.',
      [blue(260,285,'8'),blue(545,160,'W'),blue(590,260,'9'),blue(520,365,'8'),orange(620,185,'D'),orange(640,265,'D'),orange(620,350,'D'),ball(265,300)],
      [path(545,160,720,155,'run'),path(590,260,750,245,'run'),path(520,365,700,360,'run'),path(280,285,585,260,'pass')],
      [zone(675,105,145,310,'BEYOND')]
    ),
    'cover-the-commitment':freezeScene(
      'Players can attack aggressively because the 6 and supporting defender keep depth and central security behind the attack.',
      'Attack with freedom. Keep security.',
      [blue(225,280,'CB'),blue(360,285,'6'),blue(595,165,'W'),blue(635,260,'9'),blue(585,355,'8'),orange(675,210,'D'),orange(690,315,'D'),ball(600,180)],
      [path(600,175,700,155,'run'),path(635,260,740,250,'run'),path(585,355,700,345,'run')],
      [zone(190,225,235,125,'COVER')],
      [label(255,410,'protect behind the attack')]
    )
  }),
  'spot-sense-seize':Object.freeze({
    'spot-the-picture':freezeScene(
      'Before the lane is fully open, the ball carrier sees the developing gap between two defenders and the teammate positioned to exploit it.',
      'Spot what is opening.',
      [blue(190,285,'6'),blue(490,270,'8'),blue(700,230,'9'),orange(420,205,'M'),orange(430,345,'M'),orange(620,300,'D'),ball(195,300)],
      [path(215,285,475,270,'option')],
      [zone(385,245,150,75,'LANE')],
      [label(300,155,'see it developing')]
    ),
    'sense-the-moment':freezeScene(
      'The defender shifts towards the ball. The lane is opening, but the pass is delayed until the receiver and defender create the right timing.',
      'Not early. Not late.',
      [blue(190,285,'6'),blue(505,260,'8'),blue(720,245,'9'),orange(425,255,'M'),orange(625,290,'D'),ball(195,300)],
      [path(425,255,390,205,'defender'),path(505,260,555,230,'run',12),path(215,285,490,260,'option')],
      [zone(455,205,145,90,'WINDOW')],
      [label(300,385,'wait for the shift')]
    ),
    'seize-the-window':freezeScene(
      'Once the line-breaking route appears, the action is immediate: pass or carry through it before the opposition can close the gap.',
      'Window open? Go.',
      [blue(190,285,'6'),blue(520,265,'8'),blue(735,245,'9'),orange(400,205,'M'),orange(410,345,'M'),orange(635,300,'D'),ball(195,300)],
      [path(215,285,505,265,'pass'),path(535,260,700,245,'run')],
      [zone(360,235,200,85,'SEIZE')],
      [label(570,170,'eliminate the line')]
    )
  }),
  'see-send-sprint':Object.freeze({
    'see-forward-early':freezeScene(
      'At the regain, the first scan is ahead of the ball. The player sees space and runners before taking the safe backwards option.',
      'First information: forward.',
      [blue(270,285,'8'),blue(575,175,'W'),blue(650,320,'9'),orange(245,240,'M'),orange(455,230,'D'),orange(500,345,'D'),ball(280,300)],
      [path(295,280,555,180,'option'),path(295,295,625,315,'option')],
      [zone(520,120,210,250,'FORWARD')],
      [label(155,360,'regain')]
    ),
    'send-into-space':freezeScene(
      'The first action penetrates the open grass — a pass or carry into space rather than an extra touch that lets the defence recover.',
      'Space is there. Send it.',
      [blue(270,285,'8'),blue(650,205,'W'),blue(610,355,'9'),orange(400,245,'D'),orange(470,350,'D'),ball(280,300)],
      [path(300,280,625,210,'pass'),path(300,295,520,340,'run')],
      [zone(555,135,205,130,'ATTACK SPACE')],
      [label(390,150,'before recovery')]
    ),
    'sprint-to-support':freezeScene(
      'The first forward action is surrounded by immediate support: one runner beyond, one alongside and one underneath.',
      'First action plus runners.',
      [blue(320,280,'8'),blue(530,250,'W'),blue(455,365,'10'),blue(610,150,'9'),orange(565,325,'D'),orange(640,235,'D'),ball(330,295)],
      [path(340,280,515,250,'pass'),path(610,150,745,145,'run'),path(455,365,595,350,'run'),path(320,300,430,315,'run')],
      [zone(500,115,260,270,'SUPPORT')]
    )
  }),
  'stretch-supply-strike':Object.freeze({
    'stretch-the-line':freezeScene(
      'Width and depth pull the back line apart. Runs outside, inside and beyond create gaps rather than everyone arriving in the same lane.',
      'Stretch them in two directions.',
      [blue(405,270,'10'),blue(600,110,'W'),blue(650,260,'9'),blue(565,405,'FB'),orange(650,165,'D'),orange(670,260,'D'),orange(650,350,'D'),ball(415,285)],
      [path(600,110,765,105,'run'),path(650,260,780,250,'run'),path(565,405,735,390,'run')],
      [zone(715,80,130,350,'STRETCH')]
    ),
    'supply-the-space':freezeScene(
      'The movement creates a specific target space. The delivery is chosen for that space — cut-back, driven ball or clip behind — rather than a hopeful cross.',
      'Deliver to the space created.',
      [blue(520,115,'W'),blue(675,245,'9'),blue(590,365,'8'),orange(650,155,'D'),orange(700,305,'D'),orange(585,285,'D'),ball(525,130)],
      [path(535,130,650,330,'cross',28),path(675,245,755,205,'run'),path(590,365,665,330,'run')],
      [zone(625,300,135,90,'TARGET')],
      [label(455,205,'choose the delivery')]
    ),
    'strike-it-early':freezeScene(
      'The arriving player prepares before the ball arrives and finishes in the first available action before defenders can reset.',
      'Arrive ready. Finish early.',
      [blue(535,160,'W'),blue(690,285,'9'),blue(570,365,'8'),orange(655,225,'D'),orange(625,345,'D'),ball(600,315)],
      [path(540,175,660,300,'cross',20),path(570,365,680,295,'run'),path(690,285,805,265,'shot')],
      [zone(655,245,100,90,'STRIKE')],
      [label(700,400,'do the work early')]
    )
  }),
  'screen-shuffle-squeeze':Object.freeze({
    'screen-the-centre':freezeScene(
      'The block protects the direct central route first and shows the ball towards the outside rather than chasing it and opening the middle.',
      'Centre first. Outside second.',
      [blue(470,180,'8'),blue(475,270,'6'),blue(470,360,'8'),blue(650,215,'CB'),blue(650,325,'CB'),orange(250,270,'B'),orange(570,270,'10'),ball(260,285)],
      [path(280,270,550,270,'blocked'),path(280,270,390,145,'option')],
      [zone(425,135,150,270,'PROTECT')],
      [label(250,390,'show outside')]
    ),
    'shuffle-together':freezeScene(
      'As the ball travels wide, the whole block slides together and keeps the distances between players instead of one player jumping alone.',
      'Travel together with the ball.',
      [blue(455,175,'W'),blue(470,260,'6'),blue(455,345,'W'),blue(630,210,'CB'),blue(630,315,'CB'),orange(245,180,'B'),orange(300,360,'B'),ball(250,195)],
      [path(455,175,390,165,'recover'),path(470,260,405,250,'recover'),path(455,345,390,335,'recover'),path(630,210,565,205,'recover'),path(630,315,565,310,'recover')],
      [zone(360,120,240,280,'BLOCK')],
      [label(245,110,'ball moves → block moves')]
    ),
    'squeeze-the-space':freezeScene(
      'Once pressure is established, the players behind step forward and compress the space around the ball so the opponent cannot play out freely.',
      'Pressure on? Squeeze up.',
      [blue(370,250,'W'),blue(485,190,'8'),blue(490,315,'6'),blue(640,220,'CB'),blue(640,325,'CB'),orange(280,260,'B'),orange(525,260,'10'),ball(285,275)],
      [path(370,250,320,255,'press'),path(485,190,430,205,'recover'),path(490,315,435,300,'recover'),path(640,220,575,225,'recover'),path(640,325,575,320,'recover')],
      [zone(295,155,295,220,'SQUEEZE')]
    )
  }),
  'spare-step-smother':Object.freeze({
    'keep-the-spare':freezeScene(
      'Around the last line, two defenders manage one forward so one can engage while the other remains the spare protecting depth.',
      'Keep a +1 behind the threat.',
      [blue(540,225,'CB'),blue(650,300,'CB'),orange(600,255,'9'),orange(300,250,'B'),ball(305,265)],
      [path(320,250,585,255,'option')],
      [zone(615,250,100,110,'SPARE')],
      [label(610,390,'2v1 security')]
    ),
    'step-with-security':freezeScene(
      'The nearest defender can step hard into the receiver because the spare defender is connected behind and ready to cover the space.',
      'Security gives permission to step.',
      [blue(510,235,'CB'),blue(660,310,'CB'),orange(575,250,'9'),orange(300,250,'B'),ball(305,265)],
      [path(510,235,555,245,'press'),path(660,310,625,285,'recover'),path(320,250,560,250,'pass')],
      [zone(610,255,115,100,'COVER')]
    ),
    'smother-the-receiver':freezeScene(
      'The defender arrives close enough and quickly enough that the receiver cannot turn, travel or combine comfortably.',
      'Arrive on touch. Stop the turn.',
      [blue(535,255,'CB'),blue(675,330,'CB'),orange(575,255,'9'),orange(315,255,'B'),ball(565,270)],
      [path(535,255,563,255,'press'),path(330,255,560,255,'pass')],
      [zone(520,210,115,100,'SMOTHER')],
      [label(610,175,'tight on first touch')]
    )
  }),
  'react-recover-reconnect':Object.freeze({
    'react-immediately':freezeScene(
      'At the turnover, the closest connected players react towards the ball immediately rather than stopping or retreating individually.',
      'Lose it? React together.',
      [blue(390,230,'8'),blue(445,330,'6'),blue(520,245,'W'),orange(480,285,'M'),orange(675,255,'9'),ball(485,300)],
      [path(390,230,465,275,'press'),path(445,330,470,300,'press'),path(520,245,495,275,'press')],
      [zone(430,230,115,115,'REACT')]
    ),
    'recover-danger-first':freezeScene(
      'If the regain is not secure, recovery runs protect the goal, central lane and most dangerous runner before players worry about exact positions.',
      'Danger first. Shape second.',
      [blue(410,190,'8'),blue(390,345,'6'),blue(610,330,'CB'),orange(470,275,'B'),orange(665,235,'9'),orange(590,145,'W'),ball(475,290)],
      [path(410,190,520,235,'recover'),path(390,345,515,315,'recover'),path(610,330,650,260,'recover')],
      [zone(520,180,200,190,'PROTECT CENTRE')],
      [label(500,405,'goal + runner first')]
    ),
    'reconnect-the-team':freezeScene(
      'After the first emergency action, the team restores compact distances around the ball and reconnects the lines.',
      'Recover, then reconnect.',
      [blue(430,175,'W'),blue(455,255,'8'),blue(445,340,'6'),blue(615,220,'CB'),blue(615,315,'CB'),orange(330,260,'B'),orange(690,255,'9'),ball(335,275)],
      [path(430,175,470,195,'recover'),path(445,340,480,315,'recover'),path(615,220,575,230,'recover'),path(615,315,575,300,'recover')],
      [zone(430,155,190,205,'RECONNECT')],
      [label(455,390,'restore compact distances')]
    )
  })
});

export const GAME_MODEL_VISUAL_SUB_IDS = Object.freeze(
  Object.values(GAME_MODEL_VISUALS).flatMap(group=>Object.keys(group))
);

export function visualForSubPrinciple(id=''){
  const sub=subPrincipleById(id);
  if(!sub)return null;
  return GAME_MODEL_VISUALS[sub.principleId]?.[sub.id]||null;
}

function esc(value){
  return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function markerId(prefix,type){return `${prefix}-${type}-arrow`;}
function pathStyle(type){
  if(type==='run')return {stroke:C.cyan,dash:'12 9',marker:'run'};
  if(type==='press')return {stroke:C.coral,dash:'',marker:'press'};
  if(type==='recover')return {stroke:C.gold,dash:'11 8',marker:'recover'};
  if(type==='cross')return {stroke:C.gold,dash:'5 7',marker:'cross'};
  if(type==='shot')return {stroke:C.white,dash:'',marker:'shot'};
  if(type==='blocked')return {stroke:C.coral,dash:'6 7',marker:'blocked'};
  if(type==='defender')return {stroke:C.orange,dash:'8 7',marker:'defender'};
  if(type==='option')return {stroke:C.white,dash:'8 8',marker:'option'};
  return {stroke:C.white,dash:'',marker:'pass'};
}
function svgPath(item,prefix){
  const style=pathStyle(item.type);
  const marker=`url(#${markerId(prefix,style.marker)})`;
  if(item.bend){
    const mx=(item.x1+item.x2)/2;
    const my=(item.y1+item.y2)/2 + Number(item.bend||0);
    return `<path d="M ${item.x1} ${item.y1} Q ${mx} ${my} ${item.x2} ${item.y2}" fill="none" stroke="${style.stroke}" stroke-width="${item.type==='press'?6:4}" ${style.dash?`stroke-dasharray="${style.dash}"`:''} marker-end="${marker}" stroke-linecap="round"/>`;
  }
  return `<line x1="${item.x1}" y1="${item.y1}" x2="${item.x2}" y2="${item.y2}" stroke="${style.stroke}" stroke-width="${item.type==='press'?6:4}" ${style.dash?`stroke-dasharray="${style.dash}"`:''} marker-end="${marker}" stroke-linecap="round"/>`;
}
function playerSvg(item){
  if(item.team==='ball')return `<g transform="translate(${item.x} ${item.y})"><circle r="9" fill="${C.white}" stroke="#111827" stroke-width="3"/><circle r="2.6" fill="#111827"/></g>`;
  const fill=item.team==='orange'?C.orange:C.blue;
  return `<g transform="translate(${item.x} ${item.y})"><circle r="22" fill="${fill}" stroke="${C.white}" stroke-width="3"/><text y="5" text-anchor="middle" fill="${C.white}" font-size="15" font-weight="900" font-family="system-ui, sans-serif">${esc(item.label)}</text></g>`;
}
function pitchLines(){
  return `<rect x="18" y="18" width="864" height="484" rx="16" fill="none" stroke="rgba(255,255,255,.62)" stroke-width="3"/>
  <line x1="450" y1="18" x2="450" y2="502" stroke="rgba(255,255,255,.45)" stroke-width="2"/>
  <circle cx="450" cy="260" r="65" fill="none" stroke="rgba(255,255,255,.45)" stroke-width="2"/>
  <circle cx="450" cy="260" r="4" fill="rgba(255,255,255,.62)"/>
  <rect x="18" y="135" width="120" height="250" fill="none" stroke="rgba(255,255,255,.45)" stroke-width="2"/>
  <rect x="762" y="135" width="120" height="250" fill="none" stroke="rgba(255,255,255,.45)" stroke-width="2"/>
  <rect x="18" y="205" width="52" height="110" fill="none" stroke="rgba(255,255,255,.35)" stroke-width="2"/>
  <rect x="830" y="205" width="52" height="110" fill="none" stroke="rgba(255,255,255,.35)" stroke-width="2"/>`;
}
function diagramSvg(subId,scene){
  const prefix='gmv-'+String(subId).replace(/[^a-z0-9_-]/gi,'-');
  const markerTypes=['pass','run','press','recover','cross','shot','blocked','defender','option'];
  const defs=markerTypes.map(type=>{
    const style=pathStyle(type);
    return `<marker id="${markerId(prefix,type)}" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,6 L9,3 z" fill="${style.stroke}"/></marker>`;
  }).join('');
  const zones=scene.zones.map(item=>`<g><rect x="${item.x}" y="${item.y}" width="${item.w}" height="${item.h}" rx="12" fill="rgba(56,189,248,.13)" stroke="rgba(125,211,252,.78)" stroke-width="2" stroke-dasharray="8 7"/><text x="${item.x+item.w/2}" y="${item.y+18}" text-anchor="middle" fill="#dff6ff" font-size="12" font-weight="900" font-family="system-ui, sans-serif">${esc(item.label)}</text></g>`).join('');
  const labels=scene.labels.map(item=>`<g><rect x="${item.x-6}" y="${item.y-17}" width="${Math.max(76,String(item.text).length*7.4)}" height="25" rx="8" fill="rgba(5,8,16,.72)"/><text x="${item.x}" y="${item.y}" fill="#e5edf6" font-size="13" font-weight="750" font-family="system-ui, sans-serif">${esc(item.text)}</text></g>`).join('');
  return `<svg viewBox="0 0 900 520" role="img" aria-label="${esc(subPrincipleById(subId)?.title||'Game model coaching picture')}: ${esc(scene.caption)}" preserveAspectRatio="xMidYMid meet"><defs>${defs}</defs><rect width="900" height="520" rx="18" fill="#11643e"/><path d="M0 0h150v520H0zM300 0h150v520H300zM600 0h150v520H600z" fill="rgba(255,255,255,.028)"/>${pitchLines()}${zones}${scene.paths.map(item=>svgPath(item,prefix)).join('')}${scene.players.map(playerSvg).join('')}${labels}</svg>`;
}

function addStyles(){
  if(document.getElementById(STYLE_ID))return;
  const style=document.createElement('style');
  style.id=STYLE_ID;
  style.textContent=`
    .fpVisualNote{margin:-2px 0 14px;padding:10px 12px;border:1px solid rgba(251,191,36,.26);border-radius:12px;background:rgba(251,191,36,.045);color:#fef3c7;font-size:10.5px;line-height:1.48}.fpVisualNote b{color:#fde68a}
    .fpPrincipleVisual{margin-top:10px;padding:9px;border:1px solid rgba(56,189,248,.22);border-radius:13px;background:rgba(3,10,18,.32)}
    .fpVisualTabs{display:flex;gap:5px;flex-wrap:wrap;margin-bottom:8px}.fpVisualTabs button{flex:1;min-width:110px;padding:6px 7px;font-size:9px;line-height:1.25}.fpVisualTabs button.on{background:rgba(56,189,248,.16);border-color:#38bdf8;color:#dff6ff}
    .fpVisualDiagram{border-radius:11px;overflow:hidden;border:1px solid rgba(255,255,255,.14);background:#0b432e}.fpVisualDiagram svg{display:block;width:100%;height:auto;aspect-ratio:900/520}
    .fpVisualRead{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:9px;align-items:start;margin-top:8px}.fpVisualCaption{font-size:10px;line-height:1.45;color:#d7e4ee}.fpVisualCue{font-size:9px;font-weight:900;color:#a7f3d0;padding:5px 7px;border:1px solid rgba(52,211,153,.28);border-radius:999px;white-space:nowrap}
    .fpVisualLegend{display:flex;gap:9px;flex-wrap:wrap;margin-top:7px;color:var(--text-faint);font-size:8.5px}.fpLegendItem{display:inline-flex;gap:4px;align-items:center}.fpLegendDot{width:9px;height:9px;border-radius:50%;display:inline-block}.fpLegendLine{width:18px;height:0;border-top:2px solid currentColor;display:inline-block}.fpLegendLine.run{border-top-style:dashed;color:#38bdf8}.fpLegendLine.press{color:#fb7185}.fpLegendLine.recover{border-top-style:dashed;color:#fbbf24}
    @media(max-width:620px){.fpVisualRead{grid-template-columns:1fr}.fpVisualCue{white-space:normal;justify-self:start}.fpVisualTabs button{min-width:30%}}
  `;
  document.head.appendChild(style);
}

function visualPanel(main){
  const group=GAME_MODEL_VISUALS[main.id];
  if(!group)return null;
  const first=main.subPrinciples[0]?.id;
  const panel=document.createElement('div');
  panel.className='fpPrincipleVisual';
  panel.dataset.visualPrinciple=main.id;
  panel.innerHTML=`<div class="fpVisualTabs">${main.subPrinciples.map((sub,index)=>`<button type="button" class="${index===0?'on':''}" data-visual-sub="${esc(sub.id)}">${esc(sub.title)}</button>`).join('')}</div><div class="fpVisualDiagram"></div><div class="fpVisualRead"><div class="fpVisualCaption"></div><div class="fpVisualCue"></div></div><div class="fpVisualLegend"><span class="fpLegendItem"><span class="fpLegendDot" style="background:${C.blue}"></span>Us</span><span class="fpLegendItem"><span class="fpLegendDot" style="background:${C.orange}"></span>Opponent</span><span class="fpLegendItem"><span class="fpLegendLine"></span>Ball</span><span class="fpLegendItem"><span class="fpLegendLine run"></span>Movement</span><span class="fpLegendItem"><span class="fpLegendLine press"></span>Pressure</span><span class="fpLegendItem"><span class="fpLegendLine recover"></span>Recovery</span></div>`;
  function show(subId){
    const scene=group[subId];
    if(!scene)return;
    panel.querySelectorAll('[data-visual-sub]').forEach(button=>button.classList.toggle('on',button.dataset.visualSub===subId));
    panel.querySelector('.fpVisualDiagram').innerHTML=diagramSvg(subId,scene);
    panel.querySelector('.fpVisualCaption').textContent=scene.caption;
    panel.querySelector('.fpVisualCue').textContent=scene.cue;
  }
  panel.addEventListener('click',event=>{
    const button=event.target.closest?.('[data-visual-sub]');
    if(button)show(button.dataset.visualSub);
  });
  show(first);
  return panel;
}

function ensureRecognitionNote(view){
  if(!view||view.querySelector('#'+NOTE_ID))return;
  const hero=view.querySelector('.fpHero');
  if(!hero)return;
  const note=document.createElement('div');
  note.id=NOTE_ID;
  note.className='fpVisualNote';
  note.innerHTML='<b>Recognition pictures, not fixed patterns.</b> These diagrams show a picture players can learn to notice. The exact positions, formation and route can change — the principle stays stable.';
  hero.insertAdjacentElement('afterend',note);
}

export function installFourPhaseVisuals(){
  addStyles();
  const view=document.getElementById('gameModel');
  if(!view)return 0;
  ensureRecognitionNote(view);
  let added=0;
  GAME_MODEL_PRINCIPLES.forEach(main=>{
    const card=document.getElementById('fp-principle-'+main.id);
    if(!card||card.querySelector('.fpPrincipleVisual'))return;
    const panel=visualPanel(main);
    if(panel){card.appendChild(panel);added++;}
  });
  return added;
}

function install(){
  installFourPhaseVisuals();
  [50,180,500,1100,2200].forEach(delay=>setTimeout(installFourPhaseVisuals,delay));
  const view=document.getElementById('gameModel');
  if(view&&typeof MutationObserver!=='undefined'){
    const observer=new MutationObserver(()=>installFourPhaseVisuals());
    observer.observe(view,{childList:true,subtree:true});
  }
  document.addEventListener('click',event=>{
    if(event.target.closest?.('[data-tab="gameModel"],#gameModelTabV2,#gameModelMoreTabV2,#openFourPhaseGameModel'))setTimeout(installFourPhaseVisuals,30);
  },true);
  window.NickFourPhaseGameModelVisuals=Object.freeze({version:FOUR_PHASE_GAME_MODEL_VISUAL_VERSION,install:installFourPhaseVisuals,visualForSubPrinciple});
}

if(typeof window!=='undefined'&&typeof document!=='undefined'){
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
}
