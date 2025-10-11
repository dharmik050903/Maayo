// Environment Variables Test Component
import React, { useEffect } from 'react'

const EnvTest = () => {
  useEffect(() => {
    console.log('🔍 Environment Variables Test:')
    console.log('VITE_RAZORPAY_KEY_ID:', import.meta.env.VITE_RAZORPAY_KEY_ID)
    console.log('VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL)
    console.log('NODE_ENV:', import.meta.env.NODE_ENV)
    console.log('MODE:', import.meta.env.MODE)
    console.log('All env vars:', import.meta.env)
  }, [])

  return (
    <div style={{ padding: '20px', background: '#f0f0f0', margin: '20px' }}>
      <h3>Environment Variables Test</h3>
      <p><strong>VITE_RAZORPAY_KEY_ID:</strong> {import.meta.env.VITE_RAZORPAY_KEY_ID || 'Not loaded'}</p>
      <p><strong>VITE_API_BASE_URL:</strong> {import.meta.env.VITE_API_BASE_URL || 'Not loaded'}</p>
      <p><strong>NODE_ENV:</strong> {import.meta.env.NODE_ENV || 'Not loaded'}</p>
      <p><strong>MODE:</strong> {import.meta.env.MODE || 'Not loaded'}</p>
    </div>
  )
}

export default EnvTest
