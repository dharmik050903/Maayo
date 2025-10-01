import React, { createContext, useContext, useState, useEffect } from 'react'

const LanguageContext = createContext()

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    // Get language from localStorage or default to 'en'
    return localStorage.getItem('selectedLanguage') || 'en'
  })

  const [isLoading, setIsLoading] = useState(false)

  // Save language to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('selectedLanguage', language)
  }, [language])

  const changeLanguage = async (newLanguage) => {
    setIsLoading(true)
    try {
      // Simulate loading time for better UX
      await new Promise(resolve => setTimeout(resolve, 300))
      setLanguage(newLanguage)
    } catch (error) {
      console.error('Error changing language:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const value = {
    language,
    changeLanguage,
    isLoading
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}
