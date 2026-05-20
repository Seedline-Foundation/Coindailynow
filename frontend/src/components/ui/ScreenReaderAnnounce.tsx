'use client';

import { useEffect, useState } from 'react';

interface Props {
  message: string;
  politeness?: 'polite' | 'assertive';
}

export default function ScreenReaderAnnounce({ message, politeness = 'polite' }: Props) {
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    setAnnouncement(message);
    const timer = setTimeout(() => setAnnouncement(''), 1000);
    return () => clearTimeout(timer);
  }, [message]);

  return (
    <div
      role="status"
      aria-live={politeness}
      aria-atomic="true"
      className="sr-only"
    >
      {announcement}
    </div>
  );
}
