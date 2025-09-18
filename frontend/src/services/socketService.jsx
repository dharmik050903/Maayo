import { io } from 'socket.io-client'

class SocketService {
  constructor() {
    this.socket = null
    this.isConnected = false
    this.listeners = new Map()
  }

  // Initialize socket connection
  connect(userId) {
    if (this.socket && this.isConnected) {
      console.log('Socket already connected, reusing connection')
      return this.socket
    }

    // Disconnect existing connection if any
    if (this.socket) {
      this.socket.disconnect()
    }

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
    // Socket.IO runs on the same port as the HTTP server, so we need the base URL without /api
    const socketUrl = API_BASE_URL.replace('/api', '')
    
    // Ensure we have the correct protocol and port
    const finalSocketUrl = socketUrl.startsWith('http') ? socketUrl : `http://${socketUrl}`

    console.log('Connecting to socket server:', finalSocketUrl, 'with userId:', userId)

    this.socket = io(finalSocketUrl, {
      query: { userId },
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true,
      autoConnect: true
    })

    this.socket.on('connect', () => {
      console.log('Socket connected successfully:', this.socket.id)
      console.log('Socket transport:', this.socket.io.engine.transport.name)
      this.isConnected = true
    })

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason)
      this.isConnected = false
    })

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
      this.isConnected = false
    })

    this.socket.on('error', (error) => {
      console.error('Socket error:', error)
    })

    return this.socket
  }

  // Disconnect socket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.isConnected = false
    }
  }

  // Join a chat room for a specific bid
  joinChatRoom(bidId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('chat:join', { bid_id: bidId })
      console.log('Joined chat room for bid:', bidId)
    } else {
      console.warn('Socket not connected, cannot join room:', bidId)
    }
  }

  // Leave a chat room
  leaveChatRoom(bidId) {
    if (this.socket && this.isConnected) {
      this.socket.leave(`chat:${bidId}`)
      console.log('Left chat room for bid:', bidId)
    }
  }

  // Listen for new messages
  onNewMessage(callback) {
    if (this.socket) {
      this.socket.on('chat:new-message', callback)
      this.listeners.set('chat:new-message', callback)
    }
  }

  // Remove message listener
  offNewMessage(callback) {
    if (this.socket) {
      this.socket.off('chat:new-message', callback)
      this.listeners.delete('chat:new-message')
    }
  }

  // Get socket instance
  getSocket() {
    return this.socket
  }

  // Check if connected
  isSocketConnected() {
    return this.isConnected
  }

  // Clean up all listeners
  cleanup() {
    if (this.socket) {
      this.listeners.forEach((callback, event) => {
        this.socket.off(event, callback)
      })
      this.listeners.clear()
    }
  }

  // Test socket connection
  testConnection() {
    if (this.socket && this.isConnected) {
      console.log('Socket connection test - Connected:', this.isConnected)
      console.log('Socket ID:', this.socket.id)
      console.log('Socket transport:', this.socket.io.engine.transport.name)
      return true
    } else {
      console.log('Socket connection test - Not connected')
      return false
    }
  }
}

// Create singleton instance
const socketService = new SocketService()

export default socketService
