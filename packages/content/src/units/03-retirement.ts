import { compoundBalance, type Unit } from '@fin/core';

// Initial retirement foundations; see docs/money-basics-retirement-module.md.
export const retirement: Unit = {
  id: 'retirement',
  title: 'Retirement: Getting Started',
  description: 'Explore saving over time and learn how workplace contributions and vesting work.',
  order: 3,
  prerequisites: ['money-basics'],
  lessons: [
    {
      id: 'retirement.start',
      title: 'Why Start Planning Now?',
      intro:
        'Retirement planning connects future spending needs with resources you build over time. Small, affordable contributions can be a starting point. More time gives a positive assumed return more periods to compound, but investment returns vary. The examples are illustrations, not forecasts or a recommended savings amount. A retirement balance is not the same as guaranteed lifetime income.',
      exercises: [
        {
          id: 'retirement.start.purpose',
          kind: 'multiple_choice',
          prompt: 'What is the purpose of retirement saving?',
          choices: [
            {
              id: 'future',
              label: 'Build resources for future spending when work income may be lower or stop',
            },
            {
              id: 'guarantee',
              label: 'Guarantee that all investments rise every year',
            },
            {
              id: 'bill',
              label: 'Replace planning for next week’s bills',
            },
          ],
          correctChoiceId: 'future',
          hint: 'Think about expenses beyond your working years.',
          explanation:
            'Retirement saving supports future spending. A workable plan also accounts for current needs.',
        },
        {
          id: 'retirement.start.contributions',
          kind: 'computed_answer',
          prompt:
            'You contribute $75 at each month-end for 12 months. Ignoring returns, fees, and taxes, how much have you contributed?',
          answer: 75 * 12,
          format: 'usd',
          tolerance: {
            type: 'absolute',
            value: 0.01,
          },
          hint: 'Count twelve contributions of $75.',
          explanation:
            '$75 × 12 = $900 of contributions. This is not a projected investment return.',
        },
        {
          id: 'retirement.start.growth',
          kind: 'computed_answer',
          prompt:
            'For illustration, a single $1,000 deposit grows at exactly 5% annually, compounded yearly, for two years. There are no other deposits, taxes, fees, or withdrawals. What is its ending value?',
          answer: compoundBalance(1000, 0.05, 2),
          format: 'usd',
          tolerance: {
            type: 'absolute',
            value: 0.01,
          },
          hint: 'Multiply the deposit by 1.05 twice.',
          explanation:
            '$1,000 × 1.05² = $1,102.50. Actual investment returns do not follow a guaranteed constant rate.',
        },
        {
          id: 'retirement.start.time',
          kind: 'ordering',
          prompt:
            'In a model with a constant positive 5% annual rate, rank the ending values of identical one-time $1,000 deposits from smallest to largest. No other activity occurs.',
          items: [
            {
              id: 'long',
              label: '30 years of growth',
            },
            {
              id: 'short',
              label: '10 years of growth',
            },
            {
              id: 'middle',
              label: '20 years of growth',
            },
          ],
          correctOrder: ['short', 'middle', 'long'],
          hint: 'Only time changes; the deposit and positive rate are identical.',
          explanation:
            'At the assumed positive rate, 10 years produces less than 20, and 20 less than 30. This isolates the effect of time.',
        },
        {
          id: 'retirement.start.realistic',
          kind: 'multiple_choice',
          prompt:
            'Your budget leaves $40 monthly after planned expenses and a cash buffer. Which is a realistic first planning step?',
          choices: [
            {
              id: 'borrow',
              label: 'Commit $300 monthly without changing the budget',
            },
            {
              id: 'plan',
              label:
                'Explore an affordable contribution and revisit it as income or expenses change',
            },
            {
              id: 'certain',
              label: 'Assume high returns will cover any budget gap',
            },
          ],
          correctChoiceId: 'plan',
          hint: 'A recurring contribution needs to fit available cash.',
          explanation:
            'A sustainable contribution starts with the budget. The $40 scenario is not a universal savings target.',
        },
      ],
    },
    {
      id: 'retirement.workplace',
      title: 'Workplace Contributions and Vesting',
      intro:
        'A workplace retirement plan may accept employee contributions and provide an employer match. The formula and eligibility depend on the plan. Vesting means ownership: your own contributions are yours, while employer money may follow a vesting schedule. Check the plan documents and ask the administrator about unclear terms. Retirement accounts hold investments; the account name does not guarantee a return.',
      exercises: [
        {
          id: 'retirement.workplace.contribution',
          kind: 'computed_answer',
          prompt:
            'A fictional plan uses monthly gross pay of $3,000. You elect to contribute 4% of that pay. How much is your monthly employee contribution? Ignore payroll-tax effects.',
          answer: 3000 * 0.04,
          format: 'usd',
          tolerance: {
            type: 'absolute',
            value: 0.01,
          },
          hint: 'Multiply gross pay by 0.04.',
          explanation:
            '$3,000 × 0.04 = $120. This is the contribution, not the exact change in take-home pay.',
        },
        {
          id: 'retirement.workplace.match',
          kind: 'computed_answer',
          prompt:
            'A fictional employer matches 50% of your contributions on up to 4% of $3,000 monthly pay. You contribute 4% ($120). How much does the employer contribute that month?',
          answer: 120 * 0.5,
          format: 'usd',
          tolerance: {
            type: 'absolute',
            value: 0.01,
          },
          hint: 'Apply the 50% match to the eligible $120 contribution.',
          explanation:
            '$120 × 0.50 = $60 from the employer. Employee plus employer contributions total $180.',
        },
        {
          id: 'retirement.workplace.cap',
          kind: 'computed_answer',
          prompt:
            'With $3,000 monthly pay, you contribute 6% ($180). The employer matches 50% on only the first 4% of pay contributed. What is the employer’s monthly match?',
          answer: Math.min(180, 3000 * 0.04) * 0.5,
          format: 'usd',
          tolerance: {
            type: 'absolute',
            value: 0.01,
          },
          hint: 'The matching base is capped at $3,000 × 4%, not the full $180.',
          explanation:
            'The eligible base is $120, so the employer adds $60. Contributing above this example’s cap does not increase its match.',
        },
        {
          id: 'retirement.workplace.vested',
          kind: 'computed_answer',
          prompt:
            'A statement shows $2,000 in your contributions and $1,000 in employer contributions, with no gains or losses. Under the stated plan schedule, 40% of employer contributions are vested. What total amount is vested?',
          answer: 2000 + 1000 * 0.4,
          format: 'usd',
          tolerance: {
            type: 'absolute',
            value: 0.01,
          },
          hint: 'Include all your contributions plus 40% of the employer portion.',
          explanation:
            '$2,000 + ($1,000 × 0.40) = $2,400. Ownership does not mean a withdrawal would be free of taxes or restrictions.',
        },
        {
          id: 'retirement.workplace.verify',
          kind: 'multiple_choice',
          prompt: 'Before relying on an advertised employer match, what should you check?',
          choices: [
            {
              id: 'all',
              label: 'Assume every employer uses the same formula',
            },
            {
              id: 'terms',
              label: 'The plan’s eligibility, matching formula, and vesting terms',
            },
            {
              id: 'return',
              label: 'Treat the match percentage as a guaranteed annual investment return',
            },
          ],
          correctChoiceId: 'terms',
          hint: 'Benefits depend on the actual plan, not just its name.',
          explanation:
            'Check the written terms or ask the plan administrator. A contribution match and an investment return describe different things.',
        },
      ],
    },
  ],
};
