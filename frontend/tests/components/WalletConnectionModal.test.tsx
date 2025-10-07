import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WalletConnectionModal } from '../../src/components/auth/WalletConnectionModal';
import { WalletType } from '../../src/types/auth';

// Mock the useWallet hook
const mockConnectWallet = jest.fn();
const mockDisconnectWallet = jest.fn();

jest.mock('../../src/hooks/useWallet', () => ({
  useWallet: () => ({
    wallet: null,
    isConnecting: false,
    error: null,
    connectWallet: mockConnectWallet,
    disconnectWallet: mockDisconnectWallet,
    supportedWallets: [WalletType.METAMASK, WalletType.WALLET_CONNECT],
    isMetaMaskInstalled: jest.fn().mockReturnValue(true)
  })
}));

describe('WalletConnectionModal - Real Web3 Integration', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onWalletConnected: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render modal when open', () => {
    render(<WalletConnectionModal {...defaultProps} />);
    
    expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
    expect(screen.getByText('Choose your preferred wallet to connect')).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    render(<WalletConnectionModal {...defaultProps} isOpen={false} />);
    
    expect(screen.queryByText('Connect Wallet')).not.toBeInTheDocument();
  });

  it('should display MetaMask option', () => {
    render(<WalletConnectionModal {...defaultProps} />);
    
    expect(screen.getByText('MetaMask')).toBeInTheDocument();
    expect(screen.getByText('Connect using MetaMask browser extension')).toBeInTheDocument();
  });

  it('should display WalletConnect option', () => {
    render(<WalletConnectionModal {...defaultProps} />);
    
    expect(screen.getByText('WalletConnect')).toBeInTheDocument();
    expect(screen.getByText('Connect using mobile wallet')).toBeInTheDocument();
  });

  it('should call connectWallet when MetaMask is clicked', async () => {
    render(<WalletConnectionModal {...defaultProps} />);
    
    const metamaskButton = screen.getByText('MetaMask').closest('button');
    fireEvent.click(metamaskButton!);

    await waitFor(() => {
      expect(mockConnectWallet).toHaveBeenCalledWith(WalletType.METAMASK);
    });
  });

  it('should call connectWallet when WalletConnect is clicked', async () => {
    render(<WalletConnectionModal {...defaultProps} />);
    
    const walletConnectButton = screen.getByText('WalletConnect').closest('button');
    fireEvent.click(walletConnectButton!);

    await waitFor(() => {
      expect(mockConnectWallet).toHaveBeenCalledWith(WalletType.WALLET_CONNECT);
    });
  });

  it('should close modal when close button is clicked', () => {
    const onClose = jest.fn();
    render(<WalletConnectionModal {...defaultProps} onClose={onClose} />);
    
    const closeButton = screen.getByText('×');
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalled();
  });

  it('should close modal when overlay is clicked', () => {
    const onClose = jest.fn();
    render(<WalletConnectionModal {...defaultProps} onClose={onClose} />);
    
    const overlay = screen.getByTestId('modal-overlay');
    fireEvent.click(overlay);

    expect(onClose).toHaveBeenCalled();
  });

  it('should display loading state when connecting', () => {
    // Mock connecting state
    jest.doMock('../../src/hooks/useWallet', () => ({
      useWallet: () => ({
        wallet: null,
        isConnecting: true,
        error: null,
        connectWallet: mockConnectWallet,
        disconnectWallet: mockDisconnectWallet,
        supportedWallets: [WalletType.METAMASK, WalletType.WALLET_CONNECT],
        isMetaMaskInstalled: jest.fn().mockReturnValue(true)
      })
    }));

    render(<WalletConnectionModal {...defaultProps} />);
    
    expect(screen.getByText('Connecting...')).toBeInTheDocument();
  });

  it('should display error message when connection fails', () => {
    // Mock error state
    jest.doMock('../../src/hooks/useWallet', () => ({
      useWallet: () => ({
        wallet: null,
        isConnecting: false,
        error: 'User rejected request',
        connectWallet: mockConnectWallet,
        disconnectWallet: mockDisconnectWallet,
        supportedWallets: [WalletType.METAMASK, WalletType.WALLET_CONNECT],
        isMetaMaskInstalled: jest.fn().mockReturnValue(true)
      })
    }));

    render(<WalletConnectionModal {...defaultProps} />);
    
    expect(screen.getByText('User rejected request')).toBeInTheDocument();
  });

  it('should handle keyboard navigation', () => {
    const onClose = jest.fn();
    render(<WalletConnectionModal {...defaultProps} onClose={onClose} />);
    
    fireEvent.keyDown(document, { key: 'Escape' });
    
    expect(onClose).toHaveBeenCalled();
  });

  it('should focus management correctly', () => {
    render(<WalletConnectionModal {...defaultProps} />);
    
    // Check that focus is managed properly (first focusable element should be focused)
    const firstButton = screen.getByText('MetaMask').closest('button');
    expect(document.activeElement).toBe(firstButton);
  });

  it('should call onWalletConnected when wallet connects successfully', async () => {
    const onWalletConnected = jest.fn();
    
    // Mock successful connection
    const mockWallet = {
      type: WalletType.METAMASK,
      address: '0x1234567890abcdef1234567890abcdef12345678',
      isConnected: true,
      balance: '1.234',
      ensName: null,
      ensAvatar: null,
      network: { chainId: 1, name: 'Ethereum' },
      formattedAddress: '0x1234...5678'
    };

    jest.doMock('../../src/hooks/useWallet', () => ({
      useWallet: () => ({
        wallet: mockWallet,
        isConnecting: false,
        error: null,
        connectWallet: mockConnectWallet,
        disconnectWallet: mockDisconnectWallet,
        supportedWallets: [WalletType.METAMASK, WalletType.WALLET_CONNECT],
        isMetaMaskInstalled: jest.fn().mockReturnValue(true)
      })
    }));

    render(<WalletConnectionModal {...defaultProps} onWalletConnected={onWalletConnected} />);
    
    await waitFor(() => {
      expect(onWalletConnected).toHaveBeenCalledWith(mockWallet);
    });
  });
});