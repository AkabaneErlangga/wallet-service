import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { UsersService } from './users.service';

const mockPrisma = {
  user: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
};

const mockPrismaUser = {
  id: 1,
  email: 'user@example.com',
  name: 'John Doe',
  createdAt: new Date('2026-01-01'),
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('creates a user and returns entity', async () => {
      mockPrisma.user.create.mockResolvedValue(mockPrismaUser);
      const result = await service.create({ email: 'user@example.com', name: 'John Doe' });
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: { email: 'user@example.com', name: 'John Doe' },
      });
      expect(result).toEqual({
        id: 1,
        email: 'user@example.com',
        name: 'John Doe',
        createdAt: mockPrismaUser.createdAt,
      });
    });
  });

  describe('findAll', () => {
    it('returns all users', async () => {
      mockPrisma.user.findMany.mockResolvedValue([mockPrismaUser]);
      const result = await service.findAll();
      expect(result.length).toBe(1);
      expect(result[0].email).toBe('user@example.com');
    });

    it('returns empty array when no users', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);
      const result = await service.findAll();
      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('returns user when found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockPrismaUser);
      const result = await service.findOne(1);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result.id).toBe(1);
    });

    it('throws NotFoundException when not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(99)).rejects.toThrow('User #99 not found');
    });
  });
});

