'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Megaphone, Eye, EyeOff, ArrowRight, Globe, Rocket, Wallet, Loader2, CheckCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function RegisterPage() {
  const router = useRouter();
  const { signUp, connectWallet: setWallet } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [accountType, setAccountType] = useState<'publisher' | 'partner'>('publisher');
  const [form, setForm] = useState({ name: '', email: '', password: '', website: '' });
  const [loading, setLoading] = useState(false);
  const [walletConnecting, setWalletConnecting] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await signUp(form.email, form.password, {
      name: form.name,
      account_type: accountType,
      website: form.website,
      wallet_address: walletAddress,
    });

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setLoading(false);
    // Redirect based on account type
    if (accountType === 'partner') {
      router.push('/partner');
    } else {
      router.push('/dashboard');
    }
  };

  const connectWallet = async () => {
    setWalletConnecting(true);
    try {
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
        if (accounts && accounts.length > 0) {
          setWalletAddress(accounts[0]);
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
          setWallet(accounts[0]);
          localStorage.setItem('sendpress_wallet', accounts[0]);
          router.push(accountType === 'partner' ? '/partner' : '/dashboard');
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

      {/* Register Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-lg">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-display font-bold text-white mb-2">Create Your Account</h1>
            <p className="text-dark-400">Join the SENDPRESS network — start distributing or earning today</p>
          </div>

          {/* Account Type Toggle */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={() => setAccountType('publisher')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-semibold text-sm transition-all border ${
                accountType === 'publisher'
                  ? 'bg-primary-500/10 border-primary-500/40 text-primary-400'
                  : 'border-dark-700 text-dark-400 hover:border-dark-500'
              }`}
            >
              <Rocket className="w-4 h-4" />
              I want to distribute PR
            </button>
            <button
              onClick={() => setAccountType('partner')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-semibold text-sm transition-all border ${
                accountType === 'partner'
                  ? 'bg-green-500/10 border-green-500/40 text-green-400'
                  : 'border-dark-700 text-dark-400 hover:border-dark-500'
              }`}
            >
              <Globe className="w-4 h-4" />
              I own a website
            </button>
          </div>

          <form onSubmit={handleSubmit} className="bg-dark-900 border border-dark-700 rounded-2xl p-8 space-y-5">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm text-dark-300 mb-1.5">
                {accountType === 'publisher' ? 'Full Name / Company' : 'Full Name'}
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder={accountType === 'publisher' ? 'Your company name' : 'Your full name'}
                required
                className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              />
            </div>

            <div>
              <label className="block text-sm text-dark-300 mb-1.5">Email Address</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              />
            </div>

            {accountType === 'partner' && (
              <div>
                <label className="block text-sm text-dark-300 mb-1.5">Website URL</label>
                <input
                  type="url"
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                  placeholder="https://your-site.com"
                  required
                  className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                />
                <p className="text-dark-500 text-xs mt-1">We&apos;ll review your site and assign a Domain Health (DH) score within 24 hours.</p>
              </div>
            )}

            <div>
              <label className="block text-sm text-dark-300 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Create a strong password"
                  required
                  minLength={8}
                  className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 pr-12"
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

            <label className="flex items-start gap-2 text-sm text-dark-400">
              <input type="checkbox" required className="rounded border-dark-600 mt-0.5" />
              <span>
                I agree to the{' '}
                <Link href="/terms" className="text-primary-500 hover:text-primary-400">Terms & Conditions</Link>
                {' '}and{' '}
                <Link href="/privacy" className="text-primary-500 hover:text-primary-400">Privacy Policy</Link>
              </span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className={`w-full flex items-center justify-center gap-2 px-6 py-3 font-bold rounded-lg transition-colors disabled:opacity-60 ${
                accountType === 'publisher'
                  ? 'bg-primary-500 hover:bg-primary-600 text-dark-950'
                  : 'bg-green-500 hover:bg-green-600 text-dark-950'
              }`}
            >
              {loading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Creating Account...</>
              ) : (
                <>{accountType === 'publisher' ? 'Create Publisher Account' : 'Submit Your Site'}<ArrowRight className="w-5 h-5" /></>
              )}
            </button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-dark-700" /></div>
              <div className="relative flex justify-center"><span className="px-3 bg-dark-900 text-dark-500 text-sm">or continue with</span></div>
            </div>

            <button
              type="button"
              onClick={connectWallet}
              disabled={walletConnecting}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 border border-purple-500/50 hover:border-purple-400 hover:bg-purple-500/10 text-white rounded-lg transition-colors disabled:opacity-60"
            >
              {walletConnecting ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Connecting...</>
              ) : walletAddress ? (
                <><CheckCircle className="w-5 h-5 text-green-500" /> Connected: {walletAddress.slice(0,6)}...{walletAddress.slice(-4)}</>
              ) : (
                <><Wallet className="w-5 h-5 text-purple-400" /> Connect Wallet (Polygon)</>
              )}
            </button>
          </form>

          <p className="text-center text-dark-400 text-sm mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-primary-500 hover:text-primary-400 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
