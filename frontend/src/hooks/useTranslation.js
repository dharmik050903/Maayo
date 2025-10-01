import { useLanguage } from '../contexts/LanguageContext'
import { getTranslation } from '../data/translations'

// Custom hook for easy translation access
export const useTranslation = () => {
  const { language } = useLanguage()
  
  const t = (key) => {
    return getTranslation(key, language)
  }
  
  return { t, language }
}
