import { useEffect, useState } from 'react';

interface Memecoin {
  id: string;
  name: string;
  priceChange: number;
  marketCap: string;
}

const MemecoinHighlights = () => {
  const [memecoins, setMemecoins] = useState<Memecoin[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMemecoins = async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // Terminate after 2 seconds

      try {
        const response = await fetch('https://api.coindaily.online/mock-memecoins', {
          signal: controller.signal,
          cache: 'no-store', // Disable caching for real-time data
        });
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        setMemecoins(data);
      } catch (error) {
        console.error('Error fetching memecoins:', error);
        setMemecoins([]); // Fallback to empty state
      } finally {
        setLoading(false);
        clearTimeout(timeoutId);
      }
    };

    fetchMemecoins();
  }, []);

  if (loading) return <p className="text-gray-600">Loading trending memecoins...</p>;

  return memecoins.length > 0 ? (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <h2 className="text-lg font-semibold text-gray-900">Trending Memecoins</h2>
      <div className="overflow-hidden whitespace-nowrap mt-2">
        <div className="overflow-x-hidden whitespace-nowrap animate-scroll">
          {memecoins.map((coin) => (
            <span key={coin.id} className="mx-4 text-gray-600">
              <strong>{coin.name}</strong> - {coin.priceChange}% ({coin.marketCap})
            </span>
          ))}
        </div>
        {/*
          CSS for .animate-scroll (add to your global CSS or Tailwind config):
          .animate-scroll {
            animation: scroll-left 20s linear infinite;
          }
          @keyframes scroll-left {
            0% { transform: translateX(100%); }
            100% { transform: translateX(-100%); }
          }
        */}
      </div>
    </div>
  ) : (
    <p className="bg-white p-4 rounded-lg shadow-md text-gray-600">No trending memecoins available.</p>
  );
};

export default MemecoinHighlights;