/**
 * The name a learner signs up with is the name other learners see on the
 * leaderboard, so it gets a length cap. Lengths count characters as people see
 * them (code points), so an emoji is one character and is never cut in half.
 */
export const MAX_DISPLAY_NAME_LENGTH = 40;

export type DisplayNameCheck = { ok: true; name: string } | { ok: false; message: string };

export function checkDisplayName(input: unknown): DisplayNameCheck {
  if (typeof input !== 'string') return { ok: false, message: 'Enter a name.' };

  const name = input.trim();
  const length = [...name].length;

  if (length === 0) return { ok: false, message: 'Enter a name.' };
  if (length > MAX_DISPLAY_NAME_LENGTH) {
    return {
      ok: false,
      message: `Keep your name to ${MAX_DISPLAY_NAME_LENGTH} characters or fewer.`,
    };
  }
  return { ok: true, name };
}

/**
 * For display only: names stored before the cap existed can be longer, so the
 * leaderboard shortens them rather than trusting every row.
 */
export function truncateDisplayName(name: string): string {
  const characters = [...name.trim()];
  return characters.length <= MAX_DISPLAY_NAME_LENGTH
    ? characters.join('')
    : `${characters.slice(0, MAX_DISPLAY_NAME_LENGTH - 1).join('')}…`;
}
