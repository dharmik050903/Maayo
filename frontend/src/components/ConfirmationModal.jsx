import React from 'react'
import Button from './Button'
import { useTranslation } from '../hooks/useTranslation'

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  type = "warning", // "warning", "danger", "success", "info"
  isLoading = false,
  confirmButtonVariant = "primary"
}) {
  const { t } = useTranslation()
  
  // Use translations as defaults if not provided
  const finalTitle = title || t('confirmAction')
  const finalMessage = message || t('confirmMessage')
  const finalConfirmText = confirmText || t('confirm')
  const finalCancelText = cancelText || t('cancel')
  
  if (!isOpen) return null

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          icon: '⚠️',
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600',
          borderColor: 'border-red-200',
          confirmVariant: 'danger'
        }
      case 'success':
        return {
          icon: '✅',
          iconBg: 'bg-green-100',
          iconColor: 'text-green-600',
          borderColor: 'border-green-200',
          confirmVariant: 'success'
        }
      case 'info':
        return {
          icon: 'ℹ️',
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-600',
          borderColor: 'border-blue-200',
          confirmVariant: 'accent'
        }
      default: // warning
        return {
          icon: '⚠️',
          iconBg: 'bg-yellow-100',
          iconColor: 'text-yellow-600',
          borderColor: 'border-yellow-200',
          confirmVariant: 'warning'
        }
    }
  }

  const typeStyles = getTypeStyles()

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm()
    }
  }

  const handleCancel = () => {
    if (onClose) {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full transform transition-all duration-300 scale-100">
        {/* Header */}
        <div className={`px-6 py-4 border-b ${typeStyles.borderColor} rounded-t-xl`}>
          <div className="flex items-center">
            <div className={`w-10 h-10 ${typeStyles.iconBg} rounded-full flex items-center justify-center mr-4`}>
              <span className={`text-xl ${typeStyles.iconColor}`}>
                {typeStyles.icon}
              </span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-graphite">
                {finalTitle}
              </h3>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          <p className="text-coolgray leading-relaxed">
            {finalMessage}
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-xl flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
            className="border-gray-300 text-gray-700 hover:bg-gray-50 px-6"
          >
            {finalCancelText}
          </Button>
          <Button
            variant={confirmButtonVariant || typeStyles.confirmVariant}
            onClick={handleConfirm}
            disabled={isLoading}
            className="px-6"
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {t('processing')}
              </div>
            ) : (
              finalConfirmText
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
