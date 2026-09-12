import type { Unit } from '@fin/core';

/** Backlog 4. Stable IDs keep authored content linked to learner progress. */
export const budgetingSaving: Unit = {
  id: 'budgeting-saving',
  title: 'Money Basics: Budgeting and Saving',
  description: 'Build a monthly spending plan and turn a savings goal into manageable steps.',
  order: 0,
  prerequisites: [],
  lessons: [
    {
      id: 'budgeting-saving.income-expenses',
      title: 'Income and Expenses',
      intro:
        'Income is money you receive; expenses are money you spend. Take-home pay is what remains after payroll deductions. Use income and expenses from the same period when planning. For example, $1,500 of monthly take-home income minus $1,200 of monthly expenses leaves $300 to assign to savings or other spending. A positive monthly balance does not guarantee cash is available before each bill is due.',
      exercises: [
        {
          id: 'budgeting-saving.income-expenses.take-home',
          kind: 'multiple_choice',
          prompt:
            'A monthly payslip shows $2,400 before deductions and $2,000 deposited after deductions. Which amount is take-home pay?',
          choices: [
            { id: 'gross', label: '$2,400' },
            { id: 'net', label: '$2,000' },
            { id: 'deductions', label: '$400' },
          ],
          correctChoiceId: 'net',
          explanation:
            'The $2,000 deposit is available after payroll deductions. The $2,400 is gross pay; $400 was deducted.',
        },
        {
          id: 'budgeting-saving.income-expenses.remaining',
          kind: 'computed_answer',
          prompt:
            'This month you receive $1,800 in take-home pay and spend $1,350. How many dollars remain before allocating savings?',
          answer: 450,
          format: 'usd',
          tolerance: { type: 'absolute', value: 0.01 },
          hint: "Subtract this month's spending from this month's take-home income.",
          explanation:
            '$1,800 - $1,350 = $450. This is money still available to allocate, not automatically extra spending money.',
        },
        {
          id: 'budgeting-saving.income-expenses.total',
          kind: 'computed_answer',
          prompt:
            'Your only expenses this month are rent $800, groceries $240, transport $90, and phone service $40. What is your total spending?',
          answer: 1170,
          format: 'usd',
          tolerance: { type: 'absolute', value: 0.01 },
          hint: 'Add the four expenses.',
          explanation:
            '$800 + $240 + $90 + $40 = $1,170. Recording smaller bills makes the total more accurate.',
        },
        {
          id: 'budgeting-saving.income-expenses.shortfall',
          kind: 'multiple_choice',
          prompt:
            'Monthly take-home income is $1,600 and planned spending is $1,750. What does this plan show?',
          choices: [
            { id: 'surplus', label: '$150 left over' },
            { id: 'balanced', label: 'Income exactly covers spending' },
            { id: 'gap', label: 'Spending exceeds income by $150' },
          ],
          correctChoiceId: 'gap',
          explanation:
            '$1,600 - $1,750 = -$150. The plan needs an adjustment or another identified source of funds.',
        },
        {
          id: 'budgeting-saving.income-expenses.compare',
          kind: 'ordering',
          prompt:
            'Order these monthly plans by money remaining after expenses, from least to most.',
          items: [
            { id: 'high', label: '$2,000 income; $1,600 expenses' },
            { id: 'low', label: '$1,200 income; $1,300 expenses' },
            { id: 'middle', label: '$1,500 income; $1,350 expenses' },
          ],
          correctOrder: ['low', 'middle', 'high'],
          explanation:
            'The balances are -$100, $150, and $400. Compare the difference, not income alone.',
        },
      ],
    },
    {
      id: 'budgeting-saving.needs-wants',
      title: 'Needs and Wants',
      intro:
        'Needs support basic living and responsibilities, such as housing, food, and required transport. Wants add enjoyment or convenience. Context matters: internet access required for work may be a need, while an optional upgrade may be a want. Wants are not bad; identifying flexible spending helps you make choices when money is limited.',
      exercises: [
        {
          id: 'budgeting-saving.needs-wants.transport',
          kind: 'multiple_choice',
          prompt:
            'Sam needs the bus to reach work and has no other reliable transport. Which expense is a need in this situation?',
          choices: [
            { id: 'concert', label: 'An optional concert ticket' },
            { id: 'bus', label: 'The bus fare to work' },
            { id: 'game', label: 'A new video game' },
          ],
          correctChoiceId: 'bus',
          explanation:
            'The fare enables Sam to get to work. Classification depends on the situation, not simply the category of purchase.',
        },
        {
          id: 'budgeting-saving.needs-wants.upgrade',
          kind: 'multiple_choice',
          prompt:
            'Your current phone works and meets your work needs. You want a newer model only for its appearance. How should you classify the optional upgrade?',
          choices: [
            { id: 'want', label: 'A want in this situation' },
            { id: 'need', label: 'A need because every phone purchase is essential' },
            { id: 'income', label: 'Income' },
          ],
          correctChoiceId: 'want',
          explanation:
            'Basic phone access may be necessary, but this upgrade adds a preference rather than meeting an unmet requirement.',
        },
        {
          id: 'budgeting-saving.needs-wants.flexible',
          kind: 'computed_answer',
          prompt:
            'You choose to pause an optional $15 streaming subscription and skip two $12 takeout orders this month, using groceries already budgeted for instead. How much spending do you avoid?',
          answer: 39,
          format: 'usd',
          tolerance: { type: 'absolute', value: 0.01 },
          hint: 'Add the subscription cost to two takeout orders.',
          explanation:
            '$15 + 2 x $12 = $39. The scenario assumes no extra grocery expense from this change.',
        },
        {
          id: 'budgeting-saving.needs-wants.context',
          kind: 'multiple_choice',
          prompt:
            'Lee needs home internet for required remote classes. What is the most useful way to evaluate that bill?',
          choices: [
            { id: 'always-want', label: 'Internet is always a want' },
            { id: 'unlimited', label: 'Every internet upgrade is essential' },
            {
              id: 'context',
              label: 'Required service can be a need; optional upgrades can be wants',
            },
          ],
          correctChoiceId: 'context',
          explanation:
            'Evaluate what the service enables and what level is required. The same expense can serve different purposes for different people.',
        },
        {
          id: 'budgeting-saving.needs-wants.reductions',
          kind: 'ordering',
          prompt:
            'Order these optional spending changes by dollars avoided this month, smallest to largest. Assume no replacement costs.',
          items: [
            { id: 'takeout', label: 'Skip three $14 takeout orders' },
            { id: 'subscription', label: 'Pause one $10 subscription' },
            { id: 'tickets', label: 'Skip two $30 movie outings' },
          ],
          correctOrder: ['subscription', 'takeout', 'tickets'],
          explanation:
            'The changes avoid $10, $42, and $60 respectively. This compares amounts, not which choice everyone should make.',
        },
      ],
    },
    {
      id: 'budgeting-saving.build-budget',
      title: 'Build a Budget',
      intro:
        'A budget assigns expected income to spending and savings for a period. List take-home income, essential expenses, flexible spending, and a savings allocation. Compare the total with income and adjust if it exceeds what is available. For example, $2,000 income can cover $1,400 essentials, $350 flexible spending, and $250 savings. Review actual spending and bill due dates as the month unfolds; a plan can change.',
      exercises: [
        {
          id: 'budgeting-saving.build-budget.purpose',
          kind: 'multiple_choice',
          prompt: 'Which statement best describes a budget?',
          choices: [
            { id: 'ban', label: 'A rule that bans all enjoyable spending' },
            { id: 'plan', label: 'A plan for how income will cover spending and savings' },
            { id: 'guarantee', label: 'A guarantee that no unexpected expense will happen' },
          ],
          correctChoiceId: 'plan',
          explanation:
            'A budget makes choices visible. It can include enjoyment and should be revisited when circumstances change.',
        },
        {
          id: 'budgeting-saving.build-budget.savings',
          kind: 'computed_answer',
          prompt:
            'Your monthly take-home income is $2,000. You plan $1,300 for essentials and $450 for other spending. How much remains to allocate to savings?',
          answer: 250,
          format: 'usd',
          tolerance: { type: 'absolute', value: 0.01 },
          hint: 'Income minus both spending categories equals the remaining allocation.',
          explanation:
            '$2,000 - $1,300 - $450 = $250. Including this savings allocation uses the full $2,000.',
        },
        {
          id: 'budgeting-saving.build-budget.adjust',
          kind: 'computed_answer',
          prompt:
            'Income is $1,800. Your plan assigns $1,200 to essentials, $500 to flexible spending, and $200 to savings. If essentials and savings stay fixed, by how many dollars must flexible spending decrease to balance the plan?',
          answer: 100,
          format: 'usd',
          tolerance: { type: 'absolute', value: 0.01 },
          hint: 'Find the amount by which all three allocations exceed income.',
          explanation:
            'Allocations total $1,900, which is $100 above income. Flexible spending becomes $400: $1,200 + $400 + $200 = $1,800.',
        },
        {
          id: 'budgeting-saving.build-budget.timing',
          kind: 'multiple_choice',
          prompt:
            'You have $100 available now. A $400 bill is due tomorrow, and your $800 paycheck arrives next week. What does a monthly budget total alone miss?',
          choices: [
            { id: 'timing', label: 'The bill is due before enough cash is available' },
            {
              id: 'covered',
              label: "Nothing; next week's paycheck pays tomorrow's bill automatically",
            },
            { id: 'ignore', label: 'Bills do not belong in a budget' },
          ],
          correctChoiceId: 'timing',
          explanation:
            'There is a $300 shortfall on the due date. Track when money arrives and bills are due, not only monthly totals.',
        },
        {
          id: 'budgeting-saving.build-budget.process',
          kind: 'ordering',
          prompt:
            'Put this budgeting workflow in order, from gathering information to reviewing the completed month.',
          items: [
            { id: 'adjust', label: 'Compare planned allocations with income and resolve any gap' },
            { id: 'review', label: 'Compare actual results with the plan after the month' },
            { id: 'gather', label: 'Gather expected income, expenses, and bill dates' },
            {
              id: 'allocate',
              label: 'Draft spending and savings allocations using that information',
            },
          ],
          correctOrder: ['gather', 'allocate', 'adjust', 'review'],
          explanation:
            'Gather the inputs, draft the plan, balance it, then use actual results to inform the next plan.',
        },
      ],
    },
    {
      id: 'budgeting-saving.savings-goal',
      title: 'Set a Savings Goal',
      intro:
        'Give a savings goal an amount and a deadline. Subtract money already set aside, then divide the remaining amount by the number of saving periods. To save $500 in five months with $100 already saved, set aside ($500 - $100) / 5 = $80 per month. These examples assume no interest, fees, or withdrawals. If the required amount does not fit your budget, adjust the goal, timeline, or available allocation. Count whole deposits by rounding up when necessary.',
      exercises: [
        {
          id: 'budgeting-saving.savings-goal.specific',
          kind: 'multiple_choice',
          prompt: 'Which goal includes both a target amount and a deadline?',
          choices: [
            { id: 'vague', label: 'Save more someday' },
            { id: 'spend', label: 'Try to spend less' },
            { id: 'specific', label: 'Set aside $600 for a course fee in six months' },
          ],
          correctChoiceId: 'specific',
          explanation:
            'An amount and deadline let you calculate a periodic contribution and check whether it fits your budget.',
        },
        {
          id: 'budgeting-saving.savings-goal.monthly',
          kind: 'computed_answer',
          prompt:
            'You need $600 in six months and already have $120 saved for this goal. With no interest, fees, or withdrawals, how much must you save each month in six equal deposits?',
          answer: 80,
          format: 'usd',
          tolerance: { type: 'absolute', value: 0.01 },
          hint: 'Subtract existing savings from the target, then divide by six.',
          explanation:
            '($600 - $120) / 6 = $80 per month. Six deposits add $480 to your existing $120.',
        },
        {
          id: 'budgeting-saving.savings-goal.deposits',
          kind: 'computed_answer',
          prompt:
            'Your goal is $500 and you have $100 saved. You add $75 at the end of each month, with no interest, fees, or withdrawals. How many monthly deposits are needed to reach at least $500? Enter a whole number.',
          answer: 6,
          format: 'number',
          tolerance: { type: 'absolute', value: 0.01 },
          hint: 'Divide the $400 gap by $75 and round up to a whole deposit.',
          explanation:
            'Five deposits leave $475 in total, below the goal. Six leave $550, so six monthly deposits are needed.',
        },
        {
          id: 'budgeting-saving.savings-goal.feasible',
          kind: 'multiple_choice',
          prompt:
            'A $480 goal requires $120 monthly over four months, but your budget has only $80 monthly available. Starting from $0 and assuming no interest or fees, which change fits the current budget?',
          choices: [
            { id: 'ignore', label: 'Keep the plan and ignore the $40 monthly gap' },
            { id: 'extend', label: 'Extend the deadline to six months at $80 per month' },
            { id: 'same', label: 'Save $80 for four months and assume it totals $480' },
          ],
          correctChoiceId: 'extend',
          explanation:
            '6 x $80 = $480. Four deposits of $80 would total only $320. Extending the timeline is one way to make this example feasible.',
        },
        {
          id: 'budgeting-saving.savings-goal.compare',
          kind: 'ordering',
          prompt:
            'Each plan starts at $0 and saves exactly $60 at each month-end, with no interest or fees. Order the targets by deposits needed, fewest to most.',
          items: [
            { id: 'large', label: '$480 target' },
            { id: 'small', label: '$120 target' },
            { id: 'medium', label: '$300 target' },
          ],
          correctOrder: ['small', 'medium', 'large'],
          explanation: '$120 / $60 = 2 deposits; $300 / $60 = 5; $480 / $60 = 8.',
        },
      ],
    },
  ],
};
