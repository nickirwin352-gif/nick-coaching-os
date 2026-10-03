import { GAME_MODEL_PRINCIPLES, principleById, subPrincipleById } from './game-model-core.js';

export const BANK_KINDS=Object.freeze({cp:'Coaching points',prog:'Progressions',reg:'Regressions',cond:'Rules / constraints',obj:'Learning objectives',links:'Game model links',cues:'Coach’s cues',reflect:'Reflection prompts'});

// Each sub-principle has its own challenge, support and game condition.
export const SUB_PRACTICE_SUGGESTIONS=Object.freeze({
  'create-separation':['Add a live marker who can follow or pass runners on.','Give the receiver a head start and more space to lose the marker.','Award a bonus for receiving away from a marker with space to act.'],
  'arrive-to-affect':['Let the defender choose whether to press or protect the forward lane.','Use a passive defender and two clear forward options.','Reward a reception that leads to a forward pass, carry or combination.'],
  'move-after-action':['Add an opponent who can screen the return pass.','Use a support neutral and mark a clear space to move into.','After passing, move to offer a new angle or clear space for a teammate.'],
  'movement-triggers-movement':['Allow defenders to track or exchange runners so the second movement must adapt.','Walk through paired movements before adding opposition.','Reward a connected second movement that responds to the first runner.'],
  'replace-the-threat':['Remove fixed positions and ask players to recognise which threat needs replacing.','Mark width and depth reference zones to guide replacement.','Keep a threat in the space a teammate vacates during a rotation.'],
  'release-the-rotation':['Add a recovering defender to shorten the release window.','Use an overload so the passing lane stays open for longer.','Reward using the free player before the defence resets after a rotation.'],
  'connect-the-attack':['Add a defender who can screen the link player or follow the third runner.','Add a linking neutral between units.','Reward a bounce or third-player combination that connects the units.'],
  'commit-bodies-beyond':['Introduce a tracking defender and vary which player runs beyond.','Use an overload and a clearly marked finishing zone.','Reward a well-timed run beyond the ball that creates a threat.'],
  'cover-the-commitment':['Let the opposition counter immediately through either of two outlets.','Pause after the forward run to identify the covering positions.','Attacks only earn the bonus when cover is in place behind the committed runners.'],
  'spot-the-picture':['Vary the defender’s position so the available lane changes each repetition.','Freeze the picture and ask the receiver to identify the open lane.','Before receiving, scan for the space or runner that could be used next.'],
  'sense-the-moment':['Add a recovering defender so the player must judge a shorter window.','Slow the defensive recovery and rehearse the trigger at walking pace.','Reward releasing on the movement cue rather than on a fixed pass count.'],
  'seize-the-window':['Increase live pressure while keeping more than one possible solution.','Create a temporary overload and allow extra touches.','Reward a decisive pass or carry while the forward window is open.'],
  'see-forward-early':['Create regains in different areas with varied forward options.','Use a predictable regain and a clearly visible forward target.','On regaining possession, look forward before choosing whether to penetrate or secure.'],
  'send-into-space':['Let defenders protect either the pass or the carrying lane.','Give the ball winner a free first action and a wider channel.','Reward a forward pass or carry into available space after the regain.'],
  'sprint-to-support':['Start support players farther away and add recovering opponents.','Start a supporting player closer to the ball winner.','Reward support arriving around and beyond the first forward action.'],
  'stretch-the-line':['Allow defenders to shift and track runs across or beyond the line.','Use wide reference channels and a passive back line.','Reward a run that creates width or depth and changes a defender’s position.'],
  'supply-the-space':['Vary the defence so the server chooses between cut-back, cross or pass behind.','Mark two delivery areas and let the server play without pressure.','Reward delivery into the space created by a teammate’s movement.'],
  'strike-it-early':['Add a recovering defender and vary the delivery angle.','Use a predictable delivery with no immediate defender.','Reward an early finish when the player is balanced and the chance is available.'],
  'screen-the-centre':['Add a second central receiver so defenders must prioritise danger.','Reduce central targets and give the defending unit a numerical advantage.','The attack earns a bonus for central progression; defenders protect that lane first.'],
  'shuffle-together':['Allow quick switches of play that test the whole unit’s movement.','Move the ball more slowly across a narrower playing area.','Reward the block shifting together without opening a central gap.'],
  'squeeze-the-space':['Allow an escape pass beyond the press to test the squeeze timing.','Use a clear backward-pass trigger and rehearse the step together.','The unit squeezes only once pressure on the ball is established.'],
  'keep-the-spare':['Vary the attacking numbers and runs to test who becomes the spare.','Start with one extra defender and clear cover positions.','Maintain a spare defender around the last line when numbers allow it.'],
  'step-with-security':['Add a runner beyond the receiver while the defender steps.','Use a passive receiver with a covering defender already in place.','Reward the defender stepping when cover behind has been secured.'],
  'smother-the-receiver':['Let the receiver turn, bounce or carry so the defender must adjust.','Give the pressing defender a shorter approach and restrict the receiver’s options.','Reward preventing a receiver from turning or combining, without fouling.'],
  'react-immediately':['Create unexpected turnovers while players are moving.','Signal the turnover clearly and place the nearest defender close to the ball.','At loss, the nearest player reacts immediately while teammates protect danger.'],
  'recover-danger-first':['Add counterattacking runners through both central and wide channels.','Use one central threat and a clear recovery target.','Reward recovery that protects the goal, centre or most dangerous runner first.'],
  'reconnect-the-team':['Let the opponent switch play during the recovery.','Reduce the pitch width and show clear unit reference positions.','After the first reaction, reconnect the units before chasing the ball again.']
});

const unique=values=>[...new Set(values.filter(Boolean))];
export function resolveBankContext({principleIds=[],subPrincipleIds=[],phaseIds=[],noGameModelLink=false}={}){
  if(noGameModelLink)return {principles:[],subs:[]};
  const phases=new Set(phaseIds.filter(Boolean));
  const requested=unique(principleIds).map(principleById).filter(Boolean);
  const mains=requested.filter(p=>!phases.size||phases.has(p.phaseId));
  const allowed=new Set(mains.map(p=>p.id));
  const subs=unique(subPrincipleIds).map(subPrincipleById).filter(s=>s&&(!phases.size||phases.has(s.phaseId))&&(!requested.length||allowed.has(s.principleId)));
  return {principles:unique([...mains.map(p=>p.id),...subs.map(s=>s.principleId)]).map(principleById),subs};
}
export function defaultSubBank(sub){
  const [progression,regression,condition]=SUB_PRACTICE_SUGGESTIONS[sub.id]||[];
  const main=principleById(sub.principleId)||GAME_MODEL_PRINCIPLES.find(p=>p.subPrinciples.some(s=>s.id===sub.id));
  return {
    cp:[sub.description],prog:[progression],reg:[regression],cond:[condition],
    obj:[`${sub.title}: ${sub.description}`],links:[`${main.message} → ${sub.title}`],
    cues:[sub.title,sub.description],reflect:[`${sub.title}: what did players recognise and do?`,`What helped or prevented ${sub.title.toLowerCase()}?`]
  };
}
export function buildPrincipleWordBanks(context={},custom={}){
  const {principles,subs}=resolveBankContext(context);
  const output=Object.fromEntries(Object.keys(BANK_KINDS).map(key=>[key,[]]));
  for(const main of principles){
    const selected=subs.filter(sub=>sub.principleId===main.id);
    const details=selected.length?selected:main.subPrinciples;
    for(const kind of Object.keys(BANK_KINDS)){
      const mainOverride=custom[`principle:${main.id}`]?.[kind];
      if(!selected.length&&Array.isArray(mainOverride)){output[kind].push(...mainOverride);continue;}
      for(const detail of details){
        const override=custom[`sub:${detail.id}`]?.[kind];
        output[kind].push(...(Array.isArray(override)?override:defaultSubBank(detail)[kind]));
      }
    }
  }
  for(const key of Object.keys(output))output[key]=unique(output[key].filter(x=>typeof x==='string').map(x=>x.trim()));
  return output;
}
