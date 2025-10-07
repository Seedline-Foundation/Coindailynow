'use client';

export const dynamic = 'force-dynamic';

import TwoFactorVerification from '@/components/admin/security/TwoFactorVerification';

export default function TwoFactorPage() {
  // In a real app, you would get these from your authentication context or API
  const mockProps = {
    email: 'admin@coindaily.com',
    onVerificationSuccess: () => {
      console.log('2FA verification successful');
    },
    onBackToLogin: () => {
      console.log('Back to login');
    },
    isVisible: true
  };

  return <TwoFactorVerification {...mockProps} />;
}
