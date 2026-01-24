/**
 * M-Pesa Provider Implementation
 * Task 15: Mobile Money Integration - M-Pesa Provider
 * 
 * Handles M-Pesa mobile money transactions (Kenya, Tanzania, Uganda)
 */

import { Logger } from 'winston';
import {
  PaymentRequest,
  PaymentResponse,
  PaymentVerificationResponse,
  PaymentStatus,
  MobileMoneyProvider,
  ErrorCodes,
  MobileMoneyError
} from '../../types/mobile-money';
import { IMobileMoneyProvider } from '../interfaces/mobile-money.interface';

export class MpesaProvider implements IMobileMoneyProvider {
  private readonly logger: Logger;
  private readonly baseUrl: string;
  private readonly consumerKey: string;
  private readonly consumerSecret: string;
  private readonly passkey: string;
  private readonly shortcode: string;

  constructor(logger: Logger) {
    this.logger = logger;
    
    // Configuration from environment variables
    this.baseUrl = process.env.MPESA_BASE_URL || 'https://sandbox.safaricom.co.ke';
    this.consumerKey = process.env.MPESA_CONSUMER_KEY || '';
    this.consumerSecret = process.env.MPESA_CONSUMER_SECRET || '';
    this.passkey = process.env.MPESA_PASSKEY || '';
    this.shortcode = process.env.MPESA_SHORTCODE || '174379';
  }

  async initiatePayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      this.logger.info('Initiating M-Pesa payment', {
        transactionId: request.id,
        amount: request.amount,
        phoneNumber: request.phoneNumber
      });

      // Validate phone number format for M-Pesa (Kenya format)
      if (!this.validatePhoneNumber(request.phoneNumber, 'KE')) {
        throw new MobileMoneyError(
          'Invalid phone number format for M-Pesa',
          ErrorCodes.INVALID_PHONE_NUMBER,
          MobileMoneyProvider.MPESA,
          request.id
        );
      }

      // Get access token
      const accessToken = await this.getAccessToken();

      // Prepare STK Push request
      const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
      const password = Buffer.from(`${this.shortcode}${this.passkey}${timestamp}`).toString('base64');

      const stkPushPayload = {
        BusinessShortCode: this.shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: Math.round(request.amount / 100), // Convert from cents
        PartyA: this.formatPhoneNumber(request.phoneNumber),
        PartyB: this.shortcode,
        PhoneNumber: this.formatPhoneNumber(request.phoneNumber),
        CallBackURL: request.callbackUrl || process.env.MPESA_CALLBACK_URL,
        AccountReference: request.id,
        TransactionDesc: request.description || 'CoinDaily Payment'
      };

      // Mock M-Pesa API response for development
      // In production, this would make actual HTTP request to M-Pesa API
      const mockResponse = {
        MerchantRequestID: `mock_merchant_${Date.now()}`,
        CheckoutRequestID: `mock_checkout_${Date.now()}`,
        ResponseCode: '0',
        ResponseDescription: 'Success. Request accepted for processing',
        CustomerMessage: 'Success. Request accepted for processing'
      };

      if (mockResponse.ResponseCode === '0') {
        return {
          success: true,
          transactionId: request.id,
          providerTransactionId: mockResponse.CheckoutRequestID,
          status: PaymentStatus.PENDING,
          message: mockResponse.CustomerMessage,
          metadata: {
            merchantRequestId: mockResponse.MerchantRequestID,
            checkoutRequestId: mockResponse.CheckoutRequestID,
            provider: 'MPESA'
          }
        };
      } else {
        throw new MobileMoneyError(
          mockResponse.ResponseDescription,
          ErrorCodes.TRANSACTION_DECLINED,
          MobileMoneyProvider.MPESA,
          request.id
        );
      }

    } catch (error: any) {
      this.logger.error('M-Pesa payment initiation failed', {
        transactionId: request.id,
        error: error.message,
        stack: error.stack
      });

      if (error instanceof MobileMoneyError) {
        throw error;
      }

      return {
        success: false,
        transactionId: request.id,
        status: PaymentStatus.FAILED,
        message: 'Payment initiation failed',
        errorCode: ErrorCodes.PROVIDER_UNAVAILABLE
      };
    }
  }

  async checkPaymentStatus(providerTransactionId: string): Promise<PaymentVerificationResponse> {
    try {
      this.logger.info('Checking M-Pesa payment status', { providerTransactionId });

      // Mock status check - in production would call M-Pesa Query API
      const mockStatusResponse = {
        ResponseCode: '0',
        ResponseDescription: 'The service request has been accepted successsfully',
        MerchantRequestID: 'mock_merchant_req',
        CheckoutRequestID: providerTransactionId,
        ResultCode: '0',
        ResultDesc: 'The service request is processed successfully.',
        Amount: 1.00,
        MpesaReceiptNumber: 'NLJ7RT61SV',
        TransactionDate: new Date().toISOString().slice(0, 14).replace('T', ''),
        PhoneNumber: '254708374149'
      };

      if (mockStatusResponse.ResultCode === '0') {
        return {
          verified: true,
          status: PaymentStatus.COMPLETED,
          amount: Math.round(mockStatusResponse.Amount * 100), // Convert to cents
          currency: 'KES',
          completedAt: new Date()
        };
      } else {
        return {
          verified: false,
          status: PaymentStatus.FAILED,
          errorMessage: mockStatusResponse.ResultDesc
        };
      }

    } catch (error: any) {
      this.logger.error('M-Pesa status check failed', {
        providerTransactionId,
        error: error.message
      });

      return {
        verified: false,
        status: PaymentStatus.FAILED,
        errorMessage: 'Status check failed'
      };
    }
  }

  async processRefund(providerTransactionId: string, amount: number, reason: string): Promise<PaymentResponse> {
    try {
      this.logger.info('Processing M-Pesa refund', {
        providerTransactionId,
        amount,
        reason
      });

      // Mock refund response - in production would call M-Pesa Reversal API
      const mockRefundResponse = {
        ResponseCode: '0',
        ResponseDescription: 'Accept the service request successfully.',
        OriginatorConversationID: `mock_refund_${Date.now()}`,
        ConversationID: `mock_conversation_${Date.now()}`,
        TransactionID: `mock_refund_tx_${Date.now()}`
      };

      if (mockRefundResponse.ResponseCode === '0') {
        return {
          success: true,
          transactionId: mockRefundResponse.TransactionID,
          providerTransactionId: mockRefundResponse.ConversationID,
          status: PaymentStatus.COMPLETED,
          message: 'Refund processed successfully'
        };
      } else {
        throw new MobileMoneyError(
          mockRefundResponse.ResponseDescription,
          'REFUND_FAILED',
          MobileMoneyProvider.MPESA,
          providerTransactionId
        );
      }

    } catch (error: any) {
      this.logger.error('M-Pesa refund failed', {
        providerTransactionId,
        error: error.message
      });

      return {
        success: false,
        transactionId: '',
        status: PaymentStatus.FAILED,
        message: 'Refund processing failed'
      };
    }
  }

  validatePhoneNumber(phoneNumber: string, country: string): boolean {
    if (country !== 'KE') return false;

    // M-Pesa Kenya phone number validation
    const kenyanMobileRegex = /^(\+254|254|0)?(7|1)\d{8}$/;
    return kenyanMobileRegex.test(phoneNumber);
  }

  calculateFees(amount: number, currency: string): {
    providerFee: number;
    platformFee: number;
    totalFee: number;
  } {
    // M-Pesa fee structure (simplified)
    let providerFee = 0;
    
    if (amount <= 10000) { // Up to 100 KES
      providerFee = 0;
    } else if (amount <= 50000) { // Up to 500 KES
      providerFee = 700; // 7 KES in cents
    } else if (amount <= 100000) { // Up to 1000 KES
      providerFee = 1300; // 13 KES in cents
    } else {
      providerFee = 2500; // 25 KES in cents
    }

    const platformFee = Math.round(amount * 0.01); // 1% platform fee
    const totalFee = providerFee + platformFee;

    return { providerFee, platformFee, totalFee };
  }

  getSupportedCurrencies(): string[] {
    return ['KES']; // Kenyan Shilling
  }

  getTransactionLimits(country: string): {
    min: number;
    max: number;
    dailyLimit: number;
    monthlyLimit: number;
  } {
    if (country === 'KE') {
      return {
        min: 100, // 1 KES in cents
        max: 15000000, // 150,000 KES in cents
        dailyLimit: 30000000, // 300,000 KES in cents
        monthlyLimit: 100000000 // 1,000,000 KES in cents
      };
    }

    return {
      min: 0,
      max: 0,
      dailyLimit: 0,
      monthlyLimit: 0
    };
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Mock availability check - in production would ping M-Pesa API
      return true;
    } catch (error: any) {
      this.logger.error('M-Pesa availability check failed', { error: error.message });
      return false;
    }
  }

  // Private helper methods

  private async getAccessToken(): Promise<string> {
    // Mock access token - in production would call M-Pesa OAuth API
    return `mock_access_token_${Date.now()}`;
  }

  private formatPhoneNumber(phoneNumber: string): string {
    // Format to 254XXXXXXXXX format
    let formatted = phoneNumber.replace(/\s+/g, '');
    
    if (formatted.startsWith('+254')) {
      formatted = formatted.substring(4);
    } else if (formatted.startsWith('254')) {
      formatted = formatted.substring(3);
    } else if (formatted.startsWith('0')) {
      formatted = formatted.substring(1);
    }
    
    return `254${formatted}`;
  }
}