import { Injectable } from '@nestjs/common';
import { calculateQuote } from './domain/formulas';
import type { QuoteInputs, QuoteResult } from './domain/types';

@Injectable()
export class CalculationsService {
  /**
   * Thin adapter over the pure `calculateQuote` function.
   *
   * Other modules inject this service rather than importing the pure
   * function directly, so we can later add cross-cutting concerns
   * (logging, metrics, feature flags) in one place without touching
   * the domain logic.
   */
  generateQuote(inputs: QuoteInputs): QuoteResult {
    return calculateQuote(inputs);
  }
}
