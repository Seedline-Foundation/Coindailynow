'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, ArrowRight, ArrowLeft, Check, CheckCircle2 } from 'lucide-react';
import { completeOnboarding } from '../../../lib/userApi';

const STEP_1_INTERESTS = [
  { id: 'ai', label: 'Artificial Intelligence', category: 'Tech' },
  { id: 'btc', label: 'Bitcoin', category: 'Crypto' },
  { id: 'alts', label: 'Altcoins', category: 'Crypto' },
  { id: 'sol', label: 'Solana Ecosystem', category: 'Crypto' },
  { id: 'defi', label: 'DeFi & Yields', category: 'Finance' },
  { id: 'memes', label: 'Memecoins', category: 'Crypto' },
  { id: 'macro', label: 'Macro Economics', category: 'Finance' },
  { id: 'trading', label: 'Trading & Technicals', category: 'Finance' },
  { id: 'startups', label: 'Startups & Venture', category: 'Tech' },
  { id: 'african-tech', label: 'African Tech', category: 'Regional' },
  { id: 'latam-finance', label: 'LatAm Finance', category: 'Regional' },
  { id: 'caribbean-fintech', label: 'Caribbean Fintech', category: 'Regional' },
  { id: 'nfts', label: 'NFTs & Digital Art', category: 'Web3' },
  { id: 'web3', label: 'Web3 & dApps', category: 'Web3' },
  { id: 'stablecoins', label: 'Stablecoins & P2P', category: 'Finance' },
  { id: 'regulation', label: 'Crypto Regulation', category: 'Policy' }
];

const STEP_2_ROLES = [
  { id: 'Beginner', title: 'Beginner', desc: 'I am new to crypto & web3 and want to learn.', emoji: '🌱' },
  { id: 'Trader', title: 'Trader', desc: 'I actively trade assets and need market intelligence.', emoji: '📈' },
  { id: 'Investor', title: 'Investor', desc: 'I hold long-term and track narratives.', emoji: '💎' },
  { id: 'Founder', title: 'Founder', desc: 'I am building a web3/AI product or company.', emoji: '🚀' },
  { id: 'Developer', title: 'Developer', desc: 'I write smart contracts, code, and build dApps.', emoji: '💻' },
  { id: 'Researcher', title: 'Researcher', desc: 'I analyze markets, write reports, and study data.', emoji: '🔬' }
];

const STEP_3_GOALS = [
  { id: 'news', label: 'Breaking News Alerts' },
  { id: 'alpha', label: 'Alpha & Signals' },
  { id: 'research', label: 'Deep Research Reports' },
  { id: 'summaries', label: 'Daily Market Summaries' },
  { id: 'alerts', label: 'Price & Volume Alerts' },
  { id: 'explainers', label: 'Educational Explainers' },
  { id: 'portfolio', label: 'Portfolio Tracking' },
  { id: 'community', label: 'Community Discussion' },
  { id: 'ai-analysis', label: 'AI Content Analysis' },
  { id: 'regional-intel', label: 'Regional Intelligence' }
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessBtn, setShowSuccessBtn] = useState(false);

  // Auto-redirect if token is missing
  useEffect(() => {
    const token = localStorage.getItem('auth_token') || localStorage.getItem('accessToken');
    if (!token) {
      router.replace('/?login=true');
    }
  }, [router]);

  const handleInterestToggle = (id: string) => {
    setSelectedInterests(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleGoalToggle = (id: string) => {
    setSelectedGoals(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleNextStep = () => {
    setError(null);
    if (step === 1 && selectedInterests.length === 0) {
      setError('Please select at least one interest.');
      return;
    }
    if (step === 2 && !selectedRole) {
      setError('Please select a profile role.');
      return;
    }
    setStep(prev => prev + 1);
  };

  const handleBackStep = () => {
    setError(null);
    setStep(prev => prev - 1);
  };

  const handleSkip = async () => {
    try {
      await completeOnboarding({
        interests: [],
        identity: 'Skipped',
        goals: []
      });
    } catch (err) {
      console.warn('Failed to save onboarding skip preference:', err);
    }
    // Redirect direct to user dashboard
    router.push('/user');
  };

  const handleSubmit = async () => {
    if (selectedGoals.length === 0) {
      setError('Please select at least one goal.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Map frontend selected arrays to categories and goals labels
      const interestsData = selectedInterests.map(id => {
        const item = STEP_1_INTERESTS.find(i => i.id === id);
        return item ? item.label : id;
      });

      const goalsData = selectedGoals.map(id => {
        const item = STEP_3_GOALS.find(g => g.id === id);
        return item ? item.label : id;
      });

      await completeOnboarding({
        interests: interestsData,
        identity: selectedRole,
        goals: goalsData
      });

      setStep(4);
      // Wait 2 seconds before showing the Enter Dashboard button for premium dramatic effect
      setTimeout(() => {
        setShowSuccessBtn(true);
      }, 2000);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to complete onboarding. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col justify-between py-10 px-4">
      {/* Top Header */}
      <header className="max-w-2xl mx-auto w-full flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-amber-500 flex items-center justify-center font-bold text-black text-lg">
            C
          </div>
          <span className="font-bold text-xl tracking-wider">COIN<span className="text-amber-400">DAILY</span></span>
        </div>
        {step < 4 && (
          <div className="text-sm text-gray-500">
            Step {step} of 3
          </div>
        )}
      </header>

      {/* Main Card */}
      <main className="max-w-2xl mx-auto w-full my-auto flex flex-col justify-center">
        {step < 4 && (
          <div className="w-full bg-[#161622] rounded-3xl border border-[#2a2a3e] p-6 md:p-10 shadow-2xl relative overflow-hidden transition-all duration-300">
            {/* Progress Bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#1f1f30]">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-950/40 border border-red-500/30 rounded-xl text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* STEP 1: INTERESTS */}
            {step === 1 && (
              <div className="animate-fadeIn">
                <h1 className="text-2xl md:text-3xl font-extrabold mb-3">What are you interested in?</h1>
                <p className="text-gray-400 text-sm md:text-base mb-8">Select the topics and technologies you want to monitor in your personal news feed.</p>
                
                <div className="flex flex-wrap gap-3">
                  {STEP_1_INTERESTS.map(interest => {
                    const isSelected = selectedInterests.includes(interest.id);
                    return (
                      <button
                        key={interest.id}
                        onClick={() => handleInterestToggle(interest.id)}
                        className={`px-4 py-2.5 rounded-full text-sm font-semibold border transition-all duration-200 ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-lg shadow-amber-500/5'
                            : 'bg-[#1a1a2e] border-[#2a2a3e] text-gray-300 hover:border-gray-500'
                        }`}
                      >
                        {interest.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 2: ROLES */}
            {step === 2 && (
              <div className="animate-fadeIn">
                <h1 className="text-2xl md:text-3xl font-extrabold mb-3">What describes you best?</h1>
                <p className="text-gray-400 text-sm md:text-base mb-8">We will adjust the technical difficulty and tone of our summaries to fit your profile.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {STEP_2_ROLES.map(role => {
                    const isSelected = selectedRole === role.id;
                    return (
                      <button
                        key={role.id}
                        onClick={() => setSelectedRole(role.id)}
                        className={`flex items-start text-left p-4 rounded-2xl border transition-all duration-200 ${
                          isSelected
                            ? 'bg-amber-500/10 border-amber-500 text-white shadow-lg shadow-amber-500/5'
                            : 'bg-[#1a1a2e] border-[#2a2a3e] text-gray-300 hover:border-gray-500'
                        }`}
                      >
                        <span className="text-3xl mr-4 mt-1">{role.emoji}</span>
                        <div>
                          <h3 className="font-bold text-base text-white">{role.title}</h3>
                          <p className="text-gray-400 text-xs mt-1 leading-relaxed">{role.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 3: GOALS */}
            {step === 3 && (
              <div className="animate-fadeIn">
                <h1 className="text-2xl md:text-3xl font-extrabold mb-3">What is your goal on CoinDaily?</h1>
                <p className="text-gray-400 text-sm md:text-base mb-8">Choose what you want to extract from the platform to customize your dashboard layout.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {STEP_3_GOALS.map(goal => {
                    const isSelected = selectedGoals.includes(goal.id);
                    return (
                      <button
                        key={goal.id}
                        onClick={() => handleGoalToggle(goal.id)}
                        className={`flex items-center justify-between p-4 rounded-xl border text-left transition-all duration-200 ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                            : 'bg-[#1a1a2e] border-[#2a2a3e] text-gray-300 hover:border-gray-500'
                        }`}
                      >
                        <span className="font-semibold text-sm">{goal.label}</span>
                        <div className={`h-5 w-5 rounded-full border flex items-center justify-center transition-all ${
                          isSelected ? 'bg-amber-500 border-amber-500 text-black' : 'border-[#4a4a6a]'
                        }`}>
                          {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="mt-10 pt-6 border-t border-[#2a2a3e] flex items-center justify-between">
              {step > 1 ? (
                <button
                  onClick={handleBackStep}
                  className="flex items-center gap-2 text-gray-400 hover:text-white font-semibold transition-colors px-4 py-2"
                >
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
              ) : (
                <div />
              )}

              {step < 3 ? (
                <button
                  onClick={handleNextStep}
                  className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-black font-bold px-6 py-3 rounded-xl transition-all"
                >
                  Next <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-bold px-6 py-3 rounded-xl transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <div className="h-5 w-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      Finish Onboarding <Sparkles className="h-4 w-4 fill-black" />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}

        {/* STEP 4: SUCCESS PAGE */}
        {step === 4 && (
          <div className="w-full bg-[#161622] rounded-3xl border border-[#2a2a3e] p-10 shadow-2xl text-center flex flex-col items-center justify-center py-16 animate-scaleIn">
            <div className="h-20 w-20 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-6">
              <CheckCircle2 className="h-12 w-12 animate-pulse" />
            </div>

            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent mb-3">
              Onboarding Complete!
            </h1>
            <p className="text-gray-300 max-w-md mb-8">
              🎉 Your personalized intelligence feed is ready. We have calibrated your dashboard to match your interest profile.
            </p>

            <div className="h-12 flex items-center justify-center">
              {showSuccessBtn ? (
                <button
                  onClick={() => router.push('/user')}
                  className="animate-fadeIn flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-black font-bold px-8 py-3.5 rounded-xl shadow-lg shadow-amber-500/10 transition-all transform hover:scale-105"
                >
                  Enter Dashboard <ArrowRight className="h-5 w-5" />
                </button>
              ) : (
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 bg-amber-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <div className="h-2 w-2 bg-amber-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <div className="h-2 w-2 bg-amber-500 rounded-full animate-bounce" />
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Bottom Footer */}
      {step < 4 && (
        <footer className="max-w-2xl mx-auto w-full text-center mt-6">
          <button
            onClick={handleSkip}
            className="text-xs text-gray-500 hover:text-gray-300 underline transition-colors"
          >
            Skip onboarding for now
          </button>
        </footer>
      )}
    </div>
  );
}
