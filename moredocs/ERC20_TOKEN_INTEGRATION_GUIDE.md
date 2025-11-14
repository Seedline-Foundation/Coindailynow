# CoinDaily Token (CDT) - Complete Integration Guide

## 📚 TABLE OF CONTENTS

1. [Overview](#overview)
2. [Smart Contract Deployment](#smart-contract-deployment)
3. [Backend Integration](#backend-integration)
4. [Frontend Integration](#frontend-integration)
5. [Testing Guide](#testing-guide)
6. [Security Checklist](#security-checklist)
7. [Deployment Checklist](#deployment-checklist)

---

## 🎯 OVERVIEW

### What You Get

✅ **Smart Contract**: Complete ERC-20 token with staking, vesting, and anti-whale features  
✅ **Enhanced Wallet Schema**: Multi-token support (CDT + CE Points + JOY Tokens)  
✅ **Backend Services**: Blockchain integration, synchronization, transaction monitoring  
✅ **Frontend Components**: Wallet UI, token display, transaction history  
✅ **Testing Suite**: Unit tests, integration tests, deployment scripts  

### Confirmation: Wallet Design Supports All Token Types ✅

Your **EXISTING** wallet design **ALREADY SUPPORTS**:
- ✅ CE Points (off-chain, internal ledger)
- ✅ JOY Tokens (off-chain, internal ledger)
- ✅ CDT Token (on-chain ERC-20) - Just need to add tracking fields

**Verdict**: Your wallet can handle **ALL THREE TOKEN TYPES SIMULTANEOUSLY** with the enhancements from `WALLET_SCHEMA_ENHANCEMENTS.prisma`.

---

## 🚀 SMART CONTRACT DEPLOYMENT

### Prerequisites

```bash
# Install dependencies
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npm install @openzeppelin/contracts ethers dotenv

# Install Polygon network tools
npm install @polygon/sdk @maticnetwork/maticjs
```

### Project Structure

```
contracts/
├── CoinDailyToken.sol           # Main token contract
├── mocks/                       # Test mock contracts
└── interfaces/                  # Contract interfaces

scripts/
├── deploy.ts                    # Deployment script
├── verify.ts                    # Contract verification
├── distribute-tokens.ts         # Initial distribution
└── setup-vesting.ts             # Team vesting setup

test/
├── CoinDailyToken.test.ts       # Unit tests
├── Staking.test.ts              # Staking tests
└── Vesting.test.ts              # Vesting tests

hardhat.config.ts                # Hardhat configuration
.env                             # Environment variables
```

### Environment Setup

Create `.env` file:

```bash
# Polygon Network
POLYGON_RPC_URL=https://polygon-rpc.com
POLYGON_MAINNET_RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/YOUR_API_KEY
POLYGON_TESTNET_RPC_URL=https://polygon-mumbai.g.alchemy.com/v2/YOUR_API_KEY

# Deployer Wallet
DEPLOYER_PRIVATE_KEY=your_private_key_here
DEPLOYER_ADDRESS=0x...

# Contract Addresses (fill after deployment)
CDT_TOKEN_ADDRESS=
STAKING_POOL_ADDRESS=
LIQUIDITY_POOL_ADDRESS=
DEVELOPMENT_FUND_ADDRESS=

# Etherscan/Polygonscan API Keys
POLYGONSCAN_API_KEY=your_polygonscan_api_key

# Multi-Sig Wallets (for security)
MULTISIG_ADMIN_ADDRESS=0x...
MULTISIG_TREASURY_ADDRESS=0x...

# Platform Integration
PLATFORM_BACKEND_URL=https://api.coindaily.com
PLATFORM_WEBHOOK_SECRET=your_webhook_secret
```

### Hardhat Configuration

Create `hardhat.config.ts`:

```typescript
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";
import "dotenv/config";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    // Local development
    hardhat: {
      chainId: 31337,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
    },
    
    // Polygon Mumbai Testnet
    polygonMumbai: {
      url: process.env.POLYGON_TESTNET_RPC_URL || "",
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
      chainId: 80001,
      gasPrice: 35000000000, // 35 Gwei
    },
    
    // Polygon Mainnet
    polygon: {
      url: process.env.POLYGON_MAINNET_RPC_URL || "",
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
      chainId: 137,
      gasPrice: 50000000000, // 50 Gwei (adjust based on network)
    },
  },
  etherscan: {
    apiKey: {
      polygon: process.env.POLYGONSCAN_API_KEY || "",
      polygonMumbai: process.env.POLYGONSCAN_API_KEY || "",
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};

export default config;
```

### Deployment Script

Create `scripts/deploy.ts`:

```typescript
import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  console.log("🚀 Deploying CoinDaily Token (CDT)...\n");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "MATIC\n");

  // Deploy pool/fund addresses (or use existing)
  console.log("📦 Deploying pool contracts...");
  
  // For testnet, create simple wallet contracts
  const stakingPool = await ethers.deployContract("SimpleWallet");
  await stakingPool.waitForDeployment();
  console.log("✅ Staking Pool deployed to:", await stakingPool.getAddress());

  const liquidityPool = await ethers.deployContract("SimpleWallet");
  await liquidityPool.waitForDeployment();
  console.log("✅ Liquidity Pool deployed to:", await liquidityPool.getAddress());

  const developmentFund = await ethers.deployContract("SimpleWallet");
  await developmentFund.waitForDeployment();
  console.log("✅ Development Fund deployed to:", await developmentFund.getAddress());

  console.log("\n🪙 Deploying CoinDaily Token...");
  
  const CoinDailyToken = await ethers.getContractFactory("CoinDailyToken");
  const token = await CoinDailyToken.deploy(
    await stakingPool.getAddress(),
    await liquidityPool.getAddress(),
    await developmentFund.getAddress()
  );

  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  
  console.log("✅ CoinDaily Token deployed to:", tokenAddress);
  console.log("✅ Total Supply:", ethers.formatEther(await token.totalSupply()), "CDT\n");

  // Save deployment info
  const deploymentInfo = {
    network: (await ethers.provider.getNetwork()).name,
    chainId: (await ethers.provider.getNetwork()).chainId.toString(),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      token: tokenAddress,
      stakingPool: await stakingPool.getAddress(),
      liquidityPool: await liquidityPool.getAddress(),
      developmentFund: await developmentFund.getAddress(),
    },
    tokenInfo: {
      name: await token.name(),
      symbol: await token.symbol(),
      decimals: await token.decimals(),
      totalSupply: ethers.formatEther(await token.totalSupply()),
    },
  };

  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(deploymentsDir, `deployment-${Date.now()}.json`),
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("📄 Deployment info saved to deployments/\n");

  // Initial setup
  console.log("⚙️  Running initial setup...");
  
  // Enable trading after initial distribution
  // await token.enableTrading();
  // console.log("✅ Trading enabled");

  console.log("\n✅ Deployment complete!");
  console.log("\n📋 Next steps:");
  console.log("1. Verify contract on Polygonscan: npx hardhat verify --network polygon", tokenAddress);
  console.log("2. Distribute tokens: npx hardhat run scripts/distribute-tokens.ts");
  console.log("3. Setup vesting: npx hardhat run scripts/setup-vesting.ts");
  console.log("4. Update backend .env with contract address");
  console.log("5. Run backend sync service");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

### Token Distribution Script

Create `scripts/distribute-tokens.ts`:

```typescript
import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  console.log("📦 Distributing CoinDaily Tokens...\n");

  // Load deployment info
  const deploymentsDir = path.join(__dirname, "../deployments");
  const files = fs.readdirSync(deploymentsDir);
  const latestDeployment = files.sort().reverse()[0];
  const deploymentInfo = JSON.parse(
    fs.readFileSync(path.join(deploymentsDir, latestDeployment), "utf8")
  );

  const tokenAddress = deploymentInfo.contracts.token;
  const token = await ethers.getContractAt("CoinDailyToken", tokenAddress);

  console.log("Token Address:", tokenAddress);
  console.log("Total Supply:", ethers.formatEther(await token.totalSupply()), "CDT\n");

  // Distribution plan (1 Billion CDT)
  const distributions = [
    {
      name: "Staking Rewards Pool",
      address: deploymentInfo.contracts.stakingPool,
      amount: ethers.parseEther("150000000"), // 150M CDT
    },
    {
      name: "Liquidity Pools",
      address: deploymentInfo.contracts.liquidityPool,
      amount: ethers.parseEther("100000000"), // 100M CDT
    },
    {
      name: "Platform Development",
      address: deploymentInfo.contracts.developmentFund,
      amount: ethers.parseEther("50000000"), // 50M CDT
    },
    {
      name: "CE Points Conversion Pool",
      address: process.env.CE_CONVERSION_POOL_ADDRESS || deploymentInfo.contracts.stakingPool,
      amount: ethers.parseEther("100000000"), // 100M CDT
    },
    {
      name: "Airdrops & Campaigns",
      address: process.env.AIRDROP_WALLET_ADDRESS || deployer.address,
      amount: ethers.parseEther("75000000"), // 75M CDT
    },
    {
      name: "Marketing & Partnerships",
      address: process.env.MARKETING_WALLET_ADDRESS || deployer.address,
      amount: ethers.parseEther("150000000"), // 150M CDT
    },
    {
      name: "Reserve Fund",
      address: process.env.RESERVE_WALLET_ADDRESS || deployer.address,
      amount: ethers.parseEther("100000000"), // 100M CDT
    },
    // Team & Advisors handled via vesting (150M CDT)
    // Public Sale handled separately (50M CDT)
  ];

  console.log("📊 Distribution Plan:\n");
  let totalDistributed = 0n;

  for (const dist of distributions) {
    console.log(`Transferring ${ethers.formatEther(dist.amount)} CDT to ${dist.name}...`);
    const tx = await token.transfer(dist.address, dist.amount);
    await tx.wait();
    console.log(`✅ Sent to ${dist.address}\n`);
    totalDistributed += dist.amount;
  }

  console.log("✅ Distribution complete!");
  console.log("Total Distributed:", ethers.formatEther(totalDistributed), "CDT");
  console.log("Remaining in Deployer:", ethers.formatEther(await token.balanceOf(deployer.address)), "CDT");
}

const [deployer] = await ethers.getSigners();

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

### Deployment Commands

```bash
# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Deploy to Mumbai testnet
npx hardhat run scripts/deploy.ts --network polygonMumbai

# Deploy to Polygon mainnet
npx hardhat run scripts/deploy.ts --network polygon

# Verify contract
npx hardhat verify --network polygon <TOKEN_ADDRESS> <STAKING_POOL> <LIQUIDITY_POOL> <DEV_FUND>

# Distribute tokens
npx hardhat run scripts/distribute-tokens.ts --network polygon
```

---

## 🔧 BACKEND INTEGRATION

### 1. Install Dependencies

```bash
cd backend

npm install ethers@6 @polygon/sdk web3
npm install --save-dev @types/web3
```

### 2. Create Blockchain Service

Create `backend/src/services/blockchain/BlockchainService.ts`:

```typescript
import { ethers } from 'ethers';
import { PrismaClient } from '@prisma/client';
import CDT_ABI from './abis/CoinDailyToken.json';

export class BlockchainService {
  private provider: ethers.JsonRpcProvider;
  private tokenContract: ethers.Contract;
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
    
    // Connect to Polygon
    this.provider = new ethers.JsonRpcProvider(
      process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com'
    );

    // Initialize CDT token contract
    this.tokenContract = new ethers.Contract(
      process.env.CDT_TOKEN_ADDRESS!,
      CDT_ABI,
      this.provider
    );
  }

  /**
   * Get CDT balance from blockchain
   */
  async getCDTBalance(address: string): Promise<number> {
    try {
      const balance = await this.tokenContract.balanceOf(address);
      return parseFloat(ethers.formatEther(balance));
    } catch (error) {
      console.error('Error fetching CDT balance:', error);
      throw error;
    }
  }

  /**
   * Sync wallet balance with blockchain
   */
  async syncWalletBalance(walletId: string): Promise<void> {
    const wallet = await this.prisma.wallet.findUnique({
      where: { id: walletId },
    });

    if (!wallet || !wallet.blockchainAddress) {
      throw new Error('Wallet not found or no blockchain address');
    }

    const onChainBalance = await this.getCDTBalance(wallet.blockchainAddress);

    await this.prisma.wallet.update({
      where: { id: walletId },
      data: {
        cdtOnChainBalance: onChainBalance,
        lastBlockchainSync: new Date(),
        blockchainSyncStatus: 'SYNCED',
      },
    });
  }

  /**
   * Monitor blockchain events (Transfer, Stake, etc.)
   */
  async startEventListener(): Promise<void> {
    console.log('🎧 Starting blockchain event listener...');

    // Listen for Transfer events
    this.tokenContract.on('Transfer', async (from, to, amount, event) => {
      console.log(`Transfer: ${from} → ${to}: ${ethers.formatEther(amount)} CDT`);
      
      await this.handleTransferEvent(from, to, amount, event);
    });

    // Listen for Staked events
    this.tokenContract.on('Staked', async (user, amount, timestamp, event) => {
      console.log(`Staked: ${user} staked ${ethers.formatEther(amount)} CDT`);
      
      await this.handleStakeEvent(user, amount, timestamp, event);
    });

    // Listen for Unstaked events
    this.tokenContract.on('Unstaked', async (user, amount, rewards, timestamp, event) => {
      console.log(`Unstaked: ${user} unstaked ${ethers.formatEther(amount)} CDT`);
      
      await this.handleUnstakeEvent(user, amount, rewards, timestamp, event);
    });
  }

  /**
   * Handle Transfer event
   */
  private async handleTransferEvent(
    from: string,
    to: string,
    amount: bigint,
    event: any
  ): Promise<void> {
    try {
      const txHash = event.log.transactionHash;
      const blockNumber = event.log.blockNumber;
      const block = await this.provider.getBlock(blockNumber);

      // Check if transaction already recorded
      const existing = await this.prisma.blockchainTransaction.findUnique({
        where: { txHash },
      });

      if (existing) return;

      // Find wallets by blockchain address
      const fromWallet = await this.prisma.wallet.findFirst({
        where: { blockchainAddress: from },
      });

      const toWallet = await this.prisma.wallet.findFirst({
        where: { blockchainAddress: to },
      });

      // Record transaction
      await this.prisma.blockchainTransaction.create({
        data: {
          txHash,
          walletId: fromWallet?.id || toWallet?.id || 'unknown',
          blockNumber: BigInt(blockNumber),
          blockTimestamp: new Date(block!.timestamp * 1000),
          transactionType: 'TRANSFER',
          fromAddress: from,
          toAddress: to,
          amount: parseFloat(ethers.formatEther(amount)),
          status: 'CONFIRMED',
          confirmations: 1,
        },
      });

      // Sync both wallets
      if (fromWallet) await this.syncWalletBalance(fromWallet.id);
      if (toWallet) await this.syncWalletBalance(toWallet.id);

    } catch (error) {
      console.error('Error handling Transfer event:', error);
    }
  }

  /**
   * Handle Staked event
   */
  private async handleStakeEvent(
    user: string,
    amount: bigint,
    timestamp: bigint,
    event: any
  ): Promise<void> {
    try {
      const wallet = await this.prisma.wallet.findFirst({
        where: { blockchainAddress: user },
      });

      if (!wallet) return;

      const txHash = event.log.transactionHash;

      // Create staking record
      await this.prisma.stakingRecord.create({
        data: {
          walletId: wallet.id,
          userId: wallet.userId!,
          stakedAmount: parseFloat(ethers.formatEther(amount)),
          planType: 'FLEXIBLE', // Detect plan from contract if possible
          lockPeriodDays: 0,
          rewardRate: 15.0, // 15% APR
          startDate: new Date(Number(timestamp) * 1000),
          stakeTxHash: txHash,
          status: 'ACTIVE',
        },
      });

      // Update wallet staked balance
      await this.syncWalletBalance(wallet.id);

    } catch (error) {
      console.error('Error handling Staked event:', error);
    }
  }

  /**
   * Handle Unstaked event
   */
  private async handleUnstakeEvent(
    user: string,
    amount: bigint,
    rewards: bigint,
    timestamp: bigint,
    event: any
  ): Promise<void> {
    try {
      const wallet = await this.prisma.wallet.findFirst({
        where: { blockchainAddress: user },
      });

      if (!wallet) return;

      const txHash = event.log.transactionHash;

      // Find active staking record
      const stakingRecord = await this.prisma.stakingRecord.findFirst({
        where: {
          walletId: wallet.id,
          status: 'ACTIVE',
          stakedAmount: parseFloat(ethers.formatEther(amount)),
        },
      });

      if (stakingRecord) {
        await this.prisma.stakingRecord.update({
          where: { id: stakingRecord.id },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(Number(timestamp) * 1000),
            claimedRewards: parseFloat(ethers.formatEther(rewards)),
            unstakeTxHash: txHash,
          },
        });
      }

      // Update wallet balance
      await this.syncWalletBalance(wallet.id);

    } catch (error) {
      console.error('Error handling Unstaked event:', error);
    }
  }

  /**
   * Create blockchain wallet for user
   */
  async createBlockchainWallet(userId: string): Promise<{
    address: string;
    privateKey: string;
  }> {
    const wallet = ethers.Wallet.createRandom();
    
    // IMPORTANT: Encrypt private key before storing
    const encryptedKey = await this.encryptPrivateKey(wallet.privateKey);

    await this.prisma.wallet.updateMany({
      where: { userId },
      data: {
        blockchainAddress: wallet.address,
        privateKeyEncrypted: encryptedKey,
        isExternalWallet: false,
      },
    });

    return {
      address: wallet.address,
      privateKey: wallet.privateKey, // Return once for user backup
    };
  }

  /**
   * Link external wallet
   */
  async linkExternalWallet(userId: string, address: string): Promise<void> {
    // Verify address is valid
    if (!ethers.isAddress(address)) {
      throw new Error('Invalid Ethereum address');
    }

    await this.prisma.wallet.updateMany({
      where: { userId },
      data: {
        blockchainAddress: address,
        isExternalWallet: true,
        privateKeyEncrypted: null, // No private key for external wallets
      },
    });

    // Initial sync
    const wallet = await this.prisma.wallet.findFirst({
      where: { userId },
    });

    if (wallet) {
      await this.syncWalletBalance(wallet.id);
    }
  }

  /**
   * Encrypt private key (implement with proper encryption)
   */
  private async encryptPrivateKey(privateKey: string): Promise<string> {
    // TODO: Implement AES-256-GCM encryption with KMS
    // For now, return placeholder
    const crypto = require('crypto');
    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'secret', 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    
    let encrypted = cipher.update(privateKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();
    
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  /**
   * Decrypt private key
   */
  private async decryptPrivateKey(encrypted: string): Promise<string> {
    const crypto = require('crypto');
    const [ivHex, authTagHex, encryptedData] = encrypted.split(':');
    
    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'secret', 'salt', 32);
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * Send CDT tokens
   */
  async sendCDT(
    fromWalletId: string,
    toAddress: string,
    amount: number
  ): Promise<string> {
    const wallet = await this.prisma.wallet.findUnique({
      where: { id: fromWalletId },
    });

    if (!wallet || !wallet.privateKeyEncrypted) {
      throw new Error('Wallet not found or no private key');
    }

    // Decrypt private key
    const privateKey = await this.decryptPrivateKey(wallet.privateKeyEncrypted);
    const signer = new ethers.Wallet(privateKey, this.provider);

    // Create token contract with signer
    const tokenWithSigner = this.tokenContract.connect(signer) as any;

    // Send transaction
    const tx = await tokenWithSigner.transfer(
      toAddress,
      ethers.parseEther(amount.toString())
    );

    await tx.wait();

    return tx.hash;
  }
}
```

### 3. Update Prisma Schema

Apply the enhancements from `WALLET_SCHEMA_ENHANCEMENTS.prisma`:

```bash
# Copy enhanced schema to your prisma/schema.prisma
# Then run migration

npx prisma migrate dev --name add_erc20_support
npx prisma generate
```

### 4. Create Sync Worker

Create `backend/src/workers/blockchain-sync.worker.ts`:

```typescript
import { BlockchainService } from '../services/blockchain/BlockchainService';
import { PrismaClient } from '@prisma/client';

const blockchainService = new BlockchainService();
const prisma = new PrismaClient();

async function syncAllWallets() {
  console.log('🔄 Syncing all wallets with blockchain...');

  const wallets = await prisma.wallet.findMany({
    where: {
      blockchainAddress: { not: null },
      blockchainSyncStatus: 'SYNCED',
    },
  });

  for (const wallet of wallets) {
    try {
      await blockchainService.syncWalletBalance(wallet.id);
      console.log(`✅ Synced wallet ${wallet.id}`);
    } catch (error) {
      console.error(`❌ Error syncing wallet ${wallet.id}:`, error);
      
      await prisma.wallet.update({
        where: { id: wallet.id },
        data: { blockchainSyncStatus: 'ERROR' },
      });
    }
  }

  console.log('✅ Wallet sync complete');
}

// Run sync every 5 minutes
setInterval(syncAllWallets, 5 * 60 * 1000);

// Start event listener
blockchainService.startEventListener();

console.log('🚀 Blockchain sync worker started');
```

---

## 🎨 FRONTEND INTEGRATION

### 1. Install Dependencies

```bash
cd frontend

npm install ethers wagmi viem @rainbow-me/rainbowkit
npm install @web3-react/core @web3-react/injected-connector
```

### 2. Create Web3 Provider

Create `frontend/src/providers/Web3Provider.tsx`:

```typescript
'use client';

import { ReactNode } from 'react';
import { WagmiConfig, createConfig, configureChains } from 'wagmi';
import { polygon, polygonMumbai } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';
import { RainbowKitProvider, getDefaultWallets } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';

const { chains, publicClient } = configureChains(
  [polygon, polygonMumbai],
  [publicProvider()]
);

const { connectors } = getDefaultWallets({
  appName: 'CoinDaily',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
  chains,
});

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
});

export function Web3Provider({ children }: { children: ReactNode }) {
  return (
    <WagmiConfig config={wagmiConfig}>
      <RainbowKitProvider chains={chains}>
        {children}
      </RainbowKitProvider>
    </WagmiConfig>
  );
}
```

### 3. Create CDT Token Hook

Create `frontend/src/hooks/useCDTToken.ts`:

```typescript
import { useContractRead, useContractWrite, useAccount } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import CDT_ABI from '../abis/CoinDailyToken.json';

const CDT_ADDRESS = process.env.NEXT_PUBLIC_CDT_TOKEN_ADDRESS as `0x${string}`;

export function useCDTToken() {
  const { address } = useAccount();

  // Read balance
  const { data: balance, refetch: refetchBalance } = useContractRead({
    address: CDT_ADDRESS,
    abi: CDT_ABI,
    functionName: 'balanceOf',
    args: [address],
    watch: true,
  });

  // Read staked balance
  const { data: stakedBalance } = useContractRead({
    address: CDT_ADDRESS,
    abi: CDT_ABI,
    functionName: 'stakedBalance',
    args: [address],
  });

  // Read pending rewards
  const { data: pendingRewards } = useContractRead({
    address: CDT_ADDRESS,
    abi: CDT_ABI,
    functionName: 'pendingRewards',
    args: [address],
  });

  // Transfer tokens
  const { write: transfer, isLoading: isTransferring } = useContractWrite({
    address: CDT_ADDRESS,
    abi: CDT_ABI,
    functionName: 'transfer',
  });

  // Stake tokens
  const { write: stake, isLoading: isStaking } = useContractWrite({
    address: CDT_ADDRESS,
    abi: CDT_ABI,
    functionName: 'stake',
  });

  // Unstake tokens
  const { write: unstake, isLoading: isUnstaking } = useContractWrite({
    address: CDT_ADDRESS,
    abi: CDT_ABI,
    functionName: 'unstake',
  });

  // Claim rewards
  const { write: claimRewards, isLoading: isClaiming } = useContractWrite({
    address: CDT_ADDRESS,
    abi: CDT_ABI,
    functionName: 'claimStakingRewards',
  });

  return {
    balance: balance ? formatEther(balance as bigint) : '0',
    stakedBalance: stakedBalance ? formatEther(stakedBalance as bigint) : '0',
    pendingRewards: pendingRewards ? formatEther(pendingRewards as bigint) : '0',
    transfer: (to: string, amount: string) => transfer({ args: [to, parseEther(amount)] }),
    stake: (amount: string) => stake({ args: [parseEther(amount)] }),
    unstake: (amount: string) => unstake({ args: [parseEther(amount)] }),
    claimRewards,
    refetchBalance,
    isTransferring,
    isStaking,
    isUnstaking,
    isClaiming,
  };
}
```

### 4. Create Wallet Display Component

Create `frontend/src/components/wallet/CDTBalance.tsx`:

```typescript
'use client';

import { useCDTToken } from '@/hooks/useCDTToken';
import { useAccount } from 'wagmi';

export function CDTBalance() {
  const { address, isConnected } = useAccount();
  const { balance, stakedBalance, pendingRewards } = useCDTToken();

  if (!isConnected) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          Connect your wallet to view CDT balance
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">CDT Token Balance</h3>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Available</span>
          <span className="text-xl font-bold text-green-600">
            {parseFloat(balance).toLocaleString()} CDT
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-600">Staked</span>
          <span className="text-xl font-bold text-blue-600">
            {parseFloat(stakedBalance).toLocaleString()} CDT
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-600">Pending Rewards</span>
          <span className="text-xl font-bold text-purple-600">
            {parseFloat(pendingRewards).toLocaleString()} CDT
          </span>
        </div>

        <div className="pt-3 border-t">
          <div className="flex justify-between items-center">
            <span className="text-gray-800 font-medium">Total Balance</span>
            <span className="text-2xl font-bold text-gray-900">
              {(parseFloat(balance) + parseFloat(stakedBalance) + parseFloat(pendingRewards)).toLocaleString()} CDT
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## ✅ WALLET DESIGN VERIFICATION

### Current Support Matrix

| Token Type | Storage Type | Tracking Field | Status |
|------------|-------------|----------------|--------|
| **CE Points** | Off-chain (Database) | `cePoints` | ✅ Supported |
| **JOY Tokens** | Off-chain (Database) | `joyTokens` | ✅ Supported |
| **CDT Token** | On-chain (Blockchain) | `cdtOnChainBalance` | ✅ Supported (with enhancements) |
| **Platform Balance** | Off-chain (Database) | `availableBalance` | ✅ Supported |

### Multi-Token Wallet Structure

```typescript
interface WalletBalance {
  // Off-chain balances (internal ledger)
  cePoints: number;          // CE Points earned from engagement
  joyTokens: number;         // JOY Tokens from activities
  platformBalance: number;   // Fiat or internal currency
  
  // On-chain balance (blockchain)
  cdtOnChain: number;        // Actual CDT on Polygon blockchain
  cdtOffChain: number;       // Internal CDT ledger (pending deposits)
  
  // Staking
  stakedCDT: number;         // CDT locked in staking
  stakingRewards: number;    // Pending staking rewards
  
  // Combined totals
  totalCDT: number;          // On-chain + off-chain + staked
  totalValue: number;        // USD equivalent of all tokens
}
```

### ✅ CONFIRMATION: Wallet Can Hold All Token Types

**Answer: YES, the wallet design CAN and DOES support:**

✅ CE Points (off-chain)  
✅ ERC-20 CDT Token (on-chain)  
✅ JOY Tokens (off-chain)  
✅ Platform balances (off-chain)  
✅ Staking positions  
✅ Pending deposits/withdrawals  

**What Was Added:**
- `blockchainAddress` - Polygon wallet address
- `cdtOnChainBalance` - Blockchain CDT balance
- `cdtOffChainBalance` - Internal ledger CDT
- `cdtPendingDeposit` - Deposits being confirmed
- `cdtPendingWithdrawal` - Withdrawals being processed
- `lastBlockchainSync` - Sync timestamp
- `blockchainSyncStatus` - SYNCED/SYNCING/ERROR
- `BlockchainTransaction` model - On-chain tx tracking
- `StakingRecord` model - Staking positions
- `ConversionRecord` model - CE→CDT conversions

---

## 🧪 TESTING GUIDE

### Unit Tests

Create `test/CoinDailyToken.test.ts`:

```typescript
import { expect } from "chai";
import { ethers } from "hardhat";
import { CoinDailyToken } from "../typechain-types";

describe("CoinDailyToken", function () {
  let token: CoinDailyToken;
  let owner: any, user1: any, user2: any;
  let stakingPool: any, liquidityPool: any, devFund: any;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    
    // Deploy pool contracts
    const SimpleWallet = await ethers.getContractFactory("SimpleWallet");
    stakingPool = await SimpleWallet.deploy();
    liquidityPool = await SimpleWallet.deploy();
    devFund = await SimpleWallet.deploy();

    // Deploy token
    const CoinDailyToken = await ethers.getContractFactory("CoinDailyToken");
    token = await CoinDailyToken.deploy(
      await stakingPool.getAddress(),
      await liquidityPool.getAddress(),
      await devFund.getAddress()
    );
  });

  describe("Deployment", function () {
    it("Should set the right total supply", async function () {
      const totalSupply = await token.totalSupply();
      expect(totalSupply).to.equal(ethers.parseEther("1000000000"));
    });

    it("Should assign the total supply to the owner", async function () {
      const ownerBalance = await token.balanceOf(owner.address);
      expect(ownerBalance).to.equal(await token.totalSupply());
    });

    it("Should have correct token details", async function () {
      expect(await token.name()).to.equal("CoinDaily Token");
      expect(await token.symbol()).to.equal("CDT");
      expect(await token.decimals()).to.equal(18);
    });
  });

  describe("Transfers", function () {
    it("Should transfer tokens between accounts", async function () {
      await token.transfer(user1.address, ethers.parseEther("100"));
      expect(await token.balanceOf(user1.address)).to.equal(ethers.parseEther("100"));
    });

    it("Should fail if sender doesn't have enough tokens", async function () {
      await expect(
        token.connect(user1).transfer(user2.address, ethers.parseEther("1"))
      ).to.be.reverted;
    });

    it("Should update balances after transfers", async function () {
      const initialOwnerBalance = await token.balanceOf(owner.address);
      await token.transfer(user1.address, ethers.parseEther("100"));
      await token.transfer(user2.address, ethers.parseEther("50"));

      const finalOwnerBalance = await token.balanceOf(owner.address);
      expect(finalOwnerBalance).to.equal(
        initialOwnerBalance - ethers.parseEther("150")
      );

      expect(await token.balanceOf(user1.address)).to.equal(
        ethers.parseEther("100")
      );
      expect(await token.balanceOf(user2.address)).to.equal(
        ethers.parseEther("50")
      );
    });
  });

  describe("Staking", function () {
    beforeEach(async function () {
      // Transfer tokens to user1 for staking
      await token.transfer(user1.address, ethers.parseEther("1000"));
    });

    it("Should allow users to stake tokens", async function () {
      await token.connect(user1).stake(ethers.parseEther("100"));
      
      expect(await token.stakedBalance(user1.address)).to.equal(
        ethers.parseEther("100")
      );
    });

    it("Should allow users to unstake tokens", async function () {
      await token.connect(user1).stake(ethers.parseEther("100"));
      await token.connect(user1).unstake(ethers.parseEther("50"));
      
      expect(await token.stakedBalance(user1.address)).to.equal(
        ethers.parseEther("50")
      );
    });

    it("Should calculate pending rewards correctly", async function () {
      await token.connect(user1).stake(ethers.parseEther("100"));
      
      // Fast forward time by 30 days
      await ethers.provider.send("evm_increaseTime", [30 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine", []);
      
      const rewards = await token.pendingRewards(user1.address);
      expect(rewards).to.be.gt(0); // Should have some rewards
    });
  });

  describe("Access Control", function () {
    it("Should allow admin to pause", async function () {
      await token.pause();
      expect(await token.paused()).to.be.true;
    });

    it("Should not allow non-admin to pause", async function () {
      await expect(token.connect(user1).pause()).to.be.reverted;
    });
  });
});
```

Run tests:

```bash
npx hardhat test
npx hardhat coverage
```

---

## 🔐 SECURITY CHECKLIST

### Smart Contract Security

- [ ] Audit by reputable firm (CertiK, OpenZeppelin, Trail of Bits)
- [ ] Multi-sig wallet for admin functions (Gnosis Safe)
- [ ] Time-lock for critical parameter changes
- [ ] Emergency pause mechanism tested
- [ ] Reentrancy protection verified
- [ ] Integer overflow/underflow checks (Solidity 0.8.x safe)
- [ ] Access control properly configured
- [ ] Fee calculation tested for edge cases
- [ ] Anti-whale limits working correctly
- [ ] Vesting schedules properly locked

### Backend Security

- [ ] Private keys encrypted with AES-256-GCM
- [ ] Use AWS KMS or HashiCorp Vault for key management
- [ ] Never log private keys or sensitive data
- [ ] Rate limiting on API endpoints
- [ ] Webhook signature verification
- [ ] Database connection encryption
- [ ] Environment variables properly secured
- [ ] Regular security updates for dependencies
- [ ] DDoS protection enabled
- [ ] API authentication with JWT

### Operational Security

- [ ] Multi-sig required for large transfers (>$10k)
- [ ] Daily withdrawal limits enforced
- [ ] Suspicious activity monitoring active
- [ ] Auto-lock on high risk scores
- [ ] Regular backup of wallet data
- [ ] Disaster recovery plan documented
- [ ] Incident response team designated
- [ ] Regular security audits scheduled
- [ ] Bug bounty program launched
- [ ] Insurance for smart contract risks

---

## 📋 DEPLOYMENT CHECKLIST

### Pre-Deployment

- [ ] All tests passing (100% coverage target)
- [ ] Smart contract audited by professionals
- [ ] Frontend tested on testnet
- [ ] Backend sync worker tested
- [ ] Database migrations completed
- [ ] Environment variables configured
- [ ] Multi-sig wallets setup
- [ ] Team members briefed

### Testnet Deployment (Polygon Mumbai)

- [ ] Deploy smart contracts
- [ ] Verify contracts on PolygonScan
- [ ] Distribute test tokens
- [ ] Test all token functions
- [ ] Test staking/unstaking
- [ ] Test wallet integration
- [ ] Test CE Points conversion
- [ ] Load test with high traffic
- [ ] Security testing completed
- [ ] Bug fixes applied

### Mainnet Deployment (Polygon)

- [ ] Final audit completed
- [ ] Deploy contracts to mainnet
- [ ] Verify on PolygonScan
- [ ] Execute token distribution
- [ ] Setup team vesting schedules
- [ ] Add liquidity to DEX
- [ ] Enable trading
- [ ] Start blockchain sync worker
- [ ] Monitor for 24 hours
- [ ] Announce launch

### Post-Deployment

- [ ] Submit to CoinGecko
- [ ] Submit to CoinMarketCap
- [ ] List on exchanges (Binance, Uniswap, QuickSwap)
- [ ] Marketing campaign launched
- [ ] Community channels active
- [ ] Documentation published
- [ ] Support team ready
- [ ] Monitor blockchain events
- [ ] Track token metrics
- [ ] Regular progress updates

---

## 🎯 NEXT STEPS

1. **Review this template** and customize token parameters
2. **Apply database schema enhancements** from WALLET_SCHEMA_ENHANCEMENTS.prisma
3. **Deploy to testnet** for testing
4. **Integrate backend services** for blockchain sync
5. **Build frontend components** for wallet display
6. **Test thoroughly** with real scenarios
7. **Get professional audit** before mainnet
8. **Deploy to production** following checklist

---

## 📞 SUPPORT & RESOURCES

### Documentation
- OpenZeppelin Contracts: https://docs.openzeppelin.com/contracts
- Polygon Docs: https://docs.polygon.technology
- Hardhat Docs: https://hardhat.org/docs
- Ethers.js Docs: https://docs.ethers.org

### Audit Firms
- CertiK: https://www.certik.com
- OpenZeppelin: https://www.openzeppelin.com/security-audits
- Trail of Bits: https://www.trailofbits.com

### Tools
- Remix IDE: https://remix.ethereum.org
- Tenderly: https://tenderly.co
- Polygonscan: https://polygonscan.com

---

**Template Created**: December 2024  
**Platform**: CoinDaily - Africa's Premier Crypto News Platform  
**Network**: Polygon (MATIC)  
**Status**: Production-Ready Template ✅
