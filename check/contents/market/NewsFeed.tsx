import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchNews, clearError } from '../../store/slices/newsSlice';

const NewsFeed = () => {
  const dispatch = useAppDispatch();
  const { items: news, loading, error } = useAppSelector((state) => state.news);

  useEffect(() => {
    // Fetch news on component mount
    dispatch(fetchNews('memecoin'));
  }, [dispatch]);

  useEffect(() => {
    // Clear error after 5 seconds
    if (error) {
      const timeout = setTimeout(() => {
        dispatch(clearError());
      }, 5000);
      return () => clearTimeout(timeout);
    }
  }, [error, dispatch]);

  if (loading) return <p className="text-gray-600">Loading latest memecoin news...</p>;

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <h2 className="text-lg font-semibold text-gray-900">Live Memecoin Updates</h2>
      {error && (
        <div className="mt-2 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
          Error: {error}
        </div>
      )}
      {news.length > 0 ? (
        <ul className="mt-2 space-y-2">
          {news.map((item) => (
            <li key={item.id} className="text-gray-600">
              <strong>{item.title}</strong> - {item.summary} ({new Date(item.timestamp).toLocaleTimeString()})
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-gray-600">No updates available.</p>
      )}
    </div>
  );
};

export default NewsFeed;