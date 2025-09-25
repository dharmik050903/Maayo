import { Link } from 'react-router-dom'
import Button from './Button'
import { SUBSCRIPTION_PLANS } from '../data/plans'

const UpgradeBanner = ({ userType = 'user' }) => {
  const handleUpgradeClick = () => {
    // Navigate to pricing page
    window.location.href = '/pricing'
  }

  const maayoPlus = SUBSCRIPTION_PLANS.MAYYO_PLUS
  const maayoPlusPro = SUBSCRIPTION_PLANS.MAYYO_PLUS_PRO

  return (
    <div className="bg-gradient-to-r from-mint to-coral rounded-xl p-6 mb-8 shadow-lg border border-white/20 relative z-10">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex-1 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white">
              Upgrade to Maayo Plus/Pro
            </h3>
          </div>
          <p className="text-white/90 text-sm md:text-base mb-4">
            {userType === 'freelancer' 
              ? 'Unlock unlimited project bids, AI-powered proposals, and priority support to grow your freelance business.'
              : 'Get access to premium freelancers, AI project management tools, and priority support for your projects.'
            }
          </p>
          <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-4">
            <span className="px-3 py-1 bg-white/20 text-white rounded-full text-xs font-medium">
              ✓ {maayoPlus.yearly.price === 999 ? '100 Applications/Year' : 'Unlimited Applications'}
            </span>
            <span className="px-3 py-1 bg-white/20 text-white rounded-full text-xs font-medium">
              ✓ Advanced Analytics
            </span>
            <span className="px-3 py-1 bg-white/20 text-white rounded-full text-xs font-medium">
              ✓ Priority Support
            </span>
            <span className="px-3 py-1 bg-white/20 text-white rounded-full text-xs font-medium">
              ✓ Early Access
            </span>
          </div>
          <div className="text-white/80 text-xs">
            Starting from ₹{maayoPlus.monthly.price}/month or ₹{maayoPlus.yearly.price}/year
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            size="lg"
            className="px-6 py-3 border-white text-white hover:bg-white hover:text-graphite font-semibold"
            onClick={handleUpgradeClick}
          >
            View Plans
          </Button>
          <Link to="/pricing">
            <Button
              variant="accent"
              size="lg"
              className="px-6 py-3 bg-white text-graphite hover:bg-gray-100 font-semibold"
            >
              Upgrade Now
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default UpgradeBanner
