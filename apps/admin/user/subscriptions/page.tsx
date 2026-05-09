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
}

export default function AdminUserSubscriptionsPage() {
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  const load = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_access_token') || localStorage.getItem('auth_token');
      const userId = new URLSearchParams(window.location.search).get('userId');
      if (!token || !userId) throw new Error('Missing admin token or userId in URL');

      const response = await fetch(`${apiBase}/graphql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: `
            query AdminUserDashboard($userId: ID!) {
              adminUserDashboard(userId: $userId) {
                subscription {
                  id
                  status
                  currentPeriodStart
                  currentPeriodEnd
                  cancelAtPeriodEnd
                  cancelledAt
                  planName
                }
              }
            }
          `,
          variables: { userId },
        }),
      });
      const json = await response.json();
      if (json.errors?.length) throw new Error(json.errors[0].message);
      setSubscription(json.data?.adminUserDashboard?.subscription || null);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load subscription');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const cancelSubscription = async () => {
    const token = localStorage.getItem('admin_access_token') || localStorage.getItem('auth_token');
    const userId = new URLSearchParams(window.location.search).get('userId');
    if (!token || !userId) return;
    setActionLoading(true);
    try {
      const response = await fetch(`${apiBase}/graphql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: `
            mutation AdminCancelUserSubscription($userId: ID!, $reason: String) {
              adminCancelUserSubscription(userId: $userId, reason: $reason)
            }
          `,
          variables: { userId, reason: cancelReason || null },
        }),
      });
      const json = await response.json();
      if (json.errors?.length) throw new Error(json.errors[0].message);
      await load();
    } catch (err: any) {
      setError(err.message || 'Failed to cancel subscription');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="h-28 bg-dark-800 rounded-xl animate-pulse" />;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-display font-bold text-white">User Subscription (Admin Mirror)</h1>
      {error && <div className="text-red-400 text-sm">{error}</div>}
      {!subscription ? (
        <div className="bg-dark-900 border border-dark-700 rounded-xl p-6 text-dark-300">
          No subscription found for this user.
        </div>
      ) : (
        <div className="bg-dark-900 border border-dark-700 rounded-xl p-6 space-y-3">
          <p className="text-sm text-dark-300">Plan: <span className="text-white">{subscription.planName || 'Unknown'}</span></p>
          <p className="text-sm text-dark-300">Status: <span className="text-white">{subscription.status}</span></p>
          <p className="text-sm text-dark-300">Period: <span className="text-white">{new Date(subscription.currentPeriodStart).toLocaleDateString()} - {new Date(subscription.currentPeriodEnd).toLocaleDateString()}</span></p>
          <p className="text-sm text-dark-300">Cancel at period end: <span className="text-white">{subscription.cancelAtPeriodEnd ? 'Yes' : 'No'}</span></p>

          <div className="pt-4 border-t border-dark-700 space-y-2">
            <label className="text-xs text-dark-400">Cancel reason (optional)</label>
            <input
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full px-3 py-2 bg-dark-800 border border-dark-600 rounded-lg text-sm text-white"
              placeholder="Policy violation, abusive behavior, etc."
            />
            <button
              onClick={cancelSubscription}
              disabled={actionLoading}
              className="px-4 py-2 rounded-lg text-sm bg-red-600 hover:bg-red-700 text-white disabled:opacity-60"
            >
              {actionLoading ? 'Cancelling...' : 'Cancel Subscription'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
