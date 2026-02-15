'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App Error:', error);
  }, [error]);

  return (
    <div style={{ padding: '40px', fontFamily: 'monospace', color: '#fff', background: '#0d0d12', minHeight: '100vh' }}>
      <h2 style={{ color: '#e69c0e', marginBottom: '16px' }}>Something went wrong!</h2>
      <pre style={{ 
        background: '#1a1b23', 
        padding: '20px', 
        borderRadius: '8px', 
        overflow: 'auto',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        marginBottom: '20px',
        border: '1px solid #42434b'
      }}>
        <strong>Error:</strong> {error.message}
        {'\n\n'}
        <strong>Stack:</strong> {error.stack}
        {error.digest && `\n\nDigest: ${error.digest}`}
      </pre>
      <button
        onClick={() => reset()}
        style={{
          padding: '10px 20px',
          background: '#e69c0e',
          color: '#0d0d12',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontWeight: 'bold',
        }}
      >
        Try again
      </button>
    </div>
  );
}
