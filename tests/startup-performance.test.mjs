import test from 'node:test';
import assert from 'node:assert/strict';
import { shouldCoalesceRender } from '../src/startup-performance.js';

test('startup renders coalesce only during the short startup window', () => {
  assert.equal(shouldCoalesceRender(100, 500), true);
  assert.equal(shouldCoalesceRender(100, 1899), true);
  assert.equal(shouldCoalesceRender(100, 1900), false);
  assert.equal(shouldCoalesceRender(100, 2500), false);
});

test('all startup enhancements preload without changing ordered installation', async () => {
  const { readFile } = await import('node:fs/promises');
  const html = await readFile(new URL('../index.html', import.meta.url),'utf8');
  const startup = await readFile(new URL('../src/session-state.js', import.meta.url),'utf8');
  const modules = [...startup.matchAll(/import\('(\.\/[^']+)'\)/g)].map(match=>match[1]);
  assert.ok(modules.length > 30);
  for (const module of modules) {
    const path = './src/' + module.slice(2);
    assert.ok(html.indexOf(`<link rel="modulepreload" href="${path}">`) < html.indexOf('<style>'),`${path} should fetch before the application starts`);
    await readFile(new URL('../src/'+module.slice(2),import.meta.url));
  }
  assert.match(startup,/\.then\(\(\) => import\('\.\/diagram-editor-coach-workflow\.js'\)\)/);
});
