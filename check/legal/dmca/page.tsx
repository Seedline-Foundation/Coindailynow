import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'DMCA Policy | CoinDaily Online',
  description: 'CoinDaily Online\'s Digital Millennium Copyright Act (DMCA) policy and procedures for reporting copyright infringement.',
  robots: 'index, follow',
};

export default function DMCAPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="px-6 py-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                DMCA Policy
              </h1>
              <p className="text-sm text-gray-600">
                Last Updated: December 2024
              </p>
            </div>

            <div className="prose max-w-none">
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Overview</h2>
                <p className="text-gray-700 mb-4">
                  CoinDaily Online respects the intellectual property rights of others and complies with the Digital Millennium Copyright Act (DMCA). This policy outlines our procedures for reporting and responding to copyright infringement claims.
                </p>
              </div>

              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Copyright Infringement Notification</h2>
                
                <h3 className="text-xl font-medium text-gray-800 mb-2">Filing a DMCA Notice</h3>
                <p className="text-gray-700 mb-4">
                  If you believe that your copyrighted work has been used on our website in a way that constitutes copyright infringement, please provide our designated agent with the following information:
                </p>
                
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                  <p className="text-sm text-yellow-800">
                    <strong>Important:</strong> Under Section 512(f) of the DMCA, any person who knowingly materially misrepresents that material is infringing may be subject to liability for damages.
                  </p>
                </div>

                <h3 className="text-xl font-medium text-gray-800 mb-2">Required Information</h3>
                <p className="text-gray-700 mb-4">
                  Your DMCA notice must include:
                </p>
                <ol className="list-decimal pl-6 mb-4 text-gray-700 space-y-2">
                  <li>
                    <strong>Identification of the copyrighted work</strong> that you claim has been infringed, or if multiple copyrighted works are covered by a single notification, a representative list of such works.
                  </li>
                  <li>
                    <strong>Identification of the infringing material</strong> and information reasonably sufficient to permit us to locate the material on our website (including the URL where the material appears).
                  </li>
                  <li>
                    <strong>Your contact information</strong> including your address, telephone number, and email address.
                  </li>
                  <li>
                    <strong>A statement</strong> that you have a good faith belief that the use of the material is not authorized by the copyright owner, its agent, or the law.
                  </li>
                  <li>
                    <strong>A statement</strong> that the information in the notification is accurate and, under penalty of perjury, that you are authorized to act on behalf of the owner of an exclusive right that is allegedly infringed.
                  </li>
                  <li>
                    <strong>Your physical or electronic signature</strong> (typing your full name will suffice as an electronic signature).
                  </li>
                </ol>
              </div>

              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Designated Agent</h2>
                <p className="text-gray-700 mb-4">
                  Please send your DMCA notice to our designated agent:
                </p>
                <div className="bg-gray-100 p-6 rounded-lg mb-4">
                  <p className="font-medium text-gray-800">DMCA Agent</p>
                  <p className="text-gray-700">CoinDaily Online</p>
                  <p className="text-gray-700">Email: <a href="mailto:dmca@coindaily.online" className="text-blue-600 hover:text-blue-800">dmca@coindaily.online</a></p>
                  <p className="text-gray-700">Subject Line: DMCA Copyright Infringement Notice</p>
                  <p className="text-gray-700">Phone: +234 (0) 123-456-7890</p>
                  <p className="text-gray-700 mt-2">
                    <strong>Mailing Address:</strong><br />
                    DMCA Agent<br />
                    CoinDaily Online<br />
                    [Address Line 1]<br />
                    Lagos, Nigeria
                  </p>
                </div>
              </div>

              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Our Response Process</h2>
                
                <h3 className="text-xl font-medium text-gray-800 mb-2">Upon Receiving Valid Notice</h3>
                <p className="text-gray-700 mb-4">
                  When we receive a valid DMCA notice, we will:
                </p>
                <ol className="list-decimal pl-6 mb-4 text-gray-700 space-y-2">
                  <li>Acknowledge receipt of your notice within 24-48 hours</li>
                  <li>Review the notice for completeness and validity</li>
                  <li>Remove or disable access to the allegedly infringing material</li>
                  <li>Notify the user who posted the material of the removal</li>
                  <li>Provide the user with a copy of your DMCA notice</li>
                  <li>Inform the user of their right to file a counter-notification</li>
                </ol>

                <h3 className="text-xl font-medium text-gray-800 mb-2">Timeline</h3>
                <p className="text-gray-700 mb-4">
                  We typically process valid DMCA notices within:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700">
                  <li>Emergency removals: Within 2-4 hours for clearly infringing content</li>
                  <li>Standard removals: Within 24-72 hours for most cases</li>
                  <li>Complex cases: Up to 7 business days for cases requiring legal review</li>
                </ul>
              </div>

              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Counter-Notification Process</h2>
                
                <h3 className="text-xl font-medium text-gray-800 mb-2">Filing a Counter-Notice</h3>
                <p className="text-gray-700 mb-4">
                  If you believe your content was removed in error, you may file a counter-notification containing:
                </p>
                <ol className="list-decimal pl-6 mb-4 text-gray-700 space-y-2">
                  <li>Your physical or electronic signature</li>
                  <li>Identification of the material that was removed and its location before removal</li>
                  <li>A statement under penalty of perjury that you have a good faith belief the material was removed due to mistake or misidentification</li>
                  <li>Your name, address, telephone number, and email address</li>
                  <li>A statement that you consent to jurisdiction of the Federal District Court for your location</li>
                  <li>A statement that you will accept service of process from the person who filed the original DMCA notice</li>
                </ol>

                <h3 className="text-xl font-medium text-gray-800 mb-2">Counter-Notice Response</h3>
                <p className="text-gray-700 mb-4">
                  Upon receiving a valid counter-notification:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700">
                  <li>We will provide a copy to the original complainant</li>
                  <li>We will inform them that the material will be restored in 10-14 business days</li>
                  <li>We will restore the material unless the complainant files a court action</li>
                </ul>
              </div>

              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Repeat Infringer Policy</h2>
                
                <h3 className="text-xl font-medium text-gray-800 mb-2">Account Termination</h3>
                <p className="text-gray-700 mb-4">
                  In accordance with the DMCA, we will terminate user accounts that are repeat infringers in appropriate circumstances. Our policy considers:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700">
                  <li>The number of DMCA notices received for a user&rsquo;s content</li>
                  <li>The severity and nature of the infringement</li>
                  <li>Whether the user has filed counter-notifications</li>
                  <li>The user&rsquo;s response to infringement notices</li>
                </ul>

                <h3 className="text-xl font-medium text-gray-800 mb-2">Warning System</h3>
                <p className="text-gray-700 mb-4">
                  We typically follow this progression:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700">
                  <li><strong>First offense:</strong> Warning and education about copyright</li>
                  <li><strong>Second offense:</strong> Temporary suspension and additional warning</li>
                  <li><strong>Third offense:</strong> Account termination</li>
                </ul>
              </div>

              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Safe Harbor Provisions</h2>
                <p className="text-gray-700 mb-4">
                  CoinDaily Online qualifies for safe harbor protection under the DMCA as an online service provider. We:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700">
                  <li>Have designated an agent to receive infringement notices</li>
                  <li>Do not have actual knowledge of infringement</li>
                  <li>Act expeditiously to remove infringing material when notified</li>
                  <li>Have implemented a repeat infringer policy</li>
                  <li>Do not interfere with standard technical measures</li>
                </ul>
              </div>

              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">False Claims</h2>
                
                <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
                  <p className="text-sm text-red-800">
                    <strong>Warning:</strong> Filing false DMCA claims is perjury and may result in legal consequences.
                  </p>
                </div>

                <p className="text-gray-700 mb-4">
                  Under Section 512(f) of the DMCA, anyone who knowingly materially misrepresents that material is infringing may be liable for:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700">
                  <li>Damages incurred by the alleged infringer</li>
                  <li>Attorney&rsquo;s fees</li>
                  <li>Costs of defending against the false claim</li>
                </ul>
              </div>

              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">International Considerations</h2>
                <p className="text-gray-700 mb-4">
                  While CoinDaily Online is based in Nigeria, we comply with international copyright laws and respect intellectual property rights globally. We will process DMCA notices from copyright holders worldwide.
                </p>
              </div>

              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Questions and Support</h2>
                <p className="text-gray-700 mb-4">
                  For questions about our DMCA policy or the process:
                </p>
                <div className="bg-gray-100 p-4 rounded-lg">
                  <p className="text-gray-700">Email: <a href="mailto:dmca@coindaily.online" className="text-blue-600 hover:text-blue-800">dmca@coindaily.online</a></p>
                  <p className="text-gray-700">Legal Team: <a href="mailto:legal@coindaily.online" className="text-blue-600 hover:text-blue-800">legal@coindaily.online</a></p>
                </div>
              </div>

              <div className="border-t pt-6">
                <p className="text-sm text-gray-600">
                  This DMCA Policy is part of our legal framework. Please also review our{' '}
                  <Link href="/legal/intellectual-property" className="text-blue-600 hover:text-blue-800">Intellectual Property Policy</Link>,{' '}
                  <Link href="/legal/terms" className="text-blue-600 hover:text-blue-800">Terms of Service</Link>, and{' '}
                  <Link href="/legal/user-content" className="text-blue-600 hover:text-blue-800">User Content Policy</Link>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
