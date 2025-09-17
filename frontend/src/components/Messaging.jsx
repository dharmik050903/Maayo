import React, { useState, useEffect, useRef } from 'react'
import Button from './Button'
import confirmationService from '../services/confirmationService.jsx'

const Messaging = ({ 
  currentUser, 
  otherUser, 
  project, 
  onClose, 
  isClient = false 
}) => {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef(null)
  const messageInputRef = useRef(null)

  // Generate a unique conversation ID based on users and project
  const conversationId = `chat_${isClient ? 'c' : 'f'}_${currentUser.id}_${otherUser.id}_${project.id}`

  useEffect(() => {
    loadMessages()
    // Focus on message input when component mounts
    if (messageInputRef.current) {
      messageInputRef.current.focus()
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadMessages = () => {
    try {
      const savedMessages = localStorage.getItem(conversationId)
      if (savedMessages) {
        setMessages(JSON.parse(savedMessages))
      } else {
        // Initialize with welcome messages
        const welcomeMessages = [
          {
            id: Date.now(),
            sender: isClient ? 'client' : 'freelancer',
            senderId: currentUser.id,
            senderName: currentUser.name,
            message: isClient 
              ? `Hello! I'm excited to work with you on "${project.title}". Let's discuss the project details.`
              : `Hi! Thank you for accepting my bid for "${project.title}". I'm ready to get started!`,
            timestamp: new Date(),
            isSystem: false
          }
        ]
        setMessages(welcomeMessages)
        saveMessages(welcomeMessages)
      }
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }

  const saveMessages = (messagesToSave) => {
    try {
      localStorage.setItem(conversationId, JSON.stringify(messagesToSave))
    } catch (error) {
      console.error('Error saving messages:', error)
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    
    if (!newMessage.trim()) return
    
    try {
      setSending(true)
      
      const message = {
        id: Date.now(),
        sender: isClient ? 'client' : 'freelancer',
        senderId: currentUser.id,
        senderName: currentUser.name,
        message: newMessage.trim(),
        timestamp: new Date(),
        isSystem: false
      }
      
      const updatedMessages = [...messages, message]
      setMessages(updatedMessages)
      saveMessages(updatedMessages)
      setNewMessage('')
      
    } catch (error) {
      console.error('Error sending message:', error)
      await confirmationService.alert(
        'Failed to send message. Please try again.',
        'Error'
      )
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

  const formatDate = (timestamp) => {
    const date = new Date(timestamp)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      })
    }
  }

  const shouldShowDate = (message, previousMessage) => {
    if (!previousMessage) return true
    const currentDate = new Date(message.timestamp).toDateString()
    const previousDate = new Date(previousMessage.timestamp).toDateString()
    return currentDate !== previousDate
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[600px] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-violet/5 to-mint/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-mint/20 rounded-full flex items-center justify-center">
                <span className="text-lg font-bold text-mint uppercase">
                  {otherUser.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-graphite">
                  {otherUser.name}
                </h3>
                <p className="text-sm text-coolgray">
                  {project.title} • {isClient ? 'Freelancer' : 'Client'}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12 text-coolgray">
              <svg className="w-16 h-16 mx-auto mb-4 text-coolgray/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <h3 className="text-xl font-semibold text-graphite mb-2">Start the conversation</h3>
              <p className="text-coolgray">Send your first message below.</p>
            </div>
          ) : (
            messages.map((message, index) => {
              const previousMessage = index > 0 ? messages[index - 1] : null
              const showDate = shouldShowDate(message, previousMessage)
              const isOwnMessage = message.senderId === currentUser.id

              return (
                <div key={message.id}>
                  {showDate && (
                    <div className="text-center py-2">
                      <span className="text-xs text-coolgray bg-gray-100 px-3 py-1 rounded-full">
                        {formatDate(message.timestamp)}
                      </span>
                    </div>
                  )}
                  <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                        isOwnMessage
                          ? 'bg-mint text-white'
                          : 'bg-gray-100 text-graphite'
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{message.message}</p>
                      <p className={`text-xs mt-1 ${
                        isOwnMessage ? 'text-white/70' : 'text-coolgray'
                      }`}>
                        {formatTime(message.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="p-4 border-t border-gray-200">
          <form onSubmit={handleSendMessage} className="flex space-x-3">
            <input
              ref={messageInputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint focus:border-transparent text-graphite"
              disabled={sending}
            />
            <Button
              type="submit"
              variant="accent"
              disabled={!newMessage.trim() || sending}
              className="px-6 py-3 bg-mint text-white hover:bg-mint/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? 'Sending...' : 'Send'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Messaging


