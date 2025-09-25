import React, { useState, useEffect } from 'react'
import Button from './Button'
import { authenticatedFetch } from '../utils/api'
import messagingService from '../services/messagingService.jsx'
import messageApiService from '../services/messageApiService'

export default function ConversationsModal({ isOpen, onClose, currentUser }) {
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedConversation, setSelectedConversation] = useState(null)
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

  useEffect(() => {
    if (isOpen) {
      fetchConversations()
    }
  }, [isOpen, currentUser])

  const fetchConversations = async () => {
    if (!currentUser?._id) {
      console.log('ConversationsModal: No current user ID, skipping fetch')
      return
    }

    try {
      setLoading(true)
      console.log('ConversationsModal: Fetching conversations for user:', currentUser._id)
      const response = await messageApiService.getConversations()
      
      if (response.success) {
        console.log('ConversationsModal: Successfully fetched conversations:', response.data)
        setConversations(response.data || [])
        
        // If no conversations, try to create mock conversations
        if (!response.data || response.data.length === 0) {
          console.log('ConversationsModal: No conversations found, creating mock conversations')
          await createMockConversations()
        }
      } else {
        console.error('ConversationsModal: Error fetching conversations:', response.error)
        setConversations([])
        
        // Try to create mock conversations as fallback
        console.log('ConversationsModal: Creating mock conversations as fallback')
        await createMockConversations()
      }
    } catch (error) {
      console.error('ConversationsModal: Error fetching conversations:', error)
      setConversations([])
    } finally {
      setLoading(false)
    }
  }

  const createMockConversations = async () => {
    try {
      // Fetch user's projects and bids to create conversations
      const projectsResponse = await authenticatedFetch(`${API_BASE_URL}/projects/my-projects`, {
        method: 'GET'
      })
      
      if (projectsResponse.ok) {
        const projectsData = await projectsResponse.json()
        const projects = projectsData.data || []
        
        // Create conversations from projects with bids
        const mockConversations = []
        
        for (const project of projects) {
          if (project.bids && project.bids.length > 0) {
            for (const bid of project.bids) {
              // Only create conversations for accepted bids
              if (bid.status === 'accepted') {
                mockConversations.push({
                  bid_id: bid._id || `bid_${project._id}_${bid.freelancer_id}`,
                  project_id: project._id,
                  project_title: project.title,
                  freelancer_id: bid.freelancer_id,
                  freelancer_name: bid.freelancer_name || 'Freelancer',
                  client_id: currentUser._id,
                  client_name: currentUser.name || currentUser.username,
                  last_message: 'Bid accepted! Let\'s discuss the project details.',
                  last_message_time: bid.updatedAt || bid.createdAt || new Date().toISOString(),
                  unread_count: 0
                })
              }
            }
          }
        }
        
        console.log('ConversationsModal: Created mock conversations:', mockConversations)
        setConversations(mockConversations)
      }
    } catch (error) {
      console.error('Error creating mock conversations:', error)
      setConversations([])
    }
  }

  const handleStartChat = (conversation) => {
    console.log('ConversationsModal: Starting chat with conversation:', conversation)
    
    // Create user and project objects for the messaging service
    const otherUser = {
      id: conversation.freelancer_id || conversation.client_id,
      name: conversation.freelancer_name || conversation.client_name
    }
    
    const project = {
      id: conversation.project_id,
      title: conversation.project_title
    }
    
    console.log('ConversationsModal: Opening messaging service with:', { otherUser, project, bidId: conversation.bid_id })
    messagingService.show(otherUser, project, conversation.bid_id)
    onClose()
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now - date) / (1000 * 60 * 60)
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      })
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      })
    }
  }

  if (!isOpen) return null

  console.log('ConversationsModal: Rendering modal with conversations:', conversations.length)

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-[99999] flex justify-center p-4 pt-8" 
      style={{ 
        zIndex: 99999,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col" style={{ minHeight: '500px' }}>
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
                  Your Conversations
                </h3>
                <p className="text-sm text-coolgray">
                  Chat with freelancers and clients
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

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto p-6 min-h-0" style={{ minHeight: '400px' }}>
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mint"></div>
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center text-coolgray py-8">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-lg font-medium mb-2">No conversations yet</p>
              <p className="text-sm">Conversations will appear here after you accept a freelancer's bid or when a client accepts your bid.</p>
              <p className="text-xs text-gray-400 mt-2">Debug: {conversations.length} conversations loaded</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-gray-400 mb-2">Debug: Showing {conversations.length} conversations</p>
              {conversations.map((conversation) => (
                <div
                  key={conversation.bid_id}
                  onClick={() => handleStartChat(conversation)}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-mint/20 rounded-full flex items-center justify-center">
                        <span className="text-mint font-semibold text-lg">
                          {(conversation.freelancer_name || conversation.client_name || 'U').charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-graphite">
                          {conversation.freelancer_name || conversation.client_name || 'Unknown User'}
                        </h4>
                        <p className="text-sm text-coolgray">
                          Project: {conversation.project_title || 'Unknown Project'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-coolgray">
                        {formatTime(conversation.latest_message_time)}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-coolgray mt-2 line-clamp-1">
                    {conversation.latest_message || 'No messages yet'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 rounded-b-xl bg-gray-50">
          <div className="flex justify-between items-center">
            <p className="text-sm text-coolgray">
              {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
            </p>
            <Button
              variant="outline"
              onClick={onClose}
              className="px-4 py-2"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
