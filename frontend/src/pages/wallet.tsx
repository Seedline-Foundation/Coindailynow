/**
 * User Wallet Page
 * Main wallet interface for end users
 */

import React from 'react';
import { WalletDashboard } from '../components/wallet';
import Layout from '../components/Layout';

export default function WalletPage() {
  return (
    <Layout>
      <WalletDashboard />
    </Layout>
  );
}

