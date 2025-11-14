'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-black text-white pt-20">
      {/* Hero Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary-500/10 to-transparent" />
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto"
          >
            <h1 className="text-5xl md:text-6xl font-bold mb-6 text-center">
              <span className="gradient-text">Privacy Policy</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 text-center">
              Last Updated: November 9, 2025
            </p>
            <p className="text-gray-400 text-center mb-8">
              Your privacy is important to us. This Privacy Policy explains how we collect, use, and protect your information.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto space-y-12">

          {/* Introduction */}
          <Section title="1. Introduction">
            <p className="text-gray-300 mb-4">
              Joy Token ("we," "us," or "our") operates the website at joytoken.io and the CoinDaily platform 
              (collectively, the "Services"). This Privacy Policy describes:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
              <li>What information we collect from users</li>
              <li>How we use that information</li>
              <li>How we protect user data</li>
              <li>Your rights regarding your personal information</li>
            </ul>
            <p className="text-gray-300 mt-4">
              By accessing or using our Services, you agree to this Privacy Policy. If you do not agree, 
              please do not use our Services.
            </p>
          </Section>

          {/* Information We Collect */}
          <Section title="2. Information We Collect">
            <h3 className="text-xl font-bold text-primary-400 mb-4">2.1 Information You Provide</h3>
            <p className="text-gray-300 mb-4">We collect information you voluntarily provide when you:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4 mb-6">
              <li><strong>Create an account:</strong> Email address, username, password</li>
              <li><strong>Complete KYC/AML verification:</strong> Full name, date of birth, address, government-issued ID, proof of address</li>
              <li><strong>Participate in presale:</strong> Wallet address, transaction details, investment amount</li>
              <li><strong>Subscribe to newsletter:</strong> Email address, name (optional)</li>
              <li><strong>Contact us:</strong> Name, email, message content</li>
              <li><strong>Use platform features:</strong> Content preferences, staking choices, governance votes</li>
            </ul>

            <h3 className="text-xl font-bold text-primary-400 mb-4">2.2 Information Collected Automatically</h3>
            <p className="text-gray-300 mb-4">When you use our Services, we automatically collect:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4 mb-6">
              <li><strong>Device information:</strong> IP address, browser type, operating system, device identifiers</li>
              <li><strong>Usage data:</strong> Pages visited, time spent, links clicked, features used</li>
              <li><strong>Blockchain data:</strong> Public wallet addresses, transaction hashes (publicly available on blockchain)</li>
              <li><strong>Cookies:</strong> Session cookies, preference cookies, analytics cookies</li>
            </ul>

            <h3 className="text-xl font-bold text-primary-400 mb-4">2.3 Information from Third Parties</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
              <li><strong>KYC providers:</strong> Identity verification results from third-party services</li>
              <li><strong>Blockchain explorers:</strong> Public transaction data</li>
              <li><strong>Analytics services:</strong> Aggregated usage statistics</li>
            </ul>
          </Section>

          {/* How We Use Information */}
          <Section title="3. How We Use Your Information">
            <p className="text-gray-300 mb-4">We use collected information for the following purposes:</p>
            
            <h3 className="text-xl font-bold text-accent-400 mb-4">3.1 Core Services</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4 mb-6">
              <li>Process presale participation and token distribution</li>
              <li>Verify identity for compliance with KYC/AML regulations</li>
              <li>Enable staking, governance voting, and premium features</li>
              <li>Provide customer support and respond to inquiries</li>
              <li>Send transactional emails (purchase confirmations, password resets)</li>
            </ul>

            <h3 className="text-xl font-bold text-accent-400 mb-4">3.2 Improvement & Analytics</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4 mb-6">
              <li>Analyze platform usage to improve user experience</li>
              <li>Debug technical issues and optimize performance</li>
              <li>Conduct research and development for new features</li>
              <li>Generate aggregated, anonymized statistics</li>
            </ul>

            <h3 className="text-xl font-bold text-accent-400 mb-4">3.3 Legal & Security</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4 mb-6">
              <li>Comply with legal obligations (KYC/AML, tax reporting)</li>
              <li>Detect and prevent fraud, spam, and abuse</li>
              <li>Enforce our Terms of Service</li>
              <li>Protect rights, property, and safety of users and third parties</li>
            </ul>

            <h3 className="text-xl font-bold text-accent-400 mb-4">3.4 Marketing (With Consent)</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
              <li>Send newsletter updates about platform developments</li>
              <li>Notify about new features, products, or promotions</li>
              <li>Share educational content about cryptocurrency (you can unsubscribe anytime)</li>
            </ul>
          </Section>

          {/* Data Sharing */}
          <Section title="4. How We Share Your Information">
            <p className="text-gray-300 mb-4">We do <strong>NOT</strong> sell your personal information. We may share data with:</p>

            <h3 className="text-xl font-bold text-primary-400 mb-4">4.1 Service Providers</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4 mb-6">
              <li><strong>KYC/AML providers:</strong> For identity verification (e.g., Onfido, Jumio)</li>
              <li><strong>Cloud hosting:</strong> For data storage and processing (e.g., AWS, Google Cloud)</li>
              <li><strong>Email services:</strong> For transactional and marketing emails (e.g., SendGrid)</li>
              <li><strong>Analytics tools:</strong> For usage tracking (e.g., Google Analytics, Mixpanel)</li>
              <li><strong>Payment processors:</strong> For handling presale payments</li>
            </ul>

            <h3 className="text-xl font-bold text-primary-400 mb-4">4.2 Legal Requirements</h3>
            <p className="text-gray-300 mb-4">We may disclose information if required by:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4 mb-6">
              <li>Court orders, subpoenas, or legal processes</li>
              <li>Government authorities investigating illegal activity</li>
              <li>Law enforcement to prevent fraud or protect safety</li>
            </ul>

            <h3 className="text-xl font-bold text-primary-400 mb-4">4.3 Business Transfers</h3>
            <p className="text-gray-300 mb-4">
              In the event of a merger, acquisition, or sale of assets, your information may be transferred 
              to the acquiring entity. We will notify you via email or prominent notice before any transfer.
            </p>

            <h3 className="text-xl font-bold text-primary-400 mb-4">4.4 Public Blockchain Data</h3>
            <p className="text-gray-300">
              <strong>Important:</strong> All blockchain transactions are permanently public. Your wallet address, 
              token balances, and transaction history are visible to anyone on the blockchain. We cannot control 
              or delete this information.
            </p>
          </Section>

          {/* Data Security */}
          <Section title="5. Data Security">
            <p className="text-gray-300 mb-4">We implement industry-standard security measures:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4 mb-6">
              <li><strong>Encryption:</strong> TLS/SSL encryption for data in transit, AES-256 encryption at rest</li>
              <li><strong>Access controls:</strong> Role-based access, multi-factor authentication for staff</li>
              <li><strong>Regular audits:</strong> Security audits by third-party firms</li>
              <li><strong>Secure infrastructure:</strong> Cloud providers with SOC 2 compliance</li>
              <li><strong>Vulnerability management:</strong> Regular patching and security updates</li>
            </ul>
            <p className="text-gray-400 text-sm">
              <strong>Note:</strong> No system is 100% secure. While we implement best practices, we cannot 
              guarantee absolute security. You are responsible for keeping your private keys and passwords secure.
            </p>
          </Section>

          {/* Data Retention */}
          <Section title="6. Data Retention">
            <p className="text-gray-300 mb-4">We retain your information for as long as necessary:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
              <li><strong>Account data:</strong> Until you request deletion (subject to legal requirements)</li>
              <li><strong>KYC/AML records:</strong> 5-7 years after account closure (regulatory requirement)</li>
              <li><strong>Transaction records:</strong> 7 years (tax and compliance requirements)</li>
              <li><strong>Marketing data:</strong> Until you unsubscribe or request deletion</li>
              <li><strong>Analytics data:</strong> Aggregated data retained indefinitely (anonymized)</li>
            </ul>
          </Section>

          {/* Your Rights */}
          <Section title="7. Your Privacy Rights">
            <p className="text-gray-300 mb-4">Depending on your location, you may have the following rights:</p>

            <h3 className="text-xl font-bold text-primary-400 mb-4">7.1 GDPR Rights (EU/UK Users)</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4 mb-6">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Rectification:</strong> Correct inaccurate information</li>
              <li><strong>Erasure ("Right to be forgotten"):</strong> Request deletion (subject to legal exceptions)</li>
              <li><strong>Restriction:</strong> Limit how we process your data</li>
              <li><strong>Portability:</strong> Receive data in machine-readable format</li>
              <li><strong>Objection:</strong> Object to processing for direct marketing</li>
              <li><strong>Withdraw consent:</strong> Revoke consent at any time</li>
            </ul>

            <h3 className="text-xl font-bold text-primary-400 mb-4">7.2 CCPA Rights (California Users)</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4 mb-6">
              <li>Know what personal information is collected</li>
              <li>Know if personal information is sold or disclosed</li>
              <li>Request deletion of personal information</li>
              <li>Opt-out of sale of personal information (we do not sell data)</li>
              <li>Non-discrimination for exercising CCPA rights</li>
            </ul>

            <h3 className="text-xl font-bold text-primary-400 mb-4">7.3 How to Exercise Rights</h3>
            <p className="text-gray-300">
              To exercise any of these rights, contact us at <a href="mailto:privacy@coindaily.online" className="text-primary-400 hover:underline">privacy@coindaily.online</a>. 
              We will respond within 30 days (or as required by law). You may need to verify your identity before we process requests.
            </p>
          </Section>

          {/* Cookies */}
          <Section title="8. Cookies and Tracking">
            <p className="text-gray-300 mb-4">We use cookies and similar technologies:</p>

            <h3 className="text-xl font-bold text-accent-400 mb-4">8.1 Types of Cookies</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4 mb-6">
              <li><strong>Essential cookies:</strong> Required for site functionality (login, security)</li>
              <li><strong>Analytics cookies:</strong> Measure traffic and user behavior</li>
              <li><strong>Preference cookies:</strong> Remember your settings (language, theme)</li>
              <li><strong>Marketing cookies:</strong> Track conversions and ad effectiveness (with consent)</li>
            </ul>

            <h3 className="text-xl font-bold text-accent-400 mb-4">8.2 Managing Cookies</h3>
            <p className="text-gray-300">
              You can control cookies through your browser settings. Note that disabling essential cookies 
              may prevent you from using certain features. To opt out of analytics tracking, visit our 
              Cookie Settings page or use browser extensions like uBlock Origin.
            </p>
          </Section>

          {/* International Transfers */}
          <Section title="9. International Data Transfers">
            <p className="text-gray-300 mb-4">
              Joy Token operates globally. Your information may be transferred to and processed in countries 
              outside your residence, including:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4 mb-4">
              <li>United States (cloud hosting, analytics)</li>
              <li>European Union (KYC providers, data centers)</li>
              <li>Other jurisdictions where our service providers operate</li>
            </ul>
            <p className="text-gray-300">
              We ensure adequate protection through Standard Contractual Clauses (SCCs) approved by the European 
              Commission and other appropriate safeguards.
            </p>
          </Section>

          {/* Children's Privacy */}
          <Section title="10. Children's Privacy">
            <p className="text-gray-300 mb-4">
              Our Services are <strong>NOT</strong> intended for users under 18 years old. We do not knowingly 
              collect personal information from children. If you believe we have inadvertently collected information 
              from a minor, contact us immediately at <a href="mailto:privacy@coindaily.online" className="text-primary-400 hover:underline">privacy@coindaily.online</a>.
            </p>
            <p className="text-gray-300">
              You must be at least 18 years old (or the age of majority in your jurisdiction) to participate in 
              the Joy Token presale or use our Services.
            </p>
          </Section>

          {/* Changes to Policy */}
          <Section title="11. Changes to This Privacy Policy">
            <p className="text-gray-300 mb-4">
              We may update this Privacy Policy periodically to reflect changes in our practices, legal requirements, 
              or new features. When we make material changes:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4 mb-4">
              <li>We will update the "Last Updated" date at the top</li>
              <li>We will notify you via email (if you have an account)</li>
              <li>We will display a prominent notice on our website</li>
              <li>For significant changes, we may require you to accept the new policy</li>
            </ul>
            <p className="text-gray-300">
              Continued use of our Services after changes constitutes acceptance of the updated Privacy Policy.
            </p>
          </Section>

          {/* Contact */}
          <Section title="12. Contact Us">
            <p className="text-gray-300 mb-4">
              If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, 
              please contact us:
            </p>
            <div className="p-6 bg-gray-800/50 rounded-lg">
              <p className="text-gray-300 mb-2"><strong className="text-white">Email:</strong> privacy@coindaily.online</p>
              <p className="text-gray-300 mb-2"><strong className="text-white">Data Protection Officer:</strong> dpo@coindaily.online</p>
              <p className="text-gray-300 mb-2"><strong className="text-white">Mailing Address:</strong></p>
              <p className="text-gray-400 ml-4">
                Joy Token Foundation<br />
                Attn: Privacy Team<br />
                [Address to be determined based on incorporation jurisdiction]
              </p>
            </div>
          </Section>

        </div>
      </div>

      {/* Back to Home */}
      <section className="py-12 bg-gradient-to-r from-primary-500/20 to-accent-500/20">
        <div className="container mx-auto px-4 text-center">
          <Link 
            href="/"
            className="inline-block px-8 py-4 bg-gradient-to-r from-primary-500 to-accent-500 rounded-lg font-semibold hover:scale-105 transition-transform"
          >
            Back to Home
          </Link>
        </div>
      </section>
    </div>
  );
}

// Helper Component
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="scroll-mt-20"
    >
      <h2 className="text-3xl font-bold mb-6 text-white">{title}</h2>
      {children}
    </motion.section>
  );
}
