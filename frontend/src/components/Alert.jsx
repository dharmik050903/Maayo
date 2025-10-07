import React from 'react'
import Button from './Button'

export default function Alert({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Confirm Action", 
  message, 
  confirmText = "OK", 
  cancelText = "Cancel",
  type = "confirm", // confirm, warning, danger, success
  confirmButtonColor = "primary",
  showCancel = true
}) {
  if (!isOpen) return null

  const getAlertStyles = () => {
    switch (type) {
      case 'warning':
        return {
          icon: '⚠️',
          iconColor: 'text-yellow-600',
          borderColor: 'border-yellow-200',
          bgColor: 'bg-yellow-50'
        }
      case 'danger':
        return {
          icon: '🚨',
          iconColor: 'text-red-600',
          borderColor: 'border-red-200',
          bgColor: 'bg-red-50'
        }
      case 'success':
        return {
          icon: '✅',
          iconColor: 'text-green-600',
          borderColor: 'border-green-200',
          bgColor: 'bg-green-50'
        }
      default:
        return {
          icon: '❓',
          iconColor: 'text-blue-600',
          borderColor: 'border-blue-200',
          bgColor: 'bg-blue-50'
        }
    }
  }

  const styles = getAlertStyles()

  const handleConfirm = () => {
    if (onConfirm) onConfirm()
    onClose()
  }

  const handleCancel = () => {
    onClose()
  }

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1100] p-4"
      onClick={handleBackdropClick}
    >
      <div className={`${styles.bgColor} ${styles.borderColor} border rounded-lg shadow-lg max-w-md w-full p-6`}>
        {/* Header */}
        <div className="flex items-center mb-4">
          <div className={`text-2xl mr-3 ${styles.iconColor}`}>
            {styles.icon}
          </div>
          <h3 className="text-lg font-semibold text-graphite">
            {title}
          </h3>
        </div>

        {/* Message */}
        <div className="mb-6">
          <p className="text-coolgray leading-relaxed">
            {message}
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3">
          {showCancel && (
            <Button
              onClick={handleCancel}
              variant="secondary"
              className="border-gray-300 text-graphite hover:bg-gray-50"
            >
              {cancelText}
            </Button>
          )}
          
          <Button
            onClick={handleConfirm}
            variant={confirmButtonColor}
            className={
              type === 'danger' 
                ? 'bg-red-600 hover:bg-red-700 text-white border-red-600' 
                : type === 'warning'
                ? 'bg-yellow-600 hover:bg-yellow-700 text-white border-yellow-600'
                : type === 'success'
                ? 'bg-green-600 hover:bg-green-700 text-white border-green-600'
                : 'bg-mint hover:bg-mint/90 text-white border-mint'
            }
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  )
}

// Hook for easier usage
export function useAlert() {
  const [alertState, setAlertState] = React.useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'confirm',
    confirmText: 'OK',
    cancelText: 'Cancel',
    onConfirm: null,
    confirmButtonColor: 'primary',
    showCancel: true
  })

  const showAlert = (options) => {
    return new Promise((resolve) => {
      setAlertState({
        isOpen: true,
        title: options.title || 'Confirm Action',
        message: options.message || '',
        type: options.type || 'confirm',
        confirmText: options.confirmText || 'OK',
        cancelText: options.cancelText || 'Cancel',
        confirmButtonColor: options.confirmButtonColor || 'primary',
        showCancel: options.showCancel !== false,
        onConfirm: () => resolve(true),
        onCancel: () => resolve(false)
      })
    })
  }

  const hideAlert = () => {
    setAlertState(prev => ({ ...prev, isOpen: false }))
  }

  const AlertComponent = () => (
    <Alert
      isOpen={alertState.isOpen}
      onClose={hideAlert}
      onConfirm={alertState.onConfirm}
      title={alertState.title}
      message={alertState.message}
      type={alertState.type}
      confirmText={alertState.confirmText}
      cancelText={alertState.cancelText}
      confirmButtonColor={alertState.confirmButtonColor}
      showCancel={alertState.showCancel}
    />
  )

  return {
    showAlert,
    hideAlert,
    AlertComponent
  }
}
