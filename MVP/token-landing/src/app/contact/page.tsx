'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { EnvelopeIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-black py-20">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="gradient-text">Get In Touch</span>
          </h1>
          <p className="text-xl text-gray-300">
            Connect with the CoinDaily team and join our community
          </p>
        </motion.div>

        {/* Contact Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {/* Telegram */}
          <motion.a
            href="https://t.me/CoindailyNewz"
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="bg-gradient-to-br from-blue-600/20 to-blue-400/20 border-2 border-blue-500 rounded-2xl p-8 hover:scale-105 transition-transform group"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-3xl">
                📱
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">Telegram</h3>
                <p className="text-blue-300">Join our community</p>
              </div>
            </div>
            <p className="text-gray-300 mb-4">
              Get instant support, discuss crypto news, and connect with 50K+ members in our Telegram group.
            </p>
            <div className="text-blue-400 font-mono font-bold text-lg group-hover:text-blue-300 transition-colors">
              @CoindailyNewz
            </div>
          </motion.a>

          {/* Twitter/X */}
          <motion.a
            href="https://twitter.com/Coindaily001"
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="bg-gradient-to-br from-gray-700/20 to-gray-500/20 border-2 border-gray-400 rounded-2xl p-8 hover:scale-105 transition-transform group"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center text-3xl">
                𝕏
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">X (Twitter)</h3>
                <p className="text-gray-300">Follow for updates</p>
              </div>
            </div>
            <p className="text-gray-300 mb-4">
              Stay updated with breaking crypto news, market analysis, and exclusive insights on X.
            </p>
            <div className="text-gray-300 font-mono font-bold text-lg group-hover:text-white transition-colors">
              @Coindaily001
            </div>
          </motion.a>
        </div>

        {/* Email Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="bg-gray-900 border border-gray-800 rounded-2xl p-8 mb-8"
        >
          <div className="flex items-center gap-4 mb-6">
            <EnvelopeIcon className="w-12 h-12 text-primary-500" />
            <div>
              <h3 className="text-2xl font-bold text-white">Email Us</h3>
              <p className="text-gray-400">For business inquiries and partnerships</p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-500 mb-2">Partnerships & Advertising</p>
              <a
                href="mailto:partnerships@coindaily.online"
                className="text-primary-400 hover:text-primary-300 font-mono text-lg transition-colors"
              >
                partnerships@coindaily.online
              </a>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-2">Career Opportunities</p>
              <a
                href="mailto:careers@coindaily.online"
                className="text-accent-400 hover:text-accent-300 font-mono text-lg transition-colors"
              >
                careers@coindaily.online
              </a>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-2">Press & Media</p>
              <a
                href="mailto:press@coindaily.online"
                className="text-primary-400 hover:text-primary-300 font-mono text-lg transition-colors"
              >
                press@coindaily.online
              </a>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-2">General Support</p>
              <a
                href="mailto:support@coindaily.online"
                className="text-accent-400 hover:text-accent-300 font-mono text-lg transition-colors"
              >
                support@coindaily.online
              </a>
            </div>
          </div>
        </motion.div>

        {/* Office Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="bg-gradient-to-br from-primary-600/20 to-accent-600/20 border border-primary-500/50 rounded-2xl p-8"
        >
          <div className="flex items-center gap-4 mb-6">
            <ChatBubbleLeftRightIcon className="w-12 h-12 text-primary-500" />
            <div>
              <h3 className="text-2xl font-bold text-white">Response Time</h3>
              <p className="text-gray-400">We're here to help</p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold gradient-text mb-2">&lt; 1 hour</div>
              <p className="text-gray-400">Telegram Support</p>
            </div>
            <div>
              <div className="text-3xl font-bold gradient-text mb-2">24 hours</div>
              <p className="text-gray-400">Email Response</p>
            </div>
            <div>
              <div className="text-3xl font-bold gradient-text mb-2">24/7</div>
              <p className="text-gray-400">Community Active</p>
            </div>
          </div>
        </motion.div>

        {/* Back to Home */}
        <div className="text-center mt-12">
          <Link href="/" className="inline-block bg-gray-800 hover:bg-gray-700 text-white px-8 py-4 rounded-full font-bold transition-all">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
