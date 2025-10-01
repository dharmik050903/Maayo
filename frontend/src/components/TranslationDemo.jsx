import React from 'react'
import { useTranslation } from '../hooks/useTranslation'

// Example component showing how to use translations
const TranslationDemo = () => {
  const { t, language } = useTranslation()

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Translation Demo</h2>
      <p className="mb-2">Current Language: <span className="font-semibold text-mint">{language}</span></p>
      
      <div className="space-y-2">
        <p><strong>Home:</strong> {t('home')}</p>
        <p><strong>About:</strong> {t('about')}</p>
        <p><strong>Contact:</strong> {t('contact')}</p>
        <p><strong>Login:</strong> {t('login')}</p>
        <p><strong>Sign Up:</strong> {t('signup')}</p>
        <p><strong>Dashboard:</strong> {t('dashboard')}</p>
        <p><strong>Projects:</strong> {t('projects')}</p>
        <p><strong>Messages:</strong> {t('messages')}</p>
        <p><strong>Settings:</strong> {t('settings')}</p>
      </div>
      
      <div className="mt-4 p-3 bg-gray-50 rounded">
        <p className="text-sm text-gray-600">
          This component demonstrates how to use the translation system. 
          Change the language using the footer language switcher to see the translations update.
        </p>
      </div>
    </div>
  )
}

export default TranslationDemo
