import {phaseById,principleById} from './game-model-core.js';
export function sessionTitle(session={}){
  const plan=session.gameModelPlan||{};
  const principle=principleById(plan.primaryPrincipleId);
  const phase=phaseById(plan.gamePhase||principle?.phaseId);
  return [phase?.label,principle?.message].filter(Boolean).join(' · ')||'Session · phase / principle not recorded';
}
export function sessionModelError(session={}){
  const plan=session.gameModelPlan||{};
  const phase=phaseById(plan.gamePhase),principle=principleById(plan.primaryPrincipleId);
  if(!phase)return 'Choose one of the four phases before saving the session.';
  if(!principle||principle.phaseId!==phase.id)return 'Choose a principle for the selected phase before saving the session.';
  return '';
}
if(typeof window!=='undefined')window.NickSessionIdentity={title:sessionTitle,validate:sessionModelError};
