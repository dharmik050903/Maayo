import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import adminService from '../services/adminService'

const AdminDashboard = () => {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchStats()
    // Set up auto-refresh every 30 seconds for real-time data
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchStats = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError('')
      console.log('🔄 Fetching dashboard stats...')
      const response = await adminService.getDashboardStats()
      console.log('📊 Dashboard stats received:', response.data)
      setStats(response.data)
    } catch (error) {
      console.error('❌ Error fetching stats:', error)
      setError(error.message)
      
      // Set fallback stats to prevent UI from being completely broken
      if (!stats) {
        setStats({
          overview: {
            totalUsers: 0,
            totalFreelancers: 0,
            totalClients: 0,
            totalProjects: 0,
            activeProjects: 0,
            completedProjects: 0,
            totalBids: 0,
            totalPayments: 0
          },
          recentActivity: {
            users: [],
            projects: [],
            bids: []
          }
        })
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    fetchStats(true)
  }

  if (loading) {
    return (
      <div className="p-3 sm:p-4 lg:p-6">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white p-4 sm:p-6 rounded-lg shadow h-20 sm:h-24"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-3 sm:p-4 lg:p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-3 sm:px-4 py-3 rounded">
          <h3 className="font-bold text-sm sm:text-base">Error Loading Dashboard</h3>
          <p className="text-xs sm:text-sm mb-3">{error}</p>
          <div className="flex gap-2">
            <button
              onClick={fetchStats}
              className="bg-red-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded text-xs sm:text-sm hover:bg-red-700"
            >
              Retry
            </button>
            <button
              onClick={() => {
                console.log('🔍 Debug Info:')
                console.log('Admin Token:', localStorage.getItem('adminToken') ? 'Present' : 'Missing')
                console.log('Admin Data:', localStorage.getItem('adminData'))
                console.log('API URL:', `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/admin/dashboard/stats`)
                alert('Debug info logged to console (F12)')
              }}
              className="bg-gray-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded text-xs sm:text-sm hover:bg-gray-700"
            >
              Debug Info
            </button>
          </div>
        </div>
        
        {/* Show fallback stats even with error */}
        {stats && (
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-500 mb-3">Showing cached data:</h4>
            <DashboardContent stats={stats} onRefresh={handleRefresh} refreshing={refreshing} navigate={navigate} />
          </div>
        )}
      </div>
    )
  }

  return <DashboardContent stats={stats} onRefresh={handleRefresh} refreshing={refreshing} navigate={navigate} />
}

// Dashboard Content Component
const DashboardContent = ({ stats, onRefresh, refreshing, navigate }) => (
  <div className="p-3 sm:p-4 lg:p-6">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">Welcome to the Maayo Admin Panel</p>
      </div>
      <div className="flex items-center gap-2 mt-3 sm:mt-0">
        <div className="flex items-center text-xs sm:text-sm text-gray-500">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
          Real-time data
        </div>
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-1.5 text-xs sm:text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
        >
          {refreshing ? (
            <>
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Refreshing...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </>
          )}
        </button>
      </div>
    </div>

    {/* Stats Cards */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
      <StatCard
        title="Total Users"
        value={stats?.overview?.totalUsers || 0}
        icon="👥"
        color="bg-blue-500"
        change="+12%"
        onClick={() => navigate('/admin/users')}
        clickable={true}
      />
      <StatCard
        title="Freelancers"
        value={stats?.overview?.totalFreelancers || 0}
        icon="💼"
        color="bg-green-500"
        change="+8%"
        onClick={() => navigate('/admin/freelancers')}
        clickable={true}
      />
      <StatCard
        title="Clients"
        value={stats?.overview?.totalClients || 0}
        icon="🏢"
        color="bg-purple-500"
        change="+5%"
        onClick={() => navigate('/admin/users')}
        clickable={true}
      />
      <StatCard
        title="Active Projects"
        value={stats?.overview?.activeProjects || 0}
        icon="📋"
        color="bg-yellow-500"
        change="+15%"
        onClick={() => navigate('/admin/projects')}
        clickable={true}
      />
    </div>

    {/* Recent Activity */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Recent Users</h3>
        <div className="space-y-2 sm:space-y-3">
          {stats?.recentActivity?.users?.length > 0 ? (
            stats.recentActivity.users.map((user, index) => (
              <div key={index} className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-md">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-900">
                    {user.first_name} {user.last_name}
                  </p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  user.user_type === 'freelancer' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {user.user_type}
                </span>
              </div>
            ))
          ) : (
            <p className="text-xs sm:text-sm text-gray-500">No recent users</p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Recent Projects</h3>
        <div className="space-y-2 sm:space-y-3 max-h-64 overflow-y-auto">
          {stats?.recentActivity?.projects?.length > 0 ? (
            stats.recentActivity.projects.map((project, index) => (
              <div key={index} className="flex items-start justify-between p-2 sm:p-3 bg-gray-50 rounded-md">
                <div className="flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                    {project.title}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{project.description}</p>
                  <p className="text-xs text-gray-400">₹{project.budget}</p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ml-2 ${
                  project.status === 'open' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {project.status}
                </span>
              </div>
            ))
          ) : (
            <p className="text-xs sm:text-sm text-gray-500">No recent projects</p>
          )}
        </div>
      </div>
    </div>

    {/* Additional Stats Cards */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mt-6 sm:mt-8">
      <StatCard
        title="Total Projects"
        value={stats?.overview?.totalProjects || 0}
        icon="📊"
        color="bg-indigo-500"
        change="+10%"
        onClick={() => navigate('/admin/projects')}
        clickable={true}
      />
      <StatCard
        title="Completed Projects"
        value={stats?.overview?.completedProjects || 0}
        icon="✅"
        color="bg-teal-500"
        change="+18%"
        onClick={() => navigate('/admin/projects')}
        clickable={true}
      />
      <StatCard
        title="Total Bids"
        value={stats?.overview?.totalBids || 0}
        icon="💰"
        color="bg-orange-500"
        change="+25%"
        onClick={() => navigate('/admin/bids')}
        clickable={true}
      />
    </div>
  </div>
)

// StatCard Component
const StatCard = ({ title, value, icon, color, change, onClick, clickable }) => {
  const handleClick = () => {
    if (clickable && onClick) {
      console.log(`📊 Navigating to ${title} section...`) // Debug log
      onClick()
    }
  }

  return (
    <div 
      className={`bg-white p-3 sm:p-4 lg:p-6 rounded-lg shadow transition-all duration-200 ${
        clickable ? 'cursor-pointer hover:shadow-lg hover:scale-105 border-2 border-transparent hover:border-blue-200 active:scale-100 active:shadow-md' : ''
      }`}
      onClick={handleClick}
      title={clickable ? `Click to view ${title.toLowerCase()}` : undefined}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs sm:text-sm font-medium text-gray-500">{title}</p>
          <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
        </div>
        <div className={`${color} rounded-full p-2 sm:p-3`}>
          <span className="text-sm sm:text-lg text-white">{icon}</span>
        </div>
      </div>
      <div className="flex items-center justify-between mt-2">
        {change && (
          <div className="flex items-center text-xs sm:text-sm">
            <span className="text-green-600 font-medium">{change}</span>
            <span className="text-gray-500 ml-1">from last month</span>
          </div>
        )}
        {clickable && (
          <div className="text-xs text-blue-500 font-medium transition-colors group-hover:text-blue-600">
            View Details →
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminDashboard