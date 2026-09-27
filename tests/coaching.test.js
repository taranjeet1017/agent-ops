import {test} from 'node:test';
import assert from 'node:assert/strict';
import {coaching,focusAreas} from '../dist/coaching.js';
import {createGame,questionBank,score,points} from '../dist/engine.js';

function fixture(ids,scores){
 const state=createGame(()=>0);
 state.questions=ids.map(id=>questionBank.find(q=>q.id===id));
 state.answers=scores.map((value,i)=>({questionId:ids[i],score:value,round:i,message:`Feedback for ${ids[i]}`}));
 return state;
}
test('every question has exactly one coaching area',()=>{
 for(const q of questionBank)assert.equal(focusAreas.filter(a=>a.ids.includes(q.id)).length,1,q.id);
});
test('weakest areas appear first, are capped at three, and cite an actual answer',()=>{
 const state=fixture(['current-sources','tool-permissions','release-checklist','conflicting-evidence','retry-limits'],[0,2,5,8,10]);
 const result=coaching(state);
 assert.deepEqual(result.focus.map(a=>a.id),['evidence','access','evaluation']);
 for(const area of result.focus){
  assert.ok(state.answers.includes(area.evidence));
  assert.equal(area.question.id,area.evidence.questionId);
  assert.ok(area.action && area.why);
 }
 assert.equal(result.strengths.length,0);assert.equal(result.advanced,false);
});
test('unanswered topics do not become weaknesses or strengths',()=>{
 const state=fixture(['current-sources','tool-permissions','release-checklist'],[20]);
 const result=coaching(state);
 assert.equal(result.focus.length,0);assert.equal(result.strengths.length,1);
 assert.deepEqual(result.unanswered.map(q=>q.id),['tool-permissions','release-checklist']);
 assert.equal(result.advanced,false);
});
test('no answers produces no diagnosis and no advanced recommendation',()=>{
 const result=coaching(createGame(()=>0));
 assert.equal(result.focus.length,0);assert.equal(result.strengths.length,0);
 assert.equal(result.unanswered.length,10);assert.equal(result.advanced,false);
});
test('a complete strong run gets strengths and advanced practice',()=>{
 const state=createGame(()=>0);
 state.answers=state.questions.map((q,i)=>({questionId:q.id,score:20,round:i}));
 const result=coaching(state);
 assert.equal(score(state),100);assert.equal(result.focus.length,0);
 assert.ok(result.strengths.length>0);assert.equal(result.advanced,true);
});
test('a mixed area is not both a strength and focus area',()=>{
 const result=coaching(fixture(['current-sources','missing-document','tool-permissions'],[20,0,20]));
 assert.deepEqual(result.focus.map(a=>a.id),['evidence']);
 assert.deepEqual(result.strengths.map(a=>a.id),['access']);
});
test('mission scoring normalizes ten answers and leaves unanswered points unearned',()=>{
 const s=createGame(()=>0);
 s.answers=[{score:20}];assert.equal(score(s),10);
 s.answers=Array.from({length:10},()=>({score:10}));assert.equal(score(s),50);
 assert.equal(points(20),10);assert.equal(points(5),2.5);
});
