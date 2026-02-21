import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags
} from '@nestjs/swagger';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { PayWalletDto } from './dto/pay-wallet.dto';
import { TopupWalletDto } from './dto/topup-wallet.dto';
import { TransferWalletDto } from './dto/transfer-wallet.dto';
import { Wallet, WalletStatus } from './entities/wallet.entity';
import { WalletsService } from './wallets.service';

@ApiTags('wallets')
@Controller('wallets')
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) { }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new wallet' })
  @ApiCreatedResponse({ description: 'Wallet created successfully', type: Wallet })
  @ApiBadRequestResponse({ description: 'Invalid request body' })
  create(@Body() createWalletDto: CreateWalletDto): Promise<Wallet> {
    return this.walletsService.create(createWalletDto);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve all wallets' })
  @ApiOkResponse({ description: 'List of wallets', type: [Wallet] })
  findAll(): Promise<Wallet[]> {
    return this.walletsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a wallet by ID' })
  @ApiOkResponse({ description: 'Wallet found', type: Wallet })
  @ApiNotFoundResponse({ description: 'Wallet not found' })
  findOne(@Param('id') id: string): Promise<Wallet> {
    return this.walletsService.findOne(+id);
  }

  @Post('topup')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Top up a wallet' })
  @ApiOkResponse({ description: 'Wallet topped up successfully', type: Wallet })
  @ApiBadRequestResponse({ description: 'Invalid request body' })
  @ApiBody({
    schema: {
      example: {
        walletId: 1,
        amount: 500,
        idempotencyKey: 'topup-unique-123',
      },
    },
  })
  topup(
    @Body() topupWalletDto: TopupWalletDto): Promise<Wallet> {
    return this.walletsService.topup(topupWalletDto);
  }

  @Post('transfer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Transfer funds from a wallet' })
  @ApiOkResponse({ description: 'Funds transferred successfully', type: Wallet })
  @ApiBadRequestResponse({ description: 'Invalid request body or insufficient balance' })
  @ApiBody({
    schema: {
      example: {
        fromWalletId: 1,
        toWalletId: 2,
        amount: 500,
        idempotencyKey: 'transfer-unique-123',
      },
    },
  })
  transfer(
    @Body() transferWalletDto: TransferWalletDto): Promise<Wallet> {
    return this.walletsService.transfer(transferWalletDto);
  }

  @Post('pay')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Pay from a wallet' })
  @ApiOkResponse({ description: 'Payment successfully', type: Wallet })
  @ApiBadRequestResponse({ description: 'Invalid request body or insufficient balance' })
  @ApiBody({
    schema: {
      example: {
        id: 1,
        amount: 500,
        idempotencyKey: 'payment-unique-123',
      },
    },
  })
  pay(
    @Body() payWalletDto: PayWalletDto): Promise<Wallet> {
    return this.walletsService.pay(payWalletDto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update wallet status' })
  @ApiOkResponse({ description: 'Wallet status updated successfully', type: Wallet })
  @ApiBadRequestResponse({ description: 'Invalid status or request body' })
  @ApiNotFoundResponse({ description: 'Wallet not found' })
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: WalletStatus,
  ): Promise<Wallet> {
    return this.walletsService.updateStatus(+id, status);
  }
}