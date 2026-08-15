import test from 'node:test';
import assert from 'node:assert/strict';
import { filterSessions, sessionDiagramItems } from '../src/session-library-speed.js';

const practices = {
  p1: { id: 'p1', name: 'Wide press', stage: 'Main', theme: 'Defending', diagram: [{ type: 'player', x: 10, y: 10 }], pitchMode: 'full' },
  p2: { id: 'p2', name: 'Possession game', stage: 'Game', theme: 'Possession', diagram: [], pitchMode: 'thirds' }
};
const lookup = id => practices[id] || null;

test('filterSessions searches session fields and practice names, then sorts newest first', () => {
  const sessions = [
    { id: 'a', date: '2026-08-01', team: 'U18', theme: 'Defending', objective: 'Stay compact', drills: ['p1'] },
    { id: 'b', date: '2026-08-12', team: 'U18', theme: 'Possession', objective: 'Play through midfield', drills: ['p2'] },
    { id: 'c', date: '2026-08-10', team: 'U16', theme: 'Defending', objective: 'Force wide', drills: ['p1'] }
  ];
  assert.deepEqual(filterSessions(sessions, { search: 'wide' }, lookup).map(s => s.id), ['c', 'a']);
  assert.deepEqual(filterSessions(sessions, { team: 'U18', theme: 'Defending' }, lookup).map(s => s.id), ['a']);
});

test('sessionDiagramItems returns one effective diagram entry per practice', () => {
  const session = { drills: ['p1', 'p2'] };
  const items = sessionDiagramItems(session, lookup, (s, index) => index === 1 ? { ...practices.p2, name: 'Session-specific possession', diagram: [{ type: 'ball', x: 20, y: 20 }] } : null);
  assert.equal(items.length, 2);
  assert.equal(items[0].name, 'Wide press');
  assert.equal(items[1].name, 'Session-specific possession');
  assert.equal(items[1].diagram.length, 1);
  assert.equal(items[1].pitchMode, 'thirds');
});
