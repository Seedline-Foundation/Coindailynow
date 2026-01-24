/**
 * Admin Wallet Overview Page
 */

import React from 'react';
import { AdminWalletDashboard } from '../../../components/admin/wallet/AdminWalletDashboard';
import Layout from '../../../components/Layout';

export default function AdminWalletPage() {
  return (
    <Layout>
      <AdminWalletDashboard />
    </Layout>
  );
}

