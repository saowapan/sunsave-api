import type { QuoteResult } from 'src/calculations/domain/types';
import type {
  PropertyType,
  Region,
  Orientation,
} from 'src/calculations/domain/types';

export interface QuoteResponseDto extends QuoteResult {
  id: string;
  createdAt: string;
  propertyType: PropertyType;
  region: Region;
  roofOrientation: Orientation;
  monthlyBillGbp: number;
}
