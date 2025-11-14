/**
 * Whitelist Service - Wallet Address Whitelisting
 * 
 * Manages whitelisted external addresses for withdrawals.
 * Users can only withdraw funds to verified whitelisted addresses.
 * 
 * Features:
 * - Multi-address type support (wallet, bank, mobile money)
 * - Email verification required
 * - 24-hour waiting period before first use
 * - Admin can manage all whitelists
 */

import { PrismaClient } from '@prisma/client';
import { generateOTP, verifyOTP, OTPPurpose } from './OTPService';
import crypto from 'crypto';

const prisma = new PrismaClient();

// ============================================================================
// TYPES
// ============================================================================

export enum AddressType {
  WALLET = 'WALLET', // Cryptocurrency wallet
  BANK_ACCOUNT = 'BANK_ACCOUNT', // Bank account
  MOBILE_MONEY = 'MOBILE_MONEY', // M-Pesa, Orange Money, etc.
}

export enum VerificationMethod {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  DOCUMENT = 'DOCUMENT',
}

interface AddWhitelistInput {
  userId: string;
  walletId: string;
  address: string;
  addressType: AddressType;
  label?: string; // User-friendly name (e.g., "My Binance Wallet")
  verificationMethod?: VerificationMethod;
  metadata?: Record<string, any>;
}

interface VerifyWhitelistInput {
  whitelistId: string;
  userId: string;
  otpCode: string;
}

interface WhitelistFilters {
  userId?: string;
  walletId?: string;
  addressType?: AddressType;
  isActive?: boolean;
  isVerified?: boolean;
}

// ============================================================================
// ADD WHITELISTED ADDRESS
// ============================================================================

/**
 * Add a new whitelisted address (requires verification)
 */
export async function addWhitelistedAddress(input: AddWhitelistInput): Promise<any> {
  const {
    userId,
    walletId,
    address,
    addressType,
    label,
    verificationMethod = VerificationMethod.EMAIL,
    metadata,
  } = input;

  // 1. Validate wallet belongs to user
  const wallet = await prisma.wallet.findFirst({
    where: {
      id: walletId,
      userId,
    },
    include: {
      user: true,
    },
  });

  if (!wallet || !wallet.user) {
    throw new Error('Wallet not found or does not belong to user');
  }

  // 2. Check if address already whitelisted
  const existing = await prisma.walletWhitelist.findFirst({
    where: {
      walletId,
      address,
      addressType,
    },
  });

  if (existing) {
    throw new Error('Address already whitelisted');
  }

  // 3. Validate address format
  validateAddress(address, addressType);

  // 4. Create whitelist entry (unverified)
  const whitelist = await prisma.walletWhitelist.create({
    data: {
      walletId,
      address,
      addressType,
      label: label || `${addressType} - ${address.substring(0, 10)}...`,
      verificationMethod,
      isVerified: false,
      isActive: false, // Inactive until verified
      metadata: metadata ? JSON.stringify(metadata) : null,
    },
  });

  // 5. Generate OTP for verification
  const otpResult = await generateOTP({
    userId,
    userEmail: wallet.user.email,
    purpose: OTPPurpose.WHITELIST_ADDRESS,
    metadata: {
      whitelistId: whitelist.id,
      address,
      addressType,
    },
  });

  if (!otpResult.success) {
    // Rollback whitelist creation
    await prisma.walletWhitelist.delete({
      where: { id: whitelist.id },
    });
    throw new Error('Failed to send verification OTP');
  }

  // 6. Log action
  await logWhitelistAction(userId, 'ADDED', whitelist.id, address);

  return {
    whitelistId: whitelist.id,
    address,
    addressType,
    label: whitelist.label,
    requiresVerification: true,
    otpSentTo: wallet.user.email,
    status: 'PENDING_VERIFICATION',
  };
}

/**
 * Verify whitelisted address with OTP
 */
export async function verifyWhitelistedAddress(input: VerifyWhitelistInput): Promise<any> {
  const { whitelistId, userId, otpCode } = input;

  // 1. Get whitelist entry
  const whitelist = await prisma.walletWhitelist.findUnique({
    where: { id: whitelistId },
    include: {
      wallet: {
        include: {
          user: true,
        },
      },
    },
  });

  if (!whitelist) {
    throw new Error('Whitelist entry not found');
  }

  // 2. Verify ownership
  if (whitelist.wallet.userId !== userId) {
    throw new Error('Unauthorized access to whitelist entry');
  }

  // 3. Check if already verified
  if (whitelist.isVerified) {
    throw new Error('Address already verified');
  }

  // 4. Verify OTP
  const otpResult = await verifyOTP({
    userId,
    code: otpCode,
    purpose: OTPPurpose.WHITELIST_ADDRESS,
  });

  if (!otpResult.success) {
    await logWhitelistAction(userId, 'VERIFICATION_FAILED', whitelistId, whitelist.address);
    throw new Error(otpResult.error || 'Invalid verification code');
  }

  // 5. Calculate activation date (24 hours from now)
  const activatesAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  // 6. Mark as verified
  const updatedWhitelist = await prisma.walletWhitelist.update({
    where: { id: whitelistId },
    data: {
      isVerified: true,
      verifiedAt: new Date(),
      isActive: true, // Immediately active
      activatesAt, // But can't be used for 24 hours
    },
  });

  // 7. Log verification
  await logWhitelistAction(userId, 'VERIFIED', whitelistId, whitelist.address);

  return {
    whitelistId: updatedWhitelist.id,
    address: updatedWhitelist.address,
    addressType: updatedWhitelist.addressType,
    isVerified: true,
    isActive: true,
    activatesAt,
    canUseAfter: activatesAt,
    message: 'Address verified. You can use this address for withdrawals after 24 hours.',
  };
}

// ============================================================================
// QUERY WHITELISTED ADDRESSES
// ============================================================================

/**
 * Get all whitelisted addresses for a wallet
 */
export async function getWhitelistedAddresses(
  walletId: string,
  userId: string
): Promise<any[]> {
  // Verify wallet ownership
  const wallet = await prisma.wallet.findFirst({
    where: {
      id: walletId,
      userId,
    },
  });

  if (!wallet) {
    throw new Error('Wallet not found or unauthorized');
  }

  const whitelists = await prisma.walletWhitelist.findMany({
    where: {
      walletId,
      isActive: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return whitelists.map((wl) => ({
    id: wl.id,
    address: wl.address,
    addressType: wl.addressType,
    label: wl.label,
    isVerified: wl.isVerified,
    isActive: wl.isActive,
    canUseNow: wl.activatesAt ? new Date() > wl.activatesAt : wl.isVerified,
    activatesAt: wl.activatesAt,
    createdAt: wl.createdAt,
  }));
}

/**
 * Get specific whitelisted address
 */
export async function getWhitelistedAddress(
  whitelistId: string,
  userId: string
): Promise<any> {
  const whitelist = await prisma.walletWhitelist.findUnique({
    where: { id: whitelistId },
    include: {
      wallet: true,
    },
  });

  if (!whitelist) {
    throw new Error('Whitelist entry not found');
  }

  if (whitelist.wallet.userId !== userId) {
    throw new Error('Unauthorized access');
  }

  return {
    id: whitelist.id,
    address: whitelist.address,
    addressType: whitelist.addressType,
    label: whitelist.label,
    isVerified: whitelist.isVerified,
    isActive: whitelist.isActive,
    canUseNow: whitelist.activatesAt ? new Date() > whitelist.activatesAt : whitelist.isVerified,
    activatesAt: whitelist.activatesAt,
    verifiedAt: whitelist.verifiedAt,
    createdAt: whitelist.createdAt,
  };
}

/**
 * Check if address is whitelisted and usable
 */
export async function isAddressWhitelisted(
  walletId: string,
  address: string,
  addressType: AddressType
): Promise<boolean> {
  const whitelist = await prisma.walletWhitelist.findFirst({
    where: {
      walletId,
      address,
      addressType,
      isActive: true,
      isVerified: true,
    },
  });

  if (!whitelist) {
    return false;
  }

  // Check if activation period has passed
  if (whitelist.activatesAt && new Date() < whitelist.activatesAt) {
    return false;
  }

  return true;
}

// ============================================================================
// MODIFY WHITELISTED ADDRESSES
// ============================================================================

/**
 * Update whitelist label
 */
export async function updateWhitelistLabel(
  whitelistId: string,
  userId: string,
  newLabel: string
): Promise<any> {
  const whitelist = await prisma.walletWhitelist.findUnique({
    where: { id: whitelistId },
    include: { wallet: true },
  });

  if (!whitelist || whitelist.wallet.userId !== userId) {
    throw new Error('Whitelist entry not found or unauthorized');
  }

  const updated = await prisma.walletWhitelist.update({
    where: { id: whitelistId },
    data: { label: newLabel },
  });

  await logWhitelistAction(userId, 'LABEL_UPDATED', whitelistId, whitelist.address);

  return updated;
}

/**
 * Remove whitelisted address
 */
export async function removeWhitelistedAddress(
  whitelistId: string,
  userId: string
): Promise<boolean> {
  const whitelist = await prisma.walletWhitelist.findUnique({
    where: { id: whitelistId },
    include: { wallet: true },
  });

  if (!whitelist || whitelist.wallet.userId !== userId) {
    throw new Error('Whitelist entry not found or unauthorized');
  }

  // Soft delete (deactivate)
  await prisma.walletWhitelist.update({
    where: { id: whitelistId },
    data: {
      isActive: false,
      deletedAt: new Date(),
    },
  });

  await logWhitelistAction(userId, 'REMOVED', whitelistId, whitelist.address);

  return true;
}

/**
 * Reactivate whitelisted address (requires re-verification)
 */
export async function reactivateWhitelistedAddress(
  whitelistId: string,
  userId: string
): Promise<any> {
  const whitelist = await prisma.walletWhitelist.findUnique({
    where: { id: whitelistId },
    include: {
      wallet: {
        include: { user: true },
      },
    },
  });

  if (!whitelist || whitelist.wallet.userId !== userId) {
    throw new Error('Whitelist entry not found or unauthorized');
  }

  // Send new verification OTP
  const otpResult = await generateOTP({
    userId,
    userEmail: whitelist.wallet.user!.email,
    purpose: OTPPurpose.WHITELIST_ADDRESS,
    metadata: {
      whitelistId: whitelist.id,
      address: whitelist.address,
      reactivation: true,
    },
  });

  if (!otpResult.success) {
    throw new Error('Failed to send verification OTP');
  }

  // Reset verification status
  await prisma.walletWhitelist.update({
    where: { id: whitelistId },
    data: {
      isVerified: false,
      verifiedAt: null,
      isActive: false,
    },
  });

  await logWhitelistAction(userId, 'REACTIVATION_INITIATED', whitelistId, whitelist.address);

  return {
    message: 'Verification OTP sent. Please verify to reactivate address.',
    requiresVerification: true,
  };
}

// ============================================================================
// ADMIN FUNCTIONS
// ============================================================================

/**
 * Admin: Search all whitelists
 */
export async function adminSearchWhitelists(
  filters: WhitelistFilters,
  adminId: string
): Promise<any[]> {
  // Verify admin permissions
  const admin = await prisma.user.findUnique({
    where: { id: adminId },
  });

  if (!admin || (admin.role !== 'SUPER_ADMIN' && admin.role !== 'ADMIN')) {
    throw new Error('Insufficient permissions');
  }

  const where: any = {};
  if (filters.userId) {
    where.wallet = { userId: filters.userId };
  }
  if (filters.walletId) where.walletId = filters.walletId;
  if (filters.addressType) where.addressType = filters.addressType;
  if (filters.isActive !== undefined) where.isActive = filters.isActive;
  if (filters.isVerified !== undefined) where.isVerified = filters.isVerified;

  const whitelists = await prisma.walletWhitelist.findMany({
    where,
    include: {
      wallet: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return whitelists;
}

/**
 * Admin: Force verify address (emergency)
 */
export async function adminForceVerifyAddress(
  whitelistId: string,
  adminId: string,
  reason: string
): Promise<any> {
  // Verify super admin
  const admin = await prisma.user.findUnique({
    where: { id: adminId },
  });

  if (!admin || admin.role !== 'SUPER_ADMIN') {
    throw new Error('Super Admin access required');
  }

  const updated = await prisma.walletWhitelist.update({
    where: { id: whitelistId },
    data: {
      isVerified: true,
      verifiedAt: new Date(),
      isActive: true,
      activatesAt: new Date(), // Immediately usable
    },
  });

  await logWhitelistAction(adminId, 'ADMIN_FORCE_VERIFIED', whitelistId, updated.address, {
    reason,
  });

  return updated;
}

/**
 * Admin: Deactivate address (security)
 */
export async function adminDeactivateAddress(
  whitelistId: string,
  adminId: string,
  reason: string
): Promise<any> {
  const admin = await prisma.user.findUnique({
    where: { id: adminId },
  });

  if (!admin || admin.role !== 'SUPER_ADMIN') {
    throw new Error('Super Admin access required');
  }

  const updated = await prisma.walletWhitelist.update({
    where: { id: whitelistId },
    data: {
      isActive: false,
      deletedAt: new Date(),
    },
  });

  await logWhitelistAction(adminId, 'ADMIN_DEACTIVATED', whitelistId, updated.address, { reason });

  return updated;
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate address format based on type
 */
function validateAddress(address: string, addressType: AddressType): void {
  switch (addressType) {
    case AddressType.WALLET:
      // Basic crypto wallet validation (hex format, 40-42 chars)
      if (!/^(0x)?[0-9a-fA-F]{40}$/.test(address) && address.length < 26) {
        throw new Error('Invalid wallet address format');
      }
      break;

    case AddressType.BANK_ACCOUNT:
      // Bank account should have account number (10-20 digits)
      if (!/^\d{10,20}$/.test(address.replace(/\s/g, ''))) {
        throw new Error('Invalid bank account number format');
      }
      break;

    case AddressType.MOBILE_MONEY:
      // Mobile money should be phone number format
      if (!/^\+?[1-9]\d{9,14}$/.test(address.replace(/\s/g, ''))) {
        throw new Error('Invalid mobile money number format');
      }
      break;

    default:
      throw new Error(`Unknown address type: ${addressType}`);
  }
}

// ============================================================================
// LOGGING
// ============================================================================

/**
 * Log whitelist action
 */
async function logWhitelistAction(
  userId: string,
  action: string,
  whitelistId: string,
  address: string,
  metadata?: any
): Promise<void> {
  try {
    await prisma.securityLog.create({
      data: {
        userId,
        action: `WHITELIST_${action}`,
        ipAddress: '', // Should be passed from request
        userAgent: '',
        timestamp: new Date(),
        metadata: {
          whitelistId,
          address: address.substring(0, 10) + '...', // Partial address for security
          ...metadata,
        },
      },
    });
  } catch (error) {
    console.error('Error logging whitelist action:', error);
  }
}

export default {
  addWhitelistedAddress,
  verifyWhitelistedAddress,
  getWhitelistedAddresses,
  getWhitelistedAddress,
  isAddressWhitelisted,
  updateWhitelistLabel,
  removeWhitelistedAddress,
  reactivateWhitelistedAddress,
  adminSearchWhitelists,
  adminForceVerifyAddress,
  adminDeactivateAddress,
};
