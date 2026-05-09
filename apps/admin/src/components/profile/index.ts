/**
 * Profile Components Index
 * Task 25: User Profile & Settings
 * 
 * Central export point for all profile and settings components
 */

// Main Settings Page
export { default as SettingsPage } from './SettingsPage';

// Individual Settings Forms
export { ProfileForm } from './ProfileForm';
export { default as PrivacySettings } from './PrivacySettings';
export { default as NotificationSettings } from './NotificationSettings';
export { default as LocalizationSettings } from './LocalizationSettings';
export { default as SecuritySettings } from './SecuritySettings';

// Re-export types for convenience
export type {
  UserProfile,
  UserSettings,
  UserPrivacySettings,
  NotificationSettings as NotificationSettingsType,
  LocalizationSettings as LocalizationSettingsType,
  SecuritySettings as SecuritySettingsType,
  ProfileFormProps,
  SettingsFormProps
} from '../../types/profile';

// Re-export hook
export { useProfile } from '../../hooks/useProfile';