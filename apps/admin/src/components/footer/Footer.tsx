import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 dark:border-gray-800 mt-12 py-8 bg-white dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 text-sm text-gray-500 dark:text-gray-400 flex flex-col sm:flex-row justify-between gap-4">
        <p>© {new Date().getFullYear()} CoinDaily. All rights reserved.</p>
        <div className="flex gap-4">
          <Link href="https://sygn.live/privacy" className="hover:text-gray-700 dark:hover:text-gray-200">
            Privacy
          </Link>
          <Link href="https://sygn.live/terms" className="hover:text-gray-700 dark:hover:text-gray-200">
            Terms
          </Link>
          <Link
            href="https://sygn.live/editorial-standards"
            className="hover:text-gray-700 dark:hover:text-gray-200"
          >
            Editorial Standards
          </Link>
        </div>
      </div>
    </footer>
  );
}
