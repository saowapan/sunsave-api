import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CalculationsService } from '../calculations/calculations.service';
import type { CreateQuoteDto } from './dto/create-quote.dto';
import type { QuoteResponseDto } from './dto/quote-response.dto';
import type { Quote } from '@prisma/client';

@Injectable()
export class QuotesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly calculations: CalculationsService,
  ) {}

  /**
   * Validate inputs → run calculations → persist snapshot → return DTO.
   *
   * Inputs come in already-validated (the pipe handles that on the controller).
   */
  async create(inputs: CreateQuoteDto): Promise<QuoteResponseDto> {
    const result = this.calculations.generateQuote(inputs);

    const saved = await this.prisma.quote.create({
      data: {
        ...inputs,
        ...result,
      },
    });

    return this.toDto(saved);
  }

  async findById(id: string): Promise<QuoteResponseDto> {
    const quote = await this.prisma.quote.findUnique({ where: { id } });
    if (!quote) {
      throw new NotFoundException(`Quote ${id} not found`);
    }
    return this.toDto(quote);
  }

  /**
   * Recent quotes, newest first. Capped at a reasonable page size.
   * The admin dashboard will replace this with proper pagination.
   */
  async findRecent(limit = 20): Promise<QuoteResponseDto[]> {
    const quotes = await this.prisma.quote.findMany({
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 100), // hard cap to prevent runaway pulls
    });
    return quotes.map((q) => this.toDto(q));
  }

  /**
   * Map a Prisma Quote row to the API response shape.
   * Centralised so we don't sprinkle Date.toISOString() everywhere.
   */
  private toDto(quote: Quote): QuoteResponseDto {
    return {
      id: quote.id,
      createdAt: quote.createdAt.toISOString(),
      propertyType: quote.propertyType,
      region: quote.region,
      roofOrientation: quote.roofOrientation,
      monthlyBillGbp: quote.monthlyBillGbp,
      systemSizeKw: quote.systemSizeKw,
      annualGenerationKwh: quote.annualGenerationKwh,
      annualSavingsGbp: quote.annualSavingsGbp,
      monthlySubscriptionGbp: quote.monthlySubscriptionGbp,
      upfrontPriceGbp: quote.upfrontPriceGbp,
      paybackYears: quote.paybackYears,
      annualCo2SavedKg: quote.annualCo2SavedKg,
    };
  }
}
