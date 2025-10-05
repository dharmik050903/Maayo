import React, { useState } from 'react'
import { escrowService } from '../services/escrowService'

const BankDetailsForm = ({ onSuccess, onCancel, editData = null }) => {
  const [formData, setFormData] = useState({
    account_holder_name: editData?.account_holder_name || '',
    account_number: editData?.account_number || '',
    ifsc_code: editData?.ifsc_code || '',
    bank_name: editData?.bank_name || '',
    branch_name: editData?.branch_name || '',
    account_type: editData?.account_type || 'savings',
    upi_id: editData?.upi_id || ''
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.account_holder_name.trim()) {
      newErrors.account_holder_name = 'Account holder name is required'
    }
    
    if (!formData.account_number.trim()) {
      newErrors.account_number = 'Account number is required'
    } else if (!/^\d{9,18}$/.test(formData.account_number)) {
      newErrors.account_number = 'Account number must be 9-18 digits'
    }
    
    if (!formData.ifsc_code.trim()) {
      newErrors.ifsc_code = 'IFSC code is required'
    } else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(formData.ifsc_code.toUpperCase())) {
      newErrors.ifsc_code = 'Invalid IFSC code format'
    }
    
    if (!formData.bank_name.trim()) {
      newErrors.bank_name = 'Bank name is required'
    }
    
    if (!formData.branch_name.trim()) {
      newErrors.branch_name = 'Branch name is required'
    }
    
    if (formData.upi_id && !/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(formData.upi_id)) {
      newErrors.upi_id = 'Invalid UPI ID format'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    setLoading(true)
    try {
      let result
      if (editData) {
        result = await escrowService.updateBankDetails({
          bank_details_id: editData._id,
          ...formData
        })
      } else {
        result = await escrowService.addBankDetails(formData)
      }
      
      if (result.status) {
        onSuccess?.(result.data)
        // Reset form if not editing
        if (!editData) {
          setFormData({
            account_holder_name: '',
            account_number: '',
            ifsc_code: '',
            bank_name: '',
            branch_name: '',
            account_type: 'savings',
            upi_id: ''
          })
        }
      }
    } catch (error) {
      console.error('Error saving bank details:', error)
      alert(error.message || 'Failed to save bank details')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">
        {editData ? 'Update Bank Details' : 'Add Bank Details'}
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account Holder Name *
            </label>
            <input
              type="text"
              name="account_holder_name"
              value={formData.account_holder_name}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 ${
                errors.account_holder_name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter account holder name"
            />
            {errors.account_holder_name && (
              <p className="text-red-500 text-sm mt-1">{errors.account_holder_name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account Number *
            </label>
            <input
              type="text"
              name="account_number"
              value={formData.account_number}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 ${
                errors.account_number ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter account number"
              maxLength="18"
            />
            {errors.account_number && (
              <p className="text-red-500 text-sm mt-1">{errors.account_number}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              IFSC Code *
            </label>
            <input
              type="text"
              name="ifsc_code"
              value={formData.ifsc_code}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 ${
                errors.ifsc_code ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter IFSC code"
              style={{ textTransform: 'uppercase' }}
              maxLength="11"
            />
            {errors.ifsc_code && (
              <p className="text-red-500 text-sm mt-1">{errors.ifsc_code}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bank Name *
            </label>
            <input
              type="text"
              name="bank_name"
              value={formData.bank_name}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 ${
                errors.bank_name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter bank name"
            />
            {errors.bank_name && (
              <p className="text-red-500 text-sm mt-1">{errors.bank_name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Branch Name *
            </label>
            <input
              type="text"
              name="branch_name"
              value={formData.branch_name}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 ${
                errors.branch_name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter branch name"
            />
            {errors.branch_name && (
              <p className="text-red-500 text-sm mt-1">{errors.branch_name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account Type *
            </label>
            <select
              name="account_type"
              value={formData.account_type}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
            >
              <option value="savings">Savings</option>
              <option value="current">Current</option>
              <option value="salary">Salary</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              UPI ID (Optional)
            </label>
            <input
              type="text"
              name="upi_id"
              value={formData.upi_id}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 ${
                errors.upi_id ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter UPI ID (e.g., user@paytm)"
            />
            {errors.upi_id && (
              <p className="text-red-500 text-sm mt-1">{errors.upi_id}</p>
            )}
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : (editData ? 'Update Bank Details' : 'Add Bank Details')}
          </button>
          
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  )
}

export default BankDetailsForm

