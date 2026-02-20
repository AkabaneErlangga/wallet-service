import { IsNumber, IsPositive, IsString } from 'class-validator';

export class TransferWalletDto {
  @IsString()
  fromWalletId: string;

  @IsString()
  toWalletId: string;

  @IsNumber()
  @IsPositive()
  amount: number;

  @IsString()
  idempotencyKey: string;
}
