import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createGame,startGame,remaining,choose,next,score,sampleQuestions,questionBank,MISSION_LENGTH,DURATION,STARTING_CREDITS} from '../dist/engine.js';
function game(team=['research','analysis','human']){const s=createGame(()=>0);s.team=team;assert.equal(startGame(s,1000),true);return s;}
test('requires three teammates and starts a 360-second deadline',()=>{const s=createGame();assert.equal(startGame(s,0),false);const g=game();assert.equal(g.credits,STARTING_CREDITS-60);assert.equal(remaining(g,1000),360);assert.equal(remaining(g,361000),0);});
test('best evidence and oversight choices reach 100 without exceeding budget',()=>{const s=game();for(const question of s.questions){const option=question.options.findIndex(o=>o.score===20);assert.equal(choose(s,option,2000),true);assert.equal(choose(s,option,2000),false);assert.equal(next(s,3000),true);}assert.equal(s.phase,'result');assert.equal(score(s),100);assert.ok(s.credits>=0);assert.equal(choose(s,0,4000),false);});
test('expired decisions do not count and hidden-tab time counts',()=>{const s=game();assert.equal(choose(s,1,361000),false);assert.equal(s.phase,'result');assert.equal(s.expired,true);assert.equal(score(s),0);});
test('invalid choices and advancing unanswered rounds preserve state',()=>{const s=game();const before=JSON.stringify(s);assert.equal(choose(s,-1,2000),false);assert.equal(choose(s,9,2000),false);assert.equal(next(s,2000),false);assert.equal(JSON.stringify(s),before);});
test('missing human has an explicit scoring and cost consequence',()=>{const s=game(['research','analysis','writing']);s.round=2;choose(s,0,2000);assert.equal(score(s),5);assert.equal(s.feedback.cost,20);});
test('budget overrun remains visible and does not block learning',()=>{const s=game();s.credits=0;for(const q of s.questions){choose(s,0,2000);next(s,3000);}assert.ok(s.credits<0);assert.equal(s.phase,'result');});

test('bank contains 50 complete, uniquely identified scenarios',()=>{
 assert.equal(questionBank.length,50);
 assert.equal(new Set(questionBank.map(q=>q.id)).size,50);
 assert.equal(new Set(questionBank.map(q=>q.title)).size,50);
 for(const q of questionBank){
  for(const field of ['id','concept','title','description','event'])assert.ok(q[field]?.trim(),`${q.id}: ${field}`);
  assert.equal(q.options.length,3);
  assert.equal(q.options.filter(o=>o.score===20).length,1);
  assert.ok(q.supports.every(r=>['research','analysis','writing'].includes(r)));
  for(const o of q.options){
   assert.ok(o.title && o.detail && o.feedback);
   assert.ok(Number.isInteger(o.score) && o.score>=0 && o.score<=20);
   assert.ok(Number.isInteger(o.cost) && o.cost>=0);
  }
 }
});

function seededRandom(seed){return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
test('samples ten distinct questions, reaches the full bank, and preserves source order',()=>{
 const original=JSON.stringify(questionBank),seen=new Set(),missions=new Set();
 for(let seed=1;seed<=500;seed++){
  const questions=sampleQuestions(seededRandom(seed));
  assert.equal(questions.length,MISSION_LENGTH);
  assert.equal(new Set(questions.map(q=>q.id)).size,MISSION_LENGTH);
  questions.forEach(q=>{assert.ok(questionBank.includes(q));seen.add(q.id);});
  missions.add(questions.map(q=>q.id).join(','));
 }
 assert.equal(seen.size,50);
 assert.ok(missions.size>450);
 assert.equal(JSON.stringify(questionBank),original);
});
test('sampling covers both RNG boundaries without invalid or duplicate entries',()=>{
 for(const random of [()=>0,()=>1-Number.EPSILON]){
  const questions=sampleQuestions(random);
  assert.equal(questions.length,10);
  assert.ok(questions.every(Boolean));
  assert.equal(new Set(questions.map(q=>q.id)).size,10);
 }
});
test('mission selection remains fixed through all ten decisions and records question IDs',()=>{
 const s=createGame(seededRandom(42)),ids=s.questions.map(q=>q.id);
 s.team=['research','analysis','human'];startGame(s,1000);
 for(let i=0;i<MISSION_LENGTH;i++){
  const q=s.questions[i];
  choose(s,q.options.findIndex(o=>o.score===20),2000+i);
  next(s,3000+i);
  assert.deepEqual(s.questions.map(q=>q.id),ids);
 }
 assert.equal(s.phase,'result');assert.equal(score(s),100);
 assert.deepEqual(s.answers.map(a=>a.questionId),ids);
 assert.equal(remaining(s,999999),remaining(s,3009));
});
test('new missions resample instead of reusing previous selection or answers',()=>{
 const rng=seededRandom(17),first=createGame(rng),second=createGame(rng);
 assert.notDeepEqual(first.questions.map(q=>q.id),second.questions.map(q=>q.id));
 assert.notEqual(first.questions,second.questions);
 assert.deepEqual(second.answers,[]);assert.equal(second.deadline,null);
});
test('role effects follow the question when it moves to a different round',()=>{
 const s=game(['research','analysis','writing']);
 s.questions=[questionBank.find(q=>q.id==='conflicting-evidence'),...s.questions.slice(1)];
 choose(s,0,2000);assert.equal(s.feedback.score,10);assert.equal(s.feedback.cost,20);
 assert.equal(s.answers[0].questionId,'conflicting-evidence');
 const t=game(['research','human','writing']);
 const q=questionBank.find(q=>q.id==='release-checklist');t.questions[0]=q;
 choose(t,2,2000);assert.equal(t.feedback.cost,13);assert.match(t.feedback.message,/Without a analysis agent/);
});
