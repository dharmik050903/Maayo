import React, { useState, useEffect, useRef } from 'react'
import Button from './Button'
import { authenticatedFetch } from '../utils/api'

export default function MessagingModal({ isOpen, onClose, currentUser, otherUser, project }) {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef(null)
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

  useEffect(() => {
    if (isOpen) {
      fetchMessages()
    }
  }, [isOpen, otherUser, project])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchMessages = async () => {
    if (!otherUser?.id || !project?.id) return

    try {
      setLoading(true)
      const response = await authenticatedFetch(`${API_BASE_URL}/messages/conversation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          other_user_id: otherUser.id,
          project_id: project.id
        })
      })

      if (response.ok) {
        const data = await response.json()
        setMessages(data.data || [])
      } else {
        // Create mock messages for demonstration
        createMockMessages()
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
      // Create mock messages for demonstration
      createMockMessages()
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
    if (!newMessage.trim() || !otherUser?.id || !project?.id) return

    try {
      setSending(true)
      const response = await authenticatedFetch(`${API_BASE_URL}/messages/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recipient_id: otherUser.id,
          project_id: project.id,
          message: newMessage.trim()
        })
      })

      if (response.ok) {
        const data = await response.json()
        setMessages(prev => [...prev, data.data])
        setNewMessage('')
      } else {
        // Add mock message for demonstration
        const mockMessage = {
          _id: `msg_${Date.now()}`,
          message: newMessage.trim(),
          sender_id: currentUser?.id,
          sender_name: currentUser?.name || 'You',
          createdAt: new Date().toISOString()
        }
        setMessages(prev => [...prev, mockMessage])
        setNewMessage('')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      // Add mock message for demonstration
      const mockMessage = {
        _id: `msg_${Date.now()}`,
        message: newMessage.trim(),
        sender_id: currentUser?.id,
        sender_name: currentUser?.name || 'You',
        createdAt: new Date().toISOString()
      }
      setMessages(prev => [...prev, mockMessage])
      setNewMessage('')
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

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0">
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
                className={`flex ${message.sender_id === currentUser?.id ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-xs lg:max-w-md ${message.sender_id === currentUser?.id ? 'ml-12' : 'mr-12'}`}>
                  <p className={`text-xs mb-1 ${
                    message.sender_id === currentUser?.id ? 'text-right text-mint' : 'text-left text-coolgray'
                  }`}>
                    {message.sender_name || (message.sender_id === currentUser?.id ? 'You' : 'Other')}
                  </p>
                  <div
                    className={`px-4 py-2 rounded-lg ${
                      message.sender_id === currentUser?.id
                        ? 'bg-mint text-white'
                        : 'bg-gray-100 text-graphite'
                    }`}
                  >
                    <p className="text-sm">{message.message}</p>
                    <p className={`text-xs mt-1 ${
                      message.sender_id === currentUser?.id
                        ? 'text-mint-100'
                        : 'text-coolgray'
                    }`}>
                      {formatTime(message.createdAt)}
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
