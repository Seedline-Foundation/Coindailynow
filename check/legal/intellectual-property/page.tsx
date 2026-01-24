import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Intellectual Property Policy | CoinDaily Online',
  description: 'Learn about CoinDaily Online\'s intellectual property policy, including copyrights, trademarks, and user-generated content rights.',
  robots: 'index, follow',
};

export default function IntellectualPropertyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="px-6 py-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Intellectual Property Policy
              </h1>
              <p className="text-sm text-gray-600">
                Last Updated: December 2024
              </p>
            </div>

            <div className="prose max-w-none">
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Overview</h2>
                <p className="text-gray-700 mb-4">
                  CoinDaily Online respects intellectual property rights and expects our users to do the same. This policy outlines our approach to intellectual property protection and enforcement.
                </p>
              </div>

              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Our Intellectual Property</h2>
                
                <h3 className="text-xl font-medium text-gray-800 mb-2">Copyrights</h3>
                <p className="text-gray-700 mb-4">
                  All content on CoinDaily Online, including but not limited to text, graphics, logos, images, audio clips, video clips, digital downloads, data compilations, and software, is our property or the property of our content suppliers and is protected by copyright laws.
                </p>

                <h3 className="text-xl font-medium text-gray-800 mb-2">Trademarks</h3>
                <p className="text-gray-700 mb-4">
                  &ldquo;CoinDaily Online,&rdquo; our logo, and other marks indicated on our website are our trademarks. All other trademarks not owned by us that appear on this site are the property of their respective owners.
                </p>

                <h3 className="text-xl font-medium text-gray-800 mb-2">Database Rights</h3>
                <p className="text-gray-700 mb-4">
                  Our databases of cryptocurrency information, market data, and news content are protected by database rights and copyright laws.
                </p>
              </div>

              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">User-Generated Content</h2>
                
                <h3 className="text-xl font-medium text-gray-800 mb-2">License Grant</h3>
                <p className="text-gray-700 mb-4">
                  By submitting content to our platform, you grant us a worldwide, non-exclusive, royalty-free, transferable license to use, reproduce, distribute, prepare derivative works of, display, and perform your content.
                </p>

                <h3 className="text-xl font-medium text-gray-800 mb-2">Content Ownership</h3>
                <p className="text-gray-700 mb-4">
                  You retain ownership of content you submit, but you represent and warrant that:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700">
                  <li>You own or have the necessary rights to submit the content</li>
                  <li>Your content doesn&rsquo;t infringe on third-party intellectual property rights</li>
                  <li>You have obtained all necessary permissions and licenses</li>
                </ul>
              </div>

              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Third-Party Content</h2>
                
                <h3 className="text-xl font-medium text-gray-800 mb-2">Cryptocurrency Data</h3>
                <p className="text-gray-700 mb-4">
                  Market data, price information, and other cryptocurrency-related content may be provided by third-party data providers and is subject to their respective intellectual property rights.
                </p>

                <h3 className="text-xl font-medium text-gray-800 mb-2">News Sources</h3>
                <p className="text-gray-700 mb-4">
                  News content and articles may include information from various sources. We respect fair use principles and provide appropriate attribution where required.
                </p>
              </div>

              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Permitted Uses</h2>
                <p className="text-gray-700 mb-4">
                  You may use our content for:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700">
                  <li>Personal, non-commercial use</li>
                  <li>Educational purposes with proper attribution</li>
                  <li>Fair use commentary and criticism</li>
                  <li>News reporting with appropriate citation</li>
                </ul>
              </div>

              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Prohibited Uses</h2>
                <p className="text-gray-700 mb-4">
                  You may not:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700">
                  <li>Reproduce, distribute, or display our content for commercial purposes without permission</li>
                  <li>Create derivative works based on our content without authorization</li>
                  <li>Remove or alter copyright notices or attribution</li>
                  <li>Use our trademarks without permission</li>
                  <li>Scrape or systematically extract our database content</li>
                </ul>
              </div>

              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">DMCA Compliance</h2>
                <p className="text-gray-700 mb-4">
                  We comply with the Digital Millennium Copyright Act (DMCA). If you believe your copyrighted work has been infringed, please see our <Link href="/legal/dmca" className="text-blue-600 hover:text-blue-800">DMCA Policy</Link> for filing procedures.
                </p>
              </div>

              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Reporting Infringement</h2>
                <p className="text-gray-700 mb-4">
                  If you believe your intellectual property rights have been violated, please contact us immediately at:
                </p>
                <div className="bg-gray-100 p-4 rounded-lg mb-4">
                  <p className="font-medium text-gray-800">Intellectual Property Team</p>
                  <p className="text-gray-700">Email: <a href="mailto:ip@coindaily.online" className="text-blue-600 hover:text-blue-800">ip@coindaily.online</a></p>
                  <p className="text-gray-700">Subject Line: IP Violation Report</p>
                </div>
              </div>

              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Enforcement</h2>
                <p className="text-gray-700 mb-4">
                  We take intellectual property violations seriously and will:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700">
                  <li>Investigate reported violations promptly</li>
                  <li>Remove infringing content when appropriate</li>
                  <li>Terminate accounts of repeat infringers</li>
                  <li>Cooperate with law enforcement when necessary</li>
                </ul>
              </div>

              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Contact Information</h2>
                <p className="text-gray-700 mb-4">
                  For questions about this Intellectual Property Policy, contact us:
                </p>
                <div className="bg-gray-100 p-4 rounded-lg">
                  <p className="text-gray-700">Email: <a href="mailto:legal@coindaily.online" className="text-blue-600 hover:text-blue-800">legal@coindaily.online</a></p>
                  <p className="text-gray-700">Phone: +234 (0) 123-456-7890</p>
                </div>
              </div>

              <div className="border-t pt-6">
                <p className="text-sm text-gray-600">
                  This policy is part of our comprehensive legal framework. Also review our{' '}
                  <Link href="/legal/terms" className="text-blue-600 hover:text-blue-800">Terms of Service</Link>,{' '}
                  <Link href="/legal/privacy" className="text-blue-600 hover:text-blue-800">Privacy Policy</Link>, and{' '}
                  <Link href="/legal/dmca" className="text-blue-600 hover:text-blue-800">DMCA Policy</Link>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
