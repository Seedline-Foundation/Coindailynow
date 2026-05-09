'use client';

import { useEffect, useState } from 'react';
import { fetchProfile, updateProfile } from '@/lib/userApi';

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
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'French' },
  { code: 'sw', label: 'Swahili' },
  { code: 'ha', label: 'Hausa' },
  { code: 'yo', label: 'Yoruba' },
  { code: 'ig', label: 'Igbo' },
  { code: 'am', label: 'Amharic' },
  { code: 'zu', label: 'Zulu' },
  { code: 'ar', label: 'Arabic' },
  { code: 'pt', label: 'Portuguese' },
];

const COUNTRIES = [
  'Nigeria', 'Kenya', 'South Africa', 'Ghana', 'Tanzania',
  'Ethiopia', 'Egypt', 'Uganda', 'Cameroon', 'Rwanda',
  'Senegal', 'Côte d\'Ivoire', 'Zambia', 'Zimbabwe', 'Botswana',
];

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

  useEffect(() => {
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
        <p className="text-gray-400 mt-1">Manage your profile and preferences</p>
      </div>

      {/* Profile Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-dark-900 border border-dark-700 rounded-xl p-6 space-y-5">
          <h2 className="text-lg font-semibold text-white">Profile Information</h2>

          {/* Account info (read-only) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Username</label>
              <div className="px-3 py-2 bg-dark-800 rounded-lg text-sm text-gray-400">
                {profile?.username}
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Email</label>
              <div className="px-3 py-2 bg-dark-800 rounded-lg text-sm text-gray-400">
                {profile?.email}
              </div>
            </div>
          </div>

          {/* Editable fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-xs text-gray-500 mb-1">
                First Name
              </label>
              <input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Your first name"
                className="w-full px-3 py-2 bg-dark-800 border border-dark-600 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary-500 transition-colors"
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-xs text-gray-500 mb-1">
                Last Name
              </label>
              <input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Your last name"
                className="w-full px-3 py-2 bg-dark-800 border border-dark-600 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label htmlFor="bio" className="block text-xs text-gray-500 mb-1">
              Bio
            </label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself"
              rows={3}
              className="w-full px-3 py-2 bg-dark-800 border border-dark-600 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary-500 transition-colors resize-none"
            />
          </div>

          <div>
            <label htmlFor="avatarUrl" className="block text-xs text-gray-500 mb-1">
              Avatar URL
            </label>
            <input
              id="avatarUrl"
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://example.com/avatar.png"
              className="w-full px-3 py-2 bg-dark-800 border border-dark-600 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary-500 transition-colors"
            />
          </div>
        </div>

        {/* Preferences */}
        <div className="bg-dark-900 border border-dark-700 rounded-xl p-6 space-y-5">
          <h2 className="text-lg font-semibold text-white">Preferences</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="language" className="block text-xs text-gray-500 mb-1">
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
              <label htmlFor="location" className="block text-xs text-gray-500 mb-1">
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
        </div>

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
            <p className="text-sm text-gray-400">
              Subscription: <span className="text-white font-medium">{profile?.subscriptionTier || 'FREE'}</span>
            </p>
            <p className="text-xs text-gray-600 mt-1">
              Member since {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '—'}
            </p>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('refreshToken');
              window.location.href = '/';
            }}
            className="px-4 py-2 text-sm text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/10 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
