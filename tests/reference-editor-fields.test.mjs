import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../src/practice-editor-unified.js', import.meta.url), 'utf8');

test('unified editor preserves current practice text fields', () => {
  for (const field of ['players','time','area','desc','prog','reg','cp','condRules']) assert.match(source, new RegExp(`${field}\\.value`));
});
