/**
 * Multi-Factor Authentication Hook
 * Task 20: Authentication UI Components
 * 
 * MFA hook with SMS, email, and authenticator support for African markets
 */

'use client';

import { useState, useCallback } from 'react';
import { 
  MFAMethod, 
  MFASetupData, 
  MFAVerificationData, 
  MFAState, 
  UseMFAReturn,
  AuthResponse 
} from '../types/auth';

export function useMFA(): UseMFAReturn {
  const [mfaState, setMFAState] = useState<MFAState>({
    isRequired: false,
    methods: [],
    preferredMethod: null,
    setupComplete: false,
    verificationInProgress: false
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Setup MFA method
  const setupMFA = useCallback(async (data: MFASetupData): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/mfa/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('coindaily_access_token')}`
        },
        body: JSON.stringify(data)
      });

      const result: AuthResponse<{
        qrCode?: string;
        secret?: string;
        backupCodes?: string[];
        verificationRequired: boolean;
      }> = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || 'MFA setup failed');
      }

      setMFAState(prev => ({
        ...prev,
        methods: [...prev.methods, data.method],
        preferredMethod: data.method,
        verificationInProgress: result.data?.verificationRequired || false
      }));

      // Return the setup data if needed by the caller
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'MFA setup failed';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Verify MFA code
  const verifyMFA = useCallback(async (data: MFAVerificationData): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/mfa/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('coindaily_access_token')}`
        },
        body: JSON.stringify(data)
      });

      const result: AuthResponse<{
        verified: boolean;
        backupCodes?: string[];
        deviceTrusted?: boolean;
      }> = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || 'MFA verification failed');
      }

      if (result.data?.verified) {
        setMFAState(prev => ({
          ...prev,
          setupComplete: true,
          verificationInProgress: false,
          isRequired: false
        }));
      }

      // Verification complete
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'MFA verification failed';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Disable MFA
  const disableMFA = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/mfa/disable', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('coindaily_access_token')}`
        }
      });

      const result: AuthResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || 'Failed to disable MFA');
      }

      setMFAState({
        isRequired: false,
        methods: [],
        preferredMethod: null,
        setupComplete: false,
        verificationInProgress: false
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to disable MFA';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Check MFA status
  const checkMFAStatus = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch('/api/auth/mfa/status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('coindaily_access_token')}`
        }
      });

      const result: AuthResponse<{
        enabled: boolean;
        methods: MFAMethod[];
        preferredMethod: MFAMethod | null;
        backupCodesRemaining: number;
      }> = await response.json();

      if (response.ok && result.success && result.data) {
        setMFAState(prev => ({
          ...prev,
          setupComplete: result.data!.enabled,
          methods: result.data!.methods,
          preferredMethod: result.data!.preferredMethod
        }));
      }
    } catch (error) {
      console.error('Error checking MFA status:', error);
    }
  }, []);

  // Generate backup codes
  const generateBackupCodes = useCallback(async (): Promise<string[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/mfa/backup-codes', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('coindaily_access_token')}`
        }
      });

      const result: AuthResponse<{ backupCodes: string[] }> = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || 'Failed to generate backup codes');
      }

      return result.data?.backupCodes || [];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate backup codes';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    mfaState,
    setupMFA,
    verifyMFA,
    disableMFA,
    isLoading,
    error
  };
}