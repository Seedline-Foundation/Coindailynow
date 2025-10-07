import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'User Content Policy | CoinDaily Online',
  description: 'Guidelines for user-generated content on CoinDaily Online, including community standards, moderation policies, and content submission rules.',
  robots: 'index, follow',
};

export default function UserContentPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="px-6 py-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                User Content Policy
              </h1>
              <p className="text-sm text-gray-600">
                Last Updated: December 2024
              </p>
            </div>

            <div className="prose max-w-none">
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Overview</h2>
                <p className="text-gray-700 mb-4">
                  This User Content Policy governs all content that users submit, post, or share on CoinDaily Online. By using our platform, you agree to follow these guidelines and contribute to a positive community experience.
                </p>
              </div>

              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Acceptable Content</h2>
                
                <h3 className="text-xl font-medium text-gray-800 mb-2">Encouraged Content</h3>
                <p className="text-gray-700 mb-4">
                  We welcome content that:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700">
                  <li>Provides valuable cryptocurrency and blockchain insights</li>
                  <li>Shares legitimate market analysis and research</li>
                  <li>Contributes to educational discussions about digital assets</li>
                  <li>Reports genuine news and developments in the crypto space</li>
                  <li>Offers constructive feedback and suggestions</li>
                  <li>Promotes healthy debate and discussion</li>
                </ul>

                <h3 className="text-xl font-medium text-gray-800 mb-2">Quality Standards</h3>
                <p className="text-gray-700 mb-4">
                  All content should be:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700">
                  <li>Accurate and factual to the best of your knowledge</li>
                  <li>Relevant to cryptocurrency, blockchain, or related topics</li>
                  <li>Written in clear, understandable language</li>
                  <li>Properly sourced when citing external information</li>
                  <li>Original or properly attributed if using third-party content</li>
                </ul>
              </div>

              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Prohibited Content</h2>
                
                <h3 className="text-xl font-medium text-gray-800 mb-2">Strictly Forbidden</h3>
                <p className="text-gray-700 mb-4">
                  The following content is not allowed:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700">
                  <li>Fraudulent schemes, scams, or Ponzi schemes</li>
                  <li>Pump and dump schemes or market manipulation</li>
                  <li>Hate speech, harassment, or discriminatory content</li>
                  <li>Threats, violence, or harmful content</li>
                  <li>Adult content, pornography, or explicit material</li>
                  <li>Illegal activities or promotion of illegal services</li>
                  <li>Spam, repetitive posts, or automated content</li>
                  <li>Phishing attempts or malicious links</li>
                  <li>Personal information of others without consent</li>
                  <li>Copyrighted material without proper authorization</li>
                </ul>

                <h3 className="text-xl font-medium text-gray-800 mb-2">Misleading Information</h3>
                <p className="text-gray-700 mb-4">
                  We prohibit:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700">
                  <li>False or misleading investment advice</li>
                  <li>Unsubstantiated price predictions or guarantees</li>
                  <li>Fake news or deliberately misleading information</li>
                  <li>Impersonation of other individuals or entities</li>
                  <li>False claims about partnerships or endorsements</li>
                </ul>
              </div>

              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Community Guidelines</h2>
                
                <h3 className="text-xl font-medium text-gray-800 mb-2">Respectful Communication</h3>
                <p className="text-gray-700 mb-4">
                  When interacting with others:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700">
                  <li>Be respectful and courteous to all community members</li>
                  <li>Engage in constructive dialogue and debate</li>
                  <li>Avoid personal attacks or inflammatory language</li>
                  <li>Respect different opinions and perspectives</li>
                  <li>Help create a welcoming environment for newcomers</li>
                </ul>

                <h3 className="text-xl font-medium text-gray-800 mb-2">Financial Discussions</h3>
                <p className="text-gray-700 mb-4">
                  When discussing investments or financial topics:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700">
                  <li>Clearly label opinions as such, not financial advice</li>
                  <li>Disclose any conflicts of interest or holdings</li>
                  <li>Encourage users to do their own research (DYOR)</li>
                  <li>Avoid making guarantees about returns or outcomes</li>
                  <li>Include appropriate risk warnings</li>
                </ul>
              </div>

              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Content Submission Process</h2>
                
                <h3 className="text-xl font-medium text-gray-800 mb-2">User Submissions</h3>
                <p className="text-gray-700 mb-4">
                  When submitting content:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700">
                  <li>Ensure you have the right to submit the content</li>
                  <li>Provide accurate and complete information</li>
                  <li>Include proper sources and references</li>
                  <li>Follow our formatting guidelines</li>
                  <li>Submit content in the appropriate category</li>
                </ul>

                <h3 className="text-xl font-medium text-gray-800 mb-2">Review Process</h3>
                <p className="text-gray-700 mb-4">
                  All user submissions are subject to:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700">
                  <li>Automated screening for policy violations</li>
                  <li>Manual review by our content moderation team</li>
                  <li>Fact-checking for accuracy and reliability</li>
                  <li>Editorial review for quality and relevance</li>
                  <li>Legal review when necessary</li>
                </ul>
              </div>

              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Content Moderation</h2>
                
                <h3 className="text-xl font-medium text-gray-800 mb-2">Automated Systems</h3>
                <p className="text-gray-700 mb-4">
                  We use automated systems to:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700">
                  <li>Detect spam and repetitive content</li>
                  <li>Identify potentially harmful links</li>
                  <li>Flag content for human review</li>
                  <li>Prevent publication of prohibited content</li>
                </ul>

                <h3 className="text-xl font-medium text-gray-800 mb-2">Human Review</h3>
                <p className="text-gray-700 mb-4">
                  Our moderation team:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700">
                  <li>Reviews flagged content within 24-48 hours</li>
                  <li>Makes final decisions on content approval</li>
                  <li>Provides feedback to content creators</li>
                  <li>Handles appeals and disputes</li>
                </ul>
              </div>

              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Content Rights and Licensing</h2>
                
                <h3 className="text-xl font-medium text-gray-800 mb-2">Your Rights</h3>
                <p className="text-gray-700 mb-4">
                  You retain ownership of content you create and submit, but by submitting content, you grant us:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700">
                  <li>A worldwide, non-exclusive license to use your content</li>
                  <li>The right to edit and format your content for publication</li>
                  <li>Permission to distribute your content across our platforms</li>
                  <li>The ability to create derivative works for promotional purposes</li>
                </ul>

                <h3 className="text-xl font-medium text-gray-800 mb-2">Attribution</h3>
                <p className="text-gray-700 mb-4">
                  We will provide appropriate attribution for user-generated content and respect your rights as the creator.
                </p>
              </div>

              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Enforcement Actions</h2>
                
                <h3 className="text-xl font-medium text-gray-800 mb-2">Content Actions</h3>
                <p className="text-gray-700 mb-4">
                  For policy violations, we may:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700">
                  <li>Remove or edit violating content</li>
                  <li>Add warning labels or disclaimers</li>
                  <li>Restrict content visibility</li>
                  <li>Require content modifications before publication</li>
                </ul>

                <h3 className="text-xl font-medium text-gray-800 mb-2">Account Actions</h3>
                <p className="text-gray-700 mb-4">
                  For serious or repeated violations, we may:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700">
                  <li>Issue warnings and educational messages</li>
                  <li>Temporarily restrict posting privileges</li>
                  <li>Permanently suspend user accounts</li>
                  <li>Report illegal activities to authorities</li>
                </ul>
              </div>

              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Appeals Process</h2>
                <p className="text-gray-700 mb-4">
                  If your content is removed or restricted, you can appeal by:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700">
                  <li>Contacting our support team at <a href="mailto:appeals@coindaily.online" className="text-blue-600 hover:text-blue-800">appeals@coindaily.online</a></li>
                  <li>Providing a detailed explanation of why you believe the action was incorrect</li>
                  <li>Including any relevant evidence or context</li>
                  <li>Waiting for our review team to respond within 5-7 business days</li>
                </ul>
              </div>

              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Contact Information</h2>
                <p className="text-gray-700 mb-4">
                  For questions about our User Content Policy:
                </p>
                <div className="bg-gray-100 p-4 rounded-lg">
                  <p className="text-gray-700">Email: <a href="mailto:content@coindaily.online" className="text-blue-600 hover:text-blue-800">content@coindaily.online</a></p>
                  <p className="text-gray-700">Subject: User Content Policy Inquiry</p>
                </div>
              </div>

              <div className="border-t pt-6">
                <p className="text-sm text-gray-600">
                  This policy works alongside our{' '}
                  <Link href="/legal/terms" className="text-blue-600 hover:text-blue-800">Terms of Service</Link>,{' '}
                  <Link href="/legal/privacy" className="text-blue-600 hover:text-blue-800">Privacy Policy</Link>, and{' '}
                  <Link href="/legal/intellectual-property" className="text-blue-600 hover:text-blue-800">Intellectual Property Policy</Link>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
