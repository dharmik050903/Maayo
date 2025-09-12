import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Logo from './Logo'
import Button from './Button'

export default function Header({ userType, onLogout, userData }) {
  const isAuthenticated = !!userData
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      // Change theme when scrolled down (when background becomes more opaque/white)
      setIsScrolled(scrollTop > 50)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header className={`w-full fixed top-0 left-0 z-50 backdrop-blur-md border-b transition-all duration-300 ${
      isScrolled 
        ? 'bg-white/95 border-white/30' 
        : 'bg-white/10 border-white/20'
    }`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between p-4">
        <Link 
          to={isAuthenticated ? `/${userType}-home` : "/"} 
          className="logo-link flex items-center space-x-2 hover:opacity-80 transition-opacity"
        >
          <Logo theme={isScrolled ? "dark" : "light"} />
        </Link>
        
        <nav className={`hidden md:flex gap-6 font-medium transition-colors duration-300 ${
          isScrolled ? 'text-graphite' : 'text-white/90'
        }`}>
          {isAuthenticated ? (
            // Authenticated user navigation
            <>
              <Link to={`/${userType}-home`} className={`hover:text-mint transition-colors px-3 py-1 rounded-md ${
                isScrolled ? 'bg-gray-100 text-graphite' : 'bg-white/10 text-graphite'
              }`}>
                Home
              </Link>
              {userType === 'freelancer' ? (
                <Link to="/find-work" className={`hover:text-mint transition-colors px-3 py-1 rounded-md ${
                  isScrolled ? 'bg-gray-100 text-graphite' : 'bg-white/10 text-graphite'
                }`}>
                  Find Work
                </Link>
              ) : (
                <>
                  <Link to="/project/create" className={`hover:text-mint transition-colors px-3 py-1 rounded-md ${
                    isScrolled ? 'bg-gray-100 text-graphite' : 'bg-white/10 text-graphite'
                  }`}>
                    Post a Project
                  </Link>
                  <Link to="/client/my-projects" className={`hover:text-mint transition-colors px-3 py-1 rounded-md ${
                    isScrolled ? 'bg-gray-100 text-graphite' : 'bg-white/10 text-graphite'
                  }`}>
                    My Projects
                  </Link>
                </>
              )}
              <Link className={`hover:text-mint transition-colors px-3 py-1 rounded-md ${
                isScrolled ? 'bg-gray-100 text-graphite' : 'bg-white/10 text-graphite'
              }`}>
                Messages
              </Link>
              <Link to={`/${userType}-dashboard`} className={`hover:text-mint transition-colors px-3 py-1 rounded-md ${
                isScrolled ? 'bg-gray-100 text-graphite' : 'bg-white/10 text-graphite'
              }`}>
                Profile
              </Link>
            </>
          ) : (
            // Guest user navigation
            <>
              <Link to="/browse" className={`hover:text-mint transition-colors px-3 py-1 rounded-md ${
                isScrolled ? 'bg-gray-100 text-graphite' : 'bg-white/10 text-graphite'
              }`}>
                Find Work
              </Link>
              <Link to="/project/create" className={`hover:text-mint transition-colors px-3 py-1 rounded-md ${
                isScrolled ? 'bg-gray-100 text-graphite' : 'bg-white/10 text-graphite'
              }`}>
                Post a Project
              </Link>
              <Link to="/about" className={`hover:text-mint transition-colors px-3 py-1 rounded-md ${
                isScrolled ? 'bg-gray-100 text-graphite' : 'bg-white/10 text-graphite'
              }`}>
                About
              </Link>
            </>
          )}
        </nav>
        
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <button 
              onClick={onLogout} 
              className="group relative px-4 py-2 bg-violet/10 border border-violet/30 text-violet rounded-lg hover:bg-violet/20 hover:border-violet/50 transition-all duration-200"
            >
              <div className="flex items-center gap-2">
                <svg 
                  className="w-4 h-4 transition-transform group-hover:rotate-12" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" 
                  />
                </svg>
                <span className={`font-medium transition-colors duration-300 ${
                  isScrolled ? 'text-graphite' : 'text-white'
                }`}>Logout</span>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-coral/20 to-mint/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
            </button>
          ) : (
            <>
              <Link to="/login">
                <Button variant="primary">Login</Button>
              </Link>
              <Link to="/signup">
                <Button variant="accent">Sign Up</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
