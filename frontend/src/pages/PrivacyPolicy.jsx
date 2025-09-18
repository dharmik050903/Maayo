import React from 'react'
import Header from '../components/Header'

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-brand-gradient">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-graphite mb-8">Privacy Policy</h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-coolgray mb-6">
              <strong>Last updated:</strong> {new Date().toLocaleDateString()}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-graphite mb-4">1. Information We Collect</h2>
              <div className="text-coolgray space-y-4">
                <p>
                  We collect information you provide directly to us, such as when you create an account, 
                  use our services, or contact us for support.
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Account information (name, email, phone number)</li>
                  <li>Profile information (skills, experience, portfolio)</li>
                  <li>Project and bid information</li>
                  <li>Payment and billing information</li>
                  <li>Communications with us</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-graphite mb-4">2. How We Use Your Information</h2>
              <div className="text-coolgray space-y-4">
                <p>We use the information we collect to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Provide, maintain, and improve our services</li>
                  <li>Process transactions and send related information</li>
                  <li>Send technical notices and support messages</li>
                  <li>Respond to your comments and questions</li>
                  <li>Monitor and analyze trends and usage</li>
                  <li>Personalize and improve your experience</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-graphite mb-4">3. Information Sharing</h2>
              <div className="text-coolgray space-y-4">
                <p>We do not sell, trade, or otherwise transfer your personal information to third parties except:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>With your consent</li>
                  <li>To comply with legal obligations</li>
                  <li>To protect our rights and safety</li>
                  <li>In connection with a business transfer</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-graphite mb-4">4. Data Security</h2>
              <div className="text-coolgray space-y-4">
                <p>
                  We implement appropriate security measures to protect your personal information against 
                  unauthorized access, alteration, disclosure, or destruction.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-graphite mb-4">5. Your Rights</h2>
              <div className="text-coolgray space-y-4">
                <p>You have the right to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Access your personal information</li>
                  <li>Correct inaccurate information</li>
                  <li>Delete your account and data</li>
                  <li>Opt-out of marketing communications</li>
                  <li>Data portability</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-graphite mb-4">6. Cookies and Tracking</h2>
              <div className="text-coolgray space-y-4">
                <p>
                  We use cookies and similar technologies to enhance your experience, analyze usage, 
                  and provide personalized content.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-graphite mb-4">7. Changes to This Policy</h2>
              <div className="text-coolgray space-y-4">
                <p>
                  We may update this Privacy Policy from time to time. We will notify you of any changes 
                  by posting the new Privacy Policy on this page.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-graphite mb-4">8. Contact Us</h2>
              <div className="text-coolgray space-y-4">
                <p>
                  If you have any questions about this Privacy Policy, please contact us at:
                </p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p><strong>Email:</strong> privacy@maayo.com</p>
                  <p><strong>Address:</strong> Maayo Platform, India</p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PrivacyPolicy
