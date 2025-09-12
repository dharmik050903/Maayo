import { useEffect, useState } from 'react'
import { checkSession, isTokenNearExpiration, getTokenExpirationDate } from '../utils/api'

export default function SessionManager({ children }) {
  const [sessionInfo, setSessionInfo] = useState(null)
  const [showWarning, setShowWarning] = useState(false)

  useEffect(() => {
    const session = checkSession()
    setSessionInfo(session)

    if (session.isAuthenticated && isTokenNearExpiration()) {
      setShowWarning(true)
    }

    const interval = setInterval(() => {
      const currentSession = checkSession()
      setSessionInfo(currentSession)
      
      if (currentSession.isAuthenticated && isTokenNearExpiration()) {
        setShowWarning(true)
      }
    }, 60 * 60 * 1000) // Check every hour

    return () => clearInterval(interval)
  }, [])

  const handleDismissWarning = () => {
    setShowWarning(false)
  }

  return (
    <>
      {children}
      
      {/* Token expiration warning */}
      {showWarning && sessionInfo?.isAuthenticated && (
        <div className="fixed top-20 right-4 z-50 bg-amber-100 border border-amber-400 text-amber-800 px-4 py-3 rounded-lg shadow-lg max-w-sm">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-amber-800">
                Session Expiring Soon
              </h3>
              <div className="mt-1 text-sm text-amber-700">
                <p>Your session will expire in {sessionInfo?.daysUntilExpiration} days.</p>
                <p>Please log in again to continue.</p>
              </div>
              <div className="mt-2">
                <button
                  onClick={handleDismissWarning}
                  className="text-sm bg-amber-200 hover:bg-amber-300 text-amber-800 px-2 py-1 rounded"
                >
                  Dismiss
                </button>
              </div>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={handleDismissWarning}
                className="text-amber-400 hover:text-amber-600"
              >
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
