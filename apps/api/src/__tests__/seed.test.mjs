import { DatabaseSync } from 'node:sqlite';
import { readdirSync, readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderSeedSql } from '../seed-sql.ts';

const migrationsDir = new URL('../../../../packages/db/drizzle/', import.meta.url);

/** A database built from the real migrations, so cascades and unique indexes match D1. */
function database(t) {
  const db = new DatabaseSync(':memory:');
  t.after(() => db.close());
  db.exec('PRAGMA foreign_keys = ON;');
  for (const file of readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort()) {
    db.exec(readFileSync(new URL(file, migrationsDir), 'utf8'));
  }
  return db;
}

const mc = (id, prompt = `Prompt ${id}`) => ({
  kind: 'multiple_choice',
  id,
  prompt,
  choices: [
    { id: 'a', label: 'A' },
    { id: 'b', label: 'B' },
  ],
  correctChoiceId: 'b',
});

const unit = (id, order, lessons, prerequisites = []) => ({
  id,
  title: `Unit ${id}`,
  description: `About ${id}`,
  order,
  prerequisites,
  lessons,
});

const lesson = (id, exercises) => ({ id, title: `Lesson ${id}`, exercises });

function course() {
  return [
    unit('u1', 0, [lesson('l1', [mc('e1'), mc('e2'), mc('e3')]), lesson('l2', [mc('e4')])]),
    unit('u2', 1, [lesson('l3', [mc('e5')])], ['u1']),
  ];
}

function seed(db, units, now = 1000) {
  db.exec(renderSeedSql(units, now));
}

/** A learner who has solved e1 and e2 and finished l1. */
function addProgress(db) {
  db.exec(`
    INSERT INTO user (id, name, email, created_at, updated_at) VALUES ('u', 'Learner', 'l@x.com', 0, 0);
    INSERT INTO learner_profiles (user_id, total_xp, created_at, updated_at) VALUES ('u', 30, 0, 0);
    INSERT INTO lesson_progress (user_id, lesson_id, status, updated_at) VALUES ('u', 'l1', 'completed', 0);
    INSERT INTO exercise_attempts (id, user_id, exercise_id, lesson_id, attempt_number, is_correct, submitted, xp_awarded, created_at)
      VALUES ('a1', 'u', 'e1', 'l1', 1, 1, '{}', 15, 0),
             ('a2', 'u', 'e2', 'l1', 1, 1, '{}', 15, 0);
  `);
}

const count = (db, table) => db.prepare(`SELECT count(*) AS n FROM ${table}`).get().n;
const orderOf = (db, table, id) =>
  db.prepare(`SELECT sort_order AS o FROM ${table} WHERE id = ?`).get(id)?.o;

test('reseeding unchanged content keeps every attempt and lesson row', (t) => {
  const db = database(t);
  seed(db, course());
  addProgress(db);

  seed(db, course());

  assert.equal(count(db, 'exercise_attempts'), 2);
  assert.equal(count(db, 'lesson_progress'), 1);
  assert.equal(db.prepare('SELECT total_xp AS x FROM learner_profiles').get().x, 30);
});

test('is idempotent', (t) => {
  const db = database(t);
  seed(db, course());
  const snapshot = () =>
    JSON.stringify(
      ['units', 'lessons', 'exercises', 'unit_prerequisites'].map((table) =>
        db.prepare(`SELECT * FROM ${table} ORDER BY 1, 2`).all(),
      ),
    );
  const first = snapshot();
  seed(db, course());
  assert.equal(snapshot(), first);
});

test('applies edits to existing content without losing progress', (t) => {
  const db = database(t);
  seed(db, course());
  addProgress(db);

  const edited = course();
  edited[0].title = 'Renamed unit';
  edited[0].lessons[0].exercises[0] = mc('e1', 'A clearer prompt');
  seed(db, edited, 2000);

  const row = db.prepare("SELECT prompt, payload FROM exercises WHERE id = 'e1'").get();
  assert.equal(row.prompt, 'A clearer prompt');
  assert.equal(JSON.parse(row.payload).prompt, 'A clearer prompt');
  assert.equal(db.prepare("SELECT title FROM units WHERE id = 'u1'").get().title, 'Renamed unit');
  assert.equal(count(db, 'exercise_attempts'), 2);
});

test('keeps a unit created_at when the unit is updated', (t) => {
  const db = database(t);
  seed(db, course(), 1000);
  seed(db, course(), 9999);
  assert.equal(db.prepare("SELECT created_at AS c FROM units WHERE id = 'u1'").get().c, 1000);
});

test('reorders lessons and exercises despite the unique position indexes', (t) => {
  const db = database(t);
  seed(db, course());
  addProgress(db);

  const reordered = course();
  reordered[0].lessons.reverse();
  reordered[0].lessons[1].exercises.reverse();
  seed(db, reordered);

  assert.equal(orderOf(db, 'lessons', 'l2'), 0);
  assert.equal(orderOf(db, 'lessons', 'l1'), 1);
  assert.deepEqual(
    ['e3', 'e2', 'e1'].map((id) => orderOf(db, 'exercises', id)),
    [0, 1, 2],
  );
  assert.equal(count(db, 'exercise_attempts'), 2);
});

test('moves a lesson to another unit and keeps its progress', (t) => {
  const db = database(t);
  seed(db, course());
  addProgress(db);

  const moved = course();
  const [l1] = moved[0].lessons.splice(0, 1);
  moved[1].lessons.unshift(l1);
  seed(db, moved);

  const row = db.prepare("SELECT unit_id, sort_order FROM lessons WHERE id = 'l1'").get();
  assert.deepEqual({ ...row }, { unit_id: 'u2', sort_order: 0 });
  assert.equal(orderOf(db, 'lessons', 'l3'), 1);
  assert.equal(count(db, 'lesson_progress'), 1);
});

test('adds new content and removes content dropped from the source', (t) => {
  const db = database(t);
  seed(db, course());
  addProgress(db);

  const changed = course();
  // Drop e2, which the learner solved, and add e6.
  changed[0].lessons[0].exercises = [mc('e1'), mc('e3'), mc('e6')];
  // Drop lesson l2 entirely.
  changed[0].lessons.splice(1, 1);
  seed(db, changed);

  const ids = (table) =>
    db
      .prepare(`SELECT id FROM ${table} ORDER BY id`)
      .all()
      .map((r) => r.id);
  assert.deepEqual(ids('exercises'), ['e1', 'e3', 'e5', 'e6']);
  assert.deepEqual(ids('lessons'), ['l1', 'l3']);
  // The attempt on removed e2 goes with it; the attempt on kept e1 stays.
  assert.deepEqual(ids('exercise_attempts'), ['a1']);
});

test('replaces prerequisites', (t) => {
  const db = database(t);
  seed(db, course());

  const changed = course();
  changed[1].prerequisites = [];
  seed(db, changed);

  assert.equal(count(db, 'unit_prerequisites'), 0);
});

test('refuses to render a course that would delete everything', () => {
  assert.throws(() => renderSeedSql([], 0), /incomplete course/);
  assert.throws(() => renderSeedSql([unit('u', 0, [])], 0), /incomplete course/);
  assert.throws(() => renderSeedSql([unit('u', 0, [lesson('l', [])])], 0), /incomplete course/);
});

test('escapes quotes in content', (t) => {
  const db = database(t);
  const tricky = course();
  tricky[0].lessons[0].exercises[0] = mc(
    'e1',
    "It's the learner's \"own\" money'); DROP TABLE user;--",
  );
  seed(db, tricky);

  assert.equal(
    db.prepare("SELECT prompt FROM exercises WHERE id = 'e1'").get().prompt,
    "It's the learner's \"own\" money'); DROP TABLE user;--",
  );
  assert.equal(count(db, 'user'), 0);
  assert.ok(db.prepare("SELECT name FROM sqlite_master WHERE name = 'user'").get());
});
