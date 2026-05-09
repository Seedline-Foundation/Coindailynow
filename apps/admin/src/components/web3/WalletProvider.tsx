'use client';

import React, { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';

/* ── Types ─────────────────────────────────────────────────────────── */
type WalletState = {
  address: string | null;
  chainId: number | null;
  connected: boolean;
  balance: string | null;
  connecting: boolean;
  error: string | null;
};

type WalletContextType = WalletState & {
  connect: () => Promise<void>;
  disconnect: () => void;
  switchChain: (chainId: number) => Promise<void>;
  shortAddress: string;
};

const initialState: WalletState = {
  address: null,
  chainId: null,
  connected: false,
  balance: null,
  connecting: false,
  error: null,
};

const WalletContext = createContext<WalletContextType>({
  ...initialState,
  connect: async () => {},
  disconnect: () => {},
  switchChain: async () => {},
  shortAddress: '',
});

export const useWallet = () => useContext(WalletContext);

/* ── Chain metadata ───────────────────────────────────────────────── */
export const CHAINS: Record<number, { name: string; symbol: string; rpc: string; explorer: string }> = {
  1:   { name: 'Ethereum', symbol: 'ETH', rpc: 'https://eth.llamarpc.com', explorer: 'https://etherscan.io' },
  137: { name: 'Polygon', symbol: 'MATIC', rpc: 'https://polygon-rpc.com', explorer: 'https://polygonscan.com' },
  56:  { name: 'BNB Chain', symbol: 'BNB', rpc: 'https://bsc-dataseed1.binance.org', explorer: 'https://bscscan.com' },
};

/* ── Provider ─────────────────────────────────────────────────────── */
export function WalletProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WalletState>(initialState);

  /* ── Restore persisted connection ─────────────────────────────── */
  useEffect(() => {
    if (typeof window === 'undefined' || !window.ethereum) return;
    (async () => {
      try {
        const accounts: string[] = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts?.[0]) {
          const chainHex: string = await window.ethereum.request({ method: 'eth_chainId' });
          setState(s => ({
            ...s,
            address: accounts[0].toLowerCase(),
            chainId: parseInt(chainHex, 16),
            connected: true,
          }));
        }
      } catch { /* not connected */ }
    })();
  }, []);

  /* ── Listen for account & chain changes ───────────────────────── */
  useEffect(() => {
    if (typeof window === 'undefined' || !window.ethereum) return;
    const onAccounts = (accs: string[]) => {
      if (!accs.length) { setState(initialState); return; }
      setState(s => ({ ...s, address: accs[0].toLowerCase(), connected: true }));
    };
    const onChain = (hex: string) => setState(s => ({ ...s, chainId: parseInt(hex, 16) }));

    window.ethereum.on('accountsChanged', onAccounts);
    window.ethereum.on('chainChanged', onChain);
    return () => {
      window.ethereum?.removeListener('accountsChanged', onAccounts);
      window.ethereum?.removeListener('chainChanged', onChain);
    };
  }, []);

  /* ── Connect ─────────────────────────────────────────────────── */
  const connect = useCallback(async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      setState(s => ({ ...s, error: 'No wallet detected. Install MetaMask.' }));
      return;
    }
    setState(s => ({ ...s, connecting: true, error: null }));
    try {
      const accounts: string[] = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const chainHex: string = await window.ethereum.request({ method: 'eth_chainId' });
      setState({
        address: accounts[0].toLowerCase(),
        chainId: parseInt(chainHex, 16),
        connected: true,
        balance: null,
        connecting: false,
        error: null,
      });
    } catch (err: any) {
      setState(s => ({ ...s, connecting: false, error: err?.message || 'Connection rejected' }));
    }
  }, []);

  /* ── Disconnect ──────────────────────────────────────────────── */
  const disconnect = useCallback(() => { setState(initialState); }, []);

  /* ── Switch chain ────────────────────────────────────────────── */
  const switchChain = useCallback(async (chainId: number) => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: `0x${chainId.toString(16)}` }] });
    } catch (err: any) {
      // 4902 => chain not added
      if (err.code === 4902) {
        const chain = CHAINS[chainId];
        if (!chain) return;
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: `0x${chainId.toString(16)}`,
            chainName: chain.name,
            nativeCurrency: { name: chain.symbol, symbol: chain.symbol, decimals: 18 },
            rpcUrls: [chain.rpc],
            blockExplorerUrls: [chain.explorer],
          }],
        });
      }
    }
  }, []);

  const shortAddress = state.address ? `${state.address.slice(0, 6)}...${state.address.slice(-4)}` : '';

  return (
    <WalletContext.Provider value={{ ...state, connect, disconnect, switchChain, shortAddress }}>
      {children}
    </WalletContext.Provider>
  );
}

/* ── Connect Button Component ─────────────────────────────────────── */
export function WalletConnectButton({ className = '' }: { className?: string }) {
  const { connected, connecting, connect, disconnect, shortAddress, chainId, error } = useWallet();
  const chainName = chainId ? CHAINS[chainId]?.name || `Chain ${chainId}` : '';

  if (connected) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span className="px-3 py-1.5 bg-green-500/10 text-green-600 dark:text-green-400 rounded-lg text-sm font-medium flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          {shortAddress}
        </span>
        {chainName && <span className="text-xs text-gray-500">{chainName}</span>}
        <button onClick={disconnect} className="text-xs text-gray-400 hover:text-red-400 transition">Disconnect</button>
      </div>
    );
  }

  return (
    <div className={className}>
      <button onClick={connect} disabled={connecting}
        className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition flex items-center gap-2">
        {connecting ? (
          <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Connecting...</>
        ) : (
          <>🦊 Connect Wallet</>
        )}
      </button>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
