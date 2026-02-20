'use client';

import { useEffect } from 'react';
import { collectTrafficTelemetry } from '@/lib/trafficCop';

export default function TrafficCopClient() {
  useEffect(() => {
    void collectTrafficTelemetry();
  }, []);

  return null;
}
