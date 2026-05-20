'use client';

import { redirect } from 'next/navigation';

export default function Page() {
  const parentPath = '/super-admin/' + '${dir}'.split('/')[0];
  redirect(parentPath);
}
