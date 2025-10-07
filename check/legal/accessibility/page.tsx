import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Accessibility Statement | CoinDaily',
  description: 'Our commitment to digital accessibility for all users.',
  robots: 'index, follow',
};

export default function AccessibilityPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="prose prose-lg max-w-none">
        <h1>Accessibility Statement</h1>
        <p className="text-gray-600">Effective Date: July 31, 2025</p>

        <p>
          CoinDaily (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) is committed to ensuring digital accessibility 
          for all users, including those with disabilities. We aim to provide a user-friendly 
          experience across our website and services.
        </p>

        <h2>Measures to Support Accessibility</h2>
        <ul>
          <li>Adhere to WCAG 2.1 AA guidelines where feasible.</li>
          <li>Use semantic HTML, proper ARIA attributes, and descriptive alt text for images.</li>
          <li>Ensure keyboard navigability and focus indicators for interactive elements.</li>
          <li>Provide sufficient color contrast between text and backgrounds.</li>
          <li>Regularly audit accessibility using tools (e.g., axe-core, Lighthouse) and manual testing.</li>
        </ul>

        <h2>Ongoing Efforts</h2>
        <ul>
          <li>Continuous monitoring and improvement of accessibility features.</li>
          <li>Training for content creators and developers on accessibility best practices.</li>
          <li>Soliciting feedback from users to identify and address issues.</li>
        </ul>

        <h2>Feedback & Contact</h2>
        <p>If you encounter any accessibility barriers, please contact us:</p>
        <ul>
          <li>Email: <a href="mailto:accessibility@coindaily.com" className="text-blue-600 hover:text-blue-800">accessibility@coindaily.com</a></li>
          <li>Phone: +1 (302) 555-0199 (US) / +234 (1) 1234-568 (Nigeria)</li>
        </ul>

        <p>
          We will make every reasonable effort to address your concerns and improve our accessibility.
        </p>
      </div>
    </div>
  );
}
