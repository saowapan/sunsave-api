import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { QuotesService } from './quotes.service';
import { PrismaService } from '../prisma/prisma.service';
import { CalculationsService } from '../calculations/calculations.service';
import type { Quote } from '@prisma/client';

describe('QuotesService', () => {
  let service: QuotesService;
  let prisma: {
    quote: {
      create: jest.Mock;
      findUnique: jest.Mock;
      findMany: jest.Mock;
    };
  };
  let calculations: { generateQuote: jest.Mock };

  beforeEach(async () => {
    prisma = {
      quote: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
    };
    calculations = { generateQuote: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuotesService,
        { provide: PrismaService, useValue: prisma },
        { provide: CalculationsService, useValue: calculations },
      ],
    }).compile();

    service = module.get<QuotesService>(QuotesService);
  });

  describe('create', () => {
    it('calls calculations, then persists the merged row', async () => {
      const inputs = {
        propertyType: 'SEMI_DETACHED' as const,
        region: 'LONDON' as const,
        roofOrientation: 'SOUTH' as const,
        monthlyBillGbp: 100,
      };
      const result = {
        systemSizeKw: 4,
        annualGenerationKwh: 3800,
        annualSavingsGbp: 500,
        monthlySubscriptionGbp: 45,
        upfrontPriceGbp: 6000,
        paybackYears: 12,
        annualCo2SavedKg: 786,
      };
      const dbRow: Quote = {
        id: 'test-id',
        createdAt: new Date('2026-01-01T00:00:00Z'),
        ...inputs,
        ...result,
      };

      calculations.generateQuote.mockReturnValue(result);
      prisma.quote.create.mockResolvedValue(dbRow);

      const response = await service.create(inputs);

      expect(calculations.generateQuote).toHaveBeenCalledWith(inputs);
      expect(prisma.quote.create).toHaveBeenCalledWith({
        data: { ...inputs, ...result },
      });
      expect(response.id).toBe('test-id');
      expect(response.systemSizeKw).toBe(4);
      expect(response.createdAt).toBe('2026-01-01T00:00:00.000Z');
    });
  });

  describe('findById', () => {
    it('returns the mapped DTO when found', async () => {
      const dbRow: Quote = {
        id: 'abc',
        createdAt: new Date('2026-01-01T00:00:00Z'),
        propertyType: 'FLAT',
        region: 'LONDON',
        roofOrientation: 'EAST',
        monthlyBillGbp: 60,
        systemSizeKw: 2,
        annualGenerationKwh: 1500,
        annualSavingsGbp: 200,
        monthlySubscriptionGbp: 25,
        upfrontPriceGbp: 3000,
        paybackYears: 15,
        annualCo2SavedKg: 310,
      };
      prisma.quote.findUnique.mockResolvedValue(dbRow);

      const result = await service.findById('abc');

      expect(prisma.quote.findUnique).toHaveBeenCalledWith({
        where: { id: 'abc' },
      });
      expect(result.id).toBe('abc');
    });

    it('throws NotFoundException when the quote is missing', async () => {
      prisma.quote.findUnique.mockResolvedValue(null);

      await expect(service.findById('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findRecent', () => {
    it('caps the limit at 100', async () => {
      prisma.quote.findMany.mockResolvedValue([]);

      await service.findRecent(99999);

      expect(prisma.quote.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
    });

    it('defaults to a reasonable limit', async () => {
      prisma.quote.findMany.mockResolvedValue([]);

      await service.findRecent();

      expect(prisma.quote.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
        take: 20,
      });
    });
  });
});
