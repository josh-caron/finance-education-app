/**
 * Finance math used to author and verify computed-answer exercises. Content
 * authors compute the expected answer with these helpers rather than by hand,
 * so an exercise and its answer key cannot drift apart.
 */

/** Balance of `principal` after `years` at `annualRate` (0.07 = 7%), compounded `periodsPerYear` times. */
export function compoundBalance(
  principal: number,
  annualRate: number,
  years: number,
  periodsPerYear = 1,
): number {
  const periods = years * periodsPerYear;
  return principal * (1 + annualRate / periodsPerYear) ** periods;
}

/** Future value of a fixed contribution made every period, made at period end. */
export function futureValueOfAnnuity(
  contribution: number,
  annualRate: number,
  years: number,
  periodsPerYear = 12,
): number {
  const rate = annualRate / periodsPerYear;
  const periods = years * periodsPerYear;
  if (rate === 0) return contribution * periods;
  return contribution * (((1 + rate) ** periods - 1) / rate);
}

/** What a future sum is worth today. */
export function presentValue(futureAmount: number, annualRate: number, years: number): number {
  return futureAmount / (1 + annualRate) ** years;
}

/** Fixed monthly payment on an amortizing loan (mortgage, auto, student). */
export function monthlyLoanPayment(principal: number, annualRate: number, years: number): number {
  const rate = annualRate / 12;
  const months = years * 12;
  if (rate === 0) return principal / months;
  return (principal * rate) / (1 - (1 + rate) ** -months);
}

/** Total interest paid over the life of an amortizing loan. */
export function totalLoanInterest(principal: number, annualRate: number, years: number): number {
  return monthlyLoanPayment(principal, annualRate, years) * years * 12 - principal;
}

export interface BondTerms {
  faceValue: number;
  /** Annual coupon rate, e.g. 0.05 for a 5% coupon. */
  couponRate: number;
  yearsToMaturity: number;
  paymentsPerYear?: number;
}

/** Price of a bond at a given annual yield. */
export function bondPrice(terms: BondTerms, annualYield: number): number {
  const { faceValue, couponRate, yearsToMaturity, paymentsPerYear = 2 } = terms;
  const periods = Math.round(yearsToMaturity * paymentsPerYear);
  const couponPayment = (faceValue * couponRate) / paymentsPerYear;
  const periodYield = annualYield / paymentsPerYear;

  let price = 0;
  for (let period = 1; period <= periods; period += 1) {
    price += couponPayment / (1 + periodYield) ** period;
  }
  return price + faceValue / (1 + periodYield) ** periods;
}

/**
 * Yield to maturity: the annual yield that prices the bond at `price`. Solved by
 * bisection because price is monotonically decreasing in yield.
 */
export function yieldToMaturity(terms: BondTerms, price: number, tolerance = 1e-9): number {
  let low = -0.99;
  let high = 10;

  for (let iteration = 0; iteration < 200; iteration += 1) {
    const mid = (low + high) / 2;
    const midPrice = bondPrice(terms, mid);

    if (Math.abs(midPrice - price) < tolerance) return mid;
    if (midPrice > price) low = mid;
    else high = mid;
  }

  return (low + high) / 2;
}

/** Inflation-adjusted return from a nominal return (Fisher equation). */
export function realReturn(nominalRate: number, inflationRate: number): number {
  return (1 + nominalRate) / (1 + inflationRate) - 1;
}

/** Years for a balance to double at a constant rate. */
export function yearsToDouble(annualRate: number): number {
  return Math.log(2) / Math.log(1 + annualRate);
}

/** Credit utilization as a percentage, the ratio credit scores weigh most after payment history. */
export function creditUtilization(balance: number, creditLimit: number): number {
  if (creditLimit <= 0) return 0;
  return (balance / creditLimit) * 100;
}

/** Income minus one or more expenses from the same period. */
export function cashRemainder(income: number, ...amounts: number[]): number {
  return amounts.reduce((remaining, amount) => remaining - amount, income);
}

/**
 * Whole deposits needed to cover a gap. Partial deposits do not count until they
 * are made, so 400 remaining at 75 per deposit is 6, not 5.33.
 */
export function depositsToReach(target: number, alreadySaved: number, perDeposit: number): number {
  const gap = target - alreadySaved;
  if (gap <= 0) return 0;
  if (perDeposit <= 0) return Number.POSITIVE_INFINITY;
  return Math.ceil(gap / perDeposit);
}

/** How many months of essential expenses a cash reserve would cover. */
export function monthsOfExpensesCovered(savings: number, monthlyEssentials: number): number {
  if (monthlyEssentials <= 0) return 0;
  return savings / monthlyEssentials;
}
