import { describe, expect, it } from 'vitest';

import {
  groupBy,
  isUnitComplete,
  isUnitUnlocked,
  missingPrerequisites,
  type UnlockGraph,
} from '../unlocks';

// budgeting -> banking -> basics, the shape of the real course.
const graph: UnlockGraph = {
  prerequisitesByUnit: new Map([
    ['banking', ['budgeting']],
    ['basics', ['banking']],
  ]),
  lessonsByUnit: new Map([
    ['budgeting', ['b1', 'b2']],
    ['banking', ['k1']],
    ['basics', ['m1']],
    ['empty', []],
  ]),
};

const done = (...ids: string[]) => new Set(ids);

describe('isUnitComplete', () => {
  it('needs every lesson completed', () => {
    expect(isUnitComplete('budgeting', graph.lessonsByUnit, done('b1'))).toBe(false);
    expect(isUnitComplete('budgeting', graph.lessonsByUnit, done('b1', 'b2'))).toBe(true);
  });

  it('never counts an empty or unknown unit as complete', () => {
    expect(isUnitComplete('empty', graph.lessonsByUnit, done())).toBe(false);
    expect(isUnitComplete('nope', graph.lessonsByUnit, done())).toBe(false);
  });
});

describe('isUnitUnlocked', () => {
  it('opens a unit with no prerequisites', () => {
    expect(isUnitUnlocked('budgeting', graph, done())).toBe(true);
  });

  it('keeps a unit locked until its prerequisite is fully complete', () => {
    expect(isUnitUnlocked('banking', graph, done())).toBe(false);
    expect(isUnitUnlocked('banking', graph, done('b1'))).toBe(false);
    expect(isUnitUnlocked('banking', graph, done('b1', 'b2'))).toBe(true);
  });

  it('checks each link in the chain', () => {
    expect(isUnitUnlocked('basics', graph, done('b1', 'b2'))).toBe(false);
    expect(isUnitUnlocked('basics', graph, done('b1', 'b2', 'k1'))).toBe(true);
  });

  it('stays locked behind a prerequisite with no lessons', () => {
    const withEmpty: UnlockGraph = {
      ...graph,
      prerequisitesByUnit: new Map([['after-empty', ['empty']]]),
    };
    expect(isUnitUnlocked('after-empty', withEmpty, done())).toBe(false);
  });
});

describe('missingPrerequisites', () => {
  it('names exactly the units still to finish', () => {
    const twoPrereqs: UnlockGraph = {
      ...graph,
      prerequisitesByUnit: new Map([['capstone', ['budgeting', 'banking']]]),
    };
    expect(missingPrerequisites('capstone', twoPrereqs, done('b1', 'b2'))).toEqual(['banking']);
  });
});

describe('groupBy', () => {
  it('groups rows and keeps their order', () => {
    const rows = [
      { unit: 'a', id: '1' },
      { unit: 'b', id: '2' },
      { unit: 'a', id: '3' },
    ];
    expect(
      groupBy(
        rows,
        (r) => r.unit,
        (r) => r.id,
      ),
    ).toEqual(
      new Map([
        ['a', ['1', '3']],
        ['b', ['2']],
      ]),
    );
  });
});
