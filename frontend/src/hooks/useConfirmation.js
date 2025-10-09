import { useState } from 'react'
import ConfirmationModal from '../components/ConfirmationModal'

export const useConfirmation = () => {
  const [confirmationState, setConfirmationState] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    onConfirm: null,
    onCancel: null
  })

  const showConfirmation = ({
    title = 'Confirm Action',
    message = 'Are you sure you want to proceed?',
    type = 'warning',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    onConfirm,
    onCancel
  }) => {
    return new Promise((resolve) => {
      setConfirmationState({
        isOpen: true,
        title,
        message,
        type,
        confirmText,
        cancelText,
        onConfirm: () => {
          setConfirmationState(prev => ({ ...prev, isOpen: false }))
          if (onConfirm) onConfirm()
          resolve(true)
        },
        onCancel: () => {
          setConfirmationState(prev => ({ ...prev, isOpen: false }))
          if (onCancel) onCancel()
          resolve(false)
        }
      })
    })
  }

  const hideConfirmation = () => {
    setConfirmationState(prev => ({ ...prev, isOpen: false }))
  }

  const ConfirmationComponent = () => (
    <ConfirmationModal
      isOpen={confirmationState.isOpen}
      onClose={confirmationState.onCancel}
      onConfirm={confirmationState.onConfirm}
      title={confirmationState.title}
      message={confirmationState.message}
      type={confirmationState.type}
      confirmText={confirmationState.confirmText}
      cancelText={confirmationState.cancelText}
    />
  )

  return {
    showConfirmation,
    hideConfirmation,
    ConfirmationComponent
  }
}
