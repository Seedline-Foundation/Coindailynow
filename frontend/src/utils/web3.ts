/**
 * Web3 Utilities
 * Task 20: Real Web3 Integration Implementation
 * 
 * Utilities for blockchain interactions, balance fetching, and transaction signing
 */

import { ethers } from 'ethers';
import { NetworkInfo } from '../types/auth';

// Extend Window interface for ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}

// Network configurations for African and global markets
export const SUPPORTED_NETWORKS: Record<number, NetworkInfo> = {
  // Ethereum Mainnet
  1: {
    chainId: 1,
    chainName: 'Ethereum Mainnet',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    },
    rpcUrls: ['https://mainnet.infura.io/v3/YOUR_INFURA_KEY'],
    blockExplorerUrls: ['https://etherscan.io']
  },
  // Polygon (Popular in Africa for low fees)
  137: {
    chainId: 137,
    chainName: 'Polygon',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18
    },
    rpcUrls: ['https://polygon-rpc.com/'],
    blockExplorerUrls: ['https://polygonscan.com/']
  },
  // Binance Smart Chain (Popular in Africa)
  56: {
    chainId: 56,
    chainName: 'BNB Smart Chain',
    nativeCurrency: {
      name: 'BNB',
      symbol: 'BNB',
      decimals: 18
    },
    rpcUrls: ['https://bsc-dataseed1.binance.org/'],
    blockExplorerUrls: ['https://bscscan.com/']
  }
};

/**
 * Get provider for blockchain interactions
 */
export const getProvider = (chainId: number = 1): ethers.providers.Provider => {
  const network = SUPPORTED_NETWORKS[chainId];
  if (!network) {
    throw new Error(`Unsupported network: ${chainId}`);
  }
  
  return new ethers.providers.JsonRpcProvider(network.rpcUrls[0]);
};

/**
 * Get balance for an address
 */
export const getBalance = async (
  address: string,
  chainId: number = 1
): Promise<string> => {
  try {
    const provider = getProvider(chainId);
    const balance = await provider.getBalance(address);
    return ethers.utils.formatEther(balance);
  } catch (error) {
    console.error('Error fetching balance:', error);
    return '0.0';
  }
};

/**
 * Get ENS name for an address
 */
export const getENSName = async (address: string): Promise<string | null> => {
  try {
    const provider = getProvider(1); // ENS only on mainnet
    const ensName = await provider.lookupAddress(address);
    return ensName;
  } catch (error) {
    console.error('Error fetching ENS name:', error);
    return null;
  }
};

/**
 * Get ENS avatar for an address
 */
export const getENSAvatar = async (ensName: string): Promise<string | null> => {
  try {
    // ENS avatar functionality is not available in ethers v5
    // Return null for now - can be implemented with a resolver contract call
    return null;
  } catch (error) {
    console.error('Error fetching ENS avatar:', error);
    return null;
  }
};

/**
 * Format address for display
 */
export const formatAddress = (address: string, chars: number = 4): string => {
  if (!address) return '';
  return `${address.substring(0, chars + 2)}...${address.substring(address.length - chars)}`;
};

/**
 * Validate Ethereum address
 */
export const isValidAddress = (address: string): boolean => {
  try {
    return ethers.utils.isAddress(address);
  } catch {
    return false;
  }
};

/**
 * Convert Wei to Ether
 */
export const weiToEther = (wei: string): string => {
  try {
    return ethers.utils.formatEther(wei);
  } catch {
    return '0.0';
  }
};

/**
 * Convert Ether to Wei
 */
export const etherToWei = (ether: string): string => {
  try {
    return ethers.utils.parseEther(ether).toString();
  } catch {
    return '0';
  }
};

/**
 * Get transaction receipt
 */
export const getTransactionReceipt = async (
  txHash: string,
  chainId: number = 1
): Promise<ethers.providers.TransactionReceipt | null> => {
  try {
    const provider = getProvider(chainId);
    return await provider.getTransactionReceipt(txHash);
  } catch (error) {
    console.error('Error fetching transaction receipt:', error);
    return null;
  }
};

/**
 * Switch network in MetaMask
 */
export const switchNetwork = async (chainId: number): Promise<void> => {
  if (!window.ethereum) {
    throw new Error('MetaMask not installed');
  }

  const network = SUPPORTED_NETWORKS[chainId];
  if (!network) {
    throw new Error(`Unsupported network: ${chainId}`);
  }

  try {
    // Try to switch to the network
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${chainId.toString(16)}` }],
    });
  } catch (switchError: any) {
    // If network doesn't exist, add it
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: `0x${chainId.toString(16)}`,
              chainName: network.chainName,
              nativeCurrency: network.nativeCurrency,
              rpcUrls: network.rpcUrls,
              blockExplorerUrls: network.blockExplorerUrls,
            },
          ],
        });
      } catch (addError) {
        throw new Error('Failed to add network');
      }
    } else {
      throw switchError;
    }
  }
};

/**
 * Sign message with wallet
 */
export const signMessage = async (
  message: string,
  address: string
): Promise<string> => {
  if (!window.ethereum) {
    throw new Error('Wallet not connected');
  }

  try {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner(address);
    return await signer.signMessage(message);
  } catch (error) {
    console.error('Error signing message:', error);
    throw new Error('Failed to sign message');
  }
};

/**
 * Send transaction
 */
export const sendTransaction = async (
  transaction: {
    to: string;
    value?: string;
    data?: string;
  },
  address: string
): Promise<string> => {
  if (!window.ethereum) {
    throw new Error('Wallet not connected');
  }

  try {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner(address);
    
    const txRequest: any = {
      to: transaction.to,
      value: transaction.value ? ethers.utils.parseEther(transaction.value) : undefined,
    };

    if (transaction.data) {
      txRequest.data = transaction.data;
    }

    const tx = await signer.sendTransaction(txRequest);
    
    return tx.hash;
  } catch (error) {
    console.error('Error sending transaction:', error);
    throw new Error('Failed to send transaction');
  }
};

/**
 * African-specific network utilities
 */
export const AFRICAN_PREFERRED_NETWORKS = [137, 56]; // Polygon and BSC for low fees

export const getAfricanFriendlyNetwork = (): NetworkInfo => {
  // Default to Polygon for African users (low fees)
  return SUPPORTED_NETWORKS[137] || SUPPORTED_NETWORKS[1]!; // Fallback to Ethereum
};

/**
 * Estimate gas price for African networks
 */
export const getGasPrice = async (chainId: number): Promise<string> => {
  try {
    const provider = getProvider(chainId);
    const gasPrice = await provider.getGasPrice();
    return ethers.utils.formatUnits(gasPrice, 'gwei');
  } catch (error) {
    console.error('Error fetching gas price:', error);
    return '0';
  }
};