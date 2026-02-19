import { ApiProperty } from '@nestjs/swagger';

export enum WalletStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export class Wallet {
  @ApiProperty({ description: 'Unique wallet identifier', example: 1 })
  id: number;

  @ApiProperty({ description: 'ID of the wallet owner (user)', example: 1 })
  ownerId: number;

  @ApiProperty({ description: 'Currency code', example: 'USD' })
  currency: string;

  @ApiProperty({ description: 'Current balance', example: '0.00' })
  balance: string;

  @ApiProperty({
    description: 'Wallet status',
    enum: WalletStatus,
    example: WalletStatus.ACTIVE,
  })
  status: WalletStatus;
}
