// Suggested tags use only drill text. Explicit selections, including [], always win.
export const PASSING_FUNDAMENTALS=Object.freeze([
  {id:'scanning',label:'Scanning',pattern:/scan|check.{0,15}shoulder|head up/},
  {id:'back-foot',label:'Back foot',pattern:/back.?foot/},
  {id:'body-shape',label:'Open body',pattern:/open.{0,12}(body|hip)|half.?turn|swivel/},
  {id:'first-touch',label:'First touch',pattern:/first touch|quality of touch|take a touch|kill the ball|instep/},
  {id:'weight',label:'Pass quality / weight',pattern:/weight|accurate pass|quality.{0,10}pass|quality of delivery/},
  {id:'tempo',label:'Tempo',pattern:/pace|quick|rapid|intensity|immediately|moving fast/},
  {id:'one-touch',label:'One touch',pattern:/one touch|1 touch|first time|one\s*\/\s*two\/?\s*touch/},
  {id:'one-two',label:"1–2s",pattern:/1\s*\/\s*2|one.two(?!\s*\/?\s*touch)|give.and.go|wall pass|½/},
  {id:'third-player',label:'Third player',pattern:/third.?man|third.?player|3rd.?man/},
  {id:'angles',label:'Support angles',pattern:/triangle|support.{0,15}angle|create.{0,10}angle/},
  {id:'depth',label:'Depth',pattern:/depth|support underneath|support behind|drop (off|deep)/},
  {id:'height',label:'Height / between lines',pattern:/height|between.{0,8}lines|high and low|different.{0,12}lines/},
  {id:'width',label:'Width',pattern:/width|wide|stretch/},
  {id:'movement',label:'Move after passing',pattern:/follow.{0,8}pass|follow.{0,10}final pass|move after|supporting run|go beyond/},
  {id:'rotation',label:'Rotations',pattern:/rotat|replace/},
  {id:'timing',label:'Timing',pattern:/timing|right time|when.{0,20}ready|arriv/},
  {id:'communication',label:'Communication',pattern:/communicat|alert readiness|call for/},
  {id:'both-feet',label:'Both feet',pattern:/both feet|weak.{0,3}foot|weaker foot/}
]);
export function passingFundamentals(practice={}){
  if(Array.isArray(practice.passingFundamentals))return [...new Set(practice.passingFundamentals)].filter(id=>PASSING_FUNDAMENTALS.some(x=>x.id===id));
  if(practice.practiceFormat!=='passing-activation'&&practice.stage!=='Activation'&&practice.theme!=='Core Passing Activations')return [];
  const text=[practice.name,practice.desc,practice.description,practice.cp,practice.coachingPoints,practice.prog].filter(Boolean).join(' ').toLowerCase();
  return PASSING_FUNDAMENTALS.filter(item=>item.pattern.test(text)).map(item=>item.id);
}
export const fundamentalLabel=id=>PASSING_FUNDAMENTALS.find(item=>item.id===id)?.label||id;
