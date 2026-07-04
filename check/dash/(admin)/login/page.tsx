import LoginPage from '@/components/auth/LoginPage';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Login | Sygn CMS',
  description: 'Secure admin portal access for Sygn content management system.',
  robots: 'noindex, nofollow',
};

export default function AdminLoginPage() {
  return <LoginPage type="admin" />;
}
