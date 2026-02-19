import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, User as PrismaUser } from '@prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

export interface User {
  id: number;
  email: string;
  name?: string;
  createdAt: Date;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    // You may need to adjust this if CreateUserDto is updated
    const user = await this.prisma.user.create({
      data: createUserDto as Prisma.UserUncheckedCreateInput,
    });
    return this.toEntity(user);
  }

  async findAll(): Promise<User[]> {
    const users = await this.prisma.user.findMany();
    return users.map(this.toEntity);
  }

  async findOne(id: number): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException(`User #${id} not found`);
    return this.toEntity(user);
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    await this.findOne(id);
    const user = await this.prisma.user.update({
      where: { id },
      data: updateUserDto as Prisma.UserUncheckedUpdateInput,
    });
    return this.toEntity(user);
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);
    await this.prisma.user.delete({ where: { id } });
  }

  private toEntity(user: PrismaUser): User {
    return {
      id: user.id,
      email: user.email,
      name: user.name ?? undefined,
      createdAt: user.createdAt,
    };
  }
}
