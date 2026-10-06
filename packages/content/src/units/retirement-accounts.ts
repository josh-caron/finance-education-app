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
  {
    id: 'retirement.roth-ira',
    title: 'Roth IRA Basics',
    intro:
      'Roth IRA contributions are not deductible. Direct contribution eligibility depends on taxable compensation, income, and filing status. Qualified withdrawals, including earnings, are federally tax-free. For the retirement examples here, qualification requires the Roth IRA five-tax-year period and age 59½; other qualifying circumstances exist. Regular contributions, conversions, and earnings have different withdrawal rules. Do not assume every early withdrawal is tax-free.',
    exercises: [
      {
        id: 'retirement.roth-ira.contribution',
        kind: 'multiple_choice',
        prompt: 'Which describes the federal tax treatment of a regular Roth IRA contribution?',
        choices: [
          {
            id: 'deduct',
            label: 'It always creates a current income-tax deduction',
          },
          {
            id: 'after',
            label: 'It is made without a current income-tax deduction',
          },
          {
            id: 'employer',
            label: 'It must be an employer matching contribution',
          },
        ],
        correctChoiceId: 'after',
        hint: 'Roth treatment does not start with a deduction for the contribution.',
        explanation:
          'Regular Roth IRA contributions are not deductible. Qualified distribution treatment is a separate benefit.',
      },
      {
        id: 'retirement.roth-ira.qualified',
        kind: 'multiple_choice',
        prompt:
          'Alex is 62 and made the first Roth IRA contribution for tax year 2020. In 2026, Alex withdraws funds including earnings. Assume all other requirements are met. Does this satisfy the age and five-tax-year tests for a qualified distribution?',
        choices: [
          {
            id: 'yes',
            label: 'Yes; both the stated age and five-tax-year requirements are met',
          },
          {
            id: 'age',
            label: 'No; age 70 is always required',
          },
          {
            id: 'earnings',
            label: 'No; Roth IRA earnings are always federally taxable',
          },
        ],
        correctChoiceId: 'yes',
        hint: 'Check both conditions rather than age alone.',
        explanation:
          'Age 62 exceeds 59½, and the five-tax-year period starting in 2020 has passed by 2026. Under the stated assumptions, the distribution is qualified.',
      },
      {
        id: 'retirement.roth-ira.early',
        kind: 'multiple_choice',
        prompt:
          'A 30-year-old with a newly opened Roth IRA wants to withdraw everything, including earnings. What should they do first?',
        choices: [
          {
            id: 'all',
            label: 'Assume every dollar is automatically free of tax and additional tax',
          },
          {
            id: 'check',
            label: 'Check withdrawal ordering, qualification rules, and any applicable exceptions',
          },
          {
            id: 'same',
            label: 'Use Roth 401(k) rules as if they were identical',
          },
        ],
        correctChoiceId: 'check',
        hint: 'Contribution dollars and investment earnings do not have identical withdrawal rules.',
        explanation:
          'Check the rules for the actual account and distribution. The word Roth alone does not settle the treatment of an early withdrawal.',
      },
      {
        id: 'retirement.roth-ira.remaining',
        kind: 'computed_answer',
        prompt:
          'Taylor sets a personal IRA contribution budget of $3,000, with eligibility and legal contribution room already confirmed. After depositing $1,200, how much of that personal budget remains?',
        answer: 3000 - 1200,
        format: 'usd',
        tolerance: {
          type: 'absolute',
          value: 0.01,
        },
        hint: 'Subtract deposits already made from the personal budget.',
        explanation:
          '$3,000 - $1,200 = $1,800. This is a personal target, not the IRS annual contribution limit.',
      },
      {
        id: 'retirement.roth-ira.combined',
        kind: 'multiple_choice',
        prompt:
          'You contribute to both a traditional IRA and a Roth IRA in the same tax year. Which statement is correct?',
        choices: [
          {
            id: 'separate',
            label: 'Each account gives you a separate full annual IRA contribution allowance',
          },
          {
            id: 'shared',
            label:
              'Regular contributions share an applicable combined IRA limit; other eligibility rules still apply',
          },
          {
            id: 'none',
            label: 'Opening two accounts removes all income requirements',
          },
        ],
        correctChoiceId: 'shared',
        hint: 'The number of IRA accounts does not multiply the annual allowance.',
        explanation:
          'Traditional and Roth IRA regular contributions count together toward the applicable IRA limit. Direct Roth contribution eligibility must also be checked.',
      },
    ],
  },
  {
    id: 'retirement.hsa',
    title: 'HSA: Health Costs Now and Later',
    intro:
      'A health savings account (HSA) is a medical savings account, not an IRA. Contributions require HSA eligibility, including qualifying coverage, no disqualifying other coverage, no Medicare enrollment, and not being claimable as another taxpayer’s dependent. Federal tax advantages can apply to eligible contributions, earnings, and qualified medical withdrawals. Unused funds carry forward. Verify current eligibility rules; a large deductible alone is not proof. State tax treatment can differ.',
    exercises: [
      {
        id: 'retirement.hsa.eligible',
        kind: 'multiple_choice',
        prompt:
          'Pat sees a health plan with a large deductible. Is that alone enough to confirm eligibility to contribute to an HSA?',
        choices: [
          {
            id: 'yes',
            label: 'Yes; every large-deductible plan automatically qualifies',
          },
          {
            id: 'check',
            label: 'No; verify HSA-eligible coverage and the other eligibility requirements',
          },
          {
            id: 'age',
            label: 'Yes; being over 18 is the only other requirement',
          },
        ],
        correctChoiceId: 'check',
        hint: 'The deductible amount is only one part of eligibility.',
        explanation:
          'Confirm coverage and personal eligibility rather than relying on the plan’s price label.',
      },
      {
        id: 'retirement.hsa.receipt',
        kind: 'multiple_choice',
        prompt:
          'A qualified medical expense was incurred after the HSA was established and has not been reimbursed or deducted elsewhere. What supports a tax-free HSA reimbursement?',
        choices: [
          {
            id: 'records',
            label:
              'Keep documentation showing the expense qualifies and was not reimbursed elsewhere',
          },
          {
            id: 'twice',
            label: 'Have insurance reimburse it too, then keep both payments',
          },
          {
            id: 'any',
            label: 'Treat any personal purchase as medical spending',
          },
        ],
        correctChoiceId: 'records',
        hint: 'The same expense cannot receive duplicate tax-favored reimbursement.',
        explanation:
          'Keep receipts and eligibility records. Medical use must meet the applicable requirements.',
      },
      {
        id: 'retirement.hsa.balance',
        kind: 'computed_answer',
        prompt:
          'An HSA holds $1,500. Its owner pays a $350 qualified medical bill from it. With no other activity, what remains?',
        answer: 1500 - 350,
        format: 'usd',
        tolerance: {
          type: 'absolute',
          value: 0.01,
        },
        hint: 'Subtract the medical payment from the account balance.',
        explanation: '$1,500 - $350 = $1,150 remains for later use.',
      },
      {
        id: 'retirement.hsa.carry',
        kind: 'multiple_choice',
        prompt: 'What happens to unused HSA funds at year-end?',
        choices: [
          {
            id: 'lost',
            label: 'They are automatically forfeited every year',
          },
          {
            id: 'remain',
            label: 'They stay in the account for future use',
          },
          {
            id: 'convert',
            label: 'They automatically convert into a Roth IRA',
          },
        ],
        correctChoiceId: 'remain',
        hint: 'An HSA is not a use-it-or-lose-it spending allowance.',
        explanation:
          'Unused HSA funds carry forward; the account also stays with its owner after a job change.',
      },
      {
        id: 'retirement.hsa.after65',
        kind: 'multiple_choice',
        prompt:
          'At age 67, an HSA owner withdraws money for a vacation, not qualified medical expenses. Under federal rules, which treatment generally applies?',
        choices: [
          {
            id: 'free',
            label: 'No income tax because the owner is over 65',
          },
          {
            id: 'income',
            label:
              'Ordinary income tax applies, but the additional 20% nonmedical-distribution tax does not',
          },
          {
            id: 'extra',
            label: 'Only the additional 20% tax applies, with no income tax',
          },
        ],
        correctChoiceId: 'income',
        hint: 'Removing an additional tax is not the same as removing ordinary income tax.',
        explanation:
          'After age 65, nonmedical distributions remain taxable income but avoid the additional 20% tax. Qualified medical withdrawals are treated differently.',
      },
    ],
  },
];
