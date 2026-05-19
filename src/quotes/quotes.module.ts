import { Module } from '@nestjs/common';
import { QuotesController } from './quotes.controller';
import { QuotesService } from './quotes.service';
import { CalculationsModule } from '../calculations/calculations.module';

@Module({
  imports: [CalculationsModule], // we inject CalculationsService
  controllers: [QuotesController],
  providers: [QuotesService],
})
export class QuotesModule {}
