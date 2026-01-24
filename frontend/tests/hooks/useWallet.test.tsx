import { renderHook, act } from '@testing-library/react';
import { useWallet } from '../../src/hooks/useWallet';
import { WalletType } from '../../src/types/auth';

// Mock the Web3 utilities
jest.mock('../../src/utils/web3', () => ({
  getBalance: jest.fn().mockResolvedValue('1.234'),
  getENSName: jest.fn().mockResolvedValue(null),
  getENSAvatar: jest.fn().mockResolvedValue(null),
  switchNetwork: jest.fn().mockResolvedValue(undefined),
  signMessage: jest.fn().mockResolvedValue('0xsignature'),
  sendTransaction: jest.fn().mockResolvedValue('0xtxhash'),
  formatAddress: jest.fn((addr) => `${addr.slice(0, 6)}...${addr.slice(-4)}`)
}));

// Mock WalletConnect
jest.mock('@walletconnect/sign-client', () => ({
  SignClient: {
    init: jest.fn().mockResolvedValue({
      connect: jest.fn().mockResolvedValue({
        uri: 'wc:test-uri',
        approval: jest.fn().mockResolvedValue({
          namespaces: {
            eip155: {
              accounts: ['eip155:1:0x1234567890abcdef1234567890abcdef12345678']
            }
          }
        })
      }),
      session: {
        getAll: jest.fn().mockReturnValue([])
      },
      disconnect: jest.fn(),
      request: jest.fn()
    })
  }
}));

jest.mock('@walletconnect/modal', () => ({
  WalletConnectModal: jest.fn().mockImplementation(() => ({
    openModal: jest.fn(),
    closeModal: jest.fn()
  }))
}));

// Mock window.ethereum
const mockEthereum = {
  isMetaMask: true,
  request: jest.fn(),
  on: jest.fn(),
  removeListener: jest.fn()
};

Object.defineProperty(window, 'ethereum', {
  value: mockEthereum,
  writable: true
});

describe('useWallet - Real Web3 Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockEthereum.request.mockReset();
  });

  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => useWallet());

    expect(result.current.wallet).toBeNull();
    expect(result.current.isConnecting).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.supportedWallets).toContain(WalletType.METAMASK);
    expect(result.current.supportedWallets).toContain(WalletType.WALLET_CONNECT);
  });

  it('should detect MetaMask installation', () => {
    const { result } = renderHook(() => useWallet());
    expect(result.current.isMetaMaskInstalled()).toBe(true);
  });

  it('should connect to MetaMask successfully', async () => {
    mockEthereum.request
      .mockResolvedValueOnce(['0x1234567890abcdef1234567890abcdef12345678'])
      .mockResolvedValueOnce('0x1');

    const { result } = renderHook(() => useWallet());

    await act(async () => {
      await result.current.connectWallet(WalletType.METAMASK);
    });

    expect(result.current.wallet).not.toBeNull();
    expect(result.current.wallet?.type).toBe(WalletType.METAMASK);
    expect(result.current.wallet?.isConnected).toBe(true);
    expect(result.current.wallet?.address).toBe('0x1234567890abcdef1234567890abcdef12345678');
    expect(result.current.isConnecting).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle MetaMask connection error', async () => {
    mockEthereum.request.mockRejectedValue(new Error('User rejected request'));

    const { result } = renderHook(() => useWallet());

    await act(async () => {
      await result.current.connectWallet(WalletType.METAMASK);
    });

    expect(result.current.wallet).toBeNull();
    expect(result.current.error).toBe('User rejected request');
    expect(result.current.isConnecting).toBe(false);
  });

  it('should handle MetaMask not installed', async () => {
    Object.defineProperty(window, 'ethereum', {
      value: undefined,
      writable: true
    });

    const { result } = renderHook(() => useWallet());

    await act(async () => {
      await result.current.connectWallet(WalletType.METAMASK);
    });

    expect(result.current.wallet).toBeNull();
    expect(result.current.error).toBe('Please install MetaMask to connect your wallet');

    // Restore mock
    Object.defineProperty(window, 'ethereum', {
      value: mockEthereum,
      writable: true
    });
  });

  it('should connect via WalletConnect', async () => {
    const { result } = renderHook(() => useWallet());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    await act(async () => {
      await result.current.connectWallet(WalletType.WALLET_CONNECT);
    });

    expect(result.current.wallet).not.toBeNull();
    expect(result.current.wallet?.type).toBe(WalletType.WALLET_CONNECT);
    expect(result.current.wallet?.isConnected).toBe(true);
  });

  it('should disconnect wallet', () => {
    const { result } = renderHook(() => useWallet());

    act(() => {
      result.current.disconnectWallet();
    });

    expect(result.current.wallet).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should sign message', async () => {
    mockEthereum.request
      .mockResolvedValueOnce(['0x1234567890abcdef1234567890abcdef12345678'])
      .mockResolvedValueOnce('0x1');

    const { result } = renderHook(() => useWallet());

    await act(async () => {
      await result.current.connectWallet(WalletType.METAMASK);
    });

    const signature = await act(async () => {
      return await result.current.signMessage('Hello World');
    });

    expect(signature).toBe('0xsignature');
  });

  it('should send transaction', async () => {
    mockEthereum.request
      .mockResolvedValueOnce(['0x1234567890abcdef1234567890abcdef12345678'])
      .mockResolvedValueOnce('0x1');

    const { result } = renderHook(() => useWallet());

    await act(async () => {
      await result.current.connectWallet(WalletType.METAMASK);
    });

    const txHash = await act(async () => {
      return await result.current.sendTransaction({
        to: '0xabcd1234567890abcdef1234567890abcdef1234',
        value: '0.1'
      });
    });

    expect(txHash).toBe('0xtxhash');
  });

  it('should refresh balance', async () => {
    mockEthereum.request
      .mockResolvedValueOnce(['0x1234567890abcdef1234567890abcdef12345678'])
      .mockResolvedValueOnce('0x1');

    const { result } = renderHook(() => useWallet());

    await act(async () => {
      await result.current.connectWallet(WalletType.METAMASK);
    });

    await act(async () => {
      await result.current.refreshBalance();
    });

    expect(result.current.wallet?.balance).toBe('1.234');
  });
});