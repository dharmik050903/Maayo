import React, { useState, useRef, useEffect } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import { useComprehensiveTranslation } from '../hooks/useComprehensiveTranslation'
import comprehensiveTranslationService from '../services/comprehensiveTranslationService'

const LanguageSwitcher = ({ variant = 'default' }) => {
  const { language, changeLanguage, isLoading } = useLanguage()
  const { t, availableLanguages, isComplete } = useComprehensiveTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)
  const isDark = variant === 'dark'

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleLanguageChange = async (langCode) => {
    if (langCode !== language) {
      await changeLanguage(langCode)
    }
    setIsOpen(false)
  }

  const currentLanguage = availableLanguages.find(lang => lang.code === language)

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200
          ${isDark 
            ? 'bg-white/10 hover:bg-white/20 text-white/90' 
            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }
          ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
          focus:outline-none focus:ring-2 focus:ring-mint/50
        `}
        aria-label={t('footer.language')}
      >
        <span className="text-lg">{currentLanguage?.flag || '🌐'}</span>
        <span className="text-sm font-medium hidden sm:block">
          {currentLanguage?.name || 'English'}
        </span>
        <svg 
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
        {isLoading && (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        )}
      </button>

      {isOpen && (
        <div className={`
          absolute bottom-full mb-2 left-0 w-64 max-h-80 overflow-y-auto
          rounded-xl shadow-lg border backdrop-blur-sm z-50
          ${isDark 
            ? 'bg-gray-900/95 border-white/20' 
            : 'bg-white/95 border-gray-200'
          }
        `}>
          <div className="p-2">
            <div className={`
              px-3 py-2 text-xs font-semibold uppercase tracking-wider
              ${isDark ? 'text-white/60' : 'text-gray-500'}
            `}>
              {t('footer.language')}
            </div>
            {availableLanguages.map((lang) => {
              const isComplete = comprehensiveTranslationService.isLanguageComplete(lang.code)
              return (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left
                    transition-all duration-200 hover:scale-[1.02]
                    ${language === lang.code
                      ? isDark 
                        ? 'bg-mint/20 text-mint border border-mint/30' 
                        : 'bg-mint/10 text-mint border border-mint/20'
                      : isDark
                        ? 'hover:bg-white/10 text-white/90'
                        : 'hover:bg-gray-100 text-gray-700'
                    }
                  `}
                >
                  <span className="text-xl">{lang.flag}</span>
                  <div className="flex-1">
                    <div className="font-medium flex items-center gap-2">
                      {lang.name}
                      {isComplete && (
                        <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
                          ✓
                        </span>
                      )}
                    </div>
                    <div className={`text-xs ${isDark ? 'text-white/60' : 'text-gray-500'}`}>
                      {lang.code.toUpperCase()}
                    </div>
                  </div>
                  {language === lang.code && (
                    <svg className="w-4 h-4 text-mint" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default LanguageSwitcher
