import LogoutPage from '@/components/auth/LogoutPage';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Logout | CoinDaily CMS',
  description: 'Secure admin logout from CoinDaily content management system.',
  robots: 'noindex, nofollow',
};

export default function AdminLogoutPage() {
  return <LogoutPage userType="admin" userName="Admin User" />;
}
