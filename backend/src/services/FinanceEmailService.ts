/**
 * FinanceEmailService - Email Notifications for Financial Activities
 * 
 * Handles all finance-related email notifications:
 * - Deposits, Withdrawals, Transfers, Payments
 * - CE Conversions, Staking/Unstaking
 * - OTP codes for transactions
 * - Daily/Weekly/Monthly summary reports
 * - Security alerts and fraud warnings
 */

import { emailService } from './emailService';
import { logger } from '../utils/logger';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================================
// EMAIL TEMPLATES
// ============================================================================

interface DepositEmailData {
  username: string;
  amount: number;
  currency: string;
  transactionId: string;
  timestamp: Date;
  method: string;
  newBalance: number;
}

interface WithdrawalEmailData {
  username: string;
  amount: number;
  currency: string;
  transactionId: string;
  timestamp: Date;
  destinationType: string;
  destinationAddress: string;
  newBalance: number;
  status: string;
}

interface TransferEmailData {
  username: string;
  amount: number;
  currency: string;
  transactionId: string;
  timestamp: Date;
  transferType: 'sent' | 'received';
  counterparty: string;
  newBalance: number;
}

interface PaymentEmailData {
  username: string;
  amount: number;
  currency: string;
  transactionId: string;
  timestamp: Date;
  productOrService: string;
  newBalance: number;
}

interface CEConversionEmailData {
  username: string;
  cePointsAmount: number;
  tokenAmount: number;
  conversionRate: number;
  transactionId: string;
  timestamp: Date;
  newCEBalance: number;
  newTokenBalance: number;
}

interface StakingEmailData {
  username: string;
  amount: number;
  currency: string;
  transactionId: string;
  timestamp: Date;
  stakingType: 'stake' | 'unstake';
  stakingPlan: string;
  apr?: number;
  lockPeriod?: number;
  expectedReturns?: number;
  newStakedBalance: number;
  newAvailableBalance: number;
}

interface OTPEmailData {
  username: string;
  otpCode: string;
  action: string;
  amount?: number;
  currency?: string;
  expiresInMinutes: number;
  ipAddress: string;
  timestamp: Date;
}

interface SecurityAlertEmailData {
  username: string;
  alertType: 'suspicious_withdrawal' | 'multiple_failed_otp' | 'unusual_activity' | 'wallet_locked' | 'ip_change';
  message: string;
  timestamp: Date;
  ipAddress?: string;
  location?: string;
  actionRequired?: string;
}

interface SummaryReportData {
  username: string;
  email: string;
  period: 'daily' | 'weekly' | 'monthly';
  startDate: Date;
  endDate: Date;
  totalDeposits: number;
  totalWithdrawals: number;
  totalTransfers: number;
  totalPayments: number;
  totalCEConversions: number;
  stakingRewards: number;
  currentBalance: {
    tokens: number;
    cePoints: number;
    staked: number;
  };
  topTransactions: Array<{
    type: string;
    amount: number;
    date: Date;
    description: string;
  }>;
}

export class FinanceEmailService {
  /**
   * Send deposit confirmation email
   */
  async sendDepositEmail(email: string, data: DepositEmailData): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .success-badge { background: #10b981; color: white; padding: 10px 20px; border-radius: 20px; display: inline-block; margin: 20px 0; }
          .transaction-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
          .detail-label { font-weight: bold; color: #6b7280; }
          .detail-value { color: #111827; }
          .amount { font-size: 24px; font-weight: bold; color: #10b981; }
          .footer { text-align: center; color: #6b7280; margin-top: 30px; font-size: 12px; }
          .button { background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💰 Deposit Confirmed</h1>
            <p>Your funds have been successfully deposited</p>
          </div>
          <div class="content">
            <div class="success-badge">✓ Deposit Successful</div>
            
            <p>Hi ${data.username},</p>
            <p>We've successfully received your deposit. Here are the details:</p>
            
            <div class="transaction-details">
              <div class="detail-row">
                <span class="detail-label">Amount</span>
                <span class="amount">+${data.amount.toLocaleString()} ${data.currency}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Method</span>
                <span class="detail-value">${data.method}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Transaction ID</span>
                <span class="detail-value">${data.transactionId}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Date & Time</span>
                <span class="detail-value">${data.timestamp.toLocaleString()}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">New Balance</span>
                <span class="detail-value">${data.newBalance.toLocaleString()} ${data.currency}</span>
              </div>
            </div>
            
            <a href="${process.env.FRONTEND_URL}/wallet/transactions/${data.transactionId}" class="button">View Transaction</a>
            
            <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
              <strong>Note:</strong> If you did not initiate this deposit, please contact our support team immediately.
            </p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} CoinDaily. All rights reserved.</p>
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return emailService.sendEmail({
      to: email,
      subject: `✓ Deposit Confirmed - ${data.amount} ${data.currency}`,
      html,
    });
  }

  /**
   * Send withdrawal confirmation email
   */
  async sendWithdrawalEmail(email: string, data: WithdrawalEmailData): Promise<boolean> {
    const statusColor = data.status === 'COMPLETED' ? '#10b981' : data.status === 'PENDING' ? '#f59e0b' : '#ef4444';
    const statusIcon = data.status === 'COMPLETED' ? '✓' : data.status === 'PENDING' ? '⏳' : '✗';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f59e0b 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .status-badge { background: ${statusColor}; color: white; padding: 10px 20px; border-radius: 20px; display: inline-block; margin: 20px 0; }
          .transaction-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
          .detail-label { font-weight: bold; color: #6b7280; }
          .detail-value { color: #111827; }
          .amount { font-size: 24px; font-weight: bold; color: #dc2626; }
          .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .footer { text-align: center; color: #6b7280; margin-top: 30px; font-size: 12px; }
          .button { background: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💸 Withdrawal ${data.status}</h1>
            <p>Your withdrawal request has been processed</p>
          </div>
          <div class="content">
            <div class="status-badge">${statusIcon} ${data.status}</div>
            
            <p>Hi ${data.username},</p>
            <p>Your withdrawal request has been ${data.status.toLowerCase()}. Here are the details:</p>
            
            <div class="transaction-details">
              <div class="detail-row">
                <span class="detail-label">Amount</span>
                <span class="amount">-${data.amount.toLocaleString()} ${data.currency}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Destination Type</span>
                <span class="detail-value">${data.destinationType}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Destination</span>
                <span class="detail-value">${this.maskAddress(data.destinationAddress)}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Transaction ID</span>
                <span class="detail-value">${data.transactionId}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Date & Time</span>
                <span class="detail-value">${data.timestamp.toLocaleString()}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">New Balance</span>
                <span class="detail-value">${data.newBalance.toLocaleString()} ${data.currency}</span>
              </div>
            </div>
            
            ${data.status === 'PENDING' ? `
              <div class="warning">
                <strong>⏳ Processing:</strong> Your withdrawal is being processed. This may take 1-3 business days depending on the destination type.
              </div>
            ` : ''}
            
            <a href="${process.env.FRONTEND_URL}/wallet/transactions/${data.transactionId}" class="button">View Transaction</a>
            
            <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
              <strong>Security Alert:</strong> If you did not authorize this withdrawal, please contact our support team immediately and change your password.
            </p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} CoinDaily. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return emailService.sendEmail({
      to: email,
      subject: `${statusIcon} Withdrawal ${data.status} - ${data.amount} ${data.currency}`,
      html,
    });
  }

  /**
   * Send transfer notification email
   */
  async sendTransferEmail(email: string, data: TransferEmailData): Promise<boolean> {
    const isSent = data.transferType === 'sent';
    const color = isSent ? '#ef4444' : '#10b981';
    const icon = isSent ? '📤' : '📥';
    const action = isSent ? 'Sent' : 'Received';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, ${color} 0%, #7c3aed 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .transaction-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
          .detail-label { font-weight: bold; color: #6b7280; }
          .detail-value { color: #111827; }
          .amount { font-size: 24px; font-weight: bold; color: ${color}; }
          .footer { text-align: center; color: #6b7280; margin-top: 30px; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${icon} Transfer ${action}</h1>
            <p>Your transfer has been completed</p>
          </div>
          <div class="content">
            <p>Hi ${data.username},</p>
            <p>You have ${isSent ? 'sent' : 'received'} a transfer. Here are the details:</p>
            
            <div class="transaction-details">
              <div class="detail-row">
                <span class="detail-label">Amount</span>
                <span class="amount">${isSent ? '-' : '+'}${data.amount.toLocaleString()} ${data.currency}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">${isSent ? 'To' : 'From'}</span>
                <span class="detail-value">${data.counterparty}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Transaction ID</span>
                <span class="detail-value">${data.transactionId}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Date & Time</span>
                <span class="detail-value">${data.timestamp.toLocaleString()}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">New Balance</span>
                <span class="detail-value">${data.newBalance.toLocaleString()} ${data.currency}</span>
              </div>
            </div>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} CoinDaily. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return emailService.sendEmail({
      to: email,
      subject: `${icon} Transfer ${action} - ${data.amount} ${data.currency}`,
      html,
    });
  }

  /**
   * Send payment confirmation email
   */
  async sendPaymentEmail(email: string, data: PaymentEmailData): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .success-badge { background: #10b981; color: white; padding: 10px 20px; border-radius: 20px; display: inline-block; margin: 20px 0; }
          .transaction-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
          .detail-label { font-weight: bold; color: #6b7280; }
          .detail-value { color: #111827; }
          .amount { font-size: 24px; font-weight: bold; color: #3b82f6; }
          .footer { text-align: center; color: #6b7280; margin-top: 30px; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🛍️ Payment Successful</h1>
            <p>Thank you for your purchase</p>
          </div>
          <div class="content">
            <div class="success-badge">✓ Payment Confirmed</div>
            
            <p>Hi ${data.username},</p>
            <p>Your payment has been successfully processed. Here are the details:</p>
            
            <div class="transaction-details">
              <div class="detail-row">
                <span class="detail-label">Amount</span>
                <span class="amount">-${data.amount.toLocaleString()} ${data.currency}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Product/Service</span>
                <span class="detail-value">${data.productOrService}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Transaction ID</span>
                <span class="detail-value">${data.transactionId}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Date & Time</span>
                <span class="detail-value">${data.timestamp.toLocaleString()}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">New Balance</span>
                <span class="detail-value">${data.newBalance.toLocaleString()} ${data.currency}</span>
              </div>
            </div>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} CoinDaily. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return emailService.sendEmail({
      to: email,
      subject: `✓ Payment Confirmed - ${data.productOrService}`,
      html,
    });
  }

  /**
   * Send CE conversion confirmation email
   */
  async sendCEConversionEmail(email: string, data: CEConversionEmailData): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .success-badge { background: #8b5cf6; color: white; padding: 10px 20px; border-radius: 20px; display: inline-block; margin: 20px 0; }
          .transaction-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
          .detail-label { font-weight: bold; color: #6b7280; }
          .detail-value { color: #111827; }
          .conversion-box { background: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
          .conversion-arrow { font-size: 24px; margin: 10px 0; }
          .footer { text-align: center; color: #6b7280; margin-top: 30px; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔄 CE Points Converted</h1>
            <p>Your CE Points have been successfully converted</p>
          </div>
          <div class="content">
            <div class="success-badge">✓ Conversion Complete</div>
            
            <p>Hi ${data.username},</p>
            <p>Your CE Points have been successfully converted to tokens. Here are the details:</p>
            
            <div class="conversion-box">
              <div style="font-size: 24px; color: #8b5cf6; font-weight: bold;">
                ${data.cePointsAmount.toLocaleString()} CE Points
              </div>
              <div class="conversion-arrow">⬇️</div>
              <div style="font-size: 24px; color: #10b981; font-weight: bold;">
                ${data.tokenAmount.toLocaleString()} Tokens
              </div>
              <div style="margin-top: 15px; color: #6b7280;">
                Conversion Rate: 1 Token = ${data.conversionRate} CE Points
              </div>
            </div>
            
            <div class="transaction-details">
              <div class="detail-row">
                <span class="detail-label">Transaction ID</span>
                <span class="detail-value">${data.transactionId}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Date & Time</span>
                <span class="detail-value">${data.timestamp.toLocaleString()}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">New CE Balance</span>
                <span class="detail-value">${data.newCEBalance.toLocaleString()} CE Points</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">New Token Balance</span>
                <span class="detail-value">${data.newTokenBalance.toLocaleString()} Tokens</span>
              </div>
            </div>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} CoinDaily. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return emailService.sendEmail({
      to: email,
      subject: `🔄 CE Points Converted - ${data.tokenAmount} Tokens`,
      html,
    });
  }

  /**
   * Send staking notification email
   */
  async sendStakingEmail(email: string, data: StakingEmailData): Promise<boolean> {
    const isStake = data.stakingType === 'stake';
    const color = isStake ? '#10b981' : '#f59e0b';
    const icon = isStake ? '🔒' : '🔓';
    const action = isStake ? 'Staked' : 'Unstaked';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, ${color} 0%, #14b8a6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .success-badge { background: ${color}; color: white; padding: 10px 20px; border-radius: 20px; display: inline-block; margin: 20px 0; }
          .transaction-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
          .detail-label { font-weight: bold; color: #6b7280; }
          .detail-value { color: #111827; }
          .amount { font-size: 24px; font-weight: bold; color: ${color}; }
          .rewards-box { background: #ecfdf5; border: 2px solid #10b981; padding: 15px; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; color: #6b7280; margin-top: 30px; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${icon} Tokens ${action}</h1>
            <p>Your ${data.stakingType} transaction has been completed</p>
          </div>
          <div class="content">
            <div class="success-badge">✓ ${action} Successfully</div>
            
            <p>Hi ${data.username},</p>
            <p>Your tokens have been ${isStake ? 'staked' : 'unstaked'} successfully. Here are the details:</p>
            
            <div class="transaction-details">
              <div class="detail-row">
                <span class="detail-label">Amount ${action}</span>
                <span class="amount">${data.amount.toLocaleString()} ${data.currency}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Staking Plan</span>
                <span class="detail-value">${data.stakingPlan}</span>
              </div>
              ${isStake && data.apr ? `
                <div class="detail-row">
                  <span class="detail-label">APR</span>
                  <span class="detail-value">${data.apr}%</span>
                </div>
              ` : ''}
              ${isStake && data.lockPeriod ? `
                <div class="detail-row">
                  <span class="detail-label">Lock Period</span>
                  <span class="detail-value">${data.lockPeriod} days</span>
                </div>
              ` : ''}
              <div class="detail-row">
                <span class="detail-label">Transaction ID</span>
                <span class="detail-value">${data.transactionId}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Date & Time</span>
                <span class="detail-value">${data.timestamp.toLocaleString()}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Total Staked Balance</span>
                <span class="detail-value">${data.newStakedBalance.toLocaleString()} ${data.currency}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Available Balance</span>
                <span class="detail-value">${data.newAvailableBalance.toLocaleString()} ${data.currency}</span>
              </div>
            </div>
            
            ${isStake && data.expectedReturns ? `
              <div class="rewards-box">
                <strong>💎 Expected Rewards:</strong> ${data.expectedReturns.toLocaleString()} ${data.currency}
                <div style="margin-top: 10px; color: #6b7280; font-size: 14px;">
                  Start earning rewards immediately! Rewards are calculated daily and can be claimed after the lock period ends.
                </div>
              </div>
            ` : ''}
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} CoinDaily. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return emailService.sendEmail({
      to: email,
      subject: `${icon} Tokens ${action} - ${data.amount} ${data.currency}`,
      html,
    });
  }

  /**
   * Send OTP code email for transaction verification
   */
  async sendTransactionOTP(email: string, data: OTPEmailData): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .otp-box { background: white; border: 3px solid #ef4444; padding: 30px; text-align: center; border-radius: 10px; margin: 30px 0; }
          .otp-code { font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #ef4444; margin: 20px 0; font-family: 'Courier New', monospace; }
          .warning { background: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .detail-row { padding: 8px 0; }
          .detail-label { font-weight: bold; color: #6b7280; }
          .footer { text-align: center; color: #6b7280; margin-top: 30px; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Transaction Verification Code</h1>
            <p>Your OTP code for transaction authorization</p>
          </div>
          <div class="content">
            <p>Hi ${data.username},</p>
            <p>You are attempting to authorize the following action:</p>
            
            <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <div class="detail-row">
                <span class="detail-label">Action:</span> ${data.action}
              </div>
              ${data.amount ? `
                <div class="detail-row">
                  <span class="detail-label">Amount:</span> ${data.amount.toLocaleString()} ${data.currency}
                </div>
              ` : ''}
              <div class="detail-row">
                <span class="detail-label">IP Address:</span> ${data.ipAddress}
              </div>
              <div class="detail-row">
                <span class="detail-label">Time:</span> ${data.timestamp.toLocaleString()}
              </div>
            </div>
            
            <div class="otp-box">
              <div style="color: #6b7280; font-size: 14px; margin-bottom: 10px;">Your verification code is:</div>
              <div class="otp-code">${data.otpCode}</div>
              <div style="color: #6b7280; font-size: 14px; margin-top: 10px;">
                This code expires in ${data.expiresInMinutes} minutes
              </div>
            </div>
            
            <div class="warning">
              <strong>⚠️ Security Notice:</strong>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Never share this code with anyone</li>
                <li>CoinDaily staff will never ask for your OTP code</li>
                <li>If you did not request this code, please contact support immediately</li>
                <li>This code can only be used once</li>
              </ul>
            </div>
            
            <p style="margin-top: 30px; text-align: center; color: #6b7280; font-size: 14px;">
              Didn't request this code? <a href="${process.env.FRONTEND_URL}/support" style="color: #ef4444;">Contact Support</a>
            </p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} CoinDaily. All rights reserved.</p>
            <p>This is a security-critical email. Do not forward or share.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return emailService.sendEmail({
      to: email,
      subject: `🔐 Your OTP Code: ${data.otpCode} (Expires in ${data.expiresInMinutes} minutes)`,
      html,
    });
  }

  /**
   * Send security alert email
   */
  async sendSecurityAlert(email: string, data: SecurityAlertEmailData): Promise<boolean> {
    const alertIcons: Record<typeof data.alertType, string> = {
      suspicious_withdrawal: '⚠️',
      multiple_failed_otp: '🔒',
      unusual_activity: '🚨',
      wallet_locked: '🔐',
      ip_change: '🌍',
    };

    const alertColors: Record<typeof data.alertType, string> = {
      suspicious_withdrawal: '#f59e0b',
      multiple_failed_otp: '#ef4444',
      unusual_activity: '#dc2626',
      wallet_locked: '#991b1b',
      ip_change: '#f59e0b',
    };

    const icon = alertIcons[data.alertType];
    const color = alertColors[data.alertType];

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, ${color} 0%, #7c2d12 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .alert-box { background: #fef3c7; border: 3px solid ${color}; padding: 25px; border-radius: 10px; margin: 25px 0; }
          .alert-title { font-size: 20px; font-weight: bold; color: ${color}; margin-bottom: 15px; }
          .detail-row { padding: 8px 0; }
          .detail-label { font-weight: bold; color: #6b7280; }
          .action-box { background: white; border-left: 4px solid ${color}; padding: 20px; margin: 20px 0; border-radius: 4px; }
          .button { background: ${color}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
          .footer { text-align: center; color: #6b7280; margin-top: 30px; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${icon} Security Alert</h1>
            <p>Unusual activity detected on your account</p>
          </div>
          <div class="content">
            <div class="alert-box">
              <div class="alert-title">${icon} ${data.alertType.replace(/_/g, ' ').toUpperCase()}</div>
              <p>${data.message}</p>
              
              <div style="margin-top: 20px;">
                <div class="detail-row">
                  <span class="detail-label">Time:</span> ${data.timestamp.toLocaleString()}
                </div>
                ${data.ipAddress ? `
                  <div class="detail-row">
                    <span class="detail-label">IP Address:</span> ${data.ipAddress}
                  </div>
                ` : ''}
                ${data.location ? `
                  <div class="detail-row">
                    <span class="detail-label">Location:</span> ${data.location}
                  </div>
                ` : ''}
              </div>
            </div>
            
            <p><strong>Hi ${data.username},</strong></p>
            <p>We detected unusual activity on your CoinDaily account. This alert is sent to help protect your account security.</p>
            
            ${data.actionRequired ? `
              <div class="action-box">
                <strong>🔔 Action Required:</strong>
                <p>${data.actionRequired}</p>
              </div>
            ` : ''}
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL}/wallet/security" class="button">Review Security Settings</a>
            </div>
            
            <div style="background: #fee2e2; padding: 15px; border-radius: 4px; margin-top: 20px;">
              <strong>⚠️ If this wasn't you:</strong>
              <ol style="margin: 10px 0; padding-left: 20px;">
                <li>Change your password immediately</li>
                <li>Enable two-factor authentication</li>
                <li>Contact our support team</li>
                <li>Review recent account activity</li>
              </ol>
            </div>
            
            <p style="margin-top: 30px; text-align: center;">
              <a href="${process.env.FRONTEND_URL}/support/emergency" style="color: ${color}; font-weight: bold;">Report Unauthorized Activity</a>
            </p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} CoinDaily. All rights reserved.</p>
            <p>This is a security-critical notification. Please do not ignore.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return emailService.sendEmail({
      to: email,
      subject: `${icon} Security Alert: ${data.alertType.replace(/_/g, ' ')}`,
      html,
    });
  }

  /**
   * Send daily/weekly/monthly summary report
   */
  async sendSummaryReport(email: string, data: SummaryReportData): Promise<boolean> {
    const periodTitle = data.period.charAt(0).toUpperCase() + data.period.slice(1);
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 700px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 30px 0; }
          .stat-card { background: white; padding: 20px; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .stat-label { color: #6b7280; font-size: 14px; margin-bottom: 8px; }
          .stat-value { font-size: 24px; font-weight: bold; color: #111827; }
          .stat-positive { color: #10b981; }
          .stat-negative { color: #ef4444; }
          .balance-box { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 25px; border-radius: 10px; margin: 25px 0; }
          .balance-item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.2); }
          .balance-label { opacity: 0.9; }
          .balance-value { font-weight: bold; font-size: 18px; }
          .transactions-table { width: 100%; background: white; border-radius: 8px; overflow: hidden; margin: 25px 0; }
          .transactions-table th { background: #f3f4f6; padding: 12px; text-align: left; font-weight: bold; color: #6b7280; }
          .transactions-table td { padding: 12px; border-bottom: 1px solid #e5e7eb; }
          .footer { text-align: center; color: #6b7280; margin-top: 30px; font-size: 12px; }
          .button { background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📊 ${periodTitle} Financial Summary</h1>
            <p>${data.startDate.toLocaleDateString()} - ${data.endDate.toLocaleDateString()}</p>
          </div>
          <div class="content">
            <p>Hi ${data.username},</p>
            <p>Here's your ${data.period} financial activity summary:</p>
            
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-label">Total Deposits</div>
                <div class="stat-value stat-positive">+$${data.totalDeposits.toLocaleString()}</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Total Withdrawals</div>
                <div class="stat-value stat-negative">-$${data.totalWithdrawals.toLocaleString()}</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Total Transfers</div>
                <div class="stat-value">$${data.totalTransfers.toLocaleString()}</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Total Payments</div>
                <div class="stat-value">$${data.totalPayments.toLocaleString()}</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">CE Conversions</div>
                <div class="stat-value">$${data.totalCEConversions.toLocaleString()}</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Staking Rewards</div>
                <div class="stat-value stat-positive">+$${data.stakingRewards.toLocaleString()}</div>
              </div>
            </div>
            
            <div class="balance-box">
              <h3 style="margin-top: 0;">💰 Current Balances</h3>
              <div class="balance-item">
                <span class="balance-label">Available Tokens</span>
                <span class="balance-value">${data.currentBalance.tokens.toLocaleString()}</span>
              </div>
              <div class="balance-item">
                <span class="balance-label">CE Points</span>
                <span class="balance-value">${data.currentBalance.cePoints.toLocaleString()}</span>
              </div>
              <div class="balance-item" style="border-bottom: none;">
                <span class="balance-label">Staked Tokens</span>
                <span class="balance-value">${data.currentBalance.staked.toLocaleString()}</span>
              </div>
            </div>
            
            ${data.topTransactions.length > 0 ? `
              <h3>📝 Top Transactions</h3>
              <table class="transactions-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Date</th>
                    <th>Description</th>
                    <th style="text-align: right;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${data.topTransactions.map(tx => `
                    <tr>
                      <td>${tx.type}</td>
                      <td>${tx.date.toLocaleDateString()}</td>
                      <td>${tx.description}</td>
                      <td style="text-align: right; font-weight: bold;">$${tx.amount.toLocaleString()}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            ` : ''}
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL}/wallet/reports" class="button">View Full Report</a>
            </div>
            
            <p style="margin-top: 30px; padding: 15px; background: #f3f4f6; border-radius: 8px; font-size: 14px;">
              <strong>💡 Tip:</strong> ${this.getFinancialTip(data)}
            </p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} CoinDaily. All rights reserved.</p>
            <p>
              <a href="${process.env.FRONTEND_URL}/settings/notifications" style="color: #667eea;">Manage Email Preferences</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    return emailService.sendEmail({
      to: email,
      subject: `📊 Your ${periodTitle} Financial Summary - CoinDaily`,
      html,
    });
  }

  /**
   * Helper: Generate financial tip based on user activity
   */
  private getFinancialTip(data: SummaryReportData): string {
    const tips = [
      'Consider staking your tokens to earn passive rewards!',
      'Convert your CE Points to tokens to increase your holdings.',
      'Enable withdrawal limits for enhanced security.',
      'Set up daily spending limits to manage your budget better.',
      'Review your transaction history regularly for unauthorized activity.',
    ];

    // Smart tips based on user data
    if (data.currentBalance.cePoints > 1000) {
      return 'You have CE Points available! Convert them to tokens to maximize your earnings.';
    }
    if (data.currentBalance.tokens > 10000 && data.currentBalance.staked === 0) {
      return 'You have a substantial balance. Consider staking to earn passive rewards!';
    }
    if (data.stakingRewards > 0) {
      return `Great job! You've earned $${data.stakingRewards.toLocaleString()} in staking rewards this ${data.period}.`;
    }

    const randomIndex = Math.floor(Math.random() * tips.length);
    return tips[randomIndex] ?? tips[0] ?? 'Keep track of your financial activities regularly.';
  }

  /**
   * Helper: Mask wallet address for security
   */
  private maskAddress(address: string): string {
    if (address.length <= 10) return address;
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  }

  /**
   * Strip HTML tags from string
   */
  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '');
  }
}

export const financeEmailService = new FinanceEmailService();
