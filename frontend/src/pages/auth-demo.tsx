import { NextPage } from 'next';
import { useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import AuthModal with no SSR
const AuthModal = dynamic(() => import('../components/auth').then(mod => ({ default: mod.AuthModal })), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    </div>
  )
});

// Dynamically import AuthProvider with no SSR
const AuthProvider = dynamic(() => import('../components/auth').then(mod => ({ default: mod.AuthProvider })), {
  ssr: false
});

const AuthDemoPage: NextPage = () => {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  return (
    <AuthProvider>
      <div className="min-h-screen bg-gradient-to-br from-gold-50 to-earth-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gold-600 mb-4">
              CoinDaily Authentication Demo
            </h1>
            <p className="text-lg text-earth-700 mb-8">
              Experience our comprehensive authentication system with African mobile money integration
            </p>
          </div>

          {/* Demo Controls */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold text-earth-800 mb-6">Authentication Features</h2>
            
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-earth-700">Login Features</h3>
                <ul className="space-y-2 text-earth-600">
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-savanna-500 rounded-full mr-3"></span>
                    Email/Password authentication
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-savanna-500 rounded-full mr-3"></span>
                    Multi-factor authentication (MFA)
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-savanna-500 rounded-full mr-3"></span>
                    Password recovery workflows
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-savanna-500 rounded-full mr-3"></span>
                    Remember me functionality
                  </li>
                </ul>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium text-earth-700">Registration Features</h3>
                <ul className="space-y-2 text-earth-600">
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-african-500 rounded-full mr-3"></span>
                    Comprehensive form validation
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-african-500 rounded-full mr-3"></span>
                    Terms and privacy agreement
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-african-500 rounded-full mr-3"></span>
                    Newsletter subscription options
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-african-500 rounded-full mr-3"></span>
                    Age verification
                  </li>
                </ul>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-earth-700">African Integration</h3>
                <ul className="space-y-2 text-earth-600">
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-gold-500 rounded-full mr-3"></span>
                    M-Pesa mobile money integration
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-gold-500 rounded-full mr-3"></span>
                    Orange Money support
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-gold-500 rounded-full mr-3"></span>
                    MTN Money integration
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-gold-500 rounded-full mr-3"></span>
                    EcoCash support
                  </li>
                </ul>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium text-earth-700">Web3 Features</h3>
                <ul className="space-y-2 text-earth-600">
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-earth-500 rounded-full mr-3"></span>
                    MetaMask wallet connection
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-earth-500 rounded-full mr-3"></span>
                    WalletConnect support
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-earth-500 rounded-full mr-3"></span>
                    Multi-chain support
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-earth-500 rounded-full mr-3"></span>
                    Balance display
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Demo Buttons */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-semibold text-earth-800 mb-6">Try the Authentication System</h2>
            
            <div className="grid md:grid-cols-2 gap-4">
              <button
                onClick={() => {
                  setAuthMode('login');
                  setIsAuthOpen(true);
                }}
                className="bg-gradient-to-r from-savanna-500 to-savanna-600 text-white px-8 py-4 rounded-lg font-medium hover:from-savanna-600 hover:to-savanna-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Demo Login Modal
              </button>

              <button
                onClick={() => {
                  setAuthMode('register');
                  setIsAuthOpen(true);
                }}
                className="bg-gradient-to-r from-african-500 to-african-600 text-white px-8 py-4 rounded-lg font-medium hover:from-african-600 hover:to-african-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Demo Registration Modal
              </button>
            </div>

            <div className="mt-6 p-4 bg-gold-50 border border-gold-200 rounded-lg">
              <h4 className="font-medium text-gold-800 mb-2">Demo Instructions:</h4>
              <p className="text-gold-700 text-sm">
                Click either button above to open the authentication modal. The system includes comprehensive
                form validation, mobile money integration, MFA setup, and Web3 wallet connection capabilities.
                All forms are fully responsive and optimized for African mobile devices.
              </p>
            </div>
          </div>

          {/* Technical Details */}
          <div className="mt-8 bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-semibold text-earth-800 mb-6">Technical Implementation</h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <h4 className="font-medium text-earth-700">Frontend</h4>
                <ul className="text-sm text-earth-600 space-y-1">
                  <li>• React 18 with TypeScript</li>
                  <li>• Tailwind CSS styling</li>
                  <li>• Custom hooks for state</li>
                  <li>• Accessibility compliant</li>
                  <li>• Mobile-first responsive</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-earth-700">Validation</h4>
                <ul className="text-sm text-earth-600 space-y-1">
                  <li>• Real-time form validation</li>
                  <li>• Email format checking</li>
                  <li>• Password strength meter</li>
                  <li>• African phone validation</li>
                  <li>• Custom error messaging</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-earth-700">Security</h4>
                <ul className="text-sm text-earth-600 space-y-1">
                  <li>• JWT token management</li>
                  <li>• TOTP-based MFA</li>
                  <li>• Secure password hashing</li>
                  <li>• CSRF protection</li>
                  <li>• Rate limiting</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Authentication Modal */}
      <AuthModal 
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        initialMode={authMode}
      />
      </div>
    </AuthProvider>
  );
};export default AuthDemoPage;