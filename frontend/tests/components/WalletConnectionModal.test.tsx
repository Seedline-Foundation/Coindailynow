import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WalletConnectionModal } from '../../src/components/auth/WalletConnectionModal';
import { WalletType } from '../../src/types/auth';

// Mock the useWallet hook dynamically
const mockConnectWallet = jest.fn();
const mockDisconnectWallet = jest.fn();

const mockWalletState = {
  wallet: null as any,
  isConnecting: false,
  error: null as string | null,
  connectWallet: mockConnectWallet,
  disconnectWallet: mockDisconnectWallet,
  supportedWallets: [WalletType.METAMASK, WalletType.WALLET_CONNECT],
  isMetaMaskInstalled: () => true
};

jest.mock('../../src/hooks/useWallet', () => ({
  useWallet: () => mockWalletState
}));

describe('WalletConnectionModal - Real Web3 Integration', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onWalletConnected: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockWalletState.wallet = null;
    mockWalletState.isConnecting = false;
    mockWalletState.error = null;
    mockWalletState.supportedWallets = [WalletType.METAMASK, WalletType.WALLET_CONNECT];
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
    mockWalletState.isConnecting = true;

    render(<WalletConnectionModal {...defaultProps} />);
    
    expect(screen.getByText('Connecting...')).toBeInTheDocument();
  });

  it('should display error message when connection fails', () => {
    // Mock error state
    mockWalletState.error = 'User rejected request';

    render(<WalletConnectionModal {...defaultProps} />);
    
    expect(screen.getByText('User rejected request')).toBeInTheDocument();
  });

  it('should handle keyboard navigation', () => {
    const onClose = jest.fn();
    render(<WalletConnectionModal {...defaultProps} onClose={onClose} />);
    
    fireEvent.keyDown(document, { key: 'Escape' });
    
    expect(onClose).toHaveBeenCalled();
  });

  it('should focus management correctly', async () => {
    render(<WalletConnectionModal {...defaultProps} />);
    
    // Check that focus is managed properly (first focusable element should be focused, which is the Close modal button)
    const closeButton = screen.getByRole('button', { name: 'Close modal' });
    await waitFor(() => {
      expect(document.activeElement).toBe(closeButton);
    });
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

    mockWalletState.wallet = mockWallet;

    render(<WalletConnectionModal {...defaultProps} onWalletConnected={onWalletConnected} />);
    
    await waitFor(() => {
      expect(onWalletConnected).toHaveBeenCalledWith(mockWallet);
    });
  });
});