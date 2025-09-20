import React from 'react'
import Header from '../components/Header'

const ShippingPolicy = () => {
  return (
    <div className="min-h-screen bg-brand-gradient">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-graphite mb-8">Shipping Policy</h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-coolgray mb-6">
              <strong>Last updated:</strong> {new Date().toLocaleDateString()}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-graphite mb-4">1. Overview</h2>
              <div className="text-coolgray space-y-4">
                <p>
                  This delivery policy applies to all projects on the Maayo platform. While we primarily 
                  deal with digital services, this policy covers both digital and physical deliverables 
                  to ensure complete transparency and satisfaction.
                </p>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p><strong>Note:</strong> Maayo is a digital-first platform focused on freelance services. 
                  Most projects involve digital deliverables, but we also support physical projects when needed.</p>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-graphite mb-4">2. Digital Deliverables</h2>
              <div className="text-coolgray space-y-4">
                <h3 className="text-xl font-semibold text-graphite mb-2">Delivery Method:</h3>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>All digital work is delivered through our platform</li>
                  <li>Files are uploaded to secure project folders</li>
                  <li>Download links are provided via email and platform</li>
                  <li>Access is granted immediately upon delivery</li>
                </ul>
                
                <h3 className="text-xl font-semibold text-graphite mb-2">Delivery Timeline:</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>As per project agreement (typically 1-30 days)</li>
                  <li>Rush delivery available for additional fees</li>
                  <li>Progress updates provided throughout project</li>
                  <li>Final delivery includes all source files</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-graphite mb-4">3. Physical Deliverables</h2>
              <div className="text-coolgray space-y-4">
                <p>For projects requiring physical delivery:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Shipping costs are included in project quote</li>
                  <li>Delivery address must be provided before project start</li>
                  <li>Tracking information provided upon shipment</li>
                  <li>Insurance included for valuable items</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-graphite mb-4">4. Shipping Methods</h2>
              <div className="text-coolgray space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-graphite mb-2">Available Shipping Options:</h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Standard Shipping:</strong> 5-7 business days</li>
                    <li><strong>Express Shipping:</strong> 2-3 business days</li>
                    <li><strong>Overnight Shipping:</strong> Next business day</li>
                    <li><strong>International Shipping:</strong> 7-14 business days</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-graphite mb-4">5. Delivery Confirmation</h2>
              <div className="text-coolgray space-y-4">
                <p>For all deliveries:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Delivery confirmation required within 48 hours</li>
                  <li>Photos of delivered items may be requested</li>
                  <li>Digital delivery confirmed via platform</li>
                  <li>Client must mark project as completed</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-graphite mb-4">6. Shipping Costs</h2>
              <div className="text-coolgray space-y-4">
                <h3 className="text-xl font-semibold text-graphite mb-2">Cost Structure:</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Shipping costs included in project quote</li>
                  <li>No additional charges for standard delivery</li>
                  <li>Express shipping available for additional fee</li>
                  <li>International shipping costs vary by location</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-graphite mb-4">7. Delivery Issues</h2>
              <div className="text-coolgray space-y-4">
                <h3 className="text-xl font-semibold text-graphite mb-2">Common Issues and Solutions:</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Lost Package:</strong> Replacement or full refund</li>
                  <li><strong>Damaged Items:</strong> Replacement at no cost</li>
                  <li><strong>Wrong Address:</strong> Re-delivery to correct address</li>
                  <li><strong>Delivery Delay:</strong> Compensation or refund</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-graphite mb-4">8. International Shipping</h2>
              <div className="text-coolgray space-y-4">
                <p>For international deliveries:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Customs duties are client's responsibility</li>
                  <li>Delivery times may vary by country</li>
                  <li>Tracking available for all international shipments</li>
                  <li>Restricted items not eligible for international shipping</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-graphite mb-4">9. Return Shipping</h2>
              <div className="text-coolgray space-y-4">
                <p>For returns and exchanges:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Return shipping costs covered by Maayo</li>
                  <li>Prepaid return labels provided</li>
                  <li>Items must be returned in original condition</li>
                  <li>Return must be initiated within 7 days of delivery</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-graphite mb-4">10. Tracking and Updates</h2>
              <div className="text-coolgray space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-graphite mb-2">Tracking Information:</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Tracking numbers provided upon shipment</li>
                    <li>Real-time updates via email and SMS</li>
                    <li>Delivery notifications sent to client</li>
                    <li>24/7 tracking available on our platform</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-graphite mb-4">11. Contact Information</h2>
              <div className="text-coolgray space-y-4">
                <p>
                  For delivery-related questions or issues, contact our support team:
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

export default ShippingPolicy
