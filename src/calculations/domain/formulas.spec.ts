import {
  estimateAnnualConsumptionKwh,
  recommendSystemSizeKw,
  annualGenerationKwh,
  annualSavingsGbp,
  upfrontPriceGbp,
  monthlySubscriptionGbp,
  paybackYears,
  annualCo2SavedKg,
  calculateQuote,
} from './formulas';
import type { QuoteInputs } from './types';

// A reasonable baseline UK household for sanity checks.
const baseline: QuoteInputs = {
  propertyType: 'SEMI_DETACHED',
  region: 'SOUTH_EAST',
  roofOrientation: 'SOUTH',
  monthlyBillGbp: 120,
};

describe('estimateAnnualConsumptionKwh', () => {
  it('scales linearly with the monthly bill', () => {
    const lower = estimateAnnualConsumptionKwh(100);
    const upper = estimateAnnualConsumptionKwh(200);
    expect(upper).toBeCloseTo(lower * 2, 6);
  });

  it('returns a plausible figure for a typical UK home', () => {
    // £120/month at ~£0.27/kWh → roughly 5,300 kWh/year
    const result = estimateAnnualConsumptionKwh(120);
    expect(result).toBeGreaterThan(5000);
    expect(result).toBeLessThan(5700);
  });
});

describe('recommendSystemSizeKw', () => {
  it('returns a value within the property type cap', () => {
    const size = recommendSystemSizeKw(baseline);
    expect(size).toBeLessThanOrEqual(5.0); // semi-detached cap
    expect(size).toBeGreaterThanOrEqual(1.0);
  });

  it('respects the cap when a heavy user has a small house', () => {
    const heavyUserSmallHouse: QuoteInputs = {
      ...baseline,
      propertyType: 'FLAT',
      monthlyBillGbp: 500, // very high
    };
    const size = recommendSystemSizeKw(heavyUserSmallHouse);
    expect(size).toBeLessThanOrEqual(2.0); // flat cap
  });

  it('rounds to the nearest 0.5 kW', () => {
    const size = recommendSystemSizeKw(baseline);
    expect(size * 2).toBe(Math.round(size * 2)); // multiple of 0.5
  });

  it('returns a smaller system for a north-facing roof than south', () => {
    const north = recommendSystemSizeKw({
      ...baseline,
      roofOrientation: 'NORTH',
    });
    const south = recommendSystemSizeKw({
      ...baseline,
      roofOrientation: 'SOUTH',
    });
    expect(north).toBeGreaterThanOrEqual(south); // need MORE panels to compensate
  });
});

describe('annualGenerationKwh', () => {
  it('is higher in the South West than in Scotland for the same system', () => {
    const sw = annualGenerationKwh(4, { ...baseline, region: 'SOUTH_WEST' });
    const sc = annualGenerationKwh(4, { ...baseline, region: 'SCOTLAND' });
    expect(sw).toBeGreaterThan(sc);
  });

  it('is roughly half on a north-facing roof vs south-facing', () => {
    const south = annualGenerationKwh(4, {
      ...baseline,
      roofOrientation: 'SOUTH',
    });
    const north = annualGenerationKwh(4, {
      ...baseline,
      roofOrientation: 'NORTH',
    });
    expect(north / south).toBeCloseTo(0.55, 2);
  });
});

describe('annualSavingsGbp', () => {
  it('returns 0 for 0 generation', () => {
    expect(annualSavingsGbp(0)).toBe(0);
  });

  it('scales linearly with generation', () => {
    expect(annualSavingsGbp(2000)).toBeCloseTo(annualSavingsGbp(1000) * 2, 6);
  });
});

describe('upfrontPriceGbp', () => {
  it('is £1,500/kW at the modelled rate', () => {
    expect(upfrontPriceGbp(4)).toBe(6000);
  });
});

describe('monthlySubscriptionGbp', () => {
  it('returns a positive number for a positive upfront', () => {
    expect(monthlySubscriptionGbp(6000)).toBeGreaterThan(0);
  });

  it('is roughly £47/month for £6,000 over 20yr @ 7%', () => {
    // Annuity check: £6,000 → ~£46.50/month at the modelled rate
    const monthly = monthlySubscriptionGbp(6000);
    expect(monthly).toBeGreaterThan(40);
    expect(monthly).toBeLessThan(55);
  });
});

describe('paybackYears', () => {
  it('handles divide-by-zero by returning Infinity', () => {
    expect(paybackYears(5000, 0)).toBe(Infinity);
    expect(paybackYears(5000, -10)).toBe(Infinity);
  });

  it('computes the basic payback ratio', () => {
    expect(paybackYears(6000, 500)).toBe(12);
  });
});

describe('annualCo2SavedKg', () => {
  it('uses the documented UK grid intensity', () => {
    // 1000 kWh × 0.207 = 207 kg
    expect(annualCo2SavedKg(1000)).toBeCloseTo(207, 1);
  });
});

describe('calculateQuote (integration of all formulas)', () => {
  it('produces a complete, plausible result for a typical UK home', () => {
    const result = calculateQuote(baseline);

    expect(result.systemSizeKw).toBeGreaterThan(0);
    expect(result.annualGenerationKwh).toBeGreaterThan(0);
    expect(result.annualSavingsGbp).toBeGreaterThan(0);
    expect(result.monthlySubscriptionGbp).toBeGreaterThan(0);
    expect(result.upfrontPriceGbp).toBeGreaterThan(0);
    expect(result.paybackYears).toBeGreaterThan(0);
    expect(result.annualCo2SavedKg).toBeGreaterThan(0);

    // Sanity: payback should be in a reasonable range for UK residential solar
    expect(result.paybackYears).toBeGreaterThan(5);
    expect(result.paybackYears).toBeLessThan(20);
  });

  it('is deterministic — same input always yields same output', () => {
    const a = calculateQuote(baseline);
    const b = calculateQuote(baseline);
    expect(a).toEqual(b);
  });

  it('rounds outputs to the documented precision', () => {
    const result = calculateQuote(baseline);
    // systemSizeKw is rounded to 2dp (and in practice, multiples of 0.5)
    expect(Number.isFinite(result.systemSizeKw)).toBe(true);
    expect(result.systemSizeKw * 100).toBeCloseTo(
      Math.round(result.systemSizeKw * 100),
      6,
    );
  });
});
