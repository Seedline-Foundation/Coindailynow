import { useEffect, useState } from 'react';

interface Opportunity {
  id: string;
  title: string;
  description: string;
  deadline: string;
}

const QuickOpportunities = () => {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOpportunities = async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // Terminate after 2 seconds

      try {
        const response = await fetch('https://api.coindaily.online/mock-opportunities', {
          signal: controller.signal,
          cache: 'no-store', // Disable caching for real-time data
        });
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        setOpportunities(data);
      } catch (error) {
        console.error('Error fetching opportunities:', error);
        setOpportunities([]); // Fallback to empty state
      } finally {
        setLoading(false);
        clearTimeout(timeoutId);
      }
    };

    fetchOpportunities();
  }, []);

  if (loading) return <p className="text-gray-600">Loading opportunities...</p>;

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <h2 className="text-lg font-semibold text-gray-900">Quick Opportunities</h2>
      {opportunities.length > 0 ? (
        <ul className="mt-2 space-y-2">
          {opportunities.map((opp) => (
            <li key={opp.id} className="text-gray-600">
              <strong>{opp.title}</strong> - {opp.description} (Deadline: {new Date(opp.deadline).toLocaleDateString()})
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-gray-600">No opportunities available.</p>
      )}
    </div>
  );
};

export default QuickOpportunities;