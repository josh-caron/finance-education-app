import type { Lesson } from '@fin/core';

// U.S. federal concepts checked against IRS and SEC sources; see docs/research-sources.md.
export const retirementAccounts: Lesson[] = [
  {
    id: 'retirement.401k',
    title: '401(k): Traditional and Roth',
    intro:
      'A 401(k) is a workplace retirement plan. Eligible employees contribute through payroll; some plans offer both traditional pre-tax and designated Roth contributions. Pre-tax contributions generally reduce current federal taxable income, while Roth contributions do not. Qualified Roth distributions are federally tax-free. Plan terms, investment choices, fees, and withdrawal rules still matter. Examples ignore state taxes and payroll-tax effects.',
    exercises: [
      {
        id: 'retirement.401k.access',
        kind: 'multiple_choice',
        prompt:
          'An employer offers an eligible employee a 401(k). How does the employee normally make elective contributions?',
        choices: [
          {
            id: 'payroll',
            label: 'Through payroll under the employer’s plan',
          },
          {
            id: 'ira',
            label: 'By treating any personal IRA as the employer’s 401(k)',
          },
          {
            id: 'automatic',
            label: 'By assuming enrollment guarantees investment gains',
          },
        ],
        correctChoiceId: 'payroll',
        hint: 'Identify the workplace plan’s contribution channel.',
        explanation:
          'A 401(k) uses payroll elections under plan terms. It is distinct from a personal IRA.',
      },
      {
        id: 'retirement.401k.tax',
        kind: 'multiple_choice',
        prompt:
          'Which statement compares traditional pre-tax and Roth 401(k) employee contributions?',
        choices: [
          {
            id: 'same',
            label: 'Both always reduce current federal taxable income',
          },
          {
            id: 'roth',
            label: 'Only Roth contributions reduce current federal taxable income',
          },
          {
            id: 'traditional',
            label: 'Pre-tax contributions generally reduce it; Roth contributions do not',
          },
        ],
        correctChoiceId: 'traditional',
        hint: 'Distinguish tax deferral today from Roth treatment.',
        explanation:
          'The difference concerns when federal income tax applies, not a promise of higher investment returns.',
      },
      {
        id: 'retirement.401k.pay',
        kind: 'computed_answer',
        prompt:
          'Sam earns $4,000 per month and elects a 5% 401(k) contribution. How much goes from pay into the plan each month? Ignore taxes and all other deductions.',
        answer: 4000 * 0.05,
        format: 'usd',
        tolerance: {
          type: 'absolute',
          value: 0.01,
        },
        hint: 'Multiply $4,000 by 0.05.',
        explanation:
          '$4,000 × 5% = $200. This is the contribution amount, not a calculation of take-home pay.',
      },
      {
        id: 'retirement.401k.tax-example',
        kind: 'computed_answer',
        prompt:
          'In a simplified example, an eligible $200 pre-tax contribution reduces income otherwise taxed at exactly 20%. What is the current federal income-tax reduction? Ignore all other tax effects.',
        answer: 200 * 0.2,
        format: 'usd',
        tolerance: {
          type: 'absolute',
          value: 0.01,
        },
        hint: 'Multiply the deductible-from-income amount by the assumed tax rate.',
        explanation:
          '$200 × 20% = $40. This is an illustration, not a refund estimate or a claim that future withdrawals are untaxed.',
      },
      {
        id: 'retirement.401k.shared',
        kind: 'multiple_choice',
        prompt:
          'A plan offers traditional and Roth 401(k) employee deferrals. What should you check before splitting contributions?',
        choices: [
          {
            id: 'double',
            label: 'Assume each option gives a separate full employee deferral limit',
          },
          {
            id: 'combined',
            label: 'Their combined employee deferrals are subject to the applicable shared limit',
          },
          {
            id: 'unlimited',
            label: 'Assume Roth deferrals have no limit',
          },
        ],
        correctChoiceId: 'combined',
        hint: 'Two tax treatments do not double the employee deferral allowance.',
        explanation:
          'Check the current-year IRS limit and plan rules. Employer contributions involve additional rules, not a second employee deferral allowance.',
      },
    ],
  },
  {
    id: 'retirement.traditional-ira',
    title: 'Traditional IRA Basics',
    intro:
      'An individual retirement arrangement (IRA) is a personal retirement account. A traditional IRA contribution may be deductible; compensation, income, filing status, and workplace-plan coverage affect the rules. A contribution and a deduction are different. Growth is generally tax-deferred, and withdrawals can be taxable; nondeductible contributions require basis records. These examples use U.S. federal rules and explicitly assumed deductions, not annual legal limits.',
    exercises: [
      {
        id: 'retirement.traditional-ira.account',
        kind: 'multiple_choice',
        prompt:
          'Lee has eligible compensation but no retirement plan at work. Which account could Lee explore with a financial institution?',
        choices: [
          {
            id: 'personal',
            label: 'A personal IRA, subject to contribution eligibility and limits',
          },
          {
            id: 'employer',
            label: 'Only a 401(k) that Lee’s nonexistent employer plan already provides',
          },
          {
            id: 'none',
            label: 'No retirement account is possible without an employer plan',
          },
        ],
        correctChoiceId: 'personal',
        hint: 'An IRA is not limited to people offered a workplace plan.',
        explanation:
          'A personal IRA can be an option. Eligibility to contribute still needs to be checked.',
      },
      {
        id: 'retirement.traditional-ira.deduct',
        kind: 'multiple_choice',
        prompt:
          'A person contributes to a traditional IRA. Is the full contribution automatically deductible?',
        choices: [
          {
            id: 'yes',
            label: 'Yes, every traditional IRA contribution is fully deductible',
          },
          {
            id: 'check',
            label:
              'No; income, filing status, and workplace-plan coverage can affect the deduction',
          },
          {
            id: 'never',
            label: 'No traditional IRA contribution can ever be deductible',
          },
        ],
        correctChoiceId: 'check',
        hint: 'Separate placing money in the account from claiming a deduction.',
        explanation:
          'Contribution eligibility and deductibility are separate checks. The amount deposited is not automatically the tax deduction.',
      },
      {
        id: 'retirement.traditional-ira.monthly',
        kind: 'computed_answer',
        prompt:
          'Lee chooses a personal IRA savings target of $2,400 for the year, not a legal contribution limit. Eligibility and room to contribute are confirmed. What equal monthly amount reaches the target in 12 deposits, ignoring returns and fees?',
        answer: 2400 / 12,
        format: 'usd',
        tolerance: {
          type: 'absolute',
          value: 0.01,
        },
        hint: 'Divide the personal target by twelve deposits.',
        explanation:
          '$2,400 / 12 = $200 monthly. A budgeting target does not establish the statutory limit.',
      },
      {
        id: 'retirement.traditional-ira.deduction',
        kind: 'computed_answer',
        prompt:
          'Assume a $1,000 traditional IRA contribution is fully deductible and reduces income otherwise taxed at exactly 22%. Ignoring all other tax effects, how much current federal income tax is reduced?',
        answer: 1000 * 0.22,
        format: 'usd',
        tolerance: {
          type: 'absolute',
          value: 0.01,
        },
        hint: 'A deduction reduces taxable income, not tax dollar for dollar.',
        explanation: '$1,000 × 22% = $220. A $1,000 deduction is not a $1,000 tax credit.',
      },
      {
        id: 'retirement.traditional-ira.records',
        kind: 'multiple_choice',
        prompt:
          'You make a nondeductible traditional IRA contribution. What is a useful next step?',
        choices: [
          {
            id: 'forget',
            label: 'Discard contribution records because every withdrawal must be fully taxable',
          },
          {
            id: 'records',
            label: 'Track the nondeductible basis and follow applicable Form 8606 reporting',
          },
          {
            id: 'roth',
            label: 'Assume the account automatically becomes a Roth IRA',
          },
        ],
        correctChoiceId: 'records',
        hint: 'Money contributed without a deduction needs to be distinguished in tax records.',
        explanation:
          'Basis records help determine the taxable portion of later distributions. A nondeductible contribution does not convert the account into a Roth IRA.',
      },
    ],
  },
];
