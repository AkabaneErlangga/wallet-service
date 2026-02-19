import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class CreateWalletDto {
  @ApiProperty({ description: 'The ID of the wallet owner (user)', example: 1 })
  @IsInt()
  @Min(1)
  ownerId: number;

  @ApiProperty({
    description: 'ISO 4217 currency code or crypto ticker',
    example: 'USD',
  })
  @IsString()
  @IsNotEmpty()
  currency: string;
}
