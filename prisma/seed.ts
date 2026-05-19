import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { calculateQuote } from '../src/calculations/domain/formulas';
import type {
  PropertyType,
  Region,
  Orientation,
} from '../src/calculations/domain/types';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const PROPERTY_TYPES: PropertyType[] = [
  'DETACHED', 'SEMI_DETACHED', 'MID_TERRACE', 'END_TERRACE', 'FLAT', 'BUNGALOW',
];
const REGIONS: Region[] = [
  'LONDON', 'SOUTH_EAST', 'SOUTH_WEST', 'MIDLANDS',
  'NORTH', 'SCOTLAND', 'WALES', 'NORTHERN_IRELAND',
];
const ORIENTATIONS: Orientation[] = [
  'SOUTH', 'SOUTH_EAST', 'SOUTH_WEST', 'EAST', 'WEST', 'NORTH',
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
  console.log('Seeding 30 sample quotes...');

  await prisma.quote.deleteMany();

  for (let i = 0; i < 30; i++) {
    const inputs = {
      propertyType: pick(PROPERTY_TYPES),
      region: pick(REGIONS),
      roofOrientation: pick(ORIENTATIONS),
      monthlyBillGbp: 50 + Math.floor(Math.random() * 200),
    };
    const result = calculateQuote(inputs);
    await prisma.quote.create({
      data: {
        ...inputs,
        ...result,
        createdAt: new Date(
          Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000),
        ),
      },
    });
  }

  console.log('Done.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());