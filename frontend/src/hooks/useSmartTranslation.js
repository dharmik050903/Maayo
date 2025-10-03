import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from './useTranslation'
import translationService from '../services/translationService'

// Smart translation hook that combines manual translations with AI translation
export const useSmartTranslation = () => {
  const { t: manualTranslate, language } = useTranslation()
  const [isTranslating, setIsTranslating] = useState(false)
  const [aiTranslations, setAiTranslations] = useState({})

  // Translate text using AI if not available in manual translations
  const translate = useCallback(async (key, fallbackText = '') => {
    // First try manual translation
    const manualTranslation = manualTranslate(key)
    if (manualTranslation && manualTranslation !== key) {
      return manualTranslation
    }

    // If no manual translation, try AI translation
    const cacheKey = `${language}-${key}`
    if (aiTranslations[cacheKey]) {
      return aiTranslations[cacheKey]
    }

    // Use fallback text or key for translation
    const textToTranslate = fallbackText || key
    
    try {
      setIsTranslating(true)
      const aiTranslation = await translationService.translateText(
        textToTranslate, 
        language, 
        'en'
      )
      
      // Cache the AI translation
      setAiTranslations(prev => ({
        ...prev,
        [cacheKey]: aiTranslation
      }))
      
      return aiTranslation
    } catch (error) {
      console.error('AI translation failed:', error)
      return textToTranslate
    } finally {
      setIsTranslating(false)
    }
  }, [manualTranslate, language, aiTranslations])

  // Batch translate multiple keys
  const translateBatch = useCallback(async (translations) => {
    const results = {}
    
    for (const [key, fallbackText] of Object.entries(translations)) {
      results[key] = await translate(key, fallbackText)
    }
    
    return results
  }, [translate])

  return {
    t: translate,
    translateBatch,
    isTranslating,
    language,
    supportedLanguages: translationService.getSupportedLanguages()
  }
}
