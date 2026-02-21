# Wallet Service

A production-ready wallet service built with **NestJS**, **Prisma**, and **PostgreSQL** — supporting multi-currency wallets, top-ups, payments, and transfers with idempotency and atomic ledger entries.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Running the App](#running-the-app)
- [Running Tests](#running-tests)
- [API Reference](#api-reference)
  - [Users](#users)
  - [Wallets](#wallets)
- [Swagger UI](#swagger-ui)
- [Environment Variables](#environment-variables)
- [Database Schema](#database-schema)

---

## Features

- 👤 User management (create, list, get by ID)
- 💳 Multi-currency wallet management
- ⬆️ Top-up wallets
- 💸 Payments from wallet
- 🔄 Wallet-to-wallet transfers
- 🔐 Idempotency keys on all financial operations
- 📒 Immutable ledger for every transaction
- 🛑 Wallet status management (ACTIVE / SUSPENDED)
- 📖 Swagger/OpenAPI documentation
- 🪵 Structured logging with Pino
- ✅ Unit tests (Bun test runner)

---

## Tech Stack

| Layer       | Technology                 |
|-------------|----------------------------|
| Framework   | NestJS 11                  |
| Language    | TypeScript 5               |
| ORM         | Prisma 6                   |
| Database    | PostgreSQL                 |
| Validation  | class-validator            |
| Docs        | @nestjs/swagger            |
| Logger      | nestjs-pino / pino         |
| Test runner | Bun                        |

---

## Prerequisites

- [Bun](https://bun.sh) ≥ 1.0
- Node.js ≥ 18 (for NestJS CLI)
- PostgreSQL ≥ 14

---

## Getting Started

```bash
# 1. Clone the repository
git clone <repo-url>
cd wallet-service

# 2. Install dependencies
bun install

# 3. Copy environment file and configure
cp .env.example .env
# Edit .env and set DATABASE_URL

# 4. Run database migrations
bunx prisma migrate dev --name init

# 5. Generate Prisma client
bunx prisma generate
```

---

## Running the App

```bash
# Development (watch mode)
bun run start:dev

# Production build
bun run build
bun run start:prod
```

The server starts on **http://localhost:3000** by default.
Swagger docs on **http://localhost:3000/docs**

---

## Running Tests

```bash
# Run all unit tests with Bun
bun test

# Run a specific spec file
bun test src/modules/wallets/wallets.service.spec.ts
bun test src/modules/wallets/wallets.controller.spec.ts
bun test src/modules/users/users.service.spec.ts
bun test src/modules/users/users.controller.spec.ts

# Run all specs matching a pattern
bun test src/modules/wallets

# Run with Jest (alternative)
npm run test
npm run test:cov
```

---

## API Reference

All endpoints are prefixed with `/api/v1`.

### Users

#### Create a user

```bash
curl --request POST \
  --url http://localhost:3000/api/v1/users \
  --header 'content-type: application/json' \
  --data '{
    "email": "alice@example.com",
    "name": "Alice"
  }'
```

```json
{
  "id": 1,
  "email": "alice@example.com",
  "name": "Alice",
  "createdAt": "2026-02-21T10:00:00.000Z"
}
```

#### List all users

```bash
curl http://localhost:3000/api/v1/users
```

#### Get user by ID

```bash
curl http://localhost:3000/api/v1/users/1
```

---

### Wallets

#### Create a wallet

```bash
curl --request POST \
  --url http://localhost:3000/api/v1/wallets \
  --header 'content-type: application/json' \
  --data '{
    "ownerId": 1,
    "currency": "USD"
  }'
```

```json
{
  "id": 1,
  "ownerId": 1,
  "currency": "USD",
  "balance": "0",
  "status": "ACTIVE"
}
```

> Each owner can have only **one wallet per currency**.

#### List all wallets

```bash
curl http://localhost:3000/api/v1/wallets
```

#### Get wallet by ID

```bash
curl http://localhost:3000/api/v1/wallets/1
```

#### Top up a wallet

```bash
curl --request POST \
  --url http://localhost:3000/api/v1/wallets/topup \
  --header 'content-type: application/json' \
  --data '{
    "walletId": 1,
    "amount": 500,
    "idempotencyKey": "topup-2026-001"
  }'
```

```json
{
  "id": 1,
  "ownerId": 1,
  "currency": "USD",
  "balance": "500",
  "status": "ACTIVE"
}
```

#### Pay from a wallet

```bash
curl --request POST \
  --url http://localhost:3000/api/v1/wallets/pay \
  --header 'content-type: application/json' \
  --data '{
    "id": 1,
    "amount": 50,
    "idempotencyKey": "pay-2026-001"
  }'
```

```json
{
  "id": 1,
  "ownerId": 1,
  "currency": "USD",
  "balance": "450",
  "status": "ACTIVE"
}
```

> Returns `400 Bad Request` if balance is insufficient or wallet is suspended.

#### Transfer between wallets

```bash
curl --request POST \
  --url http://localhost:3000/api/v1/wallets/transfer \
  --header 'content-type: application/json' \
  --data '{
    "fromWalletId": 1,
    "toWalletId": 2,
    "amount": 100,
    "idempotencyKey": "transfer-2026-001"
  }'
```

```json
{
  "id": 2,
  "ownerId": 2,
  "currency": "USD",
  "balance": "600",
  "status": "ACTIVE"
}
```

> Returns the **destination** wallet. Returns `400 Bad Request` on currency mismatch, insufficient balance, or suspended wallets.

#### Update wallet status

```bash
curl --request PATCH \
  --url http://localhost:3000/api/v1/wallets/1/status \
  --header 'content-type: application/json' \
  --data '{ "status": "SUSPENDED" }'
```

```json
{
  "id": 1,
  "ownerId": 1,
  "currency": "USD",
  "balance": "450",
  "status": "SUSPENDED"
}
```

---

## Swagger UI

Interactive API documentation is available at:

```
http://localhost:3000/docs
```

Import the raw OpenAPI JSON spec into Postman, Insomnia, Bruno, or Hoppscotch:

```
http://localhost:3000/docs-json
```

---

## Environment Variables

| Variable       | Description                        | Example                                          |
|----------------|------------------------------------|--------------------------------------------------|
| `DATABASE_URL` | PostgreSQL connection string       | `postgresql://user:pass@localhost:5432/wallets`  |
| `PORT`         | HTTP port (default: `3000`)        | `3000`                                           |

---

## Database Schema

```
User
 ├── id          Int       PK
 ├── email       String    unique
 ├── name        String?
 ├── createdAt   DateTime
 └── wallets     Wallet[]

Wallet
 ├── id          Int       PK
 ├── ownerId     Int       FK → User.id
 ├── currency    String
 ├── balance     Decimal(30,2)
 ├── status      ACTIVE | SUSPENDED
 ├── createdAt   DateTime
 └── ledgers     Ledger[]
 ── unique(ownerId, currency)

Ledger
 ├── id              Int       PK
 ├── walletId        Int       FK → Wallet.id
 ├── type            TOPUP | PAYMENT | TRANSFER_IN | TRANSFER_OUT
 ├── amount          Decimal(30,2)
 ├── currency        String
 ├── idempotencyKey  String?   unique
 └── createdAt       DateTime
```


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
