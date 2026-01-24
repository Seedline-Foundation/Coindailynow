/**
 * Authentication Types for Frontend
 * Task 20: Authentication UI Components
 * 
 * Comprehensive type definitions for authentication UI components with African context
 */

// ========== Authentication State Types ==========

export interface User {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  subscriptionTier: 'FREE' | 'BASIC' | 'PREMIUM' | 'VIP';
  emailVerified: boolean;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION';
  walletConnected: boolean;
  walletAddress?: string;
  mfaEnabled: boolean;
  avatar?: string;
  preferences: UserPreferences;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  language: string;
  currency: string;
  timezone: string;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
    marketUpdates: boolean;
    priceAlerts: boolean;
  };
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// ========== Form Data Types ==========

export interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
  deviceFingerprint?: string;
}

export interface RegisterFormData {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  agreeToTerms: boolean;
  subscribeToNewsletter: boolean;
  preferredLanguage: string;
  country: string;
}

export interface ForgotPasswordFormData {
  email: string;
}

export interface ResetPasswordFormData {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface ChangePasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// ========== Multi-Factor Authentication Types ==========

export enum MFAMethod {
  SMS = 'SMS',
  EMAIL = 'EMAIL',
  AUTHENTICATOR = 'AUTHENTICATOR',
  PHONE_CALL = 'PHONE_CALL'
}

export interface MFASetupData {
  method: MFAMethod;
  phoneNumber?: string;
  backupEmail?: string;
}

export interface MFAVerificationData {
  code: string;
  method: MFAMethod;
  trustDevice?: boolean;
}

export interface MFAState {
  isRequired: boolean;
  methods: MFAMethod[];
  preferredMethod: MFAMethod | null;
  setupComplete: boolean;
  verificationInProgress: boolean;
}

// ========== Mobile Money Integration Types ==========

export enum MobileMoneyProvider {
  MPESA = 'MPESA',
  ORANGE_MONEY = 'ORANGE_MONEY',
  MTN_MONEY = 'MTN_MONEY',
  ECOCASH = 'ECOCASH',
  AIRTEL_MONEY = 'AIRTEL_MONEY',
  TIGO_PESA = 'TIGO_PESA',
  VODAFONE_CASH = 'VODAFONE_CASH',
  ORANGE_CASH = 'ORANGE_CASH'
}

export interface MobileMoneyAccount {
  id: string;
  provider: MobileMoneyProvider;
  phoneNumber: string;
  accountName: string;
  isVerified: boolean;
  isPrimary: boolean;
  country: string;
  currency: string;
}

export interface PaymentFormData {
  provider: MobileMoneyProvider;
  phoneNumber: string;
  amount: number;
  currency: string;
  subscriptionPlan?: string;
}

// ========== Web3 Wallet Types ==========

export enum WalletType {
  METAMASK = 'METAMASK',
  WALLET_CONNECT = 'WALLET_CONNECT',
  COINBASE = 'COINBASE',
  TRUST_WALLET = 'TRUST_WALLET',
  PHANTOM = 'PHANTOM'
}

export interface WalletConnection {
  type: WalletType;
  address: string;
  chainId: number;
  balance?: string;
  isConnected: boolean;
  provider?: any;
  ensName?: string;
  avatar?: string;
}

export interface WalletConnectionState {
  wallet: WalletConnection | null;
  isConnecting: boolean;
  error: string | null;
  supportedWallets: WalletType[];
}

export interface Web3Transaction {
  to: string;
  value?: string;
  data?: string;
  gasLimit?: string;
  gasPrice?: string;
  nonce?: number;
}

export interface WalletConnectSession {
  topic: string;
  peer: {
    publicKey: string;
    metadata: {
      name: string;
      description: string;
      url: string;
      icons: string[];
    };
  };
  namespaces: any;
}

export interface NetworkInfo {
  chainId: number;
  chainName: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: string[];
  blockExplorerUrls: string[];
}

// ========== Form Validation Types ==========

export interface FormErrors {
  [key: string]: string | string[] | undefined;
}

export interface FormValidationRules {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
}

// ========== UI Component Props Types ==========

export interface BaseFormProps {
  onSubmit: (data: any) => void | Promise<void>;
  isLoading?: boolean;
  error?: string | null;
  className?: string;
}

export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register' | 'forgot-password';
  redirectTo?: string;
}

export interface SocialAuthProps {
  providers: string[];
  onSuccess: (provider: string, data: any) => void;
  onError: (error: string) => void;
  disabled?: boolean;
}

// ========== African Localization Types ==========

export interface AfricanLocale {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  currency: string;
  mobileMoneyProviders: MobileMoneyProvider[];
  supportLevel: 'full' | 'partial' | 'basic';
}

export const AFRICAN_LOCALES: AfricanLocale[] = [
  {
    code: 'en-NG',
    name: 'English (Nigeria)',
    nativeName: 'English',
    flag: '🇳🇬',
    currency: 'NGN',
    mobileMoneyProviders: [MobileMoneyProvider.AIRTEL_MONEY],
    supportLevel: 'full'
  },
  {
    code: 'en-KE',
    name: 'English (Kenya)',
    nativeName: 'English',
    flag: '🇰🇪',
    currency: 'KES',
    mobileMoneyProviders: [MobileMoneyProvider.MPESA, MobileMoneyProvider.AIRTEL_MONEY],
    supportLevel: 'full'
  },
  {
    code: 'en-ZA',
    name: 'English (South Africa)',
    nativeName: 'English',
    flag: '🇿🇦',
    currency: 'ZAR',
    mobileMoneyProviders: [],
    supportLevel: 'full'
  },
  {
    code: 'en-GH',
    name: 'English (Ghana)',
    nativeName: 'English',
    flag: '🇬🇭',
    currency: 'GHS',
    mobileMoneyProviders: [MobileMoneyProvider.MTN_MONEY, MobileMoneyProvider.VODAFONE_CASH],
    supportLevel: 'full'
  },
  // Add more African locales as needed
];

// ========== Device and Security Types ==========

export interface DeviceInfo {
  fingerprint: string;
  userAgent: string;
  platform: string;
  isMobile: boolean;
  country?: string;
  ipAddress?: string;
}

export interface SecuritySettings {
  twoFactorEnabled: boolean;
  trustedDevices: string[];
  lastPasswordChange: string;
  loginNotifications: boolean;
  suspiciousActivityAlerts: boolean;
}

// ========== API Response Types ==========

export interface AuthResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  meta?: {
    requestId: string;
    timestamp: string;
    cached?: boolean;
  };
}

export interface LoginResponse extends AuthResponse {
  data?: {
    user: User;
    tokens: AuthTokens;
    mfaRequired?: boolean;
    mfaMethods?: MFAMethod[];
  };
}

export interface RegisterResponse extends AuthResponse {
  data?: {
    user: User;
    tokens: AuthTokens;
    emailVerificationRequired: boolean;
  };
}

// ========== Hook Return Types ==========

export interface UseAuthReturn {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (data: LoginFormData) => Promise<void>;
  register: (data: RegisterFormData) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  clearError: () => void;
}

export interface UseMFAReturn {
  mfaState: MFAState;
  setupMFA: (data: MFASetupData) => Promise<void>;
  verifyMFA: (data: MFAVerificationData) => Promise<void>;
  disableMFA: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export interface UseWalletReturn {
  walletState: WalletConnectionState;
  connectWallet: (type: WalletType) => Promise<void>;
  disconnectWallet: () => Promise<void>;
  switchChain: (chainId: number) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}