/**
 * User Settings Page
 * Profile and account settings
 */

'use client';

import React from 'react';
import ProfileSettings from '@/components/user/ProfileSettings';

export default function UserSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-white">Settings</h1>
        <p className="text-dark-400 mt-1">Manage your account preferences and profile information.</p>
      </div>

      <ProfileSettings />
    </div>
  );
}
