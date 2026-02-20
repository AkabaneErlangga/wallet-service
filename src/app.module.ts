import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { DatabaseErrorInterceptor } from './common/interceptors/database-error.interceptor';
import { validationSchema } from './config/env.validation';
import { PrismaService } from './infrastructure/database/prisma.service';
import { PinoLoggerModule } from './infrastructure/logger/pino-logger.module';
import { ExampleModule } from './modules/example/example.module';
import { HealthController } from './modules/health/health.controller';
import { UsersModule } from './modules/users/users.module';
import { WalletsModule } from './modules/wallets/wallets.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validationSchema }),
    PinoLoggerModule,
    ExampleModule,
    WalletsModule,
    UsersModule,
  ],
  controllers: [HealthController],
  providers: [
    PrismaService,
    {
      provide: APP_INTERCEPTOR,
      useClass: DatabaseErrorInterceptor,
    },
  ],
})
export class AppModule {}
