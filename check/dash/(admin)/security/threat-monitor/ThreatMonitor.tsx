// /src/app/(admin)/security/ThreatMonitor.tsx
'use client';

import { useEffect, useState } from 'react';

interface Threat {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high';
}

const ThreatMonitor = () => {
  const [threats, setThreats] = useState<Threat[]>([]);
  const [loading, setLoading] = useState(true);
  const isAuthenticated = false; // Mock auth check; replace with real logic

  useEffect(() => {
    if (!isAuthenticated) {
      console.log(`[${new Date().toISOString()}] Access denied: Not authenticated`);
      alert('Access denied. Please log in as an admin.');
      setLoading(false);
      return;
    }

    const fetchThreats = async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // Terminate after 2 seconds

      try {
        const response = await fetch('https://api.coindaily.online/mock-threats', {
          signal: controller.signal,
          cache: 'no-store',
        });
        if (!response.ok) throw new Error('Failed to fetch threat data');
        const data = await response.json();
        const enhancedThreats = data.map((threat: Threat) => ({
          ...threat,
          severity: detectThreatSeverity(threat.description),
        }));
        setThreats(enhancedThreats);
      } catch (error) {
        console.error(`[${new Date().toISOString()}] Error fetching threats:`, error);
        setThreats([]);
        alert('Failed to load threats. Please try again later.');
      } finally {
        setLoading(false);
        clearTimeout(timeoutId);
      }
    };

    fetchThreats();

    const interval = setInterval(fetchThreats, 10000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const detectThreatSeverity = (description: string): 'low' | 'medium' | 'high' => {
    const lowerDesc = description.toLowerCase();
    if (lowerDesc.includes('sql') || lowerDesc.includes('xss') || lowerDesc.includes('hack')) return 'high';
    if (lowerDesc.includes('ai prompt') || lowerDesc.includes('offensive')) return 'medium';
    return 'low';
  };

  if (loading) return <div className="min-h-screen bg-gray-100 p-4 text-center">Loading threats...</div>;
  if (!isAuthenticated) return <div className="min-h-screen bg-gray-100 p-4 text-center">Access Denied</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-6 lg:p-8">
      <h1 className="text-2xl md:text-3xl font-bold text-purple-800 text-center">Threat Monitor</h1>
      {threats.length > 0 ? (
        <ul className="mt-6 space-y-4">
          {threats.map((threat) => (
            <li key={threat.id} className={`bg-white p-4 rounded-lg shadow-md ${threat.severity === 'high' ? 'border-red-500' : ''}`}>
              <h2 className="text-lg font-semibold text-red-800">{threat.type}</h2>
              <p className="text-gray-600">{threat.description}</p>
              <p className="text-sm text-gray-500">
                {new Date(threat.timestamp).toLocaleTimeString()} | Severity: {threat.severity.toUpperCase()}
              </p>
              {threat.severity === 'high' && <p className="text-red-600 mt-1">AI Action: Blocked and logged 🚨</p>}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-6 text-gray-600 text-center">No threats detected.</p>
      )}
    </div>
  );
};

export default ThreatMonitor;

export const revalidate = 0; // No caching for real-time threat data