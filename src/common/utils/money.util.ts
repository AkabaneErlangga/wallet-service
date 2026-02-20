import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

export function normalizeAmount(input: string | number) {
  const amount = new Prisma.Decimal(input);

  if (amount.lte(0)) {
    throw new BadRequestException('Amount must be greater than zero');
  }

  const rounded = amount.toDecimalPlaces(2);

  if (rounded.lt(new Prisma.Decimal(0.01))) {
    throw new BadRequestException('Minimum amount is 0.01');
  }

  return rounded;
}