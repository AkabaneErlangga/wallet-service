import { Test, TestingModule } from '@nestjs/testing';
import { WalletStatus } from './entities/wallet.entity';
import { WalletsController } from './wallets.controller';
import { WalletsService } from './wallets.service';

const mockWallet = {
  id: 1,
  ownerId: 1,
  currency: 'USD',
  balance: '100.00',
  status: WalletStatus.ACTIVE,
};

const mockWalletsService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  topup: jest.fn(),
  transfer: jest.fn(),
  pay: jest.fn(),
  updateStatus: jest.fn(),
};

describe('WalletsController', () => {
  let controller: WalletsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WalletsController],
      providers: [{ provide: WalletsService, useValue: mockWalletsService }],
    }).compile();

    controller = module.get<WalletsController>(WalletsController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('calls service.create and returns result', async () => {
      mockWalletsService.create.mockResolvedValue(mockWallet);
      const result = await controller.create({ ownerId: 1, currency: 'USD' });
      expect(mockWalletsService.create).toHaveBeenCalledWith({ ownerId: 1, currency: 'USD' });
      expect(result).toEqual(mockWallet);
    });
  });

  describe('findAll', () => {
    it('calls service.findAll and returns result', async () => {
      mockWalletsService.findAll.mockResolvedValue([mockWallet]);
      const result = await controller.findAll();
      expect(mockWalletsService.findAll).toHaveBeenCalled();
      expect(result).toEqual([mockWallet]);
    });
  });

  describe('findOne', () => {
    it('calls service.findOne with numeric id', async () => {
      mockWalletsService.findOne.mockResolvedValue(mockWallet);
      const result = await controller.findOne('1');
      expect(mockWalletsService.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockWallet);
    });
  });

  describe('topup', () => {
    it('calls service.topup and returns updated wallet', async () => {
      const dto = { walletId: 1, amount: 500, idempotencyKey: 'topup-123' };
      mockWalletsService.topup.mockResolvedValue({ ...mockWallet, balance: '600.00' });
      const result = await controller.topup(dto);
      expect(mockWalletsService.topup).toHaveBeenCalledWith(dto);
      expect(result.balance).toBe('600.00');
    });
  });

  describe('transfer', () => {
    it('calls service.transfer and returns updated wallet', async () => {
      const dto = { fromWalletId: 1, toWalletId: 2, amount: 50, idempotencyKey: 'transfer-123' };
      mockWalletsService.transfer.mockResolvedValue({ ...mockWallet, id: 2, balance: '150.00' });
      const result = await controller.transfer(dto);
      expect(mockWalletsService.transfer).toHaveBeenCalledWith(dto);
      expect(result.balance).toBe('150.00');
    });
  });

  describe('pay', () => {
    it('calls service.pay and returns updated wallet', async () => {
      const dto = { id: 1, amount: 30, idempotencyKey: 'pay-123' };
      mockWalletsService.pay.mockResolvedValue({ ...mockWallet, balance: '70.00' });
      const result = await controller.pay(dto);
      expect(mockWalletsService.pay).toHaveBeenCalledWith(dto);
      expect(result.balance).toBe('70.00');
    });
  });

  describe('updateStatus', () => {
    it('calls service.updateStatus with numeric id and status', async () => {
      const updated = { ...mockWallet, status: WalletStatus.SUSPENDED };
      mockWalletsService.updateStatus.mockResolvedValue(updated);
      const result = await controller.updateStatus('1', WalletStatus.SUSPENDED);
      expect(mockWalletsService.updateStatus).toHaveBeenCalledWith(1, WalletStatus.SUSPENDED);
      expect(result.status).toBe(WalletStatus.SUSPENDED);
    });
  });
});
