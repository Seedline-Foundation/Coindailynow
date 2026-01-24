import { useEffect, useState } from 'react';

interface SocialPost {
  id: string;
  username: string;
  content: string;
  timestamp: string;
}

const SocialFeed = () => {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSocialFeed = async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // Terminate after 2 seconds

      try {
        const response = await fetch('https://api.coindaily.online/mock-social', {
          signal: controller.signal,
          cache: 'no-store', // Disable caching for real-time data
        });
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        setPosts(data);
      } catch (error) {
        console.error('Error fetching social feed:', error);
        setPosts([]); // Fallback to empty state
      } finally {
        setLoading(false);
        clearTimeout(timeoutId);
      }
    };

    fetchSocialFeed();
  }, []);

  if (loading) return <p className="text-gray-600">Loading social trends... 🚀</p>;

  return (
    <div className="bg-white p-4 rounded-lg shadow-md mt-6">
      <h2 className="text-lg font-semibold text-gray-900">Trending on Social 😂</h2>
      {posts.length > 0 ? (
        <ul className="mt-2 space-y-2">
          {posts.map((post) => (
            <li key={post.id} className="text-gray-600">
              <strong>@{post.username}</strong>: {post.content.replace(/fun|lol|wtf/gi, (match) => `${match} 😂`)} ({new Date(post.timestamp).toLocaleTimeString()}) 🌟
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-gray-600">No social trends available. 😕</p>
      )}
    </div>
  );
};

export default SocialFeed;