import {phaseById,principleById,normaliseGameModelPlan} from './game-model-core.js?v=personal-model-1';

/* One canonical title for archived and saved sessions.
   Existing reviews may contain model choices absent from the original plan.
   Never treat an old practice-theme name as a coaching phase. */
export function sessionTitle(session={}){
  const plan=normaliseGameModelPlan(session?.gameModelPlan||{});
  const reviewed=normaliseGameModelPlan(session?.review?.gameModelV2||{});
  const principle=principleById(plan.primaryPrincipleId||reviewed.primaryPrincipleId);
  const phase=phaseById(plan.gamePhase||reviewed.gamePhase||principle?.phaseId);
  if(!phase&&!principle)return 'Session · phase / principle not recorded';
  const main=principle&&(!phase||principle.phaseIds.includes(phase.id))?principle.message:'Main principle not recorded';
  return [phase?.label||'Phase not recorded',main].join(' · ');
}
export function sessionModelError(session={}){
  const plan=session.gameModelPlan||{};
  const phase=phaseById(plan.gamePhase),principle=principleById(plan.primaryPrincipleId);
  if(!phase)return 'Choose one of the four phases before saving the session.';
  if(!principle||principle.phaseId!==phase.id)return 'Choose a principle for the selected phase before saving the session.';
  return '';
}
if(typeof window!=='undefined')window.NickSessionIdentity={title:sessionTitle,validate:sessionModelError};
