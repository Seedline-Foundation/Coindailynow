'use client';

export default function NewsletterForm() {
  return (
    <form className="space-y-2" onSubmit={(e) => e.preventDefault()}>
      <input
        type="email"
        placeholder="your@email.com"
        className="w-full px-3 py-2 bg-dark-800 border border-dark-700 rounded-lg text-sm text-white placeholder-gray-500 focus:border-primary-400 focus:outline-none"
      />
      <button
        type="submit"
        className="w-full py-2 bg-primary-500 hover:bg-primary-600 text-dark-950 text-sm font-semibold rounded-lg transition-colors"
      >
        Subscribe
      </button>
    </form>
  );
}
