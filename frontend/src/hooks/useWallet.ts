import { useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';
import { SignClient } from '@walletconnect/sign-client';
import type { SessionTypes } from '@walletconnect/types';
import { WalletConnectModal } from '@walletconnect/modal';
import { WalletType, WalletConnection, WalletConnectionState, Web3Transaction } from '../types/auth';
import { getBalance, getENSName, getENSAvatar, switchNetwork, signMessage, sendTransaction } from '../utils/web3';

// Real wallet hook with Web3 integration
interface UseWalletReturn {
  wallet: WalletConnection | null;
  isConnecting: boolean;
  error: string | null;
  supportedWallets: WalletType[];
  connectWallet: (type: WalletType) => Promise<void>;
  disconnectWallet: () => void;
  switchNetwork: (chainId: number) => Promise<void>;
  isMetaMaskInstalled: () => boolean;
  signMessage: (message: string) => Promise<string>;
  sendTransaction: (transaction: Web3Transaction) => Promise<string>;
  refreshBalance: () => Promise<void>;
}

// WalletConnect configuration
const walletConnectConfig = {
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'your-project-id',
  metadata: {
    name: 'CoinDaily Africa',
    description: 'African cryptocurrency news platform',
    url: 'https://coindaily.africa',
    icons: ['https://coindaily.africa/icon-192x192.png']
  }
};

export const useWallet = (): UseWalletReturn => {
  const [walletState, setWalletState] = useState<WalletConnectionState>({
    wallet: null,
    isConnecting: false,
    error: null,
    supportedWallets: [WalletType.METAMASK, WalletType.WALLET_CONNECT, WalletType.COINBASE, WalletType.TRUST_WALLET]
  });

  const [walletConnectClient, setWalletConnectClient] = useState<InstanceType<typeof SignClient> | null>(null);
  const [walletConnectModal, setWalletConnectModal] = useState<WalletConnectModal | null>(null);

  // Initialize WalletConnect client
  useEffect(() => {
    const initWalletConnect = async () => {
      try {
        const client = await SignClient.init({
          projectId: walletConnectConfig.projectId,
          metadata: walletConnectConfig.metadata
        });

        const modal = new WalletConnectModal({
          projectId: walletConnectConfig.projectId,
          chains: ['eip155:1', 'eip155:137', 'eip155:56'] // Ethereum, Polygon, BSC
        });

        setWalletConnectClient(client);
        setWalletConnectModal(modal);
      } catch (error) {
        console.error('Failed to initialize WalletConnect:', error);
      }
    };

    if (typeof window !== 'undefined') {
      initWalletConnect();
    }
  }, []);

  const isMetaMaskInstalled = useCallback((): boolean => {
    if (typeof window === 'undefined') return false;
    return !!(window as any).ethereum?.isMetaMask;
  }, []);

  const refreshBalance = useCallback(async () => {
    if (!walletState.wallet) return;

    try {
      const balance = await getBalance(walletState.wallet.address, walletState.wallet.chainId);
      setWalletState(prev => ({
        ...prev,
        wallet: prev.wallet ? { ...prev.wallet, balance } : null
      }));
    } catch (error) {
      console.error('Failed to refresh balance:', error);
    }
  }, [walletState.wallet]);

  const connectMetaMask = useCallback(async () => {
    if (!isMetaMaskInstalled()) {
      throw new Error('Please install MetaMask to connect your wallet');
    }

    try {
      // Request account access
      const accounts = await (window as any).ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const address = accounts[0];
      
      // Get chain ID
      const chainId = await (window as any).ethereum.request({
        method: 'eth_chainId'
      });

      const chainIdNumber = parseInt(chainId, 16);
      
      // Get balance
      const balance = await getBalance(address, chainIdNumber);
      
      // Get ENS name and avatar
      const ensName = await getENSName(address);
      const avatar = ensName ? await getENSAvatar(ensName) : null;

      const wallet: WalletConnection = {
        type: WalletType.METAMASK,
        address,
        chainId: chainIdNumber,
        balance,
        isConnected: true,
        provider: (window as any).ethereum,
        ...(ensName && { ensName }),
        ...(avatar && { avatar })
      };

      setWalletState(prev => ({
        ...prev,
        wallet,
        isConnecting: false,
        error: null
      }));

      // Listen for account changes
      (window as any).ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          // Refresh connection with new account
          connectMetaMask();
        }
      });

      // Listen for chain changes
      (window as any).ethereum.on('chainChanged', (chainId: string) => {
        const newChainId = parseInt(chainId, 16);
        setWalletState(prev => ({
          ...prev,
          wallet: prev.wallet ? { ...prev.wallet, chainId: newChainId } : null
        }));
        refreshBalance();
      });

    } catch (error) {
      throw error;
    }
  }, [isMetaMaskInstalled, refreshBalance]);

  const connectWalletConnect = useCallback(async () => {
    if (!walletConnectClient || !walletConnectModal) {
      throw new Error('WalletConnect not initialized');
    }

    try {
      const { uri, approval } = await walletConnectClient.connect({
        requiredNamespaces: {
          eip155: {
            methods: [
              'eth_sendTransaction',
              'eth_signTransaction', 
              'eth_sign',
              'personal_sign',
              'eth_signTypedData'
            ],
            chains: ['eip155:1', 'eip155:137', 'eip155:56'], // Ethereum, Polygon, BSC
            events: ['accountsChanged', 'chainChanged']
          }
        }
      });

      if (uri) {
        await walletConnectModal.openModal({ uri });
      }

      const session = await approval();
      walletConnectModal.closeModal();

      // Get account info from session
      const accounts = Object.values(session.namespaces)
        .map((namespace: any) => namespace.accounts)
        .flat();

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const account = accounts[0];
      const [chain, , address] = account.split(':');
      const chainId = parseInt(chain.split('eip155:')[1]);

      // Get balance
      const balance = await getBalance(address, chainId);

      const wallet: WalletConnection = {
        type: WalletType.WALLET_CONNECT,
        address,
        chainId,
        balance,
        isConnected: true,
        provider: walletConnectClient
      };

      setWalletState(prev => ({
        ...prev,
        wallet,
        isConnecting: false,
        error: null
      }));

    } catch (error) {
      walletConnectModal?.closeModal();
      throw error;
    }
  }, [walletConnectClient, walletConnectModal]);

  const connectWallet = useCallback(async (type: WalletType) => {
    setWalletState(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      switch (type) {
        case WalletType.METAMASK:
          await connectMetaMask();
          break;
        
        case WalletType.WALLET_CONNECT:
          await connectWalletConnect();
          break;
          
        case WalletType.COINBASE:
          throw new Error('Coinbase Wallet integration coming soon');
          
        case WalletType.TRUST_WALLET:
          throw new Error('Trust Wallet integration coming soon');
          
        default:
          throw new Error(`Wallet type ${type} not supported`);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect wallet';
      setWalletState(prev => ({
        ...prev,
        wallet: null,
        isConnecting: false,
        error: errorMessage
      }));
    }
  }, [connectMetaMask, connectWalletConnect]);

  const disconnectWallet = useCallback(() => {
    // Disconnect WalletConnect session if active
    if (walletState.wallet?.type === WalletType.WALLET_CONNECT && walletConnectClient) {
      const sessions = walletConnectClient.session.getAll();
      sessions.forEach((session: SessionTypes.Struct) => {
        walletConnectClient.disconnect({
          topic: session.topic,
          reason: {
            code: 6000,
            message: 'User disconnected'
          }
        });
      });
    }

    setWalletState(prev => ({
      ...prev,
      wallet: null,
      isConnecting: false,
      error: null
    }));
  }, [walletState.wallet, walletConnectClient]);

  const switchNetworkHandler = useCallback(async (chainId: number) => {
    if (!walletState.wallet) {
      throw new Error('No wallet connected');
    }

    try {
      if (walletState.wallet.type === WalletType.METAMASK) {
        await switchNetwork(chainId);
        setWalletState(prev => ({
          ...prev,
          wallet: prev.wallet ? { ...prev.wallet, chainId } : null
        }));
        await refreshBalance();
      } else {
        throw new Error('Network switching not supported for this wallet');
      }
    } catch (error) {
      throw error;
    }
  }, [walletState.wallet, refreshBalance]);

  const signMessageHandler = useCallback(async (message: string): Promise<string> => {
    if (!walletState.wallet) {
      throw new Error('No wallet connected');
    }

    try {
      if (walletState.wallet.type === WalletType.METAMASK) {
        return await signMessage(message, walletState.wallet.address);
      } else if (walletState.wallet.type === WalletType.WALLET_CONNECT && walletConnectClient) {
        const sessions = walletConnectClient.session.getAll();
        if (sessions.length === 0) {
          throw new Error('No active WalletConnect session');
        }

        const session = sessions[0];
        if (!session) {
          throw new Error('No active WalletConnect session');
        }

        const result = await walletConnectClient.request({
          topic: session.topic,
          chainId: `eip155:${walletState.wallet.chainId}`,
          request: {
            method: 'personal_sign',
            params: [message, walletState.wallet.address]
          }
        });

        return result as string;
      } else {
        throw new Error('Message signing not supported for this wallet');
      }
    } catch (error) {
      throw error;
    }
  }, [walletState.wallet, walletConnectClient]);

  const sendTransactionHandler = useCallback(async (transaction: Web3Transaction): Promise<string> => {
    if (!walletState.wallet) {
      throw new Error('No wallet connected');
    }

    try {
      if (walletState.wallet.type === WalletType.METAMASK) {
        return await sendTransaction(transaction, walletState.wallet.address);
      } else if (walletState.wallet.type === WalletType.WALLET_CONNECT && walletConnectClient) {
        const sessions = walletConnectClient.session.getAll();
        if (sessions.length === 0) {
          throw new Error('No active WalletConnect session');
        }

        const session = sessions[0];
        if (!session) {
          throw new Error('No active WalletConnect session');
        }

        const result = await walletConnectClient.request({
          topic: session.topic,
          chainId: `eip155:${walletState.wallet.chainId}`,
          request: {
            method: 'eth_sendTransaction',
            params: [
              {
                from: walletState.wallet.address,
                to: transaction.to,
                value: transaction.value ? `0x${parseInt(transaction.value).toString(16)}` : '0x0',
                data: transaction.data || '0x'
              }
            ]
          }
        });

        return result as string;
      } else {
        throw new Error('Transaction sending not supported for this wallet');
      }
    } catch (error) {
      throw error;
    }
  }, [walletState.wallet, walletConnectClient]);

  return {
    wallet: walletState.wallet,
    isConnecting: walletState.isConnecting,
    error: walletState.error,
    supportedWallets: walletState.supportedWallets,
    connectWallet,
    disconnectWallet,
    switchNetwork: switchNetworkHandler,
    isMetaMaskInstalled,
    signMessage: signMessageHandler,
    sendTransaction: sendTransactionHandler,
    refreshBalance
  };
};