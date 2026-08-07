import test from 'node:test';
import assert from 'node:assert/strict';
import { sidelineGlanceCss } from '../src/sideline-glance-layout.js';

test('Sideline glance layout removes the quick-action row',()=>{
  const css=sidelineGlanceCss();
  assert.match(css,/\.sidelineQuickActions\{display:none!important\}/);
});

test('Sideline glance layout keeps tabs above a scrollable instruction panel',()=>{
  const css=sidelineGlanceCss();
  assert.match(css,/\.sidelineInfo>\.sidelineTabs\{position:sticky/);
  assert.match(css,/\.sidelineTextPanel\{min-height:0;overflow-y:auto/);
});

test('Sideline glance layout limits diagram height on phones',()=>{
  const css=sidelineGlanceCss();
  assert.match(css,/\.sidelinePitch\{height:min\(30dvh,245px\)/);
});
