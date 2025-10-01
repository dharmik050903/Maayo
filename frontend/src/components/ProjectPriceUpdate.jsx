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
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Update Project Price</h3>
        <p className="text-gray-600">
          Update the final project amount after bid acceptance. This amount will be used for escrow payments and milestone releases.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Final Project Amount (₹)
          </label>
          <input
            type="number"
            value={finalAmount}
            onChange={(e) => {
              setFinalAmount(e.target.value)
              setError('')
            }}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
              error ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter final project amount"
            min="1"
            step="0.01"
            disabled={loading}
          />
          {error && (
            <p className="text-red-500 text-sm mt-1">{error}</p>
          )}
          <p className="text-sm text-gray-500 mt-1">
            This amount will be used for escrow payments and milestone releases.
          </p>
        </div>

        {currentAmount && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Current Amount</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Current project amount: <span className="font-semibold">₹{currentAmount.toLocaleString()}</span>
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Important Information</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>This amount will be used for creating escrow payments</li>
                  <li>Milestone amounts will be calculated based on this total</li>
                  <li>Make sure the amount is agreed upon by both parties</li>
                  <li>This action can only be performed after bid acceptance</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleUpdatePrice}
          disabled={loading || !finalAmount}
          className="w-full bg-purple-600 text-white py-3 px-4 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Updating...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Update Project Price
            </>
          )}
        </button>
      </div>
    </div>
  )
}

export default ProjectPriceUpdate

