import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Security Policy | CoinDaily Online',
  description: 'Learn about CoinDaily Online\'s security measures, data protection practices, and how we keep your information safe.',
  robots: 'index, follow',
};

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="px-6 py-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Security Policy
              </h1>
              <p className="text-sm text-gray-600">
                Last Updated: December 2024
              </p>
            </div>

            <div className="prose max-w-none">
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Our Commitment to Security</h2>
                <p className="text-gray-700 mb-4">
                  At CoinDaily Online, we take the security of your data and our platform seriously. This Security Policy outlines our comprehensive approach to protecting your information and maintaining a secure environment for all users.
                </p>
              </div>

              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Data Protection Measures</h2>
                
                <h3 className="text-xl font-medium text-gray-800 mb-2">Encryption</h3>
                <p className="text-gray-700 mb-4">
                  We implement industry-standard encryption protocols:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700">
                  <li><strong>Data in Transit:</strong> All data transmitted between your browser and our servers is protected using TLS 1.3 encryption</li>
                  <li><strong>Data at Rest:</strong> Sensitive data stored in our databases is encrypted using AES-256 encryption</li>
                  <li><strong>API Communications:</strong> All API endpoints use HTTPS with certificate pinning</li>
                  <li><strong>Password Storage:</strong> User passwords are hashed using bcrypt with salt</li>
                </ul>

                <h3 className="text-xl font-medium text-gray-800 mb-2">Access Controls</h3>
                <p className="text-gray-700 mb-4">
                  We maintain strict access controls:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700">
                  <li>Multi-factor authentication (MFA) for all administrative accounts</li>
                  <li>Role-based access control (RBAC) limiting data access to authorized personnel only</li>
                  <li>Regular access reviews and deprovisioning of inactive accounts</li>
                  <li>Principle of least privilege for all system access</li>
                </ul>
              </div>

              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Infrastructure Security</h2>
                
                <h3 className="text-xl font-medium text-gray-800 mb-2">Cloud Security</h3>
                <p className="text-gray-700 mb-4">
                  Our infrastructure is built on secure cloud platforms:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700">
                  <li>Hosting with SOC 2 Type II certified cloud providers</li>
                  <li>Distributed denial-of-service (DDoS) protection</li>
                  <li>Web Application Firewall (WAF) filtering malicious traffic</li>
                  <li>Regular security patching and updates</li>
                  <li>Isolated network environments for different services</li>
                </ul>

                <h3 className="text-xl font-medium text-gray-800 mb-2">Database Security</h3>
                <p className="text-gray-700 mb-4">
                  Our databases are protected through:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700">
                  <li>Network isolation and private subnets</li>
                  <li>Automated backups with encryption</li>
                  <li>Database activity monitoring and logging</li>
                  <li>SQL injection protection and input validation</li>
                  <li>Regular database security assessments</li>
                </ul>
              </div>

              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Application Security</h2>
                
                <h3 className="text-xl font-medium text-gray-800 mb-2">Secure Development</h3>
                <p className="text-gray-700 mb-4">
                  We follow secure coding practices:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700">
                  <li>Secure Software Development Lifecycle (SSDLC)</li>
                  <li>Regular code reviews and security assessments</li>
                  <li>Automated security testing in our CI/CD pipeline</li>
                  <li>Dependency scanning for known vulnerabilities</li>
                  <li>Static and dynamic application security testing (SAST/DAST)</li>
                </ul>

                <h3 className="text-xl font-medium text-gray-800 mb-2">Input Validation</h3>
                <p className="text-gray-700 mb-4">
                  All user inputs are validated and sanitized:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700">
                  <li>Server-side validation for all form submissions</li>
                  <li>Cross-Site Scripting (XSS) protection</li>
                  <li>Cross-Site Request Forgery (CSRF) tokens</li>
                  <li>Content Security Policy (CSP) headers</li>
                  <li>File upload restrictions and scanning</li>
                </ul>
              </div>

              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Monitoring and Detection</h2>
                
                <h3 className="text-xl font-medium text-gray-800 mb-2">Security Monitoring</h3>
                <p className="text-gray-700 mb-4">
                  We maintain 24/7 security monitoring:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700">
                  <li>Real-time intrusion detection systems (IDS)</li>
                  <li>Security Information and Event Management (SIEM)</li>
                  <li>Automated threat detection and response</li>
                  <li>Behavioral analytics for anomaly detection</li>
                  <li>Regular security log analysis and review</li>
                </ul>

                <h3 className="text-xl font-medium text-gray-800 mb-2">Incident Response</h3>
                <p className="text-gray-700 mb-4">
                  Our incident response process includes:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700">
                  <li>24/7 security operations center (SOC)</li>
                  <li>Documented incident response procedures</li>
                  <li>Automated containment and mitigation measures</li>
                  <li>Forensic analysis capabilities</li>
                  <li>Communication protocols for affected users</li>
                </ul>
              </div>

              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">User Security</h2>
                
                <h3 className="text-xl font-medium text-gray-800 mb-2">Account Security</h3>
                <p className="text-gray-700 mb-4">
                  We provide tools to help secure your account:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700">
                  <li>Strong password requirements and recommendations</li>
                  <li>Two-factor authentication (2FA) options</li>
                  <li>Account activity monitoring and alerts</li>
                  <li>Secure password reset procedures</li>
                  <li>Session management and automatic logout</li>
                </ul>

                <h3 className="text-xl font-medium text-gray-800 mb-2">User Education</h3>
                <p className="text-gray-700 mb-4">
                  We educate users about security best practices:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700">
                  <li>Phishing awareness and prevention tips</li>
                  <li>Password security guidelines</li>
                  <li>Safe browsing practices</li>
                  <li>Cryptocurrency security education</li>
                  <li>Regular security awareness updates</li>
                </ul>
              </div>

              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Compliance and Certifications</h2>
                
                <h3 className="text-xl font-medium text-gray-800 mb-2">Regulatory Compliance</h3>
                <p className="text-gray-700 mb-4">
                  We comply with relevant security regulations:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700">
                  <li>Nigeria Data Protection Regulation (NDPR) requirements</li>
                  <li>General Data Protection Regulation (GDPR) for EU users</li>
                  <li>California Consumer Privacy Act (CCPA) for California residents</li>
                  <li>Industry-specific security standards</li>
                </ul>

                <h3 className="text-xl font-medium text-gray-800 mb-2">Security Audits</h3>
                <p className="text-gray-700 mb-4">
                  We conduct regular security assessments:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700">
                  <li>Annual third-party security audits</li>
                  <li>Quarterly vulnerability assessments</li>
                  <li>Penetration testing by certified professionals</li>
                  <li>Compliance audits and certifications</li>
                </ul>
              </div>

              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Data Retention and Disposal</h2>
                
                <h3 className="text-xl font-medium text-gray-800 mb-2">Data Lifecycle Management</h3>
                <p className="text-gray-700 mb-4">
                  We manage data securely throughout its lifecycle:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700">
                  <li>Defined data retention periods based on legal requirements</li>
                  <li>Secure data archival processes</li>
                  <li>Automated data purging for expired data</li>
                  <li>Cryptographic shredding for secure deletion</li>
                  <li>Certificate of destruction for physical media</li>
                </ul>
              </div>

              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Business Continuity</h2>
                
                <h3 className="text-xl font-medium text-gray-800 mb-2">Backup and Recovery</h3>
                <p className="text-gray-700 mb-4">
                  We maintain robust backup and recovery systems:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700">
                  <li>Automated daily backups with encryption</li>
                  <li>Geographically distributed backup storage</li>
                  <li>Regular backup restoration testing</li>
                  <li>Disaster recovery procedures and testing</li>
                  <li>Business continuity planning</li>
                </ul>
              </div>

              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Reporting Security Issues</h2>
                
                <h3 className="text-xl font-medium text-gray-800 mb-2">Responsible Disclosure</h3>
                <p className="text-gray-700 mb-4">
                  If you discover a security vulnerability, please report it responsibly:
                </p>
                
                <div className="bg-gray-100 p-6 rounded-lg mb-4">
                  <p className="font-medium text-gray-800">Security Team</p>
                  <p className="text-gray-700">Email: <a href="mailto:security@coindaily.online" className="text-blue-600 hover:text-blue-800">security@coindaily.online</a></p>
                  <p className="text-gray-700">Subject Line: Security Vulnerability Report</p>
                  <p className="text-gray-700">GPG Key: Available upon request</p>
                </div>

                <h3 className="text-xl font-medium text-gray-800 mb-2">Bug Bounty Program</h3>
                <p className="text-gray-700 mb-4">
                  We operate a responsible disclosure program that may include rewards for:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700">
                  <li>Critical security vulnerabilities</li>
                  <li>Data exposure risks</li>
                  <li>Authentication bypass issues</li>
                  <li>Injection vulnerabilities</li>
                </ul>
              </div>

              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Security Updates</h2>
                <p className="text-gray-700 mb-4">
                  We are committed to transparency about security:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700">
                  <li>Regular security bulletins and updates</li>
                  <li>Incident notifications to affected users</li>
                  <li>Annual security report publication</li>
                  <li>Security policy updates and notifications</li>
                </ul>
              </div>

              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Contact Information</h2>
                <p className="text-gray-700 mb-4">
                  For security-related questions or concerns:
                </p>
                <div className="bg-gray-100 p-4 rounded-lg">
                  <p className="text-gray-700">Security Team: <a href="mailto:security@coindaily.online" className="text-blue-600 hover:text-blue-800">security@coindaily.online</a></p>
                  <p className="text-gray-700">General Inquiries: <a href="mailto:legal@coindaily.online" className="text-blue-600 hover:text-blue-800">legal@coindaily.online</a></p>
                  <p className="text-gray-700">Emergency: Available 24/7 through security email</p>
                </div>
              </div>

              <div className="border-t pt-6">
                <p className="text-sm text-gray-600">
                  This Security Policy complements our{' '}
                  <Link href="/legal/privacy" className="text-blue-600 hover:text-blue-800">Privacy Policy</Link>,{' '}
                  <Link href="/legal/terms" className="text-blue-600 hover:text-blue-800">Terms of Service</Link>, and{' '}
                  <Link href="/legal/aml-kyc" className="text-blue-600 hover:text-blue-800">AML/KYC Policy</Link>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
