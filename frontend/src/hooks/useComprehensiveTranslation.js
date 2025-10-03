import { useState, useEffect, useCallback } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import comprehensiveTranslationService from '../services/comprehensiveTranslationService'

// Enhanced translation hook that supports all 25+ languages
export const useComprehensiveTranslation = () => {
  const { language, changeLanguage, isLoading } = useLanguage()
  const [translationStats, setTranslationStats] = useState({})

  // Get translation for current language
  const t = useCallback((key, fallbackText = '') => {
    const translation = comprehensiveTranslationService.getTranslation(key, language)
    
    // If translation is the same as key (meaning no translation found), use fallback
    if (translation === key && fallbackText) {
      return fallbackText
    }
    
    return translation
  }, [language])

  // Get all available languages
  const getAvailableLanguages = useCallback(() => {
    return comprehensiveTranslationService.getAvailableLanguages()
  }, [])

  // Check if current language is complete
  const isCurrentLanguageComplete = useCallback(() => {
    return comprehensiveTranslationService.isLanguageComplete(language)
  }, [language])

  // Get translation statistics
  const getStats = useCallback(() => {
    return comprehensiveTranslationService.getTranslationStats()
  }, [])

  // Update translation stats when language changes
  useEffect(() => {
    const stats = getStats()
    setTranslationStats(stats)
  }, [language, getStats])

  return {
    t,
    language,
    changeLanguage,
    isLoading,
    availableLanguages: getAvailableLanguages(),
    isComplete: isCurrentLanguageComplete(),
    stats: translationStats,
    getStats
  }
}
