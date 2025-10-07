/**
 * Mobile Money Integration Component
 * Task 20: Authentication UI Components
 * 
 * Mobile money payment integration for African markets
 */

'use client';

import React, { useState } from 'react';
import { Modal, BottomSheet } from '../ui/Modal';
import { Input, Button, Select, Alert } from '../ui';
import { useFormValidation } from '../../utils/validation';
import { MobileMoneyProvider, PaymentFormData } from '../../types/auth';

interface MobileMoneyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: any) => void;
  subscriptionPlan?: string;
  amount?: number;
  currency?: string;
  className?: string;
}

export function MobileMoneyModal({
  isOpen,
  onClose,
  onSuccess,
  subscriptionPlan = 'basic',
  amount = 500,
  currency = 'KES',
  className
}: MobileMoneyModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<'provider' | 'details' | 'confirm' | 'processing'>('provider');
  const [selectedProvider, setSelectedProvider] = useState<MobileMoneyProvider | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile device
  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const {
    data,
    errors,
    handleFieldChange,
    handleFieldBlur,
    validateAllFields,
    resetForm
  } = useFormValidation<PaymentFormData>({
    provider: selectedProvider || MobileMoneyProvider.MPESA,
    phoneNumber: '',
    amount,
    currency,
    subscriptionPlan
  }, {
    provider: { required: true },
    phoneNumber: { required: true },
    amount: { required: true },
    currency: { required: true },
    subscriptionPlan: { required: false }
  });

  // Mobile money provider options with African context
  const providerOptions = [
    {
      provider: MobileMoneyProvider.MPESA,
      name: 'M-Pesa',
      logo: '💚',
      countries: ['Kenya', 'Tanzania', 'Uganda'],
      currencies: ['KES', 'TZS', 'UGX'],
      popular: true,
      instructions: 'Enter your M-Pesa registered phone number',
      example: '+254 7XX XXX XXX'
    },
    {
      provider: MobileMoneyProvider.MTN_MONEY,
      name: 'MTN Mobile Money',
      logo: '🟡',
      countries: ['Ghana', 'Uganda', 'Rwanda', 'Cameroon'],
      currencies: ['GHS', 'UGX', 'RWF', 'XAF'],
      popular: true,
      instructions: 'Enter your MTN Mobile Money registered number',
      example: '+233 XX XXX XXXX'
    },
    {
      provider: MobileMoneyProvider.ORANGE_MONEY,
      name: 'Orange Money',
      logo: '🧡',
      countries: ['Senegal', 'Mali', 'Burkina Faso', 'Niger'],
      currencies: ['XOF'],
      popular: false,
      instructions: 'Enter your Orange Money registered number',
      example: '+221 XX XXX XX XX'
    },
    {
      provider: MobileMoneyProvider.AIRTEL_MONEY,
      name: 'Airtel Money',
      logo: '🔴',
      countries: ['Nigeria', 'Kenya', 'Uganda', 'Zambia'],
      currencies: ['NGN', 'KES', 'UGX', 'ZMW'],
      popular: true,
      instructions: 'Enter your Airtel Money registered number',
      example: '+234 XXX XXX XXXX'
    },
    {
      provider: MobileMoneyProvider.ECOCASH,
      name: 'EcoCash',
      logo: '💚',
      countries: ['Zimbabwe'],
      currencies: ['ZWL'],
      popular: false,
      instructions: 'Enter your EcoCash registered number',
      example: '+263 XX XXX XXXX'
    },
    {
      provider: MobileMoneyProvider.VODAFONE_CASH,
      name: 'Vodafone Cash',
      logo: '🔴',
      countries: ['Ghana'],
      currencies: ['GHS'],
      popular: false,
      instructions: 'Enter your Vodafone Cash registered number',
      example: '+233 XX XXX XXXX'
    }
  ];

  const getCurrentProviderInfo = () => {
    return providerOptions.find(p => p.provider === selectedProvider);
  };

  const handleProviderSelect = (provider: MobileMoneyProvider) => {
    setSelectedProvider(provider);
    handleFieldChange('provider', provider);
    setCurrentStep('details');
  };

  const handlePaymentSubmit = async () => {
    if (!validateAllFields()) return;

    setIsLoading(true);
    setError(null);

    try {
      // Simulate payment processing
      setCurrentStep('processing');
      
      // Mock API call to process mobile money payment
      const response = await fetch('/api/payments/mobile-money', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('coindaily_access_token')}`
        },
        body: JSON.stringify({
          provider: data.provider,
          phoneNumber: data.phoneNumber,
          amount: data.amount,
          currency: data.currency,
          subscriptionPlan: data.subscriptionPlan,
          metadata: {
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString()
          }
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || 'Payment failed');
      }

      // Success
      onSuccess(result.data);
      onClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Payment failed');
      setCurrentStep('details');
    } finally {
      setIsLoading(false);
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    const currencySymbols: Record<string, string> = {
      KES: 'KSh',
      NGN: '₦',
      GHS: '₵',
      ZAR: 'R',
      UGX: 'USh',
      TZS: 'TSh',
      XOF: 'CFA',
      RWF: 'RF',
      ZMW: 'ZK',
      ZWL: 'Z$'
    };

    return `${currencySymbols[currency] || currency} ${amount.toLocaleString()}`;
  };

  const renderContent = () => {
    switch (currentStep) {
      case 'provider':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent-100 mb-4">
                📱
              </div>
              <h3 className="text-lg font-medium text-neutral-900 mb-2">
                Choose Payment Method
              </h3>
              <p className="text-sm text-neutral-600">
                Pay securely with your preferred mobile money provider
              </p>
            </div>

            <div className="space-y-3">
              {providerOptions
                .filter(p => p.currencies.includes(currency))
                .sort((a, b) => (b.popular ? 1 : 0) - (a.popular ? 1 : 0))
                .map((option) => (
                  <button
                    key={option.provider}
                    onClick={() => handleProviderSelect(option.provider)}
                    className="w-full p-4 border-2 border-neutral-200 rounded-lg hover:border-accent-300 focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 transition-all text-left group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-2xl">{option.logo}</div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-neutral-900">{option.name}</span>
                            {option.popular && (
                              <span className="px-2 py-1 bg-accent-100 text-accent-700 text-xs rounded-full">
                                Popular
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-neutral-600">
                            Available in: {option.countries.slice(0, 2).join(', ')}
                            {option.countries.length > 2 && ` +${option.countries.length - 2} more`}
                          </p>
                        </div>
                      </div>
                      <svg className="h-5 w-5 text-neutral-400 group-hover:text-accent-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                ))}
            </div>

            <div className="bg-secondary-50 border border-secondary-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg className="h-5 w-5 text-secondary-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-secondary-800 mb-1">
                    Secure African Payments
                  </p>
                  <p className="text-sm text-secondary-700">
                    All transactions are encrypted and processed through licensed African payment partners
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'details':
        const providerInfo = getCurrentProviderInfo();
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent-100 mb-4">
                {providerInfo?.logo}
              </div>
              <h3 className="text-lg font-medium text-neutral-900 mb-2">
                {providerInfo?.name} Payment
              </h3>
              <p className="text-sm text-neutral-600">
                {providerInfo?.instructions}
              </p>
            </div>

            {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

            {/* Payment Summary */}
            <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
              <h4 className="font-medium text-neutral-900 mb-3">Payment Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-neutral-600">Subscription Plan:</span>
                  <span className="font-medium capitalize">{subscriptionPlan}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600">Amount:</span>
                  <span className="font-medium">{formatAmount(amount, currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600">Payment Method:</span>
                  <span className="font-medium">{providerInfo?.name}</span>
                </div>
              </div>
            </div>

            <Input
              label="Phone Number"
              type="tel"
              value={data.phoneNumber}
              onChange={(e) => handleFieldChange('phoneNumber', e.target.value)}
              onBlur={() => handleFieldBlur('phoneNumber')}
              error={errors.phoneNumber as string}
              placeholder={providerInfo?.example || "+XXX XXX XXX XXX"}
              hint={`Enter the phone number registered with ${providerInfo?.name}`}
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
                onClick={() => setCurrentStep('provider')}
                variant="outline"
                fullWidth
              >
                Back
              </Button>
              <Button
                onClick={handlePaymentSubmit}
                variant="mobile-money"
                fullWidth
                isLoading={isLoading}
                disabled={!data.phoneNumber || isLoading}
              >
                Pay {formatAmount(amount, currency)}
              </Button>
            </div>

            <div className="text-center">
              <p className="text-xs text-neutral-500">
                You will receive an SMS prompt on your phone to authorize this payment
              </p>
            </div>
          </div>
        );

      case 'processing':
        return (
          <div className="text-center space-y-6 py-8">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent-100">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-accent-300 border-t-accent-600"></div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                Processing Payment...
              </h3>
              <p className="text-neutral-600 mb-4">
                Please check your phone for a payment authorization SMS
              </p>
              <div className="bg-warning-light/10 border border-warning-light rounded-lg p-4 inline-block">
                <p className="text-sm text-warning-dark">
                  📱 You should receive an SMS prompt within 30 seconds
                </p>
              </div>
            </div>

            <Button
              onClick={() => setCurrentStep('details')}
              variant="outline"
              disabled={isLoading}
            >
              Cancel Payment
            </Button>
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
      title="Mobile Money Payment"
      size="md"
      variant="african"
      closeOnOverlay={currentStep !== 'processing'}
      closeOnEscape={currentStep !== 'processing'}
      showCloseButton={currentStep !== 'processing'}
      {...(className && { className })}
    >
      {renderContent()}
    </ModalComponent>
  );
}