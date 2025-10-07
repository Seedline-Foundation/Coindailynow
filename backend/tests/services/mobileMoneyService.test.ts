/**
 * Mobile Money Service Tests
 * Task 15: Mobile Money Integration - TDD Test Suite
 */

import { MobileMoneyService } from '../../src/services/mobileMoneyService';
import { FraudDetectionService } from '../../src/services/fraud-detection.service';
import { ComplianceService, ComplianceStatus } from '../../src/services/compliance.service';
import {
  MobileMoneyProvider,
  PaymentRequest,
  PaymentStatus,
  TransactionType,
  FraudRiskLevel
} from '../../src/types/mobile-money';

// Mock Prisma Client
const mockPrisma = {
  mobileMoneyTransaction: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
  subscription: {
    findUnique: jest.fn(),
  }
} as any;

// Mock Redis Client
const mockRedis = {
  get: jest.fn(),
  set: jest.fn(),
  setex: jest.fn(),
  del: jest.fn(),
  exists: jest.fn(),
  incr: jest.fn(),
  expire: jest.fn()
} as any;

// Mock Logger
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
} as any;

describe('MobileMoneyService', () => {
  let mobileMoneyService: MobileMoneyService;
  let fraudDetectionService: FraudDetectionService;
  let complianceService: ComplianceService;

  beforeEach(() => {
    jest.clearAllMocks();
    
    fraudDetectionService = new FraudDetectionService(mockPrisma, mockRedis, mockLogger);
    complianceService = new ComplianceService(mockPrisma, mockLogger);
    mobileMoneyService = new MobileMoneyService(
      mockPrisma,
      mockRedis,
      mockLogger,
      fraudDetectionService,
      complianceService
    );
  });

  const validPaymentRequest: PaymentRequest = {
    id: 'test-payment-123',
    userId: 'user-123',
    provider: MobileMoneyProvider.MPESA,
    amount: 100000, // 1000 KES in cents
    currency: 'KES',
    phoneNumber: '+254708374149',
    description: 'Premium subscription payment',
    transactionType: TransactionType.SUBSCRIPTION_PAYMENT,
    expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
  };

  describe('Payment Initiation', () => {
    it('should successfully initiate a valid payment', async () => {
      // Mock successful fraud analysis
      const mockFraudAnalysis = {
        transactionId: validPaymentRequest.id,
        riskLevel: FraudRiskLevel.LOW,
        riskScore: 15,
        flags: [],
        recommendation: 'approve' as const,
        reason: 'Low fraud risk - transaction approved',
        analyzedAt: new Date()
      };

      // Mock successful compliance validation
      const mockComplianceValidation = {
        transactionId: validPaymentRequest.id,
        status: ComplianceStatus.COMPLIANT,
        checks: [],
        violations: [],
        requiresManualReview: false
      };

      // Mock successful database operations
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-123', email: 'test@example.com' });
      mockPrisma.mobileMoneyTransaction.create.mockResolvedValue({
        ...validPaymentRequest,
        status: PaymentStatus.PENDING
      });

      // Spy on service methods
      jest.spyOn(fraudDetectionService, 'analyze').mockResolvedValue(mockFraudAnalysis);
      jest.spyOn(complianceService, 'validateTransaction').mockResolvedValue(mockComplianceValidation);

      // Execute test
      const result = await mobileMoneyService.initiatePayment(validPaymentRequest);

      // Assertions
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(mockPrisma.mobileMoneyTransaction.create).toHaveBeenCalled();
    });

    it('should reject payment with high fraud risk', async () => {
      // Mock high-risk fraud analysis
      const mockFraudAnalysis = {
        transactionId: validPaymentRequest.id,
        riskLevel: FraudRiskLevel.CRITICAL,
        riskScore: 95,
        flags: [
          {
            type: 'blacklisted_phone',
            severity: 'critical' as const,
            description: 'Phone number is on fraud blacklist',
            details: { phoneNumber: validPaymentRequest.phoneNumber.substring(0, 8) + 'XXXX' }
          }
        ],
        recommendation: 'decline' as const,
        reason: 'High risk score - multiple fraud indicators detected',
        analyzedAt: new Date()
      };

      // Mock successful compliance 
      const mockComplianceValidation = {
        transactionId: validPaymentRequest.id,
        status: ComplianceStatus.COMPLIANT,
        checks: [],
        violations: [],
        requiresManualReview: false
      };

      // Mock database operations
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-123', email: 'test@example.com' });

      // Spy on service methods
      jest.spyOn(fraudDetectionService, 'analyze').mockResolvedValue(mockFraudAnalysis);
      jest.spyOn(complianceService, 'validateTransaction').mockResolvedValue(mockComplianceValidation);

      // Execute test
      const result = await mobileMoneyService.initiatePayment(validPaymentRequest);

      // Assertions
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('FRAUD_DETECTED');
    });
  });

  describe('Payment Verification', () => {
    it('should successfully verify a completed payment', async () => {
      const transactionId = 'test-payment-123';
      const providerTransactionId = 'MPESA-123456789';

      // Mock database transaction
      const mockTransaction = {
        id: transactionId,
        userId: 'user-123',
        provider: MobileMoneyProvider.MPESA,
        providerTransactionId,
        amount: 100000,
        currency: 'KES',
        status: PaymentStatus.PROCESSING,
        phoneNumber: '+254708374149'
      };

      mockPrisma.mobileMoneyTransaction.findUnique.mockResolvedValue(mockTransaction);
      mockPrisma.mobileMoneyTransaction.update.mockResolvedValue({
        ...mockTransaction,
        status: PaymentStatus.COMPLETED
      });

      // Execute test
      const result = await mobileMoneyService.verifyPayment({
        transactionId,
        provider: MobileMoneyProvider.MPESA,
        providerTransactionId
      });

      // Assertions
      expect(result.data?.verified).toBe(true);
      expect(result.data?.status).toBe(PaymentStatus.COMPLETED);
    });
  });

  describe('Provider Configuration', () => {
    it('should get available providers', async () => {
      const result = await mobileMoneyService.getAvailableProviders('KE');
      
      expect(result.success).toBe(true);
      expect(result.data).toBeInstanceOf(Array);
      if (result.data && result.data.length > 0) {
        expect(result.data[0]).toHaveProperty('provider');
        expect(result.data[0]).toHaveProperty('isAvailable');
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid payment request', async () => {
      const invalidRequest = {
        ...validPaymentRequest,
        amount: -100 // Invalid negative amount
      } as any;

      const result = await mobileMoneyService.initiatePayment(invalidRequest);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_AMOUNT');
    });
  });
});