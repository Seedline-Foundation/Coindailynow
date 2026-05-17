import { Prisma } from '@prisma/client';
import {
  WalletType,
  WalletStatus,
  TransactionType,
  TransactionStatus,
  PaymentMethod,
  StakingStatus,
  EscrowStatus,
  AirdropStatus,
  UserRole,
} from '@prisma/client';
import prisma from '../../lib/prisma';
import { WalletService } from '../WalletService';
import { PermissionService } from '../PermissionService';
import checkoutNodeJssdk from '@paypal/checkout-server-sdk';
import {
  ALL_FINANCE_OPERATIONS,
  requiresOTP,
  requiresApproval,
  isHighRisk,
} from '../../constants/financeOperations';
import { generateTransactionHash, logFinanceOperation } from './financeHelpers';
import type {
  TransactionResult,
  DepositInput,
  WithdrawalInput,
  TransferInput,
  PaymentInput,
  RefundInput,
  StakingInput,
  ConversionInput,
  AirdropInput,
  EscrowInput,
  GiftInput,
  BatchTransferInput,
  CommissionInput,
  AffiliateCommissionInput,
  RevenueTrackingInput,
  ExpenseInput,
  AuditInput,
  ReportInput,
  AuditResult,
  ReportResult,
  SecurityOTPInput,
  Security2FAInput,
  SecurityWalletFreezeInput,
  SecurityWhitelistInput,
  SecurityFraudDetectionInput,
  SecurityTransactionLimitInput,
  SecurityResult,
  TaxCalculationInput,
  TaxReportInput,
  ComplianceKYCInput,
  ComplianceAMLInput,
  TaxComplianceResult,
  WalletCreateInput,
  WalletViewBalanceInput,
  WalletViewHistoryInput,
  WalletSetLimitsInput,
  WalletRecoveryInput,
  WalletOperationResult,
  GatewayStripeInput,
  GatewayPayPalInput,
  GatewayMobileMoneyInput,
  GatewayCryptoInput,
  GatewayBankTransferInput,
  GatewayResult,
  BulkTransferAdvancedInput,
  ScheduledPaymentInput,
  RecurringPaymentInput,
  PaymentLinkInput,
  InvoiceGenerationInput,
  BulkTransferResult,
  ScheduledPaymentResult,
  RecurringPaymentResult,
  PaymentLinkResult,
  InvoiceResult,
  SubscriptionAutoRenewInput,
  SubscriptionUpgradeInput,
  SubscriptionDowngradeInput,
  SubscriptionPauseInput,
  SubscriptionCancelInput,
  SubscriptionResult,
} from './financeTypes';

export class FinanceInstanceMethods {
  /**
   * Convert CE Points to JY Tokens
   * Fixed rate: 100 CE = 1 JY (configurable via env)
   */
  async convertCEToJY(
    walletId: string,
    ceAmount: number,
    userId: string
  ): Promise<{ success: boolean; jyAmount?: number; transactionId?: string; error?: string }> {
    try {
      const CE_TO_JY_RATE = parseFloat(process.env.CE_TO_JY_CONVERSION_RATE || '0.01');
      const MIN_CONVERSION_CE = 100;

      // Validation
      if (ceAmount < MIN_CONVERSION_CE) {
        return {
          success: false,
          error: `Minimum conversion is ${MIN_CONVERSION_CE} CE Points`,
        };
      }

      // Calculate JY amount
      const jyAmount = ceAmount * CE_TO_JY_RATE;

      // Execute in transaction
      const result = await prisma.$transaction(async (tx) => {
        // Get wallet and verify CE balance
        const wallet = await tx.wallet.findUnique({
          where: { id: walletId },
        });

        if (!wallet) {
          throw new Error('Wallet not found');
        }

        if (wallet.status === WalletStatus.FROZEN) {
          throw new Error('Wallet is frozen due to suspicious activity');
        }

        if ((wallet.cePoints || 0) < ceAmount) {
          throw new Error('Insufficient CE Points balance');
        }

        // Deduct CE Points and add JY Tokens
        await tx.wallet.update({
          where: { id: walletId },
          data: {
            cePoints: { decrement: ceAmount },
            joyTokens: { increment: jyAmount },
          },
        });

        // Create transaction record
        const transaction = await tx.walletTransaction.create({
          data: {
            toWalletId: walletId, // Deposit: money going into wallet
            transactionType: TransactionType.CONVERSION,
            operationType: 'CONVERT_CE_TO_JY',
            amount: jyAmount,
            currency: 'JY',
            netAmount: jyAmount,
            purpose: 'CONVERSION',
            status: TransactionStatus.COMPLETED,
            description: `Converted ${ceAmount} CE Points to ${jyAmount} JY Tokens`,
            metadata: JSON.stringify({
              ceAmount,
              jyAmount,
              conversionRate: CE_TO_JY_RATE,
            }),
            initiatedAt: new Date(),
            processedAt: new Date(),
            completedAt: new Date(),
            transactionHash: `ce_to_jy_${Date.now()}_${walletId}`,
          },
        });

        // Create audit log
        await tx.auditEvent.create({
          data: {
            userId,
            type: 'WALLET_OPERATION',
            action: 'CONVERT_CE_TO_JY',
            details: `Converted ${ceAmount} CE to ${jyAmount} JY (wallet: ${walletId}, txId: ${transaction.id})`,
          },
        });

        return { transaction };
      });

      return {
        success: true,
        jyAmount,
        transactionId: result.transaction.id,
      };
    } catch (error: any) {
      console.error('convertCEToJY error:', error);
      return {
        success: false,
        error: error.message || 'Failed to convert CE Points',
      };
    }
  }

  /**
   * Get whitelisted wallet addresses for a user
   */
  async getWhitelistedWallets(userId: string): Promise<string[]> {
    try {
      const wallets = await prisma.wallet.findMany({
        where: { userId },
        select: { whitelistedAddresses: true },
      });

      // Aggregate all whitelisted addresses
      const addresses = new Set<string>();
      wallets.forEach((wallet) => {
        if (wallet.whitelistedAddresses) {
          try {
            const addressList = typeof wallet.whitelistedAddresses === 'string' 
              ? JSON.parse(wallet.whitelistedAddresses)
              : wallet.whitelistedAddresses;
            if (Array.isArray(addressList)) {
              addressList.forEach((addr: string) => addresses.add(addr));
            }
          } catch (e) {
            console.error('Error parsing whitelisted addresses:', e);
          }
        }
      });

      return Array.from(addresses);
    } catch (error) {
      console.error('getWhitelistedWallets error:', error);
      return [];
    }
  }

  /**
   * Deposit JY tokens from a whitelisted external wallet
   */
  async depositFromWallet(
    walletId: string,
    sourceAddress: string,
    amount: number,
    userId: string,
    txHash?: string
  ): Promise<{ success: boolean; txHash?: string; transactionId?: string; error?: string }> {
    try {
      const MIN_DEPOSIT_JY = 0.01;

      // Validation
      if (amount < MIN_DEPOSIT_JY) {
        return {
          success: false,
          error: `Minimum deposit is ${MIN_DEPOSIT_JY} JY`,
        };
      }

      // Execute in transaction
      const result = await prisma.$transaction(async (tx) => {
        // Get wallet and verify whitelist
        const wallet = await tx.wallet.findUnique({
          where: { id: walletId },
        });

        if (!wallet) {
          throw new Error('Wallet not found');
        }

        if (wallet.status === WalletStatus.FROZEN) {
          throw new Error('Wallet is frozen due to suspicious activity');
        }

        // Parse whitelisted addresses
        let whitelistedAddresses: string[] = [];
        if (wallet.whitelistedAddresses) {
          try {
            whitelistedAddresses = typeof wallet.whitelistedAddresses === 'string'
              ? JSON.parse(wallet.whitelistedAddresses)
              : wallet.whitelistedAddresses;
          } catch (e) {
            console.error('Error parsing whitelisted addresses:', e);
          }
        }
        
        if (!Array.isArray(whitelistedAddresses) || !whitelistedAddresses.includes(sourceAddress)) {
          throw new Error(
            'Source address is not whitelisted. Please add it to your whitelist first.'
          );
        }

        // Add JY tokens to wallet
        await tx.wallet.update({
          where: { id: walletId },
          data: {
            joyTokens: { increment: amount },
          },
        });

        // Create transaction record
        const transaction = await tx.walletTransaction.create({
          data: {
            toWalletId: walletId, // Deposit: money going into wallet
            transactionType: TransactionType.DEPOSIT,
            operationType: 'DEPOSIT_FROM_WHITELISTED_WALLET',
            amount,
            currency: 'JY',
            netAmount: amount,
            purpose: 'DEPOSIT',
            status: TransactionStatus.COMPLETED,
            description: `Deposited ${amount} JY from ${sourceAddress.substring(0, 10)}...`,
            blockchainTxHash: txHash || null,
            metadata: JSON.stringify({
              sourceAddress,
              amount,
              depositMethod: 'whitelisted_wallet',
            }),
            initiatedAt: new Date(),
            processedAt: new Date(),
            completedAt: new Date(),
            transactionHash: `deposit_${Date.now()}_${walletId}`,
          },
        });

        // Create audit log
        await tx.auditEvent.create({
          data: {
            userId,
            type: 'WALLET_OPERATION',
            action: 'DEPOSIT_FROM_WALLET',
            details: `Deposited ${amount} JY from whitelisted wallet ${sourceAddress} (txId: ${transaction.id})`,
          },
        });

        return { transaction };
      });

      return {
        success: true,
        txHash: txHash || result.transaction.id,
        transactionId: result.transaction.id,
      };
    } catch (error: any) {
      console.error('depositFromWallet error:', error);
      return {
        success: false,
        error: error.message || 'Failed to deposit tokens',
      };
    }
  }

  /**
   * Create internal platform transfer
   * Types: USER (to another user), SERVICE (for platform services), CONTENT (for premium content)
   */
  async createTransfer(
    fromWalletId: string,
    toIdentifier: string,
    amount: number,
    transferType: 'USER' | 'SERVICE' | 'CONTENT',
    userId: string,
    note?: string
  ): Promise<{ success: boolean; txId?: string; error?: string }> {
    try {
      const MIN_TRANSFER_JY = 0.01;
      const PLATFORM_FEE = parseFloat(process.env.PLATFORM_TRANSFER_FEE || '0.01');

      // Validation
      if (amount < MIN_TRANSFER_JY) {
        return {
          success: false,
          error: `Minimum transfer is ${MIN_TRANSFER_JY} JY`,
        };
      }

      // Calculate platform fee (1%)
      const platformFee = amount * PLATFORM_FEE;
      const totalDeduction = amount + platformFee;
      const recipientAmount = amount;

      // Execute in transaction
      const result = await prisma.$transaction(async (tx) => {
        // Get sender wallet
        const senderWallet = await tx.wallet.findUnique({
          where: { id: fromWalletId },
        });

        if (!senderWallet) {
          throw new Error('Sender wallet not found');
        }

        if (senderWallet.status === WalletStatus.FROZEN) {
          throw new Error('Wallet is frozen due to suspicious activity');
        }

        if ((senderWallet.joyTokens || 0) < totalDeduction) {
          throw new Error(
            `Insufficient balance. Required: ${totalDeduction} JY (includes ${platformFee} JY fee)`
          );
        }

        // Find recipient based on type
        let toWalletId: string;
        let recipientInfo: string;

        if (transferType === 'USER') {
          // Find user by username or email
          const recipient = await tx.user.findFirst({
            where: {
              OR: [
                { username: toIdentifier },
                { email: toIdentifier },
              ],
            },
            include: { Wallets: true },
          });

          if (!recipient || !recipient.Wallets || recipient.Wallets.length === 0) {
            throw new Error('Recipient user not found');
          }

          toWalletId = recipient.Wallets[0]!.id; // Non-null assertion after check
          recipientInfo = `@${recipient.username}`;
        } else if (transferType === 'SERVICE') {
          // Get platform service wallet (using WE_WALLET as platform wallet)
          const serviceWallet = await tx.wallet.findFirst({
            where: { walletType: WalletType.WE_WALLET },
          });

          if (!serviceWallet) {
            throw new Error('Platform service wallet not found');
          }

          toWalletId = serviceWallet.id;
          recipientInfo = `Service: ${toIdentifier}`;
        } else {
          // CONTENT type - get content creator wallet
          const content = await tx.article.findUnique({
            where: { id: toIdentifier },
            include: {
              User: {
                include: { Wallets: true },
              },
            },
          });

          if (!content || !content.User || !content.User.Wallets || content.User.Wallets.length === 0) {
            throw new Error('Content or creator wallet not found');
          }

          toWalletId = content.User.Wallets[0]!.id; // Non-null assertion after check
          recipientInfo = `Content: ${content.title}`;
        }

        // Deduct from sender (amount + fee)
        await tx.wallet.update({
          where: { id: fromWalletId },
          data: {
            joyTokens: { decrement: totalDeduction },
          },
        });

        // Add to recipient (amount only)
        await tx.wallet.update({
          where: { id: toWalletId },
          data: {
            joyTokens: { increment: recipientAmount },
          },
        });

        // Add fee to platform wallet (using WE_WALLET as platform receiving wallet)
        const platformWallet = await tx.wallet.findFirst({
          where: { walletType: WalletType.WE_WALLET },
        });

        if (platformWallet) {
          await tx.wallet.update({
            where: { id: platformWallet.id },
            data: {
              joyTokens: { increment: platformFee },
            },
          });
        }

        // Create sender transaction (outgoing transfer)
        const senderTx = await tx.walletTransaction.create({
          data: {
            fromWalletId: fromWalletId, // Money leaving sender's wallet
            toWalletId: toWalletId, // Money going to recipient
            transactionType: TransactionType.TRANSFER,
            operationType: `TRANSFER_${transferType}`,
            amount: totalDeduction,
            currency: 'JY',
            fee: platformFee,
            netAmount: amount,
            purpose: 'TRANSFER',
            status: TransactionStatus.COMPLETED,
            description: `Transfer to ${recipientInfo}${note ? `: ${note}` : ''}`,
            metadata: JSON.stringify({
              transferType,
              toIdentifier,
              amount,
              platformFee,
              recipientAmount,
              note,
              direction: 'OUT',
            }),
            initiatedAt: new Date(),
            processedAt: new Date(),
            completedAt: new Date(),
            transactionHash: `transfer_out_${Date.now()}_${fromWalletId}`,
          },
        });

        // Create recipient transaction (incoming transfer)
        await tx.walletTransaction.create({
          data: {
            fromWalletId: fromWalletId,
            toWalletId: toWalletId, // Money going into recipient's wallet
            transactionType: TransactionType.TRANSFER,
            operationType: `TRANSFER_${transferType}`,
            amount: recipientAmount,
            currency: 'JY',
            netAmount: recipientAmount,
            purpose: 'TRANSFER',
            status: TransactionStatus.COMPLETED,
            description: `Received transfer${note ? `: ${note}` : ''}`,
            metadata: JSON.stringify({
              transferType,
              fromWalletId,
              amount: recipientAmount,
              note,
              direction: 'IN',
            }),
            initiatedAt: new Date(),
            processedAt: new Date(),
            completedAt: new Date(),
            transactionHash: `transfer_in_${Date.now()}_${toWalletId}`,
          },
        });

        // Create audit log
        await tx.auditEvent.create({
          data: {
            userId,
            type: 'WALLET_OPERATION',
            action: 'CREATE_TRANSFER',
            details: `Transferred ${amount} JY to ${recipientInfo} (fee: ${platformFee} JY, txId: ${senderTx.id})`,
          },
        });

        return { senderTx };
      });

      return {
        success: true,
        txId: result.senderTx.id,
      };
    } catch (error: any) {
      console.error('createTransfer error:', error);
      return {
        success: false,
        error: error.message || 'Failed to create transfer',
      };
    }
  }

  /**
   * Search users by username, email, or display name
   * Used in SendModal for gift sending
   */
  async searchUsers(query: string, limit = 10): Promise<Array<{
    id: string;
    username: string;
    displayName: string;
    avatar?: string;
    role: string;
  }>> {
    try {
      if (query.length < 2) {
        return [];
      }

      const lowerQuery = query.toLowerCase();
      
      const users = await prisma.user.findMany({
        where: {
          OR: [
            { username: { contains: lowerQuery } },
            { email: { contains: lowerQuery } },
          ],
        },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          avatarUrl: true, // Avatar is directly on User model
        },
        take: limit,
      });

      return users.map((user) => {
        const result: {
          id: string;
          username: string;
          displayName: string;
          avatar?: string;
          role: string;
        } = {
          id: user.id,
          username: user.username,
          displayName: user.username,
          role: user.role as string,
        };
        if (user.avatarUrl) {
          result.avatar = user.avatarUrl;
        }
        return result;
      });
    } catch (error) {
      console.error('searchUsers error:', error);
      return [];
    }
  }

  /**
   * Get real-time exchange rate from payment providers
   * Supports YellowCard (Africa) and ChangeNOW (International)
   */
  async getExchangeRate(
    fromCurrency: string,
    toCurrency: string,
    amount: number,
    provider: 'YellowCard' | 'ChangeNOW'
  ): Promise<{
    fromCurrency: string;
    toCurrency: string;
    rate: number;
    fee: number;
    estimatedTime: string;
    provider: string;
  }> {
    try {
      // For MVP, return mock exchange rates
      // TODO: Integrate with actual YellowCard and ChangeNOW APIs
      const mockRates: Record<string, number> = {
        'JY-USD': 0.50,
        'JY-EUR': 0.45,
        'JY-NGN': 775.00,
        'JY-KES': 65.00,
        'JY-ZAR': 9.25,
        'JY-GHS': 7.50,
        'USD-JY': 2.00,
        'EUR-JY': 2.22,
        'NGN-JY': 0.00129,
        'KES-JY': 0.0154,
        'ZAR-JY': 0.108,
        'GHS-JY': 0.133,
      };

      const rateKey = `${fromCurrency}-${toCurrency}`;
      const rate = mockRates[rateKey] || 1.0;

      const fee = provider === 'YellowCard' ? 2.5 : 1.5;
      const estimatedTime = provider === 'YellowCard' ? '5-10 minutes' : '10-30 minutes';

      return {
        fromCurrency,
        toCurrency,
        rate,
        fee,
        estimatedTime,
        provider,
      };
    } catch (error: any) {
      console.error('getExchangeRate error:', error);
      // Return fallback rate
      return {
        fromCurrency,
        toCurrency,
        rate: 1.0,
        fee: 2.5,
        estimatedTime: '10-20 minutes',
        provider,
      };
    }
  }

  /**
   * Check if a swap transaction has been completed
   * Polls payment provider status
   */
  async checkSwapStatus(walletId: string): Promise<{
    success: boolean;
    txHash?: string;
    error?: string;
  }> {
    try {
      // Check for recent pending conversion (swap) transactions
      const recentSwap = await prisma.walletTransaction.findFirst({
        where: {
          OR: [
            { fromWalletId: walletId },
            { toWalletId: walletId },
          ],
          transactionType: TransactionType.CONVERSION, // Using CONVERSION for currency swaps
          status: TransactionStatus.PENDING,
          createdAt: {
            gte: new Date(Date.now() - 60 * 60 * 1000), // Last hour
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!recentSwap) {
        return {
          success: false,
          error: 'No recent swap transaction found',
        };
      }

      // For MVP, mark as completed
      // TODO: Integrate with actual YellowCard and ChangeNOW status APIs
      await prisma.walletTransaction.update({
        where: { id: recentSwap.id },
        data: {
          status: TransactionStatus.COMPLETED,
        },
      });

      return {
        success: true,
        txHash: recentSwap.blockchainTxHash || recentSwap.transactionHash || recentSwap.id,
      };
    } catch (error: any) {
      console.error('checkSwapStatus error:', error);
      return {
        success: false,
        error: error.message || 'Failed to check swap status',
      };
    }
  }

  // ==========================================================================
  // WITHDRAWAL REQUEST SYSTEM
  // ==========================================================================

  /**
   * Create a withdrawal request with validation
   * - Minimum 0.05 JY
   * - 48-hour cooldown between requests
   * - Wed/Fri withdrawal windows
   * - Whitelist address verification
   */
  async createWithdrawalRequest(input: {
    userId: string;
    walletId: string;
    amount: number;
    destinationAddress: string;
    notes?: string;
  }): Promise<{ success: boolean; requestId?: string; error?: string; nextAvailableDate?: Date }> {
    const MIN_WITHDRAWAL = 0.05;
    const COOLDOWN_HOURS = 48;

    try {
      // Validate minimum amount
      if (input.amount < MIN_WITHDRAWAL) {
        return {
          success: false,
          error: `Minimum withdrawal amount is ${MIN_WITHDRAWAL} JY`,
        };
      }

      // Check wallet exists and has sufficient balance
      const wallet = await prisma.wallet.findUnique({
        where: { id: input.walletId },
      });

      if (!wallet) {
        return { success: false, error: 'Wallet not found' };
      }

      if (wallet.userId !== input.userId) {
        return { success: false, error: 'Unauthorized wallet access' };
      }

      if ((wallet.joyTokens || 0) < input.amount) {
        return {
          success: false,
          error: `Insufficient balance. Available: ${wallet.joyTokens || 0} JY`,
        };
      }

      // Verify destination address is whitelisted
      let whitelistedAddresses: string[] = [];
      if (wallet.whitelistedAddresses) {
        try {
          whitelistedAddresses = typeof wallet.whitelistedAddresses === 'string'
            ? JSON.parse(wallet.whitelistedAddresses)
            : wallet.whitelistedAddresses;
        } catch (e) {
          console.error('Error parsing whitelisted addresses:', e);
        }
      }

      if (!Array.isArray(whitelistedAddresses) || !whitelistedAddresses.includes(input.destinationAddress)) {
        return {
          success: false,
          error: 'Destination address must be whitelisted. Please add it to your whitelist first.',
        };
      }

      // Check 48-hour cooldown
      const lastRequest = await prisma.withdrawalRequest.findFirst({
        where: {
          userId: input.userId,
          createdAt: {
            gte: new Date(Date.now() - COOLDOWN_HOURS * 60 * 60 * 1000),
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (lastRequest) {
        const nextAvailableDate = new Date(lastRequest.createdAt.getTime() + COOLDOWN_HOURS * 60 * 60 * 1000);
        const hoursRemaining = Math.ceil((nextAvailableDate.getTime() - Date.now()) / (60 * 60 * 1000));
        
        return {
          success: false,
          error: `Please wait ${hoursRemaining} hours before requesting another withdrawal`,
          nextAvailableDate,
        };
      }

      // Check if today is Wednesday or Friday
      const today = new Date();
      const dayOfWeek = today.getDay(); // 0 = Sunday, 3 = Wednesday, 5 = Friday
      
      if (dayOfWeek !== 3 && dayOfWeek !== 5) {
        const daysUntilNext = dayOfWeek < 3 ? 3 - dayOfWeek : (dayOfWeek === 4 ? 1 : 3 + (7 - dayOfWeek));
        const nextWithdrawalDate = new Date(today);
        nextWithdrawalDate.setDate(today.getDate() + daysUntilNext);
        
        return {
          success: false,
          error: 'Withdrawals are only processed on Wednesdays and Fridays',
          nextAvailableDate: nextWithdrawalDate,
        };
      }

      // Create withdrawal request
      const request = await prisma.withdrawalRequest.create({
        data: {
          userId: input.userId,
          walletId: input.walletId,
          amount: input.amount,
          destinationAddress: input.destinationAddress,
          status: 'PENDING',
          requestedAt: new Date(),
          ...(input.notes && { adminNotes: input.notes }), // Store user notes in adminNotes for now
          metadata: JSON.stringify({
            userAgent: 'web',
            ipAddress: 'system',
            userNotes: input.notes || '',
          }),
        },
      });

      // Create audit log
      await prisma.auditEvent.create({
        data: {
          userId: input.userId,
          type: 'WALLET_OPERATION',
          action: 'WITHDRAWAL_REQUESTED',
          details: `Withdrawal request created: ${input.amount} JY to ${input.destinationAddress.substring(0, 10)}... (requestId: ${request.id})`,
        },
      });

      return {
        success: true,
        requestId: request.id,
      };
    } catch (error: any) {
      console.error('createWithdrawalRequest error:', error);
      return {
        success: false,
        error: error.message || 'Failed to create withdrawal request',
      };
    }
  }

  /**
   * Get user's withdrawal requests
   */
  async getUserWithdrawalRequests(
    userId: string,
    filters?: { status?: string; limit?: number }
  ): Promise<any[]> {
    try {
      const requests = await prisma.withdrawalRequest.findMany({
        where: {
          userId,
          ...(filters?.status && { status: filters.status }),
        },
        orderBy: { createdAt: 'desc' },
        take: filters?.limit || 50,
      });

      return requests;
    } catch (error) {
      console.error('getUserWithdrawalRequests error:', error);
      return [];
    }
  }

  /**
   * Get all pending withdrawal requests (Admin only)
   */
  async getPendingWithdrawalRequests(filters?: {
    limit?: number;
    offset?: number;
  }): Promise<{ requests: any[]; total: number }> {
    try {
      const [requests, total] = await Promise.all([
        prisma.withdrawalRequest.findMany({
          where: { status: 'PENDING' },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
                role: true,
              },
            },
            wallet: {
              select: {
                id: true,
                walletType: true,
                joyTokens: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
          take: filters?.limit || 50,
          skip: filters?.offset || 0,
        }),
        prisma.withdrawalRequest.count({
          where: { status: 'PENDING' },
        }),
      ]);

      return { requests, total };
    } catch (error) {
      console.error('getPendingWithdrawalRequests error:', error);
      return { requests: [], total: 0 };
    }
  }

  /**
   * Approve withdrawal request (Admin only)
   */
  async approveWithdrawalRequest(input: {
    requestId: string;
    adminId: string;
    adminNotes?: string;
    txHash?: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      return await prisma.$transaction(async (tx) => {
        // Get withdrawal request
        const request = await tx.withdrawalRequest.findUnique({
          where: { id: input.requestId },
          include: {
            wallet: true,
            user: true,
          },
        });

        if (!request) {
          return { success: false, error: 'Withdrawal request not found' };
        }

        if (request.status !== 'PENDING') {
          return { success: false, error: `Request already ${request.status.toLowerCase()}` };
        }

        // Check wallet balance again
        if ((request.wallet.joyTokens || 0) < request.amount) {
          return {
            success: false,
            error: 'Insufficient wallet balance',
          };
        }

        // Deduct tokens from wallet
        await tx.wallet.update({
          where: { id: request.walletId },
          data: {
            joyTokens: { decrement: request.amount },
          },
        });

        // Create withdrawal transaction
        const transaction = await tx.walletTransaction.create({
          data: {
            fromWalletId: request.walletId,
            transactionType: TransactionType.WITHDRAWAL,
            operationType: 'WITHDRAWAL_TO_EXTERNAL',
            amount: request.amount,
            currency: 'JY',
            netAmount: request.amount,
            purpose: 'WITHDRAWAL',
            status: TransactionStatus.COMPLETED,
            description: `Withdrawal to ${request.destinationAddress.substring(0, 10)}...`,
            blockchainTxHash: input.txHash || null,
            metadata: JSON.stringify({
              requestId: request.id,
              destinationAddress: request.destinationAddress,
              approvedBy: input.adminId,
            }),
            initiatedAt: new Date(),
            processedAt: new Date(),
            completedAt: new Date(),
            transactionHash: `withdrawal_${Date.now()}_${request.walletId}`,
          },
        });

        // Update withdrawal request
        await tx.withdrawalRequest.update({
          where: { id: input.requestId },
          data: {
            status: 'APPROVED',
            reviewedBy: input.adminId,
            reviewedAt: new Date(),
            ...(input.adminNotes && { adminNotes: input.adminNotes }),
            ...(input.txHash && { transactionHash: input.txHash }),
            processedAt: new Date(),
          },
        });

        // Create audit log
        await tx.auditEvent.create({
          data: {
            userId: input.adminId,
            type: 'ADMIN_ACTION',
            action: 'WITHDRAWAL_APPROVED',
            details: `Approved withdrawal request ${request.id}: ${request.amount} JY to ${request.destinationAddress.substring(0, 10)}... for user ${request.user?.username} (txId: ${transaction.id})`,
          },
        });

        return { success: true };
      });
    } catch (error: any) {
      console.error('approveWithdrawalRequest error:', error);
      return {
        success: false,
        error: error.message || 'Failed to approve withdrawal request',
      };
    }
  }

  /**
   * Reject withdrawal request (Admin only)
   */
  async rejectWithdrawalRequest(input: {
    requestId: string;
    adminId: string;
    reason: string;
    adminNotes?: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      return await prisma.$transaction(async (tx) => {
        const request = await tx.withdrawalRequest.findUnique({
          where: { id: input.requestId },
          include: {
            user: true,
          },
        });

        if (!request) {
          return { success: false, error: 'Withdrawal request not found' };
        }

        if (request.status !== 'PENDING') {
          return { success: false, error: `Request already ${request.status.toLowerCase()}` };
        }

        // Update withdrawal request
        await tx.withdrawalRequest.update({
          where: { id: input.requestId },
          data: {
            status: 'REJECTED',
            reviewedBy: input.adminId,
            reviewedAt: new Date(),
            adminNotes: `${input.reason}${input.adminNotes ? ` - ${input.adminNotes}` : ''}`,
            processedAt: new Date(),
          },
        });

        // Create audit log
        await tx.auditEvent.create({
          data: {
            userId: input.adminId,
            type: 'ADMIN_ACTION',
            action: 'WITHDRAWAL_REJECTED',
            details: `Rejected withdrawal request ${request.id}: ${request.amount} JY for user ${request.user?.username}. Reason: ${input.reason}`,
          },
        });

        return { success: true };
      });
    } catch (error: any) {
      console.error('rejectWithdrawalRequest error:', error);
      return {
        success: false,
        error: error.message || 'Failed to reject withdrawal request',
      };
    }
  }

  /**
   * Get withdrawal statistics (Admin only)
   */
  async getWithdrawalStats(): Promise<{
    pending: number;
    approved: number;
    rejected: number;
    totalAmount: number;
    avgProcessingTime: number;
  }> {
    try {
      const [pending, approved, rejected, stats] = await Promise.all([
        prisma.withdrawalRequest.count({ where: { status: 'PENDING' } }),
        prisma.withdrawalRequest.count({ where: { status: 'APPROVED' } }),
        prisma.withdrawalRequest.count({ where: { status: 'REJECTED' } }),
        prisma.withdrawalRequest.aggregate({
          where: { status: 'APPROVED' },
          _sum: { amount: true },
          _avg: { amount: true },
        }),
      ]);

      // Calculate average processing time
      const processedRequests = await prisma.withdrawalRequest.findMany({
        where: {
          status: { in: ['APPROVED', 'REJECTED'] },
          processedAt: { not: null },
        },
        select: {
          requestedAt: true,
          processedAt: true,
        },
        take: 100,
      });

      let avgProcessingTime = 0;
      if (processedRequests.length > 0) {
        const totalTime = processedRequests.reduce((sum, req) => {
          if (req.processedAt) {
            return sum + (req.processedAt.getTime() - req.requestedAt.getTime());
          }
          return sum;
        }, 0);
        avgProcessingTime = totalTime / processedRequests.length / (60 * 60 * 1000); // Convert to hours
      }

      return {
        pending,
        approved,
        rejected,
        totalAmount: stats._sum.amount || 0,
        avgProcessingTime,
      };
    } catch (error) {
      console.error('getWithdrawalStats error:', error);
      return {
        pending: 0,
        approved: 0,
        rejected: 0,
        totalAmount: 0,
        avgProcessingTime: 0,
      };
    }
  }
}
