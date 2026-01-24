import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: [
      { name: 'Tokenomics', href: '/tokenomics' },
      { name: 'Staking', href: '/staking' },
      { name: 'Presale', href: '/presale' },
      { name: 'Whitepaper', href: '/whitepaper' },
      { name: 'Pitch', href: '/pitch' },
    ],
    community: [
      { name: 'OG Champs', href: '/ambassador' },
      { name: 'Affiliate Program', href: '/affiliate/register' },
      { name: 'Bounties', href: '/bounty' },
      { name: 'Dashboard', href: '/dashboard' },
      { name: 'Careers', href: '/careers' },
    ],
    resources: [
      { name: 'About Us', href: '/about' },
      { name: 'How to Buy', href: '/#how-to-buy' },
      { name: 'CoinDaily Platform', href: 'https://coindaily.online' },
      { name: 'FAQs', href: '/faq' },
      { name: 'Contact', href: '/contact' },
    ],
    social: [
      { name: 'Twitter', href: 'https://twitter.com/coindaily001' },
      { name: 'Telegram', href: 'https://t.me/coindailynewz' },
    ],
  };

  return (
    <footer className="bg-gray-900 border-t border-gray-800 py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">JY</span>
              </div>
              <span className="text-xl font-bold gradient-text">Joy Token</span>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              Africa's premier utility token powering the CoinDaily ecosystem. Real yield, real utility.
            </p>
            <div className="flex space-x-4">
              <a href="https://twitter.com/coindaily001" className="text-gray-400 hover:text-primary-500 transition-colors">
                <span className="sr-only">Twitter</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a href="https://t.me/coindailynewz" className="text-gray-400 hover:text-primary-500 transition-colors">
                <span className="sr-only">Telegram</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18.717-1.078 4.465-1.524 5.926-.189.62-.561.827-.921.847-.783.072-1.377-.518-2.135-1.015-1.187-.779-1.856-1.264-3.011-2.024-1.335-.878-.47-1.36.291-2.149.199-.207 3.656-3.352 3.725-3.641.009-.036.017-.171-.064-.242-.081-.071-.2-.047-.285-.028-.122.028-2.065 1.313-5.832 3.856-.552.378-1.052.562-1.501.552-.494-.011-1.444-.279-2.15-.509-.866-.281-1.554-.43-1.495-.908.03-.248.376-.502.997-.761 3.906-1.702 6.51-2.826 7.812-3.374 3.719-1.551 4.488-1.821 4.991-1.83.111-.002.358.026.519.159.136.112.173.264.191.371.018.107.041.351.023.542z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-white font-bold mb-4">Product</h3>
            <ul className="space-y-2">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-gray-400 hover:text-primary-500 transition-colors text-sm">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-bold mb-4">Community</h3>
            <ul className="space-y-2">
              {footerLinks.community.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-gray-400 hover:text-primary-500 transition-colors text-sm">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-bold mb-4">Resources</h3>
            <ul className="space-y-2">
              {footerLinks.resources.map((link) => (
                <li key={link.name}>
                  {link.href.startsWith('http') ? (
                    <a 
                      href={link.href} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-gray-400 hover:text-primary-500 transition-colors text-sm"
                    >
                      {link.name}
                    </a>
                  ) : (
                    <Link href={link.href} className="text-gray-400 hover:text-primary-500 transition-colors text-sm">
                      {link.name}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm mb-4 md:mb-0">
            © {currentYear} Joy Token. All rights reserved.
          </p>
          <div className="flex space-x-6">
            <Link href="/privacy" className="text-gray-400 hover:text-primary-500 transition-colors text-sm">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-gray-400 hover:text-primary-500 transition-colors text-sm">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
