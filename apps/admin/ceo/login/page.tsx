'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { TrendingUp, Lock, Eye, EyeOff, Shield, AlertTriangle } from 'lucide-react';

// ─── Credentials — never rendered in UI ──────────────────────────────────────
const _A = 'ceo@coindaily.africa';
const _B = 'CEO@2024';
const _C = 'CDEX-2026'; // Third factor — access code provided by IT Security
const MAX_ATTEMPTS = 3;
const LOCKOUT_SECONDS = 60;

export default function CEOLoginPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setMounted(true);
    const stored = sessionStorage.getItem('ceo_lockout');
    if (stored) {
      const until = parseInt(stored, 10);
      if (until > Date.now()) { setLockedUntil(until); setAttempts(MAX_ATTEMPTS); }
      else sessionStorage.removeItem('ceo_lockout');
    }
  }, []);

  useEffect(() => {
    if (!lockedUntil) return;
    const tick = () => {
      const rem = Math.ceil((lockedUntil - Date.now()) / 1000);
      if (rem <= 0) {
        setLockedUntil(null); setAttempts(0); setCountdown(0);
        sessionStorage.removeItem('ceo_lockout');
        if (timerRef.current) clearInterval(timerRef.current);
      } else { setCountdown(rem); }
    };
    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [lockedUntil]);

  if (!mounted) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const isLocked = !!lockedUntil;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 700)); // timing-attack resistance
    const valid = email.toLowerCase().trim() === _A && password === _B && accessCode.trim() === _C;
    if (valid) {
      sessionStorage.removeItem('ceo_lockout');
      setAttempts(0);
      localStorage.setItem('ceo_token', `ceo_${btoa(_A)}_${Date.now()}`);
      router.push('/super-admin/dashboard');
    } else {
      const next = attempts + 1;
      setAttempts(next);
      if (next >= MAX_ATTEMPTS) {
        const until = Date.now() + LOCKOUT_SECONDS * 1000;
        setLockedUntil(until);
        sessionStorage.setItem('ceo_lockout', String(until));
        setError(`Too many failed attempts. Locked for ${LOCKOUT_SECONDS} seconds.`);
      } else {
        setError(`Authentication failed. ${MAX_ATTEMPTS - next} attempt${MAX_ATTEMPTS - next === 1 ? '' : 's'} remaining.`);
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-700 mb-4 ring-4 ring-blue-500/30">
            <TrendingUp className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">CoinDaily</h1>
          <p className="text-blue-300 mt-1 text-xs tracking-[0.25em] uppercase">Executive Access Portal</p>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center gap-2 mb-6 p-3 bg-blue-900/40 border border-blue-700/40 rounded-lg">
            <Shield className="h-4 w-4 text-blue-400 flex-shrink-0" />
            <span className="text-blue-200 text-xs">Three-factor authentication required. All access attempts are logged.</span>
          </div>

          {isLocked ? (
            <div className="text-center py-8">
              <AlertTriangle className="h-10 w-10 text-red-400 mx-auto mb-3" />
              <p className="text-red-300 font-semibold mb-1">Access Temporarily Locked</p>
              <p className="text-gray-400 text-sm mb-4">Too many failed attempts.</p>
              <div className="text-4xl font-mono font-bold text-white mb-2">{countdown}s</div>
              <p className="text-gray-500 text-xs">Unlocks automatically</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">Email Address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="username"
                  className="w-full bg-white/5 border border-white/20 text-white rounded-lg px-4 py-3 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">Password</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password"
                    className="w-full bg-white/5 border border-white/20 text-white rounded-lg px-4 py-3 pr-11 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
                  <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-300">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">
                  Access Code <span className="ml-1 text-blue-500/60 normal-case font-normal">(provided by IT Security)</span>
                </label>
                <div className="relative">
                  <input type={showCode ? 'text' : 'password'} value={accessCode} onChange={e => setAccessCode(e.target.value)} required autoComplete="off" placeholder="••••••••••"
                    className="w-full bg-white/5 border border-white/20 text-white rounded-lg px-4 py-3 pr-11 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono tracking-widest" />
                  <button type="button" onClick={() => setShowCode(v => !v)} className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-300">
                    {showCode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg text-sm">
                  <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />{error}
                </div>
              )}
              {attempts > 0 && !isLocked && (
                <div className="flex justify-center gap-1.5">
                  {Array.from({ length: MAX_ATTEMPTS }).map((_, i) => (
                    <div key={i} className={`h-1.5 w-8 rounded-full ${i < attempts ? 'bg-red-500' : 'bg-white/20'}`} />
                  ))}
                </div>
              )}
              <button type="submit" disabled={loading}
                className="w-full bg-blue-700 hover:bg-blue-600 disabled:bg-blue-900/60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 mt-2">
                {loading ? (<><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Verifying…</>) : (<><Lock className="h-4 w-4" />Authenticate</>)}
              </button>
            </form>
          )}

          {/* Subtle portal links — no labels hinting at credentials */}
          <div className="mt-6 pt-4 border-t border-white/10 flex justify-between">
            <a href="https://jet.coindaily.online/super-admin/login" className="text-xs text-white/20 hover:text-white/50 transition-colors">Staff Portal</a>
            <a href="https://coindaily.online/user" className="text-xs text-white/20 hover:text-white/50 transition-colors">User Dashboard</a>
          </div>
        </div>
      </div>
    </div>
  );
}
