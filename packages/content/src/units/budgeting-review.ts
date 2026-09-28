import { cashRemainder, type Lesson } from '@fin/core';

/** Applied review of the CFPB budgeting, bill-calendar, and savings-plan tools. */
export const budgetingReview: Lesson = {
  id: 'budgeting-saving.review',
  title: 'Put Your Budget to Work',
  intro:
    'Use a single plan to check income, spending, savings, and timing. Avery receives $1,900 monthly after deductions and plans $1,250 in essentials plus $350 in flexible spending. A plan must fit both the monthly total and the dates cash is needed. Revisit it when costs change. Each question supplies the amounts it needs; savings calculations assume no interest, fees, or withdrawals.',
  exercises: [
    {
      id: 'budgeting-saving.review.allocate',
      kind: 'computed_answer',
      prompt:
        'Avery receives $1,900 after deductions and budgets $1,250 for essentials and $350 for flexible spending. What remains for savings?',
      answer: cashRemainder(1900, 1250, 350),
      format: 'usd',
      tolerance: { type: 'absolute', value: 0.01 },
      hint: 'Subtract both spending categories from take-home income.',
      explanation:
        '$1,900 - $1,250 - $350 = $300. Assigning that $300 to savings uses the full monthly income.',
    },
    {
      id: 'budgeting-saving.review.goal',
      kind: 'computed_answer',
      prompt:
        'Avery wants $900 for a course in four months and already has $300 saved. What equal monthly deposit reaches $900 in four deposits, with no interest, fees, or withdrawals?',
      answer: cashRemainder(900, 300) / 4,
      format: 'usd',
      tolerance: { type: 'absolute', value: 0.01 },
      hint: 'Divide the remaining gap, not the full goal, by four.',
      explanation:
        '($900 - $300) / 4 = $150 monthly. This fits within the $300 monthly savings allocation in Avery’s example.',
    },
    {
      id: 'budgeting-saving.review.cash-gap',
      kind: 'computed_answer',
      prompt:
        'Avery has $150 available on Monday and a $400 bill due Tuesday. Pay arrives Friday. How much is missing for Tuesday’s bill if no other money is available?',
      answer: cashRemainder(400, 150),
      format: 'usd',
      tolerance: { type: 'absolute', value: 0.01 },
      hint: 'Count only funds available by Tuesday.',
      explanation:
        '$400 - $150 = a $250 shortfall on Tuesday. Later pay does not fix the earlier deadline automatically; a bill calendar makes this timing gap visible.',
    },
    {
      id: 'budgeting-saving.review.adjust',
      kind: 'multiple_choice',
      prompt:
        'Avery’s essential costs rise by $60. Income and the $300 savings allocation stay unchanged. Which revision keeps the original $1,900 plan balanced?',
      choices: [
        { id: 'cut', label: 'Reduce flexible spending from $350 to $290' },
        { id: 'same', label: 'Leave every other allocation unchanged' },
        { id: 'increase', label: 'Increase flexible spending by $60 too' },
      ],
      correctChoiceId: 'cut',
      hint: 'An extra $60 in one category needs an equal reduction elsewhere if income is fixed.',
      explanation:
        '$1,310 essentials + $290 flexible spending + $300 savings = $1,900. This question holds essentials and savings fixed; other real plans may use different tradeoffs.',
    },
    {
      id: 'budgeting-saving.review.process',
      kind: 'ordering',
      prompt:
        'Arrange this monthly review process: start by recording what happened, compare with the plan, then revise next month.',
      items: [
        { id: 'revise', label: 'Revise the next month’s amounts and payment dates' },
        { id: 'record', label: 'Record actual income and spending' },
        { id: 'compare', label: 'Compare the records with planned amounts and due dates' },
      ],
      correctOrder: ['record', 'compare', 'revise'],
      hint: 'A comparison needs records, and a useful revision follows the comparison.',
      explanation:
        'Record, compare, then revise. A budget is an ongoing planning tool, not a one-time promise that circumstances will never change.',
    },
  ],
};
