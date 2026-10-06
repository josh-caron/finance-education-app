import type { Unit } from '@fin/core';
import { retirementAccounts } from './retirement-accounts';

/** Keep the existing retirement.* lesson IDs so moving lessons preserves progress. */
export const healthInvesting: Unit = {
  id: 'health-investing',
  title: 'Health Savings and Investment Choices',
  description: 'Explore HSAs, compare investments and fees, and put your account plan together.',
  order: 4,
  prerequisites: ['retirement'],
  lessons: retirementAccounts.slice(3),
};
