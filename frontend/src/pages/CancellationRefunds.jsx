import React from 'react'
import Header from '../components/Header'

const CancellationRefunds = () => {
  return (
    <div className="min-h-screen bg-brand-gradient">
      <Header />
      
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-4xl mx-auto bg-white rounded-[2rem] shadow-lg p-8">
          <h1 className="text-3xl font-bold text-graphite mb-8">Cancellation & Refunds Policy</h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-coolgray mb-6">
              <strong>Last updated:</strong> {new Date().toLocaleDateString()}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-graphite mb-4">1. Overview</h2>
              <div className="text-coolgray space-y-4">
                <p>
                  This policy outlines the terms and conditions for cancellations and refunds on the 
                  Maayo platform. We strive to ensure fair and transparent processes for all users.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-graphite mb-4">2. Project Cancellation</h2>
              <div className="text-coolgray space-y-4">
                <h3 className="text-xl font-semibold text-graphite mb-2">Client Cancellation:</h3>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li><strong>Before work begins:</strong> Full refund (100%)</li>
                  <li><strong>After work starts:</strong> Partial refund based on work completed</li>
                  <li><strong>Must provide valid reason</strong> for cancellation</li>
                  <li><strong>48-hour notice required</strong> for cancellation</li>
                  <li>All payments and communication must occur on Maayo platform</li>
                </ul>
                
                <h3 className="text-xl font-semibold text-graphite mb-2">Freelancer Cancellation:</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Before acceptance:</strong> Can withdraw bid with no penalty</li>
                  <li><strong>After acceptance:</strong> Cannot cancel without valid reason</li>
                  <li><strong>24-hour notice required</strong> for cancellation</li>
                  <li><strong>May affect freelancer rating</strong> and future opportunities</li>
                  <li>Must complete ongoing projects before taking new ones</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-graphite mb-4">3. Refund Eligibility</h2>
              <div className="text-coolgray space-y-4">
                <p>Refunds are available in the following circumstances:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Project not delivered as specified</li>
                  <li>Work quality below agreed standards</li>
                  <li>Freelancer fails to meet deadlines</li>
                  <li>Technical issues preventing project completion</li>
                  <li>Mutual agreement between client and freelancer</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-graphite mb-4">4. Refund Process</h2>
              <div className="text-coolgray space-y-4">
                <ol className="list-decimal pl-6 space-y-2">
                  <li>Submit refund request through platform</li>
                  <li>Provide detailed reason for refund</li>
                  <li>Our team reviews the request within 48 hours</li>
                  <li><strong>If approved, refund processed within 5 days</strong></li>
                  <li><strong>Gateway/service fees & used milestone work are non-refundable</strong></li>
                  <li>Refund credited to original payment method</li>
                  <li>RBI-compliant escrow ensures secure refund processing</li>
                </ol>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-graphite mb-4">5. Refund Amounts</h2>
              <div className="text-coolgray space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-graphite mb-2">Refund Calculation:</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li><strong>Before work starts:</strong> 100% refund</li>
                    <li><strong>25% work completed:</strong> 75% refund</li>
                    <li><strong>50% work completed:</strong> 50% refund</li>
                    <li><strong>75% work completed:</strong> 25% refund</li>
                    <li><strong>After completion:</strong> Case-by-case basis</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-graphite mb-4">6. Non-Refundable Items</h2>
              <div className="text-coolgray space-y-4">
                <p>The following are not eligible for refunds:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Platform service fees</li>
                  <li>Completed work that meets specifications</li>
                  <li>Work delivered after agreed deadline due to client delay</li>
                  <li>Changes requested after project completion</li>
                  <li>Disputes arising from unclear requirements</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-graphite mb-4">7. Dispute Resolution</h2>
              <div className="text-coolgray space-y-4">
                <p>For disputes regarding refunds:</p>
                <ol className="list-decimal pl-6 space-y-2">
                  <li>Contact our support team</li>
                  <li>Provide all relevant documentation</li>
                  <li>Our team will mediate the dispute</li>
                  <li>Final decision will be made within 7 days</li>
                  <li>Both parties must comply with the decision</li>
                </ol>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-graphite mb-4">8. Subscription Refunds</h2>
              <div className="text-coolgray space-y-4">
                <p>For Maayo Plus and Maayo Plus Pro subscriptions:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>7-day money-back guarantee for new subscriptions</li>
                  <li>Pro-rated refunds for unused portions</li>
                  <li>No refunds for annual subscriptions after 30 days</li>
                  <li>Refunds processed within 5-7 business days</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-graphite mb-4">9. Processing Time</h2>
              <div className="text-coolgray space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-graphite mb-2">Refund Timeline:</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li><strong>Request Review:</strong> 24-48 hours</li>
                    <li><strong>Processing:</strong> 3-5 business days</li>
                    <li><strong>Bank Transfer:</strong> 1-3 business days</li>
                    <li><strong>Total Time:</strong> 5-10 business days</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-graphite mb-4">10. Contact Support</h2>
              <div className="text-coolgray space-y-4">
                <p>
                  For questions about cancellations or refunds, contact our support team:
                </p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p><strong>Email:</strong> support@maayo.com</p>
                  <p><strong>Phone/WhatsApp:</strong> +91 76228 57376</p>
                  <p><strong>LinkedIn:</strong> Connect on LinkedIn</p>
                  <p><strong>Response Time:</strong> Most queries within 2 business hours</p>
                  <p><strong>24/7 knowledge base</strong> with FAQs, tutorials, and onboarding videos</p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CancellationRefunds
