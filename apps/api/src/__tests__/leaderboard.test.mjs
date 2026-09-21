import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { leaderboardQuery, leaderboardResult, leaderboardWeek } from '../leaderboard-query.ts';

function fixture(t) {
  const db = new DatabaseSync(':memory:');
  t.after(() => db.close());
  db.exec(`CREATE TABLE user (id TEXT PRIMARY KEY, name TEXT);
    CREATE TABLE learner_profiles (user_id TEXT PRIMARY KEY, total_xp INTEGER);
    CREATE TABLE daily_activity (user_id TEXT, day TEXT, xp_earned INTEGER);`);
  const add = (id, xp, name = id) => {
    db.prepare('INSERT INTO user VALUES (?, ?)').run(id, name);
    db.prepare('INSERT INTO learner_profiles VALUES (?, ?)').run(id, xp);
  };
  const query = (id, period = 'all-time') => {
    const week = leaderboardWeek(new Date('2026-09-13T23:59:59Z'));
    const args = period === 'weekly' ? [week.start, week.end, id] : [id];
    return leaderboardResult(db.prepare(leaderboardQuery(period)).all(...args), id, period, week);
  };
  return { db, add, query };
}

test('ties share ranks, deterministic order, zero XP excluded, only display data returned', (t) => {
  const { add, query } = fixture(t);
  add('b', 100, 'Same name');
  add('a', 100, 'Same name');
  add('c', 50);
  add('d', 0);
  const result = query('b');
  assert.deepEqual(
    result.entries.map((e) => e.rank),
    [1, 1, 3],
  );
  assert.deepEqual(
    result.entries.map((e) => e.isYou),
    [false, true, false],
  );
  assert.equal(result.totalLearners, 3);
  assert.deepEqual(Object.keys(result.entries[0]).sort(), ['isYou', 'name', 'rank', 'xp']);
});

test('includes callers outside top ten and nearby ranks without duplicating top rows', (t) => {
  const { add, query } = fixture(t);
  for (let i = 1; i <= 30; i++) add(`u${i}`, 1000 - i);
  const result = query('u20');
  assert.equal(result.entries.length, 10);
  assert.equal(result.currentUser.rank, 20);
  assert.deepEqual(
    result.nearby.map((e) => e.rank),
    [18, 19, 20, 21, 22],
  );
  assert.equal(result.totalLearners, 30);
  assert.deepEqual(
    query('u10').nearby.map((e) => e.rank),
    [11, 12],
  );
});

test('unranked and unknown callers receive no invented rank', (t) => {
  const { add, query } = fixture(t);
  assert.deepEqual(query('missing').entries, []);
  assert.equal(query('missing').totalLearners, 0);
  add('new', 0);
  add('active', 25);
  assert.equal(query('new').currentUser, null);
  assert.deepEqual(query('new').nearby, []);
  assert.equal(query('new').entries.length, 1);
  assert.equal(query("' OR 1=1 --").currentUser, null);
});

test('weekly totals include Monday and Sunday and exclude both adjacent weeks', (t) => {
  const { db, add, query } = fixture(t);
  add('a', 999);
  add('b', 888);
  const insert = db.prepare('INSERT INTO daily_activity VALUES (?, ?, ?)');
  insert.run('a', '2026-09-06', 1000);
  insert.run('a', '2026-09-07', 20);
  insert.run('a', '2026-09-13', 30);
  insert.run('a', '2026-09-14', 2000);
  insert.run('b', '2026-09-06', 3000);
  const result = query('a', 'weekly');
  assert.equal(result.currentUser.xp, 50);
  assert.equal(result.totalLearners, 1);
  assert.equal(result.weekStart, '2026-09-07');
  assert.equal(result.weekEndExclusive, '2026-09-14');
  assert.equal(query('b', 'weekly').currentUser, null);
});

test('empty board, one learner, and a lone caller have no invented neighbors', (t) => {
  const { add, query } = fixture(t);
  const empty = query('nobody');
  assert.equal(empty.totalLearners, 0);
  assert.deepEqual(empty.entries, []);
  assert.equal(empty.currentUser, null);

  add('only', 40, 'Only');
  const solo = query('only');
  assert.equal(solo.totalLearners, 1);
  assert.equal(solo.entries.length, 1);
  assert.equal(solo.currentUser.rank, 1);
  assert.deepEqual(solo.nearby, []);
});

test('weekly ties share ranks and ignore zero daily XP', (t) => {
  const { db, add, query } = fixture(t);
  add('a', 1, 'A');
  add('b', 1, 'B');
  add('idle', 500, 'Idle');
  const insert = db.prepare('INSERT INTO daily_activity VALUES (?, ?, ?)');
  insert.run('a', '2026-09-08', 10);
  insert.run('b', '2026-09-09', 10);
  insert.run('idle', '2026-09-08', 0);
  const result = query('a', 'weekly');
  assert.deepEqual(
    result.entries.map((e) => e.rank),
    [1, 1],
  );
  assert.equal(result.totalLearners, 2);
});

test('week selection uses UTC and handles Monday, year rollover and leap day', () => {
  assert.deepEqual(leaderboardWeek(new Date('2026-09-14T00:00:00Z')), {
    start: '2026-09-14',
    end: '2026-09-21',
  });
  assert.deepEqual(leaderboardWeek(new Date('2026-01-01T12:00:00Z')), {
    start: '2025-12-29',
    end: '2026-01-05',
  });
  assert.deepEqual(leaderboardWeek(new Date('2024-02-29T12:00:00Z')), {
    start: '2024-02-26',
    end: '2024-03-04',
  });
});
