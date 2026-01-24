'use client';

export default function Offline() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-gray-400 mb-4">📡</h1>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">You're Offline</h2>
          <p className="text-lg text-gray-600 mb-8">
            It looks like you've lost your internet connection. Don't worry, you can still browse some content we've cached for you.
          </p>
        </div>
        
        <div className="bg-white py-8 px-6 shadow rounded-lg">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Available Offline:</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Previously viewed articles
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Cached market data
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Saved content
                </li>
              </ul>
            </div>
            
            <div className="border-t pt-6">
              <button
                onClick={() => window.location.reload()}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            CoinDaily - Africa's Premier Cryptocurrency News Platform
          </p>
        </div>
      </div>
    </div>
  );
}
