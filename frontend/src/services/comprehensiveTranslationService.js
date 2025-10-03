// Simplified Comprehensive Translation Service - Handles all 25+ languages
import { translations } from '../data/translations'

class ComprehensiveTranslationService {
  constructor() {
    this.translations = translations
    this.fallbackLanguage = 'en'
  }

  // Get translation for a key in a specific language
  getTranslation(key, language = 'en') {
    // Always use English for incomplete languages
    if (!this.isLanguageComplete(language)) {
      return this.getTranslationFromLanguage(key, this.translations[this.fallbackLanguage]) || key
    }

    // Get the language translations
    const langTranslations = this.translations[language]
    
    // If language doesn't exist, use English
    if (!langTranslations) {
      return this.getTranslationFromLanguage(key, this.translations[this.fallbackLanguage]) || key
    }

    return this.getTranslationFromLanguage(key, langTranslations) || key
  }

  // Helper method to get translation from a specific language object
  getTranslationFromLanguage(key, langTranslations) {
    if (!langTranslations) return null

    // Handle nested keys (e.g., 'footer.copyright')
    const keys = key.split('.')
    let value = langTranslations
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k]
      } else {
        return null // Key not found
      }
    }

    return value
  }

  // Get all available languages
  getAvailableLanguages() {
    const allLanguages = [
      { code: 'en', name: 'English', flag: '🇺🇸' },
      { code: 'es', name: 'Español', flag: '🇪🇸' },
      { code: 'fr', name: 'Français', flag: '🇫🇷' },
      { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
      { code: 'it', name: 'Italiano', flag: '🇮🇹' },
      { code: 'pt', name: 'Português', flag: '🇵🇹' },
      { code: 'ru', name: 'Русский', flag: '🇷🇺' },
      { code: 'ja', name: '日本語', flag: '🇯🇵' },
      { code: 'ko', name: '한국어', flag: '🇰🇷' },
      { code: 'zh', name: '中文', flag: '🇨🇳' },
      { code: 'ar', name: 'العربية', flag: '🇸🇦' },
      { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
      { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
      { code: 'sv', name: 'Svenska', flag: '🇸🇪' },
      { code: 'da', name: 'Dansk', flag: '🇩🇰' },
      { code: 'no', name: 'Norsk', flag: '🇳🇴' },
      { code: 'fi', name: 'Suomi', flag: '🇫🇮' },
      { code: 'pl', name: 'Polski', flag: '🇵🇱' },
      { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
      { code: 'th', name: 'ไทย', flag: '🇹🇭' },
      { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
      { code: 'id', name: 'Bahasa Indonesia', flag: '🇮🇩' },
      { code: 'ms', name: 'Bahasa Melayu', flag: '🇲🇾' },
      { code: 'tl', name: 'Filipino', flag: '🇵🇭' }
    ]
    
    return allLanguages
  }

  // Check if a language has complete translations
  isLanguageComplete(language) {
    // Languages with complete translations
    const completeLanguages = ['en', 'es', 'hi', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh', 'ar']
    return completeLanguages.includes(language)
  }

  // Get translation statistics
  getTranslationStats() {
    const stats = {}
    const allLanguages = this.getAvailableLanguages()
    
    for (const lang of allLanguages) {
      stats[lang.code] = {
        total: 100,
        translated: this.isLanguageComplete(lang.code) ? 100 : 0,
        percentage: this.isLanguageComplete(lang.code) ? 100 : 0,
        complete: this.isLanguageComplete(lang.code)
      }
    }
    
    return stats
  }
}

export default new ComprehensiveTranslationService()