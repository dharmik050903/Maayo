import React, { useEffect } from 'react'
import Button from './Button'

export default function NotificationModal({
  isOpen,
  onClose,
  title = "Notification",
  message = "",
  type = "info", // "success", "error", "warning", "info"
  autoClose = true,
  autoCloseDelay = 3000,
  showCloseButton = true
}) {
  useEffect(() => {
    if (isOpen && autoClose) {
      const timer = setTimeout(() => {
        onClose()
      }, autoCloseDelay)
      
      return () => clearTimeout(timer)
    }
  }, [isOpen, autoClose, autoCloseDelay, onClose])

  if (!isOpen) return null

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          icon: '✅',
          iconBg: 'bg-green-100',
          iconColor: 'text-green-600',
          borderColor: 'border-green-200',
          bgColor: 'bg-green-50'
        }
      case 'error':
        return {
          icon: '❌',
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600',
          borderColor: 'border-red-200',
          bgColor: 'bg-red-50'
        }
      case 'warning':
        return {
          icon: '⚠️',
          iconBg: 'bg-yellow-100',
          iconColor: 'text-yellow-600',
          borderColor: 'border-yellow-200',
          bgColor: 'bg-yellow-50'
        }
      default: // info
        return {
          icon: 'ℹ️',
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-600',
          borderColor: 'border-blue-200',
          bgColor: 'bg-blue-50'
        }
    }
  }

  const typeStyles = getTypeStyles()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1100] p-4">
      <div className={`bg-white rounded-xl shadow-2xl max-w-md w-full transform transition-all duration-300 scale-100 border-l-4 ${typeStyles.borderColor}`}>
        {/* Header */}
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className={`w-10 h-10 ${typeStyles.iconBg} rounded-full flex items-center justify-center mr-4`}>
                <span className={`text-xl ${typeStyles.iconColor}`}>
                  {typeStyles.icon}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-graphite">
                  {title}
                </h3>
              </div>
            </div>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="text-coolgray hover:text-graphite transition-colors p-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="px-6 pb-6">
          <p className="text-coolgray leading-relaxed">
            {message}
          </p>
        </div>

        {/* Footer */}
        {showCloseButton && (
          <div className="px-6 py-4 bg-gray-50 rounded-b-xl flex justify-end">
            <Button
              variant="accent"
              onClick={onClose}
              className="px-6"
            >
              OK
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
