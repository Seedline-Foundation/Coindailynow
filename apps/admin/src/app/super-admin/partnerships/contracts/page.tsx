'use client';

import { FileSignature } from 'lucide-react';
import FunctionalPanelPage from '@/components/super-admin/FunctionalPanelPage';

export default function SuperAdminContractsPage() {
  return <FunctionalPanelPage section="partnerships" page="contracts" title="Contracts" description="Track contract terms, renewal windows, and compliance obligations." icon={FileSignature} accentClass="text-amber-400" />;
}
