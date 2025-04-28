# PeerDrop (PeerToPair)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)  
[![Build Status](https://img.shields.io/github/actions/workflow/status/MeremArt/PeerDrop/ci.yml?branch=main)]()

## Overview

PeerDrop (a.k.a. PeerToPair) is a backend service written in TypeScript on Node.js/Express that enables peer-to-peer transfers of USDC (or a custom token “SOINC”) using TikTok usernames or SMS identifiers. It connects to the Solana blockchain for on-chain transfers, uses MongoDB for persistence, and provides Swagger-powered API documentation. :contentReference[oaicite:1]{index=1}

## Key Features

- **User Authentication**  
  Passport.js-based sign-up, login, and session management. :contentReference[oaicite:2]{index=2}
- **On-chain Transactions**  
  Create, send, and query USDC/SOINC transfers via Solana Web3.js. :contentReference[oaicite:3]{index=3}
- **Balance & History**  
  Retrieve wallet balances and paginated transaction history. :contentReference[oaicite:4]{index=4}
- **Withdrawals**  
  - **Bank withdrawals** with fee calculation and pending-status tracking  
  - **External wallet withdrawals** with input validation and fee deduction :contentReference[oaicite:5]{index=5}
- **MongoDB Integration**  
  Mongoose models for users, withdrawals, and automated index setup. :contentReference[oaicite:6]{index=6}
- **API Documentation**  
  Swagger UI served at `/api-docs` with live exploration. :contentReference[oaicite:7]{index=7}

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
