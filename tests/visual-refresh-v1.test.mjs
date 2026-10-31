import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/visual-refresh-v1.css',import.meta.url),'utf8');

test('the theme loads while the existing application runtime stays in place',()=>{
  assert.match(html,/href="\.\/src\/visual-refresh-v1\.css\?v=1"/);
  assert.match(html,/src="\.\/src\/session-state\.js\?v=ios-banks-1"/);
  assert.match(html,/id="cloudPillTop"/);
});
test('navigation and core coaching actions still target existing handlers',()=>{
  for(const page of ['library','planner','archive','editor','dashboard','wordbank','backup']){
    assert.match(html,new RegExp('data-tab="'+page+'"'));
    assert.match(html,new RegExp('id="'+page+'"'));
  }
  assert.match(html,/class="workspaceHero"/);
  assert.match(html,/onclick="newPractice\(\)"/);
  assert.match(html,/onclick="savePractice\(\)"/);
});
test('mobile layouts, focus cues and reduced motion are covered',()=>{
  assert.match(css,/:focus-visible/);
  assert.match(css,/@media\(max-width:850px\)/);
  assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
  assert.match(css,/\.bottomNav/);
});
