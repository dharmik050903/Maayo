import { createPortal } from 'react-dom'
import ConfirmationModal from '../components/ConfirmationModal'

class ConfirmationService {
  constructor() {
    this.container = null
    this.currentModal = null
  }

  init() {
    if (typeof window !== 'undefined') {
      this.container = document.createElement('div')
      this.container.id = 'confirmation-modal-container'
      document.body.appendChild(this.container)
    }
  }

  show({
    title = 'Confirm Action',
    message = 'Are you sure you want to proceed?',
    type = 'warning',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    onConfirm,
    onCancel
  }) {
    return new Promise((resolve) => {
      if (!this.container) {
        this.init()
      }

      const handleConfirm = () => {
        this.hide()
        if (onConfirm) onConfirm()
        resolve(true)
      }

      const handleCancel = () => {
        this.hide()
        if (onCancel) onCancel()
        resolve(false)
      }

      this.currentModal = createPortal(
        <ConfirmationModal
          isOpen={true}
          onClose={handleCancel}
          onConfirm={handleConfirm}
          title={title}
          message={message}
          type={type}
          confirmText={confirmText}
          cancelText={cancelText}
        />,
        this.container
      )

      // Force re-render
      this.forceUpdate()
    })
  }

  hide() {
    if (this.currentModal) {
      this.currentModal = null
      this.forceUpdate()
    }
  }

  forceUpdate() {
    // This will be handled by React's state management
    if (this.container) {
      this.container.innerHTML = ''
    }
  }

  // Convenience methods
  confirm(message, title = 'Confirm Action') {
    return this.show({
      title,
      message,
      type: 'warning',
      confirmText: 'Yes',
      cancelText: 'No'
    })
  }

  alert(message, title = 'Alert', type = 'info') {
    return this.show({
      title,
      message,
      type,
      confirmText: 'OK',
      cancelText: null
    })
  }

  danger(message, title = 'Dangerous Action') {
    return this.show({
      title,
      message,
      type: 'danger',
      confirmText: 'Yes, Continue',
      cancelText: 'Cancel'
    })
  }
}

// Create singleton instance
const confirmationService = new ConfirmationService()

// Initialize on first import
if (typeof window !== 'undefined') {
  confirmationService.init()
}

export default confirmationService
