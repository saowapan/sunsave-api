import { z } from 'zod';

/**
 * The full set of UK property types we support.
 * Matches the Prisma enum exactly (intentional duplication — see below).
 */

export const PropertyTypeSchema = z.enum([
  'DETACHED',
  'SEMI_DETACHED',
  'MID_TERRACE',
  'END_TERRACE',
  'FLAT',
  'BUNGALOW',
]);

export type PropertyType = z.infer<typeof PropertyTypeSchema>;

/**
 * UK regions. Granularity matches typical solar-irradiance data —
 * finer than this would need postcode-level lookups.
 */
export const RegionSchema = z.enum([
  'LONDON',
  'SOUTH_EAST',
  'SOUTH_WEST',
  'MIDLANDS',
  'NORTH',
  'SCOTLAND',
  'WALES',
  'NORTHERN_IRELAND',
]);

export type Region = z.infer<typeof RegionSchema>;

/**
 * Roof orientation. North is included for completeness but warned against
 * (the calculation will return a much lower yield).
 */
export const OrientationSchema = z.enum([
  'SOUTH',
  'SOUTH_EAST',
  'SOUTH_WEST',
  'EAST',
  'WEST',
  'NORTH',
]);

export type Orientation = z.infer<typeof OrientationSchema>;

/**
 * Inputs the user provides via the signup wizard.
 * One schema, validated on both the frontend form and the backend API.
 */
export const QuoteInputsSchema = z.object({
  propertyType: PropertyTypeSchema,
  region: RegionSchema,
  roofOrientation: OrientationSchema,
  // Monthly electricity bill in GBP. 10 is below any real bill, 2000 is
  // a sanity cap to catch typos like extra zeros.
  monthlyBillGbp: z.number().positive().min(10).max(2000),
});
export type QuoteInputs = z.infer<typeof QuoteInputsSchema>;

/**
 * Outputs returned to the user.
 * Stored on the Quote row so a shared link is stable even if formulas change.
 */
export interface QuoteResult {
  systemSizeKw: number;
  annualGenerationKwh: number;
  annualSavingsGbp: number;
  monthlySubscriptionGbp: number;
  upfrontPriceGbp: number;
  paybackYears: number;
  annualCo2SavedKg: number;
}
