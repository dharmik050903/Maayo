// Example usage of the Alert component
import React from 'react'
import { useAlert } from './Alert'

export default function AlertUsageExample() {
  const { showAlert, AlertComponent } = useAlert()

  const handleConfirmAction = async () => {
    const confirmed = await showAlert({
      title: 'Confirm Action',
      message: 'Are you sure you want to proceed?',
      type: 'confirm',
      confirmText: 'Yes',
      cancelText: 'No'
    })

    if (confirmed) {
      console.log('User confirmed the action')
    } else {
      console.log('User cancelled the action')
    }
  }

  const handleDeleteAction = async () => {
    const confirmed = await showAlert({
      title: 'Delete Item',
      message: 'This action cannot be undone. Are you sure?',
      type: 'danger',
      confirmText: 'Delete',
      cancelText: 'Cancel'
    })

    if (confirmed) {
      console.log('Item deleted')
    }
  }

  const handleWarningAction = async () => {
    const confirmed = await showAlert({
      title: 'Warning',
      message: 'This action may have unintended consequences.',
      type: 'warning',
      confirmText: 'Proceed',
      cancelText: 'Cancel'
    })

    if (confirmed) {
      console.log('Action proceeded with warning')
    }
  }

  const handleSuccessAction = async () => {
    const confirmed = await showAlert({
      title: 'Success',
      message: 'Operation completed successfully!',
      type: 'success',
      confirmText: 'OK',
      showCancel: false // Only show OK button
    })

    console.log('Success acknowledged')
  }

  return (
    <div>
      <button onClick={handleConfirmAction}>Confirm Action</button>
      <button onClick={handleDeleteAction}>Delete Item</button>
      <button onClick={handleWarningAction}>Warning Action</button>
      <button onClick={handleSuccessAction}>Success Message</button>
      
      {/* Always include this component */}
      <AlertComponent />
    </div>
  )
}

// Alternative: Direct component usage (without hook)
import Alert from './Alert'

export function DirectAlertExample() {
  const [showAlert, setShowAlert] = React.useState(false)

  const handleConfirm = () => {
    console.log('Confirmed!')
    setShowAlert(false)
  }

  const handleCancel = () => {
    console.log('Cancelled!')
    setShowAlert(false)
  }

  return (
    <div>
      <button onClick={() => setShowAlert(true)}>Show Alert</button>
      
      <Alert
        isOpen={showAlert}
        onClose={handleCancel}
        onConfirm={handleConfirm}
        title="Custom Alert"
        message="This is a custom alert message."
        type="confirm"
        confirmText="OK"
        cancelText="Cancel"
      />
    </div>
  )
}
