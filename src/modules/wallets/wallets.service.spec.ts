import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { WalletStatus } from './entities/wallet.entity';
import { WalletsService } from './wallets.service';

type Wallet = {
  id: number;
  ownerId: number;
  currency: string;
  balance: { toString: () => string };
  status: string;
};

const mockPrisma = {
  wallet: {
    findUnique: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
    delete: jest.fn(),
  },
};

describe('WalletsService', () => {
  let service: WalletsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get<WalletsService>(WalletsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('updateStatus', () => {
    it('throws if wallet not found', async () => {
      mockPrisma.wallet.findUnique.mockResolvedValue(null);
      await expect(service.updateStatus(1, WalletStatus.ACTIVE)).rejects.toThrow('Wallet not found');
    });

    it('updates status', async () => {
      const wallet = { id: 1, ownerId: 1, currency: 'USD', balance: { toString: () => '100' }, status: 'ACTIVE' };
      mockPrisma.wallet.findUnique.mockResolvedValue(wallet);
      mockPrisma.wallet.update.mockResolvedValue({ ...wallet, status: 'SUSPENDED' });
      const result = await service.updateStatus(1, WalletStatus.SUSPENDED);
      expect(result.status).toBe(WalletStatus.SUSPENDED);
      expect(mockPrisma.wallet.update).toHaveBeenCalledWith({ where: { id: 1 }, data: { status: WalletStatus.SUSPENDED } });
    });
  });

  describe('create', () => {
    it('creates a wallet', async () => {
      const dto = { ownerId: 1, currency: 'USD' };
      const wallet = { id: 1, ownerId: 1, currency: 'USD', balance: { toString: () => '0' }, status: 'ACTIVE' };
      mockPrisma.wallet.create.mockResolvedValue(wallet);
      const result = await service.create(dto);
      expect(result.id).toBe(1);
      expect(mockPrisma.wallet.create).toHaveBeenCalledWith({ data: expect.objectContaining(dto) });
    });
  });

  describe('findAll', () => {
    it('returns all wallets', async () => {
      const wallets = [
        { id: 1, ownerId: 1, currency: 'USD', balance: { toString: () => '100' }, status: 'ACTIVE' },
        { id: 2, ownerId: 2, currency: 'EUR', balance: { toString: () => '200' }, status: 'ACTIVE' },
      ];
      mockPrisma.wallet.findMany.mockResolvedValue(wallets);
      const result = await service.findAll();
      expect(result.length).toBe(2);
    });
  });

  describe('findOne', () => {
    it('throws if not found', async () => {
      mockPrisma.wallet.findUnique.mockResolvedValue(null);
      await expect(service.findOne(1)).rejects.toThrow('Wallet #1 not found');
    });
    it('returns wallet', async () => {
      const wallet = { id: 1, ownerId: 1, currency: 'USD', balance: { toString: () => '100' }, status: 'ACTIVE' };
      mockPrisma.wallet.findUnique.mockResolvedValue(wallet);
      const result = await service.findOne(1);
      expect(result.id).toBe(1);
    });
  });

  // You can add mocks and tests for topup, transfer, pay as needed
});
