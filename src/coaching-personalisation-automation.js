const STYLE_ID = 'coachingPersonalisationAutomationStyles';
const VERSION = 'personal-coaching-language-v1';

const CURATED = Object.freeze({
  cp: [
    'Play with a picture before the ball arrives','Check both shoulders before receiving','Receive to play the next action','First touch away from pressure','Pass with the correct weight and detail','Move as the ball travels','Create a new angle after every pass','Support behind, beside and beyond the ball','Recognise when to play through, around or over','Fix an opponent before releasing the ball','Use disguise to move the defender','Play off one or two touches when the picture is clear','Protect the ball when forward play is not on','Stretch the pitch to create inside space','Occupy different vertical and horizontal lines','Find the spare player','Create and exploit the overload','Recognise the moment to switch play','Arrive rather than stand in the next space','Attack the space behind the last line','Counter movement to create separation','Communicate information before the receiver gets the ball','React immediately when possession changes','Nearest player affects the ball','Second player covers the next pass','Third player balances and protects','Protect the middle before chasing wide','Press together, not as individuals','Squeeze the pitch behind the press','Defend forward when the trigger is on','Delay if the ball cannot be won','Recover inside the ball line','Secure the first pass after regain','Attack quickly while the opposition is unbalanced','If the counter is not on, keep the ball','Rest defence ready before the attack breaks down','Scan the goalkeeper and far side before finishing','Choose placement, power or disguise early','Attack rebounds and second balls','Timing of arrival into the box','Finish across the goalkeeper when the picture allows','Quality and purpose on every repetition'
  ],
  prog: [
    'Reduce the playing area','Increase defensive pressure','Make defenders fully live','Limit touches for the possession team','Add a directional target','Add an end-zone or target player','Add transition goals on regain','Add a time limit to score','Reward a line-breaking pass','Reward a third-man combination','Reward a switch of play','Add an overload that can become equal numbers','Remove a neutral player','Allow defenders to counter on regain','Add a second ball immediately after the first action','Start from different realistic positions','Add recovery runners','Add a recovering defender','Introduce an offside line','Add a goalkeeper','Change the restart to make it game-realistic','Progress from unopposed to opposed','Progress from fixed positions to free movement','Make the final repetition completely game-realistic'
  ],
  reg: [
    'Increase the playing area','Reduce defensive pressure','Make one defender passive','Add an extra neutral player','Allow unlimited touches','Remove the time restriction','Remove the transition phase','Use a fixed starting position','Walk through the first repetition','Freeze the practice and rehearse the picture','Reduce the number of defenders','Give the possession team an extra player','Use coach service for consistent restarts','Remove the scoring condition','Allow a safe back pass','Simplify the target to one clear outcome','Keep players in zones until the picture is understood','Reduce the number of decisions in the first phase'
  ],
  obj: [
    'Play forward with control when the opportunity is available','Create the free player and find them quickly','Improve recognition of overloads and underloads','Move the opposition to create space elsewhere','Progress through, around or over pressure','Create and exploit space between units','Improve timing and detail of third-man combinations','Create higher-quality chances from organised possession','Improve decision-making around the penalty area','Regain possession with an immediate collective reaction','Protect the centre and force play into predictable areas','Improve our first actions after winning the ball','Improve our first actions after losing the ball','Connect the team around the ball','Transfer the session theme into realistic game moments'
  ],
  links: [
    'Scan','Receive Forward','Play Through','Play Around','Play Over','Free Player','Third Man','Bounce Pass','Switch Point','Fix and Release','Width and Depth','Five Lanes','Between Lines','Beyond the Line','Overload to Isolate','Underlap','Overlap','Cut Back','Box Occupation','Rest Defence','Counter Press','First Forward Pass','Protect Centre','Force Outside','Lock One Side','Pressing Trigger','Cover Shadow','Compactness','Recovery Run','Second Ball','Transition Mentality'
  ],
  cues: [
    'Picture first','Shoulder check','Back foot','Move it quick','Travel with the ball','Fix him','Release it','Bounce','Set','Third man','Play through','Go around','Can we go over?','Find the spare','Switch it','Stretch them','Arrive now','Hold the width','Run beyond','Attack the gap','Cut it back','Fill the box','Secure behind','Nearest presses','Lock it','Screen inside','Show outside','Jump','Squeeze','Stay connected','Protect the middle','Delay','Recover inside','First pass forward','Can we counter?','Keep it if not','React','Second ball','Reset and go again'
  ],
  reflect: [
    'Did the practice create the problem I wanted the players to solve?','Did the players understand the picture without too much coach intervention?','Was the area the right size for the numbers?','Did the practice produce enough realistic repetitions?','Was the challenge level right for this group?','Did my coaching points improve the behaviour or interrupt the flow?','Which constraint had the biggest positive effect?','Which constraint should be removed next time?','Did the progression arrive at the right moment?','What would I change if I ran this practice tomorrow?','Which players need the same picture again?','Which players are ready for a harder version?','Did the session transfer into the game at the end?','What is the one detail worth repeating next session?','What should I keep exactly the same?'
  ],
  cpByTheme: {
    'Core Passing Activations': ['Scan before the ball travels','Receive on the back foot where possible','First touch sets the next pass','Pass through the middle of the ball','Move immediately after releasing the pass','Support at a different angle','Use both feet across the practice','Increase tempo without losing detail'],
    'Build Up': ['Create width and depth around the first line','Goalkeeper gives us the extra player','Centre-backs split to open the pitch','Six drops or moves to create the free player','Attract the press before finding the spare player','Recognise through, around or over','Full-backs recognise when to stay wide or step inside','Secure rest defence while building'],
    'Midfield Progression': ['Scan behind before receiving between lines','Receive side-on to connect forward','Fix the midfielder then find the player behind','Use bounce passes to release the third player','Arrive in the next line as the ball travels','Recognise when the far side is the free side','Support underneath if forward play closes','Protect the ball then re-circulate with purpose'],
    'Chance Creation': ['Fix the last defender before releasing','Create an overload around the box','Threaten in behind to create feet space','Attack cut-back and second-line spaces','Occupy front post, penalty spot and back post','Final pass should take a defender out of the game','Use disguise before the final action','React for rebounds and second balls'],
    'Wide Overloads': ['Create the 2v1 before attacking it','Fix the full-back with the ball carrier','Overlap to pull the defender away','Underlap when the inside channel opens','Wide player recognises when to drive inside','Support underneath for the recycle','Opposite side attacks the box','Secure behind the ball before committing numbers'],
    'Finishing': ['See the goalkeeper before the final touch','First touch prepares the finish','Choose the finish early','Stay composed under pressure','Attack across the defender','Finish low across goal when available','Follow every shot for rebounds','Arrive with timing rather than waiting in the box'],
    'High Press': ['Recognise the agreed pressing trigger','First presser curves the run to lock play','Screen the inside option while pressing','Nearest players jump onto the next passes','Back line squeezes behind the press','Goalkeeper protects the space behind','Press at sprint intensity then arrive under control','Attack quickly if we regain high'],
    'Mid Block': ['Protect the centre first','Keep distances between units compact','Slide together as the ball travels','Show play towards the touchline','Wide player jumps when cover is behind','Screen passes into the pivot or ten','Back line stays connected to midfield','Recognise when the block can step forward'],
    'Counter Press': ['React on the first step after losing it','Closest player attacks the ball carrier','Next players remove the nearest exits','Protect the central forward pass','Hunt in numbers around the ball','Back line squeezes to compress space','Win it or force a rushed clearance','If the counter press is broken, recover immediately'],
    'Attacking Transition': ['First look is forward after regain','Ball carrier attacks open space','Nearest players sprint to support ahead and beside','Far-side runner stretches the recovery line','Make the first pass clean before accelerating','Attack before the opposition can organise','Recognise when the counter is no longer on','Secure possession if the quick attack closes'],
    'Defensive Transition': ['Immediate reaction on loss','Protect the centre before chasing the ball','Nearest player delays the counter','Track the most dangerous forward run','Recover goal-side and inside','Communicate who presses and who recovers','Stop the first forward pass if possible','Re-form the block quickly if we cannot regain'],
    '1v1 & Duel Play': ['Attack the defender at speed','Change speed after the move','Shift the defender before attacking the other side','Protect the ball with the body','Defender closes space under control','Show the attacker away from danger','Stay balanced and ready for the second action','React first after the duel'],
    'Set Plays': ['Everyone knows the first role and second action','Quality of delivery into the target area','Attack the ball with timing and aggression','Block or screen legally to create separation','Be alive for second balls','Rest defence protects the counter','React immediately when the first contact is lost','Vary the routine while keeping clear principles'],
    'Conditioned Games': ['The condition must reward the session theme','Keep the game flowing with quick restarts','Coach the behaviour, not the rule','Allow players freedom to solve the problem','Use scoring incentives rather than constant stoppages','Remove the condition once the behaviour appears','Keep transitions live','Finish with a realistic game period'],
    'Fitness': ['Football action stays technically clean under fatigue','Work and recovery periods match the football demand','Players accelerate and decelerate with control','Keep the ball involved where possible','Quality must not disappear as fatigue increases','Use competitive targets to maintain intensity']
  },
  objByTheme: {
    'Core Passing Activations': ['Improve scanning, receiving detail and passing tempo','Prepare players to receive with a picture and play forward','Build clean technical habits before the main practice'],
    'Build Up': ['Create and find the free player in the first phase','Progress through, around or over an organised press','Build with control while protecting against transition'],
    'Midfield Progression': ['Break midfield lines using receiving angles and third-man support','Find and exploit the free player between units','Progress centrally, then switch when the middle is blocked'],
    'Chance Creation': ['Turn possession around the box into higher-quality chances','Create overloads and timed arrivals in the final third','Improve the detail of the final pass and box occupation'],
    'Wide Overloads': ['Create and exploit overloads in wide areas','Use overlaps, underlaps and rotations to free the wide player','Attack the box effectively after creating from wide areas'],
    'Finishing': ['Improve finishing decisions under realistic pressure','Create repeatable finishing actions from match-realistic positions','Improve movement and composure inside the penalty area'],
    'High Press': ['Press collectively to regain the ball in advanced areas','Recognise triggers and lock play to one side','Connect the front press with midfield and the back line'],
    'Mid Block': ['Protect central spaces and make opposition play predictable','Move as a compact unit and recognise when to jump','Defend the middle while staying ready to counter'],
    'Counter Press': ['React collectively to regain immediately after losing possession','Stop the opposition first forward action after our loss','Keep the team connected around the ball to protect transition'],
    'Attacking Transition': ['Exploit disorganisation immediately after regaining possession','Improve the first pass and supporting runs on the counter','Recognise when to counter and when to secure possession'],
    'Defensive Transition': ['Protect the centre and delay immediately after losing possession','Recover quickly into a compact defensive shape','Improve decisions between counter pressing and recovery'],
    '1v1 & Duel Play': ['Improve attacking and defending decisions in individual duels','Develop confidence to eliminate an opponent 1v1','Win the first duel and react fastest to the second action'],
    'Set Plays': ['Create clear repeatable roles from attacking and defensive restarts','Improve first contact, second-ball reactions and rest defence','Build a small library of reliable restart solutions'],
    'Conditioned Games': ['Transfer the session theme into a realistic game','Reward the target behaviour while keeping player decision-making','Finish with game-realistic repetition of the coaching objective'],
    'Fitness': ['Develop football-specific intensity without losing technical quality','Repeat high-intensity football actions with appropriate recovery','Build physical output through competitive football actions']
  },
  condByTheme: {
    'Core Passing Activations': ['One point for receiving on the back foot and playing forward','Bonus point for a third-man combination','Team must move to a new angle after every pass'],
    'Build Up': ['Double goal if the team plays through the first press before scoring','Defending team scores in mini goals on regain','Goalkeeper must be used before the team can progress'],
    'Midfield Progression': ['Bonus point for a line-breaking pass into the next unit','Double goal after a third-man combination','If central route is blocked, switch before scoring'],
    'Chance Creation': ['Double goal from a cut-back or first-time finish','Bonus point for three players arriving in different box spaces','Attacking team has limited time to finish after entering final third'],
    'Wide Overloads': ['Goal counts double after an overlap or underlap','Team must create a 2v1 wide before entering the box','Opposite winger must arrive in the box for the goal to count'],
    'Finishing': ['Finish within a set time after the first forward pass','Rebound goals count double','Extra point for a finish from a timed box arrival'],
    'High Press': ['Double goal if scored within 10 seconds of a high regain','Pressing team gets a point for forcing play out or long','Build-up team gets a bonus point for escaping the press cleanly'],
    'Mid Block': ['Defending team scores by regaining in the middle third and countering','Attacking team gets a bonus for playing through the central block','Defending team must recover into shape before they can press'],
    'Counter Press': ['Five-second window to regain after loss','Double goal if scored straight after a counter-press regain','If counter press is broken, team must recover behind the ball'],
    'Attacking Transition': ['Finish within 10 seconds of regain','First pass forward earns a bonus point','If the counter closes, team scores a point for securing possession'],
    'Defensive Transition': ['Team earns a point for delaying the counter for five seconds','Opposition gets a bonus for scoring before recovery shape is formed','Recovery team must protect the centre before pressing wide'],
    '1v1 & Duel Play': ['Bonus point for beating an opponent before scoring','Defender scores by winning the duel and countering','Every restart begins with an isolated 1v1'],
    'Set Plays': ['Restart every attack from a set play','First-contact goals count double','Defending team can score in transition mini goals after clearance'],
    'Conditioned Games': ['Use a scoring condition linked directly to the session objective','Remove the condition for the final game period','Bonus point when the target behaviour happens before a goal'],
    'Fitness': ['Short competitive work blocks with football scoring targets','Team must recover into shape before the next ball enters','Rotate roles frequently to control work-to-rest ratio']
  }
});

const THEME_LINKS = Object.freeze({
  'Core Passing Activations':['Scan','Receive Forward','Bounce Pass','Third Man','Width and Depth'],
  'Build Up':['Free Player','Play Through','Play Around','Play Over','Width and Depth','Rest Defence'],
  'Midfield Progression':['Between Lines','Third Man','Bounce Pass','Switch Point','Free Player'],
  'Chance Creation':['Fix and Release','Beyond the Line','Box Occupation','Cut Back','Overload to Isolate'],
  'Wide Overloads':['Overload to Isolate','Overlap','Underlap','Switch Point','Box Occupation'],
  'Finishing':['Box Occupation','Beyond the Line','Second Ball','Fix and Release'],
  'High Press':['Pressing Trigger','Lock One Side','Cover Shadow','Compactness','Counter Press'],
  'Mid Block':['Protect Centre','Force Outside','Compactness','Cover Shadow','Recovery Run'],
  'Counter Press':['Counter Press','Protect Centre','Compactness','Second Ball','Transition Mentality'],
  'Attacking Transition':['First Forward Pass','Beyond the Line','Transition Mentality','Width and Depth'],
  'Defensive Transition':['Protect Centre','Recovery Run','Compactness','Transition Mentality'],
  '1v1 & Duel Play':['Fix and Release','Beyond the Line','Second Ball'],
  'Set Plays':['Second Ball','Rest Defence','Box Occupation'],
  'Conditioned Games':['Transition Mentality','Free Player','Overload to Isolate','Second Ball'],
  'Fitness':['Transition Mentality','Second Ball','Recovery Run']
});

const THEME_CUES = Object.freeze({
  'Core Passing Activations':['Picture first','Shoulder check','Back foot','Move it quick','Bounce'],
  'Build Up':['Find the spare','Play through','Go around','Can we go over?','Secure behind'],
  'Midfield Progression':['Shoulder check','Third man','Bounce','Switch it','Arrive now'],
  'Chance Creation':['Fix him','Release it','Run beyond','Cut it back','Fill the box'],
  'Wide Overloads':['Stretch them','Fix him','Overlap','Underlap','Fill the box'],
  'Finishing':['Picture first','Attack the gap','Arrive now','Second ball','Reset and go again'],
  'High Press':['Lock it','Screen inside','Jump','Squeeze','Stay connected'],
  'Mid Block':['Protect the middle','Show outside','Shift','Stay connected','Jump'],
  'Counter Press':['React','Hunt','Protect the middle','Squeeze','Second ball'],
  'Attacking Transition':['First pass forward','Can we counter?','Run beyond','Keep it if not'],
  'Defensive Transition':['React','Delay','Recover inside','Protect the middle','Stay connected'],
  '1v1 & Duel Play':['Fix him','Attack the gap','React','Second ball'],
  'Set Plays':['First contact','Second ball','Secure behind','React'],
  'Conditioned Games':['Play','React','Find the spare','Can we counter?'],
  'Fitness':['React','Reset and go again','Second ball']
});

const REVIEW_BANKS = Object.freeze({
  worked: [
    'Players recognised the main picture quickly','Organisation was quick and the practice got moving immediately','The area created the right problem for the players','Good tempo and a high number of repetitions','The challenge level was right for the group','Players solved problems without needing constant intervention','The progression arrived at the right time','The coaching detail transferred into the game','Good competition without losing the session objective','The practice looked game-realistic and produced useful decisions','Players communicated more as the practice developed','The final game showed clear evidence of the theme'
  ],
  didnt: [
    'The area was too big for the numbers','The area was too small and removed too many options','Too much waiting between repetitions','Organisation took too long','The explanation was too detailed before players started','The progression came in too early','The progression came in too late','The constraint became more important than the football problem','Defenders did not start from realistic enough positions','The practice did not create enough decisions','Tempo dropped between repetitions','I stopped the practice too often','The transition moment was not realistic enough','The final game did not reproduce the earlier coaching picture'
  ],
  repeat: [
    'Keep the same practice order','Use the same area and numbers again','Repeat the same coaching picture with less intervention','Keep the same scoring incentive','Use the same progression but introduce it earlier','Keep the final game exactly as it was','Repeat with the same groups for continuity','Use this practice again before increasing the challenge','Keep the transition rule because it created realistic reactions','Repeat the key coaching cue language'
  ],
  change: [
    'Start with a smaller area','Start with a slightly bigger area','Reduce the explanation and get the ball rolling sooner','Add one more defender','Remove one defender','Add a neutral player to create the picture earlier','Remove the neutral to increase pressure','Introduce the progression earlier','Delay the progression until the base picture is cleaner','Use a clearer scoring incentive','Make the transition live on every turnover','Use more realistic starting positions','Reduce coach stoppages','Increase repetition time before rotating','Finish with a longer game period','Use the same practice but change the player numbers'
  ],
  keep: [
    'Would use again with the same setup','Strong practice for this objective','Players understood the purpose quickly','Good realism and decision-making','High repetition without losing quality','The area and numbers worked well','The progression improved the practice','This transferred well into the game'
  ],
  adapt: [
    'Would reuse with a small setup change','Area was slightly too big','Area was slightly too small','Needed more repetitions before progressing','Needed a clearer scoring incentive','Progression came in too early','Progression came in too late','Defenders needed more realistic starting positions','Need clearer roles before going fully live','Need a better transition on turnover','Reduce coaching interventions next time','Player numbers need a small adjustment','Good idea but the organisation can be simpler'
  ],
  drop: [
    'The practice did not match the session objective closely enough','Too much waiting and not enough football action','Too complex for this group','Did not create enough meaningful decisions','Organisation took too long for the return','Players were unclear on the purpose','Would replace with a simpler practice','The constraint distorted the game too much','Could not get enough realistic repetition from the setup'
  ]
});

const THEME_REVIEW = Object.freeze({
  'Build Up':['Created clear spare-player pictures','First line had enough options around the ball','Need more realistic pressure on the first build','Could not consistently find the free player'],
  'Midfield Progression':['Players found pockets between lines','Third-man actions appeared naturally','Need more movement ahead of the receiver','Central area became too crowded'],
  'Chance Creation':['Created enough entries into the box','Final pass detail improved through the practice','Need more realistic box occupation','Too many attacks ended without a final action'],
  'Wide Overloads':['The 2v1 picture appeared consistently','Wide rotations created useful decisions','Need better opposite-side box arrivals','Overload was too easy and needed more defensive pressure'],
  'Finishing':['Good number of realistic finishing repetitions','Players showed better composure as it progressed','Need more pressure before the finish','Too many finishes came from the same picture'],
  'High Press':['Pressing triggers became clearer','Units stayed connected behind the first press','Need better cover behind the first presser','Press became individual rather than collective'],
  'Mid Block':['Protected central spaces well','Block moved together as the ball travelled','Need clearer trigger for the wide player to jump','Distances between units became too big'],
  'Counter Press':['Reaction after loss improved','Players protected the first forward pass well','Need more players connected around the ball before loss','Recovery after the counter press was broken was too slow'],
  'Attacking Transition':['First action after regain was positive','Support around the counter improved','Need quicker recognition when the counter is over','First pass after regain lacked quality'],
  'Defensive Transition':['Players protected the centre earlier','Recovery runs became more urgent','Need clearer decision between press and recover','Too many players chased the ball after loss'],
  '1v1 & Duel Play':['Players attacked defenders with more confidence','Defensive approach speed improved','Need more second-action reactions','Duels became repetitive and need a different starting picture'],
  'Set Plays':['Roles were clear and repeatable','Second-ball reactions improved','Need stronger rest defence behind the restart','Delivery quality limited the practice'],
  'Conditioned Games':['Condition reinforced the theme without stopping the game','Players found their own solutions within the constraint','Condition was too dominant','Remove the condition earlier next time']
});

function appDb() {
  try { return typeof db !== 'undefined' ? db : window.db; }
  catch (_) { return window.db; }
}

function cleanPhrase(value) {
  return String(value ?? '').replace(/^[-–—•*]+\s*/,'').replace(/\s+/g,' ').trim();
}

export function splitCoachingPhrases(value) {
  if (Array.isArray(value)) return value.flatMap(splitCoachingPhrases);
  if (value == null) return [];
  const text = String(value).replace(/\r/g,'\n');
  let parts = text.split(/\n+|\s*[;•]\s*/).map(cleanPhrase).filter(Boolean);
  if (parts.length === 1 && parts[0].length > 150) parts = parts[0].split(/(?<=[.!?])\s+/).map(cleanPhrase).filter(Boolean);
  return parts.filter(item => item.length >= 3 && item.length <= 150);
}

function addPhrase(map, value, weight = 1) {
  splitCoachingPhrases(value).forEach(phrase => {
    const key = phrase.toLocaleLowerCase();
    const existing = map.get(key) || { phrase, score:0 };
    existing.score += weight;
    if (phrase.length < existing.phrase.length) existing.phrase = phrase;
    map.set(key, existing);
  });
}

function ranked(map, limit = 30) {
  return [...map.values()].sort((a,b) => b.score - a.score || a.phrase.localeCompare(b.phrase)).slice(0,limit).map(item => item.phrase);
}

function addTheme(map, theme, value, weight = 1) {
  if (!theme) return;
  if (!map.has(theme)) map.set(theme,new Map());
  addPhrase(map.get(theme),value,weight);
}

export function buildPersonalLanguage(data = {}) {
  const cp = new Map(), prog = new Map(), reg = new Map(), obj = new Map(), links = new Map(), cues = new Map();
  const review = new Map(), worked = new Map(), didnt = new Map(), repeat = new Map(), change = new Map();
  const cpByTheme = new Map(), objByTheme = new Map(), condByTheme = new Map();

  (data.practices || []).forEach(practice => {
    addPhrase(cp,practice.cp,3); addPhrase(prog,practice.prog,3); addPhrase(reg,practice.reg,3);
    addTheme(cpByTheme,practice.theme,practice.cp,4); addTheme(condByTheme,practice.theme,practice.condRules,4);
  });

  const sessions = [...(data.sessions || [])].sort((a,b) => String(b?.date || '').localeCompare(String(a?.date || '')));
  sessions.forEach((session,index) => {
    const recency = index < 8 ? 4 : index < 20 ? 3 : 2;
    addPhrase(obj,session.objective,recency); addPhrase(links,session.links,recency); addPhrase(cues,session.cues,recency);
    addTheme(objByTheme,session.theme,session.objective,recency + 1);
    const r = session.review || {};
    addPhrase(worked,r.worked,5); addPhrase(didnt,r.didntWork,5); addPhrase(repeat,r.repeat,5); addPhrase(change,r.changeNext,5);
    [r.worked,r.didntWork,r.repeat,r.changeNext].forEach(value => addPhrase(review,value,4));
    (r.practices || []).forEach(item => addPhrase(review,item?.reasoning || item?.note,6));
  });

  (data.sessionTemplates || []).forEach(template => {
    addPhrase(obj,template.objective,2); addPhrase(links,template.links,2); addPhrase(cues,template.cues,2);
    addTheme(objByTheme,template.theme,template.objective,2);
  });

  const themeObject = map => Object.fromEntries([...map.entries()].map(([theme,bucket]) => [theme,ranked(bucket,18)]));
  return {
    cp:ranked(cp,36), prog:ranked(prog,24), reg:ranked(reg,24), obj:ranked(obj,30), links:ranked(links,30), cues:ranked(cues,36),
    review:ranked(review,30), worked:ranked(worked,18), didnt:ranked(didnt,18), repeat:ranked(repeat,18), change:ranked(change,18),
    cpByTheme:themeObject(cpByTheme), objByTheme:themeObject(objByTheme), condByTheme:themeObject(condByTheme)
  };
}

export function mergeCoachingPhrases(...groups) {
  const seen = new Set(), result = [];
  groups.flat().forEach(value => {
    const phrase = cleanPhrase(value);
    if (!phrase) return;
    const key = phrase.toLocaleLowerCase();
    if (seen.has(key)) return;
    seen.add(key); result.push(phrase);
  });
  return result;
}

export function suggestedDecision(effectiveness) {
  const score = Number(effectiveness) || 0;
  if (!score) return '';
  if (score >= 8) return 'Keep';
  if (score >= 5) return 'Adapt';
  return 'Drop';
}

export function practiceReviewSuggestions({ effectiveness = 0, decision = '', theme = '', personal = [] } = {}) {
  const score = Number(effectiveness) || 0;
  const mode = decision || suggestedDecision(score);
  const bank = mode === 'Keep' ? REVIEW_BANKS.keep : mode === 'Drop' ? REVIEW_BANKS.drop : REVIEW_BANKS.adapt;
  const scoreSpecific = score >= 9 ? ['Excellent transfer into the game','Very little needs changing before reusing']
    : score >= 7 ? ['Strong practice with only minor detail to adjust']
    : score >= 5 ? ['Useful practice but needs a clear adaptation before repeating']
    : score ? ['Major change needed before using this version again'] : [];
  return mergeCoachingPhrases(personal,THEME_REVIEW[theme] || [],scoreSpecific,bank).slice(0,14);
}

function ensureBanks(data) {
  if (!data) return null;
  if (!data.banks || typeof data.banks !== 'object') data.banks = {};
  const b = data.banks;
  ['cp','prog','reg','obj','links','cues','reflect'].forEach(key => { if (!Array.isArray(b[key])) b[key] = []; });
  if (!b.cpByTheme || typeof b.cpByTheme !== 'object') b.cpByTheme = {};
  if (!b.objByTheme || typeof b.objByTheme !== 'object') b.objByTheme = {};
  if (!b.condByTheme || typeof b.condByTheme !== 'object') b.condByTheme = {};
  return b;
}

function enrichBanks(data) {
  const b = ensureBanks(data); if (!b) return { changed:false, personal:buildPersonalLanguage({}) };
  const personal = buildPersonalLanguage(data);
  const before = JSON.stringify(b);
  b.cp = mergeCoachingPhrases(personal.cp,b.cp,CURATED.cp);
  b.prog = mergeCoachingPhrases(personal.prog,b.prog,CURATED.prog);
  b.reg = mergeCoachingPhrases(personal.reg,b.reg,CURATED.reg);
  b.obj = mergeCoachingPhrases(personal.obj,b.obj,CURATED.obj);
  b.links = mergeCoachingPhrases(personal.links,b.links,CURATED.links);
  b.cues = mergeCoachingPhrases(personal.cues,b.cues,CURATED.cues);
  b.reflect = mergeCoachingPhrases(b.reflect,CURATED.reflect);

  const allThemes = new Set([
    ...Object.keys(CURATED.cpByTheme),...Object.keys(CURATED.objByTheme),...Object.keys(CURATED.condByTheme),
    ...Object.keys(b.cpByTheme),...Object.keys(b.objByTheme),...Object.keys(b.condByTheme),
    ...Object.keys(personal.cpByTheme),...Object.keys(personal.objByTheme),...Object.keys(personal.condByTheme)
  ]);
  allThemes.forEach(theme => {
    b.cpByTheme[theme] = mergeCoachingPhrases(personal.cpByTheme[theme] || [],b.cpByTheme[theme] || [],CURATED.cpByTheme[theme] || []);
    b.objByTheme[theme] = mergeCoachingPhrases(personal.objByTheme[theme] || [],b.objByTheme[theme] || [],CURATED.objByTheme[theme] || []);
    b.condByTheme[theme] = mergeCoachingPhrases(personal.condByTheme[theme] || [],b.condByTheme[theme] || [],CURATED.condByTheme[theme] || []);
  });
  b.coachingPersonalisationVersion = VERSION;
  return { changed:before !== JSON.stringify(b), personal };
}

let cloudSaveTimer = 0;
function persistQuietly(data) {
  try { localStorage.setItem('nickCoachOSv3',JSON.stringify(data)); } catch (_) {}
  clearTimeout(cloudSaveTimer);
  cloudSaveTimer = setTimeout(async () => {
    try {
      if (!window.nickCloud || typeof window.nickCloud.save !== 'function') return;
      await window.nickCloud.save(JSON.parse(JSON.stringify(data)));
    } catch (error) {
      console.warn('Personalised word-bank cloud sync will retry on the next normal save',error);
    }
  },1200);
}

function addStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style'); style.id = STYLE_ID;
  style.textContent = `
    .coachSmartBar{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:8px 0 10px;padding:8px 9px;border:1px solid rgba(52,211,153,.3);border-radius:10px;background:rgba(52,211,153,.06)}
    .coachSmartBar button{padding:7px 10px;font-size:11.5px}.coachSmartBar .small{font-size:10.5px}
    .personalLanguageCard{margin:0 0 14px!important;border-color:rgba(56,189,248,.35)!important;background:linear-gradient(135deg,rgba(56,189,248,.08),var(--surface-2))!important}
    .personalLanguageGroups{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:10px}.personalLanguageGroup{min-width:0}.personalLanguageGroup b{font-size:11px;color:#bae6fd;text-transform:uppercase;letter-spacing:.04em}
    .personalLanguageChips,.reviewSuggestionChips{display:flex;gap:5px;flex-wrap:wrap;margin-top:6px}.personalLanguageChips button,.reviewSuggestionChips button{padding:5px 8px;border-radius:999px;font-size:10.5px;font-weight:750;background:var(--surface-3);text-align:left}
    .reviewSuggestionBlock{margin-top:7px;padding:7px 8px;border:1px solid rgba(56,189,248,.22);border-radius:9px;background:rgba(56,189,248,.045)}.reviewSuggestionTitle{font-size:9.5px;font-weight:900;color:#bae6fd;text-transform:uppercase;letter-spacing:.045em}.reviewSuggestionMeta{font-size:9.5px;color:var(--text-dim);margin-top:2px}
    .previousReviewMemory{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-top:6px;padding:6px 7px;border-radius:8px;background:rgba(251,191,36,.06);border:1px solid rgba(251,191,36,.2);font-size:10px;color:var(--text-dim)}.previousReviewMemory button{padding:4px 7px;font-size:9.5px;flex:none}
    .reviewAutoDecision{font-size:9px;color:var(--turf);margin-top:3px;font-weight:800}
    .smartFillToast{position:fixed;left:50%;bottom:20px;z-index:30000;transform:translateX(-50%);padding:9px 13px;border-radius:999px;background:#0d1b2a;border:1px solid rgba(52,211,153,.45);box-shadow:0 12px 35px rgba(0,0,0,.4);font-size:11px;font-weight:850;color:#d1fae5}
    @media(max-width:760px){.personalLanguageGroups{grid-template-columns:1fr}.coachSmartBar{align-items:stretch}.coachSmartBar button{width:100%}.reviewSuggestionChips button{font-size:10px;padding:6px 8px}}
  `;
  document.head.appendChild(style);
}

function toast(message) {
  let el = document.querySelector('.smartFillToast');
  if (!el) { el = document.createElement('div'); el.className = 'smartFillToast'; document.body.appendChild(el); }
  el.textContent = message; el.hidden = false; clearTimeout(el._hide); el._hide = setTimeout(() => { el.hidden = true; },1900);
}

function appendPhrase(target,phrase) {
  if (!target || !phrase) return;
  const lines = splitCoachingPhrases(target.value);
  if (!lines.some(line => line.toLocaleLowerCase() === phrase.toLocaleLowerCase())) lines.push(phrase);
  target.value = lines.join('\n');
  target.dispatchEvent(new Event('input',{ bubbles:true }));
}

function setIfBlank(target,values,limit = 1) {
  if (!target || String(target.value || '').trim()) return false;
  const list = mergeCoachingPhrases(values).slice(0,limit);
  if (!list.length) return false;
  target.value = list.join('\n'); target.dispatchEvent(new Event('input',{ bubbles:true })); return true;
}

function refreshVisibleChips() {
  try { if (typeof renderPracticeCpChips === 'function') renderPracticeCpChips(); } catch (_) {}
  try { if (typeof renderConditionedGameChips === 'function') renderConditionedGameChips(); } catch (_) {}
  try { if (typeof renderObjectiveChips === 'function') renderObjectiveChips(); } catch (_) {}
  try {
    if (typeof renderChipBox === 'function') {
      const b = appDb()?.banks || {};
      renderChipBox('progChips',b.prog || [],'prog'); renderChipBox('regChips',b.reg || [],'reg');
      renderChipBox('linkChips',b.links || [],'links'); renderChipBox('cueChips',b.cues || [],'cues'); renderChipBox('reflectChips',b.reflect || [],'reflect');
    }
  } catch (_) {}
}

function syncHiddenWordBankFields() {
  const view = document.getElementById('wordbank');
  if (!view || !view.classList.contains('hidden')) return;
  const b = appDb()?.banks; if (!b) return;
  const pairs = [['bankCP','cp'],['bankProg','prog'],['bankReg','reg'],['bankObj','obj'],['bankLinks','links'],['bankCues','cues'],['bankReflect','reflect']];
  pairs.forEach(([id,key]) => { const field = document.getElementById(id); if (field) field.value = (b[key] || []).join('\n'); });
}

let lastPersonal = null;
function refreshPersonalisation({ persist = true } = {}) {
  const data = appDb(); if (!data) return null;
  const result = enrichBanks(data); lastPersonal = result.personal;
  if (result.changed && persist) persistQuietly(data);
  refreshVisibleChips(); syncHiddenWordBankFields(); renderPersonalLanguageCard();
  return result;
}

function renderPersonalLanguageCard() {
  const section = document.getElementById('wordbank'); if (!section) return;
  let card = document.getElementById('personalLanguageCard');
  if (!card) {
    card = document.createElement('div'); card.id = 'personalLanguageCard'; card.className = 'card personalLanguageCard';
    const first = section.querySelector('.grid') || section.firstElementChild; section.insertBefore(card,first || null);
  }
  const personal = lastPersonal || buildPersonalLanguage(appDb() || {});
  const groups = [
    ['My coaching points',personal.cp,'bankCP'],['My objectives',personal.obj,'bankObj'],['My review language',personal.review,'']
  ];
  const learned = new Set([...personal.cp,...personal.prog,...personal.reg,...personal.obj,...personal.links,...personal.cues,...personal.review].map(x => x.toLocaleLowerCase())).size;
  card.innerHTML = `<h2>My Coaching Language</h2><p class="small">Automatically learned from your saved practices, sessions and review reasoning. Your most-used wording is promoted ahead of generic suggestions. <b>${learned}</b> personal phrases recognised.</p><div class="personalLanguageGroups">${groups.map(([title,items,target]) => `<div class="personalLanguageGroup"><b>${title}</b><div class="personalLanguageChips">${items.slice(0,8).map(item => `<button type="button" data-personal-phrase="${escapeAttr(item)}" data-bank-target="${target}">${escapeText(item)}</button>`).join('') || '<span class="small">This will build as you use the app.</span>'}</div></div>`).join('')}</div>`;
  card.querySelectorAll('[data-personal-phrase]').forEach(button => button.addEventListener('click',() => {
    const target = button.dataset.bankTarget && document.getElementById(button.dataset.bankTarget);
    if (target) { appendPhrase(target,button.dataset.personalPhrase); toast('Added to this word bank'); }
    else { try { navigator.clipboard?.writeText(button.dataset.personalPhrase); toast('Review phrase copied'); } catch (_) {} }
  }));
}

function escapeText(value) {
  return String(value ?? '').replace(/[&<>"']/g,ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}
function escapeAttr(value) { return escapeText(value).replace(/`/g,'&#96;'); }

function installPracticeSmartFill() {
  const theme = document.getElementById('theme'); if (!theme || document.getElementById('practiceSmartFillBar')) return;
  const anchor = theme.closest('.row') || theme.parentElement;
  const bar = document.createElement('div'); bar.id = 'practiceSmartFillBar'; bar.className = 'coachSmartBar';
  bar.innerHTML = '<button type="button" id="practiceSmartFillBtn">⚡ Fill coaching detail</button><span class="small">Fills blank coaching points/progressions/regressions from this theme and your own language. Existing writing is never overwritten.</span>';
  anchor.insertAdjacentElement('afterend',bar);
  document.getElementById('practiceSmartFillBtn')?.addEventListener('click',() => {
    refreshPersonalisation({ persist:false });
    const data = appDb(), selectedTheme = theme.value, b = data?.banks || {};
    let changed = 0;
    if (setIfBlank(document.getElementById('cp'),b.cpByTheme?.[selectedTheme] || b.cp || [],4)) changed++;
    if (setIfBlank(document.getElementById('prog'),mergeCoachingPhrases(lastPersonal?.prog || [],b.prog || []),2)) changed++;
    if (setIfBlank(document.getElementById('reg'),mergeCoachingPhrases(lastPersonal?.reg || [],b.reg || []),2)) changed++;
    if (document.getElementById('stage')?.value === 'Conditioned Game' && setIfBlank(document.getElementById('condRules'),b.condByTheme?.[selectedTheme] || [],2)) changed++;
    try { if (typeof renderPreview === 'function') renderPreview(); } catch (_) {}
    toast(changed ? 'Blank coaching detail filled' : 'Nothing overwritten — those fields already have detail');
  });
}

function installSessionSmartFill() {
  const theme = document.getElementById('sTheme'); if (!theme || document.getElementById('sessionSmartFillBar')) return;
  const bar = document.createElement('div'); bar.id = 'sessionSmartFillBar'; bar.className = 'coachSmartBar';
  bar.innerHTML = '<button type="button" id="sessionSmartFillBtn">⚡ Fill theme details</button><span class="small">Adds an objective, game-model links and cues only where the session fields are blank.</span>';
  theme.insertAdjacentElement('afterend',bar);
  document.getElementById('sessionSmartFillBtn')?.addEventListener('click',() => {
    refreshPersonalisation({ persist:false });
    const data = appDb(), selectedTheme = theme.value, b = data?.banks || {}; let changed = 0;
    if (setIfBlank(document.getElementById('objective'),b.objByTheme?.[selectedTheme] || b.obj || [],1)) changed++;
    if (setIfBlank(document.getElementById('links'),mergeCoachingPhrases(THEME_LINKS[selectedTheme] || [],lastPersonal?.links || [],b.links || []),4)) changed++;
    if (setIfBlank(document.getElementById('cues'),mergeCoachingPhrases(THEME_CUES[selectedTheme] || [],lastPersonal?.cues || [],b.cues || []),4)) changed++;
    try { if (typeof renderPreview === 'function') renderPreview(); } catch (_) {}
    toast(changed ? 'Blank session details filled' : 'Nothing overwritten — session details already contain text');
  });
}

function previousReasons(practiceId) {
  const rows = [];
  [...(appDb()?.sessions || [])].sort((a,b) => String(b?.date || '').localeCompare(String(a?.date || ''))).forEach(session => {
    (session?.review?.practices || []).forEach(item => {
      if (item?.practiceId !== practiceId) return;
      const reason = cleanPhrase(item.reasoning || item.note); if (reason) rows.push({ reason,date:session.date || '',score:item.effectiveness || '' });
    });
  });
  return rows;
}

function suggestionBlock(target, suggestions, title, meta = '') {
  if (!target) return null;
  let block = target.parentElement?.querySelector(':scope > .reviewSuggestionBlock');
  if (!block) { block = document.createElement('div'); block.className = 'reviewSuggestionBlock'; target.insertAdjacentElement('afterend',block); }
  block.innerHTML = `<div class="reviewSuggestionTitle">${escapeText(title)}</div>${meta ? `<div class="reviewSuggestionMeta">${escapeText(meta)}</div>` : ''}<div class="reviewSuggestionChips">${suggestions.slice(0,12).map(item => `<button type="button" data-review-suggestion="${escapeAttr(item)}">${escapeText(item)}</button>`).join('')}</div>`;
  block.querySelectorAll('[data-review-suggestion]').forEach(button => button.addEventListener('click',() => appendPhrase(target,button.dataset.reviewSuggestion)));
  return block;
}

function sessionFieldSuggestions(fieldId, personalKey, bankKey, title) {
  const target = document.getElementById(fieldId); if (!target) return;
  const personal = lastPersonal || buildPersonalLanguage(appDb() || {});
  suggestionBlock(target,mergeCoachingPhrases(personal[personalKey] || [],REVIEW_BANKS[bankKey] || []),title,'Your own recent wording is shown first when available.');
}

function enhanceReviewSuggestions() {
  const overlay = document.getElementById('postSessionReviewOverlay'); if (!overlay?.classList.contains('open')) return;
  refreshPersonalisation({ persist:false });
  sessionFieldSuggestions('reviewWorked','worked','worked','Suggested positives');
  sessionFieldSuggestions('reviewDidnt','didnt','didnt','Suggested issues');
  sessionFieldSuggestions('reviewRepeat','repeat','repeat','Suggested repeats');
  sessionFieldSuggestions('reviewChange','change','change','Suggested changes');

  const data = appDb();
  [...overlay.querySelectorAll('.reviewPractice')].forEach(row => {
    const id = row.dataset.practiceId || '';
    const practice = (data?.practices || []).find(item => item.id === id) || {};
    const effect = row.querySelector('.practiceEffect'); const decision = row.querySelector('.practiceDecision');
    const reasoning = row.querySelector('.practiceReasoning,.practiceNote'); if (!reasoning) return;
    const history = previousReasons(id);
    const suggestions = practiceReviewSuggestions({ effectiveness:effect?.value,decision:decision?.value,theme:practice.theme,personal:history.map(item => item.reason) });
    suggestionBlock(reasoning,suggestions,'Suggested reasoning','Based on the score, theme, common coaching review language and your previous notes.');

    const parent = reasoning.parentElement;
    parent?.querySelector('.previousReviewMemory')?.remove();
    if (history[0] && cleanPhrase(reasoning.value).toLocaleLowerCase() !== history[0].reason.toLocaleLowerCase()) {
      const memory = document.createElement('div'); memory.className = 'previousReviewMemory';
      memory.innerHTML = `<span><b>Last time${history[0].score ? ` · ${escapeText(history[0].score)}/10` : ''}</b>${history[0].date ? ` · ${escapeText(history[0].date)}` : ''}<br>${escapeText(history[0].reason)}</span><button type="button">Use note</button>`;
      memory.querySelector('button').addEventListener('click',() => appendPhrase(reasoning,history[0].reason));
      reasoning.parentElement?.appendChild(memory);
    }

    if (effect && effect.dataset.smartDecisionBound !== 'true') {
      effect.dataset.smartDecisionBound = 'true';
      effect.addEventListener('change',() => {
        if (decision && !decision.value) {
          const suggested = suggestedDecision(effect.value);
          if (suggested) {
            decision.value = suggested;
            let note = decision.parentElement?.querySelector('.reviewAutoDecision');
            if (!note) { note = document.createElement('div'); note.className = 'reviewAutoDecision'; decision.insertAdjacentElement('afterend',note); }
            note.textContent = `Suggested from ${effect.value}/10: ${suggested}`;
          }
        }
        queueMicrotask(enhanceReviewSuggestions);
      });
    }
    if (decision && decision.dataset.smartSuggestionsBound !== 'true') {
      decision.dataset.smartSuggestionsBound = 'true'; decision.addEventListener('change',() => queueMicrotask(enhanceReviewSuggestions));
    }
  });
}

function installReviewHooks() {
  const overlay = document.getElementById('postSessionReviewOverlay'); if (!overlay || overlay.dataset.personalReviewBound === 'true') return;
  overlay.dataset.personalReviewBound = 'true';
  new MutationObserver(() => { if (overlay.classList.contains('open')) requestAnimationFrame(enhanceReviewSuggestions); })
    .observe(overlay,{ attributes:true,attributeFilter:['class'] });
  overlay.addEventListener('click',event => {
    if (event.target.closest('#reviewSaveClose,#reviewSaveDashboard')) setTimeout(() => refreshPersonalisation({ persist:true }),180);
  },true);
  if (overlay.classList.contains('open')) enhanceReviewSuggestions();
}

function installRefreshHooks() {
  document.addEventListener('click',event => {
    if (event.target.closest('#saveSessionNewBtn,#updateSessionBtn,#reviewSaveClose,#reviewSaveDashboard')) setTimeout(() => refreshPersonalisation({ persist:true }),220);
    if (event.target.closest('.tab[data-tab="wordbank"]')) requestAnimationFrame(() => { refreshPersonalisation({ persist:false }); renderPersonalLanguageCard(); });
  },true);
}

function install() {
  addStyles();
  refreshPersonalisation({ persist:true });
  installPracticeSmartFill(); installSessionSmartFill(); installReviewHooks(); installRefreshHooks(); renderPersonalLanguageCard();
  setTimeout(() => { refreshPersonalisation({ persist:true }); installPracticeSmartFill(); installSessionSmartFill(); installReviewHooks(); },900);
  setTimeout(() => { refreshPersonalisation({ persist:true }); installReviewHooks(); },2200);
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  window.CoachingOSPersonalisation = { refresh:refreshPersonalisation, buildPersonalLanguage, practiceReviewSuggestions, suggestedDecision };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',install,{ once:true });
  else install();
}
