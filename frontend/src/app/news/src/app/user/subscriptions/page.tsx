'use client';

import { useEffect, useState } from 'react';

interface SubscriptionStatus {
  id: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  cancelledAt?: string | null;
  planName?: string | null;
  planDescription?: string | null;
}

export default function SubscriptionsPage() {
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token =
      localStorage.getItem('auth_token') ||
      localStorage.getItem('accessToken') ||
      localStorage.getItem('token');
    if (!token) {
      setError('Please sign in to view subscriptions.');
      setLoading(false);
      return;
    }

    fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000') + '/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        query: `
          query MySubscriptionStatus {
            mySubscriptionStatus {
              id
              status
              currentPeriodStart
              currentPeriodEnd
              cancelAtPeriodEnd
              cancelledAt
              planName
              planDescription
            }
          }
        `,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.errors?.length) throw new Error(data.errors[0].message);
        setSubscription(data.data?.mySubscriptionStatus || null);
      })
      .catch((err) => setError(err.message || 'Failed to load subscription'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="h-32 bg-dark-800 rounded-xl animate-pulse" />;
  if (error) return <div className="text-red-400">{error}</div>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-display font-bold text-white">Subscriptions</h1>
      {!subscription ? (
        <div className="bg-dark-900 border border-dark-700 rounded-xl p-6 text-gray-400">
          You do not have an active subscription yet.
        </div>
      ) : (
        <div className="bg-dark-900 border border-dark-700 rounded-xl p-6 space-y-3">
          <p className="text-sm text-gray-400">
            Plan: <span className="text-white font-medium">{subscription.planName || 'Premium'}</span>
          </p>
          <p className="text-sm text-gray-400">
            Status: <span className="text-white font-medium">{subscription.status}</span>
          </p>
          <p className="text-sm text-gray-400">
            Current period: <span className="text-white">{new Date(subscription.currentPeriodStart).toLocaleDateString()} - {new Date(subscription.currentPeriodEnd).toLocaleDateString()}</span>
          </p>
          <p className="text-sm text-gray-400">
            Cancel at period end: <span className="text-white">{subscription.cancelAtPeriodEnd ? 'Yes' : 'No'}</span>
          </p>
        </div>
      )}
    </div>
  );
}
