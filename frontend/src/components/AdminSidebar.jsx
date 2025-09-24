import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'

const AdminSidebar = ({ adminData, onLogout, isOpen, onClose }) => {
  const location = useLocation()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 768
      console.log('Screen size check - width:', window.innerWidth, 'isMobile:', mobile) // Debug log
      setIsMobile(mobile)
    }
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  // Handle escape key for mobile sidebar
  useEffect(() => {
    const handleEscapeKey = (e) => {
      if (e.key === 'Escape' && isOpen && isMobile && onClose) {
        console.log('Escape key pressed') // Debug log
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscapeKey)
    return () => document.removeEventListener('keydown', handleEscapeKey)
  }, [isOpen, isMobile, onClose])

  const navigation = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: '📊', permission: null },
    { name: 'Users', href: '/admin/users', icon: '👥', permission: 'users.view' },
    { name: 'Freelancers', href: '/admin/freelancers', icon: '💼', permission: 'freelancers.view' },
    { name: 'Projects', href: '/admin/projects', icon: '📋', permission: 'projects.view' },
    { name: 'Bids', href: '/admin/bids', icon: '🤝', permission: 'bids.view' },
    ...(adminData?.role === 'super_admin' ? [
      { name: 'Permission Requests', href: '/admin/permission-requests', icon: '🔐', permission: null },
      { name: 'Admins', href: '/admin/admins', icon: '⚙️', permission: null }
    ] : [])
  ]

  const hasPermission = (permission) => {
    if (!permission || adminData?.role === 'super_admin') return true
    const [resource, action] = permission.split('.')
    return adminData?.permissions?.[resource]?.[action] || false
  }

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && isMobile && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => {
            console.log('Overlay clicked - onClose:', typeof onClose) // Debug log
            onClose?.()
          }}
        />
      )}
      
      {/* Sidebar */}
      <div 
        className={`fixed inset-y-0 left-0 z-50 w-64 sm:w-72 md:w-64 bg-white shadow-xl border-r border-gray-300 transform transition-transform duration-300 ease-in-out md:relative ${
          isMobile 
            ? (isOpen ? 'translate-x-0' : '-translate-x-full')
            : 'translate-x-0'
        }`}
        style={{
          transform: isMobile 
            ? (isOpen ? 'translateX(0)' : 'translateX(-100%)')
            : 'translateX(0)'
        }}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between h-14 sm:h-16 bg-gradient-to-r from-indigo-700 to-purple-700 px-3 sm:px-4">
            <h1 className="text-white text-lg sm:text-xl font-bold drop-shadow-sm">Maayo Admin</h1>
            <button 
              onClick={() => {
                console.log('Cancel button clicked - onClose:', typeof onClose) // Debug log
                console.log('Current isMobile:', isMobile, 'isOpen:', isOpen) // Debug log
                onClose?.()
              }}
              type="button"
              className="md:hidden p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
              style={{ 
                minWidth: '44px', 
                minHeight: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                position: 'relative',
                zIndex: 1000
              }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 sm:px-4 py-2 sm:py-4 space-y-2 overflow-y-auto">
            {navigation.map((item) => (
              hasPermission(item.permission) && (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => isMobile && onClose && onClose()}
                  className={`flex items-center px-4 py-3 rounded-xl text-base font-bold transition-all duration-200 shadow-sm ${
                    location.pathname === item.href
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg border-2 border-indigo-500'
                      : 'bg-white text-gray-900 hover:bg-gradient-to-r hover:from-indigo-600 hover:to-purple-600 hover:text-white hover:shadow-lg border-2 border-gray-300 hover:border-indigo-500'
                  }`}
                  style={{
                    color: location.pathname === item.href ? '#ffffff' : '#1f2937'
                  }}
                >
                  <span className="mr-4 text-xl" style={{ opacity: 1 }}>{item.icon}</span>
                  <span className="font-bold text-base" style={{ 
                    color: location.pathname === item.href ? '#ffffff' : '#1f2937',
                    opacity: 1,
                    fontWeight: '700'
                  }}>{item.name}</span>
                </Link>
              )
            ))}
          </nav>

          {/* Admin Info & Actions */}
          <div className="px-2 sm:px-4 py-3 sm:py-4 border-t border-gray-300 mt-auto bg-gray-50">
            <div className="flex items-center mb-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-indigo-600 to-purple-700 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-bold shadow-sm">
                {adminData?.name?.charAt(0)?.toUpperCase()}
              </div>
              <div className="ml-2 sm:ml-3 flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">{adminData?.name}</p>
                <p className="text-xs text-gray-600 capitalize truncate font-medium">
                  {adminData?.role?.replace('_', ' ')}
                </p>
              </div>
            </div>
            
            <div className="space-y-1">
              <Link
                to="/admin/profile"
                onClick={() => isMobile && onClose && onClose()}
                className="block w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-left text-gray-800 hover:bg-indigo-100 hover:text-indigo-800 rounded-lg transition-all duration-200 border border-transparent hover:border-indigo-200 font-medium"
              >
                Profile Settings
              </Link>
              <button
                onClick={() => {
                  onLogout && onLogout()
                  isMobile && onClose && onClose()
                }}
                className="block w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-left text-red-700 hover:bg-red-100 hover:text-red-800 rounded-lg transition-all duration-200 border border-transparent hover:border-red-200 font-medium"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default AdminSidebar