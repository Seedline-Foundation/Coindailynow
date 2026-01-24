"""Script to create enhanced careers page with all new positions"""

careers_content = """'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface Role {
  title: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  perks: string[];
  fullDescription: string;
}

export default function CareersPage() {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  const perksStandard = [
    '💻 Laptop provided (Macbook or equivalent)',
    '🌐 Monthly internet bill coverage ($100)',
    '⚡ Electricity bill subsidy ($80/month)',
    '🎁 Welcome pack (company swag, setup bonus)',
    '🪙 Joy Token allocation (vesting over 2 years)',
    '🏝️ Flexible remote work',
    '📚 Learning & development budget',
    '🏥 Health insurance (for full-time)',
    '🎯 Performance bonuses',
    '🚀 Equity in company growth',
  ];

  const positions = [
    {
      category: 'Leadership & Executive',
      locations: ['Remote (Africa preferred)'],
      roles: [
        {
          title: 'Head of Sales',
          description: 'Drive revenue growth through strategic partnerships, advertising sales, and premium subscriptions across Africa',
          responsibilities: [
            'Build and lead sales team across multiple African countries',
            'Develop and execute comprehensive sales strategy',
            'Close high-value partnership deals with exchanges',
            'Manage premium subscription growth',
          ],
          requirements: [
            '7+ years B2B sales leadership in tech/crypto',
            'Proven $500K+ annual contracts track record',
            'African crypto/fintech ecosystem network',
            'Team building and leadership experience',
          ],
          perks: [
            ...perksStandard,
            '💰 Uncapped commission structure',
            '🎯 Annual bonus based on revenue targets',
          ],
          fullDescription: 'As Head of Sales, drive revenue from $50K to $500K+ MRR. Build team, close deals, analyze metrics. Hunter mentality plus strategic thinking required.',
        },
        {
          title: 'Chief of Staff',
          description: 'Drive operational excellence, manage staff welfare, oversee user/enterprise onboarding',
          responsibilities: [
            'Act as CEO right hand - manage strategic projects',
            'Coordinate cross-functional initiatives',
            'Design user onboarding programs',
            'Oversee staff welfare and ambassador program',
          ],
          requirements: [
            '5+ years operations/consulting/chief of staff',
            'Exceptional organizational skills',
            'Remote team management experience',
            'Analytical and empathetic leader',
          ],
          perks: [
            ...perksStandard,
            '💼 Significant equity stake',
            '🎓 Executive coaching',
          ],
          fullDescription: 'High-horsepower generalist role. Drive strategic initiatives, ensure nothing falls through cracks. Manage team welfare and ambassador program.',
        },
        {
          title: 'Community President',
          description: 'Build thriving community across Telegram, Twitter, Discord while maintaining quality',
          responsibilities: [
            'Grow community from 50K to 500K+ members',
            'Design engagement strategy and content calendar',
            'Moderate and remove bad actors',
            'Run AMAs and community events',
          ],
          requirements: [
            '4+ years crypto community management',
            'Deep crypto Twitter/Telegram culture understanding',
            '50K+ member community experience',
            'Fraud detection and moderation skills',
          ],
          perks: [
            ...perksStandard,
            '💬 Premium social tools',
            '🎮 Contest/giveaway budget',
          ],
          fullDescription: 'Build community so valuable people cannot imagine not being part of it. Create insider benefits, reward contributors, eliminate scammers.',
        },
      ],
    },
    {
      category: 'Engineering',
      locations: ['Remote (Global)'],
      roles: [
        {
          title: 'Senior Full Stack Developer',
          description: 'Build and scale CoinDaily platform with Next.js, Node.js, PostgreSQL',
          responsibilities: [
            'Architect new features across full stack',
            'Optimize for sub-500ms response times',
            'Build AI content systems',
            'Code review and mentorship',
          ],
          requirements: [
            '5+ years full stack experience',
            'TypeScript expert',
            'Next.js, React, Node.js experience',
            'PostgreSQL optimization skills',
          ],
          perks: [
            ...perksStandard,
            '🖥️ Latest Macbook Pro',
            '📚 Conference budget',
          ],
          fullDescription: 'Shape technical foundation of Africa #1 crypto platform. Modern stack with cutting-edge AI + Web3.',
        },
        {
          title: 'Blockchain Developer',
          description: 'Develop smart contracts for Joy Token staking, governance, utility',
          responsibilities: [
            'Write and audit Solidity contracts',
            'Implement staking and governance',
            'Build Web3 integrations',
            'Conduct security audits',
          ],
          requirements: [
            'Solidity expertise',
            'DeFi protocol experience',
            'Security-first mindset',
            'OpenZeppelin, Hardhat familiarity',
          ],
          perks: [
            ...perksStandard,
            '🔐 Bug bounty rewards',
            '🎓 Security certifications',
          ],
          fullDescription: 'Build smart contract infrastructure powering Joy Token. Innovative tokenomics and governance systems.',
        },
      ],
    },
    {
      category: 'Correspondents & Journalists',
      locations: ['Nigeria', 'Kenya', 'South Africa', 'Ghana', 'Zambia', 'Egypt'],
      roles: [
        {
          title: 'Crypto/Blockchain Correspondent',
          description: 'Cover breaking crypto news, regulatory updates, market trends in your region',
          responsibilities: [
            'Write 3-5 articles per week',
            'Break exclusive stories',
            'Interview industry leaders',
            'Attend local crypto events',
          ],
          requirements: [
            '2+ years journalism experience',
            'Deep crypto knowledge',
            'Local market expertise',
            'Strong writing skills',
          ],
          perks: perksStandard,
          fullDescription: 'Be our eyes and ears on the ground, uncovering stories Western media misses.',
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-black py-20">
      <div className="container mx-auto px-4 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="gradient-text">Join Our Team</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Help build Africa's premier crypto platform. We're hiring across 15+ countries.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-400">
            <span>🌍 Remote-First</span>
            <span>💰 Competitive Pay + Equity</span>
            <span>🎁 Laptop & Setup Provided</span>
            <span>📈 Growth Opportunities</span>
          </div>
        </motion.div>

        <div className="space-y-12">
          {positions.map((category, catIndex) => (
            <motion.div
              key={catIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: catIndex * 0.1 }}
            >
              <div className="mb-6">
                <h2 className="text-3xl font-bold text-white mb-3">{category.category}</h2>
                <p className="text-gray-400">
                  <span className="text-primary-500 font-semibold">Locations:</span>{' '}
                  {category.locations.join(', ')}
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {category.roles.map((role, roleIndex) => (
                  <div
                    key={roleIndex}
                    className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-primary-500 transition-all"
                  >
                    <h3 className="text-2xl font-bold text-white mb-3">{role.title}</h3>
                    <p className="text-gray-300 mb-4">{role.description}</p>
                    
                    <div className="mb-4">
                      <p className="text-sm font-semibold text-gray-400 mb-2">Key Requirements:</p>
                      <ul className="space-y-1">
                        {role.requirements.slice(0, 3).map((req, reqIndex) => (
                          <li key={reqIndex} className="text-sm text-gray-400 flex items-start gap-2">
                            <span className="text-primary-500">•</span>
                            <span>{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mb-6">
                      <p className="text-sm font-semibold text-gray-400 mb-2">Sample Perks:</p>
                      <ul className="space-y-1">
                        {role.perks.slice(0, 4).map((perk, perkIndex) => (
                          <li key={perkIndex} className="text-sm text-gray-400">
                            {perk}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex gap-3">
                      <a
                        href={`mailto:careers@coindaily.online?subject=Application: ${role.title}`}
                        className="flex-1 text-center bg-gradient-to-r from-primary-500 to-accent-500 text-white px-6 py-3 rounded-full font-bold hover:shadow-lg hover:shadow-primary-500/50 transition-all"
                      >
                        Apply Now →
                      </a>
                      <button
                        onClick={() => setSelectedRole(role)}
                        className="flex-1 text-center border-2 border-primary-500 text-primary-500 px-6 py-3 rounded-full font-bold hover:bg-primary-500/10 transition-all"
                      >
                        Read More
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-16 bg-gradient-to-br from-primary-600/20 to-accent-600/20 border border-primary-500/50 rounded-2xl p-8"
        >
          <h2 className="text-3xl font-bold text-white mb-6 text-center">How to Apply</h2>
          <div className="max-w-3xl mx-auto text-gray-300 space-y-4">
            <p>
              Send your application to{' '}
              <a href="mailto:careers@coindaily.online" className="text-primary-500 font-bold hover:underline">
                careers@coindaily.online
              </a>
            </p>
            <p className="font-semibold">Include:</p>
            <ul className="space-y-2 ml-6">
              <li>• Your resume/CV</li>
              <li>• Cover letter</li>
              <li>• Portfolio/work samples</li>
              <li>• Expected salary range</li>
            </ul>
          </div>
        </motion.div>

        <div className="text-center mt-12">
          <Link href="/" className="inline-block bg-gray-800 hover:bg-gray-700 text-white px-8 py-4 rounded-full font-bold transition-all">
            ← Back to Home
          </Link>
        </div>
      </div>

      <AnimatePresence>
        {selectedRole && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedRole(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-gray-900 border border-primary-500/50 rounded-2xl max-w-4xl max-h-[90vh] overflow-y-auto p-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-3xl font-bold text-white">{selectedRole.title}</h2>
                <button
                  onClick={() => setSelectedRole(null)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <p className="text-xl text-gray-300 mb-6">{selectedRole.description}</p>

              <div className="mb-6">
                <h3 className="text-xl font-bold text-primary-400 mb-3">Full Description</h3>
                <p className="text-gray-300 whitespace-pre-line">{selectedRole.fullDescription}</p>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-bold text-primary-400 mb-3">Responsibilities</h3>
                <ul className="space-y-2">
                  {selectedRole.responsibilities.map((resp, idx) => (
                    <li key={idx} className="text-gray-300 flex items-start gap-2">
                      <span className="text-primary-500">•</span>
                      <span>{resp}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-bold text-accent-400 mb-3">Requirements</h3>
                <ul className="space-y-2">
                  {selectedRole.requirements.map((req, idx) => (
                    <li key={idx} className="text-gray-300 flex items-start gap-2">
                      <span className="text-accent-500">•</span>
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mb-8">
                <h3 className="text-xl font-bold text-green-400 mb-3">Perks & Benefits</h3>
                <div className="grid md:grid-cols-2 gap-2">
                  {selectedRole.perks.map((perk, idx) => (
                    <div key={idx} className="text-gray-300">
                      {perk}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-4">
                <a
                  href={`mailto:careers@coindaily.online?subject=Application: ${selectedRole.title}`}
                  className="flex-1 text-center bg-gradient-to-r from-primary-500 to-accent-500 text-white px-6 py-4 rounded-full font-bold hover:shadow-lg hover:shadow-primary-500/50 transition-all"
                >
                  Apply Now →
                </a>
                <button
                  onClick={() => setSelectedRole(null)}
                  className="px-8 py-4 border border-gray-700 rounded-full font-bold hover:bg-gray-800 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
"""

# Write the file
with open('src/app/careers/page.tsx', 'w', encoding='utf-8') as f:
    f.write(careers_content)

print("✓ Enhanced careers page created with:")
print("  - Head of Sales position")
print("  - Chief of Staff position")
print("  - Community President position")
print("  - Dual buttons (Apply Now + Read More)")
print("  - Complete perks package for all roles")
print("  - Modal with full job descriptions")
