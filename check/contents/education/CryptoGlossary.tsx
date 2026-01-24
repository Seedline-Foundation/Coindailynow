// /src/components/education/CryptoGlossary.tsx
'use client';

import { useEffect, useState } from 'react';

interface GlossaryTerm {
  id: string;
  term: string;
  definition: string;
}

const CryptoGlossary = () => {
  const [terms, setTerms] = useState<GlossaryTerm[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGlossary = async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // Terminate after 2 seconds

      try {
        const response = await fetch('https://api.coindaily.online/mock-glossary', {
          signal: controller.signal,
          cache: 'no-store',
        });
        if (!response.ok) throw new Error('Failed to fetch glossary');
        const data = await response.json();
        setTerms(data);
      } catch (error) {
        console.error(`[${new Date().toISOString()}] Error fetching glossary:`, error);
        setTerms([]);
        alert('Failed to load glossary. Please try again.');
      } finally {
        setLoading(false);
        clearTimeout(timeoutId);
      }
    };

    fetchGlossary();
  }, []);

  const filteredTerms = terms.filter((term) =>
    term.term.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="min-h-screen bg-gray-100 p-4 text-center">Loading glossary...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-6 lg:p-8">
      <h1 className="text-2xl md:text-3xl font-bold text-purple-800 text-center">Crypto Glossary</h1>
      <div className="mt-6 max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search terms..."
          className="w-full p-2 border rounded mb-4"
        />
        {filteredTerms.length > 0 ? (
          <ul className="space-y-4">
            {filteredTerms.map((term) => (
              <li key={term.id} className="p-4 bg-gray-50 rounded">
                <h2 className="text-lg font-semibold text-gray-900">{term.term}</h2>
                <p className="text-gray-600 mt-1">{term.definition}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-600 text-center">No terms found.</p>
        )}
      </div>
    </div>
  );
};

export default CryptoGlossary;