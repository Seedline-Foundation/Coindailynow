'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  DocumentTextIcon, 
  VideoCameraIcon, 
  ChatBubbleLeftRightIcon,
  CodeBracketIcon,
  UsersIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface Bounty {
  id: string;
  category: string;
  title: string;
  description: string;
  reward: string;
  rewardRange: string;
  stakingRequired: string;
  vestingSchedule: string;
  icon: any;
  tasks: string[];
  isTaken: boolean;
  totalSlots?: number;
  claimedSlots?: number;
}

export default function BountyPage() {
  const [selectedBounty, setSelectedBounty] = useState<Bounty | null>(null);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [userClaims, setUserClaims] = useState<string[]>([]);
  const [claimMethod, setClaimMethod] = useState<'discord' | 'twitter' | 'telegram' | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [socialVerified, setSocialVerified] = useState(false);
  const [selectedSubmitBounty, setSelectedSubmitBounty] = useState('');
  const [submissionProof, setSubmissionProof] = useState('');
  const [submissionNotes, setSubmissionNotes] = useState('');

  // Load user's claims from localStorage
  useEffect(() => {
    const claims = localStorage.getItem('userBountyClaims');
    if (claims) {
      setUserClaims(JSON.parse(claims));
    }
  }, []);

  const bounties: Bounty[] = [
    {
      id: 'content-creation',
      category: 'Content Creation',
      title: 'News & Educational Material',
      description: 'Produce high-quality articles, videos, or infographics on African crypto news, blockchain tutorials, or Coindaily features. Submit via DAO with metrics (views >1,000, shares >200).',
      reward: '1,000-10,000 JY',
      rewardRange: '1,000 JY per submission that meets metrics. Accepted research submissions: 5,000 JY (top 20/month receive 10,000 JY bonus)',
      stakingRequired: 'Stake at least 15,000 JY for 4 months minimum in Whale Prison (90% APY eligible). 1.5x multiplier for sinkhole stakers. Non-stakers ineligible.',
      vestingSchedule: '0% upfront; 4-month cliff + 12-month linear. Full vest accelerates by 25% if content achieves 5,000+ engagements.',
      icon: DocumentTextIcon,
      tasks: [
        'Submit via DAO with metrics (views >1,000, shares >200)',
        'Research on crypto and blockchain requires admin approval for topic',
        'Original content only - no plagiarism'
      ],
      isTaken: false,
      totalSlots: undefined,
      claimedSlots: 47
    },
    {
      id: 'meme-marketing',
      category: 'Meme & Viral Marketing',
      title: 'Viral Content Creation',
      description: 'Create and distribute memes, short-form videos, or social campaigns promoting JY or Coindaily. Track via X impressions (>10,000 views).',
      reward: '1,500-5,000 JY',
      rewardRange: '1,500 JY per entry (monthly winners get 5,000 JY). Total pool: 50,000 JY.',
      stakingRequired: 'Stake 10,000 JY for 3 months in Whale Prison. 2x rewards for OGs with proven prior traction (DAO-verified).',
      vestingSchedule: '10% upfront if staked; 3-month cliff + 9-month linear. Unvested portion burns if no follow-up activity.',
      icon: VideoCameraIcon,
      tasks: [
        'Track via X impressions or viral score (>10,000 views)',
        'Emphasize scarcity narratives and platform utility',
        'Tag @JYToken and use #CoinDaily'
      ],
      isTaken: false,
      totalSlots: undefined,
      claimedSlots: 89
    },
    {
      id: 'shilling-ama',
      category: 'Shilling & Community AMAs',
      title: 'Community Building & AMAs',
      description: 'Host or participate in AMAs, tweet threads, or referral drives to onboard users (>500 referrals). Use on-chain referral codes for tracking.',
      reward: '3,000-8,000 JY',
      rewardRange: '3,000 JY per event (8,000 JY for AMA with 2,000 attendees). Total pool: 100,000 JY. Bonuses: 7,000 JY for top referrers.',
      stakingRequired: 'OG presale holders priority first 6 months; stake 10,000 JY for 5 months. 2.5x APY boost in Whale Prison for high-impact shillers.',
      vestingSchedule: '15% at approval (staked only); 6-month cliff + 15-month linear. Tied to sustained traction (20% clawback if referrals inactive).',
      icon: ChatBubbleLeftRightIcon,
      tasks: [
        'Use on-chain referral codes for tracking',
        'Target crypto communities in Africa and beyond',
        'Submit AMA recording or thread screenshot'
      ],
      isTaken: false,
      totalSlots: undefined,
      claimedSlots: 34
    },
    {
      id: 'liquidity-farming',
      category: 'Liquidity Farming',
      title: 'LP Pair Contributions',
      description: 'Provide liquidity to secondary pairs (JY/ETH, JY/BNB, JY/POL, JY/USDT) with minimum 2-year locks. Submit proof via on-chain transactions.',
      reward: '5,000-10,000 JY',
      rewardRange: '5,000 JY per qualifying farm (10,000 JY for >$10,000 TVL added). Total pool: 100,000 JY.',
      stakingRequired: 'Stake 20,000 JY for 6 months in sinkhole or Whale Prison. 2.5x multiplier for permanent locks.',
      vestingSchedule: '0% upfront; 6-month cliff + 18-month linear. Accelerates by 50% if TVL milestone ($1 million) hit.',
      icon: CurrencyDollarIcon,
      tasks: [
        'Submit proof via on-chain transactions',
        'Minimum $5,000 TVL contribution',
        'Lock for 2+ years'
      ],
      isTaken: false,
      totalSlots: undefined,
      claimedSlots: 18
    },
    {
      id: 'bug-hunts',
      category: 'Bug Hunts & Technical',
      title: 'Technical Improvements',
      description: 'Report vulnerabilities in Coindaily MVP, suggest code enhancements, or contribute SDK integrations/PRs on GitHub. Prioritize AI data tools, crypto tools, bots, news tools or news distribution.',
      reward: '1,500-8,000 JY',
      rewardRange: '1,500 JY per valid contribution (8,000 JY for critical bug fix). Total pool: 50,000 JY.',
      stakingRequired: 'Stake 5,000 JY for 4 months. Tech-focused OGs get 2x rewards if in top 40 stakers.',
      vestingSchedule: '20% upfront for critical issues; 9-month cliff + 12-month linear. Full vest upon implementation verification.',
      icon: CodeBracketIcon,
      tasks: [
        'Submit detailed bug report or PR on GitHub',
        'Prioritize features like AI data tools, crypto tools, bots, news tools or news distribution',
        'Follow responsible disclosure for security issues'
      ],
      isTaken: false,
      totalSlots: undefined,
      claimedSlots: 12
    },
    {
      id: 'partnership-building',
      category: 'Partnership & Ecosystem',
      title: 'Partnership Building',
      description: 'Secure affiliations with top and medium traffic crypto/AI/Blockchain/Finance sites (1000 sites with real verified contacts). Track growth metrics. Affiliation means platforms willing to onboard on our network (free to join, we earn 3.7%-7% of their fees).',
      reward: '3,000-5,000 JY',
      rewardRange: '3,000 JY per milestone (2,000 JY per 1,000 sites). Total pool: 20,000 JY.',
      stakingRequired: 'Stake 5,000 JY for 6 months in LP farming pools. Priority for OGs with referral history.',
      vestingSchedule: '0% upfront; 5-month cliff + 18-month linear. DAO extensions if growth doubles quarterly.',
      icon: UsersIcon,
      tasks: [
        'Track growth metrics (member count, engagement)',
        'Secure partnerships with real verified crypto/AI/Blockchain/Finance sites',
        'Submit partnership agreements or community stats'
      ],
      isTaken: false,
      totalSlots: undefined,
      claimedSlots: 6
    },
    {
      id: 'dune-analytics',
      category: 'Analytics',
      title: 'Dune Analytics Tracking',
      description: 'Track on-chain metrics like TVL, protocol revenue, trading volume, active users, and governance participation.',
      reward: '10,000 JY',
      rewardRange: '10,000 JY + staking benefits',
      stakingRequired: 'Same as others',
      vestingSchedule: 'Standard vesting schedule applies',
      icon: DocumentTextIcon,
      tasks: [
        'Build comprehensive Dune dashboard',
        'Track all key on-chain metrics',
        'Update dashboard weekly'
      ],
      isTaken: true, // This one is taken
      totalSlots: 1,
      claimedSlots: 1
    },
    {
      id: 'google-sheets',
      category: 'Analytics',
      title: 'Google Sheets Tracking',
      description: 'Track off-chain and blended data: token price, market cap, social sentiment, community growth, and ROI tracking.',
      reward: '10,000 JY',
      rewardRange: '10,000 JY + staking benefits',
      stakingRequired: 'Same as others',
      vestingSchedule: 'Standard vesting schedule applies',
      icon: DocumentTextIcon,
      tasks: [
        'Maintain comprehensive Google Sheets tracker',
        'Track market data via APIs',
        'Update metrics daily'
      ],
      isTaken: true, // This one is taken
      totalSlots: 1,
      claimedSlots: 1
    }
  ];

  const handleClaim = (bounty: Bounty) => {
    if (bounty.isTaken || userClaims.includes(bounty.id)) {
      return;
    }
    setSelectedBounty(bounty);
    setShowClaimModal(true);
    setAcceptedTerms(false);
    setSocialVerified(false);
    setClaimMethod(null);
  };

  const handleSocialAuth = async (method: 'discord' | 'twitter' | 'telegram') => {
    setClaimMethod(method);
    
    // In production, this would:
    // 1. Open OAuth flow for the selected platform
    // 2. Verify user's identity
    // 3. Check if user already claimed this bounty
    // 4. Record browser fingerprint and IP
    
    // Simulate authentication
    const confirmed = confirm(`Authenticate with ${method.charAt(0).toUpperCase() + method.slice(1)}?\n\nThis will:\n- Verify your account\n- Check if you've already claimed this bounty\n- Record your claim to prevent duplicates`);
    
    if (confirmed) {
      setSocialVerified(true);
      alert(`✓ ${method.charAt(0).toUpperCase() + method.slice(1)} account verified!`);
    }
  };

  const confirmClaim = () => {
    if (!selectedBounty || !socialVerified || !acceptedTerms) {
      alert('Please authenticate your social account and accept the terms to continue.');
      return;
    }
    
    // Add to user's claims
    const newClaims = [...userClaims, selectedBounty.id];
    setUserClaims(newClaims);
    localStorage.setItem('userBountyClaims', JSON.stringify(newClaims));
    
    // In production, this would:
    // 1. Record claim in backend with social account ID
    // 2. Store browser fingerprint and IP address
    // 3. Check for duplicate attempts
    // 4. Send confirmation email/DM
    
    alert(`Bounty claimed successfully via ${claimMethod}!\n\nYou can now submit your work through the dashboard.`);
    setShowClaimModal(false);
    setSelectedBounty(null);
    setClaimMethod(null);
    setAcceptedTerms(false);
    setSocialVerified(false);
  };

  const handleSubmitWork = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedSubmitBounty || !submissionProof) {
      alert('Please select a bounty and provide proof link');
      return;
    }

    // In production, this would:
    // 1. Submit to backend with IP and browser fingerprint
    // 2. Track submission by user's social account
    // 3. Queue for DAO review
    
    alert('Submission received! It will be reviewed by the DAO.');
    setShowSubmitModal(false);
    setSelectedSubmitBounty('');
    setSubmissionProof('');
    setSubmissionNotes('');
  };

  const isBountyClaimed = (bountyId: string) => {
    return userClaims.includes(bountyId);
  };

  return (
    <div className="min-h-screen bg-black py-20">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="gradient-text">OG Bounty Program</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-4 max-w-3xl mx-auto">
            Earn up to 20,000 JY tokens by contributing to the Coindaily ecosystem
          </p>
          <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg max-w-2xl mx-auto">
            <p className="text-red-400 font-semibold mb-2">⚠️ Important: US Jurisdiction Notice</p>
            <p className="text-gray-300 text-sm">
              Due to regulatory compliance, citizens and residents of the United States are not eligible to participate in the bounty program. This restriction is in place to comply with US securities laws and regulations.
            </p>
          </div>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Total Pool: <span className="text-primary-500 font-bold">600,000 JY</span> distributed over 12 months
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="grid md:grid-cols-4 gap-6 mb-16"
        >
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center">
            <p className="text-4xl font-bold text-primary-500">600,000</p>
            <p className="text-gray-400 mt-2">Total Bounty Pool (JY)</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center">
            <p className="text-4xl font-bold text-accent-500">{bounties.length}</p>
            <p className="text-gray-400 mt-2">Active Bounties</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center">
            <p className="text-4xl font-bold text-green-500">
              {bounties.reduce((acc, b) => acc + (b.claimedSlots || 0), 0)}
            </p>
            <p className="text-gray-400 mt-2">Claimed Bounties</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center">
            <p className="text-4xl font-bold text-blue-500">{userClaims.length}</p>
            <p className="text-gray-400 mt-2">Your Claims</p>
          </div>
        </motion.div>

        {/* Bounty Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {bounties.map((bounty, index) => {
            const Icon = bounty.icon;
            const claimed = isBountyClaimed(bounty.id);
            const disabled = bounty.isTaken || claimed;
            
            return (
              <motion.div
                key={bounty.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`relative border rounded-2xl p-8 transition-all ${
                  disabled
                    ? 'border-gray-800 bg-gray-900/50 opacity-60'
                    : 'border-gray-800 bg-gray-900 hover:border-primary-500 hover:shadow-lg hover:shadow-primary-500/20'
                }`}
              >
                {/* Taken/Claimed Badge */}
                {disabled && (
                  <div className="absolute top-4 right-4">
                    {bounty.isTaken ? (
                      <span className="bg-gray-700 text-gray-300 px-3 py-1 rounded-full text-sm font-bold">
                        TAKEN
                      </span>
                    ) : (
                      <span className="bg-green-700 text-white px-3 py-1 rounded-full text-sm font-bold">
                        ✓ CLAIMED
                      </span>
                    )}
                  </div>
                )}

                {/* Icon */}
                <div className="flex items-start gap-4 mb-4">
                  <div className={`p-3 rounded-lg ${
                    disabled ? 'bg-gray-800' : 'bg-primary-500/20'
                  }`}>
                    <Icon className={`w-8 h-8 ${
                      disabled ? 'text-gray-500' : 'text-primary-500'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-400 mb-1">{bounty.category}</p>
                    <h3 className="text-2xl font-bold text-white mb-2">{bounty.title}</h3>
                  </div>
                </div>

                {/* Reward */}
                <div className="mb-4 p-4 bg-black/50 rounded-lg">
                  <p className="text-sm text-gray-400 mb-1">Reward Range</p>
                  <p className="text-2xl font-bold gradient-text">{bounty.reward}</p>
                </div>

                {/* Description */}
                <p className="text-gray-300 mb-4">{bounty.description}</p>

                {/* Claimed Count (not slots) */}
                {bounty.claimedSlots !== undefined && (
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-400 mb-2">
                      <span>Times Claimed</span>
                      <span>{bounty.claimedSlots}+</span>
                    </div>
                  </div>
                )}

                {/* Tasks Preview */}
                <div className="mb-6">
                  <p className="text-sm font-bold text-white mb-2">Requirements:</p>
                  <ul className="space-y-1">
                    {bounty.tasks.slice(0, 2).map((task, idx) => (
                      <li key={idx} className="text-sm text-gray-400 flex items-start gap-2">
                        <span className="text-primary-500 flex-shrink-0">•</span>
                        <span>{task}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Claim Button */}
                <button
                  onClick={() => handleClaim(bounty)}
                  disabled={disabled}
                  className={`w-full py-3 rounded-lg font-bold transition-all ${
                    disabled
                      ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-primary-500 to-accent-500 text-white hover:shadow-lg hover:shadow-primary-500/50 hover:scale-105'
                  }`}
                >
                  {bounty.isTaken ? 'Taken' : claimed ? 'Claimed by You' : 'Claim Bounty'}
                </button>
              </motion.div>
            );
          })}
        </div>

        {/* Program Rules */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="bg-gradient-to-br from-primary-600/20 to-accent-600/20 border border-primary-500/50 rounded-2xl p-8 mb-12"
        >
          <h2 className="text-3xl font-bold text-white mb-6">Program Rules</h2>
          <div className="grid md:grid-cols-2 gap-6 text-gray-300">
            <div>
              <h3 className="font-bold text-white mb-2">✓ Total Pool Management</h3>
              <p className="text-sm">600,000 JY, capped at 50,000 JY/month to align with supply limits. Unused portions roll over or burn.</p>
            </div>
            <div>
              <h3 className="font-bold text-white mb-2">✓ Verification & Distribution</h3>
              <p className="text-sm">DAO votes on approvals (minimum 100 votes required); automated payouts via multisig.</p>
            </div>
            <div>
              <h3 className="font-bold text-white mb-2">✓ Staking Integration</h3>
              <p className="text-sm">All participants must meet category-specific staking thresholds to qualify, promoting long-term holding.</p>
            </div>
            <div>
              <h3 className="font-bold text-white mb-2">✓ Penalties</h3>
              <p className="text-sm">20–30% burn on rewarded tokens if unstaked early or if contributions are deemed low-quality post-review.</p>
            </div>
          </div>
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-center flex gap-4 justify-center flex-wrap"
        >
          <button
            onClick={() => setShowSubmitModal(true)}
            className="inline-block bg-gradient-to-r from-green-500 to-emerald-500 text-white px-8 py-4 rounded-full font-bold text-lg hover:shadow-2xl hover:shadow-green-500/50 transition-all transform hover:scale-105"
          >
            Submit Your Work
          </button>
          <Link
            href="/dashboard"
            className="inline-block bg-gradient-to-r from-primary-500 to-accent-500 text-white px-8 py-4 rounded-full font-bold text-lg hover:shadow-2xl hover:shadow-primary-500/50 transition-all transform hover:scale-105"
          >
            View Dashboard
          </Link>
        </motion.div>
      </div>

      {/* Claim Modal */}
      {showClaimModal && selectedBounty && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900 border border-gray-800 rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-3xl font-bold text-white">Claim Bounty</h2>
              <button
                onClick={() => {
                  setShowClaimModal(false);
                  setSelectedBounty(null);
                  setClaimMethod(null);
                  setAcceptedTerms(false);
                  setSocialVerified(false);
                }}
                className="text-gray-400 hover:text-white"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-bold text-primary-400 mb-2">{selectedBounty.title}</h3>
              <p className="text-gray-300 mb-4">{selectedBounty.description}</p>
              
              <div className="bg-black/50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-400 mb-1">Reward</p>
                <p className="text-xl font-bold gradient-text">{selectedBounty.rewardRange}</p>
              </div>

              <div className="bg-black/50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-400 mb-2">Staking Required</p>
                <p className="text-sm text-gray-300">{selectedBounty.stakingRequired}</p>
              </div>

              <div className="bg-black/50 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-2">Vesting Schedule</p>
                <p className="text-sm text-gray-300">{selectedBounty.vestingSchedule}</p>
              </div>
            </div>

            {/* Step 1: Social Authentication */}
            <div className="mb-6">
              <p className="text-white font-bold mb-2">Step 1: Authenticate your account</p>
              <p className="text-sm text-gray-400 mb-4">
                {socialVerified ? '✓ Account verified' : 'Choose your authentication method (one account per bounty):'}
              </p>
              <div className="grid grid-cols-3 gap-4">
                <button
                  onClick={() => handleSocialAuth('discord')}
                  disabled={socialVerified}
                  className={`p-4 rounded-lg text-white font-bold transition-all ${
                    socialVerified && claimMethod === 'discord'
                      ? 'bg-[#5865F2] border-2 border-green-500'
                      : socialVerified
                      ? 'bg-gray-700 opacity-50 cursor-not-allowed'
                      : 'bg-[#5865F2] hover:bg-[#4752C4] hover:scale-105'
                  }`}
                >
                  <svg className="w-8 h-8 mx-auto mb-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                  </svg>
                  Discord
                </button>
                <button
                  onClick={() => handleSocialAuth('twitter')}
                  disabled={socialVerified}
                  className={`p-4 rounded-lg text-white font-bold transition-all ${
                    socialVerified && claimMethod === 'twitter'
                      ? 'bg-black border-2 border-green-500'
                      : socialVerified
                      ? 'bg-gray-700 opacity-50 cursor-not-allowed'
                      : 'bg-black hover:bg-gray-900 border border-gray-700 hover:scale-105'
                  }`}
                >
                  <svg className="w-8 h-8 mx-auto mb-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                  X (Twitter)
                </button>
                <button
                  onClick={() => handleSocialAuth('telegram')}
                  disabled={socialVerified}
                  className={`p-4 rounded-lg text-white font-bold transition-all ${
                    socialVerified && claimMethod === 'telegram'
                      ? 'bg-[#0088cc] border-2 border-green-500'
                      : socialVerified
                      ? 'bg-gray-700 opacity-50 cursor-not-allowed'
                      : 'bg-[#0088cc] hover:bg-[#006699] hover:scale-105'
                  }`}
                >
                  <svg className="w-8 h-8 mx-auto mb-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12a12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472c-.18 1.898-.962 6.502-1.36 8.627c-.168.9-.499 1.201-.82 1.23c-.696.065-1.225-.46-1.9-.902c-1.056-.693-1.653-1.124-2.678-1.8c-1.185-.78-.417-1.21.258-1.91c.177-.184 3.247-2.977 3.307-3.23c.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345c-.48.33-.913.49-1.302.48c-.428-.008-1.252-.241-1.865-.44c-.752-.245-1.349-.374-1.297-.789c.027-.216.325-.437.893-.663c3.498-1.524 5.83-2.529 6.998-3.014c3.332-1.386 4.025-1.627 4.476-1.635z"/>
                  </svg>
                  Telegram
                </button>
              </div>
            </div>

            {/* Step 2: Accept Terms */}
            {socialVerified && (
              <div className="mb-6 bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4">
                <p className="text-white font-bold mb-3">Step 2: Accept Bounty Terms</p>
                <div className="space-y-2 text-sm text-gray-300 mb-4">
                  <p>✓ I understand the staking requirements: {selectedBounty.stakingRequired}</p>
                  <p>✓ I accept the vesting schedule: {selectedBounty.vestingSchedule}</p>
                  <p>✓ I agree this is a one-time claim per account</p>
                  <p>✓ I will submit quality work that meets the bounty criteria</p>
                  <p>✓ I understand penalties apply for early unstaking or low-quality submissions</p>
                </div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-600 text-primary-500 focus:ring-primary-500"
                  />
                  <span className="text-white font-bold">I accept all bounty conditions and staking requirements</span>
                </label>
              </div>
            )}

            {/* Claim Button */}
            <button
              onClick={confirmClaim}
              disabled={!socialVerified || !acceptedTerms}
              className={`w-full py-4 rounded-lg font-bold transition-all ${
                socialVerified && acceptedTerms
                  ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white hover:shadow-lg hover:scale-105'
                  : 'bg-gray-700 text-gray-400 cursor-not-allowed'
              }`}
            >
              {!socialVerified ? 'Authenticate to Continue' : !acceptedTerms ? 'Accept Terms to Claim' : 'Confirm Bounty Claim'}
            </button>

            <p className="text-xs text-gray-500 text-center mt-4">
              Your claim will be tracked by IP, browser pattern, and social account. One claim per user per bounty.
            </p>
          </motion.div>
        </div>
      )}

      {/* Submit Work Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900 border border-gray-800 rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-3xl font-bold text-white">Submit Your Work</h2>
              <button
                onClick={() => {
                  setShowSubmitModal(false);
                  setSelectedSubmitBounty('');
                  setSubmissionProof('');
                  setSubmissionNotes('');
                }}
                className="text-gray-400 hover:text-white"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmitWork} className="space-y-6">
              {/* Bounty Selection */}
              <div>
                <label className="block text-white font-bold mb-2">Select Bounty *</label>
                <select
                  value={selectedSubmitBounty}
                  onChange={(e) => setSelectedSubmitBounty(e.target.value)}
                  className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-primary-500 focus:outline-none"
                  required
                >
                  <option value="">Choose a bounty...</option>
                  {bounties.filter(b => !b.isTaken).map(bounty => (
                    <option key={bounty.id} value={bounty.id}>
                      {bounty.category} - {bounty.title} ({bounty.reward})
                    </option>
                  ))}
                </select>
                <p className="text-sm text-gray-400 mt-2">
                  Only bounties you've claimed will be validated. Make sure you've claimed the bounty first.
                </p>
              </div>

              {/* Proof Link */}
              <div>
                <label className="block text-white font-bold mb-2">Proof/Work Link *</label>
                <input
                  type="url"
                  value={submissionProof}
                  onChange={(e) => setSubmissionProof(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-primary-500 focus:outline-none"
                  required
                />
                <p className="text-sm text-gray-400 mt-2">
                  Link to your article, video, GitHub PR, transaction hash, or other proof of work.
                </p>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-white font-bold mb-2">Additional Notes (Optional)</label>
                <textarea
                  value={submissionNotes}
                  onChange={(e) => setSubmissionNotes(e.target.value)}
                  placeholder="Any additional context or metrics you want to share..."
                  rows={4}
                  className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-primary-500 focus:outline-none"
                />
              </div>

              {/* Info Box */}
              <div className="bg-blue-500/10 border border-blue-500/50 rounded-lg p-4">
                <p className="text-sm text-gray-300">
                  <strong className="text-white">Submission Tracking:</strong><br />
                  Your submission will be tracked by IP address and browser fingerprint. Multiple people can submit for the same bounty (except Dune Analytics and Google Sheets which are limited to 1 submission each).
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-4 rounded-lg font-bold hover:shadow-lg hover:scale-105 transition-all"
              >
                Submit for Review
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
