import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validationSchema } from './config/env.validation';
import { HealthController } from './modules/health/health.controller';
import { PinoLoggerModule } from './infrastructure/logger/pino-logger.module';
import { PrismaService } from './infrastructure/database/prisma.service';
import { ExampleModule } from './modules/example/example.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validationSchema }),
    PinoLoggerModule,
    ExampleModule,
  ],
  controllers: [HealthController],
  providers: [PrismaService],
})
export class AppModule {}
