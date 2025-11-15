'use client';

import Hero from '@/components/Hero';
import Tokenomics from '@/components/Tokenomics';
import WhyJoyToken from '@/components/WhyJoyToken';
import StakingStrategy from '@/components/StakingStrategy';
import Roadmap from '@/components/Roadmap';
import HowToBuy from '@/components/HowToBuy';
import EmailCapture from '@/components/EmailCapture';
import Stats from '@/components/Stats';
import MarketOpportunity from '@/components/MarketOpportunity';

export default function HomePage() {
  return (
    <div className="relative overflow-hidden">
      {/* Animated Background - Mining Treasury */}
      <div className="fixed inset-0 pointer-events-none opacity-30 z-0">
        <svg
          className="absolute w-full h-full"
          viewBox="0 0 1200 800"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid slice"
        >
          {/* Treasury Bag - Center - Large Size */}
          <g className="animate-pulse-slow">
            <ellipse cx="600" cy="400" rx="130" ry="150" fill="url(#bagGradient)" opacity="0.6" />
            <path
              d="M 540 310 Q 600 270 660 310 L 660 430 Q 600 470 540 430 Z"
              fill="url(#bagGradient)"
              opacity="0.7"
              stroke="#FCD34D"
              strokeWidth="2"
            />
            <circle cx="600" cy="330" r="8" fill="#D97706" opacity="0.5" />
            <circle cx="580" cy="345" r="6" fill="#D97706" opacity="0.5" />
            <circle cx="620" cy="345" r="6" fill="#D97706" opacity="0.5" />
            <text x="600" y="400" textAnchor="middle" fill="#FCD34D" fontSize="42" fontWeight="bold" opacity="0.8">
              JY
            </text>
          </g>

          {/* Token from TOP */}
          <g>
            <circle cx="600" cy="50" r="18" fill="#FCD34D" opacity="0.7" stroke="#F59E0B" strokeWidth="2">
              <animateTransform
                attributeName="transform"
                type="translate"
                values="0 0; 0 350; 0 350"
                dur="4s"
                repeatCount="indefinite"
              />
              <animate attributeName="opacity" values="0.7;0.9;0" dur="4s" repeatCount="indefinite" />
            </circle>
          </g>

          {/* Token from LEFT */}
          <g>
            <circle cx="50" cy="400" r="18" fill="#FBBF24" opacity="0.7" stroke="#F59E0B" strokeWidth="2">
              <animateTransform
                attributeName="transform"
                type="translate"
                values="0 0; 550 0; 550 0"
                dur="4.5s"
                repeatCount="indefinite"
              />
              <animate attributeName="opacity" values="0.7;0.9;0" dur="4.5s" repeatCount="indefinite" />
            </circle>
          </g>

          {/* Token from RIGHT */}
          <g>
            <circle cx="1150" cy="400" r="18" fill="#FCD34D" opacity="0.7" stroke="#F59E0B" strokeWidth="2">
              <animateTransform
                attributeName="transform"
                type="translate"
                values="0 0; -550 0; -550 0"
                dur="5s"
                repeatCount="indefinite"
              />
              <animate attributeName="opacity" values="0.7;0.9;0" dur="5s" repeatCount="indefinite" />
            </circle>
          </g>

          {/* Token from BOTTOM */}
          <g>
            <circle cx="600" cy="750" r="18" fill="#FBBF24" opacity="0.7" stroke="#F59E0B" strokeWidth="2">
              <animateTransform
                attributeName="transform"
                type="translate"
                values="0 0; 0 -350; 0 -350"
                dur="4.2s"
                repeatCount="indefinite"
              />
              <animate attributeName="opacity" values="0.7;0.9;0" dur="4.2s" repeatCount="indefinite" />
            </circle>
          </g>

          {/* Diagonal token from TOP-LEFT */}
          <g>
            <circle cx="150" cy="100" r="15" fill="#FCD34D" opacity="0.6" stroke="#F59E0B" strokeWidth="1.5">
              <animateTransform
                attributeName="transform"
                type="translate"
                values="0 0; 450 300; 450 300"
                dur="4.8s"
                repeatCount="indefinite"
              />
              <animate attributeName="opacity" values="0.6;0.8;0" dur="4.8s" repeatCount="indefinite" />
            </circle>
          </g>

          {/* Diagonal token from TOP-RIGHT */}
          <g>
            <circle cx="1050" cy="100" r="15" fill="#FBBF24" opacity="0.6" stroke="#F59E0B" strokeWidth="1.5">
              <animateTransform
                attributeName="transform"
                type="translate"
                values="0 0; -450 300; -450 300"
                dur="5.2s"
                repeatCount="indefinite"
              />
              <animate attributeName="opacity" values="0.6;0.8;0" dur="5.2s" repeatCount="indefinite" />
            </circle>
          </g>

          {/* Diagonal token from BOTTOM-LEFT */}
          <g>
            <circle cx="150" cy="700" r="15" fill="#FCD34D" opacity="0.6" stroke="#F59E0B" strokeWidth="1.5">
              <animateTransform
                attributeName="transform"
                type="translate"
                values="0 0; 450 -300; 450 -300"
                dur="4.6s"
                repeatCount="indefinite"
              />
              <animate attributeName="opacity" values="0.6;0.8;0" dur="4.6s" repeatCount="indefinite" />
            </circle>
          </g>

          {/* Diagonal token from BOTTOM-RIGHT */}
          <g>
            <circle cx="1050" cy="700" r="15" fill="#FBBF24" opacity="0.6" stroke="#F59E0B" strokeWidth="1.5">
              <animateTransform
                attributeName="transform"
                type="translate"
                values="0 0; -450 -300; -450 -300"
                dur="5.4s"
                repeatCount="indefinite"
              />
              <animate attributeName="opacity" values="0.6;0.8;0" dur="5.4s" repeatCount="indefinite" />
            </circle>
          </g>

          {/* Left Hand - Packing tokens */}
          <g className="animate-bounce-slow">
            <ellipse cx="420" cy="420" rx="35" ry="25" fill="url(#handGradient)" opacity="0.6" />
            <path
              d="M 390 400 Q 385 420 400 435 L 440 430 Q 445 415 430 400 Z"
              fill="url(#handGradient)"
              opacity="0.7"
              stroke="#FBBF24"
              strokeWidth="1.5"
            >
              <animateTransform
                attributeName="transform"
                type="translate"
                values="0 0; 30 -15; 0 0"
                dur="2s"
                repeatCount="indefinite"
              />
            </path>
            <rect x="435" y="400" width="8" height="20" rx="4" fill="#FCD34D" opacity="0.5" />
            <rect x="425" y="405" width="8" height="18" rx="4" fill="#FCD34D" opacity="0.5" />
          </g>

          {/* Right Hand - Packing tokens */}
          <g className="animate-bounce-slow">
            <ellipse cx="780" cy="420" rx="35" ry="25" fill="url(#handGradient)" opacity="0.6" />
            <path
              d="M 810 400 Q 815 420 800 435 L 760 430 Q 755 415 770 400 Z"
              fill="url(#handGradient)"
              opacity="0.7"
              stroke="#FBBF24"
              strokeWidth="1.5"
            >
              <animateTransform
                attributeName="transform"
                type="translate"
                values="0 0; -30 -15; 0 0"
                dur="2.3s"
                repeatCount="indefinite"
              />
            </path>
            <rect x="757" y="400" width="8" height="20" rx="4" fill="#FCD34D" opacity="0.5" />
            <rect x="767" y="405" width="8" height="18" rx="4" fill="#FCD34D" opacity="0.5" />
          </g>

          {/* Gradients */}
          <defs>
            <linearGradient id="bagGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FBBF24" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#F59E0B" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#D97706" stopOpacity="0.6" />
            </linearGradient>
            <linearGradient id="handGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FDE68A" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#FCD34D" stopOpacity="0.6" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="relative z-10">
      <Hero />
      <Stats />
      <MarketOpportunity />
      <WhyJoyToken />
      <div id="tokenomics">
        <Tokenomics />
      </div>
      <div id="staking">
        <StakingStrategy />
      </div>
      <Roadmap />
      <HowToBuy />
      <EmailCapture />
      </div>
    </div>
  );
}
