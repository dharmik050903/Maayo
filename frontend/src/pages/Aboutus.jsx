import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import Header from '../components/Header'
import Button from '../components/Button'
import { isAuthenticated, getCurrentUser, clearAuth } from '../utils/api'

export default function AboutUs() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      console.log('AboutUs: useEffect running (first time)');
      
      // Check if user is authenticated
      const authStatus = isAuthenticated();
      console.log('AboutUs: Authentication status:', authStatus);
      
      if (authStatus) {
        // Get user data if authenticated
        const user = getCurrentUser();
        console.log('AboutUs: User data:', user);
        
        if (user) {
          setUserData(user);
        }
      }
      
      // Set loading to false after initialization
      setLoading(false);
    } else {
      console.log('AboutUs: Skipping duplicate initialization due to StrictMode');
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mint mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base">
      <Header 
        userType={userData?.user_type || 'client'} 
        userData={userData} 
        onLogout={clearAuth}
      />
      
      <div className="pt-20">
        {/* Hero Section */}
        <section className="bg-brand-gradient text-white py-16">
          <div className="max-w-6xl mx-auto px-6 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              📖 About <span className="text-mint">Maayo</span>
        </h1>
            <p className="text-xl text-white/90 mb-4">
              Empowering Borderless Work & Hiring
            </p>
            <p className="text-lg text-white/80 mb-8">
              Maayo is a next-generation freelance marketplace connecting top clients and elite talent across the globe. Founded on principles of trust, transparency, and performance, Maayo allows businesses to effortlessly post projects and freelance professionals to build rewarding careers—all with zero hidden client fees and industry-leading compliance.
            </p>
            <div className="grid md:grid-cols-3 gap-6 mt-8">
              <div className="bg-white/10 rounded-lg p-4">
                <h3 className="text-2xl font-bold text-mint">20,000+</h3>
                <p className="text-white/90">Active Projects Worldwide</p>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <h3 className="text-2xl font-bold text-mint">₹2 Million+</h3>
                <p className="text-white/90">in Freelancer Earnings Paid</p>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <h3 className="text-2xl font-bold text-mint">5,000+</h3>
                <p className="text-white/90">Satisfied Businesses</p>
              </div>
            </div>
          </div>
        </section>

        <div className="max-w-6xl mx-auto px-6 py-12">
  
        {/* Our Story */}
          <section className="card p-8 mb-12">
            <h2 className="text-3xl font-bold text-graphite mb-6">Our Story</h2>
            <div className="space-y-4 text-coolgray leading-relaxed">
              <p>
            Founded in Vadodara, Gujarat, Maayo was born from the vision of creating
            a fair, transparent, and intelligent freelance ecosystem. In 2025, while
            the global freelance economy was booming, we noticed existing platforms
            were often complex, expensive, and unfair. High fees, hidden costs, and
            poor support left both freelancers and clients dissatisfied.
          </p>
          <p>
            Maayo started with one belief: freelancing should be accessible,
            affordable, and rewarding for everyone.
          </p>
            </div>
        </section>
  
        {/* Mission & Vision */}
        <section className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="card p-8">
              <h2 className="text-2xl font-bold text-graphite mb-4">Our Mission</h2>
              <p className="text-coolgray leading-relaxed">
              To democratize freelancing by creating the world's most fair,
              intelligent, and user-friendly marketplace where talent meets
              opportunity.
            </p>
          </div>
            <div className="card p-8">
              <h2 className="text-2xl font-bold text-graphite mb-4">Our Vision</h2>
              <p className="text-coolgray leading-relaxed">
              By 2030, Maayo will be the global bridge connecting Indian talent with
              worldwide opportunities—helping over 10 million freelancers build
              careers and 1 million+ businesses find partners.
            </p>
          </div>
        </section>
  
        {/* What Makes Us Different */}
          <section className="card p-8 mb-12">
            <h2 className="text-3xl font-bold text-graphite mb-6">What Makes Maayo Different</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-mint/10 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-mint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-graphite text-lg">Zero Client Fees</h3>
                    <p className="text-coolgray">Post unlimited projects for free.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-violet/10 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-violet" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-graphite text-lg">Lowest Freelancer Fees</h3>
                    <p className="text-coolgray">Keep 95% of your earnings.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-coral/10 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-coral" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-graphite text-lg">AI-Powered Tools</h3>
                    <p className="text-coolgray">Smarter proposals, better matches.</p>
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-graphite text-lg">Made in India, Built for the World</h3>
                    <p className="text-coolgray">UPI, Hindi, global compliance.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-mint/10 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-mint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-graphite text-lg">Trust & Transparency</h3>
                    <p className="text-coolgray">KYC, escrow, dispute resolution.</p>
                  </div>
                </div>
              </div>
            </div>
        </section>
  
        {/* Values */}
          <section className="card p-8 mb-12">
            <h2 className="text-3xl font-bold text-graphite mb-8">Our Values</h2>
            <div className="grid md:grid-cols-5 gap-6 text-center">
              <div className="space-y-3">
                <div className="w-16 h-16 bg-mint/10 rounded-xl flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-mint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-graphite">Fairness First</h3>
              </div>
              <div className="space-y-3">
                <div className="w-16 h-16 bg-violet/10 rounded-xl flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-violet" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-graphite">Innovation with Purpose</h3>
              </div>
              <div className="space-y-3">
                <div className="w-16 h-16 bg-coral/10 rounded-xl flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-coral" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-graphite">Community Over Profit</h3>
              </div>
              <div className="space-y-3">
                <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-graphite">Integrity Always</h3>
              </div>
              <div className="space-y-3">
                <div className="w-16 h-16 bg-mint/10 rounded-xl flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-mint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-graphite">Excellence in Execution</h3>
              </div>
            </div>
        </section>
  
        {/* Impact */}
          <section className="card p-8 mb-12">
            <h2 className="text-3xl font-bold text-graphite mb-6">Our Impact</h2>
            <p className="text-coolgray mb-6 leading-relaxed">
              Since launch, Maayo has become more than just a marketplace—we're a
            catalyst for change.
          </p>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-mint/10 rounded-lg">
                <h3 className="font-bold text-graphite mb-2">Freelancers</h3>
                <p className="text-coolgray">35% higher success rates, 60% faster matching</p>
              </div>
              <div className="text-center p-4 bg-violet/10 rounded-lg">
                <h3 className="font-bold text-graphite mb-2">Businesses</h3>
                <p className="text-coolgray">Zero extra fees, 40% better project outcomes</p>
              </div>
              <div className="text-center p-4 bg-coral/10 rounded-lg">
                <h3 className="font-bold text-graphite mb-2">Ecosystem</h3>
                <p className="text-coolgray">Supporting India's ₹455B gig economy, Tier-2/Tier-3 growth</p>
              </div>
            </div>
        </section>
  
        {/* Tech + Leadership */}
          <section className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="card p-8">
              <h2 className="text-2xl font-bold text-graphite mb-4">Our Technology</h2>
              <p className="text-coolgray leading-relaxed">
            AI-powered matching, secure payments, proposal assistant, and advanced
            analytics—everything built for scale, security, and success.
          </p>
            </div>
            <div className="card p-8">
              <h2 className="text-2xl font-bold text-graphite mb-4">Leadership</h2>
              <p className="text-coolgray leading-relaxed">
            Maayo was founded with the passion to empower Indian talent globally,
            guided by an advisory board of entrepreneurs, tech leaders, and
            freelancing veterans.
          </p>
            </div>
        </section>
  
        {/* Commitment */}
          <section className="card p-8 mb-12">
            <h2 className="text-3xl font-bold text-graphite mb-6">Our Commitment</h2>
            <p className="text-coolgray leading-relaxed text-center text-lg">
            To freelancers, clients, and our community—Maayo stands for fairness,
            innovation, ethical practices, and creating opportunities across India.
          </p>
        </section>
  
        {/* Contact */}
          <section className="card p-8 mb-12">
            <h2 className="text-3xl font-bold text-graphite mb-8">Contact Us</h2>
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div className="space-y-4">
                <div className="w-16 h-16 bg-mint/10 rounded-xl flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-mint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-graphite mb-2">Location</h3>
                  <p className="text-coolgray">Vadodara, Gujarat, India</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="w-16 h-16 bg-violet/10 rounded-xl flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-violet" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-graphite mb-2">Contact</h3>
                  <p className="text-coolgray">hello@amayo.com</p>
                  <p className="text-coolgray">+91 76228 57376</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="w-16 h-16 bg-coral/10 rounded-xl flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-coral" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-graphite mb-2">Website</h3>
                  <p className="text-coolgray">www.amayo.com</p>
                </div>
              </div>
            </div>
        </section>
  
          {/* Closing CTA */}
          <section className="bg-brand-gradient text-white rounded-xl p-12 text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Maayo – Where Talent Meets Opportunity</h2>
            <p className="text-xl text-white/90 mb-8">Join thousands of freelancers and businesses building success together.</p>
            <Link to="/signup">
              <Button variant="accent" className="text-lg px-8 py-4">
            Sign Up Free →
              </Button>
            </Link>
          </section>
        </div>

        </div>
      </div>
    );
  }
  