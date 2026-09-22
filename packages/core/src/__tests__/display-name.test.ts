import { describe, expect, it } from 'vitest';

import { checkDisplayName, MAX_DISPLAY_NAME_LENGTH, truncateDisplayName } from '../display-name';

describe('checkDisplayName', () => {
  it('accepts a normal name and trims it', () => {
    expect(checkDisplayName('  Ada Lovelace ')).toEqual({ ok: true, name: 'Ada Lovelace' });
  });

  it('accepts exactly the maximum length', () => {
    expect(checkDisplayName('a'.repeat(MAX_DISPLAY_NAME_LENGTH)).ok).toBe(true);
  });

  it('rejects one character over', () => {
    expect(checkDisplayName('a'.repeat(MAX_DISPLAY_NAME_LENGTH + 1))).toMatchObject({
      ok: false,
      message: expect.stringContaining('40'),
    });
  });

  it('counts an emoji as one character', () => {
    const name = '😀'.repeat(MAX_DISPLAY_NAME_LENGTH);
    expect(name.length).toBe(MAX_DISPLAY_NAME_LENGTH * 2);
    expect(checkDisplayName(name).ok).toBe(true);
  });

  it('rejects blank and non-string names', () => {
    expect(checkDisplayName('   ').ok).toBe(false);
    expect(checkDisplayName('').ok).toBe(false);
    expect(checkDisplayName(undefined).ok).toBe(false);
    expect(checkDisplayName(42).ok).toBe(false);
  });
});

describe('truncateDisplayName', () => {
  it('leaves names within the cap alone', () => {
    expect(truncateDisplayName('Ada')).toBe('Ada');
    expect(truncateDisplayName('a'.repeat(40))).toBe('a'.repeat(40));
  });

  it('shortens older, longer names to the cap with an ellipsis', () => {
    const shortened = truncateDisplayName('b'.repeat(200));
    expect([...shortened]).toHaveLength(MAX_DISPLAY_NAME_LENGTH);
    expect(shortened.endsWith('…')).toBe(true);
  });

  it('never splits an emoji', () => {
    const shortened = truncateDisplayName('😀'.repeat(60));
    expect(shortened).toBe(`${'😀'.repeat(39)}…`);
  });
});
