import { cashRemainder, depositsToReach, type Lesson } from '@fin/core';

/** CFPB Your Money, Your Goals tools and emergency-fund guide; see docs/research-sources.md. */
export const bankingPractice: Lesson[] = [
  {
    id: 'banking-emergency.savings-habit',
    title: 'Build a Savings Habit',
    intro:
      'Choose a transfer amount that fits your pay and bills. Schedule it after income is available, and check the balance first. Automatic saving still needs attention when income changes. A planned annual bill belongs in its own savings goal; an unexpected urgent repair may use your emergency reserve. This lesson assumes no interest, fees, or withdrawals except those stated.',
    exercises: [
      {
        id: 'banking-emergency.savings-habit.timing',
        kind: 'multiple_choice',
        prompt:
          'Your pay becomes available Friday. Thursday bills use nearly all your checking balance. Which savings schedule best fits this cash flow?',
        choices: [
          { id: 'before', label: 'Transfer savings Thursday before pay arrives' },
          {
            id: 'after',
            label:
              'Check Friday’s available pay and upcoming bills, then transfer an affordable amount',
          },
          { id: 'all', label: 'Transfer the entire paycheck without checking bills' },
        ],
        correctChoiceId: 'after',
        hint: 'An automatic transfer cannot use a paycheck that has not become available.',
        explanation:
          'Friday is the first time the new pay is available in this example. Reviewing upcoming bills helps avoid creating a shortage by transferring too much.',
      },
      {
        id: 'banking-emergency.savings-habit.buffer',
        kind: 'computed_answer',
        prompt:
          'After payday, checking holds $650. Before the next payday, $420 of bills must be paid. You also keep a $50 checking buffer. What is the most you can transfer to savings while preserving both?',
        answer: cashRemainder(650, 420, 50),
        format: 'usd',
        tolerance: { type: 'absolute', value: 0.01 },
        hint: 'Reserve the bills and the buffer before deciding what can move.',
        explanation:
          '$650 - $420 - $50 = $180. This is the maximum under the stated plan, not a savings requirement for everyone.',
      },
      {
        id: 'banking-emergency.savings-habit.irregular',
        kind: 'multiple_choice',
        prompt:
          'A work shift is canceled and your next paycheck is smaller. A scheduled savings transfer would leave too little for the bills you listed. What is the best adjustment?',
        choices: [
          {
            id: 'ignore',
            label: 'Ignore the smaller paycheck because automation guarantees enough money',
          },
          { id: 'adjust', label: 'Review the bill calendar and reduce or reschedule the transfer' },
          { id: 'quit', label: 'Give up on saving permanently' },
        ],
        correctChoiceId: 'adjust',
        hint: 'A useful habit can change when available income changes.',
        explanation:
          'A transfer plan should fit actual cash flow. Adjusting this transfer avoids promising money that is needed for bills and leaves room to restart saving when feasible.',
      },
      {
        id: 'banking-emergency.savings-habit.refill',
        kind: 'computed_answer',
        prompt:
          'Your reserve was $600 before an urgent $225 repair. To restore it to $600, you save $40 each payday. How many whole deposits are needed? Assume no other activity.',
        answer: depositsToReach(600, cashRemainder(600, 225), 40),
        format: 'number',
        tolerance: { type: 'absolute', value: 0.01 },
        hint: 'Find the gap left by the repair, divide by $40, and round up.',
        explanation:
          'The repair leaves $375. Five deposits bring it to $575; six bring it to $615. Six whole deposits restore at least the original target.',
      },
      {
        id: 'banking-emergency.savings-habit.planned',
        kind: 'multiple_choice',
        prompt:
          'You know a $240 annual membership renewal is due in 12 months. Which plan keeps this predictable expense separate from emergency savings?',
        choices: [
          { id: 'plan', label: 'Set aside $20 monthly in a renewal goal, if the budget allows' },
          { id: 'emergency', label: 'Call the known renewal an unexpected emergency every year' },
          { id: 'ignore', label: 'Leave it out of the budget because it is not monthly' },
        ],
        correctChoiceId: 'plan',
        hint: 'Divide the known cost across the months before it is due.',
        explanation:
          '$240 / 12 = $20 per month. A separate planned-expense goal leaves the emergency reserve available for unplanned needs.',
      },
    ],
  },
  {
    id: 'banking-emergency.review',
    title: 'Your Banking and Safety-Net Plan',
    intro:
      'Apply the unit to Jordan’s situation: compare account terms, protect money for upcoming bills, choose a reserve target, and rebuild after a surprise expense. All account offers and fees are fictional. Use only the amounts given; assume no interest or other transactions. A complete plan considers cost, access, insurance, and cash-flow timing together.',
    exercises: [
      {
        id: 'banking-emergency.review.account',
        kind: 'multiple_choice',
        prompt:
          'Jordan can meet neither a $1,000 minimum balance nor a direct-deposit condition. Account A charges $8 monthly unless either condition is met. Account B has no monthly fee or minimum. Both are insured and have equally convenient free ATMs. Which costs less under these stated terms?',
        choices: [
          { id: 'a', label: 'Account A, because its fee can be waived for other customers' },
          { id: 'b', label: 'Account B, because Jordan meets its no-fee terms' },
          { id: 'same', label: 'They cost the same for Jordan' },
        ],
        correctChoiceId: 'b',
        hint: 'Use the conditions Jordan actually meets, not the advertised possibility of a waiver.',
        explanation:
          'A costs Jordan $8 each month while B costs $0 under this example. Other features are held equal here; real comparisons should also check access and the full fee schedule.',
      },
      {
        id: 'banking-emergency.review.annual-fee',
        kind: 'computed_answer',
        prompt:
          'If Jordan keeps Account A for 12 months and never qualifies for its $8 monthly fee waiver, what is the total monthly-maintenance cost over that year?',
        answer: 8 * 12,
        format: 'usd',
        tolerance: { type: 'absolute', value: 0.01 },
        hint: 'Multiply the monthly fee by twelve months.',
        explanation:
          '$8 x 12 = $96. This includes only the stated maintenance fees, not purchases or any hypothetical other charges.',
      },
      {
        id: 'banking-emergency.review.reserve',
        kind: 'computed_answer',
        prompt:
          'Jordan has $200 in a reserve and chooses a $650 target. Saving $75 at each month-end, how many deposits reach the target with no interest, fees, or withdrawals?',
        answer: depositsToReach(650, 200, 75),
        format: 'number',
        tolerance: { type: 'absolute', value: 0.01 },
        hint: 'Subtract existing savings before dividing by the deposit amount.',
        explanation:
          '($650 - $200) / $75 = 6 deposits. The $650 target is Jordan’s scenario choice, not a universal emergency-fund rule.',
      },
      {
        id: 'banking-emergency.review.access',
        kind: 'multiple_choice',
        prompt:
          'Jordan needs emergency money accessible for an urgent bill. Which option best combines access and protection against an institution failing?',
        choices: [
          { id: 'stock', label: 'A stock fund whose value can fall when money is needed' },
          {
            id: 'deposit',
            label:
              'An eligible savings deposit within verified insurance limits, with withdrawal terms that meet Jordan’s needs',
          },
          { id: 'locked', label: 'An account that prohibits withdrawals when the bill is due' },
        ],
        correctChoiceId: 'deposit',
        hint: 'Insurance and the ability to withdraw are separate features to check.',
        explanation:
          'The eligible deposit in this example meets both requirements. Insurance does not make stocks risk-free or remove withdrawal restrictions from an account.',
      },
      {
        id: 'banking-emergency.review.sequence',
        kind: 'ordering',
        prompt:
          'Jordan follows this plan: verify an urgent repair, use the reserve, then rebuild it. Put these steps in that order.',
        items: [
          { id: 'refill', label: 'Fit replacement deposits into the next pay periods' },
          { id: 'pay', label: 'Use available emergency savings to pay the verified repair bill' },
          {
            id: 'verify',
            label: 'Confirm the repair is urgent and check the bill and reserve balance',
          },
        ],
        correctOrder: ['verify', 'pay', 'refill'],
        hint: 'Check the need before paying; rebuild after using the money.',
        explanation:
          'Verify the need and funds first, pay using the reserve, then make a realistic refill plan. Using savings for its intended purpose is progress, not failure.',
      },
    ],
  },
];
