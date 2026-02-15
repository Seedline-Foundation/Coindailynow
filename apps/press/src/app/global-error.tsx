'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body style={{ padding: '40px', fontFamily: 'monospace', color: '#fff', background: '#0d0d12' }}>
        <h2 style={{ color: '#e69c0e' }}>Global Error Caught</h2>
        <pre style={{ 
          background: '#1a1b23', 
          padding: '20px', 
          borderRadius: '8px', 
          overflow: 'auto',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          border: '1px solid #42434b'
        }}>
          {error.message}
          {'\n\n'}
          {error.stack}
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
            marginTop: '16px',
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
