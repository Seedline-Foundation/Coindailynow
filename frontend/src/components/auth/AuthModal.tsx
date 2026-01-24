/**
 * Main Authentication Modal
 * Task 20: Authentication UI Components
 * 
 * Main authentication modal that orchestrates login, register, MFA, and wallet connection
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Modal, BottomSheet } from '../ui/Modal';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { MFAModal } from './MFAModal';
import { MobileMoneyModal } from './MobileMoneyModal';
import { WalletConnectionModal } from './WalletConnectionModal';
import { ForgotPasswordForm } from './ForgotPasswordForm';
import { useAuth } from '../../hooks/useAuth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register' | 'forgot-password';
  redirectTo?: string;
  requireWallet?: boolean;
  showSubscription?: boolean;
  className?: string;
}

export function AuthModal({
  isOpen,
  onClose,
  initialMode = 'login',
  redirectTo,
  requireWallet = false,
  showSubscription = false,
  className
}: AuthModalProps) {
  const { user, isAuthenticated } = useAuth();
  const [currentMode, setCurrentMode] = useState<'login' | 'register' | 'forgot-password'>(initialMode);
  const [showMFA, setShowMFA] = useState(false);
  const [showMobileMoney, setShowMobileMoney] = useState(false);
  const [showWalletConnection, setShowWalletConnection] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [authFlow, setAuthFlow] = useState<{
    step: 'auth' | 'mfa' | 'payment' | 'wallet' | 'complete';
    data?: any;
  }>({ step: 'auth' });

  // Check if mobile device
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Reset modal state when opened
  useEffect(() => {
    if (isOpen) {
      setCurrentMode(initialMode);
      setShowMFA(false);
      setShowMobileMoney(false);
      setShowWalletConnection(false);
      setAuthFlow({ step: 'auth' });
    }
  }, [isOpen, initialMode]);

  // Handle authentication success and determine next steps
  const handleAuthSuccess = () => {
    // Check if MFA is required (this would come from the auth response)
    const mfaRequired = false; // This should come from auth response
    
    if (mfaRequired) {
      setAuthFlow({ step: 'mfa' });
      setShowMFA(true);
      return;
    }

    // Check if subscription is needed
    if (showSubscription) {
      setAuthFlow({ step: 'payment' });
      setShowMobileMoney(true);
      return;
    }

    // Check if wallet connection is required
    if (requireWallet) {
      setAuthFlow({ step: 'wallet' });
      setShowWalletConnection(true);
      return;
    }

    // Complete flow
    setAuthFlow({ step: 'complete' });
    setTimeout(() => {
      onClose();
      if (redirectTo) {
        window.location.href = redirectTo;
      }
    }, 1000);
  };

  // Handle MFA completion
  const handleMFASuccess = () => {
    setShowMFA(false);
    
    if (showSubscription) {
      setAuthFlow({ step: 'payment' });
      setShowMobileMoney(true);
    } else if (requireWallet) {
      setAuthFlow({ step: 'wallet' });
      setShowWalletConnection(true);
    } else {
      setAuthFlow({ step: 'complete' });
      setTimeout(() => {
        onClose();
        if (redirectTo) {
          window.location.href = redirectTo;
        }
      }, 1000);
    }
  };

  // Handle payment completion
  const handlePaymentSuccess = (data: any) => {
    setShowMobileMoney(false);
    
    if (requireWallet) {
      setAuthFlow({ step: 'wallet' });
      setShowWalletConnection(true);
    } else {
      setAuthFlow({ step: 'complete' });
      setTimeout(() => {
        onClose();
        if (redirectTo) {
          window.location.href = redirectTo;
        }
      }, 1000);
    }
  };

  // Handle wallet connection success
  const handleWalletSuccess = (wallet: any) => {
    setShowWalletConnection(false);
    setAuthFlow({ step: 'complete' });
    
    setTimeout(() => {
      onClose();
      if (redirectTo) {
        window.location.href = redirectTo;
      }
    }, 1000);
  };

  // Handle mode switching
  const handleSwitchToRegister = () => setCurrentMode('register');
  const handleSwitchToLogin = () => setCurrentMode('login');
  const handleForgotPassword = () => setCurrentMode('forgot-password');

  const getModalTitle = () => {
    switch (currentMode) {
      case 'register':
        return 'Create Account';
      case 'forgot-password':
        return 'Reset Password';
      default:
        return 'Sign In';
    }
  };

  const renderAuthForm = () => {
    switch (currentMode) {
      case 'register':
        return (
          <RegisterForm
            onSuccess={handleAuthSuccess}
            onSwitchToLogin={handleSwitchToLogin}
            {...(redirectTo && { redirectTo })}
          />
        );
      
      case 'forgot-password':
        return (
          <ForgotPasswordForm
            onSuccess={() => {
              setCurrentMode('login');
            }}
            onSwitchToLogin={handleSwitchToLogin}
          />
        );
      
      default:
        return (
          <LoginForm
            onSuccess={handleAuthSuccess}
            onSwitchToRegister={handleSwitchToRegister}
            onForgotPassword={handleForgotPassword}
            {...(redirectTo && { redirectTo })}
          />
        );
    }
  };

  // If user is already authenticated, show completion or close
  if (isAuthenticated && user && authFlow.step === 'auth') {
    if (requireWallet && !user.walletConnected) {
      setAuthFlow({ step: 'wallet' });
      setShowWalletConnection(true);
    } else {
      onClose();
      if (redirectTo) {
        window.location.href = redirectTo;
      }
    }
  }

  const ModalComponent = isMobile ? BottomSheet : Modal;

  return (
    <>
      {/* Main Auth Modal */}
      <ModalComponent
        isOpen={isOpen && authFlow.step === 'auth'}
        onClose={onClose}
        title={getModalTitle()}
        size="md"
        variant="african"
        {...(className && { className })}
      >
        {renderAuthForm()}
      </ModalComponent>

      {/* MFA Modal */}
      <MFAModal
        isOpen={showMFA}
        onClose={() => {
          setShowMFA(false);
          onClose();
        }}
        onSuccess={handleMFASuccess}
        mode="verify"
      />

      {/* Mobile Money Payment Modal */}
      <MobileMoneyModal
        isOpen={showMobileMoney}
        onClose={() => {
          setShowMobileMoney(false);
          onClose();
        }}
        onSuccess={handlePaymentSuccess}
        subscriptionPlan="basic"
        amount={500}
        currency="KES"
      />

      {/* Wallet Connection Modal */}
      <WalletConnectionModal
        isOpen={showWalletConnection}
        onClose={() => {
          if (!requireWallet) {
            setShowWalletConnection(false);
            onClose();
          }
        }}
        onWalletConnected={handleWalletSuccess}
      />
    </>
  );
}
