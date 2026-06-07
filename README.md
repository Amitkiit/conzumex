# Conzumex

A minimal wallet management API with JWT authentication, transaction history, and MySQL/Redis support.

## Features

- User registration and login with JWT authentication
- Single wallet per authenticated user
- Create wallet with currency and name
- Add money and deduct money via transaction creation
- Transaction history retrieval
- Wallet tokens for alternate wallet identification
- Swagger API documentation
- MySQL schema migration script
- Docker support with MySQL and Redis

## Requirements Implemented

- TypeScript
- REST APIs
- SQL Database
- Register/Login
- Create Wallet
- Get Wallet
- Add Money / Deduct Money
- Transaction History
- JWT Authentication
- Swagger Documentation
- Authorization Checks
- One Wallet Per Customer
- Docker Support
- Migration Scripts

## Running Locally

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env` and update values as needed.

3. Start the server:

```bash
npm run dev
```

4. Open Swagger docs at:

```text
http://localhost:3000/api/docs/
```

## Docker

Start the full stack with MySQL and Redis:

```bash
npm run docker:up
```

## Database Migrations

A schema migration script is available at `migrations/001-init.sql` and `src/db/schema.sql`.

## Tests

Run tests with:

```bash
npm test
```
