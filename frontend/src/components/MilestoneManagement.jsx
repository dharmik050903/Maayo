import React, { useState, useEffect } from 'react'
import { escrowService } from '../services/escrowService'

const MilestoneManagement = ({ projectId, userRole }) => {
  const [milestones, setMilestones] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingMilestone, setEditingMilestone] = useState(null)
  const [completingMilestone, setCompletingMilestone] = useState(null)
  const [error, setError] = useState(null)
  const [newMilestone, setNewMilestone] = useState({
    title: '',
    description: '',
    amount: '',
    due_date: ''
  })

  useEffect(() => {
    if (projectId) {
      fetchMilestones()
    }
  }, [projectId])

  const fetchMilestones = async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await escrowService.getMilestones(projectId)
      
      if (result.status) {
        setMilestones(result.data.milestones || [])
      }
    } catch (error) {
      console.error('Error fetching milestones:', error)
      setError(error.message || 'Failed to fetch milestones')
    } finally {
      setLoading(false)
    }
  }

  const completeMilestone = async (milestoneIndex) => {
    const completionNotes = prompt('Add completion notes (optional):')
    if (completionNotes === null) return // User cancelled

    try {
      setCompletingMilestone(milestoneIndex)
      const result = await escrowService.completeMilestone(projectId, milestoneIndex, completionNotes || '')
      
      if (result.status) {
        alert('Milestone completed successfully!')
        fetchMilestones()
      }
    } catch (error) {
      console.error('Error completing milestone:', error)
      alert(error.message || 'Failed to complete milestone')
    } finally {
      setCompletingMilestone(null)
    }
  }

  const addMilestone = async () => {
    if (!newMilestone.title.trim() || !newMilestone.amount) {
      alert('Title and amount are required')
      return
    }

    if (parseFloat(newMilestone.amount) <= 0) {
      alert('Amount must be greater than 0')
      return
    }

    try {
      const result = await escrowService.addMilestone(projectId, {
        ...newMilestone,
        amount: parseFloat(newMilestone.amount)
      })
      
      if (result.status) {
        alert('Milestone added successfully!')
        setNewMilestone({ title: '', description: '', amount: '', due_date: '' })
        setShowAddForm(false)
        fetchMilestones()
      }
    } catch (error) {
      console.error('Error adding milestone:', error)
      alert(error.message || 'Failed to add milestone')
    }
  }

  const removeMilestone = async (milestoneIndex) => {
    if (!confirm('Are you sure you want to remove this milestone? This action cannot be undone.')) {
      return
    }

    try {
      const result = await escrowService.removeMilestone(projectId, milestoneIndex)
      
      if (result.status) {
        alert('Milestone removed successfully!')
        fetchMilestones()
      }
    } catch (error) {
      console.error('Error removing milestone:', error)
      alert(error.message || 'Failed to remove milestone')
    }
  }

  const modifyMilestone = async (milestoneIndex, milestoneData) => {
    try {
      const result = await escrowService.modifyMilestone(projectId, milestoneIndex, milestoneData)
      
      if (result.status) {
        alert('Milestone modified successfully!')
        setEditingMilestone(null)
        fetchMilestones()
      }
    } catch (error) {
      console.error('Error modifying milestone:', error)
      alert(error.message || 'Failed to modify milestone')
    }
  }

  const handleEditMilestone = (milestone, index) => {
    setEditingMilestone({ ...milestone, index })
    setShowAddForm(false)
  }

  const handleSaveEdit = () => {
    if (!editingMilestone.title.trim() || !editingMilestone.amount) {
      alert('Title and amount are required')
      return
    }

    modifyMilestone(editingMilestone.index, {
      title: editingMilestone.title,
      description: editingMilestone.description,
      amount: parseFloat(editingMilestone.amount),
      due_date: editingMilestone.due_date
    })
  }

  const getStatusColor = (isCompleted, paymentReleased) => {
    if (isCompleted === 1 && paymentReleased === 1) {
      return 'bg-green-100 text-green-800'
    } else if (isCompleted === 1 && paymentReleased === 0) {
      return 'bg-blue-100 text-blue-800'
    } else {
      return 'bg-yellow-100 text-yellow-800'
    }
  }

  const getStatusText = (isCompleted, paymentReleased) => {
    if (isCompleted === 1 && paymentReleased === 1) {
      return 'Paid'
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
          <span className="ml-2">Loading milestones...</span>
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
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Milestones</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchMilestones}
            className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Project Milestones</h3>
          <p className="text-gray-600 mt-1">Manage project milestones and track progress</p>
        </div>
        {userRole === 'freelancer' && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Milestone
          </button>
        )}
      </div>

      {/* Add/Edit Form */}
      {(showAddForm || editingMilestone) && (
        <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <h4 className="font-medium mb-4">
            {editingMilestone ? 'Edit Milestone' : 'Add New Milestone'}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                value={editingMilestone ? editingMilestone.title : newMilestone.title}
                onChange={(e) => {
                  if (editingMilestone) {
                    setEditingMilestone({...editingMilestone, title: e.target.value})
                  } else {
                    setNewMilestone({...newMilestone, title: e.target.value})
                  }
                }}
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
                value={editingMilestone ? editingMilestone.amount : newMilestone.amount}
                onChange={(e) => {
                  if (editingMilestone) {
                    setEditingMilestone({...editingMilestone, amount: e.target.value})
                  } else {
                    setNewMilestone({...newMilestone, amount: e.target.value})
                  }
                }}
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
                value={editingMilestone ? editingMilestone.description : newMilestone.description}
                onChange={(e) => {
                  if (editingMilestone) {
                    setEditingMilestone({...editingMilestone, description: e.target.value})
                  } else {
                    setNewMilestone({...newMilestone, description: e.target.value})
                  }
                }}
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
                value={editingMilestone ? editingMilestone.due_date : newMilestone.due_date}
                onChange={(e) => {
                  if (editingMilestone) {
                    setEditingMilestone({...editingMilestone, due_date: e.target.value})
                  } else {
                    setNewMilestone({...newMilestone, due_date: e.target.value})
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={editingMilestone ? handleSaveEdit : addMilestone}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              {editingMilestone ? 'Save Changes' : 'Add Milestone'}
            </button>
            <button
              onClick={() => {
                setShowAddForm(false)
                setEditingMilestone(null)
                setNewMilestone({ title: '', description: '', amount: '', due_date: '' })
              }}
              className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Milestones List */}
      <div className="space-y-4">
        {milestones.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Milestones</h3>
            <p className="text-gray-600 mb-4">Create milestones to break down your project into manageable tasks</p>
            {userRole === 'freelancer' && (
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
              >
                Add First Milestone
              </button>
            )}
          </div>
        ) : (
          milestones.map((milestone, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h5 className="font-medium text-gray-900">{milestone.title}</h5>
                    <span className={`px-2 py-1 rounded-full text-sm font-medium ${getStatusColor(
                      milestone.is_completed, milestone.payment_released
                    )}`}>
                      {milestone.is_completed === 1 ? 'Completed' : 'Pending'}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-sm font-medium ${getStatusColor(
                      milestone.is_completed, milestone.payment_released
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
                  {userRole === 'freelancer' && milestone.is_completed === 0 && (
                    <button
                      onClick={() => completeMilestone(index)}
                      disabled={completingMilestone === index}
                      className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      {completingMilestone === index ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                          Completing...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Mark Complete
                        </>
                      )}
                    </button>
                  )}
                  
                  {userRole === 'freelancer' && milestone.is_completed === 0 && (
                    <button
                      onClick={() => handleEditMilestone(milestone, index)}
                      className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600"
                    >
                      Edit
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
          ))
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
            <h3 className="text-sm font-medium text-blue-800">Milestone Management</h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li>Only freelancers can create, edit, and remove milestones</li>
                <li>Mark milestones as complete when work is finished</li>
                <li>Payment percentages are automatically calculated based on milestone count</li>
                <li>Clients can release payments after milestone completion</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MilestoneManagement

