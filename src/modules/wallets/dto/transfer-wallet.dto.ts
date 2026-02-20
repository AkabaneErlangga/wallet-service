import { IsInt, IsNumber, IsPositive, IsString, Min } from 'class-validator';

export class TransferWalletDto {
  @IsInt()
  @Min(1)
  fromWalletId: number;

  @IsInt()
  @Min(1)
  toWalletId: number;

  @IsNumber()
  @IsPositive()
  amount: number;

  @IsString()
  idempotencyKey: string;
}
