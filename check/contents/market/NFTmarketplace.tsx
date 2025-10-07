// /src/components/market/NFTMarketplace.tsx
'use client';

import { useEffect, useState } from 'react';

interface NFTItem {
  id: string;
  name: string;
  price: number;
  owner: string;
  timestamp: string;
}

const NFTMarketplace = () => {
  const [nfts, setNfts] = useState<NFTItem[]>([]);
  const [loading, setLoading] = useState(true);
  const isAuthenticated = !!localStorage.getItem('isLoggedIn'); // Mock auth check

  useEffect(() => {
    const fetchNFTs = async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // Terminate after 2 seconds

      try {
        const response = await fetch('https://api.coindaily.online/mock-nfts', {
          signal: controller.signal,
          cache: 'no-store',
        });
        if (!response.ok) throw new Error('Failed to fetch NFTs');
        const data = await response.json();
        setNfts(data);
      } catch (error) {
        console.error(`[${new Date().toISOString()}] Error fetching NFTs:`, error);
        setNfts([]);
        alert('Failed to load NFTs. Please try again.');
      } finally {
        setLoading(false);
        clearTimeout(timeoutId);
      }
    };

    fetchNFTs();

    const interval = setInterval(fetchNFTs, 15000); // Refresh every 15 seconds
    return () => clearInterval(interval);
  }, []);

  const handleBuyNFT = (id: string) => {
    if (!isAuthenticated) {
      alert('Please log in to buy an NFT.');
      return;
    }
    setNfts((prev) => prev.filter((nft) => nft.id !== id));
    alert(`NFT with ID ${id} purchased (mock action)`);
  };

  if (loading) return <div className="p-4 text-center">Loading NFT marketplace...</div>;
  if (!isAuthenticated) return <div className="p-4 text-center">Please log in to access the NFT marketplace.</div>;

  return (
    <div className="bg-white p-4 rounded-lg shadow-md mt-4">
      <h2 className="text-lg font-semibold text-gray-900">NFT Marketplace 🎨</h2>
      {nfts.length > 0 ? (
        <ul className="mt-2 space-y-4">
          {nfts.map((nft) => (
            <li key={nft.id} className="p-4 bg-gray-50 rounded">
              <p><strong>Name:</strong> {nft.name}</p>
              <p><strong>Price:</strong> ${nft.price.toFixed(2)}</p>
              <p><strong>Owner:</strong> {nft.owner}</p>
              <p className="text-sm text-gray-500">Listed: {new Date(nft.timestamp).toLocaleDateString()}</p>
              <button
                onClick={() => handleBuyNFT(nft.id)}
                className="mt-2 bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700"
              >
                Buy Now
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-gray-600 text-center">No NFTs available for purchase.</p>
      )}
    </div>
  );
};

export default NFTMarketplace;