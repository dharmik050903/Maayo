import React from 'react'
import Header from '../components/Header'

const TermsAndConditions = () => {
  return (
    <div className="min-h-screen bg-brand-gradient">
      <Header />
      
      <div className="container mx-auto px-4 py-8 pt-20">
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-graphite mb-8">Terms and Conditions</h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-coolgray mb-6">
              <strong>Last updated:</strong> {new Date().toLocaleDateString()}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-graphite mb-4">1. Acceptance of Terms</h2>
              <div className="text-coolgray space-y-4">
                <p>
                  By accessing and using Maayo platform, you accept and agree to be bound by the terms 
                  and provision of this agreement.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-graphite mb-4">2. Description of Service</h2>
              <div className="text-coolgray space-y-4">
                <p>
                  Maayo is a freelance marketplace platform that connects clients with freelancers 
                  for various projects and services.
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Project posting and management</li>
                  <li>Bid submission and acceptance</li>
                  <li>Payment processing</li>
                  <li>Communication tools</li>
                  <li>Review and rating system</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-graphite mb-4">3. User Accounts</h2>
              <div className="text-coolgray space-y-4">
                <p>Complete registration is required to post or apply. To use our service, you must:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Provide accurate and complete information</li>
                  <li>Maintain the security of your password</li>
                  <li>Be at least 18 years old</li>
                  <li>Have the legal capacity to enter into contracts</li>
                  <li>Not create multiple accounts or duplicate accounts</li>
                  <li>Complete KYC verification as required</li>
                  <li>Maintain one active account per person</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-graphite mb-4">4. User Responsibilities</h2>
              <div className="text-coolgray space-y-4">
                <h3 className="text-xl font-semibold text-graphite mb-2">For Clients:</h3>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Provide clear project requirements</li>
                  <li>Pay freelancers as agreed</li>
                  <li>Respect project timelines</li>
                  <li>Provide constructive feedback</li>
                </ul>
                
                <h3 className="text-xl font-semibold text-graphite mb-2">For Freelancers:</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Deliver work as specified</li>
                  <li>Meet agreed deadlines</li>
                  <li>Maintain professional communication</li>
                  <li>Provide quality work</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-graphite mb-4">5. Payment Terms</h2>
              <div className="text-coolgray space-y-4">
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>All payment and communication must occur on Maayo</strong></li>
                  <li><strong>Orders and milestones are paid upfront</strong></li>
                  <li><strong>Refunds processed within 5 days</strong>; gateway/service fees & used milestone work are non-refundable</li>
                  <li><strong>Strict review periods:</strong> 36h for milestones, 48h for full projects; auto-approval after expiry</li>
                  <li><strong>No off-platform contact sharing or payments</strong></li>
                  <li>Platform fees: 0% for clients, 5% for freelancers (lowest in industry)</li>
                  <li>RBI-compliant escrow and milestone-based safety</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-graphite mb-4">6. Usage Rules</h2>
              <div className="text-coolgray space-y-4">
                <h3 className="text-xl font-semibold text-graphite mb-2">What's Allowed:</h3>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Accurate profile & project listings</li>
                  <li>Lawful, professional work only—no scams, no illegal/adult content, no academic cheating or copyright violations</li>
                  <li>Project and milestone review on time</li>
                  <li>Stay within Maayo for all payments and communication</li>
                </ul>
                
                <h3 className="text-xl font-semibold text-graphite mb-2">What's Not Allowed:</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>False profiles, duplicate accounts, fake reviews</li>
                  <li>Direct contact or payments outside Maayo</li>
                  <li>Spamming, harassment, or abusive conduct</li>
                  <li>Deliberate failure to deliver/approve work</li>
                  <li>Multiple 1-star reviews = account review and possible suspension</li>
                </ul>
                <p className="mt-4 text-sm bg-red-50 p-3 rounded-lg">
                  <strong>Violations may result in removal, suspension, or legal reporting.</strong>
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-graphite mb-4">7. Intellectual Property</h2>
              <div className="text-coolgray space-y-4">
                <p>
                  All content on the platform, including text, graphics, logos, and software, 
                  is the property of Maayo or its licensors and is protected by copyright laws.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-graphite mb-4">8. Limitation of Liability</h2>
              <div className="text-coolgray space-y-4">
                <p>
                  Maayo shall not be liable for any indirect, incidental, special, consequential, 
                  or punitive damages resulting from your use of the platform.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-graphite mb-4">9. Termination</h2>
              <div className="text-coolgray space-y-4">
                <p>
                  We may terminate or suspend your account at any time for violation of these terms 
                  or for any other reason at our discretion.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-graphite mb-4">10. Changes to Terms</h2>
              <div className="text-coolgray space-y-4">
                <p>
                  We reserve the right to modify these terms at any time. Continued use of the platform 
                  after changes constitutes acceptance of the new terms.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-graphite mb-4">11. Complaints & Disputes</h2>
              <div className="text-coolgray space-y-4">
                <p>Report an issue, anytime:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Fill out our <strong>Complaints Form</strong></li>
                  <li>You'll hear from our <strong>Grievance Officer within 48hrs</strong></li>
                  <li>Escalate any legal or urgent issue to: <strong>grievance@maayo.com</strong></li>
                  <li>Phone: <strong>+91 76228 57376</strong></li>
                  <li>LinkedIn contact available</li>
                </ul>
                <p className="mt-4 text-sm bg-blue-50 p-3 rounded-lg">
                  <strong>Full escalation and dispute flow outlined in our T&C and Help Center</strong>
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-graphite mb-4">12. Contact Information</h2>
              <div className="text-coolgray space-y-4">
                <p>
                  If you have any questions about these Terms and Conditions, please contact us at:
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

export default TermsAndConditions
