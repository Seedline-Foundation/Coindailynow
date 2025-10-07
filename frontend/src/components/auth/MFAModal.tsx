/**
 * Multi-Factor Authentication Modal
 * Task 20: Authentication UI Components
 * 
 * MFA modal with SMS, email, and authenticator support for African markets
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Modal, BottomSheet } from '../ui/Modal';
import { Input, Button, Select, Alert, LoadingSpinner } from '../ui';
import { useMFA } from '../../hooks/useMFA';
import { useFormValidation, validateMFAVerificationForm } from '../../utils/validation';
import { MFAMethod, MFASetupData, MFAVerificationData } from '../../types/auth';

interface MFAModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mode: 'setup' | 'verify';
  requiredMethods?: MFAMethod[];
  className?: string;
}

export function MFAModal({
  isOpen,
  onClose,
  onSuccess,
  mode,
  requiredMethods = [MFAMethod.SMS, MFAMethod.EMAIL],
  className
}: MFAModalProps) {
  const { mfaState, setupMFA, verifyMFA, isLoading, error } = useMFA();
  const [currentStep, setCurrentStep] = useState<'method' | 'phone' | 'verify' | 'complete'>('method');
  const [selectedMethod, setSelectedMethod] = useState<MFAMethod | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Setup form validation
  const {
    data: setupData,
    errors: setupErrors,
    handleFieldChange: handleSetupFieldChange,
    handleFieldBlur: handleSetupFieldBlur,
    validateAllFields: validateSetupFields,
    resetForm: resetSetupForm
  } = useFormValidation<{ method: MFAMethod | null; phoneNumber: string }>({
    method: null,
    phoneNumber: ''
  }, {
    method: { required: true },
    phoneNumber: { required: false }
  });

  // Verification form validation
  const {
    data: verifyData,
    errors: verifyErrors,
    handleFieldChange: handleVerifyFieldChange,
    handleFieldBlur: handleVerifyFieldBlur,
    validateAllFields: validateVerifyFields,
    resetForm: resetVerifyForm
  } = useFormValidation<{ code: string; trustDevice: boolean }>({
    code: '',
    trustDevice: false
  }, {
    code: { required: true },
    trustDevice: { required: false }
  });

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(mode === 'verify' ? 'verify' : 'method');
      setSelectedMethod(null);
      setQrCode(null);
      setBackupCodes([]);
      resetSetupForm();
      resetVerifyForm();
    }
  }, [isOpen, mode, resetSetupForm, resetVerifyForm]);

  // MFA method options
  const methodOptions = [
    {
      value: MFAMethod.SMS,
      label: '📱 SMS (Text Message)',
      description: 'Receive verification codes via SMS to your mobile phone',
      recommended: true
    },
    {
      value: MFAMethod.EMAIL,
      label: '✉️ Email',
      description: 'Receive verification codes via email',
      recommended: false
    },
    {
      value: MFAMethod.AUTHENTICATOR,
      label: '🔐 Authenticator App',
      description: 'Use Google Authenticator, Authy, or similar apps',
      recommended: false
    }
  ].filter(method => requiredMethods.includes(method.value));

  const handleMethodSelect = (method: MFAMethod) => {
    setSelectedMethod(method);
    handleSetupFieldChange('method', method);
    
    if (method === MFAMethod.SMS) {
      setCurrentStep('phone');
    } else {
      setCurrentStep('verify');
    }
  };

  const handleSetupSubmit = async () => {
    if (!selectedMethod) return;

    try {
      const setupPayload: MFASetupData = {
        method: selectedMethod,
        ...(selectedMethod === MFAMethod.SMS && { phoneNumber: setupData.phoneNumber })
      };

      const result = await setupMFA(setupPayload) as any;
      
      if (selectedMethod === MFAMethod.AUTHENTICATOR && result?.qrCode) {
        setQrCode(result.qrCode);
      }
      
      if (result?.backupCodes) {
        setBackupCodes(result.backupCodes);
      }

      setCurrentStep('verify');
    } catch (error) {
      console.error('MFA setup failed:', error);
    }
  };

  const handleVerificationSubmit = async () => {
    const formErrors = validateMFAVerificationForm({ code: verifyData.code });
    if (Object.keys(formErrors).length > 0) return;

    if (!validateVerifyFields()) return;

    try {
      const verificationPayload: MFAVerificationData = {
        code: verifyData.code,
        method: selectedMethod || MFAMethod.SMS,
        trustDevice: verifyData.trustDevice
      };

      await verifyMFA(verificationPayload);
      setCurrentStep('complete');
      
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (error) {
      console.error('MFA verification failed:', error);
    }
  };

  const renderContent = () => {
    switch (currentStep) {
      case 'method':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-secondary-100 mb-4">
                <svg className="h-6 w-6 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-neutral-900 mb-2">
                Choose Verification Method
              </h3>
              <p className="text-sm text-neutral-600">
                Select how you'd like to receive verification codes for enhanced security
              </p>
            </div>

            <div className="space-y-3">
              {methodOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleMethodSelect(option.value)}
                  className="w-full p-4 border-2 border-neutral-200 rounded-lg hover:border-primary-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all text-left group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-neutral-900">{option.label}</span>
                        {option.recommended && (
                          <span className="px-2 py-1 bg-secondary-100 text-secondary-700 text-xs rounded-full">
                            Recommended
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-neutral-600">{option.description}</p>
                    </div>
                    <svg className="h-5 w-5 text-neutral-400 group-hover:text-primary-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>

            <div className="bg-accent-50 border border-accent-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg className="h-5 w-5 text-accent-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-accent-800 mb-1">
                    African Mobile Networks Optimized
                  </p>
                  <p className="text-sm text-accent-700">
                    SMS delivery works with MTN, Safaricom, Vodacom, and other major African carriers
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'phone':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-secondary-100 mb-4">
                📱
              </div>
              <h3 className="text-lg font-medium text-neutral-900 mb-2">
                Enter Your Phone Number
              </h3>
              <p className="text-sm text-neutral-600">
                We'll send verification codes to this number via SMS
              </p>
            </div>

            {error && <Alert type="error" message={error} />}

            <Input
              label="Phone Number"
              type="tel"
              value={setupData.phoneNumber}
              onChange={(e) => handleSetupFieldChange('phoneNumber', e.target.value)}
              onBlur={() => handleSetupFieldBlur('phoneNumber')}
              error={setupErrors.phoneNumber as string}
              placeholder="+234 802 123 4567"
              hint="Include country code (e.g., +234 for Nigeria, +254 for Kenya)"
              leftIcon={
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              }
              variant="african"
              required
              autoComplete="tel"
              autoFocus
            />

            <div className="flex gap-3">
              <Button
                onClick={() => setCurrentStep('method')}
                variant="outline"
                fullWidth
              >
                Back
              </Button>
              <Button
                onClick={handleSetupSubmit}
                variant="african-gold"
                fullWidth
                isLoading={isLoading}
                disabled={!setupData.phoneNumber || isLoading}
              >
                Send Code
              </Button>
            </div>
          </div>
        );

      case 'verify':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-secondary-100 mb-4">
                🔒
              </div>
              <h3 className="text-lg font-medium text-neutral-900 mb-2">
                Enter Verification Code
              </h3>
              <p className="text-sm text-neutral-600">
                {selectedMethod === MFAMethod.SMS ? 
                  `We sent a code to ${setupData.phoneNumber}` :
                  selectedMethod === MFAMethod.EMAIL ?
                  'Check your email for the verification code' :
                  'Enter the code from your authenticator app'
                }
              </p>
            </div>

            {error && <Alert type="error" message={error} />}

            {qrCode && (
              <div className="text-center p-4 bg-white border rounded-lg">
                <p className="text-sm text-neutral-600 mb-3">
                  Scan this QR code with your authenticator app:
                </p>
                <img src={qrCode} alt="QR Code" className="mx-auto max-w-48" />
              </div>
            )}

            <Input
              label="Verification Code"
              type="text"
              value={verifyData.code}
              onChange={(e) => handleVerifyFieldChange('code', e.target.value.replace(/\D/g, '').slice(0, 6))}
              onBlur={() => handleVerifyFieldBlur('code')}
              error={verifyErrors.code as string}
              placeholder="Enter 6-digit code"
              maxLength={6}
              className="text-center text-2xl tracking-widest"
              variant="african"
              required
              autoComplete="one-time-code"
              autoFocus
            />

            {selectedMethod === MFAMethod.SMS && (
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={verifyData.trustDevice}
                  onChange={(e) => handleVerifyFieldChange('trustDevice', e.target.checked)}
                  className="h-4 w-4 text-secondary-600 focus:ring-secondary-500 border-secondary-200 rounded"
                />
                <label className="ml-3 text-sm text-neutral-700">
                  Trust this device for 30 days
                </label>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={() => setCurrentStep(selectedMethod === MFAMethod.SMS ? 'phone' : 'method')}
                variant="outline"
                fullWidth
                disabled={isLoading}
              >
                Back
              </Button>
              <Button
                onClick={handleVerificationSubmit}
                variant="african-gold"
                fullWidth
                isLoading={isLoading}
                disabled={verifyData.code.length !== 6 || isLoading}
              >
                Verify
              </Button>
            </div>

            <button
              type="button"
              className="w-full text-sm text-primary-600 hover:text-primary-500 focus:outline-none focus:underline"
              onClick={() => {
                // Resend code logic
                if (selectedMethod) {
                  handleSetupSubmit();
                }
              }}
            >
              Didn't receive the code? Resend
            </button>
          </div>
        );

      case 'complete':
        return (
          <div className="text-center space-y-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success-light/20">
              <svg className="h-8 w-8 text-success-DEFAULT" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                Multi-Factor Authentication Enabled! 🎉
              </h3>
              <p className="text-neutral-600">
                Your account is now secured with two-factor authentication
              </p>
            </div>

            {backupCodes.length > 0 && (
              <div className="bg-warning-light/10 border border-warning-light rounded-lg p-4">
                <h4 className="font-medium text-warning-dark mb-2">
                  Save Your Backup Codes
                </h4>
                <p className="text-sm text-warning-dark mb-3">
                  Store these codes securely. You can use them to access your account if you lose your device.
                </p>
                <div className="grid grid-cols-2 gap-2 text-sm font-mono">
                  {backupCodes.map((code, index) => (
                    <div key={index} className="bg-white p-2 rounded border">
                      {code}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <LoadingSpinner size="sm" color="primary" />
            <p className="text-sm text-neutral-500">
              Redirecting you back...
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  const ModalComponent = isMobile ? BottomSheet : Modal;

  return (
    <ModalComponent
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'setup' ? 'Setup Multi-Factor Authentication' : 'Verify Your Identity'}
      size="md"
      variant="african"
      closeOnOverlay={currentStep !== 'complete'}
      closeOnEscape={currentStep !== 'complete'}
      showCloseButton={currentStep !== 'complete'}
      {...(className && { className })}
    >
      {renderContent()}
    </ModalComponent>
  );
}