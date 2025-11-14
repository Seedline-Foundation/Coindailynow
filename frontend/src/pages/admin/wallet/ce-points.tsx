/**
 * Admin CE Points Manager Page
 */

import React from 'react';
import { CEPointsManager } from '../../../components/admin/wallet/CEPointsManager';
import Layout from '../../../components/Layout';

export default function CEPointsPage() {
  return (
    <Layout>
      <CEPointsManager />
    </Layout>
  );
}

