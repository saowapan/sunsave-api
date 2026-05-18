import type { PropertyType, Region, Orientation } from './types';

/**
 * Calibration constants for the UK solar quote calculator.
 *
 * All values are documented with sources and are deliberately simplified —
 * a production system would pull these from a config service or feature flags,
 * not hardcode them. Keeping them here makes the math auditable in one place
 * for the prototype.
 */

/**
 * Annual solar yield per region, in kWh per kWp of installed capacity.
 *
 * "kWp" = kilowatt-peak, the rated output of a panel under standard conditions.
 * A 4 kWp system in London generating 950 kWh/kWp produces 3,800 kWh/year.
 *
 * Sources:
 * - MCS Solar PV Standard (MCS 005) — irradiance zones for UK installations
 * - PVGIS (European Commission Joint Research Centre) — long-term averages
 *   https://re.jrc.ec.europa.eu/pvg_tools/en/
 *
 * Values rounded to nearest 10 — the underlying data has ~5% year-to-year variance,
 * so spurious precision is misleading.
 */

export const REGION_ANNUAL_YIELD_KWH_PER_KWP: Record<Region, number> = {
  LONDON: 950,
  SOUTH_EAST: 970,
  SOUTH_WEST: 980,
  MIDLANDS: 900,
  NORTH: 830,
  SCOTLAND: 780,
  WALES: 870,
  NORTHERN_IRELAND: 820,
};

/**
 * Orientation factor — multiplier applied to the regional yield.
 *
 * South-facing is the reference (1.0). Other orientations are derated.
 * Source: MCS PV irradiance tables. East/West roofs are penalised ~15%;
 * north is roughly half of south.
 */
export const ORIENTATION_FACTOR: Record<Orientation, number> = {
  SOUTH: 1.0,
  SOUTH_EAST: 0.96,
  SOUTH_WEST: 0.96,
  EAST: 0.85,
  WEST: 0.85,
  NORTH: 0.55,
};

/**
 * Typical maximum usable roof area expressed as installable kWp,
 * by UK property type. These are rule-of-thumb caps — real installations
 * need a roof survey.
 *
 * Source: Energy Saving Trust home solar guidance (2024) + MCS installer norms.
 */
export const MAX_SYSTEM_SIZE_KW: Record<PropertyType, number> = {
  DETACHED: 6.0,
  SEMI_DETACHED: 5.0,
  BUNGALOW: 5.0,
  END_TERRACE: 4.0,
  MID_TERRACE: 3.5,
  FLAT: 2.0,
};

/**
 * UK average electricity unit price for domestic users, GBP per kWh.
 *
 * Source: Ofgem Energy Price Cap (Q2 2025, default tariff direct debit).
 * Real bills include a fixed daily standing charge; we approximate with a
 * blended unit price since we only know the monthly total.
 */
export const ELECTRICITY_UNIT_PRICE_GBP_PER_KWH = 0.27;

/**
 * Fraction of self-generated solar consumed on-site (vs exported to grid).
 *
 * Without a battery, UK homes typically self-consume ~35-45% of solar output;
 * the rest is exported (and earns much less under SEG tariffs). With a
 * battery this rises to 70%+ but cost increases proportionally.
 *
 * We model the no-battery case; a battery flag could be added later.
 *
 * Source: BRE / UCL 2023 paper on UK domestic solar self-consumption patterns.
 */

export const SELF_CONSUMPTION_RATE = 0.4;
/**
 * Smart Export Guarantee — average UK rate paid for exported solar in 2025.
 * Source: Ofgem, weighted average across major suppliers.
 */
export const EXPORT_TARIFF_GBP_PER_KWH = 0.08;

/**
 * Approximate installed cost per kW of solar capacity in the UK (2025),
 * including panels, inverter, scaffolding, labour, and certification.
 *
 * Source: MCS quarterly installer report; varies ~£1,400-£1,800 per kW.
 */
export const INSTALL_COST_GBP_PER_KW = 1500;

/**
 * Subscription pricing parameters.
 *
 * We amortise the upfront cost over 20 years (typical solar lifetime) at a
 * 7% effective interest rate (covering financing + maintenance + service margin).
 *
 * The result is what a subscription provider like Sunsave would charge per
 * month so that revenue covers cost-plus over the asset's life.
 */
export const SUBSCRIPTION_TERM_YEARS = 20;
export const SUBSCRIPTION_INTEREST_RATE = 0.07;

/**
 * UK grid carbon intensity, kg CO₂ per kWh of electricity.
 *
 * Each kWh of solar avoids this much grid generation.
 *
 * Source: National Grid ESO "Carbon Intensity API" 2025 annual average.
 * Has fallen sharply over the last decade as coal has phased out.
 */
export const GRID_CARBON_INTENSITY_KG_PER_KWH = 0.207;
