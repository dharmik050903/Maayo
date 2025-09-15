import React from 'react'

const SuccessModal = ({ isOpen, onClose, title, message, type = 'success' }) => {
  if (!isOpen) return null

  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )
      case 'error':
        return (
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        )
      case 'info':
        return (
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )
      default:
        return null
    }
  }

  const getColorClasses = () => {
    switch (type) {
      case 'success':
        return 'border-green-200 bg-green-50'
      case 'error':
        return 'border-red-200 bg-red-50'
      case 'info':
        return 'border-blue-200 bg-blue-50'
      default:
        return 'border-gray-200 bg-gray-50'
    }
  }

  return (
    <div className="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
      <div className={`bg-white rounded-2xl p-8 max-w-md w-full border-2 ${getColorClasses()} shadow-2xl transform transition-all duration-300 scale-100`}>
        {getIcon()}
        
        <div className="text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            {title}
          </h3>
          <p className="text-gray-600 mb-8 leading-relaxed">
            {message}
          </p>
          
          <div className="flex gap-4 justify-center">
            <button
              onClick={onClose}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                type === 'success'
                  ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg hover:shadow-xl'
                  : type === 'error'
                  ? 'bg-red-600 text-white hover:bg-red-700 shadow-lg hover:shadow-xl'
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl'
              }`}
            >
              {type === 'success' ? 'Great!' : 'Got it'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SuccessModal