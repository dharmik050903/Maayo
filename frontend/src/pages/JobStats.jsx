import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import Header from '../components/Header'
import { jobService } from '../services/jobService'
import { useComprehensiveTranslation } from '../hooks/useComprehensiveTranslation'
import { isAuthenticated, getCurrentUser, clearAuth } from '../utils/api'

export default function JobStats() {
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
      console.log('🔍 Fetching job stats...')
      const response = await jobService.getJobStats()
      console.log('📊 Job stats response:', response)
      
      if (response.status) {
        console.log('✅ Stats data:', response.data)
        setStats(response.data)
      } else {
        console.log('❌ Stats error:', response.message)
        setMessage({ type: 'error', text: response.message || 'Failed to fetch statistics' })
      }
    } catch (error) {
      console.error('💥 Error fetching stats:', error)
      setMessage({ type: 'error', text: 'Failed to fetch statistics. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return 'text-gray-600'
      case 'active': return 'text-green-600'
      case 'paused': return 'text-yellow-600'
      case 'closed': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusBgColor = (status) => {
    switch (status) {
      case 'draft': return 'bg-gray-50'
      case 'active': return 'bg-green-50'
      case 'paused': return 'bg-yellow-50'
      case 'closed': return 'bg-red-50'
      default: return 'bg-gray-50'
    }
  }

  const calculateAverageApplications = () => {
    if (!stats || !stats.total_jobs) return 0
    return (stats.total_applications / stats.total_jobs).toFixed(1)
  }

  const calculateAverageViews = () => {
    if (!stats || !stats.total_jobs) return 0
    return (stats.total_views / stats.total_jobs).toFixed(1)
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString()
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
        userType="client" 
        onLogout={handleLogout} 
        userData={userData}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 md:px-6 pt-20 pb-8">
        {/* Header Section */}
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 md:gap-6">
            <div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight">
                Job <span className="text-mint">Statistics</span>
              </h1>
              <p className="text-base md:text-lg text-white/80 mt-2 md:mt-4">
                Track your job posting performance
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Button
                variant="secondary"
                onClick={() => navigate('/client/jobs')}
                className="border-2 border-white/30 text-white bg-white/10 hover:bg-white/20 hover:border-white/50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 px-6 py-3 font-semibold"
              >
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                  <span>Manage Jobs</span>
                </div>
              </Button>
              <Button
                variant="accent"
                onClick={() => navigate('/client/jobs/create')}
                className="bg-mint text-white hover:bg-mint/90 border-2 border-mint hover:border-mint/80 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 px-6 py-3 font-semibold"
              >
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>Post New Job</span>
                </div>
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
            <p className="text-coolgray mb-6">You haven't posted any jobs yet.</p>
            <Button
              onClick={() => navigate('/client/jobs/create')}
              className="bg-mint text-white hover:bg-mint/90 border-2 border-mint hover:border-mint/80 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 px-6 py-3 font-semibold"
            >
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Post Your First Job</span>
              </div>
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="card bg-white/95 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-coolgray">Total Jobs</p>
                    <p className="text-2xl font-semibold text-graphite">{stats.total_jobs || 0}</p>
                  </div>
                </div>
              </div>

              <div className="card bg-white/95 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

              <div className="card bg-white/95 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-coolgray">Total Views</p>
                    <p className="text-2xl font-semibold text-graphite">{stats.total_views || 0}</p>
                  </div>
                </div>
              </div>

              <div className="card bg-white/95 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-coolgray">Avg Applications</p>
                    <p className="text-2xl font-semibold text-graphite">{calculateAverageApplications()}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Job Status Breakdown */}
            <div className="card bg-white/95 p-6">
              <h2 className="text-xl font-semibold text-graphite mb-6">Job Status Breakdown</h2>
              
              {stats.job_status_breakdown ? (
                <div className="space-y-4">
                  {Object.entries(stats.job_status_breakdown).map(([status, count]) => (
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
                              width: `${stats.total_jobs ? (count / stats.total_jobs) * 100 : 0}%` 
                            }}
                          ></div>
                        </div>
                        <span className="text-sm text-coolgray w-12 text-right">
                          {stats.total_jobs ? ((count / stats.total_jobs) * 100).toFixed(1) : 0}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-coolgray">No status breakdown available</p>
              )}
            </div>

            {/* Top Performing Jobs */}
            {stats.top_performing_jobs && stats.top_performing_jobs.length > 0 && (
              <div className="card bg-white/95 p-6">
                <h2 className="text-xl font-semibold text-graphite mb-6">Top Performing Jobs</h2>
                
                <div className="space-y-4">
                  {stats.top_performing_jobs.slice(0, 5).map((job) => (
                    <div key={job._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-medium text-graphite">{job.job_title}</h3>
                        <p className="text-sm text-coolgray">{job.company_name}</p>
                      </div>
                      <div className="flex items-center space-x-6 text-sm text-coolgray">
                        <span>
                          <strong className="text-graphite">{job.analytics?.total_applications || 0}</strong> applications
                        </span>
                        <span>
                          <strong className="text-graphite">{job.analytics?.total_views || 0}</strong> views
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusBgColor(job.status)} ${getStatusColor(job.status)}`}>
                          {job.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Monthly Trends */}
            {stats.monthly_trends && stats.monthly_trends.length > 0 && (
              <div className="card bg-white/95 p-6">
                <h2 className="text-xl font-semibold text-graphite mb-6">Monthly Job Posting Trends</h2>
                
                <div className="space-y-4">
                  {stats.monthly_trends.slice(0, 6).map((trend) => (
                    <div key={trend.month} className="flex items-center justify-between">
                      <span className="text-graphite font-medium">{trend.month}</span>
                      <div className="flex items-center space-x-3">
                        <span className="text-sm text-coolgray">{trend.jobs} jobs posted</span>
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full bg-blue-500"
                            style={{ 
                              width: `${Math.max(10, (trend.jobs / Math.max(...stats.monthly_trends.map(t => t.jobs))) * 100)}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Application Status Summary */}
            {stats.application_status_summary && (
              <div className="card bg-white/95 p-6">
                <h2 className="text-xl font-semibold text-graphite mb-6">Application Status Summary</h2>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(stats.application_status_summary).map(([status, count]) => (
                    <div key={status} className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-graphite">{count}</p>
                      <p className="text-sm text-coolgray capitalize">{status}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Skills Demand */}
            {stats.skills_demand && stats.skills_demand.length > 0 && (
              <div className="card bg-white/95 p-6">
                <h2 className="text-xl font-semibold text-graphite mb-6">Most Requested Skills</h2>
                
                <div className="space-y-3">
                  {stats.skills_demand.slice(0, 10).map((skill, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-graphite font-medium">{skill.skill}</span>
                      <div className="flex items-center space-x-3">
                        <span className="text-sm text-coolgray">{skill.count} jobs</span>
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full bg-mint"
                            style={{ 
                              width: `${(skill.count / Math.max(...stats.skills_demand.map(s => s.count))) * 100}%` 
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
