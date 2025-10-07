// /src/app/(admin)/content-review/EditorPage.tsx
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import MemePicker from '@/components/editor/MemePicker';

const EditorPage = () => {
  const [content, setContent] = useState('');
  const [selectedMeme, setSelectedMeme] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const isAuthenticated = false; // Mock auth check; replace with real logic

  useEffect(() => {
    if (!isAuthenticated) {
      alert('Access denied. Please log in as an admin.');
      setLoading(false);
      return;
    }
    setLoading(false);
  }, [isAuthenticated]);

  if (loading) return <div className="min-h-screen bg-gray-100 p-4 text-center">Loading editor...</div>;
  if (!isAuthenticated) return <div className="min-h-screen bg-gray-100 p-4 text-center">Access Denied</div>;

  const handleMemeSelect = (meme: { id: string; title: string; url: string }) => {
    setSelectedMeme(meme.url);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-6 lg:p-8">
      <h1 className="text-2xl md:text-3xl font-bold text-purple-800 text-center">Content Editor</h1>
      <div className="mt-6 max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your article here..."
          className="w-full p-2 border rounded mb-4"
        />
        {selectedMeme && (
          <div className="mb-4">
            <Image src={selectedMeme} alt="Selected Meme" width={400} height={192} className="w-full h-48 object-cover rounded" />
          </div>
        )}
        <MemePicker onSelect={handleMemeSelect} />
        <button
          onClick={() => alert('Article saved (mock action)')}
          className="mt-4 bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
        >
          Save Article
        </button>
      </div>
    </div>
  );
};

export default EditorPage;

export const revalidate = 3600; // Cache for 1 hour