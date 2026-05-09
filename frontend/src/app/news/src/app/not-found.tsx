export default function NotFound() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-24 text-center">
      <h1 className="text-6xl font-display font-bold text-white mb-4">404</h1>
      <p className="text-xl text-gray-400 mb-8">The page you&apos;re looking for doesn&apos;t exist.</p>
      <a
        href="/"
        className="inline-block px-6 py-3 bg-primary-500 hover:bg-primary-600 text-dark-950 font-semibold rounded-lg transition-colors"
      >
        Back to Home
      </a>
    </div>
  );
}
