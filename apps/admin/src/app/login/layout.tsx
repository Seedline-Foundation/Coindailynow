import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Staff Login | CoinDaily Admin',
  description: 'Secure staff login portal',
  robots: 'noindex, nofollow',
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
