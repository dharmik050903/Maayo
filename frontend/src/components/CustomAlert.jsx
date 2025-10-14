import React from 'react'

const CustomAlert = ({ 
  isOpen, 
  onClose, 
  title = "Alert", 
  message, 
  type = "info", // 'info', 'success', 'warning', 'error'
  showIcon = true,
  confirmText = "OK",
  onConfirm
}) => {
  if (!isOpen) return null

  const getIconAndColors = () => {
    switch (type) {
      case 'success':
        return {
          icon: '✅',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          iconBgColor: 'bg-green-100',
          textColor: 'text-green-800',
          buttonColor: 'bg-green-500 hover:bg-green-600'
        }
      case 'warning':
        return {
          icon: '⚠️',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          iconBgColor: 'bg-yellow-100',
          textColor: 'text-yellow-800',
          buttonColor: 'bg-yellow-500 hover:bg-yellow-600'
        }
      case 'error':
        return {
          icon: '❌',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          iconBgColor: 'bg-red-100',
          textColor: 'text-red-800',
          buttonColor: 'bg-red-500 hover:bg-red-600'
        }
      default: // info
        return {
          icon: 'ℹ️',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          iconBgColor: 'bg-blue-100',
          textColor: 'text-blue-800',
          buttonColor: 'bg-blue-500 hover:bg-blue-600'
        }
    }
  }

  const { icon, bgColor, borderColor, iconBgColor, textColor, buttonColor } = getIconAndColors()

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm()
    }
    onClose()
  }

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000] p-4"
      onClick={handleBackdropClick}
    >
      <div className={`${bgColor} ${borderColor} border-2 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {showIcon && (
              <div className={`${iconBgColor} rounded-full p-2`}>
                <span className="text-xl">{icon}</span>
              </div>
            )}
            <h3 className={`text-lg font-semibold ${textColor}`}>
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className={`${textColor} hover:opacity-70 transition-opacity`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Message */}
        <div className={`${textColor} mb-6`}>
          {typeof message === 'string' ? (
            <p className="text-sm leading-relaxed whitespace-pre-line">
              {message}
            </p>
          ) : (
            message
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end">
          <button
            onClick={handleConfirm}
            className={`${buttonColor} text-white px-6 py-2 rounded-lg font-medium transition-colors`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

export default CustomAlert
