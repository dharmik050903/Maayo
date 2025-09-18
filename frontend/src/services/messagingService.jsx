import { createPortal } from 'react-dom'
import MessagingModal from '../components/MessagingModal'

class MessagingService {
  constructor() {
    this.container = null
    this.currentModal = null
    this.currentUser = null
  }

  init() {
    if (typeof window !== 'undefined') {
      this.container = document.createElement('div')
      this.container.id = 'messaging-modal-container'
      document.body.appendChild(this.container)
    }
  }

  setCurrentUser(user) {
    this.currentUser = user
  }

  show(otherUser, project = null, bidId = null) {
    if (!this.container) {
      this.init()
    }

    const handleClose = () => {
      this.hide()
    }

    this.currentModal = createPortal(
      <MessagingModal
        isOpen={true}
        onClose={handleClose}
        currentUser={this.currentUser}
        otherUser={otherUser}
        project={project}
        bidId={bidId}
      />,
      this.container
    )

    this.forceUpdate()
  }

  hide() {
    if (this.currentModal) {
      this.currentModal = null
      this.forceUpdate()
    }
  }

  forceUpdate() {
    if (this.container) {
      this.container.innerHTML = ''
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
