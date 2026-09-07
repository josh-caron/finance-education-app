import { describe, expect, it } from 'vitest';

import {
  bondPrice,
  compoundBalance,
  creditUtilization,
  futureValueOfAnnuity,
  monthlyLoanPayment,
  realReturn,
  yearsToDouble,
  yieldToMaturity,
} from '../finance';

describe('finance helpers', () => {
  it('compounds a balance', () => {
    expect(compoundBalance(1000, 0.05, 1)).toBeCloseTo(1050, 6);
    expect(compoundBalance(1000, 0.12, 1, 12)).toBeCloseTo(1126.83, 2);
  });

  it('values a stream of contributions', () => {
    expect(futureValueOfAnnuity(100, 0.06, 10)).toBeCloseTo(16387.93, 2);
    expect(futureValueOfAnnuity(100, 0, 10)).toBe(12000);
  });

  it('amortizes a loan', () => {
    expect(monthlyLoanPayment(300000, 0.065, 30)).toBeCloseTo(1896.2, 1);
    expect(monthlyLoanPayment(1200, 0, 1)).toBe(100);
  });

  it('prices a bond at par when the yield equals the coupon', () => {
    const terms = { faceValue: 1000, couponRate: 0.05, yearsToMaturity: 10 };
    expect(bondPrice(terms, 0.05)).toBeCloseTo(1000, 6);
    expect(bondPrice(terms, 0.07)).toBeLessThan(1000);
  });

  it('recovers the yield that produced a price', () => {
    const terms = { faceValue: 1000, couponRate: 0.05, yearsToMaturity: 10 };
    expect(yieldToMaturity(terms, bondPrice(terms, 0.068))).toBeCloseTo(0.068, 6);
  });

  it('adjusts a nominal return for inflation', () => {
    expect(realReturn(0.07, 0.03)).toBeCloseTo(0.038835, 6);
  });

  it('computes doubling time', () => {
    expect(yearsToDouble(0.072)).toBeCloseTo(9.97, 2);
  });

  it('reports credit utilization as a percentage', () => {
    expect(creditUtilization(300, 1000)).toBe(30);
    expect(creditUtilization(300, 0)).toBe(0);
  });
});
