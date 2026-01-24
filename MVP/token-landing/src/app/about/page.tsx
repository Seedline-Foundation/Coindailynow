import Image from 'next/image';
import Link from 'next/link';

export default function AboutPage() {
  const teamMembers = [
    {
      name: 'Niceface',
      role: 'Founder/CEO',
      image: '/Nice Face.png',
      bio: 'Developer, Blockchain Analyst And Growth executor. Experienced Crypto developer and innovator building Web3 products, media platforms, and smart-contract solutions with a focus on impact, clarity, and excellence.',
      achievements: [
        'Founder of Nice Studio',
        'Dune Analytics Wizard',
      ],
      links: [
        { name: 'Nice Studio', url: 'https://www.analyticsdashboardbuilder.xyz/' },
        { name: 'Dune Profile', url: 'https://dune.com/wincloud' },
        { name: 'Twitter', url: 'https://twitter.com/Iheanyichima' },
      ]
    },
    {
      name: 'Denis',
      role: 'UI/UX Specialist',
      image: '/Dannis.jpg',
      bio: 'Highly-motivated, creative and pro-active designer and web developer able to research, design and develop user experiences for various digital products including mobile applications, websites and web applications.',
      achievements: [
        'Expert in User Experience Design',
        'Full-Stack Web Developer',
      ],
      links: [
        { name: 'Portfolio', url: 'https://www.denniskimathi.dev/resume' },
      ]
    },
    {
      name: 'Elhassan',
      role: 'Fullstack Developer',
      image: '/Elhassan.png',
      bio: 'Experienced software engineer, successful in project management for software and system development. Looking for challenges that allow joining dynamic, ambitious, successful organisations to build new products, solve technical problems and develop existing skills in programming.',
      achievements: [
        'Expert in Project Management',
        'System Development Specialist',
      ],
      links: [
        { name: 'Portfolio', url: 'https://hassandiv.github.io/' },
      ],
    },
    {
      name: 'Warren',
      role: 'Fullstack Developer',
      image: '/Warren.jpg',
      bio: 'Computer Science graduate from the Technical University of Mombasa. Versatile Full-Stack Developer with expertise in both traditional web and Web3 technologies. Passionate about building the decentralized future through innovative blockchain solutions.',
      achievements: [
        'Web3 Technology Expert',
        'Frontend & Backend Specialist',
      ],
      links: [
        { name: 'GitHub', url: 'https://github.com/warrenshiv' },
      ]
    },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black pt-20">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-transparent to-accent-500/10"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="gradient-text">About Joy Token</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              Building Africa's premier utility token ecosystem with a team of experienced crypto innovators, 
              developers, and blockchain specialists. Combined experience of over 10 years in the crypto industry.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/presale"
                className="bg-gradient-to-r from-primary-500 to-accent-500 text-white px-8 py-3 rounded-full font-bold hover:shadow-lg hover:shadow-primary-500/50 transition-all"
              >
                Join Our Presale
              </Link>
              <Link
                href="/whitepaper"
                className="bg-gray-800 text-white px-8 py-3 rounded-full font-bold hover:bg-gray-700 transition-all border border-gray-700"
              >
                Read Whitepaper
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-8 md:p-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 gradient-text">Our Mission</h2>
              <p className="text-gray-300 text-lg leading-relaxed mb-6">
                Joy Token is more than just a cryptocurrency - it's the utility backbone of the CoinDaily ecosystem, 
                CoinDaily is Africa's leading crypto, blockchain, and AI news Hub platform. It is not just your normal news platform, 
                but the next generation African widest read innovative news platform. We're building a comprehensive Web3 news infrastructure ecosystem 
                that combines real-world utility with sustainable tokenomics.
              </p>
              <p className="text-gray-300 text-lg leading-relaxed">
                Our team brings together decades of experience in blockchain development, user experience design, 
                system architecture, and crypto market analysis. We're committed to delivering innovative solutions 
                that drive real value for our community and stakeholders.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 gradient-text">Meet Our Team</h2>
            <p className="text-xl text-gray-400">
              Experienced professionals building the future of African crypto
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {teamMembers.map((member, index) => (
              <div
                key={member.name}
                className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-8 hover:border-primary-500/50 transition-all group"
              >
                <div className="flex flex-col items-center text-center">
                  {/* Profile Image */}
                  <div className="relative w-40 h-40 mb-6">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                    <div className="relative w-full h-full rounded-full overflow-hidden border-4 border-gray-800 group-hover:border-primary-500/50 transition-colors">
                      <Image
                        src={member.image}
                        alt={member.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>

                  {/* Info */}
                  <h3 className="text-2xl font-bold text-white mb-2">{member.name}</h3>
                  <p className="text-primary-500 font-semibold mb-4">{member.role}</p>
                  
                  <p className="text-gray-400 mb-6 leading-relaxed">
                    {member.bio}
                  </p>

                  {/* Achievements */}
                  <div className="mb-6 w-full">
                    <ul className="space-y-2">
                      {member.achievements.map((achievement) => (
                        <li key={achievement} className="flex items-center justify-center text-sm text-gray-400">
                          <svg className="w-4 h-4 text-primary-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          {achievement}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Links */}
                  <div className="flex flex-wrap justify-center gap-3">
                    {member.links.map((link) => (
                      <a
                        key={link.name}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm bg-gray-800 hover:bg-primary-500 text-gray-300 hover:text-white px-4 py-2 rounded-full transition-colors"
                      >
                        {link.name}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Growing Team Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-gradient-to-br from-primary-500/10 to-accent-500/10 border border-primary-500/20 rounded-2xl p-8 md:p-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 gradient-text">We're Growing</h2>
              <p className="text-gray-300 text-lg leading-relaxed mb-8">
                We're actively seeking more senior professionals to join our team and help build the future of African crypto. 
                If you're passionate about blockchain technology and want to make a real impact, we want to hear from you.
              </p>
              <Link
                href="/careers"
                className="inline-block bg-gradient-to-r from-primary-500 to-accent-500 text-white px-8 py-3 rounded-full font-bold hover:shadow-lg hover:shadow-primary-500/50 transition-all"
              >
                View Open Positions
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 gradient-text">Our Values</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Transparency</h3>
              <p className="text-gray-400">
                Open communication and honest practices in everything we do
              </p>
            </div>

            <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Innovation</h3>
              <p className="text-gray-400">
                Pushing boundaries with cutting-edge blockchain solutions
              </p>
            </div>

            <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Community</h3>
              <p className="text-gray-400">
                Building together with our users and stakeholders
              </p>
            </div>

            <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Integrity</h3>
              <p className="text-gray-400">
                Upholding honesty and strong moral principles in all our actions
              </p>
            </div>

            <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Love</h3>
              <p className="text-gray-400">
                Caring deeply about our community, users, and the impact we create
              </p>
            </div>

            <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Audacious</h3>
              <p className="text-gray-400">
                Bold and daring in our vision to transform African crypto landscape
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 gradient-text">
              Join the Joy Token Revolution
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Be part of Africa's crypto future. Join our presale today.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/presale"
                className="bg-gradient-to-r from-primary-500 to-accent-500 text-white px-8 py-4 rounded-full font-bold hover:shadow-lg hover:shadow-primary-500/50 transition-all text-lg"
              >
                Join Presale Now
              </Link>
              <Link
                href="/contact"
                className="bg-gray-800 text-white px-8 py-4 rounded-full font-bold hover:bg-gray-700 transition-all border border-gray-700 text-lg"
              >
                Get in Touch
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
