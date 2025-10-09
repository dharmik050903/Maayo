import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import Header from '../components/Header'
import { applicationService } from '../services/applicationService'
import { useComprehensiveTranslation } from '../hooks/useComprehensiveTranslation'
import { isAuthenticated, getCurrentUser, clearAuth } from '../utils/api'

export default function ApplicationStats() {
  const { t } = useComprehensiveTranslation()
  const navigate = useNavigate()
  const [userData, setUserData] = useState(null)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    // Check authentication
    if (!isAuthenticated()) {
      window.location.href = '/login'
      return
    }
    
    const user = getCurrentUser()
    setUserData(user)
    fetchStats()
  }, [])

  const handleLogout = () => {
    clearAuth()
    window.location.href = '/login'
  }

  const fetchStats = async () => {
    try {
      setLoading(true)
      const response = await applicationService.getApplicationStats()
      
      if (response.status) {
        setStats(response.data)
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to fetch statistics' })
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
      setMessage({ type: 'error', text: 'Failed to fetch statistics. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'applied': return 'text-blue-600'
      case 'viewed': return 'text-yellow-600'
      case 'shortlisted': return 'text-purple-600'
      case 'interviewed': return 'text-indigo-600'
      case 'selected': return 'text-green-600'
      case 'rejected': return 'text-red-600'
      case 'withdrawn': return 'text-gray-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusBgColor = (status) => {
    switch (status) {
      case 'applied': return 'bg-blue-50'
      case 'viewed': return 'bg-yellow-50'
      case 'shortlisted': return 'bg-purple-50'
      case 'interviewed': return 'bg-indigo-50'
      case 'selected': return 'bg-green-50'
      case 'rejected': return 'bg-red-50'
      case 'withdrawn': return 'bg-gray-50'
      default: return 'bg-gray-50'
    }
  }

  const calculateSuccessRate = () => {
    if (!stats || !stats.total_applications) return 0
    const successful = stats.status_breakdown?.selected || 0
    return ((successful / stats.total_applications) * 100).toFixed(1)
  }

  const calculateResponseRate = () => {
    if (!stats || !stats.total_applications) return 0
    const responded = stats.total_applications - (stats.status_breakdown?.applied || 0)
    return ((responded / stats.total_applications) * 100).toFixed(1)
  }

  if (loading && !userData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-brand-gradient text-white">
      <Header 
        userType="freelancer" 
        onLogout={handleLogout} 
        userData={userData}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-8">
        {/* Header Section */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight">
                Application <span className="text-mint">Statistics</span>
              </h1>
              <p className="text-base sm:text-lg text-white/80 mt-2 sm:mt-4">
                Track your job application performance
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <Button
                variant="secondary"
                onClick={() => navigate('/freelancer/applications')}
                className="border-gray-300 text-graphite hover:bg-gray-50 w-full sm:w-auto px-4 sm:px-6 py-3 font-semibold"
              >
                View Applications
              </Button>
              <Button
                variant="secondary"
                onClick={() => navigate('/freelancer/jobs')}
                className="border-gray-300 text-graphite hover:bg-gray-50 w-full sm:w-auto px-4 sm:px-6 py-3 font-semibold"
              >
                Browse Jobs
              </Button>
            </div>
          </div>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        {loading ? (
          <div className="card bg-white/95 p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mint mx-auto"></div>
            <p className="mt-2 text-coolgray">Loading statistics...</p>
          </div>
        ) : !stats ? (
          <div className="card bg-white/95 p-8 text-center">
            <div className="w-16 h-16 bg-mint/20 rounded-full mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-mint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-graphite mb-2">No statistics available</h3>
            <p className="text-coolgray mb-6">You haven't applied to any jobs yet.</p>
            <Button
              onClick={() => navigate('/freelancer/jobs')}
              className="bg-mint text-white hover:bg-mint/90"
            >
              Browse Jobs
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <div className="card bg-white/95 p-4 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-coolgray">Total Applications</p>
                    <p className="text-2xl font-semibold text-graphite">{stats.total_applications || 0}</p>
                  </div>
                </div>
              </div>

              <div className="card bg-white/95 p-4 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-coolgray">Selected</p>
                    <p className="text-2xl font-semibold text-graphite">{stats.status_breakdown?.selected || 0}</p>
                  </div>
                </div>
              </div>

              <div className="card bg-white/95 p-4 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-coolgray">Success Rate</p>
                    <p className="text-2xl font-semibold text-graphite">{calculateSuccessRate()}%</p>
                  </div>
                </div>
              </div>

              <div className="card bg-white/95 p-4 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-coolgray">Response Rate</p>
                    <p className="text-2xl font-semibold text-graphite">{calculateResponseRate()}%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Status Breakdown */}
            <div className="card bg-white/95 p-6">
              <h2 className="text-xl font-semibold text-graphite mb-6">Application Status Breakdown</h2>
              
              {stats.status_breakdown ? (
                <div className="space-y-4">
                  {Object.entries(stats.status_breakdown).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-3 ${getStatusBgColor(status)}`}></div>
                        <span className={`capitalize font-medium ${getStatusColor(status)}`}>
                          {status}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="text-graphite font-semibold">{count}</span>
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${getStatusBgColor(status)}`}
                            style={{ 
                              width: `${stats.total_applications ? (count / stats.total_applications) * 100 : 0}%` 
                            }}
                          ></div>
                        </div>
                        <span className="text-sm text-coolgray w-12 text-right">
                          {stats.total_applications ? ((count / stats.total_applications) * 100).toFixed(1) : 0}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-coolgray">No status breakdown available</p>
              )}
            </div>

            {/* Recent Activity */}
            {stats.recent_applications && stats.recent_applications.length > 0 && (
              <div className="card bg-white/95 p-4 sm:p-6">
                <h2 className="text-xl font-semibold text-graphite mb-6">Recent Applications</h2>
                
                <div className="space-y-4">
                  {stats.recent_applications.slice(0, 5).map((application) => (
                    <div key={application._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-medium text-graphite">{application.job_title}</h3>
                        <p className="text-sm text-coolgray">{application.company_name}</p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusBgColor(application.application_status)} ${getStatusColor(application.application_status)}`}>
                          {application.application_status}
                        </span>
                        <span className="text-sm text-coolgray">
                          {new Date(application.applied_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Skills Performance */}
            {stats.skills_performance && stats.skills_performance.length > 0 && (
              <div className="card bg-white/95 p-4 sm:p-6">
                <h2 className="text-xl font-semibold text-graphite mb-6">Skills Performance</h2>
                
                <div className="space-y-3">
                  {stats.skills_performance.slice(0, 10).map((skill, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-graphite font-medium">{skill.skill}</span>
                      <div className="flex items-center space-x-3">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full bg-mint"
                            style={{ width: `${skill.match_percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-coolgray w-12 text-right">
                          {skill.match_percentage}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Monthly Trends */}
            {stats.monthly_trends && stats.monthly_trends.length > 0 && (
              <div className="card bg-white/95 p-4 sm:p-6">
                <h2 className="text-xl font-semibold text-graphite mb-6">Monthly Application Trends</h2>
                
                <div className="space-y-4">
                  {stats.monthly_trends.slice(0, 6).map((trend) => (
                    <div key={trend.month} className="flex items-center justify-between">
                      <span className="text-graphite font-medium">{trend.month}</span>
                      <div className="flex items-center space-x-3">
                        <span className="text-sm text-coolgray">{trend.applications} applications</span>
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full bg-blue-500"
                            style={{ 
                              width: `${Math.max(10, (trend.applications / Math.max(...stats.monthly_trends.map(t => t.applications))) * 100)}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
