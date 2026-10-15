import {RETIRED_PHRASES} from './retired-bank-phrases.js';
// Drafted from Nick's coaching answers, 14 October 2026. Saved edits always win.
export const DELIVERY_FIELDS={trigger:'Trigger · what do we see?',action:'Preferred action · what do we do?',alternative:'Alternative · when do we change?',roles:'Roles · who does what?',observe:'Outcome · what can we observe?'};
const detail=(trigger,action,alternative,roles,observe)=>({trigger,action,alternative,roles,observe});
export const PRINCIPLE_DELIVERY=Object.freeze({
 'arrive-affect-away':detail('A passing angle opens, a marker follows, or a teammate needs a connection.','Arrive in free space knowing the next action. Connect forward, set or carry; move away if marked or the angle cannot be found.','Hold if already free. A closed reception can set a teammate forward; do not force every player to turn.','Receiver creates the angle; passer finds the furthest AVAILABLE pass; one teammate offers beyond and another beneath.','A reception connects the next action, or movement takes a marker away and frees a teammate.'),
 'rotate-replace-release':detail('A teammate leaves a space and a defender follows or passes the runner on.','Respond to the first movement, replace the missing threat, then release the free player.','Keep the useful position if no advantage appears. Recycle rather than rotate for its own sake.','Example: fullback inside, winger drops, midfielder takes the high wide slot. Or striker drops, bounces to midfield and winger curves into the striker space.','The rotation creates a playable free player while width, height and support remain connected.'),
 'combine-commit-cover':detail('A bounce or third-man connection lets someone threaten beyond the ball.','Connect, commit a runner beyond and cover the space that runner leaves.','If the forward lane closes, set or recycle. Delay an extra runner until cover is connected.','Example: right back finds striker and overlaps; right midfielder covers the vacated channel; left midfielder shifts to protect the centre.','A runner threatens beyond while teammates protect a central counter and offer a recycle pass.'),
 'spot-sense-seize':detail('A last-line movement opens a passing window as the runner arrives.','Scan the next layer, time the release and punch the pass through the available window.','Recycle when the window closes or the next defender can intercept. Move the ball to create a fresh picture.','Runner arrives in the window; passer reads defender and runner together; support provides the next pass if penetration is blocked.','The ball reaches the runner while the lane is open, without forcing a pass into the next defender.'),
 'see-send-sprint':detail('A regain reveals green grass, an available runner or a clear carrying lane.','Use one forward pass when it is available; carry into green grass when that is the better route. Sprint to connect the next action.','Secure and connect if the direct route is shut. Do not add extra passes when the first pass can exploit the space.','Ball winner looks ahead; runner attacks available space; near midfielder supports the wide runner; others keep cover connected.','The first action exploits the available space and support arrives before the runner becomes isolated.'),
 'stretch-supply-strike':detail('In possession or after a regain, width and movement open a delivery lane.','Stretch the line; choose a cutback, far-post clip or deep inverted cross to match the runners. Arrive ready to strike.','Recycle if the delivery window is blocked. Keep depth to move the attack to another opening.','Winger/fullback supplies width; striker threatens height; late runner and far-post runner attack; two support near the edge where numbers allow.','Delivery meets a runner in useful space, with depth available for the second ball or recycle.'),
 'screen-shuffle-squeeze':detail('The ball travels across the opposition or pressure traps the receiver.','Protect the centre, travel together and squeeze only when pressure on the ball is established.','If the first press is beaten, hold or drop together to protect runners and depth.','Near striker forces the direction of a centre-back touch; far striker connects to midfield to prevent the switch back; midfield and back line travel together.','The unit denies central progression without opening gaps through unconnected pressing.'),
 'spare-step-smother':detail('A receiver is about to receive with their back to goal and cover can protect the space behind.','Keep a spare where possible, step with security and win it from the front.','Delay or hold when a step would expose an uncovered runner. A remaining 1v1 is a risk to judge, not an automatic licence to jump.','Centre-back applies pressure from behind without fouling; midfielder arrives from the front to win and secure; covering defender reads the runner.','The receiver cannot turn freely and the regain can be secured, with the space behind protected.'),
 'react-recover-reconnect':detail('At loss, read whether nearby support can affect the ball and protect the centre, or whether the opponent is already running through.','Nearest player affects the ball; others screen inside. Counterpress a reachable central loss with connected support.','Recover immediately when the opponent escapes the pressure and runs at the back line/final block. Delay and deny the centre if a regain is unavailable.','Nearest presses; second screens or supports pressure; third protects the next lane; far side tucks in; back line seeks +1; goalkeeper covers behind. Reconnect into 4-4-2 or 4-2-3-1.','Either regain with central cover intact, or slow the attack and restore connected distances. No fixed countdown is assumed.')
});
export function principleDelivery(id,saved={}){return {...(PRINCIPLE_DELIVERY[id]||{}),...(saved[id]||{})};}
const CORE_PERSONAL_POINTS=Object.freeze({
 'create-separation':['Lose the marker','Hold if free','Drag to free'],
 'arrive-to-affect':['Arrive connected','Know the next pass','Set to go forward'],
 'move-after-action':['Away if marked','Reoffer beneath','Clear their space'],
 'movement-triggers-movement':['One goes, one responds','Fullback in, winger down','Striker drops, winger curves'],
 'replace-the-threat':['Replace the width','Keep the height','One beyond, one beneath'],
 'release-the-rotation':['Find the free man','Release the space','Before they reset'],
 'connect-the-attack':['Soft set','Third man through','Bounce to draw'],
 'commit-bodies-beyond':['Overlap with intent','Arrive beyond','Late into the box'],
 'cover-the-commitment':['Cover the runner','Protect inside','Shift across'],
 'spot-the-picture':['Scan the next layer','Find the green grass','Read the last line'],
 'sense-the-moment':['Arrive in the window','Wait for movement','Before it closes'],
 'seize-the-window':['Punched in','Furthest available','Recycle if shut'],
 'see-forward-early':['Eyes ahead','Runner or green grass','Recognise the regain'],
 'send-into-space':['One pass through','Into their path','Carry the grass'],
 'sprint-to-support':['Sprint to connect','Support the wide runner','Beyond and beneath'],
 'stretch-the-line':['Hold the width','Threaten the height','Overlap to stretch'],
 'supply-the-space':['Cut it back','Clip far post','Across and behind'],
 'strike-it-early':['Arrive ready','Attack far post','Follow the second ball'],
 'screen-the-centre':['Nothing inside','Screen with intent','Force one way'],
 'shuffle-together':['Travel together','Close the gap','Stop the switch back'],
 'squeeze-the-space':['Pressure then squeeze','Step together','Beaten? Drop'],
 'keep-the-spare':['Find the spare','Cover behind','Read the runner'],
 'step-with-security':['Check then step','Connected cover','Hold if exposed'],
 'smother-the-receiver':['Win it from the front','Strong and fair','Secure the regain'],
 'react-immediately':['Nearest affects','Screen inside','Connected pressure'],
 'recover-danger-first':['Protect centre first','Delay the runner','Recover goal-side'],
 'reconnect-the-team':['Tuck in','Reconnect the units','Restore the distances']
});
const EXTRA_PERSONAL_POINTS={"create-separation": ["Check away then arrive", "Start on the blind side", "Change speed to escape"], "arrive-to-affect": ["Scan before asking", "Safe side under pressure", "Touch for the next action"], "move-after-action": ["Offer a new angle", "Connect beyond the pass", "Leave room for the next arrival"], "movement-triggers-movement": ["Read who follows", "Opposite movement frees space", "Move when the teammate moves"], "replace-the-threat": ["Fill the vacated lane", "Keep support beneath", "Stay connected through rotation"], "release-the-rotation": ["Match pass to runner", "Play into the new angle", "Recycle when the lane shuts"], "connect-the-attack": ["Show the passing angle", "One beyond, one beneath", "Set into the runner’s path"], "commit-bodies-beyond": ["Underlap the open lane", "Time the run with the pass", "Threaten behind the defender"], "cover-the-commitment": ["Stay beneath the attack", "Read their counter outlet", "Keep a recycle pass"], "spot-the-picture": ["Read pressure before receiving", "See runner and defender", "Know the next pass"], "sense-the-moment": ["Read the defender’s touch", "Release as the runner arrives", "Wait without losing the opening"], "seize-the-window": ["Pass into the runner’s path", "Carry through the open lane", "Release before recovery"], "see-forward-early": ["Read the recovering defender", "Find the furthest available pass", "See space as well as feet"], "send-into-space": ["Commit then release", "Match weight to the run", "Secure if the route closes"], "sprint-to-support": ["Create the next angle", "Far side joins the threat", "Stay available after the first pass"], "stretch-the-line": ["Pin the last line", "Far side stays a threat", "Keep depth beneath the attack"], "supply-the-space": ["Read the arriving runner", "Look before delivery", "Recycle when the lane closes"], "strike-it-early": ["Adjust feet to the delivery", "Finish across when available", "Arrive with the ball"], "screen-the-centre": ["See ball and central player", "Own the inside shoulder", "Stay goal-side of danger"], "shuffle-together": ["Far side tucks in", "Match the speed of the ball", "Keep distances between units"], "squeeze-the-space": ["Close exits around pressure", "Read the runner behind", "Hold if pressure is absent"], "keep-the-spare": ["See ball and runner", "Keep depth to intervene", "Communicate the handover"], "step-with-security": ["Read the pass before jumping", "Arrive under control", "Protect the runner behind"], "smother-the-receiver": ["Deny the first turn", "Midfielder attacks from the front", "Read the bounce and reconnect"], "react-immediately": ["Close the nearest exit", "Read whether support can arrive", "Delay if a regain is unavailable"], "recover-danger-first": ["Track the most dangerous run", "Protect the space behind", "Cover across the break"], "reconnect-the-team": ["Find the unit line", "Talk across the block", "Move together after recovery"]};
export const PERSONAL_POINTS=Object.freeze(Object.fromEntries(Object.entries(CORE_PERSONAL_POINTS).map(([id,items])=>[id,Object.freeze([...items,...EXTRA_PERSONAL_POINTS[id]])])));
export const FUNDAMENTAL_POINTS=Object.freeze({
 scanning:['Scan pressure and next pass','Use what you see'],
 'back-foot':['Back foot to release','Control then opposite foot'],
 'body-shape':['Open when space allows','Safe side under pressure'],
 'first-touch':['Touch for the next pass','Touch away from pressure'],
 weight:['Punched to feet','Zipped into the path','Soft set'],
 tempo:['Zip it side to side','Arrive onto the set'],
 'one-touch':['Bounce to draw pressure','One touch when the picture allows'],
 'one-two':['Pass and go beyond','1–2 to beat the defender'],
 'third-player':['Third man through pressure','Find the third-man angle'],
 angles:['Show a playable angle','One beyond, one beneath'],
 depth:['Support behind the ball','Offer the recycle'],
 height:['Threaten beyond','Pin the last line'],
 width:['Hold the touchline','Stretch their unit'],
 movement:['Pass then reoffer','Clear space for another'],
 rotation:['One moves, one replaces','Keep the missing threat'],
 timing:['Arrive with the ball','Release in the window'],
 communication:['Turn','Set','Bounce','Switch'],
 'both-feet':['Both sides, both feet','Opposite foot to release']
});
export const TECHNICAL_TOPICS=Object.freeze({
 passing:{label:'Passing & receiving',cp:['Punched to feet','Zipped into the path','Soft set','Back foot to release','Scan the next pass','Safe side under pressure'],cues:['Punched in','Soft set','Back foot','Scan'],observe:'The pass and first touch allow the next action under the pressure available.'},
 finishing:{label:'Finishing',cp:['Arrive ready','Read the delivery','Strike across the keeper','Follow the second ball'],cues:['Ready','Across','Follow'],observe:'The runner adjusts to the delivery and finishes when the opportunity appears.'},
 defending:{label:'1v1 defending',cp:['Protect inside','Slow the approach','Strong and fair','Win then secure'],cues:['Inside','Delay','Secure'],observe:'The defender protects the dangerous route and responds to the attacker’s touch.'},
 goalkeeping:{label:'Goalkeeping · draft',cp:['Read the press','Find the free man','Target the space','Cover behind'],cues:['Read','Find','Cover'],observe:'The goalkeeper chooses a player or usable space and stays connected to the last line.'},
 physical:{label:'Movement & readiness · draft',cp:['Ready to move','Brake under control','Recover then repeat'],cues:['Ready','Control','Recover'],observe:'Players move with control and are ready for the next repetition.'},
 restarts:{label:'Restarts · provisional',cp:['Know the first role','React to the second ball','Protect the counter'],cues:['Role','Second ball','Cover'],observe:'Players know their roles and stay connected after the first contact.'}
});
export function technicalBank(context={}){
 const topic=context.technicalTopic||({'passing-activation':'passing',rondo:'passing',finishing:'finishing',duel:'defending',physical:'physical','set-play':'restarts'}[context.practiceFormat])||'passing';
 const t=TECHNICAL_TOPICS[topic]||TECHNICAL_TOPICS.passing;
 const specifics=topic==='passing'?(context.passingFundamentals||[]).flatMap(id=>FUNDAMENTAL_POINTS[id]||[]):[];
 return {cp:specifics.length?specifics:t.cp,cues:specifics.length?specifics:t.cues,obj:[t.observe],links:[],prog:['Add realistic pressure while preserving the intended action.'],reg:['Add support or space so the same decision remains achievable.'],cond:['Keep the decision available; avoid a compulsory maximum-touch rule.'],reflect:['The setup created useful repetitions.','My demonstration clarified the action.','Adjust the space or support and repeat.']};
}
export const PURPOSE_SUPPORT=Object.freeze({
 prepare:{prog:['Start simple, add a bounce, then rehearse the match picture.'],reg:['Rehearse the first connection before adding the rotation.'],cond:['Bank useful touches on both sides; the activation is optional.']},
 recognise:{prog:['Vary the defender’s position while repeating the same recognisable picture.'],reg:['Add a support player without removing the choice.'],cond:['Create repeated opportunities for the principle; keep the real decision.']},
 execute:{prog:['Increase realistic pressure and connect the next unit.'],reg:['Restore an overload and let the picture repeat before changing it again.'],cond:['Progress when the principle is clear, rather than simply when time is up.']},
 transfer:{prog:['Remove prompts and conditions for the final 5–10 minutes.'],reg:['Briefly restore support, then test again without prompts.'],cond:['Observe whether the behaviour survives open play; record when no relevant opportunity occurs.']}
});
// Only compatible records are eligible. Sorting is lexicographic in Nick's priority order.
export function contextualPhrases(context,kind,records=[],approved=[]){
 const normalise=text=>String(text).toLowerCase().replace(/[.!?]+$/g,'').trim();
 const approvedText=new Map(approved.map(text=>[normalise(text),text]));
 const allowed=new Set(approvedText.keys());
 if(!allowed.size)return [];
 const keys=[['phaseIds','gameModelPhaseIds'],['principleIds','gameModelPrincipleIds'],['subPrincipleIds','gameModelSubPrincipleIds']];
 const field={cp:'cp',prog:'prog',reg:'reg',cond:'condRules',cues:'deliveryCues',obj:'objective',links:'links',reflect:'reflect'}[kind];
 const selected=keys.some(([k])=>context[k]?.length);
 if(!selected&&!context.noGameModelLink)return [];
 const rows=[];
 for(const record of records){
  if(context.noGameModelLink&&(!record.noGameModelLink||record.practiceFormat!==context.practiceFormat))continue;
  if(!context.noGameModelLink&&keys.some(([a,b])=>context[a]?.length&&!context[a].some(id=>(record[b]||[]).includes(id))))continue;
  const score=[...keys.map(([a,b])=>(context[a]||[]).filter(id=>(record[b]||[]).includes(id)).length),...['practicePurpose','practiceFormat'].map(k=>+(!!context[k]&&context[k]===record[k])),(context.passingFundamentals||[]).filter(id=>(record.passingFundamentals||[]).includes(id)).length,...['playerGroup','role'].map(k=>+(!!context[k]&&context[k]===record[k]))];
  rows.push({score,text:String(record[field]||''),date:String(record.updatedAt||record.createdAt||'')});
 }
 rows.sort((a,b)=>{for(let i=0;i<a.score.length;i++){if(a.score[i]!==b.score[i])return b.score[i]-a.score[i];}return b.date.localeCompare(a.date);});
 return [...new Set(rows.flatMap(r=>r.text.split('\n')).map(x=>x.trim()).filter(x=>x&&allowed.has(normalise(x))&&!RETIRED_PHRASES.has(x.toLowerCase())).map(x=>approvedText.get(normalise(x))))].slice(0,8);
}

export function decisionForSelection(id,subIds=[],saved={}){
 const result=principleDelivery(id,saved);
 if(subIds.length===1)return {...result,action:(PERSONAL_POINTS[subIds[0]]||[]).join(' · ')||result.action,...(saved[`sub:${subIds[0]}`]||{})};
 return result;
}
