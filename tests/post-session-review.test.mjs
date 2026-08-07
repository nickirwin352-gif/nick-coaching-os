import test from 'node:test';
import assert from 'node:assert/strict';
import { average, summariseReviewReflection, buildPracticeReviewStats, buildDashboardActionsData } from '../src/post-session-review.js';

test('average ignores empty and zero ratings',()=>{
  assert.equal(average(['4','5','',0]),4.5);
});

test('review reflection remains compatible with legacy reflect field',()=>{
  assert.equal(summariseReviewReflection({worked:'Pressing triggers',didntWork:'Distances',repeat:'3v2',changeNext:'Smaller area'}),'Worked: Pressing triggers\nDidn\'t: Distances\nRepeat: 3v2\nChange next: Smaller area');
});

test('practice review stats aggregate effectiveness, engagement and decisions',()=>{
  const stats=buildPracticeReviewStats([
    {review:{practices:[{practiceId:'P1',effectiveness:'4',engagement:'High',decision:'Keep'}]}},
    {review:{practices:[{practiceId:'P1',effectiveness:'5',engagement:'Medium',decision:'Adapt'}]}}
  ]);
  assert.equal(stats[0].averageEffectiveness,4.5);
  assert.equal(stats[0].engagement.High,1);
  assert.equal(stats[0].decisions.Keep,1);
  assert.equal(stats[0].decisions.Adapt,1);
});

test('dashboard actions find a coverage gap and enrich most-used practice with review score',()=>{
  const db={
    practices:[{id:'P1',name:'4v4 Possession',theme:'Possession'},{id:'D1',name:'1v1 Defending',theme:'Defending'}],
    sessions:[
      {date:'2026-08-07',theme:'Possession',drills:['P1'],review:{practices:[{practiceId:'P1',effectiveness:'4'}]}},
      {date:'2026-08-05',theme:'Possession',drills:['P1'],review:{practices:[{practiceId:'P1',effectiveness:'5'}]}},
      {date:'2026-08-01',theme:'Defending',drills:['D1']}
    ]
  };
  const data=buildDashboardActionsData(db,8);
  assert.deepEqual(data.coverageGap,{theme:'Defending',count:1});
  assert.equal(data.mostReused.id,'P1');
  assert.equal(data.mostReused.used,2);
  assert.equal(data.mostReused.averageEffectiveness,4.5);
});
