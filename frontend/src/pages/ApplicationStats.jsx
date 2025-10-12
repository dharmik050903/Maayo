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
                variant="accent"
                onClick={() => navigate('/freelancer/applications')}
                className="bg-gradient-to-r from-violet to-purple hover:from-violet/90 hover:to-purple/90 text-white border-0 w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 font-semibold rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 text-sm sm:text-base"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                View Applications
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/freelancer/jobs')}
                className="border-2 border-mint text-mint hover:bg-mint hover:text-white w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 font-semibold rounded-xl sm:rounded-2xl transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg text-sm sm:text-base"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
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
            {/* Overview Cards - Mobile Optimized */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              <div className="group relative overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                <div className="absolute top-0 right-0 w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-200 to-blue-300 rounded-full -translate-y-8 translate-x-8 sm:-translate-y-10 sm:translate-x-10 opacity-20"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="text-right">
                      <p className="text-xs sm:text-sm font-medium text-blue-600">Total Applications</p>
                      <p className="text-2xl sm:text-3xl font-bold text-blue-800">{stats.total_applications || 0}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="group relative overflow-hidden bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-green-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                <div className="absolute top-0 right-0 w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-green-200 to-green-300 rounded-full -translate-y-8 translate-x-8 sm:-translate-y-10 sm:translate-x-10 opacity-20"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="text-right">
                      <p className="text-xs sm:text-sm font-medium text-green-600">Selected</p>
                      <p className="text-2xl sm:text-3xl font-bold text-green-800">{stats.status_breakdown?.selected || 0}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="group relative overflow-hidden bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                <div className="absolute top-0 right-0 w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-purple-200 to-purple-300 rounded-full -translate-y-8 translate-x-8 sm:-translate-y-10 sm:translate-x-10 opacity-20"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="text-right">
                      <p className="text-xs sm:text-sm font-medium text-purple-600">Success Rate</p>
                      <p className="text-2xl sm:text-3xl font-bold text-purple-800">{calculateSuccessRate()}%</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="group relative overflow-hidden bg-gradient-to-br from-yellow-50 to-yellow-100 hover:from-yellow-100 hover:to-yellow-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-yellow-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                <div className="absolute top-0 right-0 w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-yellow-200 to-yellow-300 rounded-full -translate-y-8 translate-x-8 sm:-translate-y-10 sm:translate-x-10 opacity-20"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </div>
                    <div className="text-right">
                      <p className="text-xs sm:text-sm font-medium text-yellow-600">Response Rate</p>
                      <p className="text-2xl sm:text-3xl font-bold text-yellow-800">{calculateResponseRate()}%</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Status Breakdown - Mobile Optimized */}
            <div className="group relative overflow-hidden bg-gradient-to-br from-white to-gray-50 rounded-2xl sm:rounded-3xl p-4 sm:p-8 border border-gray-200 shadow-xl hover:shadow-2xl transition-all duration-300">
              <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-violet/10 to-purple/10 rounded-full -translate-y-12 translate-x-12 sm:-translate-y-16 sm:translate-x-16"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-8">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-violet to-purple rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h2 className="text-lg sm:text-2xl font-bold text-graphite">Application Status Breakdown</h2>
                </div>
                
                {stats.status_breakdown ? (
                  <div className="space-y-3 sm:space-y-6">
                    {Object.entries(stats.status_breakdown).map(([status, count]) => (
                      <div key={status} className="group/item relative overflow-hidden bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 rounded-xl sm:rounded-2xl p-3 sm:p-6 border border-gray-200 transition-all duration-300 hover:shadow-lg">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
                          <div className="flex items-center gap-2 sm:gap-4">
                            <div className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full ${getStatusBgColor(status)}`}></div>
                            <span className={`capitalize font-semibold text-sm sm:text-lg ${getStatusColor(status)}`}>
                              {status}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 sm:gap-6">
                            <span className="text-graphite font-bold text-lg sm:text-xl">{count}</span>
                            <div className="w-24 sm:w-40 bg-gray-200 rounded-full h-2 sm:h-3 overflow-hidden">
                              <div 
                                className={`h-2 sm:h-3 rounded-full transition-all duration-500 ${getStatusBgColor(status)}`}
                                style={{ 
                                  width: `${stats.total_applications ? (count / stats.total_applications) * 100 : 0}%` 
                                }}
                              ></div>
                            </div>
                            <span className="text-xs sm:text-sm font-semibold text-coolgray w-12 sm:w-16 text-right">
                              {stats.total_applications ? ((count / stats.total_applications) * 100).toFixed(1) : 0}%
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-coolgray text-center py-6 sm:py-8">No status breakdown available</p>
                )}
              </div>
            </div>

            {/* Recent Activity - Mobile Optimized */}
            {stats.recent_applications && stats.recent_applications.length > 0 && (
              <div className="group relative overflow-hidden bg-gradient-to-br from-white to-gray-50 rounded-2xl sm:rounded-3xl p-4 sm:p-8 border border-gray-200 shadow-xl hover:shadow-2xl transition-all duration-300">
                <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-mint/10 to-green/10 rounded-full -translate-y-12 translate-x-12 sm:-translate-y-16 sm:translate-x-16"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-8">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-mint to-green rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h2 className="text-lg sm:text-2xl font-bold text-graphite">Recent Applications</h2>
                  </div>
                  
                  <div className="space-y-3 sm:space-y-4">
                    {stats.recent_applications.slice(0, 5).map((application) => (
                      <div key={application._id} className="group/item relative overflow-hidden bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 rounded-xl sm:rounded-2xl p-3 sm:p-6 border border-gray-200 transition-all duration-300 hover:shadow-lg">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
                          <div className="flex-1">
                            <h3 className="font-bold text-base sm:text-lg text-graphite mb-1">{application.job_title}</h3>
                            <p className="text-xs sm:text-sm text-coolgray">{application.company_name}</p>
                          </div>
                          <div className="flex items-center gap-2 sm:gap-4">
                            <span className={`px-2 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm font-semibold rounded-lg sm:rounded-xl ${getStatusBgColor(application.application_status)} ${getStatusColor(application.application_status)}`}>
                              {application.application_status}
                            </span>
                            <span className="text-xs sm:text-sm font-medium text-coolgray">
                              {new Date(application.applied_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Skills Performance - Mobile Optimized */}
            {stats.skills_performance && stats.skills_performance.length > 0 && (
              <div className="group relative overflow-hidden bg-gradient-to-br from-white to-gray-50 rounded-2xl sm:rounded-3xl p-4 sm:p-8 border border-gray-200 shadow-xl hover:shadow-2xl transition-all duration-300">
                <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-coral/10 to-orange/10 rounded-full -translate-y-12 translate-x-12 sm:-translate-y-16 sm:translate-x-16"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-8">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-coral to-orange rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <h2 className="text-lg sm:text-2xl font-bold text-graphite">Skills Performance</h2>
                  </div>
                  
                  <div className="space-y-3 sm:space-y-4">
                    {stats.skills_performance.slice(0, 10).map((skill, index) => (
                      <div key={index} className="group/item relative overflow-hidden bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 rounded-xl sm:rounded-2xl p-3 sm:p-6 border border-gray-200 transition-all duration-300 hover:shadow-lg">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
                          <span className="text-graphite font-bold text-sm sm:text-lg">{skill.skill}</span>
                          <div className="flex items-center gap-2 sm:gap-4">
                            <div className="w-32 sm:w-48 bg-gray-200 rounded-full h-3 sm:h-4 overflow-hidden">
                              <div 
                                className="h-3 sm:h-4 rounded-full bg-gradient-to-r from-coral to-orange transition-all duration-500"
                                style={{ width: `${skill.match_percentage}%` }}
                              ></div>
                            </div>
                            <span className="text-xs sm:text-sm font-bold text-coolgray w-12 sm:w-16 text-right">
                              {skill.match_percentage}%
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Monthly Trends - Mobile Optimized */}
            {stats.monthly_trends && stats.monthly_trends.length > 0 && (
              <div className="group relative overflow-hidden bg-gradient-to-br from-white to-gray-50 rounded-2xl sm:rounded-3xl p-4 sm:p-8 border border-gray-200 shadow-xl hover:shadow-2xl transition-all duration-300">
                <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-blue/10 to-indigo/10 rounded-full -translate-y-12 translate-x-12 sm:-translate-y-16 sm:translate-x-16"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-8">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue to-indigo rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <h2 className="text-lg sm:text-2xl font-bold text-graphite">Monthly Application Trends</h2>
                  </div>
                  
                  <div className="space-y-3 sm:space-y-4">
                    {stats.monthly_trends.slice(0, 6).map((trend) => (
                      <div key={trend.month} className="group/item relative overflow-hidden bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 rounded-xl sm:rounded-2xl p-3 sm:p-6 border border-gray-200 transition-all duration-300 hover:shadow-lg">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
                          <span className="text-graphite font-bold text-sm sm:text-lg">{trend.month}</span>
                          <div className="flex items-center gap-2 sm:gap-4">
                            <span className="text-xs sm:text-sm font-semibold text-coolgray">{trend.applications} applications</span>
                            <div className="w-32 sm:w-48 bg-gray-200 rounded-full h-3 sm:h-4 overflow-hidden">
                              <div 
                                className="h-3 sm:h-4 rounded-full bg-gradient-to-r from-blue to-indigo transition-all duration-500"
                                style={{ 
                                  width: `${Math.max(10, (trend.applications / Math.max(...stats.monthly_trends.map(t => t.applications))) * 100)}%` 
                                }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
