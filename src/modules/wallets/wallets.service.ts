import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Wallet as PrismaWallet } from '@prisma/client';
import { normalizeAmount } from 'src/common/utils/money.util';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { TopupWalletDto } from './dto/topup-wallet.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';
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

  async update(id: number, updateWalletDto: UpdateWalletDto): Promise<Wallet> {
    await this.findOne(id);
    const data: Prisma.WalletUncheckedUpdateInput = {
      ...(updateWalletDto.currency && { currency: updateWalletDto.currency }),
    };
    const wallet = await this.prisma.wallet.update({ where: { id }, data });
    return this.toEntity(wallet);
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);
    await this.prisma.wallet.delete({ where: { id } });
  }

  async topup(dto: TopupWalletDto): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // 1. Find wallet
      const wallet = await tx.wallet.findUnique({
        where: { id: dto.walletId }
      });

      if (!wallet) throw new NotFoundException();

      if (wallet.status === 'SUSPENDED') {
        throw new Error('Wallet suspended');
      }

      // 2. Normalize amount
      const amount = normalizeAmount(dto.amount);

      // 3. Update balance
      await tx.wallet.update({
        where: { id: dto.walletId },
        data: {
          balance: wallet.balance.plus(amount)
        }
      });

      // 4. Insert ledger
      await tx.ledger.create({
        data: {
          walletId: dto.walletId,
          type: 'TOPUP',
          amount,
          currency: wallet.currency,
          idempotencyKey: dto.idempotencyKey
        }
      });
    })
  }

  async transfer(id: number, dto: { amount: string | number; idempotencyKey: string }): Promise<void> {
    await this.prisma.$transaction(async (tx) => {

      const amount = normalizeAmount(dto.amount);

      const wallet = await tx.wallet.findUnique({
        where: { id }
      });

      if (!wallet) throw new NotFoundException();

      const result = await tx.wallet.updateMany({
        where: {
          id: id,
          status: 'ACTIVE',
          balance: { gte: amount }
        },
        data: {
          balance: { decrement: amount }
        }
      });

      if (result.count === 0) {
        throw new Error('Insufficient balance');
      }

      await tx.ledger.create({
        data: {
          walletId: id,
          type: 'PAYMENT',
          amount,
          currency: wallet.currency,
          idempotencyKey: dto.idempotencyKey
        }
      });
    });
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
