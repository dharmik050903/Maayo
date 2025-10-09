import { useState } from 'react'
import ConfirmationModal from '../components/ConfirmationModal'

export const useConfirmation = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [config, setConfig] = useState({
    title: '',
    message: '',
    type: 'warning',
    confirmText: 'Confirm',
    cancelText: 'Cancel'
  })
  const [resolvePromise, setResolvePromise] = useState(null)

  const showConfirmation = ({
    title = 'Confirm Action',
    message = 'Are you sure you want to proceed?',
    type = 'warning',
    confirmText = 'Confirm',
    cancelText = 'Cancel'
  }) => {
    console.log('🎯 useConfirmation: showConfirmation called with:', { title, message, type })
    
    return new Promise((resolve) => {
      setConfig({ title, message, type, confirmText, cancelText })
      setResolvePromise(() => resolve)
      setIsOpen(true)
    })
  }

  const handleConfirm = () => {
    console.log('✅ useConfirmation: handleConfirm called')
    setIsOpen(false)
    if (resolvePromise) {
      resolvePromise(true)
      setResolvePromise(null)
    }
  }

  const handleCancel = () => {
    console.log('❌ useConfirmation: handleCancel called')
    setIsOpen(false)
    if (resolvePromise) {
      resolvePromise(false)
      setResolvePromise(null)
    }
  }

  const ConfirmationComponent = () => {
    console.log('🎨 ConfirmationComponent rendering with isOpen:', isOpen)
    
    if (!isOpen) return null
    
    return (
      <ConfirmationModal
        isOpen={isOpen}
        onClose={handleCancel}
        onConfirm={handleConfirm}
        title={config.title}
        message={config.message}
        type={config.type}
        confirmText={config.confirmText}
        cancelText={config.cancelText}
      />
    )
  }

  return {
    showConfirmation,
    ConfirmationComponent
  }
}
