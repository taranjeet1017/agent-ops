// Stable IDs keep coaching independent of question order and display wording.
export const focusAreas = [
 {
  id:'evidence', title:'Ground decisions in evidence',
  ids:['current-sources','missing-document','source-authority','context-overload','split-document','citation-check','cache-freshness','structured-input','multimodal-gap'],
  why:'A convincing answer is only useful when its sources are relevant, current, and support the claim.',
  action:'For your next report, require source links, timestamps, and an explicit list of missing evidence.'
 },
 {
  id:'access', title:'Set safe boundaries for agents',
  ids:['tool-permissions','data-permissions','prompt-injection','output-validation','secret-handling','personal-data','approval-scope','sandbox-tools','destination-allowlist','logging-secrets','write-preview'],
  why:'An agent’s incorrect decision can become an external action or disclosure if permissions are too broad.',
  action:'List each tool’s permitted data, actions, and destinations; put approval gates before consequential changes.'
 },
 {
  id:'evaluation', title:'Define and test good outcomes',
  ids:['release-checklist','eval-representative','eval-holdout','eval-severity','eval-baseline','eval-judge','eval-regression','eval-variability','eval-slices','eval-ground-truth'],
  why:'Fluency and aggregate success rates can hide the failures that matter most to a launch.',
  action:'Build a small evaluation set with typical cases, missing evidence, and critical blockers; define a release gate for severe misses.'
 },
 {
  id:'oversight', title:'Design clear ownership and handoffs',
  ids:['conflicting-evidence','human-owner','handoff-contract','task-decomposition','agent-disagreement','autonomy-level','agent-memory','human-rubber-stamp','agent-vs-rule','scope-drift'],
  why:'Useful automation depends on clear responsibilities, verifiable handoffs, and someone accountable for uncertainty.',
  action:'Map the workflow’s steps, outputs, and reviewer; give unresolved cases a deadline and a safe fallback.'
 },
 {
  id:'operations', title:'Plan for cost and failure',
  ids:['retry-limits','model-routing','cost-budget','idempotent-action','rate-limit','observability','versioning','canary-release','production-drift','rollback-recovery'],
  why:'A working demo still needs limits, monitoring, and recovery when dependencies or inputs change.',
  action:'Set a per-run budget, bounded retries, a fallback, and a rollback trigger before the next rollout.'
 }
];

export function coaching(state) {
 const questions = new Map(state.questions.map(q => [q.id,q]));
 const assessed = state.answers.filter(a => questions.has(a.questionId));
 const areas = focusAreas.map(area => {
  const answers = assessed.filter(a => area.ids.includes(a.questionId));
  const weak = answers.filter(a => a.score < 15).sort((a,b) => a.score-b.score || a.round-b.round);
  return {...area, answers, weak, average:answers.length ? answers.reduce((sum,a)=>sum+a.score,0)/answers.length : null};
 });
 const focus = areas.filter(area => area.weak.length)
  .sort((a,b) => a.average-b.average || b.weak.length-a.weak.length)
  .slice(0,3).map(area => ({...area, evidence:area.weak[0], question:questions.get(area.weak[0].questionId)}));
 const strengths = areas.filter(area => area.answers.length && !area.weak.length)
  .sort((a,b) => b.average-a.average || b.answers.length-a.answers.length)
  .slice(0,3).map(area => ({...area, question:questions.get(area.answers[0].questionId)}));
 const unanswered = state.questions.filter(q => !assessed.some(a => a.questionId===q.id));
 return {focus, strengths, unanswered, assessedCount:assessed.length,
  advanced:assessed.length===state.questions.length && focus.length===0};
}
