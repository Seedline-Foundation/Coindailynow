'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Settings,
  ArrowLeft,
  User,
  Bell,
  Shield,
  Wallet,
  Save,
  ExternalLink,
  Loader2,
  CheckCircle,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { fetchPublisherProfile } from '@/lib/api';
import { supabase } from '@/lib/supabase';

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const [tab, setTab] = useState<'profile' | 'notifications' | 'security' | 'wallet'>('profile');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [bio, setBio] = useState('');
  const [publisherId, setPublisherId] = useState('');

  useEffect(() => {
    setEmail(user?.email || '');
    setDisplayName(user?.company_name || '');
    if (user?.id) {
      fetchPublisherProfile(user.id).then(p => {
        if (p) {
          setPublisherId(p.id);
          setCompany(p.company_name || '');
          setDisplayName(p.company_name || user?.company_name || '');
        }
      }).catch(console.error);
    }
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (publisherId) {
        await supabase.from('press_publishers').update({
          company_name: company || displayName,
          contact_email: email,
        }).eq('id', publisherId);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { key: 'profile' as const, label: 'Profile', icon: User },
    { key: 'notifications' as const, label: 'Notifications', icon: Bell },
    { key: 'security' as const, label: 'Security', icon: Shield },
    { key: 'wallet' as const, label: 'Wallet', icon: Wallet },
  ];

  return (
    <div className="min-h-screen bg-dark-950">
      <header className="border-b border-dark-800 bg-dark-900">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-1.5 text-dark-400 hover:text-white text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <span className="text-dark-600">/</span>
          <span className="text-white font-semibold text-sm flex items-center gap-1.5"><Settings className="w-4 h-4 text-primary-500" /> Settings</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-white mb-6">Account Settings</h1>

        {/* Tab Navigation */}
        <div className="flex gap-1 border-b border-dark-800 mb-8">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                tab === t.key ? 'border-primary-500 text-primary-500' : 'border-transparent text-dark-400 hover:text-white'
              }`}
            >
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </div>

        {/* Profile */}
        {tab === 'profile' && (
          <div className="max-w-lg space-y-5">
            <div>
              <label className="block text-sm text-dark-400 mb-1.5">Display Name</label>
              <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-2.5 text-white text-sm focus:border-primary-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm text-dark-400 mb-1.5">Email Address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-2.5 text-white text-sm focus:border-primary-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm text-dark-400 mb-1.5">Company / Brand</label>
              <input type="text" value={company} onChange={e => setCompany(e.target.value)} placeholder="Your company name" className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-2.5 text-white text-sm placeholder-dark-500 focus:border-primary-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm text-dark-400 mb-1.5">Bio</label>
              <textarea rows={3} value={bio} onChange={e => setBio(e.target.value)} placeholder="Brief description..." className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-2.5 text-white text-sm placeholder-dark-500 focus:border-primary-500 focus:outline-none resize-none" />
            </div>
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-dark-950 font-semibold rounded-lg transition-colors text-sm disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Changes'}
            </button>
          </div>
        )}

        {/* Notifications */}
        {tab === 'notifications' && (
          <div className="max-w-lg space-y-4">
            {[
              { label: 'Campaign status updates', description: 'When a campaign starts, completes, or needs attention', defaultOn: true },
              { label: 'Escrow releases', description: 'When escrowed JOY tokens are released to partners', defaultOn: true },
              { label: 'New partner sites', description: 'When new high-quality sites join the network', defaultOn: false },
              { label: 'Weekly performance digest', description: 'Summary of impressions, CTR, and spend', defaultOn: true },
              { label: 'Marketing & tips', description: 'Best practices and platform updates', defaultOn: false },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between p-4 bg-dark-900 border border-dark-700 rounded-xl">
                <div>
                  <p className="text-white text-sm font-medium">{item.label}</p>
                  <p className="text-dark-500 text-xs mt-0.5">{item.description}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked={item.defaultOn} className="sr-only peer" />
                  <div className="w-10 h-5 bg-dark-700 peer-checked:bg-primary-500 rounded-full peer-focus:ring-2 peer-focus:ring-primary-500/30 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5" />
                </label>
              </div>
            ))}
          </div>
        )}

        {/* Security */}
        {tab === 'security' && (
          <div className="max-w-lg space-y-5">
            <div className="p-5 bg-dark-900 border border-dark-700 rounded-xl">
              <h3 className="text-white font-semibold mb-1">Change Password</h3>
              <p className="text-dark-500 text-xs mb-4">Update your account password</p>
              <div className="space-y-3">
                <input type="password" placeholder="Current password" className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-2.5 text-white text-sm placeholder-dark-500 focus:border-primary-500 focus:outline-none" />
                <input type="password" placeholder="New password" className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-2.5 text-white text-sm placeholder-dark-500 focus:border-primary-500 focus:outline-none" />
                <input type="password" placeholder="Confirm new password" className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-2.5 text-white text-sm placeholder-dark-500 focus:border-primary-500 focus:outline-none" />
              </div>
              <button className="mt-4 px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-dark-950 font-semibold rounded-lg transition-colors text-sm">
                Update Password
              </button>
            </div>
            <div className="p-5 bg-dark-900 border border-dark-700 rounded-xl">
              <h3 className="text-white font-semibold mb-1">Two-Factor Authentication</h3>
              <p className="text-dark-500 text-xs mb-3">Add an extra layer of security to your account</p>
              <button className="px-4 py-2 border border-primary-500 text-primary-500 hover:bg-primary-500/10 rounded-lg text-sm font-medium transition-colors">
                Enable 2FA
              </button>
            </div>
            <div className="p-5 bg-dark-900 border border-red-500/30 rounded-xl">
              <h3 className="text-red-500 font-semibold mb-1">Delete Account</h3>
              <p className="text-dark-500 text-xs mb-3">Permanently delete your account and all data. This action cannot be undone.</p>
              <button className="px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500/20 rounded-lg text-sm font-medium transition-colors">
                Delete Account
              </button>
            </div>
          </div>
        )}

        {/* Wallet */}
        {tab === 'wallet' && (
          <div className="max-w-lg space-y-5">
            <div className="p-5 bg-dark-900 border border-dark-700 rounded-xl">
              <h3 className="text-white font-semibold mb-1">Connected Wallet</h3>
              <p className="text-dark-500 text-xs mb-3">Your Polygon wallet for JOY token transactions</p>
              <div className="flex items-center gap-3 p-3 bg-dark-800 rounded-lg">
                <Wallet className="w-5 h-5 text-primary-500" />
                <span className="text-white text-sm font-mono">{user?.wallet_address ? user.wallet_address.slice(0,6) + '...' + user.wallet_address.slice(-4) : '0x4e2a...c8f1'}</span>
                <span className="ml-auto text-green-500 text-xs font-medium">Connected</span>
              </div>
            </div>
            <div className="p-5 bg-gradient-to-br from-primary-500/10 to-purple-500/10 border border-primary-500/30 rounded-xl">
              <h3 className="text-white font-semibold mb-1">Buy JOY Tokens</h3>
              <p className="text-dark-400 text-xs mb-3">Purchase JOY on ImaSwap DEX to fund your campaigns</p>
              <a
                href="https://imaswap.online"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-dark-950 font-semibold rounded-lg transition-colors text-sm"
              >
                Open ImaSwap DEX <ExternalLink className="w-4 h-4" />
              </a>
            </div>
            <div className="p-4 bg-dark-900 border border-dark-700 rounded-xl text-center">
              <p className="text-dark-500 text-sm">Need help? Join our <a href="https://discord.gg/coindaily" target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:text-primary-400">Discord community</a></p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
