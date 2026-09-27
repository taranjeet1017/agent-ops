import {questionBank} from './questions.js';
export {questionBank};
export const MISSION_LENGTH = 10;
export const DURATION = 360;
export const STARTING_CREDITS = 150;
export const agents = [
 {id:'research',name:'Research agent',icon:'⌕',cost:15,description:'Finds source evidence across tickets and documents.'},
 {id:'analysis',name:'Analysis agent',icon:'◇',cost:20,description:'Checks evidence and surfaces conflicting signals.'},
 {id:'writing',name:'Writing agent',icon:'≡',cost:10,description:'Turns findings into a polished readiness report.'},
 {id:'human',name:'Human reviewer',icon:'◎',cost:25,description:'Resolves ambiguity and approves the final call.'}
];
// Partial Fisher–Yates: each ordered sample is equally likely.
// Copy the bank so a replay never mutates another mission or source content.
export function sampleQuestions(random = Math.random) {
 const pool = [...questionBank];
 for (let i = 0; i < MISSION_LENGTH; i++) {
  const j = i + Math.floor(random() * (pool.length - i));
  [pool[i], pool[j]] = [pool[j], pool[i]];
 }
 return pool.slice(0, MISSION_LENGTH);
}
export function createGame(random = Math.random) {
 return {phase:'setup', team:[], questions:sampleQuestions(random), round:0,
  answers:[], credits:STARTING_CREDITS, deadline:null, feedback:null, expired:false};
}
export function startGame(state, now) {
 if (state.phase !== 'setup' || state.team.length !== 3) return false;
 state.credits = STARTING_CREDITS - agents.filter(a => state.team.includes(a.id)).reduce((n,a) => n+a.cost, 0);
 state.phase = 'playing';
 state.deadline = now + DURATION*1000;
 return true;
}
export function remaining(state, now) {
 return state.secondsAtFinish ?? (state.deadline === null ? DURATION : Math.max(0, Math.ceil((state.deadline-now)/1000)));
}
export function finish(state, expired=false, now=Date.now()) {
 state.secondsAtFinish = expired ? 0 : remaining(state, now);
 state.phase = 'result';
 state.expired = expired;
 state.feedback = null;
}
const supportCosts = {research:5, analysis:5, writing:3};
const supportTasks = {research:'gathering the evidence', analysis:'validation', writing:'preparing the final report'};
export function choose(state, index, now) {
 const question = state.questions[state.round];
 if (state.phase !== 'playing' || state.feedback || !Number.isInteger(index) || !question?.options[index]) return false;
 if (remaining(state, now) === 0) { finish(state, true, now); return false; }
 const option = question.options[index];
 let score = option.score, cost = option.cost, message = option.feedback;
 if (option.needsHuman && !state.team.includes('human')) {
  score = Math.min(score, 10);
  cost += 10;
  message = 'There was no reviewer on your team. An external owner helped, but the handoff cost 10 extra credits. Plan escalation ownership before the run. ' + message;
 }
 for (const role of question.supports) {
  if (!state.team.includes(role)) {
   cost += supportCosts[role];
   message += ` Without a ${role} agent, ${supportTasks[role]} cost ${supportCosts[role]} extra credits.`;
  }
 }
 state.credits -= cost;
 state.feedback = {score, cost, message};
 state.answers.push({questionId:question.id, round:state.round, index, score, cost, message});
 return true;
}
export function next(state, now) {
 if (state.phase !== 'playing' || !state.feedback) return false;
 if (remaining(state, now) === 0) { finish(state, true, now); return true; }
 if (state.round === state.questions.length-1) { finish(state, false, now); return true; }
 state.round++;
 state.feedback = null;
 return true;
}
export function points(rawScore, count = MISSION_LENGTH) { return rawScore * 100 / (count * 20); }
export function score(state) { return Math.round(points(state.answers.reduce((n,a) => n+a.score, 0), state.questions.length)); }
