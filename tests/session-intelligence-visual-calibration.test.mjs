import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { previewDataForPractice } from '../src/diagram-preview-calibration-v2.js';
import { scoreOutOfTen, trafficHue, latestPracticeReview } from '../src/session-intelligence-v2.js';

const diagramSource = await readFile(new URL('../src/diagram-preview-calibration-v2.js', import.meta.url), 'utf8');
const intelligenceSource = await readFile(new URL('../src/session-intelligence-v2.js', import.meta.url), 'utf8');

test('diagram previews use the saved first visual step consistently', () => {
  const practice = {
    pitchMode:'full',
    diagram:[{id:'legacy'}],
    diagramSteps:[{pitchMode:'half',diagram:[{id:'setup'}]},{pitchMode:'full',diagram:[{id:'progression'}]}]
  };
  assert.deepEqual(previewDataForPractice(practice), { pitchMode:'half', diagram:[{id:'setup'}] });
  assert.match(diagramSource, /ResizeObserver/);
  assert.match(diagramSource, /previewSixYard/);
  assert.match(diagramSource, /previewGoal/);
  assert.match(diagramSource, /preserveAspectRatio/);
});

test('session review scores are normalised to a ten point scale', () => {
  assert.equal(scoreOutOfTen({rating:'5'}), 10);
  assert.equal(scoreOutOfTen({rating:'5',review:{rating:'5',scale:10}}), 5);
  assert.equal(scoreOutOfTen({review:{rating:'10',scale:10}}), 10);
  assert.equal(scoreOutOfTen({}), 0);
});

test('traffic light scale moves from red through yellow-orange to green', () => {
  assert.equal(trafficHue(1), 0);
  assert.equal(trafficHue(5), 38);
  assert.equal(trafficHue(10), 125);
  assert.equal(trafficHue(0), 0);
});

test('latest practice review preserves reasoning for reuse decisions', () => {
  const result = latestPracticeReview([
    {id:'old',date:'2026-08-01',review:{scale:10,practices:[{practiceId:'P1',effectiveness:'4',reasoning:'Too much waiting'}]}},
    {id:'new',date:'2026-08-10',review:{scale:10,practices:[{practiceId:'P1',effectiveness:'7',decision:'Adapt',reasoning:'Good practice, reduce area slightly'}]}}
  ], 'P1');
  assert.equal(result.session.id, 'new');
  assert.equal(result.score, 7);
  assert.equal(result.reasoning, 'Good practice, reduce area slightly');
});

test('review saving is local first and cloud sync is backgrounded', () => {
  assert.match(intelligenceSource, /saveLocal\(data\)/);
  assert.match(intelligenceSource, /queueCloud\(data\)/);
  assert.match(intelligenceSource, /closeReviewNow\(\)/);
  assert.match(intelligenceSource, /Review saved · syncing in background/);
});

test('review reasoning, session subtitles and calendar scores are surfaced', () => {
  assert.match(intelligenceSource, /Reasoning \/ Coach Feedback/);
  assert.match(intelligenceSource, /sessionSubtitle/);
  assert.match(intelligenceSource, /practiceReviewMemory/);
  assert.match(intelligenceSource, /sessionReviewMemory/);
  assert.match(intelligenceSource, /calSessionScore/);
  assert.match(intelligenceSource, /sessionQualityDot/);
});

test('known diagram contexts are redrawn from effective practice data', () => {
  assert.match(intelligenceSource, /function rerenderKnownDiagrams/);
  assert.match(intelligenceSource, /dsEffectiveSessionPractice/);
  assert.match(intelligenceSource, /dsCurrentPlannerPractice/);
  assert.match(intelligenceSource, /review-practice-diagram-/);
  assert.match(intelligenceSource, /currentSessionDockDiagramStrip/);
});
