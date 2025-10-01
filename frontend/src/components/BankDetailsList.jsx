import React, { useState, useEffect } from 'react'
import { escrowService } from '../services/escrowService'
import BankDetailsForm from './BankDetailsForm'

const BankDetailsList = () => {
  const [bankDetails, setBankDetails] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingBank, setEditingBank] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchBankDetails()
  }, [])

  const fetchBankDetails = async () => {
    try {
      setLoading(true)
      const result = await escrowService.getBankDetailsList()
      if (result.status) {
        setBankDetails(result.data)
        setError(null)
      }
    } catch (error) {
      console.error('Error fetching bank details:', error)
      setError(error.message || 'Failed to fetch bank details')
    } finally {
      setLoading(false)
    }
  }

  const setPrimary = async (bankDetailsId) => {
    try {
      const result = await escrowService.setPrimaryBankDetails(bankDetailsId)
      if (result.status) {
        alert('Primary bank account set successfully!')
        fetchBankDetails() // Refresh list
      }
    } catch (error) {
      console.error('Error setting primary bank details:', error)
      alert(error.message || 'Failed to set primary bank account')
    }
  }

  const deleteBankDetails = async (bankDetailsId) => {
    if (!confirm('Are you sure you want to delete this bank account? This action cannot be undone.')) {
      return
    }

    try {
      const result = await escrowService.deleteBankDetails(bankDetailsId)
      if (result.status) {
        alert('Bank account deleted successfully!')
        fetchBankDetails() // Refresh list
      }
    } catch (error) {
      console.error('Error deleting bank details:', error)
      alert(error.message || 'Failed to delete bank account')
    }
  }

  const handleFormSuccess = () => {
    setShowAddForm(false)
    setEditingBank(null)
    fetchBankDetails() // Refresh list
  }

  const handleEdit = (bank) => {
    setEditingBank(bank)
    setShowAddForm(false)
  }

  const handleCancelEdit = () => {
    setEditingBank(null)
  }

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <span className="ml-2">Loading bank details...</span>
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
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Bank Details</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchBankDetails}
            className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Bank Details</h2>
            <p className="text-gray-600 mt-1">Manage your bank accounts for payments</p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Bank Account
          </button>
        </div>
      </div>

      {/* Add/Edit Form */}
      {(showAddForm || editingBank) && (
        <BankDetailsForm
          editData={editingBank}
          onSuccess={handleFormSuccess}
          onCancel={editingBank ? handleCancelEdit : () => setShowAddForm(false)}
        />
      )}

      {/* Bank Details List */}
      <div className="bg-white rounded-lg shadow-md">
        {bankDetails.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Bank Accounts</h3>
            <p className="text-gray-600 mb-4">Add your first bank account to start receiving payments</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
            >
              Add Bank Account
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {bankDetails.map((bank) => (
              <div key={bank._id} className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {bank.account_holder_name}
                      </h3>
                      {bank.is_primary && (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm font-medium">
                          Primary
                        </span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Bank:</span> {bank.bank_name}
                      </div>
                      <div>
                        <span className="font-medium">Branch:</span> {bank.branch_name}
                      </div>
                      <div>
                        <span className="font-medium">Account:</span> ****{bank.account_number.slice(-4)}
                      </div>
                      <div>
                        <span className="font-medium">IFSC:</span> {bank.ifsc_code}
                      </div>
                      <div>
                        <span className="font-medium">Type:</span> {bank.account_type.charAt(0).toUpperCase() + bank.account_type.slice(1)}
                      </div>
                      {bank.upi_id && (
                        <div>
                          <span className="font-medium">UPI ID:</span> {bank.upi_id}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2 ml-4">
                    {!bank.is_primary && (
                      <button
                        onClick={() => setPrimary(bank._id)}
                        className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 whitespace-nowrap"
                      >
                        Set Primary
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleEdit(bank)}
                      className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600 whitespace-nowrap"
                    >
                      Edit
                    </button>
                    
                    <button
                      onClick={() => deleteBankDetails(bank._id)}
                      className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 whitespace-nowrap"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Box */}
      {bankDetails.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Bank Account Information</h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>Your primary bank account will be used for all payments</li>
                  <li>You can have multiple bank accounts but only one can be primary</li>
                  <li>All milestone payments will be transferred to your primary account</li>
                  <li>Make sure your bank details are accurate to avoid payment delays</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BankDetailsList

