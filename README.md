<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>

# NestJS Template

A production-ready NestJS template with essential configurations and best practices.

## Features

- 🚀 NestJS v11
- 📝 TypeScript
- 🏢 Modular architecture
- 🔑 Environment validation (using Joi)
- 📊 Prisma ORM integration
- 📝 Swagger/OpenAPI documentation
- 🔍 Pino logger implementation
- ✅ Health check endpoint
- 🧪 E2E and unit testing setup

## Prerequisites

- Node.js (>=18)
- PNPM (>=8)
- PostgreSQL

## Getting Started

1. Clone this repository:
```bash
git clone <repository-url>
cd nestjs-template
```

2. Install dependencies:
```bash
pnpm install
```

3. Configure environment variables:
```bash
cp .env.example .env
```

Edit `.env` file with your configuration:
```env
NODE_ENV=development
PORT=3000
DATABASE_URL="postgresql://postgres:password@localhost:5432/dbname?schema=public"
```

4. Start the development server:
```bash
pnpm run start:dev
```

## Available Scripts

```bash
# Development
pnpm run start        # Start the application
pnpm run start:dev    # Start in watch mode
pnpm run start:debug  # Start in debug mode
pnpm run start:prod   # Start in production mode

# Build
pnpm run build        # Build the application

# Testing
pnpm run test         # Run unit tests
pnpm run test:e2e     # Run end-to-end tests
pnpm run test:cov     # Generate test coverage

# Code Quality
pnpm run lint         # Run ESLint
pnpm run format       # Run Prettier
```

## Project Structure

```
src/
├── common/              # Common utilities, filters, guards, etc.
│   ├── filters/
│   └── interceptors/
├── config/             # Configuration setup
├── infrastructure/     # Infrastructure setup (database, logger, etc.)
│   ├── database/
│   └── logger/
├── modules/           # Feature modules
│   ├── example/
│   └── health/
├── app.module.ts      # Root module
└── main.ts           # Application entry point
```

## API Documentation

Once the application is running, you can access the Swagger documentation at:

```
http://localhost:3000/docs
```

## Database Management

This template uses Prisma as ORM. Some useful Prisma commands:

```bash
# Generate Prisma Client
pnpm prisma generate

# Run migrations
pnpm prisma migrate dev

# Open Prisma Studio
pnpm prisma studio
```

## Health Check

The application includes a health check endpoint at:
```
GET /api/v1/health
```

## Expanding the Project

### Adding a New Module

1. Create a new module directory:
```bash
mkdir src/modules/users
```

2. Create the following files in the new module:
```
users/
├── dto/                 # Data Transfer Objects
│   ├── create-user.dto.ts
│   └── update-user.dto.ts
├── entities/           # Database entities
│   └── user.entity.ts
├── users.controller.ts # HTTP controllers
├── users.service.ts    # Business logic
├── users.module.ts     # Module configuration
└── users.spec.ts      # Tests
```

3. Example module implementation:

```typescript
// users.module.ts
import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
```

4. Add the module to `app.module.ts`:
```typescript
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    // ...other imports
    UsersModule,
  ],
})
export class AppModule {}
```

### Adding Database Models

1. Add your model to `prisma/schema.prisma`:
```prisma
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

2. Generate the Prisma client:
```bash
pnpm prisma generate
```

3. Create and apply migrations:
```bash
pnpm prisma migrate dev --name add_users
```

### Adding Environment Variables

1. Add new variables to `.env`:
```env
NEW_API_KEY=your-api-key
```

2. Update validation in `src/config/env.validation.ts`:
```typescript
export const validationSchema = Joi.object({
  // ...existing validation
  NEW_API_KEY: Joi.string().required(),
});
```

### Adding Custom Middleware

1. Create middleware in `src/common/middleware`:
```typescript
import { Injectable, NestMiddleware } from '@nestjs/common';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: Function) {
    console.log('Request...');
    next();
  }
}
```

2. Apply middleware in your module:
```typescript
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes('*');
  }
}
```

### Adding Custom Decorators

Create decorators in `src/common/decorators`:
```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const User = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
```

### Adding New API Documentation

Add Swagger decorators to your DTOs and controllers:
```typescript
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    description: 'The email of the user',
    example: 'user@example.com',
  })
  email: string;
}
```

### Adding Tests

1. Create unit tests:
```typescript
// users.service.spec.ts
import { Test } from '@nestjs/testing';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [UsersService],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
```

2. Create E2E tests:
```typescript
// test/users.e2e-spec.ts
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Users (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/users (GET)', () => {
    return request(app.getHttpServer())
      .get('/users')
      .expect(200);
  });
});
