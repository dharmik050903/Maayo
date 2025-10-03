import React from 'react'
import { Link } from 'react-router-dom'
import { useComprehensiveTranslation } from '../hooks/useComprehensiveTranslation'
import LanguageSwitcher from './LanguageSwitcher'

const Footer = ({ variant = 'default' }) => {
  const { t } = useComprehensiveTranslation()
  const isDark = variant === 'dark'
  
  // Function to scroll to top when footer links are clicked
  const handleFooterLinkClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  
  return (
    <footer className={`py-6 border-t ${isDark ? 'border-white/20' : 'border-gray-200'}`}>
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center px-6 gap-4">
        <p className={`text-sm ${isDark ? 'text-white/85' : 'text-coolgray'}`}>
          © {new Date().getFullYear()} Maayo. {t('footer.copyright')}
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <div className={`flex flex-wrap gap-4 text-sm ${isDark ? 'text-white/85' : 'text-coolgray'}`}>
            <Link to="/about" className="hover:text-mint transition-colors" onClick={handleFooterLinkClick}>
              {t('footer.about')}
            </Link>
            <Link to="/privacy" className="hover:text-mint transition-colors" onClick={handleFooterLinkClick}>
              {t('footer.privacy')}
            </Link>
            <Link to="/terms" className="hover:text-mint transition-colors" onClick={handleFooterLinkClick}>
              {t('footer.terms')}
            </Link>
            <Link to="/cancellation-refunds" className="hover:text-mint transition-colors" onClick={handleFooterLinkClick}>
              {t('footer.refunds')}
            </Link>
            <Link to="/shipping" className="hover:text-mint transition-colors" onClick={handleFooterLinkClick}>
              {t('footer.shipping')}
            </Link>
            <Link to="/contact" className="hover:text-mint transition-colors" onClick={handleFooterLinkClick}>
              {t('footer.contact')}
            </Link>
          </div>
          <LanguageSwitcher variant={variant} />
        </div>
      </div>
    </footer>
  )
}

export default Footer
