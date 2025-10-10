import React from 'react'
import Header from '../components/Header'

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-brand-gradient">
      <Header />
      
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-4xl mx-auto bg-white rounded-[2rem] shadow-lg p-8">
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
                  <li><strong>Personal Information:</strong> Name, email, mobile number, work/project data</li>
                  <li><strong>Account Information:</strong> Profile details, skills, experience, portfolio</li>
                  <li><strong>Financial Information:</strong> Funds transfer data, payment methods, billing details</li>
                  <li><strong>Usage Data:</strong> Device usage, platform interactions, analytics data</li>
                  <li><strong>Communication Data:</strong> Messages, project discussions, support tickets</li>
                  <li><strong>Compliance Data:</strong> KYC documents, verification information</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-graphite mb-4">2. How We Use Your Information</h2>
              <div className="text-coolgray space-y-4">
                <p>We use the information we collect for the following purposes:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Account Creation:</strong> Set up and manage your Maayo account</li>
                  <li><strong>Project Matchmaking:</strong> Connect clients with suitable freelancers</li>
                  <li><strong>Security:</strong> Protect against fraud and unauthorized access</li>
                  <li><strong>Payments:</strong> Process transactions and manage escrow services</li>
                  <li><strong>Analytics:</strong> Improve platform performance and user experience</li>
                  <li><strong>Compliance:</strong> Meet regulatory requirements and legal obligations</li>
                  <li><strong>Communication:</strong> Send updates, support messages, and notifications</li>
                  <li><strong>Service Improvement:</strong> Enhance features and develop new tools</li>
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
                  We protect your information with industry-leading security measures:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Bank-level encryption</strong> for all data transmission and storage</li>
                  <li><strong>Secure payment gateways</strong> with PCI DSS compliance</li>
                  <li><strong>Regular security audits</strong> and vulnerability assessments</li>
                  <li><strong>Multi-factor authentication</strong> for account access</li>
                  <li><strong>Secure data centers</strong> with 24/7 monitoring</li>
                  <li><strong>RBI-compliant escrow</strong> for all financial transactions</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-graphite mb-4">5. Your Rights</h2>
              <div className="text-coolgray space-y-4">
                <p>You have complete control over your data:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Access:</strong> View and download your personal information</li>
                  <li><strong>Update:</strong> Correct inaccurate information via dashboard</li>
                  <li><strong>Delete:</strong> Request account and data deletion</li>
                  <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
                  <li><strong>Export:</strong> Download your activity export</li>
                  <li><strong>Portability:</strong> Transfer your data to other platforms</li>
                  <li><strong>Restrict:</strong> Limit how we process your data</li>
                </ul>
                <p className="mt-4 text-sm bg-blue-50 p-3 rounded-lg">
                  <strong>How to exercise your rights:</strong> Use your dashboard settings or contact support@maayo.com
                </p>
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
                  <p><strong>Email:</strong> support@maayo.com</p>
                  <p><strong>Phone/WhatsApp:</strong> +91 76228 57376</p>
                  <p><strong>LinkedIn:</strong> Connect on LinkedIn</p>
                  <p><strong>Response Time:</strong> Most queries within 2 business hours</p>
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
