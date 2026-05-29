'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TicketsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/user/help?tab=tickets');
  }, [router]);
  return (
    <div className="flex items-center justify-center min-h-[60vh] bg-[#0a0a0f]">
      <div className="text-gray-400">Redirecting to Help Center...</div>
    </div>
  );
}
