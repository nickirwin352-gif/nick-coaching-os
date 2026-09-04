import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { isManualNoPrinciple, NO_PRINCIPLE_DECISION_VERSION } from '../src/practice-no-principle-decision-v1.js';

const source = await readFile(new URL('../src/practice-no-principle-decision-v1.js', import.meta.url),'utf8');

test('manual no-principle decision is explicit rather than inferred', () => {
  assert.equal(NO_PRINCIPLE_DECISION_VERSION,1);
  assert.equal(isManualNoPrinciple({noGameModelPrinciple:true,organisationSource:'manual'}),true);
  assert.equal(isManualNoPrinciple({noGameModelPrinciple:true,organisationSource:'auto-v4'}),false);
  assert.equal(isManualNoPrinciple({noGameModelPrinciple:false,organisationSource:'manual'}),false);
});

test('reassertion clears principle suggestions and needs review for deliberate no-principle practices', () => {
  assert.match(source,/practice\.primaryGameModelPrinciple = ''/);
  assert.match(source,/practice\.gameModelPrinciples = \[\]/);
  assert.match(source,/practice\.suggestedGameModelPrinciples = \[\]/);
  assert.match(source,/practice\.organisationNeedsReview = false/);
  assert.match(source,/practice\.organisationConfidence = 'manual'/);
});

test('no-principle support reasserts after the legacy organiser startup passes', () => {
  assert.match(source,/\[650,1950,4350\]/);
  assert.match(source,/wrapAutoOrganiser/);
  assert.match(source,/reassertNoPrincipleDecisions\(\{persist:true\}\)/);
});
