/**
 * Form Validation Utilities
 * Task 20: Authentication UI Components
 * 
 * Validation utilities for authentication forms with African context
 */

import { FormErrors, FormValidationRules } from '../types/auth';

// ========== Validation Rules ==========

export const ValidationRules = {
  // Email validation with African domain support
  email: {
    required: true,
    pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    custom: (value: string) => {
      if (!value) return 'Email is required';
      
      // Support for African domains
      const africanDomains = [
        '.co.za', '.ng', '.ke', '.gh', '.ug', '.tz', '.zm', '.zw',
        '.bw', '.mw', '.na', '.sz', '.ls', '.et', '.cm', '.sn', '.ci'
      ];
      
      const hasAfricanDomain = africanDomains.some(domain => 
        value.toLowerCase().endsWith(domain)
      );
      
      if (!ValidationRules.email.pattern.test(value)) {
        return 'Please enter a valid email address';
      }
      
      return null;
    }
  },

  // Password validation for African security standards
  password: {
    required: true,
    minLength: 8,
    maxLength: 128,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    custom: (value: string) => {
      if (!value) return 'Password is required';
      if (value.length < 8) return 'Password must be at least 8 characters long';
      if (value.length > 128) return 'Password must be less than 128 characters';
      if (!/(?=.*[a-z])/.test(value)) return 'Password must contain at least one lowercase letter';
      if (!/(?=.*[A-Z])/.test(value)) return 'Password must contain at least one uppercase letter';
      if (!/(?=.*\d)/.test(value)) return 'Password must contain at least one number';
      if (!/(?=.*[@$!%*?&])/.test(value)) return 'Password must contain at least one special character (@$!%*?&)';
      
      // Check for common weak passwords
      const weakPasswords = [
        'password123', 'Password123!', '12345678', 'qwerty123',
        'admin123', 'welcome123', 'nigeria123', 'ghana123', 'kenya123'
      ];
      
      if (weakPasswords.some(weak => value.toLowerCase().includes(weak.toLowerCase()))) {
        return 'Password is too common. Please choose a stronger password';
      }
      
      return null;
    }
  },

  // Username validation
  username: {
    required: true,
    minLength: 3,
    maxLength: 30,
    pattern: /^[a-zA-Z0-9_-]+$/,
    custom: (value: string) => {
      if (!value) return 'Username is required';
      if (value.length < 3) return 'Username must be at least 3 characters long';
      if (value.length > 30) return 'Username must be less than 30 characters';
      if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
        return 'Username can only contain letters, numbers, underscores, and hyphens';
      }
      
      // Reserved usernames
      const reserved = [
        'admin', 'root', 'user', 'test', 'demo', 'api', 'www',
        'mail', 'support', 'help', 'info', 'contact', 'news',
        'coindaily', 'bitcoin', 'ethereum', 'crypto'
      ];
      
      if (reserved.includes(value.toLowerCase())) {
        return 'This username is not available';
      }
      
      return null;
    }
  },

  // Phone number validation for African formats
  phoneNumber: {
    required: true,
    pattern: /^\+?[1-9]\d{1,14}$/,
    custom: (value: string) => {
      if (!value) return 'Phone number is required';
      
      // Remove spaces and special characters except +
      const cleaned = value.replace(/[^\d+]/g, '');
      
      // African country codes
      const africanCountryCodes = [
        '+234', '+254', '+27', '+233', '+256', '+255', '+260', '+263',
        '+267', '+265', '+264', '+268', '+266', '+251', '+237', '+221', '+225'
      ];
      
      // Check if it starts with African country code
      const hasAfricanCode = africanCountryCodes.some(code => 
        cleaned.startsWith(code)
      );
      
      if (!hasAfricanCode && !cleaned.startsWith('+')) {
        return 'Please include country code (e.g., +234 for Nigeria)';
      }
      
      if (!/^\+?[1-9]\d{1,14}$/.test(cleaned)) {
        return 'Please enter a valid phone number';
      }
      
      return null;
    }
  },

  // Name validation with African character support
  name: {
    required: true,
    minLength: 1,
    maxLength: 50,
    pattern: /^[a-zA-ZÀ-ÿ\s'-]+$/,
    custom: (value: string) => {
      if (!value) return 'Name is required';
      if (value.length > 50) return 'Name must be less than 50 characters';
      if (!/^[a-zA-ZÀ-ÿ\s'-]+$/.test(value)) {
        return 'Name can only contain letters, spaces, apostrophes, and hyphens';
      }
      return null;
    }
  },

  // MFA code validation
  mfaCode: {
    required: true,
    pattern: /^[0-9]{6}$/,
    custom: (value: string) => {
      if (!value) return 'Verification code is required';
      if (!/^[0-9]{6}$/.test(value)) {
        return 'Verification code must be 6 digits';
      }
      return null;
    }
  }
};

// ========== Validation Functions ==========

export function validateField(value: any, rules: FormValidationRules): string | null {
  if (rules.required && (!value || (typeof value === 'string' && !value.trim()))) {
    return 'This field is required';
  }

  if (value && typeof value === 'string') {
    if (rules.minLength && value.length < rules.minLength) {
      return `Must be at least ${rules.minLength} characters long`;
    }

    if (rules.maxLength && value.length > rules.maxLength) {
      return `Must be less than ${rules.maxLength} characters long`;
    }

    if (rules.pattern && !rules.pattern.test(value)) {
      return 'Invalid format';
    }
  }

  if (rules.custom) {
    return rules.custom(value);
  }

  return null;
}

export function validateForm(data: Record<string, any>, rules: Record<string, FormValidationRules>): FormErrors {
  const errors: FormErrors = {};

  for (const [field, fieldRules] of Object.entries(rules)) {
    const error = validateField(data[field], fieldRules);
    if (error) {
      errors[field] = error;
    }
  }

  return errors;
}

// ========== Specific Form Validators ==========

export function validateLoginForm(data: { email: string; password: string }): FormErrors {
  return validateForm(data, {
    email: ValidationRules.email,
    password: { required: true } // Less strict for login
  });
}

export function validateRegisterForm(data: {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
}): FormErrors {
  const errors = validateForm(data, {
    email: ValidationRules.email,
    username: ValidationRules.username,
    password: ValidationRules.password,
    firstName: ValidationRules.name,
    lastName: ValidationRules.name
  });

  // Confirm password validation
  if (data.password && data.confirmPassword && data.password !== data.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  return errors;
}

export function validatePasswordResetForm(data: {
  password: string;
  confirmPassword: string;
}): FormErrors {
  const errors = validateForm(data, {
    password: ValidationRules.password
  });

  // Confirm password validation
  if (data.password && data.confirmPassword && data.password !== data.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  return errors;
}

export function validateMFASetupForm(data: {
  phoneNumber?: string;
  method: string;
}): FormErrors {
  const errors: FormErrors = {};

  if (data.method === 'SMS' && data.phoneNumber) {
    const phoneError = validateField(data.phoneNumber, ValidationRules.phoneNumber);
    if (phoneError) {
      errors.phoneNumber = phoneError;
    }
  }

  return errors;
}

export function validateMFAVerificationForm(data: { code: string }): FormErrors {
  return validateForm(data, {
    code: ValidationRules.mfaCode
  });
}

export function validateProfileForm(data: {
  firstName?: string;
  lastName?: string;
  displayName?: string;
  bio?: string;
  website?: string;
  twitter?: string;
  linkedin?: string;
  tradingExperience?: string;
  investmentPortfolioSize?: string;
  preferredExchanges?: string[];
}): FormErrors {
  const errors: FormErrors = {};

  // Name validations
  if (!data.firstName || data.firstName.trim() === '') {
    errors.firstName = 'First name is required';
  } else if (data.firstName.length < 2) {
    errors.firstName = 'First name must be at least 2 characters';
  } else if (data.firstName.length > 50) {
    errors.firstName = 'First name must be less than 50 characters';
  }

  if (data.lastName && data.lastName.length < 2) {
    errors.lastName = 'Last name must be at least 2 characters';
  }
  if (data.lastName && data.lastName.length > 50) {
    errors.lastName = 'Last name must be less than 50 characters';
  }

  if (data.displayName && data.displayName.length < 2) {
    errors.displayName = 'Display name must be at least 2 characters';
  }
  if (data.displayName && data.displayName.length > 30) {
    errors.displayName = 'Display name must be less than 30 characters';
  }

  // Bio validation
  if (data.bio && data.bio.length > 500) {
    errors.bio = 'Bio must be less than 500 characters';
  }

  // URL validations
  if (data.website) {
    try {
      new URL(data.website);
    } catch {
      errors.website = 'Please enter a valid website URL';
    }
  }

  if (data.twitter && (!data.twitter.startsWith('@') || data.twitter.length < 2)) {
    errors.twitter = 'Please enter a valid Twitter handle starting with @';
  }

  if (data.linkedin && data.linkedin) {
    try {
      const url = new URL(data.linkedin);
      if (!url.hostname.includes('linkedin.com')) {
        errors.linkedin = 'Please enter a valid LinkedIn profile URL';
      }
    } catch {
      errors.linkedin = 'Please enter a valid LinkedIn profile URL';
    }
  }

  return errors;
}

// ========== Real-time Validation Hook ==========

import { useState, useCallback } from 'react';

export function useFormValidation<T extends Record<string, any>>(
  initialData: T,
  validationRules: Record<keyof T, FormValidationRules>
) {
  const [data, setData] = useState<T>(initialData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

  const validateSingleField = useCallback((field: string, value: any) => {
    const rules = validationRules[field as keyof T];
    if (!rules) return null;
    
    return validateField(value, rules);
  }, [validationRules]);

  const handleFieldChange = useCallback((field: string, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
    
    // Real-time validation for touched fields
    if (touchedFields.has(field)) {
      const fieldError = validateSingleField(field, value);
      setErrors(prev => {
        const newErrors = { ...prev };
        if (fieldError) {
          newErrors[field] = fieldError;
        } else {
          delete newErrors[field];
        }
        return newErrors;
      });
    }
  }, [touchedFields, validateSingleField]);

  const handleFieldBlur = useCallback((field: string) => {
    setTouchedFields(prev => new Set(prev).add(field));
    
    const fieldError = validateSingleField(field, data[field as keyof T]);
    setErrors(prev => {
      const newErrors = { ...prev };
      if (fieldError) {
        newErrors[field] = fieldError;
      } else {
        delete newErrors[field];
      }
      return newErrors;
    });
  }, [data, validateSingleField]);

  const validateAllFields = useCallback(() => {
    const allErrors = validateForm(data, validationRules);
    setErrors(allErrors);
    setTouchedFields(new Set(Object.keys(data)));
    
    return Object.keys(allErrors).length === 0;
  }, [data, validationRules]);

  const resetForm = useCallback(() => {
    setData(initialData);
    setErrors({});
    setTouchedFields(new Set());
  }, [initialData]);

  return {
    data,
    errors,
    touchedFields,
    handleFieldChange,
    handleFieldBlur,
    validateAllFields,
    resetForm,
    isValid: Object.keys(errors).length === 0,
    hasErrors: Object.keys(errors).length > 0
  };
}

// ========== Privacy Settings Validation ==========

import { UserPrivacySettings, ProfileVisibility, DataRetentionPeriod } from '../types/profile';

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export const validatePrivacySettings = (settings: UserPrivacySettings): ValidationResult => {
  const errors: Record<string, string> = {};
  
  // Validate profile visibility
  if (!settings.profileVisibility) {
    errors.profileVisibility = 'Profile visibility is required';
  } else if (!Object.values(ProfileVisibility).includes(settings.profileVisibility as ProfileVisibility)) {
    errors.profileVisibility = 'Please select a valid profile visibility option';
  }
  
  // Validate data retention period
  if (!settings.dataRetentionPeriod) {
    errors.dataRetentionPeriod = 'Data retention period is required';
  } else if (!Object.values(DataRetentionPeriod).includes(settings.dataRetentionPeriod)) {
    errors.dataRetentionPeriod = 'Please select a valid data retention period';
  }
  
  // Validate boolean fields (they should be defined)
  const booleanFields: (keyof UserPrivacySettings)[] = [
    'showTradingActivity',
    'showInvestmentData', 
    'allowMessageRequests',
    'showOnlineStatus',
    'dataAnalyticsOptIn',
    'thirdPartyDataSharing',
    'showPortfolioValue',
    'showLastSeen',
    'dataCollectionConsent',
    'analyticsConsent',
    'marketingConsent'
  ];
  
  booleanFields.forEach(field => {
    if (typeof settings[field] !== 'boolean') {
      errors[field] = `${field} must be a boolean value`;
    }
  });
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};