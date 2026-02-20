import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { TopupWalletDto } from './dto/topup-wallet.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';
import { Wallet } from './entities/wallet.entity';
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

  @Patch(':id')
  @ApiOperation({ summary: 'Update a wallet by ID' })
  @ApiOkResponse({ description: 'Wallet updated successfully', type: Wallet })
  @ApiNotFoundResponse({ description: 'Wallet not found' })
  @ApiBadRequestResponse({ description: 'Invalid request body' })
  update(
    @Param('id') id: string,
    @Body() updateWalletDto: UpdateWalletDto,
  ): Promise<Wallet> {
    return this.walletsService.update(+id, updateWalletDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a wallet by ID' })
  @ApiNoContentResponse({ description: 'Wallet deleted successfully' })
  @ApiNotFoundResponse({ description: 'Wallet not found' })
  remove(@Param('id') id: string): Promise<void> {
    return this.walletsService.remove(+id);
  }

  @Post('topup')
  @ApiOperation({ summary: 'Top up a wallet' })
  @ApiOkResponse({ description: 'Wallet topped up successfully', type: Wallet })
  @ApiBadRequestResponse({ description: 'Invalid request body' })
  topup(
    @Body() topupWalletDto: TopupWalletDto): Promise<void> {
    return this.walletsService.topup(topupWalletDto);
  }
}
