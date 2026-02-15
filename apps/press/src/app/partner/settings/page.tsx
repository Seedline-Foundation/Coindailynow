'use client';

import { useState, useEffect } from 'react';
import {
  Settings,
  Globe,
  Wallet,
  Bell,
  Shield,
  Save,
  Key,
  Copy,
  CheckCircle,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { fetchPartnerSite } from '@/lib/api';
import { supabase } from '@/lib/supabase';

/**
 * Partner Settings Page - press.coindaily.online/partner/settings
 *
 * Configure site details, wallet address, notification preferences,
 * SDK integration keys, and webhook endpoints.
 */

export default function PartnerSettingsPage() {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [siteData, setSiteData] = useState({ domain: '', siteName: '', ownerEmail: '', contactName: '', walletAddress: '', siteId: '' });

  useEffect(() => {
    if (!user?.email) return;
    fetchPartnerSite(user.email).then(site => {
      if (site) {
        setSiteData({
          domain: site.domain || '',
          siteName: site.owner_name || site.domain?.split('.')[0] || '',
          ownerEmail: site.owner_email || user.email || '',
          contactName: site.owner_name || '',
          walletAddress: site.wallet_address || '',
          siteId: site.id || '',
        });
      }
    }).catch(console.error);
  }, [user?.email]);

  const handleSave = async () => {
    if (!siteData.siteId) return;
    setSaving(true);
    try {
      await supabase.from('press_sites').update({
        owner_name: siteData.contactName || siteData.siteName,
        owner_email: siteData.ownerEmail,
        wallet_address: siteData.walletAddress,
      }).eq('id', siteData.siteId);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-white mb-1">Settings</h1>
          <p className="text-dark-400">Configure your partner site settings and integrations.</p>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-dark-950 font-semibold rounded-lg transition-colors"
        >
          {saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      <div className="space-y-6 max-w-3xl">
        {/* Site Details */}
        <SettingsSection icon={Globe} title="Site Details">
          <FormField label="Domain" value={siteData.domain} disabled />
          <FormField label="Site Name" value={siteData.siteName} onChange={(e: any) => setSiteData(p => ({ ...p, siteName: e.target.value }))} />
          <FormField label="Owner Email" value={siteData.ownerEmail} onChange={(e: any) => setSiteData(p => ({ ...p, ownerEmail: e.target.value }))} type="email" />
          <FormField label="Contact Name" value={siteData.contactName} onChange={(e: any) => setSiteData(p => ({ ...p, contactName: e.target.value }))} />
        </SettingsSection>

        {/* Wallet */}
        <SettingsSection icon={Wallet} title="Wallet & Payments">
          <FormField
            label="Polygon Wallet Address"
            value={siteData.walletAddress}
            onChange={(e: any) => setSiteData(p => ({ ...p, walletAddress: e.target.value }))}
            placeholder="0x..."
            helpText="JOY tokens will be sent to this address when escrow is released."
          />
          <div className="pt-2">
            <p className="text-dark-400 text-sm">
              Earnings are released automatically after AI verification confirms PR placement.
              Funds are held in the CreditsEscrow contract until verification completes.
            </p>
          </div>
        </SettingsSection>

        {/* SDK Integration */}
        <SettingsSection icon={Key} title="SDK Integration">
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-dark-300 mb-1">Site ID</label>
              <CopyField value={siteData.siteId} />
            </div>
            <div>
              <label className="block text-sm text-dark-300 mb-1">Site Secret</label>
              <CopyField value="sk_live_*****************************" masked />
            </div>
            <div>
              <label className="block text-sm text-dark-300 mb-1">SDK Script Tag</label>
              <div className="bg-dark-800 border border-dark-700 rounded-lg p-3 font-mono text-xs text-dark-300 break-all">
                {`<script src="https://cdn.sendpress.io/sdk/v1/sendpress.min.js" data-site="${siteData.siteId || 'YOUR_SITE_ID'}"></script>`}
              </div>
            </div>
          </div>
        </SettingsSection>

        {/* Notifications */}
        <SettingsSection icon={Bell} title="Notifications">
          <FormField
            label="Webhook URL"
            defaultValue="https://cryptoafrica.news/wp-json/sendpress/v1/webhook"
            placeholder="https://your-site.com/webhook"
            helpText="Receive PR distribution and payment events via webhook."
          />
          <div className="flex items-center gap-3 pt-2">
            <input type="checkbox" id="email-notif" defaultChecked className="rounded border-dark-600" />
            <label htmlFor="email-notif" className="text-sm text-dark-300">Email notifications for new PR distributions</label>
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" id="payment-notif" defaultChecked className="rounded border-dark-600" />
            <label htmlFor="payment-notif" className="text-sm text-dark-300">Email notifications for payments released</label>
          </div>
        </SettingsSection>

        {/* Danger Zone */}
        <SettingsSection icon={Shield} title="Account">
          <div className="pt-2">
            <p className="text-dark-400 text-sm mb-4">
              Deactivating your site will stop all PR distributions and pending payments.
            </p>
            <button className="px-4 py-2 border border-red-500/50 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors text-sm">
              Deactivate Site
            </button>
          </div>
        </SettingsSection>
      </div>
    </>
  );
}

function SettingsSection({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-dark-900 border border-dark-700 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <Icon className="w-5 h-5 text-primary-500" />
        <h2 className="text-lg font-semibold text-white">{title}</h2>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function FormField({ label, helpText, disabled, ...props }: {
  label: string; helpText?: string; disabled?: boolean;
  [key: string]: any;
}) {
  return (
    <div>
      <label className="block text-sm text-dark-300 mb-1">{label}</label>
      <input
        className={`w-full px-3 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 ${
          disabled ? 'opacity-60 cursor-not-allowed' : ''
        }`}
        disabled={disabled}
        {...props}
      />
      {helpText && <p className="text-dark-500 text-xs mt-1">{helpText}</p>}
    </div>
  );
}

function CopyField({ value, masked }: { value: string; masked?: boolean }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="text"
        value={masked ? value : value}
        readOnly
        className="flex-1 px-3 py-2 bg-dark-800 border border-dark-700 rounded-lg text-dark-300 font-mono text-sm"
      />
      <button
        onClick={copy}
        className="p-2 border border-dark-600 hover:border-primary-500 rounded-lg text-dark-400 hover:text-white transition-colors"
        title="Copy"
      >
        {copied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
      </button>
    </div>
  );
}
