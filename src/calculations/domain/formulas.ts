import type { QuoteInputs, QuoteResult } from './types';
import {
  REGION_ANNUAL_YIELD_KWH_PER_KWP,
  ORIENTATION_FACTOR,
  MAX_SYSTEM_SIZE_KW,
  ELECTRICITY_UNIT_PRICE_GBP_PER_KWH,
  SELF_CONSUMPTION_RATE,
  EXPORT_TARIFF_GBP_PER_KWH,
  INSTALL_COST_GBP_PER_KW,
  SUBSCRIPTION_TERM_YEARS,
  SUBSCRIPTION_INTEREST_RATE,
  GRID_CARBON_INTENSITY_KG_PER_KWH,
} from './constants';

/**
 * Estimate annual electricity consumption from a stated monthly bill.
 *
 * monthlyBill (GBP) × 12 / unitPrice (GBP/kWh) = annual kWh.
 * Ignores fixed standing charges, so slightly over-estimates consumption —
 * acceptable for a quote-level estimate.
 */
export function estimateAnnualConsumptionKwh(monthlyBillGbp: number): number {
  return (monthlyBillGbp * 12) / ELECTRICITY_UNIT_PRICE_GBP_PER_KWH;
}

/**
 * Recommend a system size to cover ~110% of annual consumption,
 * capped by what the roof can physically fit for that property type.
 *
 * Why 110%? Solar generation is summer-heavy and consumption is winter-heavy,
 * so a slight oversize keeps annual coverage near 1.0 once self-consumption
 * and export are factored in. We round to the nearest 0.5 kW because panels
 * come in discrete sizes.
 */
export function recommendSystemSizeKw(inputs: QuoteInputs): number {
  const annualConsumption = estimateAnnualConsumptionKwh(inputs.monthlyBillGbp);
  const yieldPerKwp =
    REGION_ANNUAL_YIELD_KWH_PER_KWP[inputs.region] *
    ORIENTATION_FACTOR[inputs.roofOrientation];

  // Size that would cover 110% of consumption
  const ideal = (annualConsumption * 1.1) / yieldPerKwp;

  // Cap by physical roof capacity
  const cap = MAX_SYSTEM_SIZE_KW[inputs.propertyType];

  // Round to nearest 0.5 kW for realistic sizing
  const sized = Math.min(ideal, cap);
  return Math.max(roundToHalf(sized), 1.0); // floor at 1 kW minimum useful size
}

/**
 * Annual generation for a sized system at this location and orientation.
 */
export function annualGenerationKwh(
  systemSizeKw: number,
  inputs: QuoteInputs,
): number {
  return (
    systemSizeKw *
    REGION_ANNUAL_YIELD_KWH_PER_KWP[inputs.region] *
    ORIENTATION_FACTOR[inputs.roofOrientation]
  );
}

/**
 * Annual savings combine two streams:
 *   1. Avoided imports — solar self-consumed at the retail unit price
 *   2. Export income — surplus sold back to the grid at the SEG rate
 */
export function annualSavingsGbp(generationKwh: number): number {
  const selfConsumed = generationKwh * SELF_CONSUMPTION_RATE;
  const exported = generationKwh * (1 - SELF_CONSUMPTION_RATE);
  return (
    selfConsumed * ELECTRICITY_UNIT_PRICE_GBP_PER_KWH +
    exported * EXPORT_TARIFF_GBP_PER_KWH
  );
}

/**
 * Upfront cost of the system at typical UK install rates.
 */
export function upfrontPriceGbp(systemSizeKw: number): number {
  return systemSizeKw * INSTALL_COST_GBP_PER_KW;
}

/**
 * Monthly subscription price, computed by amortising the install cost over
 * SUBSCRIPTION_TERM_YEARS at SUBSCRIPTION_INTEREST_RATE (annuity formula).
 *
 *   M = P × (r × (1+r)^n) / ((1+r)^n − 1)
 *
 * where P = principal, r = monthly rate, n = number of months.
 */
export function monthlySubscriptionGbp(upfrontGbp: number): number {
  const months = SUBSCRIPTION_TERM_YEARS * 12;
  const monthlyRate = SUBSCRIPTION_INTEREST_RATE / 12;
  const growth = Math.pow(1 + monthlyRate, months);
  return (upfrontGbp * (monthlyRate * growth)) / (growth - 1);
}

/**
 * Simple payback period — how many years until savings equal the upfront cost.
 * Doesn't discount future savings; a finance-purist DCF would.
 */
export function paybackYears(
  upfrontGbp: number,
  annualSavings: number,
): number {
  if (annualSavings <= 0) return Infinity;
  return upfrontGbp / annualSavings;
}

/**
 * Carbon dioxide avoided per year by displacing grid electricity.
 */
export function annualCo2SavedKg(generationKwh: number): number {
  return generationKwh * GRID_CARBON_INTENSITY_KG_PER_KWH;
}

/**
 * Top-level: combine all formulas into a full quote.
 *
 * This is the only function callers need. The individual formulas are
 * exported for testability and future reuse, not because callers should
 * compose them by hand.
 */
export function calculateQuote(inputs: QuoteInputs): QuoteResult {
  const systemSizeKw = recommendSystemSizeKw(inputs);
  const generationKwh = annualGenerationKwh(systemSizeKw, inputs);
  const savings = annualSavingsGbp(generationKwh);
  const upfront = upfrontPriceGbp(systemSizeKw);
  const monthly = monthlySubscriptionGbp(upfront);
  const payback = paybackYears(upfront, savings);
  const co2 = annualCo2SavedKg(generationKwh);

  return {
    systemSizeKw: round(systemSizeKw, 2),
    annualGenerationKwh: round(generationKwh, 0),
    annualSavingsGbp: round(savings, 2),
    monthlySubscriptionGbp: round(monthly, 2),
    upfrontPriceGbp: round(upfront, 2),
    paybackYears: round(payback, 1),
    annualCo2SavedKg: round(co2, 0),
  };
}

// --- internal helpers ---

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function roundToHalf(value: number): number {
  return Math.round(value * 2) / 2;
}
