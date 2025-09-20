import React from 'react'
import { createRoot } from 'react-dom/client'
import MessagingModal from '../components/MessagingModal'

class MessagingService {
  constructor() {
    this.container = null
    this.root = null
    this.currentUser = null
    this.isOpen = false
  }

  init() {
    if (typeof window !== 'undefined') {
      this.container = document.createElement('div')
      this.container.id = 'messaging-modal-container'
      document.body.appendChild(this.container)
      this.root = createRoot(this.container)
    }
  }

  setCurrentUser(user) {
    this.currentUser = user
  }

  show(otherUser, project = null, bidId = null) {
    console.log('MessagingService: Opening modal with:', { otherUser, project, bidId })
    
    if (!this.container) {
      this.init()
    }

    if (!this.root) {
      this.root = createRoot(this.container)
    }

    const handleClose = () => {
      this.hide()
    }

    this.isOpen = true
    this.root.render(
      <MessagingModal
        isOpen={true}
        onClose={handleClose}
        currentUser={this.currentUser}
        otherUser={otherUser}
        project={project}
        bidId={bidId}
      />
    )
  }

  hide() {
    console.log('MessagingService: Closing modal')
    this.isOpen = false
    if (this.root) {
      this.root.render(null)
    }
  }
}

// Create singleton instance
const messagingService = new MessagingService()

// Initialize on first import
if (typeof window !== 'undefined') {
  messagingService.init()
}

export default messagingService
