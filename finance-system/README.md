# CoinDaily Financial Intelligence System (CFIS)

CFIS is a standalone, secure financial operating system for the CoinDaily ecosystem.

## Modules

1.  **Payment Engine**: Handles inbound/outbound payments (Crypto & Fiat).
2.  **Accounting Ledger**: Double-entry bookkeeping.
3.  **Tax Engine**: Compliance reporting.
4.  **Pricing & Subscription**: Dynamic pricing logic.
5.  **AI Policy Agent (ARIA)**: Financial intelligence and automated policy suggestions.
6.  **Security & Compliance**: Audit trails and access control.

## Setup

1.  Navigate to `coindaily-finance-system`.
2.  Install dependencies: `npm install`
3.  Configure `.env` (see `.env.example`).
4.  Run development server: `npm run dev`

## Architecture

CFIS runs largely isolated from the main application but communicates via secure internal APIs and webhooks.

-   **Database**: Uses a dedicated PostgreSQL schema/database.
-   **Auth**: Super Admin access only via dedicated portal.

## Contracts

Smart contracts are located in the root `/contracts` directory.
-   `JoyToken.sol`: ERC-20 Token (6 decimals).
-   `StakingVault.sol`: Staking logic.
-   `Subscription.sol`: Subscription payment logic.
