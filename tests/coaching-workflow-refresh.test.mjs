import test from 'node:test';
import assert from 'node:assert/strict';
import {sortPracticesForDisplay} from '../src/practice-display-order.js';
import {practiceReviewHistory,capturePhrase} from '../src/coaching-memory-workflow-v1.js';

test('unfiltered practices sort by creation date without mutation',()=>{
 const items=[{id:'a',stage:'Activation',createdAt:'2026-01-01'},{id:'b',stage:'Conditioned Game',createdAt:'2026-01-03'},{id:'c',stage:'Skill Practice',createdAt:'2026-01-02'}];
 assert.deepEqual(sortPracticesForDisplay(items).map(p=>p.id),['b','c','a']);
 assert.deepEqual(sortPracticesForDisplay(items,{search:'x'}).map(p=>p.id),['a','c','b']);
 assert.equal(items[0].id,'a');
});
test('review history is ordered newest first',()=>{
 const sessions=[{date:'2026-01-01',review:{practices:[{practiceId:'a',reasoning:'Earlier note'}]}},{date:'2026-01-02',review:{practices:[{practiceId:'a',reasoning:'New note'}]}}];
 assert.equal(practiceReviewHistory(sessions,'a')[0].review.reasoning,'New note');
});
test('custom coaching phrases are deduplicated and sent to main principle',()=>{
 const db={banks:{}};
 assert.equal(capturePhrase(db,'arrive-affect-away','cp','Move after playing the pass','Practice A'),1);
 assert.equal(capturePhrase(db,'arrive-affect-away','cp','Move after playing the pass','Practice A'),0);
 assert.ok(db.banks.principleWordBanks['principle:arrive-affect-away'].cp.includes('Move after playing the pass'));
});
