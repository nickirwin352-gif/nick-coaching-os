import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const inlineClassicScripts = [...html.matchAll(/<script(?![^>]*\btype=["']module["'])[^>]*>([\s\S]*?)<\/script>/gi)]
  .map(match => match[1])
  .filter(source => source.trim());

test('all inline classic scripts are syntactically valid JavaScript', () => {
  assert.ok(inlineClassicScripts.length > 0, 'expected inline application scripts');
  inlineClassicScripts.forEach((source, index) => {
    assert.doesNotThrow(
      () => new Function(source),
      `inline script ${index + 1} should parse`
    );
  });
});
