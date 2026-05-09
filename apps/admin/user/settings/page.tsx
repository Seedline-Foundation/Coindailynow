'use client';

import { useEffect, useState, useRef } from 'react';
import { Settings, LogOut, Newspaper, Bell, Camera, Upload, User, Coins } from 'lucide-react';
import { fetchProfile, updateProfile } from '@/lib/userApi';
import {
  DASHBOARD_THEME_STORAGE_KEY,
  DashboardThemeId,
  dashboardThemes,
  getStoredDashboardThemeId,
} from '@/lib/dashboardThemes';

interface UserProfile {
  id: string;
  username: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  preferredLanguage: string | null;
  location: string | null;
  subscriptionTier?: string;
  createdAt?: string;
}

const LANGUAGES = [
  // Source
  { code: 'en', label: 'English 🇬🇧' },
  // West Africa
  { code: 'ha', label: 'Hausa 🇳🇬' },
  { code: 'yo', label: 'Yoruba 🇳🇬' },
  { code: 'ig', label: 'Igbo 🇳🇬' },
  { code: 'pcm', label: 'Pidgin (Naijá) 🇳🇬' },
  { code: 'wol', label: 'Wolof 🇸🇳' },
  // East Africa
  { code: 'sw', label: 'Swahili 🇰🇪' },
  { code: 'kin', label: 'Kinyarwanda 🇷🇼' },
  // Horn of Africa
  { code: 'am', label: 'Amharic 🇪🇹' },
  { code: 'so', label: 'Somali 🇸🇴' },
  { code: 'om', label: 'Oromo 🇪🇹' },
  // Southern Africa
  { code: 'zu', label: 'Zulu 🇿🇦' },
  { code: 'af', label: 'Afrikaans 🇿🇦' },
  { code: 'sn', label: 'Shona 🇿🇼' },
  // North Africa
  { code: 'ar', label: 'Arabic 🇪🇬' },
  // European / International
  { code: 'fr', label: 'French 🇫🇷' },
  { code: 'pt', label: 'Portuguese 🇵🇹' },
  { code: 'es', label: 'Spanish 🇪🇸' },
];

const COUNTRIES = [
  'Nigeria', 'Kenya', 'South Africa', 'Ghana', 'Tanzania',
  'Ethiopia', 'Egypt', 'Uganda', 'Cameroon', 'Rwanda',
  'Senegal', "C\u00f4te d'Ivoire", 'Zambia', 'Zimbabwe', 'Botswana',
];

const NEWS_CATEGORIES = [
  { id: 'bitcoin', label: 'Bitcoin & BTC News', emoji: '₿' },
  { id: 'ethereum', label: 'Ethereum & Altcoins', emoji: 'Ξ' },
  { id: 'defi', label: 'DeFi & Yield', emoji: '🏦' },
  { id: 'nft', label: 'NFTs & Digital Art', emoji: '🖼️' },
  { id: 'memecoin', label: 'Memecoins & Trending', emoji: '🐶' },
  { id: 'regulation', label: 'Regulation & Policy', emoji: '⚖️' },
  { id: 'africa', label: 'Africa Crypto & Adoption', emoji: '🌍' },
  { id: 'mobile-money', label: 'Mobile Money & Payments', emoji: '📱' },
  { id: 'mining', label: 'Mining & Staking', emoji: '⛏️' },
  { id: 'security', label: 'Security & Scam Alerts', emoji: '🛡️' },
  { id: 'education', label: 'Guides & Education', emoji: '📚' },
  { id: 'market-analysis', label: 'Market Analysis', emoji: '📊' },
  { id: 'exchanges', label: 'African Exchanges', emoji: '💹' },
  { id: 'startups', label: 'Blockchain Startups', emoji: '🚀' },
];

const NEWS_PREFS_KEY = 'coindaily_news_prefs';

/** Small component that fetches the live CP-to-JY rate from admin config */
function CpToJyRateText() {
  const [rate, setRate] = useState(100);
  useEffect(() => {
    fetch('/api/tokenomics/config')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.cpToJyRate) setRate(d.cpToJyRate); })
      .catch(() => {});
  }, []);
  return (
    <p className="text-xs text-dark-400">
      Earn CP through daily activities. <strong>{rate} CP = 1 JY Token</strong>. CP are automatically converted and reflected on your dashboard.
    </p>
  );
}

/** Fetch task reward values set by admin */
function useTaskRewards() {
  const [rewards, setRewards] = useState<Record<string, number>>({
    daily_login: 5, read_article: 2, bookmark_content: 1, share_article: 3,
    comment_article: 2, refer_friend: 50, complete_profile: 20, streak_7day: 25,
    first_read_daily: 3, watch_video: 2, telegram_activity: 3, discord_activity: 3,
    twitter_activity: 3, facebook_activity: 2, linkedin_activity: 2, youtube_activity: 2,
    coinmarketcap_activity: 3, reddit_activity: 2,
  });
  const [dailyCap, setDailyCap] = useState(500);
  useEffect(() => {
    fetch('/api/tokenomics/config')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.taskRewards) setRewards(prev => ({ ...prev, ...d.taskRewards }));
        if (d?.dailyCpCap) setDailyCap(d.dailyCpCap);
      })
      .catch(() => {});
  }, []);
  return { rewards, dailyCap };
}

/** Earn CP Section — dynamic task list with admin-set values + social media */
function EarnCpSection() {
  const { rewards, dailyCap } = useTaskRewards();
  const coreTasks = [
    { key: 'daily_login', action: 'Daily Login', desc: 'Visit the platform every day', emoji: '📅' },
    { key: 'read_article', action: 'Read an Article', desc: 'Read any news article fully', emoji: '📖' },
    { key: 'bookmark_content', action: 'Bookmark Content', desc: 'Save articles to your bookmarks', emoji: '🔖' },
    { key: 'share_article', action: 'Share an Article', desc: 'Share news to social media', emoji: '📤' },
    { key: 'comment_article', action: 'Comment on Article', desc: 'Leave a thoughtful comment', emoji: '💬' },
    { key: 'refer_friend', action: 'Refer a Friend', desc: 'When your referral signs up & verifies', emoji: '🤝' },
    { key: 'complete_profile', action: 'Complete Profile', desc: 'Fill out all profile fields (one-time)', emoji: '✅' },
    { key: 'streak_7day', action: 'Streak Bonus (7 days)', desc: 'Login 7 consecutive days', emoji: '🔥' },
    { key: 'first_read_daily', action: 'First Article Read (Daily)', desc: 'Bonus for first read each day', emoji: '🌅' },
    { key: 'watch_video', action: 'Watch Market Video', desc: 'Watch analysis or tutorial videos', emoji: '🎬' },
  ];
  const socialTasks = [
    { key: 'telegram_activity', action: 'Telegram', desc: 'Join & contribute to our Telegram group', emoji: '✈️' },
    { key: 'discord_activity', action: 'Discord', desc: 'Join & discuss in our Discord server', emoji: '🎮' },
    { key: 'twitter_activity', action: 'X (Twitter)', desc: 'Follow @CoinDailyNow & engage with posts', emoji: '🐦' },
    { key: 'facebook_activity', action: 'Facebook', desc: 'Join our FB community & participate', emoji: '📘' },
    { key: 'linkedin_activity', action: 'LinkedIn', desc: 'Follow & engage with our LinkedIn posts', emoji: '💼' },
    { key: 'youtube_activity', action: 'YouTube', desc: 'Subscribe, like & comment on videos', emoji: '▶️' },
    { key: 'coinmarketcap_activity', action: 'CoinMarketCap', desc: 'Follow us on CMC community', emoji: '📊' },
    { key: 'reddit_activity', action: 'Reddit', desc: 'Join r/CoinDaily & participate in discussions', emoji: '🤖' },
  ];
  return (
    <div className="bg-dark-900 border border-dark-700 rounded-xl p-6 space-y-5">
      <h2 className="text-lg font-semibold text-white flex items-center gap-2">
        <Coins className="w-5 h-5 text-primary-500" />
        How to Earn CoinPoints (CP)
      </h2>
      <CpToJyRateText />

      {/* Core Platform Tasks */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-dark-400 uppercase tracking-wider">Platform Activities</h3>
        {coreTasks.map((item) => (
          <div key={item.key} className="flex items-center gap-3 p-3 bg-dark-800 rounded-lg">
            <span className="text-lg">{item.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white">{item.action}</p>
              <p className="text-[10px] text-dark-500">{item.desc}</p>
            </div>
            <span className="shrink-0 text-sm font-bold text-primary-400">+{rewards[item.key] || 0} CP</span>
          </div>
        ))}
      </div>

      {/* Social Media Tasks */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-dark-400 uppercase tracking-wider mt-4">Social Media Engagement — Login &amp; Contribute</h3>
        <p className="text-[10px] text-dark-500">Earn CP by logging into and contributing to discussions on our official social channels daily.</p>
        {socialTasks.map((item) => (
          <div key={item.key} className="flex items-center gap-3 p-3 bg-gradient-to-r from-dark-800 to-purple-900/20 border border-purple-800/30 rounded-lg">
            <span className="text-lg">{item.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white">{item.action}</p>
              <p className="text-[10px] text-dark-500">{item.desc}</p>
            </div>
            <span className="shrink-0 text-sm font-bold text-purple-400">+{rewards[item.key] || 0} CP</span>
          </div>
        ))}
      </div>

      <div className="p-3 bg-primary-500/10 border border-primary-500/20 rounded-lg">
        <p className="text-xs text-primary-400">
          <strong>Daily Cap:</strong> You can earn up to {dailyCap} CP per day. Premium subscribers get 2x CP on all activities.
        </p>
      </div>
    </div>
  );
}

function getStoredNewsPrefs(): string[] {
  if (typeof window === 'undefined') return NEWS_CATEGORIES.map(c => c.id);
  try {
    const stored = localStorage.getItem(NEWS_PREFS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch { /* ignore */ }
  return NEWS_CATEGORIES.map(c => c.id);
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState('');
  const [location, setLocation] = useState('');
  const [dashboardTheme, setDashboardTheme] = useState<DashboardThemeId>('milk');
  const [newsPrefs, setNewsPrefs] = useState<string[]>([]);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Check push notification support
    if (typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator) {
      setPushSupported(true);
      setPushEnabled(Notification.permission === 'granted');
    }

    async function load() {
      try {
        const res = await fetchProfile();
        const p = res.data;
        setProfile(p);
        setFirstName(p.firstName || '');
        setLastName(p.lastName || '');
        setBio(p.bio || '');
        setAvatarUrl(p.avatarUrl || '');
        setPreferredLanguage(p.preferredLanguage || 'en');
        setLocation(p.location || '');
        setDashboardTheme(getStoredDashboardThemeId());
        setNewsPrefs(getStoredNewsPrefs());
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setError(null);
    // Save theme & news prefs immediately (independent of backend)
    localStorage.setItem(DASHBOARD_THEME_STORAGE_KEY, dashboardTheme);
    localStorage.setItem(NEWS_PREFS_KEY, JSON.stringify(newsPrefs));

    try {
      const res = await updateProfile({
        firstName: firstName || null,
        lastName: lastName || null,
        bio: bio || null,
        avatarUrl: avatarUrl || null,
        preferredLanguage,
        location: location || null,
      });

      setProfile((prev) => prev ? { ...prev, ...res.data } : prev);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-32 bg-dark-800 rounded animate-pulse" />
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-dark-800 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-white">Settings</h1>
        <p className="text-dark-400 mt-1">Manage your profile and preferences</p>
      </div>

      {/* Profile Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-dark-900 border border-dark-700 rounded-xl p-6 space-y-5">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary-500" />
            Profile Information
          </h2>

          {/* Account info (read-only) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-dark-400 mb-1">Username</label>
              <div className="px-3 py-2 bg-dark-800 rounded-lg text-sm text-dark-300">
                {profile?.username}
              </div>
            </div>
            <div>
              <label className="block text-xs text-dark-400 mb-1">Email</label>
              <div className="px-3 py-2 bg-dark-800 rounded-lg text-sm text-dark-300">
                {profile?.email}
              </div>
            </div>
          </div>

          {/* Editable fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-xs text-dark-400 mb-1">
                First Name
              </label>
              <input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Your first name"
                className="w-full px-3 py-2 bg-dark-800 border border-dark-600 rounded-lg text-sm text-white placeholder-dark-500 focus:outline-none focus:border-primary-500 transition-colors"
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-xs text-dark-400 mb-1">
                Last Name
              </label>
              <input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Your last name"
                className="w-full px-3 py-2 bg-dark-800 border border-dark-600 rounded-lg text-sm text-white placeholder-dark-500 focus:outline-none focus:border-primary-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label htmlFor="bio" className="block text-xs text-dark-400 mb-1">
              Bio
            </label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself"
              rows={3}
              className="w-full px-3 py-2 bg-dark-800 border border-dark-600 rounded-lg text-sm text-white placeholder-dark-500 focus:outline-none focus:border-primary-500 transition-colors resize-none"
            />
          </div>

          <div>
            <label className="block text-xs text-dark-400 mb-2">
              Profile Picture
            </label>
            <div className="flex items-center gap-4">
              {/* Avatar preview */}
              <div className="relative group">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-dark-800 border-2 border-dark-600 flex items-center justify-center">
                  {(avatarPreview || avatarUrl) ? (
                    <img
                      src={avatarPreview || avatarUrl}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <User className="w-8 h-8 text-dark-500" />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                  <Camera className="w-5 h-5 text-white" />
                </button>
              </div>
              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/gif,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.size > 2 * 1024 * 1024) {
                      alert('Image must be under 2MB');
                      return;
                    }
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      const dataUrl = ev.target?.result as string;
                      setAvatarPreview(dataUrl);
                      setAvatarUrl(dataUrl);
                    };
                    reader.readAsDataURL(file);
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-dark-800 border border-dark-600 rounded-lg text-dark-300 hover:text-white hover:border-dark-500 transition-colors"
                >
                  <Upload className="w-3 h-3" />
                  Upload Photo
                </button>
                <p className="text-[10px] text-dark-500 mt-1">PNG, JPG, GIF or WebP. Max 2MB.</p>
                {/* Fallback URL field */}
                <input
                  id="avatarUrl"
                  type="url"
                  value={avatarUrl.startsWith('data:') ? '' : avatarUrl}
                  onChange={(e) => { setAvatarUrl(e.target.value); setAvatarPreview(null); }}
                  placeholder="Or paste an image URL"
                  className="mt-2 w-full px-3 py-1.5 bg-dark-800 border border-dark-600 rounded-lg text-xs text-white placeholder-dark-500 focus:outline-none focus:border-primary-500 transition-colors"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="bg-dark-900 border border-dark-700 rounded-xl p-6 space-y-5">
          <h2 className="text-lg font-semibold text-white">Preferences</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="language" className="block text-xs text-dark-400 mb-1">
                Preferred Language
              </label>
              <select
                id="language"
                value={preferredLanguage}
                onChange={(e) => setPreferredLanguage(e.target.value)}
                className="w-full px-3 py-2 bg-dark-800 border border-dark-600 rounded-lg text-sm text-white focus:outline-none focus:border-primary-500 transition-colors"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="location" className="block text-xs text-dark-400 mb-1">
                Country
              </label>
              <select
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 bg-dark-800 border border-dark-600 rounded-lg text-sm text-white focus:outline-none focus:border-primary-500 transition-colors"
              >
                <option value="">Select country</option>
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* News Category Preferences */}
          <div>
            <label className="block text-xs text-dark-400 mb-1 flex items-center gap-1.5">
              <Newspaper className="w-3.5 h-3.5" /> Free News Categories
            </label>
            <p className="text-[11px] text-dark-500 mb-3">Choose which types of news you want in your feed. Deselect categories you're not interested in.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {NEWS_CATEGORIES.map((cat) => {
                const checked = newsPrefs.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setNewsPrefs((prev) =>
                        checked
                          ? prev.filter((id) => id !== cat.id)
                          : [...prev, cat.id]
                      );
                    }}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border text-sm text-left transition-colors ${
                      checked
                        ? 'border-primary-500/50 bg-primary-500/10 text-white'
                        : 'border-dark-700 bg-dark-800 text-dark-400 hover:border-dark-600'
                    }`}
                  >
                    <span className="text-base leading-none">{cat.emoji}</span>
                    <span className="flex-1 truncate">{cat.label}</span>
                    <span className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] ${
                      checked ? 'bg-primary-500 border-primary-500 text-dark-950' : 'border-dark-600'
                    }`}>
                      {checked && '✓'}
                    </span>
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => {
                if (newsPrefs.length === NEWS_CATEGORIES.length) {
                  setNewsPrefs([]);
                } else {
                  setNewsPrefs(NEWS_CATEGORIES.map(c => c.id));
                }
              }}
              className="mt-2 text-xs text-primary-400 hover:text-primary-300 transition-colors"
            >
              {newsPrefs.length === NEWS_CATEGORIES.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          <div>
            <label className="block text-xs text-dark-400 mb-2">Dashboard Color Scheme</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {dashboardThemes.map((theme) => {
                const selected = dashboardTheme === theme.id;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => setDashboardTheme(theme.id)}
                    className={`text-left p-3 rounded-xl border transition-colors ${
                      selected
                        ? 'border-primary-500 bg-primary-500/10'
                        : 'border-dark-700 bg-dark-800 hover:border-dark-600'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.preview.bg }} />
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.preview.text }} />
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.preview.card }} />
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.preview.accent }} />
                    </div>
                    <p className="text-sm font-semibold text-white">{theme.name}</p>
                    <p className="text-xs text-dark-400 mt-1">{theme.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Push Notifications ── */}
        <div className="bg-dark-900 border border-dark-700 rounded-xl p-6 space-y-5">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary-500" />
            Push Notifications
          </h2>
          <p className="text-xs text-dark-400">
            Receive real-time alerts on your phone for breaking news, price movements, and account activity.
          </p>

          {pushSupported ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-dark-800 rounded-lg">
                <div>
                  <p className="text-sm text-white font-medium">Mobile Push Notifications</p>
                  <p className="text-xs text-dark-400 mt-0.5">
                    {pushEnabled
                      ? 'You will receive push notifications on this device'
                      : 'Enable to get alerts on your phone or browser'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    if (!pushEnabled) {
                      const permission = await Notification.requestPermission();
                      if (permission === 'granted') {
                        setPushEnabled(true);
                        localStorage.setItem('coindaily_push_enabled', 'true');
                        new Notification('CoinDaily', {
                          body: 'Push notifications enabled! You\'ll receive alerts for breaking news and price movements.',
                          icon: '/icons/icon-192.png',
                        });
                      }
                    } else {
                      setPushEnabled(false);
                      localStorage.setItem('coindaily_push_enabled', 'false');
                    }
                  }}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    pushEnabled ? 'bg-primary-500' : 'bg-dark-600'
                  }`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                    pushEnabled ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              {pushEnabled && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { key: 'push_breaking_news', label: 'Breaking News', desc: 'Major crypto events', default: true },
                    { key: 'push_price_alerts', label: 'Price Alerts', desc: 'Token price movements', default: true },
                    { key: 'push_portfolio', label: 'Portfolio Updates', desc: 'Significant P&L changes', default: true },
                    { key: 'push_earnings', label: 'CP Earnings', desc: 'When you earn CoinPoints', default: false },
                    { key: 'push_social', label: 'Social Activity', desc: 'Replies, mentions, follows', default: false },
                    { key: 'push_market', label: 'Market Analysis', desc: 'AI-powered insights', default: true },
                  ].map((notif) => {
                    const stored = localStorage.getItem(notif.key);
                    const isOn = stored !== null ? stored === 'true' : notif.default;
                    return (
                      <button
                        key={notif.key}
                        type="button"
                        onClick={() => {
                          localStorage.setItem(notif.key, (!isOn).toString());
                          setPushEnabled(p => p); // force re-render
                        }}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border text-sm text-left transition-colors ${
                          isOn
                            ? 'border-primary-500/50 bg-primary-500/10 text-white'
                            : 'border-dark-700 bg-dark-800 text-dark-400 hover:border-dark-600'
                        }`}
                      >
                        <span className="flex-1">
                          <span className="block text-xs font-medium">{notif.label}</span>
                          <span className="block text-[10px] text-dark-500">{notif.desc}</span>
                        </span>
                        <span className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] ${
                          isOn ? 'bg-primary-500 border-primary-500 text-dark-950' : 'border-dark-600'
                        }`}>
                          {isOn && '✓'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="p-3 bg-dark-800 rounded-lg">
              <p className="text-xs text-dark-400">
                Push notifications are not supported on this browser. Try using Chrome, Firefox, or Edge on your phone or computer.
              </p>
            </div>
          )}
        </div>

        {/* ── How to Earn CP Points ── */}
        <EarnCpSection />

        {/* Submit */}
        <div className="flex items-center justify-between">
          <div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            {success && <p className="text-sm text-green-400">Settings saved successfully!</p>}
          </div>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-dark-950 font-semibold text-sm rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>

      {/* Account Info */}
      <div className="bg-dark-900 border border-dark-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Account</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-dark-300">
              Subscription: <span className="text-white font-medium">{profile?.subscriptionTier || 'FREE'}</span>
            </p>
            <p className="text-xs text-dark-500 mt-1">
              Member since {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '—'}
            </p>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('auth_token');
              window.location.href = '/';
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
