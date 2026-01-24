import LoginPage from '@/components/auth/LoginPage';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Login | CoinDaily CMS',
  description: 'Secure admin portal access for CoinDaily content management system.',
  robots: 'noindex, nofollow',
};

export default function AdminLoginPage() {
  return <LoginPage type="admin" />;
}
