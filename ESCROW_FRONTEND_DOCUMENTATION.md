# Escrow System Frontend Documentation

## Overview
This document provides comprehensive frontend implementation guidelines for the Maayo escrow system with milestone-based payments.

## Backend API Endpoints Summary

### Bank Details Management
- `POST /api/bank-details/add` - Add bank details
- `POST /api/bank-details/update` - Update bank details
- `POST /api/bank-details/list` - Get user's bank details
- `POST /api/bank-details/set-primary` - Set primary bank account
- `POST /api/bank-details/delete` - Delete bank details

### Escrow Payment Management
- `POST /api/escrow/create` - Create escrow payment
- `POST /api/escrow/verify` - Verify escrow payment
- `POST /api/escrow/release-milestone` - Release milestone payment
- `POST /api/escrow/status` - Get escrow status

### Milestone Management
- `POST /api/milestone/complete` - Mark milestone as completed
- `POST /api/milestone/modify` - Modify milestone details
- `POST /api/milestone/add` - Add new milestone
- `POST /api/milestone/remove` - Remove milestone
- `POST /api/milestone/list` - Get project milestones

### Project Price Management
- `POST /api/bid/update-price` - Update project price after bid acceptance

## Frontend Implementation Guide

### 1. Bank Details Management

#### Add Bank Details Form
```jsx
// components/BankDetailsForm.jsx
import React, { useState } from 'react';

const BankDetailsForm = ({ onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    account_holder_name: '',
    account_number: '',
    ifsc_code: '',
    bank_name: '',
    branch_name: '',
    account_type: 'savings',
    upi_id: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/bank-details/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'id': localStorage.getItem('userId'),
          'user_role': localStorage.getItem('userRole')
        },
        body: JSON.stringify(formData)
      });
      
      const result = await response.json();
      if (result.status) {
        onSuccess?.(result.data);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Error adding bank details:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Form fields implementation */}
    </form>
  );
};
```

#### Bank Details List Component
```jsx
// components/BankDetailsList.jsx
import React, { useState, useEffect } from 'react';

const BankDetailsList = () => {
  const [bankDetails, setBankDetails] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBankDetails();
  }, []);

  const fetchBankDetails = async () => {
    try {
      const response = await fetch('/api/bank-details/list', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'id': localStorage.getItem('userId'),
          'user_role': localStorage.getItem('userRole')
        }
      });
      
      const result = await response.json();
      if (result.status) {
        setBankDetails(result.data);
      }
    } catch (error) {
      console.error('Error fetching bank details:', error);
    } finally {
      setLoading(false);
    }
  };

  const setPrimary = async (bankDetailsId) => {
    try {
      const response = await fetch('/api/bank-details/set-primary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'id': localStorage.getItem('userId'),
          'user_role': localStorage.getItem('userRole')
        },
        body: JSON.stringify({ bank_details_id: bankDetailsId })
      });
      
      const result = await response.json();
      if (result.status) {
        fetchBankDetails(); // Refresh list
      }
    } catch (error) {
      console.error('Error setting primary bank details:', error);
    }
  };

  return (
    <div className="space-y-4">
      {bankDetails.map((bank) => (
        <div key={bank._id} className="border rounded-lg p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold">{bank.account_holder_name}</h3>
              <p className="text-gray-600">{bank.bank_name}</p>
              <p className="text-sm text-gray-500">****{bank.account_number.slice(-4)}</p>
            </div>
            <div className="flex gap-2">
              {bank.is_primary ? (
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                  Primary
                </span>
              ) : (
                <button
                  onClick={() => setPrimary(bank._id)}
                  className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                >
                  Set Primary
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
```

### 2. Escrow Payment Management

#### Create Escrow Payment Component
```jsx
// components/CreateEscrowPayment.jsx
import React, { useState } from 'react';

const CreateEscrowPayment = ({ projectId, onSuccess }) => {
  const [finalAmount, setFinalAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateEscrow = async () => {
    if (!finalAmount || finalAmount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/escrow/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'id': localStorage.getItem('userId'),
          'user_role': localStorage.getItem('userRole')
        },
        body: JSON.stringify({
          project_id: projectId,
          final_amount: parseFloat(finalAmount)
        })
      });
      
      const result = await response.json();
      if (result.status) {
        // Initialize Razorpay payment
        const options = {
          key: process.env.REACT_APP_RAZORPAY_KEY_ID,
          amount: result.data.amount,
          currency: result.data.currency,
          name: 'Maayo Escrow Payment',
          description: 'Project Escrow Payment',
          order_id: result.data.order_id,
          handler: async function (response) {
            await verifyEscrowPayment(response);
          },
          prefill: {
            name: localStorage.getItem('userName'),
            email: localStorage.getItem('userEmail')
          },
          theme: {
            color: '#7c3aed'
          }
        };
        
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Error creating escrow payment:', error);
      alert('Failed to create escrow payment');
    } finally {
      setLoading(false);
    }
  };

  const verifyEscrowPayment = async (paymentResponse) => {
    try {
      const response = await fetch('/api/escrow/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'id': localStorage.getItem('userId'),
          'user_role': localStorage.getItem('userRole')
        },
        body: JSON.stringify({
          project_id: projectId,
          payment_id: paymentResponse.razorpay_payment_id,
          signature: paymentResponse.razorpay_signature
        })
      });
      
      const result = await response.json();
      if (result.status) {
        onSuccess?.();
        alert('Escrow payment created successfully!');
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Error verifying escrow payment:', error);
      alert('Payment verification failed');
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Create Escrow Payment</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Final Project Amount (₹)
          </label>
          <input
            type="number"
            value={finalAmount}
            onChange={(e) => setFinalAmount(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Enter final project amount"
            min="1"
            step="0.01"
          />
        </div>
        <button
          onClick={handleCreateEscrow}
          disabled={loading}
          className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Escrow Payment'}
        </button>
      </div>
    </div>
  );
};
```

#### Escrow Status Component
```jsx
// components/EscrowStatus.jsx
import React, { useState, useEffect } from 'react';

const EscrowStatus = ({ projectId }) => {
  const [escrowData, setEscrowData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEscrowStatus();
  }, [projectId]);

  const fetchEscrowStatus = async () => {
    try {
      const response = await fetch('/api/escrow/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'id': localStorage.getItem('userId'),
          'user_role': localStorage.getItem('userRole')
        },
        body: JSON.stringify({ project_id: projectId })
      });
      
      const result = await response.json();
      if (result.status) {
        setEscrowData(result.data);
      }
    } catch (error) {
      console.error('Error fetching escrow status:', error);
    } finally {
      setLoading(false);
    }
  };

  const releaseMilestonePayment = async (milestoneIndex) => {
    try {
      const response = await fetch('/api/escrow/release-milestone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'id': localStorage.getItem('userId'),
          'user_role': localStorage.getItem('userRole')
        },
        body: JSON.stringify({
          project_id: projectId,
          milestone_index: milestoneIndex
        })
      });
      
      const result = await response.json();
      if (result.status) {
        alert('Milestone payment released successfully!');
        fetchEscrowStatus(); // Refresh data
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Error releasing milestone payment:', error);
      alert('Failed to release milestone payment');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!escrowData) return <div>No escrow data found</div>;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Escrow Status</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-700">Escrow Amount</h4>
          <p className="text-2xl font-bold text-purple-600">₹{escrowData.escrow_amount}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-700">Completed Milestones</h4>
          <p className="text-2xl font-bold text-green-600">{escrowData.completed_milestones}/{escrowData.total_milestones}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-700">Released Payments</h4>
          <p className="text-2xl font-bold text-blue-600">{escrowData.released_payments}</p>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-semibold">Milestones</h4>
        {escrowData.milestones.map((milestone, index) => (
          <div key={index} className="border rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h5 className="font-medium">{milestone.title}</h5>
                <p className="text-gray-600 text-sm">{milestone.description}</p>
                <div className="flex gap-4 mt-2 text-sm">
                  <span className="text-purple-600 font-medium">₹{milestone.amount}</span>
                  {milestone.due_date && (
                    <span className="text-gray-500">Due: {milestone.due_date}</span>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  {milestone.is_completed === 1 ? (
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                      Completed
                    </span>
                  ) : (
                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm">
                      Pending
                    </span>
                  )}
                  
                  {milestone.payment_released === 1 ? (
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                      Paid
                    </span>
                  ) : (
                    <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm">
                      Unpaid
                    </span>
                  )}
                </div>
                
                {milestone.is_completed === 1 && milestone.payment_released === 0 && (
                  <button
                    onClick={() => releaseMilestonePayment(index)}
                    className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                  >
                    Release Payment
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
```

### 3. Milestone Management

#### Milestone Management Component
```jsx
// components/MilestoneManagement.jsx
import React, { useState, useEffect } from 'react';

const MilestoneManagement = ({ projectId, userRole }) => {
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMilestone, setNewMilestone] = useState({
    title: '',
    description: '',
    amount: '',
    due_date: ''
  });

  useEffect(() => {
    fetchMilestones();
  }, [projectId]);

  const fetchMilestones = async () => {
    try {
      const response = await fetch('/api/milestone/list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'id': localStorage.getItem('userId'),
          'user_role': localStorage.getItem('userRole')
        },
        body: JSON.stringify({ project_id: projectId })
      });
      
      const result = await response.json();
      if (result.status) {
        setMilestones(result.data.milestones);
      }
    } catch (error) {
      console.error('Error fetching milestones:', error);
    } finally {
      setLoading(false);
    }
  };

  const completeMilestone = async (milestoneIndex) => {
    try {
      const response = await fetch('/api/milestone/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'id': localStorage.getItem('userId'),
          'user_role': localStorage.getItem('userRole')
        },
        body: JSON.stringify({
          project_id: projectId,
          milestone_index: milestoneIndex,
          completion_notes: 'Milestone completed successfully'
        })
      });
      
      const result = await response.json();
      if (result.status) {
        alert('Milestone completed successfully!');
        fetchMilestones();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Error completing milestone:', error);
      alert('Failed to complete milestone');
    }
  };

  const addMilestone = async () => {
    if (!newMilestone.title || !newMilestone.amount) {
      alert('Title and amount are required');
      return;
    }

    try {
      const response = await fetch('/api/milestone/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'id': localStorage.getItem('userId'),
          'user_role': localStorage.getItem('userRole')
        },
        body: JSON.stringify({
          project_id: projectId,
          ...newMilestone
        })
      });
      
      const result = await response.json();
      if (result.status) {
        alert('Milestone added successfully!');
        setNewMilestone({ title: '', description: '', amount: '', due_date: '' });
        setShowAddForm(false);
        fetchMilestones();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Error adding milestone:', error);
      alert('Failed to add milestone');
    }
  };

  const removeMilestone = async (milestoneIndex) => {
    if (!confirm('Are you sure you want to remove this milestone?')) return;

    try {
      const response = await fetch('/api/milestone/remove', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'id': localStorage.getItem('userId'),
          'user_role': localStorage.getItem('userRole')
        },
        body: JSON.stringify({
          project_id: projectId,
          milestone_index: milestoneIndex
        })
      });
      
      const result = await response.json();
      if (result.status) {
        alert('Milestone removed successfully!');
        fetchMilestones();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Error removing milestone:', error);
      alert('Failed to remove milestone');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">Project Milestones</h3>
        {userRole === 'freelancer' && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
          >
            Add Milestone
          </button>
        )}
      </div>

      {showAddForm && (
        <div className="mb-6 p-4 border rounded-lg bg-gray-50">
          <h4 className="font-medium mb-4">Add New Milestone</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                value={newMilestone.title}
                onChange={(e) => setNewMilestone({...newMilestone, title: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Milestone title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount (₹) *
              </label>
              <input
                type="number"
                value={newMilestone.amount}
                onChange={(e) => setNewMilestone({...newMilestone, amount: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <input
                type="text"
                value={newMilestone.description}
                onChange={(e) => setNewMilestone({...newMilestone, description: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Milestone description"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Due Date
              </label>
              <input
                type="date"
                value={newMilestone.due_date}
                onChange={(e) => setNewMilestone({...newMilestone, due_date: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={addMilestone}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              Add Milestone
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {milestones.map((milestone, index) => (
          <div key={index} className="border rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h5 className="font-medium">{milestone.title}</h5>
                <p className="text-gray-600 text-sm">{milestone.description}</p>
                <div className="flex gap-4 mt-2 text-sm">
                  <span className="text-purple-600 font-medium">₹{milestone.amount}</span>
                  {milestone.due_date && (
                    <span className="text-gray-500">Due: {milestone.due_date}</span>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  {milestone.is_completed === 1 ? (
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                      Completed
                    </span>
                  ) : (
                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm">
                      Pending
                    </span>
                  )}
                  
                  {milestone.payment_released === 1 ? (
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                      Paid
                    </span>
                  ) : (
                    <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm">
                      Unpaid
                    </span>
                  )}
                </div>
                
                <div className="flex gap-2">
                  {userRole === 'freelancer' && milestone.is_completed === 0 && (
                    <button
                      onClick={() => completeMilestone(index)}
                      className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                    >
                      Mark Complete
                    </button>
                  )}
                  
                  {userRole === 'freelancer' && milestone.is_completed === 0 && (
                    <button
                      onClick={() => removeMilestone(index)}
                      className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
```

### 4. Project Price Update Component

```jsx
// components/ProjectPriceUpdate.jsx
import React, { useState } from 'react';

const ProjectPriceUpdate = ({ projectId, currentAmount, onSuccess }) => {
  const [finalAmount, setFinalAmount] = useState(currentAmount || '');
  const [loading, setLoading] = useState(false);

  const handleUpdatePrice = async () => {
    if (!finalAmount || finalAmount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/bid/update-price', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'id': localStorage.getItem('userId'),
          'user_role': localStorage.getItem('userRole')
        },
        body: JSON.stringify({
          project_id: projectId,
          final_amount: parseFloat(finalAmount)
        })
      });
      
      const result = await response.json();
      if (result.status) {
        alert('Project price updated successfully!');
        onSuccess?.(result.data);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Error updating project price:', error);
      alert('Failed to update project price');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Update Project Price</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Final Project Amount (₹)
          </label>
          <input
            type="number"
            value={finalAmount}
            onChange={(e) => setFinalAmount(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Enter final project amount"
            min="1"
            step="0.01"
          />
          <p className="text-sm text-gray-500 mt-1">
            This amount will be used for escrow payments and milestone releases.
          </p>
        </div>
        <button
          onClick={handleUpdatePrice}
          disabled={loading}
          className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:opacity-50"
        >
          {loading ? 'Updating...' : 'Update Price'}
        </button>
      </div>
    </div>
  );
};
```

## Payment Release Logic

### Automatic Payment Release Percentages:
- **1 Milestone**: 100% on completion
- **2 Milestones**: 30% for first, 70% for second
- **3 Milestones**: 30% for first, 30% for second, 40% for third
- **4+ Milestones**: Equal distribution (amount / total_milestones)

## Integration Notes

1. **Authentication**: All API calls require proper authentication headers
2. **Error Handling**: Implement proper error handling for all API calls
3. **Loading States**: Show loading indicators during API operations
4. **Success Feedback**: Provide user feedback for successful operations
5. **Validation**: Implement client-side validation before API calls
6. **Razorpay Integration**: Include Razorpay script for payment processing

## Required Environment Variables

```env
REACT_APP_RAZORPAY_KEY_ID=your_razorpay_key_id
```

## Dependencies

```json
{
  "razorpay": "^1.0.0"
}
```

This documentation provides a complete guide for implementing the escrow system frontend. All components are ready to be integrated into your existing React application.

