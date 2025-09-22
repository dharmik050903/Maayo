import { useState, useEffect, useRef } from 'react';
import Header from '../components/Header';
import Button from '../components/Button';
import { Link } from 'react-router-dom';
import { isAuthenticated, getCurrentUser, clearAuth } from '../utils/api';
import { SUBSCRIPTION_PLANS, BILLING_CYCLES } from '../data/plans';
import { processSubscriptionPayment } from '../utils/razorpay';
import confirmationService from '../services/confirmationService.jsx';

export default function SubscriptionPage() {
  const [billingCycle, setBillingCycle] = useState('yearly'); // yearly or monthly
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      console.log('SubscriptionPage: useEffect running (first time)');
      
      // Check if user is authenticated
      const authStatus = isAuthenticated();
      console.log('SubscriptionPage: Authentication status:', authStatus);
      
      if (authStatus) {
        // Get user data if authenticated
        const user = getCurrentUser();
        console.log('SubscriptionPage: User data:', user);
        
        if (user) {
          setUserData(user);
        }
      }
      
      // Set loading to false after initialization
      setLoading(false);
    } else {
      console.log('SubscriptionPage: Skipping duplicate initialization due to StrictMode');
    }
  }, []);

  // Payment processing function
  const handleSubscribe = async (planId) => {
    if (!userData) {
      await confirmationService.alert(
        'Please log in to subscribe to a plan.',
        'Authentication Required'
      )
      return
    }

    const plan = SUBSCRIPTION_PLANS[planId]
    if (!plan) {
      await confirmationService.alert(
        'Invalid plan selected. Please try again.',
        'Error'
      )
      return
    }

    const planDetails = plan[billingCycle]
    if (!planDetails) {
      await confirmationService.alert(
        'Invalid billing cycle selected. Please try again.',
        'Error'
      )
      return
    }

    setProcessingPayment(true)
    setSelectedPlan(planId)

    try {
      const paymentResult = await processSubscriptionPayment(planDetails, userData)
      
      if (paymentResult.success) {
        await confirmationService.alert(
          `🎉 Payment successful! Your ${plan.name} subscription is now active. You can start enjoying all the premium features immediately.`,
          'Subscription Activated'
        )
        // Here you could redirect to dashboard or refresh user data
      } else {
        await confirmationService.alert(
          paymentResult.message || 'Payment failed. Please try again.',
          'Payment Failed'
        )
      }
    } catch (error) {
      console.error('Payment error:', error)
      await confirmationService.alert(
        error.message || 'An error occurred during payment. Please try again.',
        'Payment Error'
      )
    } finally {
      setProcessingPayment(false)
      setSelectedPlan(null)
    }
  }

  // Get plan data from configuration
  const maayoPlus = SUBSCRIPTION_PLANS.MAYYO_PLUS
  const maayoPlusPro = SUBSCRIPTION_PLANS.MAYYO_PLUS_PRO

  const comparisonFeatures = [
    { feature: 'Price', plus: '₹999/year or ₹249/month', pro: '₹999/month or ₹6,000/year' },
    { feature: 'Included Applications per Period', plus: '100/year or 15/month', pro: 'Unlimited' },
    { feature: 'Cost per Additional Application', plus: '₹9.99', pro: 'N/A' },
    { feature: 'Advanced Analytics', plus: '✓', pro: '✓' },
    { feature: 'Early Access to Projects', plus: '✓', pro: '✓ (premium tier)' },
    { feature: 'Premium Chat Support', plus: '✓', pro: '✓ (priority)' },
    { feature: 'Client/Job Growth Guidance', plus: '✓', pro: '✓' },
    { feature: 'Priority Profile/Search Boost', plus: '—', pro: '✓' },
    { feature: '"Pro" Badge', plus: '—', pro: '✓' },
    { feature: 'Exclusive Projects', plus: '—', pro: '✓' },
    { feature: 'Personalized Gig Review', plus: '—', pro: '✓ (monthly)' },
    { feature: '1:1 Success Manager Session', plus: '—', pro: '✓' },
    { feature: 'Discounts/Promos', plus: '—', pro: '✓' },
    { feature: 'Beta Features Access', plus: '—', pro: '✓' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-gradient text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-brand-gradient text-white">
      <Header 
        userType={userData?.user_type || 'client'} 
        userData={userData} 
        onLogout={clearAuth}
      />
      
      {/* Hero Section */}
      <section className="py-20 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
            Ready to earn more, get hired faster, and build your freelance career?
          </h1>
          <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto mb-12">
            Upgrade to Maayo Plus or Plus Pro today!
          </p>
        </div>
      </section>

      {/* Billing Toggle */}
      <section className="px-6 mb-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center">
            <div className="bg-white/10 rounded-lg p-1 flex">
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-6 py-3 rounded-md transition-all duration-300 ${
                  billingCycle === 'yearly'
                    ? 'bg-mint text-white font-semibold'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                Yearly (Save More)
              </button>
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-3 rounded-md transition-all duration-300 ${
                  billingCycle === 'monthly'
                    ? 'bg-mint text-white font-semibold'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                Monthly
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Maayo Plus Card */}
          <div className={`relative bg-white/95 text-graphite rounded-2xl p-8 transition-all duration-300 transform hover:scale-105 flex flex-col ${
            maayoPlus.isPopular ? 'ring-2 ring-mint shadow-2xl' : 'shadow-xl'
          }`}>
            <h2 className="text-3xl font-bold mb-4 text-graphite">Maayo Plus</h2>
            
            <div className="mb-6">
              <div className="flex items-baseline">
                <span className="text-5xl font-bold text-graphite">
                  ₹{billingCycle === 'yearly' ? maayoPlus.yearly.price : maayoPlus.monthly.price}
                </span>
                <span className="text-lg text-coolgray ml-2">
                  {billingCycle === 'yearly' ? '/year' : '/month'}
                </span>
              </div>
              <p className="text-sm text-coolgray mt-2">
                {billingCycle === 'yearly' ? maayoPlus.yearly.periodText : maayoPlus.monthly.periodText}
              </p>
              {billingCycle === 'yearly' && maayoPlus.yearly.savings && (
                <p className="text-sm text-mint mt-1 font-semibold">
                  Save ₹{maayoPlus.yearly.savings} compared to monthly
                </p>
              )}
            </div>

            <ul className="space-y-3 mb-8 flex-grow">
              {maayoPlus.features.map((feature, idx) => (
                <li key={idx} className="flex items-start">
                  <svg className="h-5 w-5 mr-3 flex-shrink-0 text-mint mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-graphite text-sm leading-relaxed">{feature}</span>
                </li>
              ))}
            </ul>

            <Button
              variant="accent"
              size="lg"
              className="w-full py-4 text-lg bg-mint text-white hover:bg-mint/90 mt-auto"
              onClick={() => handleSubscribe('MAYYO_PLUS')}
              loading={processingPayment && selectedPlan === 'MAYYO_PLUS'}
              disabled={processingPayment}
            >
              {processingPayment && selectedPlan === 'MAYYO_PLUS' ? 'Processing...' : 'Choose Maayo Plus'}
            </Button>
          </div>

          {/* Maayo Plus Pro Card */}
          <div className={`relative bg-white/95 text-graphite rounded-2xl p-8 transition-all duration-300 transform hover:scale-105 flex flex-col ${
            maayoPlusPro.isPopular ? 'ring-2 ring-mint shadow-2xl' : 'shadow-xl'
          }`}>
            {maayoPlusPro.isPopular && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-mint text-white px-6 py-2 rounded-full text-sm font-semibold">
                  Most Popular
                </span>
                </div>
              )}
              
            <h2 className="text-3xl font-bold mb-4 text-graphite">Maayo Plus Pro</h2>
            
            <div className="mb-6">
              <div className="flex items-baseline">
                <span className="text-5xl font-bold text-graphite">
                  ₹{billingCycle === 'yearly' ? maayoPlusPro.yearly.price : maayoPlusPro.monthly.price}
                </span>
                <span className="text-lg text-coolgray ml-2">
                  {billingCycle === 'yearly' ? '/year' : '/month'}
                </span>
              </div>
              <p className="text-sm text-coolgray mt-2">
                {billingCycle === 'yearly' ? maayoPlusPro.yearly.periodText : maayoPlusPro.monthly.periodText}
              </p>
              {billingCycle === 'yearly' && maayoPlusPro.yearly.savings && (
                <p className="text-sm text-mint mt-1 font-semibold">
                  Save ₹{maayoPlusPro.yearly.savings} compared to monthly
                </p>
              )}
            </div>
              
            <ul className="space-y-3 mb-8 flex-grow">
              {maayoPlusPro.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start">
                  <svg className="h-5 w-5 mr-3 flex-shrink-0 text-mint mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  <span className="text-graphite text-sm leading-relaxed">{feature}</span>
                  </li>
                ))}
              </ul>
              
            <Button
              variant="accent"
              size="lg"
              className="w-full py-4 text-lg bg-mint text-white hover:bg-mint/90 mt-auto"
              onClick={() => handleSubscribe('MAYYO_PLUS_PRO')}
              loading={processingPayment && selectedPlan === 'MAYYO_PLUS_PRO'}
              disabled={processingPayment}
            >
              {processingPayment && selectedPlan === 'MAYYO_PLUS_PRO' ? 'Processing...' : 'Choose Maayo Plus Pro'}
            </Button>
          </div>
            </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="py-16 px-6 bg-white/5">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Feature <span className="text-mint">Comparison</span>
          </h2>
          
          <div className="bg-white/95 rounded-2xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-graphite">Feature</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-graphite">Maayo Plus</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-mint">Maayo Plus Pro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {comparisonFeatures.map((item, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 text-sm font-medium text-graphite">{item.feature}</td>
                      <td className="px-6 py-4 text-sm text-center text-graphite">{item.plus}</td>
                      <td className="px-6 py-4 text-sm text-center text-mint font-semibold">{item.pro}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Frequently Asked <span className="text-mint">Questions</span>
          </h2>
          <div className="space-y-6">
            <details className="p-6 bg-white/10 rounded-lg cursor-pointer transition-all duration-300 hover:bg-white/15">
              <summary className="flex justify-between items-center text-lg font-semibold text-white/90">
                What's the difference between Maayo Plus and Maayo Plus Pro?
                <svg className="h-6 w-6 transform transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="mt-4 text-white/70 leading-relaxed">
                Maayo Plus includes 100 applications per year with advanced analytics and premium support. Maayo Plus Pro offers unlimited applications, VIP profile visibility, exclusive projects, personalized reviews, and 1:1 success manager sessions.
              </p>
            </details>
            
            <details className="p-6 bg-white/10 rounded-lg cursor-pointer transition-all duration-300 hover:bg-white/15">
              <summary className="flex justify-between items-center text-lg font-semibold text-white/90">
                Can I switch between monthly and yearly billing?
                <svg className="h-6 w-6 transform transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="mt-4 text-white/70 leading-relaxed">
                Yes, you can change your billing cycle at any time from your account settings. Changes will take effect on your next billing cycle.
              </p>
            </details>
            
            <details className="p-6 bg-white/10 rounded-lg cursor-pointer transition-all duration-300 hover:bg-white/15">
              <summary className="flex justify-between items-center text-lg font-semibold text-white/90">
                What happens if I exceed my application limit on Maayo Plus?
                <svg className="h-6 w-6 transform transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="mt-4 text-white/70 leading-relaxed">
                Each additional application beyond your 100 yearly limit costs ₹9.99. You can purchase additional applications as needed, or upgrade to Maayo Plus Pro for unlimited applications.
              </p>
            </details>
            
            <details className="p-6 bg-white/10 rounded-lg cursor-pointer transition-all duration-300 hover:bg-white/15">
              <summary className="flex justify-between items-center text-lg font-semibold text-white/90">
                What payment methods do you accept?
                <svg className="h-6 w-6 transform transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="mt-4 text-white/70 leading-relaxed">
                We accept all major credit cards, UPI, net banking, and digital wallets. All payments are processed securely through our payment partners.
              </p>
            </details>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to <span className="text-mint">Level Up</span> Your Freelance Career?
          </h2>
          <p className="text-xl text-white/80 mb-8">
            Choose your plan and start earning more, getting hired faster, and building your freelance career today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="outline" size="lg" className="px-8 py-4 text-lg border-2 border-white text-white hover:bg-white hover:text-graphite">
              Try Maayo Plus
            </Button>
            <Button variant="accent" size="lg" className="px-8 py-4 text-lg bg-mint text-white hover:bg-mint/90">
              Go Pro Now
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}