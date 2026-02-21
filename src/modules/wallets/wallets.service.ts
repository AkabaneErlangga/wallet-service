import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Wallet as PrismaWallet } from '@prisma/client';
import { normalizeAmount } from 'src/common/utils/money.util';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { PayWalletDto } from './dto/pay-wallet.dto';
import { TopupWalletDto } from './dto/topup-wallet.dto';
import { TransferWalletDto } from './dto/transfer-wallet.dto';
import { Wallet, WalletStatus } from './entities/wallet.entity';

@Injectable()
export class WalletsService {
  constructor(private readonly prisma: PrismaService) { }

  async create(createWalletDto: CreateWalletDto): Promise<Wallet> {
    const data: Prisma.WalletUncheckedCreateInput = {
      ownerId: createWalletDto.ownerId,
      currency: createWalletDto.currency,
      balance: 0,
    };
    const wallet = await this.prisma.wallet.create({ data });
    return this.toEntity(wallet);
  }

  async findAll(): Promise<Wallet[]> {
    const wallets = await this.prisma.wallet.findMany();
    return wallets.map((w) => this.toEntity(w));
  }

  async findOne(id: number): Promise<Wallet> {
    const wallet = await this.prisma.wallet.findUnique({ where: { id } });
    if (!wallet) {
      throw new NotFoundException(`Wallet #${id} not found`);
    }
    return this.toEntity(wallet);
  }

  async topup(dto: TopupWalletDto): Promise<Wallet> {
    let updatedWallet: PrismaWallet;

    await this.prisma.$transaction(async (tx) => {

      const wallet = await tx.wallet.findUnique({
        where: { id: dto.walletId }
      });

      if (!wallet) throw new NotFoundException();

      if (wallet.status !== 'ACTIVE') {
        throw new BadRequestException('Wallet suspended');
      }

      const amount = normalizeAmount(dto.amount);

      updatedWallet = await tx.wallet.update({
        where: { id: dto.walletId },
        data: {
          balance: { increment: amount }
        }
      });

      await tx.ledger.create({
        data: {
          walletId: dto.walletId,
          type: 'TOPUP',
          amount,
          currency: wallet.currency,
          idempotencyKey: dto.idempotencyKey
        }
      });

    });

    return this.toEntity(updatedWallet!);
  }

  async transfer(dto: TransferWalletDto): Promise<Wallet> {
    let updatedToWallet: PrismaWallet;
    await this.prisma.$transaction(async (tx) => {
      const fromWallet = await tx.wallet.findUnique({
        where: { id: +dto.fromWalletId }
      });

      const toWallet = await tx.wallet.findUnique({
        where: { id: +dto.toWalletId }
      });

      if (!fromWallet || !toWallet) {
        throw new NotFoundException();
      }

      if (fromWallet.currency !== toWallet.currency) {
        throw new BadRequestException('Currency mismatch');
      }

      if (fromWallet.status !== 'ACTIVE' || toWallet.status !== 'ACTIVE') {
        throw new BadRequestException('Wallet suspended');
      }

      if (dto.fromWalletId === dto.toWalletId) {
        throw new BadRequestException('Cannot transfer to same wallet');
      }

      const amount = normalizeAmount(dto.amount);

      // Atomic debit
      const debitResult = await tx.wallet.updateMany({
        where: {
          id: +dto.fromWalletId,
          balance: { gte: amount }
        },
        data: {
          balance: { decrement: amount }
        }
      });

      if (debitResult.count === 0) {
        throw new BadRequestException('Insufficient balance');
      }

      // Credit
      updatedToWallet = await tx.wallet.update({
        where: { id: +dto.toWalletId },
        data: {
          balance: { increment: amount }
        }
      });

      // Ledger
      await tx.ledger.createMany({
        data: [
          {
            walletId: +dto.fromWalletId,
            type: 'TRANSFER_OUT',
            amount,
            currency: fromWallet.currency,
            idempotencyKey: dto.idempotencyKey + '-OUT'
          },
          {
            walletId: +dto.toWalletId,
            type: 'TRANSFER_IN',
            amount,
            currency: toWallet.currency,
            idempotencyKey: dto.idempotencyKey + '-IN'
          }
        ]
      });
    });
    return this.toEntity(updatedToWallet!);
  }

  async pay(dto: PayWalletDto): Promise<Wallet> {
    let updatedWallet: PrismaWallet
    await this.prisma.$transaction(async (tx) => {

      const amount = normalizeAmount(dto.amount);

      const wallet = await tx.wallet.findUnique({
        where: { id: +dto.id }
      });

      const result = await tx.wallet.updateMany({
        where: {
          id: dto.id,
          status: 'ACTIVE',
          balance: { gte: amount }
        },
        data: {
          balance: { decrement: amount }
        }
      });

      if (result.count === 0) {
        throw new BadRequestException('Insufficient balance');
      }

      await tx.ledger.create({
        data: {
          walletId: dto.id,
          type: 'PAYMENT',
          amount,
          currency: wallet.currency,
          idempotencyKey: dto.idempotencyKey
        }
      });
      updatedWallet = await tx.wallet.findUnique({
        where: {id: +dto.id}
      })
    });
    return this.toEntity(updatedWallet)
  }

  private toEntity(wallet: PrismaWallet): Wallet {
    const entity = new Wallet();
    entity.id = wallet.id;
    entity.ownerId = wallet.ownerId;
    entity.currency = wallet.currency;
    entity.balance = wallet.balance.toString();
    entity.status = wallet.status as WalletStatus;
    return entity;
  }
}
