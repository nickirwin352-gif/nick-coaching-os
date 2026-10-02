export const GAME_MODEL_VERSION = '2.0';

export const GAME_MODEL_DEFINITION = 'Four phases. Clear main principles. Three sub-principles under each one. Keep the language simple enough to recognise, coach and review on the pitch.';
export const PLAYER_GAME_MODEL_ANSWER = 'Know the phase. Recognise the principle. Execute the detail.';

export const GAME_PHASES = Object.freeze([
  Object.freeze({ id:'in-possession', label:'In Possession', shortLabel:'In Possession', description:'How we create, connect, move and exploit advantages when we have the ball.' }),
  Object.freeze({ id:'attacking-transition', label:'Attacking Transition', shortLabel:'Attacking Transition', description:'How we attack immediately after regaining the ball and how we finish before the opposition reset.' }),
  Object.freeze({ id:'out-of-possession', label:'Out of Possession', shortLabel:'Out of Possession', description:'How we protect the centre, move together and defend with security.' }),
  Object.freeze({ id:'defensive-transition', label:'Defensive Transition', shortLabel:'Defensive Transition', description:'How we react to loss, protect danger and reconnect the team.' })
]);

function sub(id,title,description) {
  return Object.freeze({ id, title, message:title, description });
}

function principle({id,number,phaseId,message,summary,subPrinciples,keywords=[]}) {
  return Object.freeze({
    id,
    number,
    phaseId,
    title:message,
    principle:message,
    message,
    meaning:summary,
    why:'',
    picture:summary,
    good:subPrinciples.map(item => item.description).join(' '),
    bad:'',
    questions:Object.freeze([]),
    moments:Object.freeze([phaseId]),
    themes:Object.freeze([]),
    practiceKeywords:Object.freeze(keywords),
    subPrinciples:Object.freeze(subPrinciples)
  });
}

export const GAME_MODEL_PRINCIPLES = Object.freeze([
  principle({
    id:'arrive-affect-away',
    number:1,
    phaseId:'in-possession',
    message:'Arrive, Affect, Away',
    summary:'Create separation, arrive to affect the game, then move again after the action.',
    subPrinciples:[
      sub('create-separation','Create Separation','Move to lose, move to receive, arrive with space.'),
      sub('arrive-to-affect','Arrive to Affect','Receive in a way that allows you to play forward, combine, carry or eliminate pressure.'),
      sub('move-after-action','Move After Action','Once you’ve played, clear the space or become useful again.')
    ],
    keywords:['separation','move to receive','arrive with space','play forward','combine','carry','move after','clear the space']
  }),
  principle({
    id:'rotate-replace-release',
    number:2,
    phaseId:'in-possession',
    message:'Rotate, Replace, Release',
    summary:'Use connected movement to create an advantage, replace what has been vacated, then use the advantage.',
    subPrinciples:[
      sub('movement-triggers-movement','Movement Triggers Movement','One movement should provoke another.'),
      sub('replace-the-threat','Replace the Threat','Replace the width, depth or presence that has been vacated.'),
      sub('release-the-rotation','Release the Rotation','Once the movement has created the advantage, use it before the opposition recover.')
    ],
    keywords:['rotation','rotate','replace','vacated','movement triggers movement','width','depth','release']
  }),
  principle({
    id:'combine-commit-cover',
    number:3,
    phaseId:'in-possession',
    message:'Combine, Commit, Cover',
    summary:'Connect the attack, commit players beyond the ball and keep enough security behind the attack.',
    subPrinciples:[
      sub('connect-the-attack','Connect the Attack','Join the back/midfield unit to the forwards through combinations, bounce passes and third-player actions.'),
      sub('commit-bodies-beyond','Commit Bodies Beyond','Someone must take the risk and threaten beyond, attack the last line or enter the box.'),
      sub('cover-the-commitment','Cover the Commitment','Maintain depth and security behind the attack so others have freedom to go.')
    ],
    keywords:['combine','bounce pass','third player','third man','beyond','last line','enter the box','security','cover']
  }),
  principle({
    id:'spot-sense-seize',
    number:4,
    phaseId:'in-possession',
    message:'Spot, Sense, Seize',
    summary:'Recognise the picture, judge the moment and execute before the opportunity closes.',
    subPrinciples:[
      sub('spot-the-picture','Spot the Picture','Recognise the space, movement, defender or passing lane that is developing.'),
      sub('sense-the-moment','Sense the Moment','Judge the timing: not too early, not too late.'),
      sub('seize-the-window','Seize the Window','When the opportunity is there, execute decisively.')
    ],
    keywords:['recognise','space','passing lane','timing','window','decisive','eliminate','break line']
  }),
  principle({
    id:'see-send-sprint',
    number:5,
    phaseId:'attacking-transition',
    message:'See, Send, Sprint',
    summary:'See forward early, penetrate into space and transition together around the first action.',
    subPrinciples:[
      sub('see-forward-early','See Forward Early','First thought and first information should be ahead of the ball.'),
      sub('send-into-space','Send Into Space','Penetrate with the pass or carry when the opportunity is there.'),
      sub('sprint-to-support','Sprint to Support','Transition together; give the first forward action runners around and beyond it.')
    ],
    keywords:['transition','forward early','first pass forward','carry','space','sprint','support','regain']
  }),
  principle({
    id:'stretch-supply-strike',
    number:6,
    phaseId:'attacking-transition',
    message:'Stretch, Supply, Strike',
    summary:'Stretch the back line, deliver into the space the movement creates and finish before the defence can reset.',
    subPrinciples:[
      sub('stretch-the-line','Stretch the Line','Use width, depth, overlaps, underlaps and runs across/beyond to distort the back line.'),
      sub('supply-the-space','Supply the Space','Deliver into the space the movement has created — not simply “put it in the box.” Cut-backs, driven deliveries, inverted crosses, clips behind/over the back line.'),
      sub('strike-it-early','Strike it Early','Do your work before the ball arrives. Arrive ready, finish first-time where possible, and punish defenders before they can reset.')
    ],
    keywords:['width','depth','overlap','underlap','cut-back','cross','delivery','finish','first time','back line']
  }),
  principle({
    id:'screen-shuffle-squeeze',
    number:7,
    phaseId:'out-of-possession',
    message:'Screen, Shuffle, Squeeze',
    summary:'Protect the centre, move together with the ball and compress the pitch when pressure is established.',
    subPrinciples:[
      sub('screen-the-centre','Screen the Centre','Deny central progression and protect the most dangerous spaces first.'),
      sub('shuffle-together','Shuffle Together','Travel with the ball while maintaining the distances within the block.'),
      sub('squeeze-the-space','Squeeze the Space','When pressure is established, compress the pitch around the ball.')
    ],
    keywords:['screen','centre','center','central','shuffle','block','distances','squeeze','compact','pressure']
  }),
  principle({
    id:'spare-step-smother',
    number:8,
    phaseId:'out-of-possession',
    message:'Spare, Step, Smother',
    summary:'Keep security behind the last line, step with confidence and stop the receiver turning or combining.',
    subPrinciples:[
      sub('keep-the-spare','Keep the Spare','Maintain the +1 around the last line whenever possible.'),
      sub('step-with-security','Step With Security','The spare player behind gives the next defender permission to engage aggressively.'),
      sub('smother-the-receiver','Smother the Receiver','Arrive with enough intensity and proximity to stop them turning, travelling or combining freely.')
    ],
    keywords:['spare','plus one','+1','last line','step','security','engage','smother','turning','receiver']
  }),
  principle({
    id:'react-recover-reconnect',
    number:9,
    phaseId:'defensive-transition',
    message:'React, Recover, Reconnect',
    summary:'React immediately to the loss, protect the most dangerous spaces and runners, then restore team compactness.',
    subPrinciples:[
      sub('react-immediately','React Immediately','Respond to the loss straight away.'),
      sub('recover-danger-first','Recover Danger First','Protect the centre, goal and most dangerous runners before worrying about exact positions.'),
      sub('reconnect-the-team','Reconnect the Team','Restore compact distances and defensive structure as quickly as possible.')
    ],
    keywords:['loss','react','recover','centre','center','goal','runner','reconnect','compact','defensive transition']
  })
]);

export const GAME_SUB_PRINCIPLES = Object.freeze(
  GAME_MODEL_PRINCIPLES.flatMap(main => main.subPrinciples.map(item => Object.freeze({
    ...item,
    principleId:main.id,
    phaseId:main.phaseId
  })))
);

// Compatibility alias for older code that still reads "moments".
export const GAME_MOMENTS = GAME_PHASES;

export const TECHNICAL_STANDARDS = Object.freeze([
  'Scan before and after receiving.',
  'First touch with purpose.',
  'Pass with purpose.',
  'Receive to see the next action.',
  'Move after the ball moves.'
]);

export const PRACTICE_ROLES = Object.freeze([
  Object.freeze({ id:'prepare', label:'PREPARE', shortLabel:'Prepare', description:'Get the body and ball ready and bank useful repetitions.' }),
  Object.freeze({ id:'recognise', label:'RECOGNISE', shortLabel:'Recognise', description:'Make the picture clear enough that players learn to see it.' }),
  Object.freeze({ id:'execute', label:'EXECUTE', shortLabel:'Execute', description:'Improve the timing, technique and detail that makes the principle work.' }),
  Object.freeze({ id:'transfer', label:'TRANSFER', shortLabel:'Transfer', description:'Remove support and see whether the behaviour survives in game-real football.' })
]);

export const LEARNING_EMPHASES = Object.freeze([
  Object.freeze({ id:'understand', label:'Understand', description:'Players can explain the principle and why the detail matters.' }),
  Object.freeze({ id:'recognise', label:'Recognise', description:'Players see the picture earlier with less prompting.' }),
  Object.freeze({ id:'execute', label:'Execute', description:'Players can produce the action with better timing, technique and speed.' }),
  Object.freeze({ id:'adapt', label:'Adapt', description:'Players solve changing versions of the problem with minimal instruction.' })
]);

export function phaseById(id='') {
  return GAME_PHASES.find(item => item.id === String(id || '')) || null;
}

export function principleById(id='') {
  return GAME_MODEL_PRINCIPLES.find(item => item.id === String(id || '')) || null;
}

export function subPrincipleById(id='') {
  return GAME_SUB_PRINCIPLES.find(item => item.id === String(id || '')) || null;
}

export function principlesForPhase(phaseId='') {
  return GAME_MODEL_PRINCIPLES.filter(item => item.phaseId === String(phaseId || ''));
}

export function subPrinciplesForPrinciple(principleId='') {
  return principleById(principleId)?.subPrinciples || [];
}

const LEGACY_PHASE_MAP = Object.freeze({
  'with-ball':'in-possession',
  'win-it':'attacking-transition',
  'without-ball':'out-of-possession',
  'lose-it':'defensive-transition'
});

const LEGACY_SAFE_PRINCIPLE_MAP = Object.freeze({
  'arrive':'arrive-affect-away',
  'behind-beneath':'combine-commit-cover',
  'protect-inside':'screen-shuffle-squeeze',
  'win-or-inside':'react-recover-reconnect'
});

export function normaliseGameModelPlan(value={}) {
  const rawPhase = String(value?.gamePhase || value?.phaseId || value?.gameMoment || '');
  const gamePhase = phaseById(rawPhase)?.id || LEGACY_PHASE_MAP[rawPhase] || '';
  const rawPrimary = String(value?.primaryPrincipleId || '');
  const primaryPrincipleId = principleById(rawPrimary)?.id || LEGACY_SAFE_PRINCIPLE_MAP[rawPrimary] || '';
  const validSubs = [...new Set((Array.isArray(value?.subPrincipleIds) ? value.subPrincipleIds : [])
    .map(id => subPrincipleById(id)?.id)
    .filter(Boolean)
    .filter(id => !primaryPrincipleId || subPrincipleById(id)?.principleId === primaryPrincipleId))];
  const emphasis = LEARNING_EMPHASES.some(item => item.id === value?.emphasis) ? value.emphasis : 'recognise';
  return {
    playerProblem:String(value?.playerProblem || '').trim(),
    successLooksLike:String(value?.successLooksLike || '').trim(),
    gamePhase,
    gameMoment:gamePhase,
    primaryPrincipleId,
    subPrincipleIds:validSubs,
    supportingPrincipleId:'',
    emphasis
  };
}

export function standardClarityForPrinciple(id='') {
  const main = principleById(id);
  if (!main) return { why:'', principle:'', picture:'', cue:'', questions:[] };
  return {
    why:'',
    principle:main.message,
    picture:main.summary || main.meaning || '',
    cue:main.message,
    questions:main.subPrinciples.map(item => item.title)
  };
}

export function principlesForMoment(momentId='') {
  const phase = phaseById(momentId)?.id || LEGACY_PHASE_MAP[momentId] || '';
  return principlesForPhase(phase);
}

function textForPractice(practice={}) {
  return [
    practice.id, practice.name, practice.desc, practice.description, practice.cp, practice.coachingPoints,
    practice.prog, practice.progressions, practice.reg, practice.regressions, practice.condRules, practice.rules
  ].filter(Boolean).join(' ').toLowerCase();
}

export function scorePracticeForPrinciple(practice={}, principleId='') {
  const main = principleById(principleId);
  if (!main) return 0;
  const explicit = Array.isArray(practice.gameModelPrincipleIds) ? practice.gameModelPrincipleIds : [];
  if (explicit.includes(main.id)) return 100;
  const subIds = Array.isArray(practice.gameModelSubPrincipleIds) ? practice.gameModelSubPrincipleIds : [];
  if (subIds.some(id => subPrincipleById(id)?.principleId === main.id)) return 95;
  const text = textForPractice(practice);
  let score = 0;
  for (const keyword of main.practiceKeywords || []) if (text.includes(String(keyword).toLowerCase())) score += 2;
  for (const detail of main.subPrinciples || []) {
    const words = detail.title.toLowerCase().split(/\s+/).filter(word => word.length > 4);
    if (words.some(word => text.includes(word))) score += 1;
  }
  return score;
}

export function linkedPracticesForPrinciple(practices=[], principleId='', limit=6) {
  return (Array.isArray(practices) ? practices : [])
    .map(practice => ({ practice, score:scorePracticeForPrinciple(practice,principleId) }))
    .filter(item => item.score > 0)
    .sort((a,b) => b.score-a.score || String(a.practice?.name||'').localeCompare(String(b.practice?.name||'')))
    .slice(0,limit)
    .map(item => item.practice);
}
