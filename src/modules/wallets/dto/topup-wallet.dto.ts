import { IsNumber, IsPositive, IsString } from 'class-validator';

export class TopupWalletDto {
	@IsNumber()
	walletId: number;

	@IsNumber()
	@IsPositive()
	amount: number;

  @IsString()
  idempotencyKey: string;
}