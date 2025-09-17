import { useState } from 'react'

export function useModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [modalData, setModalData] = useState({})

  const openModal = (data = {}) => {
    setModalData(data)
    setIsOpen(true)
  }

  const closeModal = () => {
    setIsOpen(false)
    setModalData({})
  }

  return {
    isOpen,
    modalData,
    openModal,
    closeModal
  }
}

export function useConfirmation() {
  const [confirmation, setConfirmation] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning',
    onConfirm: null,
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    isLoading: false
  })

  const showConfirmation = ({
    title = 'Confirm Action',
    message = 'Are you sure you want to proceed?',
    type = 'warning',
    onConfirm,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    isLoading = false
  }) => {
    setConfirmation({
      isOpen: true,
      title,
      message,
      type,
      onConfirm,
      confirmText,
      cancelText,
      isLoading
    })
  }

  const hideConfirmation = () => {
    setConfirmation(prev => ({ ...prev, isOpen: false }))
  }

  const setLoading = (loading) => {
    setConfirmation(prev => ({ ...prev, isLoading: loading }))
  }

  return {
    confirmation,
    showConfirmation,
    hideConfirmation,
    setLoading
  }
}

export function useNotification() {
  const [notification, setNotification] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    autoClose: true,
    autoCloseDelay: 3000
  })

  const showNotification = ({
    title = 'Notification',
    message = '',
    type = 'info',
    autoClose = true,
    autoCloseDelay = 3000
  }) => {
    setNotification({
      isOpen: true,
      title,
      message,
      type,
      autoClose,
      autoCloseDelay
    })
  }

  const hideNotification = () => {
    setNotification(prev => ({ ...prev, isOpen: false }))
  }

  return {
    notification,
    showNotification,
    hideNotification
  }
}
