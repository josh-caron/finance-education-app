import {
  compoundBalance,
  creditUtilization,
  presentValue,
  type Exercise,
  type Lesson,
} from '@fin/core';

// Original scenarios; editorial sources are mapped in docs/money-basics-retirement-module.md.
export const compoundingPractice: Exercise[] = [
  {
    id: 'money-basics.compounding.first-year',
    kind: 'computed_answer',
    prompt:
      'A $1,000 deposit earns 5% for one year. With no fees or other activity, how much interest is earned?',
    answer: 1000 * 0.05,
    format: 'usd',
    tolerance: {
      type: 'absolute',
      value: 0.01,
    },
    hint: 'Multiply the starting deposit by 0.05.',
    explanation: '$1,000 × 0.05 = $50 of interest; the ending balance is $1,050.',
  },
  {
    id: 'money-basics.compounding.second-year',
    kind: 'computed_answer',
    prompt:
      'A $1,000 deposit grows to $1,050 after one year at 5%. Interest stays in the account. What is the balance after a second year at 5%, with no other activity?',
    answer: compoundBalance(1000, 0.05, 2),
    format: 'usd',
    tolerance: {
      type: 'absolute',
      value: 0.01,
    },
    hint: 'Apply 5% to $1,050, then add the interest.',
    explanation:
      '$1,050 × 1.05 = $1,102.50. The second year earns $52.50, including $2.50 on prior interest.',
  },
];

export const creditPractice: Exercise[] = [
  {
    id: 'money-basics.credit-utilization.combined',
    kind: 'computed_answer',
    prompt:
      'Two cards have balances of $300 and $200 and limits of $1,000 and $4,000. What is their combined utilization percentage?',
    answer: creditUtilization(300 + 200, 1000 + 4000),
    format: 'percent',
    tolerance: {
      type: 'absolute',
      value: 0.01,
    },
    hint: 'Add the balances and limits separately before dividing.',
    explanation:
      '$500 / $5,000 × 100 = 10%. Averaging the two individual percentages would give the wrong combined ratio.',
  },
  {
    id: 'money-basics.credit-utilization.payment',
    kind: 'computed_answer',
    prompt:
      'A card has an $800 balance and a $2,000 limit. A $300 payment posts, with no new charges or fees. What is the new utilization percentage?',
    answer: creditUtilization(800 - 300, 2000),
    format: 'percent',
    tolerance: {
      type: 'absolute',
      value: 0.01,
    },
    hint: 'Subtract the payment, then divide by the unchanged limit.',
    explanation:
      '($800 - $300) / $2,000 × 100 = 25%. This calculates the ratio, not a guaranteed credit-score change.',
  },
  {
    id: 'money-basics.credit-utilization.score',
    kind: 'multiple_choice',
    prompt: 'What can a utilization calculation tell you?',
    choices: [
      {
        id: 'exact',
        label: 'The exact number of points your score will change',
      },
      {
        id: 'ratio',
        label: 'How much of the stated credit limit is being used',
      },
      {
        id: 'income',
        label: 'Your monthly income',
      },
    ],
    correctChoiceId: 'ratio',
    hint: 'Separate a balance ratio from a credit-scoring prediction.',
    explanation:
      'Utilization measures credit use. Scoring models consider other information too, so this ratio alone does not predict an exact score.',
  },
];

export const moneyPractice: Lesson[] = [
  {
    id: 'money-basics.borrowing',
    title: 'Understand Borrowing Costs',
    intro:
      'Borrowing has a repayment cost. Read the rate, fees, payment schedule, and total owed together. Paying only a minimum may leave a balance. When a card provides a purchase grace period and you qualify for it, paying the full statement balance by the due date can avoid purchase interest. The calculations here use stated, simplified terms; real cards may calculate interest daily.',
    exercises: [
      {
        id: 'money-basics.borrowing.interest',
        kind: 'computed_answer',
        prompt:
          'A fictional loan charges simple interest at 12% per year on $500 for exactly one year. No payments occur during the year and there are no fees. How much interest is due?',
        answer: 500 * 0.12,
        format: 'usd',
        tolerance: {
          type: 'absolute',
          value: 0.01,
        },
        hint: 'For this simple-interest example, multiply $500 by 0.12.',
        explanation:
          '$500 × 0.12 × 1 = $60 interest. This is not a daily-compounding credit-card calculation.',
      },
      {
        id: 'money-basics.borrowing.total',
        kind: 'computed_answer',
        prompt:
          'A fictional one-year loan advances $500. At year-end you repay the $500 principal, $60 interest, and a $15 fee. What is the total repayment?',
        answer: 500 + 60 + 15,
        format: 'usd',
        tolerance: {
          type: 'absolute',
          value: 0.01,
        },
        hint: 'Include principal, interest, and the stated fee.',
        explanation: '$500 + $60 + $15 = $575. Interest alone is not the total cash repayment.',
      },
      {
        id: 'money-basics.borrowing.grace',
        kind: 'multiple_choice',
        prompt:
          'Your card provides a purchase grace period, you qualify for it, and your statement contains only purchases. Which payment avoids interest on those purchases?',
        choices: [
          {
            id: 'minimum',
            label: 'Only the minimum payment by the due date',
          },
          {
            id: 'full',
            label: 'The full statement balance by the due date',
          },
          {
            id: 'late',
            label: 'The full statement balance after the due date',
          },
        ],
        correctChoiceId: 'full',
        hint: 'The question assumes an available purchase grace period.',
        explanation:
          'Paying the full statement balance on time meets the stated grace-period conditions. A minimum payment can leave an interest-bearing balance.',
      },
      {
        id: 'money-basics.borrowing.remaining',
        kind: 'computed_answer',
        prompt:
          'A statement balance is $600. You pay $25. Before any new interest, fees, or purchases, how much of that balance remains?',
        answer: 600 - 25,
        format: 'usd',
        tolerance: {
          type: 'absolute',
          value: 0.01,
        },
        hint: 'Subtract the payment from the balance.',
        explanation:
          '$600 - $25 = $575. A payment reduces debt; it does not erase the unpaid amount.',
      },
      {
        id: 'money-basics.borrowing.compare',
        kind: 'ordering',
        prompt:
          'Three loans each advance $500 for one year with all payment due at year-end. Rank total repayment from lowest to highest; there are no other charges.',
        items: [
          {
            id: 'b',
            label: 'Offer B: $35 interest plus a $30 fee',
          },
          {
            id: 'c',
            label: 'Offer C: $55 interest and no fee',
          },
          {
            id: 'a',
            label: 'Offer A: $40 interest plus a $10 fee',
          },
        ],
        correctOrder: ['a', 'c', 'b'],
        hint: 'Add each offer’s interest and fee to the same $500 principal.',
        explanation:
          'A totals $550, C totals $555, and B totals $565. The smallest interest charge does not necessarily mean the smallest total cost.',
      },
    ],
  },
  {
    id: 'money-basics.inflation',
    title: 'Inflation and Purchasing Power',
    intro:
      'Inflation describes rising prices across an economy; your own expenses may change differently. Purchasing power is what money can buy. A larger dollar balance may still buy less if prices rise faster. For these examples, use only the stated price changes, with no taxes or fees. Today’s-dollar value equals the future amount divided by the cumulative price multiplier.',
    exercises: [
      {
        id: 'money-basics.inflation.meaning',
        kind: 'multiple_choice',
        prompt:
          'Your cash stays at $100 while the same basket of goods rises from $100 to $105. What changed?',
        choices: [
          {
            id: 'more',
            label: 'Your cash buys more of the basket',
          },
          {
            id: 'less',
            label: 'Your cash buys less of the basket',
          },
          {
            id: 'same',
            label: 'The higher price has no effect',
          },
        ],
        correctChoiceId: 'less',
        hint: 'Compare the unchanged cash with the new price.',
        explanation:
          'The $100 balance is unchanged, but it no longer covers the $105 basket. Dollar amounts and purchasing power are different.',
      },
      {
        id: 'money-basics.inflation.basket',
        kind: 'computed_answer',
        prompt:
          'A basket costs $200 today. Its price rises by exactly 4% over one year. What does the identical basket cost then?',
        answer: 200 * 1.04,
        format: 'usd',
        tolerance: {
          type: 'absolute',
          value: 0.01,
        },
        hint: 'Multiply $200 by 1.04.',
        explanation: '$200 × 1.04 = $208. The $8 increase is the price change, not the new total.',
      },
      {
        id: 'money-basics.inflation.today-dollars',
        kind: 'computed_answer',
        prompt:
          'Next year you have $1,050, while prices are exactly 5% higher than today. What is that balance worth in today’s dollars?',
        answer: presentValue(1050, 0.05, 1),
        format: 'usd',
        tolerance: {
          type: 'absolute',
          value: 0.01,
        },
        hint: 'Divide $1,050 by 1.05.',
        explanation:
          '$1,050 / 1.05 = $1,000 in today’s purchasing power. Here the balance only keeps pace with prices.',
      },
      {
        id: 'money-basics.inflation.compare',
        kind: 'multiple_choice',
        prompt:
          'Over one year a balance grows 2%, while the prices relevant to the goal rise 5%. What happens to its purchasing power?',
        choices: [
          {
            id: 'gain',
            label: 'It rises because the dollar balance rose',
          },
          {
            id: 'equal',
            label: 'It is unchanged',
          },
          {
            id: 'loss',
            label: 'It falls because prices grew faster',
          },
        ],
        correctChoiceId: 'loss',
        hint: 'Compare the growth factors 1.02 and 1.05.',
        explanation:
          '1.02 / 1.05 is less than 1. The balance grows in dollars but loses purchasing power.',
      },
      {
        id: 'money-basics.inflation.two-years',
        kind: 'computed_answer',
        prompt:
          'A $100 basket rises in price by exactly 10% each year for two years. What does it cost after the second increase?',
        answer: compoundBalance(100, 0.1, 2),
        format: 'usd',
        tolerance: {
          type: 'absolute',
          value: 0.01,
        },
        hint: 'Apply the second increase to $110, not $100.',
        explanation: '$100 × 1.10 × 1.10 = $121. Successive percentage changes multiply.',
      },
    ],
  },
  {
    id: 'money-basics.review',
    title: 'Put Interest and Credit to Work',
    intro:
      'Apply the unit’s calculations to fictional decisions. Distinguish interest from ending balance, combine card limits correctly, and account for rising prices. All rates are assumptions for the exercises, not forecasts. Ignore taxes, fees, and transactions unless a question includes them.',
    exercises: [
      {
        id: 'money-basics.review.growth',
        kind: 'computed_answer',
        prompt:
          'Maya deposits $1,500 at a constant 4% annual rate, compounded yearly. With no other activity, what is the balance after two years?',
        answer: compoundBalance(1500, 0.04, 2),
        format: 'usd',
        tolerance: {
          type: 'absolute',
          value: 0.01,
        },
        hint: 'Multiply $1,500 by 1.04 twice.',
        explanation: '$1,500 × 1.04² = $1,622.40. The $122.40 gain is included in that balance.',
      },
      {
        id: 'money-basics.review.utilization',
        kind: 'computed_answer',
        prompt:
          'Maya has $450 owed against a $1,500 limit. A $150 payment posts with no other activity. What is the resulting utilization percentage?',
        answer: creditUtilization(450 - 150, 1500),
        format: 'percent',
        tolerance: {
          type: 'absolute',
          value: 0.01,
        },
        hint: 'Find the remaining balance before calculating the percentage.',
        explanation: '($450 - $150) / $1,500 × 100 = 20%. The credit limit stays unchanged.',
      },
      {
        id: 'money-basics.review.price-gap',
        kind: 'computed_answer',
        prompt:
          'Maya has $300 set aside for a course currently priced at $300. The course price rises 6% before enrollment and savings do not grow. How much more is needed?',
        answer: 300 * 0.06,
        format: 'usd',
        tolerance: {
          type: 'absolute',
          value: 0.01,
        },
        hint: 'Calculate the price increase, not the full course price.',
        explanation: '$300 × 0.06 = $18 more is needed; the new price is $318.',
      },
      {
        id: 'money-basics.review.prediction',
        kind: 'multiple_choice',
        prompt:
          'An illustration assumes 6% investment growth every year. Which interpretation is correct?',
        choices: [
          {
            id: 'promise',
            label: 'Every investment will earn at least 6%',
          },
          {
            id: 'assumption',
            label: 'The result depends on an assumption; actual returns can differ or be negative',
          },
          {
            id: 'insurance',
            label: 'The illustration provides deposit insurance',
          },
        ],
        correctChoiceId: 'assumption',
        hint: 'A calculation is only as certain as its inputs.',
        explanation: 'The rate is an input to a model, not a promise. Investment values can fall.',
      },
      {
        id: 'money-basics.review.costs',
        kind: 'ordering',
        prompt:
          'Rank these stated one-year borrowing costs from lowest to highest. All three offers lend the same amount for the same term.',
        items: [
          {
            id: 'c',
            label: 'Offer C: $40 interest + $20 fee',
          },
          {
            id: 'a',
            label: 'Offer A: $20 interest + $5 fee',
          },
          {
            id: 'b',
            label: 'Offer B: $30 interest + $10 fee',
          },
        ],
        correctOrder: ['a', 'b', 'c'],
        hint: 'Add interest and fees for each offer.',
        explanation:
          'The costs are $25, $40, and $60. These totals exclude the identical principal repayment.',
      },
    ],
  },
];
