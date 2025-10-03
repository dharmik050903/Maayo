// AI-Powered Translation Service
class TranslationService {
  constructor() {
    this.apiKey = process.env.REACT_APP_GOOGLE_TRANSLATE_API_KEY
    this.baseUrl = 'https://translation.googleapis.com/language/translate/v2'
    this.cache = new Map() // Cache translations to avoid repeated API calls
  }

  // Translate text using Google Translate API
  async translateText(text, targetLanguage, sourceLanguage = 'en') {
    if (!text || !targetLanguage) return text
    
    // Check cache first
    const cacheKey = `${sourceLanguage}-${targetLanguage}-${text}`
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)
    }

    try {
      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: text,
          target: targetLanguage,
          source: sourceLanguage,
          format: 'text'
        })
      })

      if (!response.ok) {
        throw new Error(`Translation API error: ${response.status}`)
      }

      const data = await response.json()
      const translatedText = data.data.translations[0].translatedText
      
      // Cache the result
      this.cache.set(cacheKey, translatedText)
      
      return translatedText
    } catch (error) {
      console.error('Translation error:', error)
      return text // Return original text if translation fails
    }
  }

  // Translate entire object of translations
  async translateObject(translations, targetLanguage, sourceLanguage = 'en') {
    const translated = {}
    
    for (const [key, value] of Object.entries(translations)) {
      if (typeof value === 'string') {
        translated[key] = await this.translateText(value, targetLanguage, sourceLanguage)
      } else if (typeof value === 'object') {
        translated[key] = await this.translateObject(value, targetLanguage, sourceLanguage)
      } else {
        translated[key] = value
      }
    }
    
    return translated
  }

  // Get supported languages
  getSupportedLanguages() {
    return [
      { code: 'en', name: 'English' },
      { code: 'es', name: 'Español' },
      { code: 'fr', name: 'Français' },
      { code: 'de', name: 'Deutsch' },
      { code: 'it', name: 'Italiano' },
      { code: 'pt', name: 'Português' },
      { code: 'ru', name: 'Русский' },
      { code: 'ja', name: '日本語' },
      { code: 'ko', name: '한국어' },
      { code: 'zh', name: '中文' },
      { code: 'ar', name: 'العربية' },
      { code: 'hi', name: 'हिन्दी' },
      { code: 'nl', name: 'Nederlands' },
      { code: 'sv', name: 'Svenska' },
      { code: 'da', name: 'Dansk' },
      { code: 'no', name: 'Norsk' },
      { code: 'fi', name: 'Suomi' },
      { code: 'pl', name: 'Polski' },
      { code: 'tr', name: 'Türkçe' },
      { code: 'th', name: 'ไทย' },
      { code: 'vi', name: 'Tiếng Việt' },
      { code: 'id', name: 'Bahasa Indonesia' },
      { code: 'ms', name: 'Bahasa Melayu' },
      { code: 'tl', name: 'Filipino' }
    ]
  }
}

export default new TranslationService()
