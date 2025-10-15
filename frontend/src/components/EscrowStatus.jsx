import React, { useState, useEffect } from 'react'
import { escrowService } from '../services/escrowService'

const EscrowStatus = ({ projectId }) => {
  const [escrowData, setEscrowData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [releasingPayment, setReleasingPayment] = useState(null)

  useEffect(() => {
    if (projectId) {
      fetchEscrowStatus()
    }
  }, [projectId])

  const fetchEscrowStatus = async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await escrowService.getEscrowStatus(projectId)
      
      if (result.status) {
        setEscrowData(result.data)
      }
    } catch (error) {
      console.error('Error fetching escrow status:', error)
      setError(error.message || 'Failed to fetch escrow status')
    } finally {
      setLoading(false)
    }
  }

  const releaseMilestonePayment = async (milestoneIndex) => {
    if (!confirm('Are you sure you want to release this milestone payment? This action cannot be undone.')) {
      return
    }

    try {
      setReleasingPayment(milestoneIndex)
      const result = await escrowService.releaseMilestonePayment(projectId, milestoneIndex)
      
      if (result.status) {
        alert('Milestone payment released successfully!')
        fetchEscrowStatus() // Refresh data
      }
    } catch (error) {
      console.error('Error releasing milestone payment:', error)
      alert(error.message || 'Failed to release milestone payment')
    } finally {
      setReleasingPayment(null)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
      case 'paid':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'unpaid':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (isCompleted, paymentReleased) => {
    if (isCompleted === 1 && paymentReleased === 1) {
      return 'Payment Released Successfully'
    } else if (isCompleted === 1 && paymentReleased === 0) {
      return 'Ready for Payment'
    } else {
      return 'Pending'
    }
  }

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <span className="ml-2">Loading escrow status...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Escrow Status</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchEscrowStatus}
            className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!escrowData) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="text-center">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 6h8M7 10h8M9 14h5c1.5 0 2.5-1 2.5-2.5S15.5 9 14 9h-2" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Escrow Data</h3>
          <p className="text-gray-600">No escrow payment has been created for this project yet.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Escrow Status</h3>
        <p className="text-gray-600">Monitor your project's escrow payment and milestone progress</p>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 6h8M7 10h8M9 14h5c1.5 0 2.5-1 2.5-2.5S15.5 9 14 9h-2" />
              </svg>
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-purple-800">Escrow Amount</h4>
              <p className="text-2xl font-bold text-purple-900">₹{escrowData.escrow_amount?.toLocaleString() || '0'}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-green-800">Completed Milestones</h4>
              <p className="text-2xl font-bold text-green-900">
                {escrowData.completed_milestones || 0}/{escrowData.total_milestones || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-blue-800">Released Payments</h4>
              <p className="text-2xl font-bold text-blue-900">₹{escrowData.released_payments?.toLocaleString() || '0'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Project Progress</span>
          <span className="text-sm text-gray-500">
            {escrowData.completed_milestones || 0} of {escrowData.total_milestones || 0} milestones
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-purple-600 h-2 rounded-full transition-all duration-300"
            style={{ 
              width: `${escrowData.total_milestones > 0 ? 
                ((escrowData.completed_milestones || 0) / escrowData.total_milestones) * 100 : 0}%` 
            }}
          ></div>
        </div>
      </div>

      {/* Milestones List */}
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-900">Milestones</h4>
        
        {escrowData.milestones && escrowData.milestones.length > 0 ? (
          escrowData.milestones.map((milestone, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h5 className="font-medium text-gray-900">{milestone.title}</h5>
                    <span className={`px-2 py-1 rounded-full text-sm font-medium ${getStatusColor(
                      milestone.is_completed === 1 ? 'completed' : 'pending'
                    )}`}>
                      {milestone.is_completed === 1 ? 'Completed' : 'Pending'}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-sm font-medium ${getStatusColor(
                      getStatusText(milestone.is_completed, milestone.payment_released)
                    )}`}>
                      {getStatusText(milestone.is_completed, milestone.payment_released)}
                    </span>
                  </div>
                  
                  {milestone.description && (
                    <p className="text-gray-600 text-sm mb-2">{milestone.description}</p>
                  )}
                  
                  <div className="flex gap-4 text-sm text-gray-500">
                    <span className="text-purple-600 font-medium">₹{milestone.amount?.toLocaleString()}</span>
                    {milestone.due_date && (
                      <span>Due: {new Date(milestone.due_date).toLocaleDateString()}</span>
                    )}
                    {milestone.completion_notes && (
                      <span>Notes: {milestone.completion_notes}</span>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col gap-2 ml-4">
                  {milestone.is_completed === 1 && milestone.payment_released === 0 && (
                    <button
                      onClick={() => releaseMilestonePayment(index)}
                      disabled={releasingPayment === index}
                      className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      {releasingPayment === index ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                          Releasing...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 6h8M7 10h8M9 14h5c1.5 0 2.5-1 2.5-2.5S15.5 9 14 9h-2" />
                          </svg>
                          Release Payment
                        </>
                      )}
                    </button>
                  )}
                  
                  {milestone.payment_released === 1 && (
                    <div className="flex items-center gap-1 text-green-600 text-sm">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Payment Released
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Milestones</h3>
            <p className="text-gray-600">No milestones have been created for this project yet.</p>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Escrow Payment Information</h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li>Funds are held securely in escrow until milestones are completed</li>
                <li>You can release payments manually after milestone completion</li>
                <li>Payment percentages are automatically calculated based on milestone count</li>
                <li>All payments are processed through Razorpay for security</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EscrowStatus

