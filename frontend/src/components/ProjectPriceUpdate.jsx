import React, { useState } from 'react'
import { escrowService } from '../services/escrowService'

const ProjectPriceUpdate = ({ projectId, currentAmount, onSuccess }) => {
  const [finalAmount, setFinalAmount] = useState(currentAmount || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleUpdatePrice = async () => {
    if (!finalAmount || finalAmount <= 0) {
      setError('Please enter a valid amount')
      return
    }

    setLoading(true)
    setError('')
    
    try {
      const result = await escrowService.updateProjectPrice(projectId, finalAmount)
      
      if (result.status) {
        alert('Project price updated successfully!')
        onSuccess?.(result.data)
        setFinalAmount('')
      }
    } catch (error) {
      console.error('Error updating project price:', error)
      setError(error.message || 'Failed to update project price')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 px-8 py-6 border-b border-gray-100">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Update Project Price</h3>
        <p className="text-gray-600 leading-relaxed">
          Update the final project amount after bid acceptance. This amount will be used for escrow payments and milestone releases.
        </p>
      </div>

      {/* Main Content */}
      <div className="p-8 space-y-8">
        {/* Current Amount Display */}
        {currentAmount && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-blue-200 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 6h8M7 10h8M9 14h5c1.5 0 2.5-1 2.5-2.5S15.5 9 14 9h-2" />
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-semibold text-blue-900 mb-1">Current Amount</h4>
                <p className="text-blue-700 text-lg">
                  Current project amount: <span className="font-bold text-xl">₹{currentAmount.toLocaleString()}</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Input Section */}
        <div className="space-y-4">
          <div>
            <label className="block text-lg font-semibold text-gray-900 mb-3">
              Final Project Amount (₹)
            </label>
            <div className="relative">
              <input
                type="number"
                value={finalAmount}
                onChange={(e) => {
                  setFinalAmount(e.target.value)
                  setError('')
                }}
                className={`w-full px-6 py-4 text-lg border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-100 text-gray-900 transition-all duration-200 ${
                  error ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white hover:border-purple-300'
                }`}
                placeholder="Enter final project amount"
                min="1"
                step="0.01"
                disabled={loading}
              />
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 6h8M7 10h8M9 14h5c1.5 0 2.5-1 2.5-2.5S15.5 9 14 9h-2" />
                </svg>
              </div>
            </div>
            
            {error && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm font-medium">{error}</p>
              </div>
            )}
            
            <p className="text-gray-500 text-sm mt-3 leading-relaxed">
              This amount will be used for escrow payments and milestone releases.
            </p>
          </div>
        </div>

        {/* Important Information */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-200">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-r from-amber-100 to-orange-100 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-semibold text-amber-900 mb-3">Important Information</h4>
              <div className="space-y-2">
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-amber-800 text-sm">This amount will be used for creating escrow payments</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-amber-800 text-sm">Milestone amounts will be calculated based on this total</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-amber-800 text-sm">Make sure the amount is agreed upon by both parties</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-amber-800 text-sm">This action can only be performed after bid acceptance</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4">
          <button
            onClick={handleUpdatePrice}
            disabled={loading || !finalAmount}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 px-6 rounded-xl hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Updating...
              </>
            ) : (
              <>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Update Project Price
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProjectPriceUpdate

