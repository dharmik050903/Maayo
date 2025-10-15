import React, { useState, useEffect } from 'react'
import { getMilestonesCached } from '../services/cachedApiService'
import { escrowService } from '../services/escrowService'
import { formatCurrency } from '../utils/currency'

const ProjectDetailsModal = ({ isOpen, onClose, project }) => {
  const [milestones, setMilestones] = useState([])
  const [escrowStatus, setEscrowStatus] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen && project?._id) {
      fetchProjectDetails()
    }
  }, [isOpen, project])

  const fetchProjectDetails = async () => {
    setLoading(true)
    setError('')
    
    try {
      // Fetch milestones
      const milestonesResponse = await getMilestonesCached(project._id)
      if (milestonesResponse.status) {
        // Milestones are nested under data.milestones in the response
        setMilestones(milestonesResponse.data?.milestones || [])
      }

      // Fetch escrow status
      const escrowResponse = await escrowService.getEscrowStatus(project._id)
      if (escrowResponse.status) {
        setEscrowStatus(escrowResponse.data)
      }
    } catch (error) {
      console.error('Error fetching project details:', error)
      setError('Failed to load project details')
    } finally {
      setLoading(false)
    }
  }

  const getProjectStatus = (project) => {
    if (project.iscompleted === 1) return 'completed'
    if (project.isactive === 1) return 'in_progress'
    if (project.ispending === 1) return 'open'
    if (project.status === 'cancelled') return 'cancelled'
    return 'open'
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200'
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'open': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return '✅'
      case 'in_progress': return '🔄'
      case 'open': return '⏳'
      case 'cancelled': return '❌'
      default: return '📋'
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (!isOpen || !project) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1100] p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto scrollbar-hide">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 rounded-t-3xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-r from-mint to-violet rounded-2xl flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">{project.title}</h2>
                <div className="flex items-center gap-3 mt-1">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(getProjectStatus(project))}`}>
                    {getStatusIcon(getProjectStatus(project))} {getProjectStatus(project).charAt(0).toUpperCase() + getProjectStatus(project).slice(1)}
                  </span>
                  <span className="text-sm text-gray-500">
                    Created: {formatDate(project.createdAt)}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-lg hover:bg-gray-100"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          {/* Project Overview */}
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-mint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Project Overview
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center mb-2">
                  <svg className="w-5 h-5 mr-2 text-mint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 6h8M7 10h8M9 14h5c1.5 0 2.5-1 2.5-2.5S15.5 9 14 9h-2" />
                  </svg>
                  <span className="text-sm font-medium text-gray-600">Budget</span>
                </div>
                <p className="text-2xl font-bold text-mint">{formatCurrency(project.budget)}</p>
              </div>
              
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center mb-2">
                  <svg className="w-5 h-5 mr-2 text-violet" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-600">Duration</span>
                </div>
                <p className="text-2xl font-bold text-violet">{project.duration} days</p>
              </div>
              
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center mb-2">
                  <svg className="w-5 h-5 mr-2 text-coral" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-600">Total Bids</span>
                </div>
                <p className="text-2xl font-bold text-coral">{project.bid_count || 0}</p>
              </div>
            </div>
          </div>

          {/* Project Description */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-mint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Project Description
            </h3>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-gray-700 leading-relaxed">{project.description}</p>
            </div>
          </div>

          {/* Required Skills */}
          {project.skills_required && project.skills_required.length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-violet" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Required Skills
              </h3>
              <div className="flex flex-wrap gap-3">
                {project.skills_required.map((skill, index) => (
                  <span key={index} className="px-4 py-2 bg-gradient-to-r from-violet/10 to-mint/10 text-violet rounded-xl text-sm font-medium border border-violet/20">
                    {skill.skill || skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Escrow Status */}
          {escrowStatus && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Escrow Status
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-50 rounded-xl p-4">
                  <p className="text-sm text-green-600 font-medium">Escrow Amount</p>
                  <p className="text-xl font-bold text-green-800">{formatCurrency(escrowStatus.escrow_amount || 0)}</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-4">
                  <p className="text-sm text-blue-600 font-medium">Status</p>
                  <p className="text-xl font-bold text-blue-800 capitalize">{escrowStatus.escrow_status || 'Not Set'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Milestones */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-coral" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              Project Milestones
            </h3>
            
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mint"></div>
                <span className="ml-2 text-gray-600">Loading milestones...</span>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-red-600">{error}</p>
              </div>
            ) : milestones.length > 0 ? (
              <div className="space-y-4">
                {milestones.map((milestone, index) => (
                  <div key={index} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-800">{milestone.title || `Milestone ${index + 1}`}</h4>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        milestone.is_completed === 1 ? 
                          (milestone.payment_released === 1 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800') :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {milestone.is_completed === 1 ? 
                          (milestone.payment_released === 1 ? '✅ Payment Released Successfully' : '⏳ Pending Approval') :
                         '📋 Pending'}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-2">{milestone.description || 'No description provided'}</p>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>Amount: {formatCurrency(milestone.amount || 0)}</span>
                      <span>Due: {formatDate(milestone.due_date)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-xl p-8 text-center">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                <p className="text-gray-500">No milestones defined for this project yet.</p>
              </div>
            )}
          </div>

          {/* Project Timeline */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-violet" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Project Timeline
            </h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <span className="text-gray-600">Project Created: {formatDate(project.createdAt)}</span>
              </div>
              {project.completed_at && (
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                  <span className="text-gray-600">Project Completed: {formatDate(project.completed_at)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProjectDetailsModal
