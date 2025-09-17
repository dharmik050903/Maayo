import React from 'react'
import Button from './Button'
import ConfirmationModal from './ConfirmationModal'
import NotificationModal from './NotificationModal'
import { useConfirmation, useNotification } from '../hooks/useModal'

// Example component showing how to use the modal system
export default function ModalExamples() {
  const { confirmation, showConfirmation, hideConfirmation, setLoading: setConfirmationLoading } = useConfirmation()
  const { notification, showNotification, hideNotification } = useNotification()

  const handleDeleteClick = () => {
    showConfirmation({
      title: 'Delete Item',
      message: 'Are you sure you want to delete this item? This action cannot be undone.',
      type: 'danger',
      confirmText: 'Delete',
      onConfirm: async () => {
        try {
          setConfirmationLoading(true)
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 2000))
          hideConfirmation()
          showNotification({
            title: 'Success',
            message: 'Item deleted successfully!',
            type: 'success'
          })
        } catch (error) {
          showNotification({
            title: 'Error',
            message: 'Failed to delete item. Please try again.',
            type: 'error'
          })
        } finally {
          setConfirmationLoading(false)
        }
      }
    })
  }

  const handleSuccessClick = () => {
    showNotification({
      title: 'Success',
      message: 'Operation completed successfully!',
      type: 'success'
    })
  }

  const handleErrorClick = () => {
    showNotification({
      title: 'Error',
      message: 'Something went wrong. Please try again.',
      type: 'error'
    })
  }

  const handleWarningClick = () => {
    showNotification({
      title: 'Warning',
      message: 'Please check your input before proceeding.',
      type: 'warning'
    })
  }

  const handleInfoClick = () => {
    showNotification({
      title: 'Information',
      message: 'This is an informational message.',
      type: 'info'
    })
  }

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold mb-4">Modal Examples</h2>
      
      <div className="space-x-4">
        <Button onClick={handleDeleteClick} variant="danger">
          Show Delete Confirmation
        </Button>
        <Button onClick={handleSuccessClick} variant="success">
          Show Success Notification
        </Button>
        <Button onClick={handleErrorClick} variant="outline" className="border-red-500 text-red-500 hover:bg-red-50">
          Show Error Notification
        </Button>
        <Button onClick={handleWarningClick} variant="outline" className="border-yellow-500 text-yellow-500 hover:bg-yellow-50">
          Show Warning Notification
        </Button>
        <Button onClick={handleInfoClick} variant="accent">
          Show Info Notification
        </Button>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmation.isOpen}
        onClose={hideConfirmation}
        onConfirm={confirmation.onConfirm}
        title={confirmation.title}
        message={confirmation.message}
        type={confirmation.type}
        confirmText={confirmation.confirmText}
        cancelText={confirmation.cancelText}
        isLoading={confirmation.isLoading}
      />

      {/* Notification Modal */}
      <NotificationModal
        isOpen={notification.isOpen}
        onClose={hideNotification}
        title={notification.title}
        message={notification.message}
        type={notification.type}
        autoClose={notification.autoClose}
        autoCloseDelay={notification.autoCloseDelay}
      />
    </div>
  )
}
