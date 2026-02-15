'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Megaphone, Eye, EyeOff, ArrowRight, Wallet, Loader2, CheckCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function LoginPage() {
  const router = useRouter();
  const { signIn, connectWallet } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [walletConnecting, setWalletConnecting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await signIn(email, password);
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setLoading(false);
    // Role-based redirect handled by checking user metadata
    const storedUser = localStorage.getItem('sendpress_user');
    try {
      const user = JSON.parse(storedUser || '{}');
      if (user.accountType === 'partner') {
        router.push('/partner');
      } else {
        router.push('/dashboard');
      }
    } catch {
      router.push('/dashboard');
    }
  };

  const handleWalletConnect = async () => {
    setWalletConnecting(true);
    try {
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
        if (accounts && accounts.length > 0) {
          // Switch to Polygon
          try {
            await (window as any).ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: '0x89' }],
            });
          } catch (switchError: any) {
            if (switchError.code === 4902) {
              await (window as any).ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: '0x89',
                  chainName: 'Polygon Mainnet',
                  rpcUrls: ['https://polygon-rpc.com/'],
                  nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
                  blockExplorerUrls: ['https://polygonscan.com/'],
                }],
              });
            }
          }
          // Store wallet in auth context
          connectWallet(accounts[0]);
          localStorage.setItem('sendpress_auth', 'true');
          localStorage.setItem('sendpress_wallet', accounts[0]);
          router.push('/dashboard');
        }
      } else {
        alert('Please install MetaMask or another Web3 wallet to connect. Visit https://metamask.io');
      }
    } catch (err) {
      console.error('Wallet connection failed:', err);
    } finally {
      setWalletConnecting(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col">
      {/* Header */}
      <header className="border-b border-dark-800">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center">
          <Link href="/" className="flex items-center gap-2">
            <Megaphone className="w-8 h-8 text-primary-500" />
            <span className="font-display font-bold text-xl text-white">SENDPRESS</span>
          </Link>
        </div>
      </header>

      {/* Login Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-display font-bold text-white mb-2">Welcome Back</h1>
            <p className="text-dark-400">Sign in to your SENDPRESS account</p>
          </div>

          <form onSubmit={handleSubmit} className="bg-dark-900 border border-dark-700 rounded-2xl p-8 space-y-5">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm text-dark-300 mb-1.5">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50"
              />
            </div>

            <div>
              <label className="block text-sm text-dark-300 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-500 hover:text-dark-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-dark-400">
                <input type="checkbox" className="rounded border-dark-600" />
                Remember me
              </label>
              <a href="#" className="text-primary-500 hover:text-primary-400">Forgot password?</a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-dark-950 font-bold rounded-lg transition-colors disabled:opacity-60"
            >
              {loading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Signing In...</>
              ) : (
                <>Sign In <ArrowRight className="w-5 h-5" /></>
              )}
            </button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-dark-700" /></div>
              <div className="relative flex justify-center"><span className="px-3 bg-dark-900 text-dark-500 text-sm">or continue with</span></div>
            </div>

            <button
              type="button"
              onClick={handleWalletConnect}
              disabled={walletConnecting}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 border border-purple-500/50 hover:border-purple-400 hover:bg-purple-500/10 text-white rounded-lg transition-colors disabled:opacity-60"
            >
              {walletConnecting ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Connecting...</>
              ) : (
                <><Wallet className="w-5 h-5 text-purple-400" /> Connect Wallet (Polygon)</>
              )}
            </button>
          </form>

          <p className="text-center text-dark-400 text-sm mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-primary-500 hover:text-primary-400 font-medium">
              Sign up for free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
