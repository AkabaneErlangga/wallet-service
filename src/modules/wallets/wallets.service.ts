import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Wallet as PrismaWallet } from '@prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';
import { Wallet, WalletStatus } from './entities/wallet.entity';

@Injectable()
export class WalletsService {
  constructor(private readonly prisma: PrismaService) {}

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
