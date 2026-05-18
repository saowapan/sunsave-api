import { Module } from '@nestjs/common';
import { CalculationsService } from './calculations.service';

@Module({
  providers: [CalculationsService],
  exports: [CalculationsService], // exported so other modules can inject it
})
export class CalculationsModule {}
