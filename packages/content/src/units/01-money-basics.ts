import { compoundBalance, creditUtilization, type Unit } from '@fin/core';
import { compoundingPractice, creditPractice, moneyPractice } from './money-basics-practice';

/**
 * Third unit on the skill tree. Locked until banking and emergency savings is
 * finished, same rule as every unit after the first.
 *
 * Convention: ids are stable slugs (`unit.lesson.exercise`) because progress
 * rows reference them. Renaming an id orphans a learner's progress.
 */
export const moneyBasics: Unit = {
  id: 'money-basics',
  title: 'Interest, Credit, and Inflation',
  description: 'Interest, inflation, and the habits that decide what your money is worth later.',
  order: 2,
  prerequisites: ['banking-emergency'],
  lessons: [
    {
      id: 'money-basics.compounding',
      title: 'Compounding',
      intro:
        'Compound interest adds earnings to the balance used for the next interest calculation. For annual compounding, balance = deposit × (1 + annual rate)^years. The rate and time both matter. These examples use hypothetical constant rates with no fees, taxes, deposits, or withdrawals unless stated; they are not investment forecasts.',
      exercises: [
        {
          kind: 'multiple_choice',
          id: 'money-basics.compounding.definition',
          prompt: 'What makes compound interest different from simple interest?',
          choices: [
            { id: 'a', label: 'It is only paid on the original deposit' },
            { id: 'b', label: 'It is paid on the deposit plus the interest already earned' },
            { id: 'c', label: 'It is paid only when you withdraw the money' },
          ],
          correctChoiceId: 'b',
          hint: 'Ask whether this period’s interest is calculated on a growing balance.',
          explanation:
            'Simple interest always pays on the original principal. Compound interest pays on the growing balance, so the same rate produces more each period.',
        },
        {
          kind: 'computed_answer',
          id: 'money-basics.compounding.ten-years',
          prompt:
            'You deposit $2,000 in an account paying 6% annually, compounded once a year, and never touch it. What is the balance after 10 years?',
          answer: compoundBalance(2000, 0.06, 10),
          format: 'usd',
          tolerance: { type: 'absolute', value: 1 },
          hint: 'Balance = principal x (1 + rate) ^ years',
          explanation:
            '2000 x 1.06^10 = $3,581.70. Only $1,200 of the $1,581.70 gain is interest on the original $2,000; the rest is interest on interest.',
        },
        {
          kind: 'ordering',
          id: 'money-basics.compounding.growth-order',
          prompt:
            'Order these hypothetical $1,000 balances after 20 years, smallest to largest. Assume the stated rate stays constant and compounds annually, with no other activity. These are math scenarios, not promised investment returns.',
          items: [
            { id: 'savings', label: 'Scenario A: constant 0.5% annual growth' },
            { id: 'bond', label: 'Scenario B: constant 4% annual growth' },
            { id: 'index', label: 'Scenario C: constant 8% annual growth' },
          ],
          correctOrder: ['savings', 'bond', 'index'],
          hint: 'A higher annual rate grows the same $1,000 farther over 20 years.',
          explanation:
            'The model gives about $1,105, $2,191, and $4,661 respectively. Actual investment returns vary and can be negative.',
        },
        ...compoundingPractice,
      ],
    },
    {
      id: 'money-basics.credit-utilization',
      title: 'Credit Utilization',
      intro:
        'Utilization is the balance owed divided by the credit limit, multiplied by 100. For several cards, divide total balances by total limits. It is one input to credit scores, not a score itself. Reporting dates and scoring models differ, so no single ratio guarantees a score.',
      exercises: [
        {
          kind: 'computed_answer',
          id: 'money-basics.credit-utilization.single-card',
          prompt:
            'Your card has a $2,500 limit and a $625 statement balance. What is your utilization, as a percentage?',
          answer: creditUtilization(625, 2500),
          format: 'percent',
          tolerance: { type: 'absolute', value: 0.1 },
          hint: 'Utilization = balance / limit x 100',
          explanation:
            '$625 / $2,500 × 100 = 25%. This ratio describes the stated balance and limit; it does not guarantee a particular score.',
        },
        {
          kind: 'multiple_choice',
          id: 'money-basics.credit-utilization.closing-a-card',
          prompt:
            'You carry $500 across two cards with $2,500 in total limits, and you close one card with a $1,000 limit. What happens to your utilization?',
          choices: [
            { id: 'a', label: 'It drops, because you have one less card' },
            { id: 'b', label: 'It is unchanged, because your balance did not change' },
            { id: 'c', label: 'It rises from 20% to about 33%, because your limit shrank' },
          ],
          correctChoiceId: 'c',
          hint: 'Utilization is balance divided by remaining total limit, not the number of cards.',
          explanation:
            'Closing a card removes its limit from the denominator. The same $500 against $1,500 of remaining credit is 33% utilization.',
        },
        ...creditPractice,
      ],
    },
    ...moneyPractice,
  ],
};
