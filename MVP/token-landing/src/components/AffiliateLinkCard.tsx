'use client';

import { useState } from 'react';
import { 
  LinkIcon, 
  ClipboardDocumentIcon,
  CheckIcon 
} from '@heroicons/react/24/outline';

interface AffiliateLinkCardProps {
  affiliateCode: string;
  affiliateLink: string;
}

export default function AffiliateLinkCard({ affiliateCode, affiliateLink }: AffiliateLinkCardProps) {
  const [copied, setCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(affiliateLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(affiliateCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  };

  return (
    <div className="bg-gradient-to-br from-primary-600/20 to-accent-600/20 border border-primary-500/50 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <LinkIcon className="w-6 h-6 text-primary-400" />
        <h3 className="text-xl font-bold text-white">Your Affiliate Link</h3>
      </div>

      {/* Affiliate Code */}
      <div className="mb-4">
        <p className="text-sm text-gray-400 mb-2">Affiliate Code</p>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-black/50 rounded-lg px-4 py-3 font-mono text-white">
            {affiliateCode}
          </div>
          <button
            onClick={handleCopyCode}
            className="bg-gray-800 hover:bg-gray-700 text-white p-3 rounded-lg transition-colors"
            title="Copy code"
          >
            {codeCopied ? (
              <CheckIcon className="w-5 h-5 text-green-400" />
            ) : (
              <ClipboardDocumentIcon className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Affiliate Link */}
      <div>
        <p className="text-sm text-gray-400 mb-2">Share this link</p>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-black/50 rounded-lg px-4 py-3 font-mono text-sm text-white overflow-x-auto whitespace-nowrap">
            {affiliateLink}
          </div>
          <button
            onClick={handleCopyLink}
            className={`${
              copied 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-primary-600 hover:bg-primary-700'
            } text-white px-4 py-3 rounded-lg transition-colors font-bold whitespace-nowrap`}
          >
            {copied ? (
              <span className="flex items-center gap-2">
                <CheckIcon className="w-5 h-5" />
                Copied!
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <ClipboardDocumentIcon className="w-5 h-5" />
                Copy Link
              </span>
            )}
          </button>
        </div>
      </div>

      <p className="text-xs text-gray-500 mt-4">
        Share this link on social media, blogs, or with friends to earn rewards for every presale buyer you refer!
      </p>
    </div>
  );
}
