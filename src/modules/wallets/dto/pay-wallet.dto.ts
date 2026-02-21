import { IsInt, IsNumber, IsPositive, IsString, Min } from 'class-validator';

export class PayWalletDto {

  @IsInt()
  @Min(1)
  id: number;

  @IsNumber()
  @IsPositive()
  amount: number;

  @IsString()
  idempotencyKey: string;
}
