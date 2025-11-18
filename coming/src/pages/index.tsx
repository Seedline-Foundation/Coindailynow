import React, { useState } from 'react';
import Head from 'next/head';
import { motion } from 'framer-motion';

interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const ComingSoonPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Launch date from environment variable
  const launchDate = new Date(process.env.NEXT_PUBLIC_LAUNCH_DATE || '2025-12-31T00:00:00');

  const [timeLeft, setTimeLeft] = React.useState<CountdownTime>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  React.useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = launchDate.getTime() - now;

      if (distance > 0) {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000)
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      const response = await fetch('/api/waitlist/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitStatus('success');
        setEmail('');
      } else {
        setSubmitStatus('error');
        setErrorMessage(data.error || 'Failed to subscribe. Please try again.');
      }
    } catch (error) {
      setSubmitStatus('error');
      setErrorMessage('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>CoinDaily - Coming Soon | Africa's Premier Crypto News Platform</title>
        <meta name="description" content="Africa's first AI-powered cryptocurrency and memecoin news platform. Join the waitlist for exclusive early access!" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="CoinDaily - Coming Soon" />
        <meta property="og:description" content="Africa's first AI-powered cryptocurrency and memecoin news platform. Join the waitlist!" />
        <meta property="og:image" content="/og-image.png" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="CoinDaily - Coming Soon" />
        <meta name="twitter:description" content="Africa's first AI-powered cryptocurrency and memecoin news platform. Join the waitlist!" />
        <meta name="twitter:image" content="/og-image.png" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-yellow-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" style={{ animationDelay: '2s' }}></div>
          <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" style={{ animationDelay: '4s' }}></div>
        </div>

        {/* Content */}
        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl w-full text-center"
          >
            {/* Logo */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="mb-8"
            >
              <h1 className="text-6xl md:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-purple-400 to-blue-400 mb-4">
                CoinDaily
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 font-light">
                Africa's Premier Cryptocurrency News Platform
              </p>
            </motion.div>

            {/* Tagline */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="mb-12"
            >
              <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto">
                AI-powered crypto news, real-time market insights, and memecoin analysis 
                tailored for African traders and investors.
              </p>
            </motion.div>

            {/* Countdown Timer */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="mb-12"
            >
              <h2 className="text-2xl text-gray-300 mb-6">Launching In</h2>
              <div className="grid grid-cols-4 gap-4 max-w-2xl mx-auto">
                {[
                  { label: 'Days', value: timeLeft.days },
                  { label: 'Hours', value: timeLeft.hours },
                  { label: 'Minutes', value: timeLeft.minutes },
                  { label: 'Seconds', value: timeLeft.seconds }
                ].map((item, index) => (
                  <div
                    key={item.label}
                    className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20"
                  >
                    <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                      {String(item.value).padStart(2, '0')}
                    </div>
                    <div className="text-sm text-gray-400 uppercase tracking-wider">
                      {item.label}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Email Signup */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.8 }}
              className="mb-12"
            >
              <h3 className="text-xl text-gray-300 mb-6">
                Get notified when we launch
              </h3>
              
              <form onSubmit={handleSubmit} className="max-w-md mx-auto">
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    disabled={isSubmitting || submitStatus === 'success'}
                    className="flex-1 px-6 py-4 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting || submitStatus === 'success'}
                    className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95"
                  >
                    {isSubmitting ? 'Joining...' : submitStatus === 'success' ? 'Joined!' : 'Join Waitlist'}
                  </button>
                </div>

                {submitStatus === 'success' && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 text-green-400 text-sm"
                  >
                    🎉 Success! You're on the list. We'll notify you at launch!
                  </motion.p>
                )}

                {submitStatus === 'error' && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 text-red-400 text-sm"
                  >
                    {errorMessage}
                  </motion.p>
                )}
              </form>

              <p className="mt-4 text-xs text-gray-500">
                We respect your privacy. Unsubscribe at any time.
              </p>
            </motion.div>

            {/* Features Preview */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.8 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto"
            >
              {[
                {
                  icon: '🤖',
                  title: 'AI-Powered News',
                  description: 'Real-time crypto news analyzed by advanced AI'
                },
                {
                  icon: '📊',
                  title: 'Market Insights',
                  description: 'Live data from African and global exchanges'
                },
                {
                  icon: '🌍',
                  title: 'Africa-First',
                  description: 'Tailored for African traders in 15 languages'
                }
              ].map((feature, index) => (
                <div
                  key={index}
                  className="bg-white/5 backdrop-blur-md rounded-lg p-6 border border-white/10"
                >
                  <div className="text-4xl mb-3">{feature.icon}</div>
                  <h4 className="text-lg font-semibold text-white mb-2">
                    {feature.title}
                  </h4>
                  <p className="text-sm text-gray-400">
                    {feature.description}
                  </p>
                </div>
              ))}
            </motion.div>

            {/* Social Links */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.8 }}
              className="mt-12"
            >
              <p className="text-gray-400 mb-4">Follow us for updates</p>
              <div className="flex justify-center gap-6">
                <a href="https://x.com/coindaily001" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors" aria-label="Follow us on X (Twitter)">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                <a href="https://t.me/coindailynewz" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors" aria-label="Join us on Telegram">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
                  </svg>
                </a>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 text-center pb-6">
          <p className="text-gray-500 text-sm">
            © 2025 CoinDaily. All rights reserved.
          </p>
        </div>
      </div>
    </>
  );
};

export default ComingSoonPage;
