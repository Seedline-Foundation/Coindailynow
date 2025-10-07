import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'AML/KYC Policy | CoinDaily Online',
  description: 'CoinDaily Online\'s Anti-Money Laundering (AML) and Know Your Customer (KYC) compliance policies and procedures.',
  robots: 'index, follow',
};

export default function AMLKYCPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="px-6 py-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                AML/KYC Policy
              </h1>
              <p className="text-sm text-gray-600">
                Last Updated: December 2024
              </p>
            </div>

            <div className="prose max-w-none">
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Overview</h2>
                <p className="text-gray-700 mb-4">
                  CoinDaily Online is committed to preventing money laundering, terrorist financing, and other financial crimes. This Anti-Money Laundering (AML) and Know Your Customer (KYC) Policy outlines our compliance procedures and requirements.
                </p>
                <p className="text-gray-700 mb-4">
                  While CoinDaily Online is primarily a news and information platform, we maintain these policies to ensure compliance with applicable laws and regulations, particularly for any financial services or premium features we may offer.
                </p>
              </div>

              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Regulatory Framework</h2>
                
                <h3 className="text-xl font-medium text-gray-800 mb-2">Applicable Laws</h3>
                <p className="text-gray-700 mb-4">
                  Our AML/KYC program complies with:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700">
                  <li>Nigerian Financial Intelligence Unit (NFIU) guidelines</li>
                  <li>Economic and Financial Crimes Commission (EFCC) regulations</li>
                  <li>Central Bank of Nigeria (CBN) directives</li>
                  <li>Financial Action Task Force (FATF) recommendations</li>
                  <li>International anti-money laundering standards</li>
                  <li>Relevant sanctions and embargo laws</li>
                </ul>

                <h3 className="text-xl font-medium text-gray-800 mb-2">Risk-Based Approach</h3>
                <p className="text-gray-700 mb-4">
                  We implement a risk-based approach that considers:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700">
                  <li>Customer risk profiles</li>
                  <li>Geographic risk factors</li>
                  <li>Product and service risk levels</li>
                  <li>Transaction patterns and amounts</li>
                  <li>Delivery channel risks</li>
                </ul>
              </div>

              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Know Your Customer (KYC) Requirements</h2>
                
                <h3 className="text-xl font-medium text-gray-800 mb-2">Customer Identification</h3>
                <p className="text-gray-700 mb-4">
                  For services requiring enhanced verification, we collect:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700">
                  <li><strong>Personal Information:</strong> Full name, date of birth, nationality</li>
                  <li><strong>Address Verification:</strong> Residential or business address</li>
                  <li><strong>Government ID:</strong> Passport, national ID, or driver&rsquo;s license</li>
                  <li><strong>Contact Details:</strong> Phone number and email address</li>
                  <li><strong>Source of Funds:</strong> For high-value transactions</li>
                </ul>

                <h3 className="text-xl font-medium text-gray-800 mb-2">Verification Levels</h3>
                <div className="overflow-x-auto mb-4">
                  <table className="min-w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 px-4 py-2 text-left">Level</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Requirements</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Services</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-gray-300 px-4 py-2">Basic</td>
                        <td className="border border-gray-300 px-4 py-2">Email verification</td>
                        <td className="border border-gray-300 px-4 py-2">Free content access</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 px-4 py-2">Enhanced</td>
                        <td className="border border-gray-300 px-4 py-2">ID document + address proof</td>
                        <td className="border border-gray-300 px-4 py-2">Premium subscriptions</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 px-4 py-2">Premium</td>
                        <td className="border border-gray-300 px-4 py-2">Full KYC + source of funds</td>
                        <td className="border border-gray-300 px-4 py-2">High-value services</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <h3 className="text-xl font-medium text-gray-800 mb-2">Document Requirements</h3>
                <p className="text-gray-700 mb-4">
                  Acceptable identification documents include:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700">
                  <li><strong>Primary ID:</strong> International passport, national ID card, driver&rsquo;s license</li>
                  <li><strong>Address Proof:</strong> Utility bill, bank statement, government correspondence (within 3 months)</li>
                  <li><strong>Business Documents:</strong> Certificate of incorporation, business license (for corporate accounts)</li>
                </ul>
              </div>

              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Anti-Money Laundering (AML) Measures</h2>
                
                <h3 className="text-xl font-medium text-gray-800 mb-2">Transaction Monitoring</h3>
                <p className="text-gray-700 mb-4">
                  We monitor transactions for suspicious patterns:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700">
                  <li>Unusual transaction amounts or frequencies</li>
                  <li>Transactions from high-risk jurisdictions</li>
                  <li>Complex or unusual transaction structures</li>
                  <li>Transactions involving sanctioned entities or individuals</li>
                  <li>Patterns inconsistent with customer profiles</li>
                </ul>

                <h3 className="text-xl font-medium text-gray-800 mb-2">Red Flags</h3>
                <p className="text-gray-700 mb-4">
                  We watch for indicators of suspicious activity:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700">
                  <li>Reluctance to provide required information</li>
                  <li>Provision of false or misleading information</li>
                  <li>Unusual concern about compliance procedures</li>
                  <li>Transactions with no apparent economic purpose</li>
                  <li>Involvement of shell companies or trusts</li>
                  <li>Connections to politically exposed persons (PEPs)</li>
                </ul>
              </div>

              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Sanctions Screening</h2>
                
                <h3 className="text-xl font-medium text-gray-800 mb-2">Screening Lists</h3>
                <p className="text-gray-700 mb-4">
                  We screen against international sanctions lists:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700">
                  <li>United Nations Security Council sanctions list</li>
                  <li>US Office of Foreign Assets Control (OFAC) lists</li>
                  <li>European Union sanctions lists</li>
                  <li>UK HM Treasury sanctions lists</li>
                  <li>Nigerian sanctions and embargo lists</li>
                  <li>Financial Action Task Force (FATF) high-risk jurisdictions</li>
                </ul>

                <h3 className="text-xl font-medium text-gray-800 mb-2">Screening Process</h3>
                <p className="text-gray-700 mb-4">
                  Our screening process includes:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700">
                  <li>Real-time screening during onboarding</li>
                  <li>Ongoing monitoring of existing customers</li>
                  <li>Regular batch screening against updated lists</li>
                  <li>Manual review of potential matches</li>
                  <li>Documentation of screening decisions</li>
                </ul>
              </div>

              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Politically Exposed Persons (PEPs)</h2>
                
                <h3 className="text-xl font-medium text-gray-800 mb-2">PEP Categories</h3>
                <p className="text-gray-700 mb-4">
                  We identify and monitor:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700">
                  <li>Current and former government officials</li>
                  <li>Senior officials in political parties</li>
                  <li>Senior executives of state-owned enterprises</li>
                  <li>Important judicial or military officials</li>
                  <li>Family members and close associates of PEPs</li>
                </ul>

                <h3 className="text-xl font-medium text-gray-800 mb-2">Enhanced Due Diligence</h3>
                <p className="text-gray-700 mb-4">
                  PEPs receive enhanced scrutiny including:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700">
                  <li>Senior management approval for relationships</li>
                  <li>Enhanced ongoing monitoring</li>
                  <li>Additional source of wealth verification</li>
                  <li>More frequent reviews and updates</li>
                </ul>
              </div>

              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Suspicious Activity Reporting</h2>
                
                <h3 className="text-xl font-medium text-gray-800 mb-2">Reporting Obligations</h3>
                <p className="text-gray-700 mb-4">
                  We file suspicious activity reports (SARs) when required:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700">
                  <li>Transactions suspected of involving proceeds of crime</li>
                  <li>Attempted transactions that appear suspicious</li>
                  <li>Transactions with no apparent lawful purpose</li>
                  <li>Customers who refuse to provide required information</li>
                </ul>

                <h3 className="text-xl font-medium text-gray-800 mb-2">Reporting Process</h3>
                <p className="text-gray-700 mb-4">
                  Our reporting process ensures:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700">
                  <li>Timely filing with relevant authorities (within 7 days)</li>
                  <li>Comprehensive documentation of suspicious activity</li>
                  <li>Confidentiality of reporting (no tipping off)</li>
                  <li>Follow-up on regulatory requests</li>
                </ul>
              </div>

              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Record Keeping</h2>
                
                <h3 className="text-xl font-medium text-gray-800 mb-2">Retention Requirements</h3>
                <p className="text-gray-700 mb-4">
                  We maintain records for required periods:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700">
                  <li><strong>Customer records:</strong> 5 years after relationship ends</li>
                  <li><strong>Transaction records:</strong> 5 years from transaction date</li>
                  <li><strong>SARs and supporting documents:</strong> 5 years from filing</li>
                  <li><strong>Training records:</strong> 5 years from training completion</li>
                </ul>

                <h3 className="text-xl font-medium text-gray-800 mb-2">Data Security</h3>
                <p className="text-gray-700 mb-4">
                  All AML/KYC records are protected through:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700">
                  <li>Encryption at rest and in transit</li>
                  <li>Access controls and audit trails</li>
                  <li>Secure backup and recovery procedures</li>
                  <li>Regular security assessments</li>
                </ul>
              </div>

              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Training and Awareness</h2>
                
                <h3 className="text-xl font-medium text-gray-800 mb-2">Staff Training</h3>
                <p className="text-gray-700 mb-4">
                  All relevant staff receive training on:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700">
                  <li>AML/KYC regulations and requirements</li>
                  <li>Red flags and suspicious activity indicators</li>
                  <li>Customer due diligence procedures</li>
                  <li>Sanctions screening and compliance</li>
                  <li>Record keeping and reporting obligations</li>
                </ul>

                <h3 className="text-xl font-medium text-gray-800 mb-2">Ongoing Education</h3>
                <p className="text-gray-700 mb-4">
                  We provide:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700">
                  <li>Annual refresher training</li>
                  <li>Updates on regulatory changes</li>
                  <li>Industry best practice sharing</li>
                  <li>Case study reviews</li>
                </ul>
              </div>

              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Governance and Oversight</h2>
                
                <h3 className="text-xl font-medium text-gray-800 mb-2">Compliance Officer</h3>
                <p className="text-gray-700 mb-4">
                  Our designated AML/KYC Compliance Officer:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700">
                  <li>Oversees compliance program implementation</li>
                  <li>Reviews and approves policies and procedures</li>
                  <li>Monitors regulatory developments</li>
                  <li>Serves as primary contact with regulators</li>
                  <li>Reports to senior management and board</li>
                </ul>

                <h3 className="text-xl font-medium text-gray-800 mb-2">Regular Reviews</h3>
                <p className="text-gray-700 mb-4">
                  We conduct:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700">
                  <li>Annual policy reviews and updates</li>
                  <li>Quarterly risk assessments</li>
                  <li>Independent compliance audits</li>
                  <li>Management oversight and reporting</li>
                </ul>
              </div>

              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Customer Rights and Responsibilities</h2>
                
                <h3 className="text-xl font-medium text-gray-800 mb-2">Your Rights</h3>
                <p className="text-gray-700 mb-4">
                  You have the right to:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700">
                  <li>Understand why we need certain information</li>
                  <li>Receive clear explanations of our procedures</li>
                  <li>Have your data protected and used appropriately</li>
                  <li>Appeal decisions where appropriate</li>
                  <li>Request correction of inaccurate information</li>
                </ul>

                <h3 className="text-xl font-medium text-gray-800 mb-2">Your Responsibilities</h3>
                <p className="text-gray-700 mb-4">
                  You are required to:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700">
                  <li>Provide accurate and complete information</li>
                  <li>Update us when your information changes</li>
                  <li>Respond to our requests for additional documentation</li>
                  <li>Use our services for legitimate purposes only</li>
                  <li>Report suspicious activity to us</li>
                </ul>
              </div>

              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Contact Information</h2>
                <p className="text-gray-700 mb-4">
                  For AML/KYC related questions or to report suspicious activity:
                </p>
                <div className="bg-gray-100 p-6 rounded-lg">
                  <p className="font-medium text-gray-800">AML/KYC Compliance Officer</p>
                  <p className="text-gray-700">Email: <a href="mailto:compliance@coindaily.online" className="text-blue-600 hover:text-blue-800">compliance@coindaily.online</a></p>
                  <p className="text-gray-700">Phone: +234 (0) 123-456-7890</p>
                  <p className="text-gray-700">Emergency: Available 24/7 for suspicious activity reports</p>
                  <p className="text-gray-700 mt-2">
                    <strong>Mailing Address:</strong><br />
                    Compliance Department<br />
                    CoinDaily Online<br />
                    [Address Line 1]<br />
                    Lagos, Nigeria
                  </p>
                </div>
              </div>

              <div className="border-t pt-6">
                <p className="text-sm text-gray-600">
                  This AML/KYC Policy is part of our comprehensive compliance framework. Please also review our{' '}
                  <Link href="/legal/terms" className="text-blue-600 hover:text-blue-800">Terms of Service</Link>,{' '}
                  <Link href="/legal/privacy" className="text-blue-600 hover:text-blue-800">Privacy Policy</Link>, and{' '}
                  <Link href="/legal/security" className="text-blue-600 hover:text-blue-800">Security Policy</Link>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
