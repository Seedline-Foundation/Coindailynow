/**
 * Authentication Components Index
 * Task 20: Authentication UI Components
 * 
 * Export all authentication components for easy importing
 */

export { AuthModal } from './AuthModal';
export { LoginForm } from './LoginForm';
export { RegisterForm } from './RegisterForm';
export { ForgotPasswordForm } from './ForgotPasswordForm';
export { MFAModal } from './MFAModal';
export { MobileMoneyModal } from './MobileMoneyModal';
export { WalletConnectionModal } from './WalletConnectionModal';

// Re-export auth types
export type {
  User,
  AuthTokens,
  AuthState,
  LoginFormData,
  RegisterFormData,
  ForgotPasswordFormData,
  MFAMethod,
  MFASetupData,
  MFAVerificationData,
  MobileMoneyProvider,
  PaymentFormData,
  WalletType,
  WalletConnection,
  UseAuthReturn
} from '../../types/auth';

// Re-export hooks
export { useAuth, AuthProvider } from '../../hooks/useAuth';
export { useMFA } from '../../hooks/useMFA';