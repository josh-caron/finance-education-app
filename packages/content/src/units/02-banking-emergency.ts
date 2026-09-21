import { cashRemainder, depositsToReach, monthsOfExpensesCovered, type Unit } from '@fin/core';

/**
 * Follows budgeting and saving. Learners choose a place to keep cash, start an
 * emergency reserve, notice fees, and learn that deposit insurance exists.
 * Coverage limits and fee amounts are given inside each scenario so they are
 * not taught as permanent national facts.
 */
export const bankingEmergency: Unit = {
  id: 'banking-emergency',
  title: 'Banking and Emergency Savings',
  description: 'Choose a safe place for cash, start an emergency fund, and watch fees.',
  order: 1,
  prerequisites: ['budgeting-saving'],
  lessons: [
    {
      id: 'banking-emergency.accounts',
      title: 'Choose an Account',
      intro:
        'A checking account is built for frequent spending and bill payments. A savings account is built to hold money you do not plan to spend right away. Cash at home is easy to spend and is not covered by deposit insurance. The right mix depends on when you will need the money, not on which product sounds more advanced.',
      exercises: [
        {
          id: 'banking-emergency.accounts.purpose',
          kind: 'multiple_choice',
          prompt: 'Which account is designed for everyday spending and bill payments?',
          choices: [
            { id: 'checking', label: 'A checking account' },
            { id: 'savings-only', label: 'A savings account used only for long-term goals' },
            { id: 'cash', label: 'Cash kept only at home' },
          ],
          correctChoiceId: 'checking',
          hint: 'Everyday payments need an account meant for frequent withdrawals.',
          explanation:
            'Checking accounts are set up for deposits, debit payments, and transfers. Savings accounts can usually move money too, but they are meant to hold funds you are not spending this week.',
        },
        {
          id: 'banking-emergency.accounts.transfer',
          kind: 'computed_answer',
          prompt:
            'Your checking balance is $420. You move $150 into savings the same day and spend $60 from checking. What is the checking balance after both actions?',
          answer: cashRemainder(420, 150, 60),
          format: 'usd',
          tolerance: { type: 'absolute', value: 0.01 },
          hint: 'Subtract both the transfer and the spending from the starting checking balance.',
          explanation:
            '$420 - $150 - $60 = $210. The $150 still belongs to you; it simply moved to savings. Only the $60 left your accounts.',
        },
        {
          id: 'banking-emergency.accounts.place',
          kind: 'multiple_choice',
          prompt:
            'Why might someone keep an emergency reserve in a savings account rather than only as cash at home?',
          choices: [
            { id: 'spend', label: 'Cash at home automatically earns a higher return' },
            {
              id: 'safer',
              label:
                'An insured bank or credit union account is harder to spend casually and can be protected if the institution fails',
            },
            { id: 'hidden', label: 'Money in savings cannot be withdrawn for a true emergency' },
          ],
          correctChoiceId: 'safer',
          hint: 'Compare both temptation to spend and what happens if the institution fails.',
          explanation:
            'A separate savings account creates a pause before spending. Deposits at an FDIC-insured bank or NCUA-insured credit union can also be protected up to a legal limit if that institution fails. Cash at home has neither protection.',
        },
        {
          id: 'banking-emergency.accounts.split',
          kind: 'computed_answer',
          prompt:
            'You keep $80 in checking for this week and put the rest of a $350 paycheck into savings. How much goes to savings?',
          answer: cashRemainder(350, 80),
          format: 'usd',
          tolerance: { type: 'absolute', value: 0.01 },
          hint: 'Paycheck minus the amount you leave in checking.',
          explanation:
            '$350 - $80 = $270. Separating spending cash from savings is a simple way to avoid treating the whole paycheck as available to spend.',
        },
        {
          id: 'banking-emergency.accounts.order',
          kind: 'ordering',
          prompt:
            'Order these uses of money from most liquid for this week’s bills to most set aside for later.',
          items: [
            { id: 'goal', label: 'Savings earmarked for a goal next year' },
            { id: 'checking', label: 'Checking used to pay rent this week' },
            { id: 'emergency', label: 'Savings reserved for emergencies' },
          ],
          correctOrder: ['checking', 'emergency', 'goal'],
          hint: 'Ask which pile you would tap first for a bill due in three days.',
          explanation:
            'Checking is for near-term payments. Emergency savings is available but reserved. Goal savings is intentionally harder to treat as this week’s spending money.',
        },
      ],
    },
    {
      id: 'banking-emergency.emergency-fund',
      title: 'Start an Emergency Fund',
      intro:
        'An emergency fund is cash set aside for unplanned expenses or a loss of income, such as a car repair or a medical bill. The Consumer Financial Protection Bureau recommends starting with a small, specific goal—often $500, then $1,000—because the right later target depends on your own costs. A multi-month reserve of essential expenses is a later step, not a requirement to begin.',
      exercises: [
        {
          id: 'banking-emergency.emergency-fund.purpose',
          kind: 'multiple_choice',
          prompt: 'What is an emergency fund mainly for?',
          choices: [
            { id: 'vacation', label: 'A planned vacation you already put on the calendar' },
            {
              id: 'shock',
              label: 'Unplanned expenses or a loss of income so you are less likely to borrow',
            },
            { id: 'investing', label: 'Buying investments you cannot sell for many years' },
          ],
          correctChoiceId: 'shock',
          hint: 'Think about costs you did not schedule and would otherwise put on a card.',
          explanation:
            'The CFPB describes an emergency fund as a cash reserve for unplanned expenses or financial emergencies. Using it for a planned trip mixes that reserve with a separate goal.',
        },
        {
          id: 'banking-emergency.emergency-fund.starter',
          kind: 'computed_answer',
          prompt:
            'Your first emergency-fund goal is $500. You already have $140 set aside. With no interest, fees, or withdrawals, how much is still needed?',
          answer: cashRemainder(500, 140),
          format: 'usd',
          tolerance: { type: 'absolute', value: 0.01 },
          hint: 'Subtract what is already saved from the starter goal.',
          explanation:
            '$500 - $140 = $360. A first target can be a round number that covers common shocks, then you can raise it.',
        },
        {
          id: 'banking-emergency.emergency-fund.deposits',
          kind: 'computed_answer',
          prompt:
            'You still need $360 and can save $40 at each month-end. How many monthly deposits are needed to reach at least $360? Enter a whole number.',
          answer: depositsToReach(360, 0, 40),
          format: 'number',
          tolerance: { type: 'absolute', value: 0.01 },
          hint: 'Divide $360 by $40. If it divides evenly, that count is enough.',
          explanation:
            '$360 / $40 = 9. Nine deposits of $40 reach the remaining starter goal with no leftover gap.',
        },
        {
          id: 'banking-emergency.emergency-fund.months',
          kind: 'computed_answer',
          prompt:
            'Essential monthly expenses are $1,200 and you have $3,600 in emergency savings. How many months of essentials does that reserve cover?',
          answer: monthsOfExpensesCovered(3600, 1200),
          format: 'number',
          tolerance: { type: 'absolute', value: 0.01 },
          hint: 'Divide the reserve by one month of essential expenses.',
          explanation:
            '$3,600 / $1,200 = 3 months. Covering several months of essentials is one later way to size a fund; it is not the only correct first goal.',
        },
        {
          id: 'banking-emergency.emergency-fund.use',
          kind: 'multiple_choice',
          prompt:
            'You use $300 of emergency savings for a necessary car repair. What should you do next?',
          choices: [
            { id: 'abandon', label: 'Treat the fund as finished and stop saving' },
            { id: 'rebuild', label: 'Make a plan to put money back so the fund can be used again' },
            { id: 'same', label: 'Replace the $300 with a new high-interest loan immediately' },
          ],
          correctChoiceId: 'rebuild',
          hint: 'Using the fund for a real emergency is the point; an empty fund needs a refill plan.',
          explanation:
            'CFPB savings materials treat using a rainy-day fund as a success, then ask you to replenish it. The next step is a new deposit plan, not abandoning the habit.',
        },
      ],
    },
    {
      id: 'banking-emergency.fees',
      title: 'Watch Account Fees',
      intro:
        'Account fees reduce the money you keep. Overdraft, out-of-network ATM, and monthly maintenance fees are common examples, but the dollar amount is set by the institution and can change. Read the account terms. These exercises use fees stated in the problem only.',
      exercises: [
        {
          id: 'banking-emergency.fees.overdraft',
          kind: 'multiple_choice',
          prompt:
            'Your checking balance is $12 and a $40 debit posts. The bank pays the debit and charges the $35 overdraft fee named in this problem. What happened?',
          choices: [
            { id: 'free', label: 'The bank covered the purchase at no cost' },
            {
              id: 'fee',
              label: 'The purchase went through, and you now owe the shortfall plus the $35 fee',
            },
            { id: 'ignored', label: 'Overdraft fees never apply to debit-card purchases' },
          ],
          correctChoiceId: 'fee',
          hint: 'An overdraft means the bank covered more than your balance, usually for a fee listed in the account terms.',
          explanation:
            'The $40 debit exceeded the $12 balance. If the bank pays it and charges the $35 fee in this scenario, you must repay both the negative balance and the fee. Real fees are disclosed by each institution and can differ.',
        },
        {
          id: 'banking-emergency.fees.balance',
          kind: 'computed_answer',
          prompt:
            'You start the day at $12. A $40 debit is paid and a $35 overdraft fee is charged, with no other activity. What is the account balance, in dollars? Use a minus sign if it is negative.',
          answer: cashRemainder(12, 40, 35),
          format: 'usd',
          tolerance: { type: 'absolute', value: 0.01 },
          hint: 'Start at $12, subtract the $40 debit, then subtract the $35 fee.',
          explanation:
            '$12 - $40 - $35 = -$63. The fee is extra cost on top of the amount the bank advanced.',
        },
        {
          id: 'banking-emergency.fees.atm',
          kind: 'computed_answer',
          prompt:
            'You withdraw $60 from an out-of-network ATM. This problem charges a $3 owner fee and a $2.50 bank fee. What is the total reduction in your checking account?',
          answer: cashRemainder(60 + 3 + 2.5),
          format: 'usd',
          tolerance: { type: 'absolute', value: 0.01 },
          hint: 'Add the cash you took to both fees in the problem.',
          explanation:
            '$60 + $3 + $2.50 = $65.50. The cash in your hand is $60; the account dropped by more because of the two fees stated here.',
        },
        {
          id: 'banking-emergency.fees.avoid',
          kind: 'multiple_choice',
          prompt: 'Which habit is most likely to reduce overdraft risk?',
          choices: [
            { id: 'guess', label: 'Guess your balance and swipe whenever a purchase looks small' },
            {
              id: 'track',
              label: 'Track pending charges and keep a buffer above bills that have not cleared',
            },
            {
              id: 'ignore',
              label: 'Ignore alerts because they do not change the available balance',
            },
          ],
          correctChoiceId: 'track',
          hint: 'Overdrafts happen when posted and pending items exceed what is actually available.',
          explanation:
            'Pending debit-card charges and scheduled bills can post after you thought the money was still free. A buffer and balance alerts reduce that gap. Alerts do not change the math, but they help you see it.',
        },
        {
          id: 'banking-emergency.fees.order',
          kind: 'ordering',
          prompt:
            'Order these same-day checking changes from the smallest reduction to the largest. Use only the amounts in each label.',
          items: [
            { id: 'atm', label: '$20 withdrawal plus a $3 ATM fee' },
            { id: 'coffee', label: '$5 coffee with no fee' },
            { id: 'overdraft', label: '$15 purchase plus a $35 overdraft fee' },
          ],
          correctOrder: ['coffee', 'atm', 'overdraft'],
          hint: 'Add any fee to the purchase or withdrawal in that row.',
          explanation:
            'The account drops by $5, $23, and $50. The overdraft fee, not the purchase, is what makes the last item largest.',
        },
      ],
    },
    {
      id: 'banking-emergency.insurance',
      title: 'Keep Deposits Safe',
      intro:
        'Deposit insurance protects eligible deposits if an insured bank or credit union fails. In the United States, the FDIC insures banks and the NCUA insures most credit unions. Coverage is generally per depositor, per insured institution, per ownership category, up to a limit set by law. That limit can change, so these exercises state the limit used in the scenario. Confirm current rules at FDIC.gov or MyCreditUnion.gov.',
      exercises: [
        {
          id: 'banking-emergency.insurance.who',
          kind: 'multiple_choice',
          prompt:
            'If an FDIC-insured bank fails, what does deposit insurance protect in this course’s terms?',
          choices: [
            {
              id: 'stock',
              label: 'The market value of stocks you bought through the bank’s brokerage',
            },
            {
              id: 'deposits',
              label:
                'Eligible deposits such as checking and savings, up to the legal limit for that ownership category',
            },
            { id: 'crypto', label: 'Any cryptocurrency the bank mentioned in an advertisement' },
          ],
          correctChoiceId: 'deposits',
          hint: 'Insurance covers qualifying deposits, not every product sold in a bank lobby.',
          explanation:
            'FDIC insurance is for eligible deposits at insured banks. Investments, including stocks held in a brokerage account, are not insured the same way even if you opened them at a bank branch.',
        },
        {
          id: 'banking-emergency.insurance.uninsured',
          kind: 'computed_answer',
          prompt:
            'This problem uses a $250,000 insurance limit for a single ownership category at one bank. You have $280,000 in that category at that bank and nothing elsewhere. How many dollars are above the stated limit?',
          answer: cashRemainder(280000, 250000),
          format: 'usd',
          tolerance: { type: 'absolute', value: 0.01 },
          hint: 'Subtract the scenario’s coverage limit from the deposit.',
          explanation:
            '$280,000 - $250,000 = $30,000. The $30,000 is the amount this scenario treats as above the stated limit. Real coverage depends on current law and how the account is titled.',
        },
        {
          id: 'banking-emergency.insurance.split',
          kind: 'computed_answer',
          prompt:
            'Using the same $250,000 limit per bank, you place $180,000 at Bank A and $180,000 at Bank B, each in one ownership category. How many dollars are within the stated limit in total?',
          answer: cashRemainder(180000 + 180000),
          format: 'usd',
          tolerance: { type: 'absolute', value: 0.01 },
          hint: 'Each bank’s balance is below $250,000, so add both balances.',
          explanation:
            'Each $180,000 balance is under this problem’s per-bank limit, so $360,000 is within the stated limit. Spreading deposits is one way people stay under a per-institution cap; ownership categories can also change coverage.',
        },
        {
          id: 'banking-emergency.insurance.limit-fact',
          kind: 'multiple_choice',
          prompt: 'Why does this lesson give the insurance limit inside each story problem?',
          choices: [
            { id: 'secret', label: 'The limit is a secret banks are not allowed to publish' },
            {
              id: 'changes',
              label: 'The legal limit can change, so a problem should state the number it is using',
            },
            { id: 'never', label: 'Deposit insurance has never had a numeric limit' },
          ],
          correctChoiceId: 'changes',
          hint: 'Congress and regulators can change coverage; check an official source for the current rule.',
          explanation:
            'Standard coverage has been $250,000 for many years, but it is set by law and has changed before. Official sites are the place to confirm the current amount and the ownership-category rules.',
        },
        {
          id: 'banking-emergency.insurance.order',
          kind: 'ordering',
          prompt:
            'Using a $250,000 per-bank limit, order these single-category deposits from least uninsured to most uninsured.',
          items: [
            { id: 'over', label: '$400,000 at one insured bank' },
            { id: 'under', label: '$40,000 at one insured bank' },
            { id: 'split', label: '$200,000 at each of two insured banks' },
          ],
          correctOrder: ['under', 'split', 'over'],
          hint: 'Uninsured here means the dollars above $250,000 at a single bank.',
          explanation:
            '$40,000 is fully within the limit (uninsured $0). $200,000 + $200,000 at two banks is also within this per-bank limit. $400,000 at one bank is $150,000 above the stated limit.',
        },
      ],
    },
  ],
};
