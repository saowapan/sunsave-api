import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { QuotesService } from './quotes.service';
import { ZodValidationPipe } from './pipes/zod-validation.pipe';
import { CreateQuoteSchema, type CreateQuoteDto } from './dto/create-quote.dto';
import type { QuoteResponseDto } from './dto/quote-response.dto';

@Controller('quotes')
export class QuotesController {
  constructor(private readonly quotes: QuotesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED) // 201, not the default 200
  async create(
    @Body(new ZodValidationPipe(CreateQuoteSchema)) body: CreateQuoteDto,
  ): Promise<QuoteResponseDto> {
    return this.quotes.create(body);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<QuoteResponseDto> {
    return this.quotes.findById(id);
  }

  @Get()
  async findRecent(
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ): Promise<QuoteResponseDto[]> {
    return this.quotes.findRecent(limit);
  }
}
