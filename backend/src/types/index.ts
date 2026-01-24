/**
 * Central Type Exports
 * Single source of truth for all type imports across the application
 */

// ============================================================================
// Prisma Generated Types & Enums
// ============================================================================
export {
  User,
  UserRole,
  Article,
  Category,
  Vote,
  Subscription,
  Wallet,
  AITask,
  AIAgent,
  ContentWorkflow,
  WorkflowStep,
  Session,
  RefreshToken,
  PasswordReset,
  AdminPermission,
  AuditLog,
  AnalyticsEvent,
  ModerationQueue,
  AdminAction,
  UserPenalty,
  ModerationAlert,
  ModerationSettings,
  Prisma,
  PrismaClient,
} from '@prisma/client';

// ============================================================================
// Authentication & Authorization Types
// ============================================================================
export interface JWTPayload {
  sub: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface AuthPayload {
  token: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    username: string;
    role: string;
    emailVerified: boolean;
  };
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  newPassword: string;
}

// ============================================================================
// Service Response Types
// ============================================================================
export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================================================
// API Error Types
// ============================================================================
export interface ApiError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
  path?: string;
}

// ============================================================================
// Domain-specific types
// Import these directly in files that need them to avoid re-export conflicts:
// - import { ... } from './types/analytics'
// - import { ... } from './types/market-data'
// - import { ... } from './types/mobile-money'
// - import { ... } from '../../../ai-system/types'
// ============================================================================
