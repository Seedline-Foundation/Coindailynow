'use client';

import React, { useState, useEffect } from 'react';
import { 
  User, 
  Bell, 
  Shield, 
  Eye, 
  Globe, 
  Palette, 
  Monitor, 
  Sun, 
  Moon, 
  Volume2,
  Smartphone,
  Mail,
  Lock,
  Key,
  Trash2,
  Download,
  Upload,
  Settings,
  ChevronRight,
  Save,
  X
} from 'lucide-react';
import { User as UserType, AdminUserControls } from '../../types/user';

interface ProfileSettingsProps {
  user: UserType;
  adminControls: AdminUserControls;
  onUpdateProfile?: (updates: Partial<UserType>) => void;
  onDeleteAccount?: () => void;
}

interface SettingsTab {
  id: string;
  label: string;
  icon: React.ReactNode;
  component: React.ReactNode;
}

export const ProfileSettings: React.FC<ProfileSettingsProps> = ({
  user,
  adminControls,
  onUpdateProfile,
  onDeleteAccount
}) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [formData, setFormData] = useState({
    displayName: user.displayName,
    bio: user.bio,
    location: user.location,
    website: user.website,
    twitter: user.twitter || '',
    linkedin: user.linkedin || ''
  });
  
  // Create mock preferences since they don't exist in the User type
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    inApp: true
  });
  
  const [privacy, setPrivacy] = useState({
    profileVisibility: 'public' as 'public' | 'premium' | 'followers' | 'private',
    showEmail: false,
    showLocation: true
  });
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  useEffect(() => {
    // Load theme preferences from localStorage
    const savedTheme = localStorage.getItem('theme');
    const savedContrast = localStorage.getItem('contrast');
    setIsDarkMode(savedTheme === 'dark');
    setIsHighContrast(savedContrast === 'high');
    
    // Apply theme classes
    document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    document.documentElement.classList.toggle('high-contrast', savedContrast === 'high');
  }, []);

  const handleThemeChange = (theme: 'light' | 'dark') => {
    setIsDarkMode(theme === 'dark');
    localStorage.setItem('theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  };

  const handleContrastToggle = () => {
    const newContrast = !isHighContrast;
    setIsHighContrast(newContrast);
    localStorage.setItem('contrast', newContrast ? 'high' : 'normal');
    document.documentElement.classList.toggle('high-contrast', newContrast);
  };

  const handleSaveChanges = () => {
    if (onUpdateProfile) {
      onUpdateProfile({
        displayName: formData.displayName,
        bio: formData.bio,
        location: formData.location,
        website: formData.website,
        twitter: formData.twitter,
        linkedin: formData.linkedin
      });
    }
    setUnsavedChanges(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setUnsavedChanges(true);
  };

  // Profile Information Tab
  const ProfileTab = () => (
    <div className="space-y-6">
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Profile Information
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Update your profile details and public information
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Display Name
          </label>
          <input
            type="text"
            value={formData.displayName}
            onChange={(e) => handleInputChange('displayName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Username
          </label>
          <input
            type="text"
            value={user.username}
            disabled
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
          />
          <p className="text-xs text-gray-500 mt-1">Username cannot be changed</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Location
          </label>
          <input
            type="text"
            value={formData.location || ''}
            onChange={(e) => handleInputChange('location', e.target.value)}
            placeholder="e.g., Lagos, Nigeria"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Website
          </label>
          <input
            type="url"
            value={formData.website || ''}
            onChange={(e) => handleInputChange('website', e.target.value)}
            placeholder="https://yourwebsite.com"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Bio
          </label>
          <textarea
            value={formData.bio || ''}
            onChange={(e) => handleInputChange('bio', e.target.value)}
            rows={4}
            maxLength={500}
            placeholder="Tell us about yourself..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">
            {(formData.bio || '').length}/500 characters
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Twitter Handle
          </label>
          <input
            type="text"
            value={formData.twitter}
            onChange={(e) => handleInputChange('twitter', e.target.value)}
            placeholder="@yourhandle"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            LinkedIn Profile
          </label>
          <input
            type="text"
            value={formData.linkedin}
            onChange={(e) => handleInputChange('linkedin', e.target.value)}
            placeholder="linkedin-username"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
    </div>
  );

  // Notifications Tab
  const NotificationsTab = () => (
    <div className="space-y-6">
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Notification Preferences
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Control how and when you receive notifications
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center space-x-3">
            <Mail className="h-5 w-5 text-blue-500" />
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100">Email Notifications</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Receive updates via email</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={notifications.email}
              onChange={(e) => {
                setNotifications((prev: typeof notifications) => ({ ...prev, email: e.target.checked }));
                setUnsavedChanges(true);
              }}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 
                         peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer 
                         dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white 
                         after:content-[''] after:absolute after:top-[2px] after:left-[2px] 
                         after:bg-white after:border-gray-300 after:border after:rounded-full 
                         after:h-5 after:w-5 after:transition-all dark:border-gray-600 
                         peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center space-x-3">
            <Smartphone className="h-5 w-5 text-green-500" />
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100">Push Notifications</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Real-time notifications on your device</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={notifications.push}
              onChange={(e) => {
                setNotifications((prev: typeof notifications) => ({ ...prev, push: e.target.checked }));
                setUnsavedChanges(true);
              }}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 
                         peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer 
                         dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white 
                         after:content-[''] after:absolute after:top-[2px] after:left-[2px] 
                         after:bg-white after:border-gray-300 after:border after:rounded-full 
                         after:h-5 after:w-5 after:transition-all dark:border-gray-600 
                         peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center space-x-3">
            <Bell className="h-5 w-5 text-purple-500" />
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100">In-App Notifications</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Notifications within the app</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={notifications.inApp}
              onChange={(e) => {
                setNotifications((prev: typeof notifications) => ({ ...prev, inApp: e.target.checked }));
                setUnsavedChanges(true);
              }}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 
                         peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer 
                         dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white 
                         after:content-[''] after:absolute after:top-[2px] after:left-[2px] 
                         after:bg-white after:border-gray-300 after:border after:rounded-full 
                         after:h-5 after:w-5 after:transition-all dark:border-gray-600 
                         peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>
    </div>
  );

  // Privacy Tab
  const PrivacyTab = () => (
    <div className="space-y-6">
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Privacy Settings
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Control your privacy and what others can see
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Profile Visibility
          </label>
          <select
            value={privacy.profileVisibility}
            onChange={(e) => {
              setPrivacy((prev: typeof privacy) => ({ ...prev, profileVisibility: e.target.value as any }));
              setUnsavedChanges(true);
            }}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="public">Public - Anyone can see your profile</option>
            <option value="premium">Premium Members Only</option>
            <option value="followers">Followers Only</option>
            <option value="private">Private - Only you can see</option>
          </select>
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-gray-100">Show Email Address</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">Display your email on your profile</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={privacy.showEmail}
              onChange={(e) => {
                setPrivacy((prev: typeof privacy) => ({ ...prev, showEmail: e.target.checked }));
                setUnsavedChanges(true);
              }}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 
                         peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer 
                         dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white 
                         after:content-[''] after:absolute after:top-[2px] after:left-[2px] 
                         after:bg-white after:border-gray-300 after:border after:rounded-full 
                         after:h-5 after:w-5 after:transition-all dark:border-gray-600 
                         peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-gray-100">Show Location</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">Display your location on your profile</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={privacy.showLocation}
              onChange={(e) => {
                setPrivacy((prev: typeof privacy) => ({ ...prev, showLocation: e.target.checked }));
                setUnsavedChanges(true);
              }}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 
                         peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer 
                         dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white 
                         after:content-[''] after:absolute after:top-[2px] after:left-[2px] 
                         after:bg-white after:border-gray-300 after:border after:rounded-full 
                         after:h-5 after:w-5 after:transition-all dark:border-gray-600 
                         peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>
    </div>
  );

  // Appearance Tab with Contrast Toggle
  const AppearanceTab = () => (
    <div className="space-y-6">
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Appearance & Accessibility
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Customize the look and feel of your interface
        </p>
      </div>

      <div className="space-y-6">
        {/* Theme Selection */}
        <div>
          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-4">Theme</h4>
          <div className="grid grid-cols-3 gap-4">
            <button
              onClick={() => handleThemeChange('light')}
              className={`p-4 rounded-lg border-2 transition-all ${
                !isDarkMode 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
            >
              <Sun className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Light</span>
            </button>

            <button
              onClick={() => handleThemeChange('dark')}
              className={`p-4 rounded-lg border-2 transition-all ${
                isDarkMode 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
            >
              <Moon className="h-6 w-6 mx-auto mb-2 text-blue-500" />
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Dark</span>
            </button>

            <button
              onClick={() => {
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                handleThemeChange(prefersDark ? 'dark' : 'light');
              }}
              className="p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 transition-all"
            >
              <Monitor className="h-6 w-6 mx-auto mb-2 text-gray-500" />
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">System</span>
            </button>
          </div>
        </div>

        {/* Contrast Toggle */}
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center space-x-3">
            <Eye className="h-5 w-5 text-indigo-500" />
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100">High Contrast Mode</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Enhance visibility with higher contrast colors
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isHighContrast}
              onChange={handleContrastToggle}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 
                         peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer 
                         dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white 
                         after:content-[''] after:absolute after:top-[2px] after:left-[2px] 
                         after:bg-white after:border-gray-300 after:border after:rounded-full 
                         after:h-5 after:w-5 after:transition-all dark:border-gray-600 
                         peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Font Size */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Font Size
          </label>
          <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                           bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option value="small">Small</option>
            <option value="medium">Medium (Default)</option>
            <option value="large">Large</option>
            <option value="extra-large">Extra Large</option>
          </select>
        </div>
      </div>
    </div>
  );

  // Security Tab
  const SecurityTab = () => (
    <div className="space-y-6">
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Security Settings
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Manage your account security and authentication
        </p>
      </div>

      <div className="space-y-4">
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-3">
              <Lock className="h-5 w-5 text-green-500" />
              <h4 className="font-medium text-gray-900 dark:text-gray-100">Password</h4>
            </div>
            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              Change Password
            </button>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Last changed: Never
          </p>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-3">
              <Key className="h-5 w-5 text-blue-500" />
              <h4 className="font-medium text-gray-900 dark:text-gray-100">Two-Factor Authentication</h4>
            </div>
            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              Enable 2FA
            </button>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Add an extra layer of security to your account
          </p>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-3">
              <Download className="h-5 w-5 text-purple-500" />
              <h4 className="font-medium text-gray-900 dark:text-gray-100">Download Your Data</h4>
            </div>
            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              Request Download
            </button>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Get a copy of all your data and activity
          </p>
        </div>
      </div>
    </div>
  );

  // Account Tab with Delete Account
  const AccountTab = () => (
    <div className="space-y-6">
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Account Management
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Manage your account status and subscription
        </p>
      </div>

      <div className="space-y-4">
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
            Subscription Status: {user.subscriptionTier.toUpperCase()}
          </h4>
          <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
            JOY Tokens: {user.joyTokens} | CE Points: {user.cePoints}
          </p>
          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
            Manage Subscription
          </button>
        </div>

        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          <div className="flex items-center space-x-3 mb-2">
            <Trash2 className="h-5 w-5 text-red-500" />
            <h4 className="font-medium text-red-900 dark:text-red-100">Delete Account</h4>
          </div>
          <p className="text-sm text-red-700 dark:text-red-300 mb-3">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>
          <button 
            onClick={onDeleteAccount}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );

  const tabs: SettingsTab[] = [
    { id: 'profile', label: 'Profile', icon: <User className="h-4 w-4" />, component: <ProfileTab /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="h-4 w-4" />, component: <NotificationsTab /> },
    { id: 'privacy', label: 'Privacy', icon: <Shield className="h-4 w-4" />, component: <PrivacyTab /> },
    { id: 'appearance', label: 'Appearance', icon: <Palette className="h-4 w-4" />, component: <AppearanceTab /> },
    { id: 'security', label: 'Security', icon: <Lock className="h-4 w-4" />, component: <SecurityTab /> },
    { id: 'account', label: 'Account', icon: <Settings className="h-4 w-4" />, component: <AccountTab /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Profile Settings
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manage your profile, preferences, and account settings
              </p>
            </div>
            {unsavedChanges && (
              <div className="flex items-center space-x-3">
                <span className="text-sm text-amber-600 dark:text-amber-400">
                  You have unsaved changes
                </span>
                <button
                  onClick={handleSaveChanges}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 
                           text-white rounded-lg transition-colors"
                >
                  <Save className="h-4 w-4" />
                  <span>Save Changes</span>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className="lg:w-64 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {tab.icon}
                  <span className="font-medium">{tab.label}</span>
                  <ChevronRight className="h-4 w-4 ml-auto" />
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            {tabs.find(tab => tab.id === activeTab)?.component}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
