import { IsInt, IsNumber, IsPositive, IsString, Min } from 'class-validator';

export class TopupWalletDto {
	@IsInt()
	@Min(1)
	walletId: number;

	@IsNumber()
	@IsPositive()
	amount: number;

  @IsString()
  idempotencyKey: string;
}