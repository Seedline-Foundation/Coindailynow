/**
 * Finance API Client - GraphQL Operations for Wallet & Transaction Management
 * 
 * Handles all financial operations including:
 * - Wallet queries and management
 * - Deposits, withdrawals, and transfers
 * - Staking and conversions
 * - Payments and subscriptions
 * - Admin operations
 */

import { gql } from '@apollo/client';
import { apolloClient } from './apolloClient';
import {
  Wallet,
  WalletTransaction,
  Staking,
  TransactionResult,
  DepositInput,
  WithdrawalInput,
  TransferInput,
  PaymentInput,
  StakingInput,
  ConversionInput,
  CEConversionInput,
  GiftInput,
  TransactionFilters,
  PaginatedTransactions,
  AdminWalletOverview,
  CEPointsOperation,
  AirdropInput,
  Airdrop
} from '../types/finance';

// ============================================================================
// FRAGMENTS
// ============================================================================

const WALLET_FRAGMENT = gql`
  fragment WalletFields on Wallet {
    id
    userId
    walletType
    currency
    availableBalance
    lockedBalance
    stakedBalance
    totalBalance
    cePoints
    joyTokens
    status
    lastTransactionAt
    createdAt
    updatedAt
  }
`;

const TRANSACTION_FRAGMENT = gql`
  fragment TransactionFields on WalletTransaction {
    id
    transactionHash
    transactionType
    operationType
    fromWalletId
    toWalletId
    amount
    currency
    netAmount
    fee
    status
    paymentMethod
    externalReference
    purpose
    metadata
    createdAt
    updatedAt
  }
`;

const STAKING_FRAGMENT = gql`
  fragment StakingFields on Staking {
    id
    userId
    walletId
    amount
    currency
    status
    aprRate
    startDate
    endDate
    rewardsEarned
    autoRenew
    createdAt
    updatedAt
  }
`;

// ============================================================================
// QUERIES
// ============================================================================

export const GET_WALLET = gql`
  ${WALLET_FRAGMENT}
  query GetWallet($walletId: ID!) {
    getWallet(walletId: $walletId) {
      ...WalletFields
    }
  }
`;

export const GET_USER_WALLETS = gql`
  ${WALLET_FRAGMENT}
  query GetUserWallets($userId: ID!) {
    getUserWallets(userId: $userId) {
      ...WalletFields
    }
  }
`;

export const GET_WALLET_TRANSACTIONS = gql`
  ${TRANSACTION_FRAGMENT}
  query GetWalletTransactions(
    $walletId: ID!
    $limit: Int
    $offset: Int
    $status: TransactionStatus
  ) {
    getWalletTransactions(
      walletId: $walletId
      limit: $limit
      offset: $offset
      status: $status
    ) {
      ...TransactionFields
    }
  }
`;

export const GET_TRANSACTION = gql`
  ${TRANSACTION_FRAGMENT}
  query GetTransaction($transactionId: ID!) {
    getTransaction(transactionId: $transactionId) {
      ...TransactionFields
    }
  }
`;

export const GET_USER_STAKINGS = gql`
  ${STAKING_FRAGMENT}
  query GetUserStakings($userId: ID!) {
    getUserStakings(userId: $userId) {
      ...StakingFields
    }
  }
`;

export const GET_WALLET_BALANCE = gql`
  ${WALLET_FRAGMENT}
  query GetWalletBalance($walletId: ID!) {
    getWalletBalance(walletId: $walletId) {
      ...WalletFields
    }
  }
`;

// ============================================================================
// MUTATIONS - USER OPERATIONS
// ============================================================================

export const DEPOSIT_FROM_EXTERNAL_WALLET = gql`
  mutation DepositFromExternalWallet($input: DepositInput!) {
    depositFromExternalWallet(input: $input) {
      success
      transactionId
      error
      requiresOTP
      requiresApproval
    }
  }
`;

export const WITHDRAW_TO_EXTERNAL_WALLET = gql`
  mutation WithdrawToExternalWallet($input: WithdrawalInput!) {
    withdrawToExternalWallet(input: $input) {
      success
      transactionId
      error
      requiresOTP
      requiresApproval
    }
  }
`;

export const TRANSFER_BETWEEN_USERS = gql`
  mutation TransferBetweenUsers($input: TransferInput!) {
    transferBetweenUsers(input: $input) {
      success
      transactionId
      error
      requiresOTP
      requiresApproval
    }
  }
`;

export const MAKE_PAYMENT = gql`
  mutation MakePayment($input: PaymentInput!) {
    makePayment(input: $input) {
      success
      transactionId
      error
      requiresOTP
      requiresApproval
    }
  }
`;

export const STAKE_TOKENS = gql`
  mutation StakeTokens($input: StakingInput!) {
    stakeTokens(input: $input) {
      success
      transactionId
      error
      requiresOTP
      requiresApproval
    }
  }
`;

export const UNSTAKE_TOKENS = gql`
  mutation UnstakeTokens($stakingId: ID!) {
    unstakeTokens(stakingId: $stakingId) {
      success
      transactionId
      error
      requiresOTP
      requiresApproval
    }
  }
`;

export const CONVERT_CE_TO_TOKENS = gql`
  mutation ConvertCEToTokens($input: ConversionInput!) {
    convertCEToTokens(input: $input) {
      success
      transactionId
      error
      requiresOTP
      requiresApproval
    }
  }
`;

export const SEND_GIFT = gql`
  mutation SendGift($input: GiftInput!) {
    sendGift(input: $input) {
      success
      transactionId
      error
      requiresOTP
      requiresApproval
    }
  }
`;

// ============================================================================
// CLIENT FUNCTIONS - QUERIES
// ============================================================================

export const financeApi = {
  // Wallet Queries
  async getWallet(walletId: string): Promise<Wallet | null> {
    const { data } = await apolloClient.query({
      query: GET_WALLET,
      variables: { walletId },
      fetchPolicy: 'network-only'
    });
    return data.getWallet;
  },

  async getUserWallets(userId: string): Promise<Wallet[]> {
    const { data } = await apolloClient.query({
      query: GET_USER_WALLETS,
      variables: { userId },
      fetchPolicy: 'network-only'
    });
    return data.getUserWallets;
  },

  async getWalletBalance(walletId: string): Promise<Wallet | null> {
    const { data } = await apolloClient.query({
      query: GET_WALLET_BALANCE,
      variables: { walletId },
      fetchPolicy: 'network-only'
    });
    return data.getWalletBalance;
  },

  // Transaction Queries
  async getWalletTransactions(
    walletId: string,
    filters?: TransactionFilters
  ): Promise<WalletTransaction[]> {
    const { data } = await apolloClient.query({
      query: GET_WALLET_TRANSACTIONS,
      variables: {
        walletId,
        limit: filters?.limit,
        offset: filters?.offset,
        status: filters?.status
      },
      fetchPolicy: 'network-only'
    });
    return data.getWalletTransactions;
  },

  async getTransaction(transactionId: string): Promise<WalletTransaction | null> {
    const { data } = await apolloClient.query({
      query: GET_TRANSACTION,
      variables: { transactionId },
      fetchPolicy: 'network-only'
    });
    return data.getTransaction;
  },

  async getTransactionFeed(filters?: TransactionFilters): Promise<WalletTransaction[]> {
    // Mock implementation for real-time transaction feed
    // In production, this would use WebSocket subscription or polling
    const { data } = await apolloClient.query({
      query: GET_WALLET_TRANSACTIONS,
      variables: {
        walletId: filters?.walletId,
        limit: filters?.limit || 50,
        offset: filters?.offset || 0,
        status: filters?.status
      },
      fetchPolicy: 'network-only'
    });
    return data.getWalletTransactions;
  },

  // Staking Queries
  async getUserStakings(userId: string): Promise<Staking[]> {
    const { data } = await apolloClient.query({
      query: GET_USER_STAKINGS,
      variables: { userId },
      fetchPolicy: 'network-only'
    });
    return data.getUserStakings;
  },

  // User Operations
  async depositFromExternalWallet(input: DepositInput): Promise<TransactionResult> {
    const { data } = await apolloClient.mutate({
      mutation: DEPOSIT_FROM_EXTERNAL_WALLET,
      variables: { input }
    });
    return data.depositFromExternalWallet;
  },

  async withdrawToExternalWallet(input: WithdrawalInput): Promise<TransactionResult> {
    const { data } = await apolloClient.mutate({
      mutation: WITHDRAW_TO_EXTERNAL_WALLET,
      variables: { input }
    });
    return data.withdrawToExternalWallet;
  },

  async transferBetweenUsers(input: TransferInput): Promise<TransactionResult> {
    const { data } = await apolloClient.mutate({
      mutation: TRANSFER_BETWEEN_USERS,
      variables: { input }
    });
    return data.transferBetweenUsers;
  },

  async makePayment(input: PaymentInput): Promise<TransactionResult> {
    const { data } = await apolloClient.mutate({
      mutation: MAKE_PAYMENT,
      variables: { input }
    });
    return data.makePayment;
  },

  async processPayment(input: PaymentInput): Promise<TransactionResult> {
    // Alias for makePayment to match component expectations
    return this.makePayment(input);
  },

  async stakeTokens(input: StakingInput): Promise<TransactionResult> {
    const { data } = await apolloClient.mutate({
      mutation: STAKE_TOKENS,
      variables: { input }
    });
    return data.stakeTokens;
  },

  async unstakeTokens(input: { stakingId: string; userId: string; walletId: string }): Promise<TransactionResult> {
    const { data } = await apolloClient.mutate({
      mutation: UNSTAKE_TOKENS,
      variables: { stakingId: input.stakingId }
    });
    return data.unstakeTokens;
  },

  async convertCEToTokens(input: ConversionInput): Promise<TransactionResult> {
    const { data } = await apolloClient.mutate({
      mutation: CONVERT_CE_TO_TOKENS,
      variables: { input }
    });
    return data.convertCEToTokens;
  },

  async convertCEPoints(input: CEConversionInput): Promise<TransactionResult> {
    // Use the existing convertCEToTokens GraphQL mutation but with CEConversionInput
    const conversionInput: ConversionInput = {
      userId: input.userId,
      walletId: input.walletId,
      fromCurrency: 'CE',
      toCurrency: input.targetCurrency,
      amount: input.cePoints,
      conversionRate: 1, // Will be calculated server-side
      metadata: { ...input.metadata, otpCode: input.otpCode }
    };
    
    const { data } = await apolloClient.mutate({
      mutation: CONVERT_CE_TO_TOKENS,
      variables: { input: conversionInput }
    });
    return data.convertCEToTokens;
  },

  async getUserSubscriptions(userId: string, filters?: { status?: string }): Promise<any[]> {
    // Mock implementation - replace with actual GraphQL query when available
    return [];
  },

  async getUserSubscription(userId: string): Promise<any | null> {
    // Mock implementation - replace with actual GraphQL query when available
    const subscriptions = await this.getUserSubscriptions(userId, { status: 'ACTIVE' });
    return subscriptions.length > 0 ? subscriptions[0] : null;
  },

  async purchaseSubscription(input: {
    userId: string;
    walletId: string;
    tier: string;
    paymentMethod: string;
    otpCode?: string;
  }): Promise<any> {
    // Mock implementation - replace with actual GraphQL mutation when available
    return {
      success: true,
      subscriptionId: `sub_${Date.now()}`,
      message: 'Subscription purchased successfully'
    };
  },

  async sendGift(input: GiftInput): Promise<TransactionResult> {
    const { data } = await apolloClient.mutate({
      mutation: SEND_GIFT,
      variables: { input }
    });
    return data.sendGift;
  },

  // ============================================================================
  // WALLET MODAL API METHODS - GraphQL Implementation
  // ============================================================================

  async convertCEToJY(input: { walletId: string; ceAmount: number }): Promise<{ success: boolean; jyAmount?: number; transactionId?: string; error?: string }> {
    const mutation = gql`
      mutation ConvertCEToJY($walletId: ID!, $ceAmount: Float!) {
        convertCEToJY(walletId: $walletId, ceAmount: $ceAmount) {
          success
          jyAmount
          transactionId
          error
        }
      }
    `;

    try {
      const { data } = await apolloClient.mutate({
        mutation,
        variables: { walletId: input.walletId, ceAmount: input.ceAmount },
      });
      return data.convertCEToJY;
    } catch (error: any) {
      console.error('convertCEToJY error:', error);
      return { success: false, error: error.message || 'Failed to convert CE to JY' };
    }
  },

  async getWhitelistedWallets(userId: string): Promise<string[]> {
    const query = gql`
      query GetWhitelistedWallets {
        getWhitelistedWallets
      }
    `;

    try {
      const { data} = await apolloClient.query({
        query,
        fetchPolicy: 'network-only',
      });
      return data.getWhitelistedWallets || [];
    } catch (error: any) {
      console.error('getWhitelistedWallets error:', error);
      return [];
    }
  },

  async depositFromWallet(input: { walletId: string; sourceAddress: string; amount: number; txHash?: string }): Promise<{ success: boolean; txHash?: string; transactionId?: string; error?: string }> {
    const mutation = gql`
      mutation DepositFromWallet($walletId: ID!, $sourceAddress: String!, $amount: Float!, $txHash: String) {
        depositFromWallet(walletId: $walletId, sourceAddress: $sourceAddress, amount: $amount, txHash: $txHash) {
          success
          txHash
          transactionId
          error
        }
      }
    `;

    try {
      const { data } = await apolloClient.mutate({
        mutation,
        variables: input,
      });
      return data.depositFromWallet;
    } catch (error: any) {
      console.error('depositFromWallet error:', error);
      return { success: false, error: error.message || 'Failed to deposit from wallet' };
    }
  },

  async createTransfer(input: { fromWalletId: string; toIdentifier: string; amount: number; transferType: string; note?: string }): Promise<{ success: boolean; txId?: string; error?: string }> {
    const mutation = gql`
      mutation CreateTransfer($fromWalletId: ID!, $toIdentifier: String!, $amount: Float!, $transferType: TransferType!, $note: String) {
        createTransfer(fromWalletId: $fromWalletId, toIdentifier: $toIdentifier, amount: $amount, transferType: $transferType, note: $note) {
          success
          txId
          error
        }
      }
    `;

    try {
      const { data } = await apolloClient.mutate({
        mutation,
        variables: input,
      });
      return data.createTransfer;
    } catch (error: any) {
      console.error('createTransfer error:', error);
      return { success: false, error: error.message || 'Failed to create transfer' };
    }
  },

  async searchUsers(query: string, limit?: number): Promise<Array<{ id: string; username: string; displayName: string; avatar?: string; role: string }>> {
    const searchQuery = gql`
      query SearchUsers($query: String!, $limit: Int) {
        searchUsers(query: $query, limit: $limit) {
          id
          username
          displayName
          avatar
          role
        }
      }
    `;

    try {
      const { data } = await apolloClient.query({
        query: searchQuery,
        variables: { query, limit: limit || 10 },
        fetchPolicy: 'network-only',
      });
      return data.searchUsers || [];
    } catch (error: any) {
      console.error('searchUsers error:', error);
      return [];
    }
  },

  async getExchangeRate(input: { fromCurrency: string; toCurrency: string; amount: number; provider: string }): Promise<{ fromCurrency: string; toCurrency: string; rate: number; fee: number; estimatedTime: string; provider: string }> {
    const query = gql`
      query GetExchangeRate($fromCurrency: String!, $toCurrency: String!, $amount: Float!, $provider: PaymentProvider!) {
        getExchangeRate(fromCurrency: $fromCurrency, toCurrency: $toCurrency, amount: $amount, provider: $provider) {
          fromCurrency
          toCurrency
          rate
          fee
          estimatedTime
          provider
        }
      }
    `;

    try {
      const { data } = await apolloClient.query({
        query,
        variables: input,
        fetchPolicy: 'network-only',
      });
      return data.getExchangeRate;
    } catch (error: any) {
      console.error('getExchangeRate error:', error);
      // Return mock data on error
      return {
        fromCurrency: input.fromCurrency,
        toCurrency: input.toCurrency,
        rate: 1.0,
        fee: 2.5,
        estimatedTime: '10-20 minutes',
        provider: input.provider,
      };
    }
  },

  async checkSwapStatus(walletId: string): Promise<{ success: boolean; txHash?: string; error?: string }> {
    const query = gql`
      query CheckSwapStatus($walletId: ID!) {
        checkSwapStatus(walletId: $walletId) {
          success
          txHash
          error
        }
      }
    `;

    try {
      const { data } = await apolloClient.query({
        query,
        variables: { walletId },
        fetchPolicy: 'network-only',
      });
      return data.checkSwapStatus;
    } catch (error: any) {
      console.error('checkSwapStatus error:', error);
      return { success: false, error: error.message || 'Failed to check swap status' };
    }
  }
};

// ============================================================================
// REST API FALLBACK (for operations not in GraphQL)
// ============================================================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const financeRestApi = {
  // Admin Operations
  async getAdminWalletOverview(): Promise<AdminWalletOverview> {
    const response = await fetch(`${API_BASE_URL}/api/finance/admin/overview`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    });
    if (!response.ok) throw new Error('Failed to fetch admin wallet overview');
    return response.json();
  },

  async assignCEPoints(operation: CEPointsOperation): Promise<TransactionResult> {
    const response = await fetch(`${API_BASE_URL}/api/finance/admin/ce-points/assign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      },
      body: JSON.stringify(operation)
    });
    if (!response.ok) throw new Error('Failed to assign CE points');
    return response.json();
  },

  async deductCEPoints(operation: CEPointsOperation): Promise<TransactionResult> {
    const response = await fetch(`${API_BASE_URL}/api/finance/admin/ce-points/deduct`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      },
      body: JSON.stringify(operation)
    });
    if (!response.ok) throw new Error('Failed to deduct CE points');
    return response.json();
  },

  async createAirdrop(input: AirdropInput): Promise<Airdrop> {
    const response = await fetch(`${API_BASE_URL}/api/finance/admin/airdrops`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      },
      body: JSON.stringify(input)
    });
    if (!response.ok) throw new Error('Failed to create airdrop');
    return response.json();
  },

  async uploadAirdropCSV(file: File): Promise<{ recipients: any[] }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/api/finance/admin/airdrops/upload-csv`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      },
      body: formData
    });
    if (!response.ok) throw new Error('Failed to upload airdrop CSV');
    return response.json();
  },

  async requestOTP(operation: string, transactionId?: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE_URL}/api/finance/otp/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      },
      body: JSON.stringify({ operation, transactionId })
    });
    if (!response.ok) throw new Error('Failed to request OTP');
    return response.json();
  },

  async verifyOTP(otpCode: string, transactionId?: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE_URL}/api/finance/otp/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      },
      body: JSON.stringify({ otpCode, transactionId })
    });
    if (!response.ok) throw new Error('Failed to verify OTP');
    return response.json();
  },

  async getTransactionFeed(queryParams?: string): Promise<WalletTransaction[]> {
    const response = await fetch(`${API_BASE_URL}/api/finance/admin/transaction-feed${queryParams ? `?${queryParams}` : ''}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    });
    if (!response.ok) throw new Error('Failed to fetch transaction feed');
    return response.json();
  },

  // ============================================================================
  // WALLET MODAL API METHODS - GraphQL Implementation
  // ============================================================================

  async convertCEToJY(input: { walletId: string; ceAmount: number }): Promise<{ success: boolean; jyAmount?: number; transactionId?: string; error?: string }> {
    const mutation = gql`
      mutation ConvertCEToJY($walletId: ID!, $ceAmount: Float!) {
        convertCEToJY(walletId: $walletId, ceAmount: $ceAmount) {
          success
          jyAmount
          transactionId
          error
        }
      }
    `;

    try {
      const { data } = await apolloClient.mutate({
        mutation,
        variables: { walletId: input.walletId, ceAmount: input.ceAmount },
      });
      return data.convertCEToJY;
    } catch (error: any) {
      console.error('convertCEToJY error:', error);
      return { success: false, error: error.message || 'Failed to convert CE to JY' };
    }
  },

  async getWhitelistedWallets(userId: string): Promise<string[]> {
    const query = gql`
      query GetWhitelistedWallets {
        getWhitelistedWallets
      }
    `;

    try {
      const { data } = await apolloClient.query({
        query,
        fetchPolicy: 'network-only',
      });
      return data.getWhitelistedWallets || [];
    } catch (error: any) {
      console.error('getWhitelistedWallets error:', error);
      return [];
    }
  },

  async depositFromWallet(input: { walletId: string; sourceAddress: string; amount: number; txHash?: string }): Promise<{ success: boolean; txHash?: string; transactionId?: string; error?: string }> {
    const mutation = gql`
      mutation DepositFromWallet($walletId: ID!, $sourceAddress: String!, $amount: Float!, $txHash: String) {
        depositFromWallet(walletId: $walletId, sourceAddress: $sourceAddress, amount: $amount, txHash: $txHash) {
          success
          txHash
          transactionId
          error
        }
      }
    `;

    try {
      const { data } = await apolloClient.mutate({
        mutation,
        variables: input,
      });
      return data.depositFromWallet;
    } catch (error: any) {
      console.error('depositFromWallet error:', error);
      return { success: false, error: error.message || 'Failed to deposit from wallet' };
    }
  },

  async createTransfer(input: { fromWalletId: string; toIdentifier: string; amount: number; transferType: string; note?: string }): Promise<{ success: boolean; txId?: string; error?: string }> {
    const mutation = gql`
      mutation CreateTransfer($fromWalletId: ID!, $toIdentifier: String!, $amount: Float!, $transferType: TransferType!, $note: String) {
        createTransfer(fromWalletId: $fromWalletId, toIdentifier: $toIdentifier, amount: $amount, transferType: $transferType, note: $note) {
          success
          txId
          error
        }
      }
    `;

    try {
      const { data } = await apolloClient.mutate({
        mutation,
        variables: input,
      });
      return data.createTransfer;
    } catch (error: any) {
      console.error('createTransfer error:', error);
      return { success: false, error: error.message || 'Failed to create transfer' };
    }
  },

  async searchUsers(query: string, limit?: number): Promise<Array<{ id: string; username: string; displayName: string; avatar?: string; role: string }>> {
    const searchQuery = gql`
      query SearchUsers($query: String!, $limit: Int) {
        searchUsers(query: $query, limit: $limit) {
          id
          username
          displayName
          avatar
          role
        }
      }
    `;

    try {
      const { data } = await apolloClient.query({
        query: searchQuery,
        variables: { query, limit: limit || 10 },
        fetchPolicy: 'network-only',
      });
      return data.searchUsers || [];
    } catch (error: any) {
      console.error('searchUsers error:', error);
      return [];
    }
  },

  async getExchangeRate(input: { fromCurrency: string; toCurrency: string; amount: number; provider: string }): Promise<{ fromCurrency: string; toCurrency: string; rate: number; fee: number; estimatedTime: string; provider: string }> {
    const query = gql`
      query GetExchangeRate($fromCurrency: String!, $toCurrency: String!, $amount: Float!, $provider: PaymentProvider!) {
        getExchangeRate(fromCurrency: $fromCurrency, toCurrency: $toCurrency, amount: $amount, provider: $provider) {
          fromCurrency
          toCurrency
          rate
          fee
          estimatedTime
          provider
        }
      }
    `;

    try {
      const { data } = await apolloClient.query({
        query,
        variables: input,
        fetchPolicy: 'network-only',
      });
      return data.getExchangeRate;
    } catch (error: any) {
      console.error('getExchangeRate error:', error);
      // Return mock data as fallback
      return {
        fromCurrency: input.fromCurrency,
        toCurrency: input.toCurrency,
        rate: 1.0,
        fee: 2.5,
        estimatedTime: '5-10 minutes',
        provider: input.provider
      };
    }
  },

  async checkSwapStatus(walletId: string): Promise<{ success: boolean; txHash?: string; error?: string }> {
    const query = gql`
      query CheckSwapStatus($walletId: ID!) {
        checkSwapStatus(walletId: $walletId) {
          success
          txHash
          error
        }
      }
    `;

    try {
      const { data } = await apolloClient.query({
        query,
        variables: { walletId },
        fetchPolicy: 'network-only',
      });
      return data.checkSwapStatus;
    } catch (error: any) {
      console.error('checkSwapStatus error:', error);
      return { success: false, error: error.message || 'Failed to check swap status' };
    }
  },

  // ============================================================================
  // WITHDRAWAL MANAGEMENT
  // ============================================================================

  /**
   * Create a withdrawal request
   */
  async createWithdrawalRequest(input: {
    walletId: string;
    amount: number;
    destinationAddress: string;
    notes?: string;
  }): Promise<{
    success: boolean;
    message: string;
    request?: any;
    nextAvailableDate?: string;
    hoursUntilNextRequest?: number;
  }> {
    const mutation = gql`
      mutation CreateWithdrawalRequest(
        $walletId: ID!
        $amount: Float!
        $destinationAddress: String!
        $notes: String
      ) {
        createWithdrawalRequest(
          walletId: $walletId
          amount: $amount
          destinationAddress: $destinationAddress
          notes: $notes
        ) {
          success
          message
          request {
            id
            amount
            destinationAddress
            status
            requestedAt
            adminNotes
          }
          nextAvailableDate
          hoursUntilNextRequest
        }
      }
    `;

    try {
      const { data } = await apolloClient.mutate({
        mutation,
        variables: input,
      });
      return data.createWithdrawalRequest;
    } catch (error: any) {
      console.error('createWithdrawalRequest error:', error);
      return {
        success: false,
        message: error.message || 'Failed to create withdrawal request',
      };
    }
  },

  /**
   * Get user's withdrawal requests
   */
  async getUserWithdrawalRequests(
    status?: string,
    limit?: number
  ): Promise<any[]> {
    const query = gql`
      query GetUserWithdrawalRequests($status: WithdrawalStatus, $limit: Int) {
        getUserWithdrawalRequests(status: $status, limit: $limit) {
          id
          amount
          destinationAddress
          status
          requestedAt
          processedAt
          adminNotes
          transactionHash
        }
      }
    `;

    try {
      const { data } = await apolloClient.query({
        query,
        variables: { status, limit },
        fetchPolicy: 'network-only',
      });
      return data.getUserWithdrawalRequests || [];
    } catch (error: any) {
      console.error('getUserWithdrawalRequests error:', error);
      return [];
    }
  },

  /**
   * Get pending withdrawal requests (Admin only)
   */
  async getPendingWithdrawalRequests(
    limit?: number,
    offset?: number
  ): Promise<{ requests: any[]; total: number }> {
    const query = gql`
      query GetPendingWithdrawalRequests($limit: Int, $offset: Int) {
        getPendingWithdrawalRequests(limit: $limit, offset: $offset) {
          id
          amount
          destinationAddress
          status
          requestedAt
          user {
            id
            username
            email
            role
          }
          wallet {
            id
            joyTokens
          }
        }
      }
    `;

    try {
      const { data } = await apolloClient.query({
        query,
        variables: { limit, offset },
        fetchPolicy: 'network-only',
      });
      return {
        requests: data.getPendingWithdrawalRequests || [],
        total: data.getPendingWithdrawalRequests?.length || 0,
      };
    } catch (error: any) {
      console.error('getPendingWithdrawalRequests error:', error);
      return { requests: [], total: 0 };
    }
  },

  /**
   * Approve withdrawal request (Admin only)
   */
  async approveWithdrawalRequest(input: {
    requestId: string;
    adminNotes?: string;
    txHash?: string;
  }): Promise<{ success: boolean; error?: string }> {
    const mutation = gql`
      mutation ApproveWithdrawalRequest(
        $requestId: ID!
        $adminNotes: String
        $txHash: String
      ) {
        approveWithdrawalRequest(
          requestId: $requestId
          adminNotes: $adminNotes
          txHash: $txHash
        ) {
          id
          status
          reviewedAt
          transactionHash
        }
      }
    `;

    try {
      await apolloClient.mutate({
        mutation,
        variables: input,
      });
      return { success: true };
    } catch (error: any) {
      console.error('approveWithdrawalRequest error:', error);
      return {
        success: false,
        error: error.message || 'Failed to approve withdrawal',
      };
    }
  },

  /**
   * Reject withdrawal request (Admin only)
   */
  async rejectWithdrawalRequest(input: {
    requestId: string;
    reason: string;
    adminNotes?: string;
  }): Promise<{ success: boolean; error?: string }> {
    const mutation = gql`
      mutation RejectWithdrawalRequest(
        $requestId: ID!
        $reason: String!
        $adminNotes: String
      ) {
        rejectWithdrawalRequest(
          requestId: $requestId
          reason: $reason
          adminNotes: $adminNotes
        ) {
          id
          status
          reviewedAt
          adminNotes
        }
      }
    `;

    try {
      await apolloClient.mutate({
        mutation,
        variables: input,
      });
      return { success: true };
    } catch (error: any) {
      console.error('rejectWithdrawalRequest error:', error);
      return {
        success: false,
        error: error.message || 'Failed to reject withdrawal',
      };
    }
  },

  /**
   * Get withdrawal statistics (Admin only)
   */
  async getWithdrawalStats(): Promise<{
    pendingCount: number;
    approvedCount: number;
    rejectedCount: number;
    totalApprovedAmount: number;
    averageProcessingTime?: number;
  }> {
    const query = gql`
      query GetWithdrawalStats {
        getWithdrawalStats {
          pendingCount
          approvedCount
          rejectedCount
          totalApprovedAmount
          averageProcessingTime
        }
      }
    `;

    try {
      const { data } = await apolloClient.query({
        query,
        fetchPolicy: 'network-only',
      });
      return data.getWithdrawalStats;
    } catch (error: any) {
      console.error('getWithdrawalStats error:', error);
      return {
        pendingCount: 0,
        approvedCount: 0,
        rejectedCount: 0,
        totalApprovedAmount: 0,
      };
    }
  }
};

export default financeApi;
