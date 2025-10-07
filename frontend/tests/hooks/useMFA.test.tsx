import { renderHook, act } from '@testing-library/react';
import { useMFA } from '@/hooks/useMFA';
import { MFAMethod } from '../../src/types/auth';

// Mock fetch
global.fetch = jest.fn();

describe('useMFA', () => {
  beforeEach(() => {
    (fetch as jest.MockedFunction<typeof fetch>).mockClear();
  });

  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => useMFA());

    expect(result.current.mfaState.setupComplete).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.mfaState.methods).toEqual([]);
  });

  it('should setup MFA successfully', async () => {
    const mockResponse = {
      success: true,
      data: {
        qrCode: 'data:image/png;base64,mock-qr-code',
        backupCodes: ['123456', '789012', '345678'],
        verificationRequired: false
      }
    };

    (fetch as jest.MockedFunction<typeof fetch>)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response);

    const { result } = renderHook(() => useMFA());

    await act(async () => {
      await result.current.setupMFA({
        method: MFAMethod.AUTHENTICATOR
      });
    });

    expect(result.current.mfaState.methods).toContain(MFAMethod.AUTHENTICATOR);
    expect(result.current.mfaState.preferredMethod).toBe(MFAMethod.AUTHENTICATOR);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle setup MFA error', async () => {
    const errorMessage = 'Failed to setup MFA';
    (fetch as jest.MockedFunction<typeof fetch>)
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ 
          success: false, 
          error: { message: errorMessage } 
        })
      } as Response);

    const { result } = renderHook(() => useMFA());

    await act(async () => {
      try {
        await result.current.setupMFA({
          method: MFAMethod.AUTHENTICATOR
        });
      } catch (error) {
        // Expected to throw
      }
    });

    expect(result.current.error).toBe(errorMessage);
    expect(result.current.isLoading).toBe(false);
  });

  it('should verify MFA code successfully', async () => {
    (fetch as jest.MockedFunction<typeof fetch>)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          success: true, 
          data: { verified: true } 
        })
      } as Response);

    const { result } = renderHook(() => useMFA());

    await act(async () => {
      await result.current.verifyMFA({
        code: '123456',
        method: MFAMethod.AUTHENTICATOR
      });
    });

    expect(result.current.mfaState.setupComplete).toBe(true);
    expect(result.current.mfaState.verificationInProgress).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle verify MFA error', async () => {
    (fetch as jest.MockedFunction<typeof fetch>)
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ 
          success: false, 
          error: { message: 'Invalid code' } 
        })
      } as Response);

    const { result } = renderHook(() => useMFA());

    await act(async () => {
      try {
        await result.current.verifyMFA({
          code: 'invalid',
          method: MFAMethod.AUTHENTICATOR
        });
      } catch (error) {
        // Expected to throw
      }
    });

    expect(result.current.error).toBe('Invalid code');
  });

  it('should disable MFA successfully', async () => {
    // First enable MFA
    (fetch as jest.MockedFunction<typeof fetch>)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          success: true, 
          data: { verified: true } 
        })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          success: true 
        })
      } as Response);

    const { result } = renderHook(() => useMFA());

    await act(async () => {
      await result.current.verifyMFA({
        code: '123456',
        method: MFAMethod.AUTHENTICATOR
      });
      await result.current.disableMFA();
    });

    expect(result.current.mfaState.setupComplete).toBe(false);
    expect(result.current.mfaState.methods).toEqual([]);
    expect(result.current.mfaState.preferredMethod).toBeNull();
  });

  it('should handle disable MFA error', async () => {
    (fetch as jest.MockedFunction<typeof fetch>)
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ 
          success: false, 
          error: { message: 'Invalid code' } 
        })
      } as Response);

    const { result } = renderHook(() => useMFA());

    await act(async () => {
      try {
        await result.current.disableMFA();
      } catch (error) {
        // Expected to throw
      }
    });

    expect(result.current.error).toBe('Invalid code');
    expect(result.current.mfaState.setupComplete).toBe(false);
  });
});