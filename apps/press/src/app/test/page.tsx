'use client';

import { useState } from 'react';
import { Megaphone, Globe, Zap } from 'lucide-react';

export default function TestPage() {
  const [count, setCount] = useState(0);
  return (
    <div style={{ padding: '2rem', color: 'white', background: '#000', minHeight: '100vh' }}>
      <h1>Lucide Test</h1>
      <Megaphone style={{ width: 32, height: 32, color: 'gold' }} />
      <Globe style={{ width: 32, height: 32, color: 'blue' }} />
      <Zap style={{ width: 32, height: 32, color: 'yellow' }} />
      <p>Count: {count}</p>
      <button onClick={() => setCount(c => c + 1)} style={{ padding: '8px 16px', background: '#333', color: '#fff', border: 'none', cursor: 'pointer' }}>
        Increment
      </button>
    </div>
  );
}
