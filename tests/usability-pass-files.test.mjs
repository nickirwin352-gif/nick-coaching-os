import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

for (const file of ['../src/startup-performance.js','../src/session-usability-pass.js','../src/practice-editor-unified.js']) {
  test(`usability module exists: ${file}`, () => {
    assert.ok(fs.readFileSync(new URL(file, import.meta.url), 'utf8').length > 100);
  });
}
