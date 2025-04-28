
# PeerDrop (PeerToPair)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)  
[![Build Status](https://img.shields.io/github/actions/workflow/status/MeremArt/PeerDrop/ci.yml?branch=main)]()

## Overview

PeerDrop (a.k.a. PeerToPair) is a backend service written in TypeScript on Node.js/Express that enables peer-to-peer transfers of USDC (or a custom token “SOINC”) using TikTok usernames or SMS identifiers. It connects to the Solana blockchain for on-chain transfers, uses MongoDB for persistence, and provides Swagger-powered API documentation.  ([PeerDrop/src/app.ts at main · MeremArt/PeerDrop · GitHub](https://github.com/MeremArt/PeerDrop/blob/main/src/app.ts), [PeerDrop/src/config/database.ts at main · MeremArt/PeerDrop · GitHub](https://github.com/MeremArt/PeerDrop/blob/main/src/config/database.ts))

## Key Features

- **User Authentication**  
  Passport.js-based sign-up, login, and session management.  ([PeerDrop/src/app.ts at main · MeremArt/PeerDrop · GitHub](https://github.com/MeremArt/PeerDrop/blob/main/src/app.ts))
- **On-chain Transactions**  
  Create, send, and query USDC/SOINC transfers via Solana Web3.js.  ([PeerDrop/src/controllers/transactionController.ts at main · MeremArt/PeerDrop · GitHub](https://github.com/MeremArt/PeerDrop/blob/main/src/controllers/transactionController.ts))
- **Balance & History**  
  Retrieve wallet balances and paginated transaction history.  ([PeerDrop/src/controllers/transactionController.ts at main · MeremArt/PeerDrop · GitHub](https://github.com/MeremArt/PeerDrop/blob/main/src/controllers/transactionController.ts))
- **Withdrawals**  
  - **Bank withdrawals** with fee calculation and pending-status tracking  
  - **External wallet withdrawals** with input validation and fee deduction  ([PeerDrop/src/controllers/transactionController.ts at main · MeremArt/PeerDrop · GitHub](https://github.com/MeremArt/PeerDrop/blob/main/src/controllers/transactionController.ts))
- **MongoDB Integration**  
  Mongoose models for users, withdrawals, and automated index setup.  ([PeerDrop/src/config/database.ts at main · MeremArt/PeerDrop · GitHub](https://github.com/MeremArt/PeerDrop/blob/main/src/config/database.ts))
- **API Documentation**  
  Swagger UI served at `/api-docs` with live exploration.  ([PeerDrop/src/app.ts at main · MeremArt/PeerDrop · GitHub](https://github.com/MeremArt/PeerDrop/blob/main/src/app.ts))

## Technology Stack

- **Runtime & Framework**: Node.js, Express, TypeScript  
- **Database**: MongoDB with Mongoose ODM  
- **Blockchain**: Solana Web3.js for on-chain operations  
- **Auth**: Passport.js (local strategy + sessions)  
- **API Docs**: Swagger (OpenAPI)  
- **Validation**: express-validator  
- **Environment**: dotenv for configuration  
- **Logging & Sessions**: express-session, CORS  

## Getting Started

### Prerequisites

- Node.js ≥ 16  
- npm or Yarn  
- MongoDB instance URI  
- A Solana RPC endpoint (e.g., from a public provider)  
- Environment variables defined in a `.env` file

### Installation

```bash
git clone https://github.com/MeremArt/PeerDrop.git
cd PeerDrop
npm install
```

### Configuration

Copy the example and set your values:

```ini
# .env
PORT=3000
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster0.mongodb.net/peerdrop
SESSION_SECRET=yourSessionSecret
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
TREASURY_WALLET_ADDRESS=YourTreasuryPublicKey
MINIMUM_WITHDRAWAL=1
WITHDRAWAL_FEE_PERCENTAGE=0.5
```

### Running Locally

```bash
# Start in development mode
npm run dev
```

By default, the server listens on `http://localhost:3000` and serves Swagger UI at `/api-docs`.

## API Endpoints

### Authentication

- `POST /api/auth/register` — Create a new user  
- `POST /api/auth/login` — Login and establish a session  
- `GET  /api/auth/logout` — Terminate session  

### Transactions

- `POST   /api/transactions/send` — Send USDC/SOINC between users  ([PeerDrop/src/controllers/transactionController.ts at main · MeremArt/PeerDrop · GitHub](https://github.com/MeremArt/PeerDrop/blob/main/src/controllers/transactionController.ts))  
- `GET    /api/transactions/status/:signature` — Check on-chain status  
- `GET    /api/transactions/balance/:tiktokUsername` — Fetch SOL & token balances  
- `GET    /api/transactions/history/:tiktokUsername` — Paginated history  

### Withdrawals

- `POST  /api/withdrawals/bank`   — Request a bank withdrawal (pending)  
- `POST  /api/withdrawals/wallet` — Direct withdrawal to external Solana wallet  ([PeerDrop/src/controllers/transactionController.ts at main · MeremArt/PeerDrop · GitHub](https://github.com/MeremArt/PeerDrop/blob/main/src/controllers/transactionController.ts))  
- `GET   /api/withdrawals/:userId` — List withdrawal records  

## Contributing

1. Fork the repository  
2. Create a feature branch (`git checkout -b feature/YourFeature`)  
3. Commit your changes (`git commit -m "Add feature"`)  
4. Push to the branch (`git push origin feature/YourFeature`)  
5. Open a Pull Request

Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
```

Feel free to tweak any section (naming, environment variables, endpoints) to match your exact deployment and workflow.
