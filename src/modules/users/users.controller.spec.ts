import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

const mockUser = {
  id: 1,
  email: 'user@example.com',
  name: 'John Doe',
  createdAt: new Date('2026-01-01'),
};

const mockUsersService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
};

describe('UsersController', () => {
  let controller: UsersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockUsersService }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('calls service.create and returns result', async () => {
      mockUsersService.create.mockResolvedValue(mockUser);
      const result = await controller.create({ email: 'user@example.com', name: 'John Doe' });
      expect(mockUsersService.create).toHaveBeenCalledWith({ email: 'user@example.com', name: 'John Doe' });
      expect(result).toEqual(mockUser);
    });
  });

  describe('findAll', () => {
    it('calls service.findAll and returns list', async () => {
      mockUsersService.findAll.mockResolvedValue([mockUser]);
      const result = await controller.findAll();
      expect(mockUsersService.findAll).toHaveBeenCalled();
      expect(result).toEqual([mockUser]);
    });
  });

  describe('findOne', () => {
    it('calls service.findOne with numeric id', async () => {
      mockUsersService.findOne.mockResolvedValue(mockUser);
      const result = await controller.findOne('1');
      expect(mockUsersService.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockUser);
    });
  });
});

