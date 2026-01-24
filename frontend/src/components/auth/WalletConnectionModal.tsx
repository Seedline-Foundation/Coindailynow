'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useWallet } from '../../hooks/useWallet';
import { WalletType, WalletConnection } from '../../types/auth';

interface WalletConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWalletConnected?: (wallet: WalletConnection) => void;
}

export function WalletConnectionModal({
  isOpen,
  onClose,
  onWalletConnected
}: WalletConnectionModalProps) {
  const { wallet, isConnecting, error, connectWallet, supportedWallets, isMetaMaskInstalled } = useWallet();
  const modalRef = useRef<HTMLDivElement>(null);
  const [previousFocus, setPreviousFocus] = useState<HTMLElement | null>(null);

  // Handle modal focus management
  useEffect(() => {
    if (isOpen) {
      setPreviousFocus(document.activeElement as HTMLElement);
      
      // Focus first button when modal opens
      setTimeout(() => {
        const firstButton = modalRef.current?.querySelector('button');
        if (firstButton) {
          firstButton.focus();
        }
      }, 100);
    }

    return () => {
      if (previousFocus && !isOpen) {
        previousFocus.focus();
      }
    };
  }, [isOpen, previousFocus]);

  // Handle successful wallet connection
  useEffect(() => {
    if (wallet?.isConnected && onWalletConnected) {
      onWalletConnected(wallet);
      onClose();
    }
  }, [wallet, onWalletConnected, onClose]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleConnect = async (type: WalletType) => {
    try {
      await connectWallet(type);
    } catch (error) {
      console.error('Connection failed:', error);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={handleOverlayClick}
      data-testid="modal-overlay"
    >
      <div 
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl font-light leading-none"
          aria-label="Close modal"
        >
          ×
        </button>

        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">Connect Wallet</h2>
            <p className="mt-2 text-gray-600">Choose your preferred wallet to connect</p>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Loading state */}
          {isConnecting ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-orange-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-lg text-gray-700">Connecting...</span>
              </div>
            </div>
          ) : (
            /* Wallet options */
            <div className="space-y-3">
              {supportedWallets.includes(WalletType.METAMASK) && (
                <button
                  onClick={() => handleConnect(WalletType.METAMASK)}
                  disabled={!isMetaMaskInstalled()}
                  className="w-full flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:border-orange-500 hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                      <span className="text-xl">🦊</span>
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-gray-900">MetaMask</h3>
                      <p className="text-sm text-gray-500">Connect using MetaMask browser extension</p>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}

              {supportedWallets.includes(WalletType.WALLET_CONNECT) && (
                <button
                  onClick={() => handleConnect(WalletType.WALLET_CONNECT)}
                  className="w-full flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:border-orange-500 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-xl">📱</span>
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-gray-900">WalletConnect</h3>
                      <p className="text-sm text-gray-500">Connect using mobile wallet</p>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </div>
          )}

          {/* Security notice */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.98-.833-2.75 0L3.064 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-700">
                  Only connect to wallets you trust. CoinDaily will never ask for your private keys or seed phrases.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

