export const GAME_MODEL_VERSION = '1.0';

export const GAME_MODEL_DEFINITION = 'We manipulate opponents rather than force play; threaten beyond while staying connected underneath; arrive into space rather than stand in it; protect the centre without the ball; and act together in transition. We create our own advantages, recognise the picture, and attack it decisively.';

export const PLAYER_GAME_MODEL_ANSWER = 'We move teams to create space, then attack what they leave. We always threaten behind while staying connected underneath. We arrive into spaces instead of standing in them. Without the ball we protect the middle and stay connected. When the ball turns over, we either hurt them quickly or get inside together.';

export const GAME_MODEL_PRINCIPLES = Object.freeze([
  Object.freeze({
    id:'move-free',
    number:1,
    title:'Create the advantage',
    principle:'Move them to free us.',
    message:'Bring them. Play where they leave.',
    meaning:'Move opponents to create the free player or space.',
    why:'We create our own route forward instead of hoping one appears.',
    picture:'An opponent moves towards the ball, leaving a player or space available.',
    questions:Object.freeze(['Who moved?', 'What did they leave?']),
    moments:Object.freeze(['with-ball']),
    themes:Object.freeze(['Build Up','Midfield Progression','Chance Creation','Wide Overloads'])
  }),
  Object.freeze({
    id:'behind-beneath',
    number:2,
    title:'Threaten and connect',
    principle:'Threaten behind, connect underneath.',
    message:'One behind. One beneath.',
    meaning:'Always threaten the last line while keeping support underneath.',
    why:'Defenders hate running towards their own goal; the run also creates space underneath.',
    picture:'At least one player threatens beyond the last line while another gives the ball carrier support underneath.',
    questions:Object.freeze(["Who's threatening?", "Who's connecting?"]),
    moments:Object.freeze(['with-ball','win-it']),
    themes:Object.freeze(['Build Up','Midfield Progression','Chance Creation','Wide Overloads','Finishing','Attacking Transition'])
  }),
  Object.freeze({
    id:'arrive',
    number:3,
    title:'Create space through timing',
    principle:'Create space through timing.',
    message:'Arrive. Don’t live there.',
    meaning:'Don’t stand permanently in valuable space — arrive when it can be used.',
    why:'Movement is harder to defend than occupation.',
    picture:'Space is cleared first, then a player arrives as the action develops.',
    questions:Object.freeze(['What space am I creating?', 'When do I arrive?']),
    moments:Object.freeze(['with-ball','win-it']),
    themes:Object.freeze(['Build Up','Midfield Progression','Chance Creation','Wide Overloads','Finishing','Attacking Transition'])
  }),
  Object.freeze({
    id:'break-open',
    number:4,
    title:'Use the advantage',
    principle:'Use the advantage.',
    message:'Break them when it opens.',
    meaning:'When the route beyond a line appears, exploit it.',
    why:'An advantage disappears if we wait too long.',
    picture:'A pass, carry or run can eliminate an opponent or line before they recover.',
    questions:Object.freeze(['Can we eliminate someone?', 'Is it actually on?']),
    moments:Object.freeze(['with-ball','win-it']),
    themes:Object.freeze(['Build Up','Midfield Progression','Chance Creation','Attacking Transition'])
  }),
  Object.freeze({
    id:'protect-inside',
    number:5,
    title:'Protect the danger',
    principle:'Protect the danger.',
    message:'Protect inside.',
    meaning:'Shut the most dangerous central route first.',
    why:'The centre is the quickest route towards our goal.',
    picture:'The central route is closed and the opponent is shown into a less dangerous area.',
    questions:Object.freeze(['What are we protecting?', 'Where do we want them?']),
    moments:Object.freeze(['without-ball','lose-it']),
    themes:Object.freeze(['High Press','Mid Block','Defensive Transition'])
  }),
  Object.freeze({
    id:'connected',
    number:6,
    title:'Act together',
    principle:'Defend together.',
    message:'Stay connected.',
    meaning:'One player’s action must be supported by the players around them.',
    why:'Pressure without cover creates another problem.',
    picture:'One player engages while teammates screen, cover and squeeze the spaces behind and around them.',
    questions:Object.freeze(['Who acts first?', 'What are we protecting behind them?']),
    moments:Object.freeze(['without-ball','lose-it']),
    themes:Object.freeze(['High Press','Mid Block','Counter Press','Defensive Transition'])
  }),
  Object.freeze({
    id:'win-or-inside',
    number:7,
    title:'Protect transition',
    principle:'Protect transition.',
    message:'Win it or get inside.',
    meaning:'After loss: regain if we’re connected; otherwise recover centrally.',
    why:'We either kill the transition immediately or protect the dangerous space.',
    picture:'If numbers are close around the loss we hunt; if not, we recover inside and become compact.',
    questions:Object.freeze(['Can we win it now?', 'If not, what must we protect?']),
    moments:Object.freeze(['lose-it']),
    themes:Object.freeze(['Counter Press','Defensive Transition'])
  })
]);

export const GAME_MOMENTS = Object.freeze([
  Object.freeze({ id:'with-ball', label:'With the ball', description:'Create, recognise and use advantages.', themes:Object.freeze(['Build Up','Midfield Progression','Chance Creation','Wide Overloads','Finishing']) }),
  Object.freeze({ id:'without-ball', label:'Without the ball', description:'Protect danger and defend together.', themes:Object.freeze(['High Press','Mid Block','1v1 & Duel Play']) }),
  Object.freeze({ id:'win-it', label:'When we win it', description:'Exploit the disorganised picture before it disappears.', themes:Object.freeze(['Attacking Transition']) }),
  Object.freeze({ id:'lose-it', label:'When we lose it', description:'Regain if connected; otherwise protect the inside.', themes:Object.freeze(['Counter Press','Defensive Transition']) }),
  Object.freeze({ id:'restart-development', label:'Restarts / development', description:'Useful work that can support the model without forcing a principle link.', themes:Object.freeze(['Set Plays','Fitness','Core Passing Activations','1v1 & Duel Play']) })
]);

export const TECHNICAL_STANDARDS = Object.freeze([
  'Scan before and after receiving.',
  'First touch with purpose.',
  'Pass with purpose.',
  'Receive to see the next action.',
  'Move after the ball moves.'
]);

export const PRACTICE_ROLES = Object.freeze([
  Object.freeze({ id:'activate', label:'ACTIVATE · Tools', shortLabel:'Activate', description:'Bank touches and sharpen technique. A principle link is a bonus, not a requirement.' }),
  Object.freeze({ id:'recognise', label:'RECOGNISE · Picture', shortLabel:'Recognise', description:'Design the practice so today’s picture appears repeatedly and clearly.' }),
  Object.freeze({ id:'apply', label:'APPLY · Transfer', shortLabel:'Apply', description:'Remove support and see whether players recognise and solve the picture in game-real play.' })
]);

export const LEARNING_EMPHASES = Object.freeze([
  Object.freeze({ id:'understand', label:'Understand', description:'Make the WHY and shared language explicit. Exaggerate the picture so the identity is clear.' }),
  Object.freeze({ id:'recognise', label:'Recognise', description:'Repeat the picture and use questions so players see it earlier with less prompting.' }),
  Object.freeze({ id:'execute', label:'Execute', description:'The principle is understood; coach timing, technique, speed and detail so it succeeds more consistently.' }),
  Object.freeze({ id:'adapt', label:'Adapt', description:'Players solve different versions of the picture with minimal instruction and flexible solutions.' })
]);

export function principleById(id = '') {
  return GAME_MODEL_PRINCIPLES.find(item => item.id === String(id || '')) || null;
}

export function normaliseGameModelPlan(value = {}) {
  const primaryPrincipleId = principleById(value?.primaryPrincipleId)?.id || (value?.primaryPrincipleId === 'custom' ? 'custom' : '');
  const supporting = principleById(value?.supportingPrincipleId)?.id || '';
  const gameMoment = GAME_MOMENTS.some(item => item.id === value?.gameMoment) ? value.gameMoment : '';
  const emphasis = LEARNING_EMPHASES.some(item => item.id === value?.emphasis) ? value.emphasis : 'recognise';
  return {
    playerProblem:String(value?.playerProblem || '').trim(),
    gameMoment,
    primaryPrincipleId,
    supportingPrincipleId:supporting === primaryPrincipleId ? '' : supporting,
    emphasis
  };
}

export function standardClarityForPrinciple(id = '') {
  const principle = principleById(id);
  if (!principle) return { why:'', principle:'', picture:'', cue:'', questions:[] };
  return {
    why:principle.why,
    principle:principle.principle,
    picture:principle.picture,
    cue:principle.message,
    questions:[...principle.questions]
  };
}

export function principlesForMoment(momentId = '') {
  return GAME_MODEL_PRINCIPLES.filter(item => item.moments.includes(momentId));
}
