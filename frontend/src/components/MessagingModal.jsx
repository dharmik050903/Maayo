import React, { useState, useEffect, useRef } from 'react'
import Button from './Button'
import { authenticatedFetch, getCurrentUser } from '../utils/api'
import messageApiService from '../services/messageApiService'
import socketService from '../services/socketService'

export default function MessagingModal({ isOpen, onClose, currentUser, otherUser, project, bidId }) {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (isOpen && bidId) {
      fetchMessages()
      // Initialize socket connection
      const user = getCurrentUser()
      if (user?._id) {
        console.log('Initializing socket connection for user:', user._id, 'bid:', bidId)
        socketService.connect(user._id)
        
        // Wait for connection before joining room
        const socket = socketService.getSocket()
        if (socket) {
          socket.on('connect', () => {
            console.log('Socket connected, joining room for bid:', bidId)
            socketService.testConnection()
            socketService.joinChatRoom(bidId)
          })
          
          // If already connected, join immediately
          if (socketService.isSocketConnected()) {
            console.log('Socket already connected, joining room immediately')
            socketService.testConnection()
            socketService.joinChatRoom(bidId)
          }
        }
      }
    }
    
    return () => {
      if (bidId) {
        console.log('Leaving chat room for bid:', bidId)
        socketService.leaveChatRoom(bidId)
      }
    }
  }, [isOpen, bidId])

  // Set up real-time message listening
  useEffect(() => {
    if (isOpen && bidId) {
      const handleNewMessage = (data) => {
        console.log('Received new message:', data)
        if (data.bid_id === bidId) {
          console.log('Adding message to chat:', data.message)
          setMessages(prev => [...prev, data.message])
        }
      }

      // Set up message listener
      socketService.onNewMessage(handleNewMessage)

      // Also set up direct socket listener as backup
      const socket = socketService.getSocket()
      if (socket) {
        socket.on('chat:new-message', handleNewMessage)
      }

      return () => {
        socketService.offNewMessage(handleNewMessage)
        if (socket) {
          socket.off('chat:new-message', handleNewMessage)
        }
      }
    }
  }, [isOpen, bidId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchMessages = async () => {
    if (!bidId) {
      setError('No bid ID provided for messaging')
      return
    }

    setLoading(true)
    setError('')
    
    try {
      const response = await messageApiService.getMessages(bidId)
      
      if (response.success) {
        setMessages(response.data || [])
      } else {
        setError(response.error || 'Failed to fetch messages')
        // Fallback to empty array if API fails
        setMessages([])
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
      setError('Failed to fetch messages')
      setMessages([])
    } finally {
      setLoading(false)
    }
  }

  const createMockMessages = () => {
    const mockMessages = [
      {
        _id: 'msg_1',
        message: `Hi ${currentUser?.name || 'there'}! I'm excited to work on your project "${project?.title}". Let's discuss the details!`,
        sender_id: otherUser.id,
        sender_name: otherUser?.name || 'Freelancer',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
      },
      {
        _id: 'msg_2',
        message: `Hi ${otherUser?.name || 'there'}! Great to have you on board. What specific aspects would you like to know about?`,
        sender_id: currentUser?.id,
        sender_name: currentUser?.name || 'You',
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString() // 1 hour ago
      },
      {
        _id: 'msg_3',
        message: 'Perfect! I have experience with similar projects. When would you like to start?',
        sender_id: otherUser.id,
        sender_name: otherUser?.name || 'Freelancer',
        createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString() // 30 minutes ago
      }
    ]
    setMessages(mockMessages)
  }

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !bidId) return

    try {
      setSending(true)
      setError('')
      
      console.log('Sending message for bid:', bidId, 'message:', newMessage.trim())
      
      const response = await messageApiService.sendMessage(bidId, newMessage.trim())
      
      if (response.success) {
        console.log('Message sent successfully:', response.data)
        // Add message immediately for better UX, Socket.IO will handle real-time for other user
        setMessages(prev => [...prev, response.data])
        setNewMessage('')
      } else {
        console.error('Failed to send message:', response.error)
        setError(response.error || 'Failed to send message')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      setError('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center p-4 pt-8">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-mint/20 rounded-full flex items-center justify-center mr-4">
                <svg className="w-5 h-5 text-mint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-graphite">
                  {currentUser?.name || 'You'} ↔ {otherUser?.name || 'User'}
                </h3>
                <p className="text-sm text-coolgray">
                  Project: {project?.title || 'Unknown Project'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchMessages}
                className="text-coolgray hover:text-graphite transition-colors p-1"
                title="Refresh messages"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              <button
                onClick={onClose}
                className="text-coolgray hover:text-graphite transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0">
          {error && (
            <div className="bg-coral/20 text-coral border border-coral/30 rounded-lg p-3 text-sm">
              {error}
            </div>
          )}
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mint"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-coolgray py-8">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message._id}
                className={`flex ${message.from_person_id === currentUser?._id ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-xs lg:max-w-md ${message.from_person_id === currentUser?._id ? 'ml-12' : 'mr-12'}`}>
                  <p className={`text-xs mb-1 ${
                    message.from_person_id === currentUser?._id ? 'text-right text-mint' : 'text-left text-coolgray'
                  }`}>
                    {message.from_person_name || (message.from_person_id === currentUser?._id ? 'You' : 'Other')}
                  </p>
                  <div
                    className={`px-4 py-2 rounded-lg ${
                      message.from_person_id === currentUser?._id
                        ? 'bg-mint text-white'
                        : 'bg-gray-100 text-graphite'
                    }`}
                  >
                    <p className="text-sm">{message.message}</p>
                    <p className={`text-xs mt-1 ${
                      message.from_person_id === currentUser?._id
                        ? 'text-mint-100'
                        : 'text-coolgray'
                    }`}>
                      {formatTime(message.sent_at)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="px-6 py-4 border-t border-gray-200 rounded-b-xl">
          <form onSubmit={sendMessage} className="flex gap-3">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint focus:border-transparent text-graphite"
              disabled={sending}
            />
            <Button
              type="submit"
              variant="accent"
              disabled={!newMessage.trim() || sending}
              className="px-6"
            >
              {sending ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending...
                </div>
              ) : (
                'Send'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
