import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { WalletStatus } from './entities/wallet.entity';
import { WalletsService } from './wallets.service';

const D = (n: number) => new Prisma.Decimal(n);

const makeWallet = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  ownerId: 1,
  currency: 'USD',
  balance: D(100),
  status: 'ACTIVE',
  ...overrides,
});

// Transaction client mock
const mockTx = {
  wallet: {
    findUnique: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  ledger: {
    create: jest.fn(),
    createMany: jest.fn(),
  },
};

const mockPrisma = {
  $transaction: jest.fn(),
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
    // Execute transaction callback immediately with mockTx
    mockPrisma.$transaction.mockImplementation((cb: (tx: typeof mockTx) => Promise<unknown>) => cb(mockTx));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── updateStatus ────────────────────────────────────────────────────────────

  describe('updateStatus', () => {
    it('throws if wallet not found', async () => {
      mockPrisma.wallet.findUnique.mockResolvedValue(null);
      await expect(service.updateStatus(1, WalletStatus.ACTIVE)).rejects.toThrow('Wallet not found');
    });

    it('updates status', async () => {
      const wallet = makeWallet();
      mockPrisma.wallet.findUnique.mockResolvedValue(wallet);
      mockPrisma.wallet.update.mockResolvedValue({ ...wallet, status: 'SUSPENDED' });
      const result = await service.updateStatus(1, WalletStatus.SUSPENDED);
      expect(result.status).toBe(WalletStatus.SUSPENDED);
      expect(mockPrisma.wallet.update).toHaveBeenCalledWith({ where: { id: 1 }, data: { status: WalletStatus.SUSPENDED } });
    });
  });

  // ─── create ──────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('creates a wallet', async () => {
      const dto = { ownerId: 1, currency: 'USD' };
      const wallet = makeWallet({ balance: D(0) });
      mockPrisma.wallet.create.mockResolvedValue(wallet);
      const result = await service.create(dto);
      expect(result.id).toBe(1);
      expect(mockPrisma.wallet.create).toHaveBeenCalledWith({ data: expect.objectContaining(dto) });
    });
  });

  // ─── findAll ─────────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('returns all wallets', async () => {
      mockPrisma.wallet.findMany.mockResolvedValue([makeWallet({ id: 1 }), makeWallet({ id: 2, ownerId: 2 })]);
      const result = await service.findAll();
      expect(result.length).toBe(2);
    });
  });

  // ─── findOne ─────────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('throws if not found', async () => {
      mockPrisma.wallet.findUnique.mockResolvedValue(null);
      await expect(service.findOne(1)).rejects.toThrow('Wallet #1 not found');
    });

    it('returns wallet', async () => {
      mockPrisma.wallet.findUnique.mockResolvedValue(makeWallet());
      const result = await service.findOne(1);
      expect(result.id).toBe(1);
    });
  });

  // ─── topup ───────────────────────────────────────────────────────────────────

  describe('topup', () => {
    it('throws NotFoundException when wallet not found', async () => {
      mockTx.wallet.findUnique.mockResolvedValue(null);
      await expect(service.topup({ walletId: 1, amount: 50, idempotencyKey: 'k1' })).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when wallet is suspended', async () => {
      mockTx.wallet.findUnique.mockResolvedValue(makeWallet({ status: 'SUSPENDED' }));
      await expect(service.topup({ walletId: 1, amount: 50, idempotencyKey: 'k1' })).rejects.toThrow('Wallet suspended');
    });

    it('increments balance and creates ledger entry', async () => {
      const wallet = makeWallet();
      const updated = makeWallet({ balance: D(150) });
      mockTx.wallet.findUnique.mockResolvedValue(wallet);
      mockTx.wallet.update.mockResolvedValue(updated);
      mockTx.ledger.create.mockResolvedValue({});
      const result = await service.topup({ walletId: 1, amount: 50, idempotencyKey: 'topup-001' });
      expect(mockTx.wallet.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 1 }, data: { balance: { increment: expect.anything() } } }),
      );
      expect(mockTx.ledger.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ type: 'TOPUP', walletId: 1, idempotencyKey: 'topup-001' }) }),
      );
      expect(result.balance).toBe('150');
    });
  });

  // ─── pay ─────────────────────────────────────────────────────────────────────

  describe('pay', () => {
    it('throws NotFoundException when wallet not found', async () => {
      mockTx.wallet.findUnique.mockResolvedValue(null);
      await expect(service.pay({ id: 1, amount: 30, idempotencyKey: 'pay-001' })).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException on insufficient balance', async () => {
      mockTx.wallet.findUnique.mockResolvedValue(makeWallet({ balance: D(10) }));
      mockTx.wallet.updateMany.mockResolvedValue({ count: 0 });
      await expect(service.pay({ id: 1, amount: 50, idempotencyKey: 'pay-002' })).rejects.toThrow('Insufficient balance');
    });

    it('throws BadRequestException when wallet is suspended', async () => {
      mockTx.wallet.findUnique.mockResolvedValue(makeWallet({ status: 'SUSPENDED' }));
      mockTx.wallet.updateMany.mockResolvedValue({ count: 0 });
      await expect(service.pay({ id: 1, amount: 30, idempotencyKey: 'pay-003' })).rejects.toThrow('Wallet suspended');
    });

    it('decrements balance and creates ledger entry', async () => {
      const wallet = makeWallet();
      const updated = makeWallet({ balance: D(70) });
      mockTx.wallet.findUnique
        .mockResolvedValueOnce(wallet)    // initial fetch
        .mockResolvedValueOnce(updated);  // re-fetch after update
      mockTx.wallet.updateMany.mockResolvedValue({ count: 1 });
      mockTx.ledger.create.mockResolvedValue({});
      const result = await service.pay({ id: 1, amount: 30, idempotencyKey: 'pay-004' });
      expect(mockTx.wallet.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ data: { balance: { decrement: expect.anything() } } }),
      );
      expect(mockTx.ledger.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ type: 'PAYMENT', idempotencyKey: 'pay-004' }) }),
      );
      expect(result.balance).toBe('70');
    });
  });

  // ─── transfer ────────────────────────────────────────────────────────────────

  describe('transfer', () => {
    it('throws NotFoundException when either wallet not found', async () => {
      mockTx.wallet.findUnique
        .mockResolvedValueOnce(makeWallet({ id: 1 }))
        .mockResolvedValueOnce(null);
      await expect(service.transfer({ fromWalletId: 1, toWalletId: 2, amount: 50, idempotencyKey: 't-001' })).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException on currency mismatch', async () => {
      mockTx.wallet.findUnique
        .mockResolvedValueOnce(makeWallet({ id: 1, currency: 'USD' }))
        .mockResolvedValueOnce(makeWallet({ id: 2, currency: 'EUR' }));
      await expect(service.transfer({ fromWalletId: 1, toWalletId: 2, amount: 50, idempotencyKey: 't-002' })).rejects.toThrow('Currency mismatch');
    });

    it('throws BadRequestException when source wallet is suspended', async () => {
      mockTx.wallet.findUnique
        .mockResolvedValueOnce(makeWallet({ id: 1, status: 'SUSPENDED' }))
        .mockResolvedValueOnce(makeWallet({ id: 2 }));
      await expect(service.transfer({ fromWalletId: 1, toWalletId: 2, amount: 50, idempotencyKey: 't-003' })).rejects.toThrow('Wallet suspended');
    });

    it('throws BadRequestException on insufficient balance', async () => {
      mockTx.wallet.findUnique
        .mockResolvedValueOnce(makeWallet({ id: 1, balance: D(10) }))
        .mockResolvedValueOnce(makeWallet({ id: 2 }));
      mockTx.wallet.updateMany.mockResolvedValue({ count: 0 });
      await expect(service.transfer({ fromWalletId: 1, toWalletId: 2, amount: 50, idempotencyKey: 't-004' })).rejects.toThrow('Insufficient balance');
    });

    it('transfers funds and creates ledger entries', async () => {
      const fromWallet = makeWallet({ id: 1, balance: D(100) });
      const toWallet   = makeWallet({ id: 2, balance: D(50) });
      const updatedTo  = makeWallet({ id: 2, balance: D(100) });
      mockTx.wallet.findUnique
        .mockResolvedValueOnce(fromWallet)
        .mockResolvedValueOnce(toWallet);
      mockTx.wallet.updateMany.mockResolvedValue({ count: 1 });
      mockTx.wallet.update.mockResolvedValue(updatedTo);
      mockTx.ledger.createMany.mockResolvedValue({});
      const result = await service.transfer({ fromWalletId: 1, toWalletId: 2, amount: 50, idempotencyKey: 't-005' });
      expect(mockTx.wallet.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ data: { balance: { decrement: expect.anything() } } }),
      );
      expect(mockTx.wallet.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 2 }, data: { balance: { increment: expect.anything() } } }),
      );
      expect(mockTx.ledger.createMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.arrayContaining([
            expect.objectContaining({ type: 'TRANSFER_OUT', walletId: 1 }),
            expect.objectContaining({ type: 'TRANSFER_IN',  walletId: 2 }),
          ]),
        }),
      );
      expect(result.balance).toBe('100');
    });
  });

  // ─── Concurrent simulations ──────────────────────────────────────────────────

  describe('concurrent payment simulation', () => {
    it('processes multiple payments concurrently without cross-contamination', async () => {
      const walletA = makeWallet({ id: 1, balance: D(100) });
      const walletB = makeWallet({ id: 2, balance: D(200) });
      const afterA  = makeWallet({ id: 1, balance: D(70) });
      const afterB  = makeWallet({ id: 2, balance: D(150) });
      const fetchCount: Record<number, number> = { 1: 0, 2: 0 };

      // Route by id so interleaved calls don't collide
      mockTx.wallet.findUnique.mockImplementation(async ({ where: { id } }: { where: { id: number } }) => {
        fetchCount[id] = (fetchCount[id] ?? 0) + 1;
        if (id === 1) return fetchCount[1] === 1 ? walletA : afterA;
        if (id === 2) return fetchCount[2] === 1 ? walletB : afterB;
      });
      mockTx.wallet.updateMany.mockResolvedValue({ count: 1 });
      mockTx.ledger.create.mockResolvedValue({});

      const [resultA, resultB] = await Promise.all([
        service.pay({ id: 1, amount: 30, idempotencyKey: 'concurrent-pay-A' }),
        service.pay({ id: 2, amount: 50, idempotencyKey: 'concurrent-pay-B' }),
      ]);

      expect(resultA.balance).toBe('70');
      expect(resultB.balance).toBe('150');
      expect(mockTx.ledger.create).toHaveBeenCalledTimes(2);
    });

    it('rejects one payment while the other succeeds', async () => {
      const wallet = makeWallet({ id: 1, balance: D(10) });

      // First pay succeeds, second has insufficient balance
      mockTx.wallet.findUnique
        .mockResolvedValueOnce(wallet).mockResolvedValueOnce(makeWallet({ id: 1, balance: D(0) })) // success path
        .mockResolvedValueOnce(wallet);  // failure path
      mockTx.wallet.updateMany
        .mockResolvedValueOnce({ count: 1 })  // first pay succeeds
        .mockResolvedValueOnce({ count: 0 }); // second pay fails
      mockTx.ledger.create.mockResolvedValue({});

      const results = await Promise.allSettled([
        service.pay({ id: 1, amount: 10, idempotencyKey: 'concurrent-pay-ok' }),
        service.pay({ id: 1, amount: 20, idempotencyKey: 'concurrent-pay-fail' }),
      ]);

      expect(results[0].status).toBe('fulfilled');
      expect(results[1].status).toBe('rejected');
      expect((results[1] as PromiseRejectedResult).reason).toBeInstanceOf(BadRequestException);
    });
  });

  describe('concurrent transfer simulation', () => {
    it('processes multiple transfers concurrently', async () => {
      const w1 = makeWallet({ id: 1, balance: D(100) });
      const w2 = makeWallet({ id: 2, balance: D(100) });
      const w3 = makeWallet({ id: 3, balance: D(100) });
      const w2after = makeWallet({ id: 2, balance: D(150) });
      const w3after = makeWallet({ id: 3, balance: D(150) });

      // Transfer 1→2 and 1→3 in parallel
      mockTx.wallet.findUnique
        .mockResolvedValueOnce(w1).mockResolvedValueOnce(w2)  // transfer 1→2
        .mockResolvedValueOnce(w1).mockResolvedValueOnce(w3); // transfer 1→3
      mockTx.wallet.updateMany.mockResolvedValue({ count: 1 });
      mockTx.wallet.update
        .mockResolvedValueOnce(w2after)
        .mockResolvedValueOnce(w3after);
      mockTx.ledger.createMany.mockResolvedValue({});

      const [r1, r2] = await Promise.all([
        service.transfer({ fromWalletId: 1, toWalletId: 2, amount: 50, idempotencyKey: 'ct-001' }),
        service.transfer({ fromWalletId: 1, toWalletId: 3, amount: 50, idempotencyKey: 'ct-002' }),
      ]);

      expect(r1.id).toBe(2);
      expect(r2.id).toBe(3);
      expect(mockTx.ledger.createMany).toHaveBeenCalledTimes(2);
    });
  });
});
