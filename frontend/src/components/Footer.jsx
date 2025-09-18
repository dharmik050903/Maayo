import React from 'react'
import { Link } from 'react-router-dom'

const Footer = ({ variant = 'default' }) => {
  const isDark = variant === 'dark'
  
  return (
    <footer className={`py-6 border-t ${isDark ? 'border-white/20' : 'border-gray-200'}`}>
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center px-6 gap-4">
        <p className={`text-sm ${isDark ? 'text-white/85' : 'text-coolgray'}`}>
          © {new Date().getFullYear()} Maayo. All rights reserved.
        </p>
        <div className={`flex flex-wrap gap-4 text-sm ${isDark ? 'text-white/85' : 'text-coolgray'}`}>
          <Link to="/about" className="hover:text-mint transition-colors">About</Link>
          <Link to="/privacy" className="hover:text-mint transition-colors">Privacy</Link>
          <Link to="/terms" className="hover:text-mint transition-colors">Terms</Link>
          <Link to="/cancellation-refunds" className="hover:text-mint transition-colors">Refunds</Link>
          <Link to="/shipping" className="hover:text-mint transition-colors">Shipping</Link>
          <Link to="/contact" className="hover:text-mint transition-colors">Contact</Link>
        </div>
      </div>
    </footer>
  )
}

export default Footer
