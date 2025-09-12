import React, { useState } from 'react'
import Header from '../components/Header'
import MyProjects from '../components/MyProjects'
import ClientMyBids from '../components/ClientMyBids'
import { getCurrentUser } from '../utils/api'

export default function ClientMyProjects() {
  const userData = getCurrentUser()
  const [activeTab, setActiveTab] = useState('projects')

  return (
        <div className="min-h-screen bg-brand-gradient">
      <Header 
        userType="client" 
        userData={userData}
        onLogout={() => {
          localStorage.clear()
          window.location.href = '/'
        }}
      />
      
      <main className="pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">
              Project <span className="text-mint">Management</span>
            </h1>
            <p className="text-white/80 text-lg">
              Manage your projects and review bids from freelancers
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="mb-8">
            <div className="flex space-x-1 bg-white/10 p-1 rounded-lg backdrop-blur-sm">
              <button
                onClick={() => setActiveTab('projects')}
                className={`flex-1 px-6 py-3 rounded-md font-semibold transition-all duration-200 ${
                  activeTab === 'projects'
                    ? 'bg-white text-graphite shadow-lg'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>My Projects</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('bids')}
                className={`flex-1 px-6 py-3 rounded-md font-semibold transition-all duration-200 ${
                  activeTab === 'bids'
                    ? 'bg-white text-graphite shadow-lg'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                  <span>Bids Request</span>
                </div>
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="transition-all duration-300">
            {activeTab === 'projects' && <MyProjects />}
            {activeTab === 'bids' && <ClientMyBids />}
          </div>
        </div>
      </main>
    </div>
  )
}
