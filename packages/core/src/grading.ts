import type { Answer, ComputedAnswerExercise, Exercise } from './types';

export interface GradeResult {
  correct: boolean;
  /** Populated on a wrong answer so the UI can show the right one. */
  expected?: string;
  explanation?: string;
}

/**
 * Grading is shared by the client (instant feedback) and the API (authoritative
 * result that awards XP). Keep it pure so both sides always agree.
 */
export function gradeExercise(exercise: Exercise, answer: Answer): GradeResult {
  if (exercise.kind !== answer.kind) {
    return { correct: false, explanation: exercise.explanation };
  }

  switch (exercise.kind) {
    case 'multiple_choice': {
      const { choiceId } = answer as Extract<Answer, { kind: 'multiple_choice' }>;
      const correct = choiceId === exercise.correctChoiceId;
      return {
        correct,
        expected: correct
          ? undefined
          : exercise.choices.find((c) => c.id === exercise.correctChoiceId)?.label,
        explanation: exercise.explanation,
      };
    }

    case 'ordering': {
      const { order } = answer as Extract<Answer, { kind: 'ordering' }>;
      const correct =
        order.length === exercise.correctOrder.length &&
        order.every((id, i) => id === exercise.correctOrder[i]);
      return {
        correct,
        expected: correct
          ? undefined
          : exercise.correctOrder
              .map((id) => exercise.items.find((item) => item.id === id)?.label ?? id)
              .join(' → '),
        explanation: exercise.explanation,
      };
    }

    case 'computed_answer': {
      const { value } = answer as Extract<Answer, { kind: 'computed_answer' }>;
      const correct = withinTolerance(value, exercise);
      return {
        correct,
        expected: correct ? undefined : formatAnswer(exercise.answer, exercise.format),
        explanation: exercise.explanation,
      };
    }
  }
}

function withinTolerance(value: number, exercise: ComputedAnswerExercise): boolean {
  if (!Number.isFinite(value)) return false;

  const { tolerance, answer } = exercise;
  const allowed =
    tolerance.type === 'absolute' ? tolerance.value : Math.abs(answer) * tolerance.value;

  return Math.abs(value - answer) <= allowed;
}

export function formatAnswer(value: number, format: ComputedAnswerExercise['format']): string {
  switch (format) {
    case 'usd':
      return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
    case 'percent':
      return `${round(value, 2)}%`;
    case 'years':
      return `${round(value, 2)} years`;
    case 'number':
      return String(round(value, 4));
  }
}

function round(value: number, places: number): number {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

/**
 * Learners type things like "$1,234.56" or "7%". Normalize before grading so a
 * correct number is not marked wrong over formatting.
 */
export function parseNumericAnswer(
  input: string,
  format?: ComputedAnswerExercise['format'],
): number | null {
  // Accept decimal notation and correctly grouped US thousands separators.
  // Validate before removing formatting: "1,2" and "1 2" must not become 12.
  const text = input.trim();
  if (format && format !== 'usd' && text.includes('$')) return null;
  if (format && format !== 'percent' && text.includes('%')) return null;
  if (!/^[+-]?\$?(?:\d{1,3}(?:,\d{3})+|\d+|(?=\.\d))(?:\.\d+)?%?$/.test(text)) {
    return null;
  }
  // Currency and percent together have ambiguous units.
  if (text.includes('$') && text.endsWith('%')) return null;
  const cleaned = text.replace(/[$,%]/g, '');

  const value = Number(cleaned);
  return Number.isFinite(value) ? value : null;
}
