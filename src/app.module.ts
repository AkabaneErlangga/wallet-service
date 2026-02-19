import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validationSchema } from './config/env.validation';
import { PrismaService } from './infrastructure/database/prisma.service';
import { PinoLoggerModule } from './infrastructure/logger/pino-logger.module';
import { ExampleModule } from './modules/example/example.module';
import { HealthController } from './modules/health/health.controller';
import { WalletsModule } from './modules/wallets/wallets.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validationSchema }),
    PinoLoggerModule,
    ExampleModule,
    WalletsModule,
    UsersModule,
  ],
  controllers: [HealthController],
  providers: [PrismaService],
})
export class AppModule {}
