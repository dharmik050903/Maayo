import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import AdminSidebar from '../components/AdminSidebar'
import AdminDashboard from '../components/AdminDashboard'
import UserManagement from '../components/UserManagement'
import JobManagement from '../components/JobManagement'
import PermissionRequests from '../components/PermissionRequests'
import adminService from '../services/adminService'

// Enhanced components with real data fetching
const FreelancerManagement = () => {
  const [freelancers, setFreelancers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedFreelancer, setSelectedFreelancer] = useState(null)

  useEffect(() => {
    fetchFreelancers()
  }, [])

  const fetchFreelancers = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await adminService.getFreelancers()
      setFreelancers(response.data || [])
    } catch (error) {
      console.error('Error fetching freelancers:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleEditFreelancer = async (updatedFreelancerData) => {
    try {
      setActionLoading(true)
      await adminService.updateUser(selectedFreelancer._id, updatedFreelancerData)
      fetchFreelancers()
      setShowEditModal(false)
      setSelectedFreelancer(null)
    } catch (error) {
      console.error('Error updating freelancer:', error)
      setError(error.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteFreelancer = async (freelancerId) => {
    if (window.confirm('Are you sure you want to delete this freelancer? This action cannot be undone.')) {
      try {
        setActionLoading(true)
        await adminService.deleteUser(freelancerId)
        fetchFreelancers()
      } catch (error) {
        console.error('Error deleting freelancer:', error)
        setError(error.message)
      } finally {
        setActionLoading(false)
      }
    }
  }

  if (loading) {
    return (
      <div className="p-3 sm:p-4 lg:p-6">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Freelancer Management</h1>
        <div className="mt-4 flex items-center justify-center py-12">
          <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          <span className="ml-3 text-gray-600">Loading freelancers...</span>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="p-3 sm:p-4 lg:p-6 bg-gray-50 min-h-screen">
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 sm:p-6 mb-6 border border-purple-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800">Freelancer Management</h1>
            <button 
              onClick={fetchFreelancers}
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg hover:from-purple-600 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              Refresh
            </button>
          </div>
        </div>
        
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
          <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-purple-50">
            <h3 className="font-semibold text-gray-800">Total Freelancers: {freelancers.length}</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-purple-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Skills</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Joined</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {freelancers.length > 0 ? (
                  freelancers.map((freelancer, index) => (
                    <tr key={freelancer._id || index} className="hover:bg-purple-50 transition-colors duration-200">
                      <td className="px-4 py-3 text-sm text-gray-800 font-medium">
                        {freelancer.first_name} {freelancer.last_name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {freelancer.email}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {freelancer.skills?.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {freelancer.skills.slice(0, 3).map((skill, idx) => (
                              <span key={idx} className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded font-medium">
                                {skill.skill}
                              </span>
                            ))}
                            {freelancer.skills.length > 3 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded font-medium">
                                +{freelancer.skills.length - 3} more
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-500">No skills listed</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 text-xs rounded-full font-semibold ${
                          freelancer.is_suspended ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {freelancer.is_suspended ? 'Suspended' : 'Active'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {freelancer.created_at ? new Date(freelancer.created_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedFreelancer(freelancer);
                              setShowEditModal(true);
                            }}
                            disabled={actionLoading}
                            className="text-purple-600 hover:text-purple-800 disabled:opacity-50 font-medium transition-colors duration-200"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteFreelancer(freelancer._id)}
                            disabled={actionLoading}
                            className="text-red-600 hover:text-red-800 disabled:opacity-50 font-medium transition-colors duration-200"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                      No freelancers found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit Freelancer Modal */}
      {showEditModal && selectedFreelancer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1100] p-4">
          <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">Edit Freelancer</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedFreelancer(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-200 p-1"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={(e) => e.preventDefault()}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={selectedFreelancer.first_name || ''}
                    onChange={(e) => setSelectedFreelancer({...selectedFreelancer, first_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 bg-white transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={selectedFreelancer.last_name || ''}
                    onChange={(e) => setSelectedFreelancer({...selectedFreelancer, last_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 bg-white transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={selectedFreelancer.email || ''}
                    onChange={(e) => setSelectedFreelancer({...selectedFreelancer, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 bg-white transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    value={selectedFreelancer.country || ''}
                    onChange={(e) => setSelectedFreelancer({...selectedFreelancer, country: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 bg-white transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mobile
                  </label>
                  <input
                    type="text"
                    value={selectedFreelancer.mobile || ''}
                    onChange={(e) => setSelectedFreelancer({...selectedFreelancer, mobile: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 bg-white transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={selectedFreelancer.is_suspended ? 'suspended' : 'active'}
                    onChange={(e) => setSelectedFreelancer({...selectedFreelancer, is_suspended: e.target.value === 'suspended'})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 bg-white transition-all duration-200"
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedFreelancer(null);
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleEditFreelancer(selectedFreelancer)}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg hover:from-purple-600 hover:to-indigo-700 disabled:opacity-50 transition-all duration-200"
                >
                  {actionLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

const ProjectManagement = () => {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedProject, setSelectedProject] = useState(null)

  useEffect(() => {
    fetchProjects()
  }, [])

  // Clear success message after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 5000)
      return () => clearTimeout(timer)
    }
  }, [success])

  // Clear error message after 10 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 10000)
      return () => clearTimeout(timer)
    }
  }, [error])

  const fetchProjects = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await adminService.getProjects()
      if (response.status) {
        setProjects(response.data || [])
        console.log('✅ Projects fetched successfully:', response.data?.length || 0)
      } else {
        throw new Error(response.message || 'Failed to fetch projects')
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
      setError(`Failed to fetch projects: ${error.message}`)
      setProjects([]) // Clear projects on error
    } finally {
      setLoading(false)
    }
  }

  const handleEditProject = async (updatedProjectData) => {
    try {
      setActionLoading(true)
      setError('')
      setSuccess('')
      
      const response = await adminService.updateProject(selectedProject._id, updatedProjectData)
      
      if (response.status) {
        // Update state immediately for real-time UI update
        setProjects(prevProjects => 
          prevProjects.map(project => 
            project._id === selectedProject._id 
              ? { ...project, ...updatedProjectData, ...response.data }
              : project
          )
        )
        
        // Show success message
        setSuccess('Project updated successfully!')
        
        // Close modal
        setShowEditModal(false)
        setSelectedProject(null)
        
        // Refresh list to ensure consistency with backend
        await fetchProjects()
        
        console.log('✅ Project updated successfully')
      }
    } catch (error) {
      console.error('Error updating project:', error)
      setError(`Failed to update project: ${error.message}`)
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteProject = async (projectId) => {
    console.log('🗑️ Delete project requested for ID:', projectId)
    
    if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      try {
        setActionLoading(true)
        setError('')
        setSuccess('')
        
        console.log('🔄 Calling delete API for project:', projectId)
        
        // Use proper delete API call
        const response = await adminService.deleteProject(projectId, 'Deleted by admin')
        
        console.log('📡 Delete API response:', response)
        
        if (response && response.status) {
          console.log('✅ Delete API successful, updating UI')
          
          // Update state immediately for real-time UI update
          setProjects(prevProjects => {
            const filteredProjects = prevProjects.filter(project => project._id !== projectId)
            console.log('📊 Projects before filter:', prevProjects.length, 'after filter:', filteredProjects.length)
            return filteredProjects
          })
          
          // Show success message
          setSuccess('Project deleted successfully!')
          
          // Clear success message after 3 seconds
          setTimeout(() => setSuccess(''), 3000)
          
          console.log('✅ Project deleted and UI updated successfully')
        } else {
          console.error('❌ Delete API returned false status:', response)
          throw new Error(response?.message || 'Delete operation failed')
        }
      } catch (error) {
        console.error('❌ Error deleting project:', error)
        console.error('❌ Error stack:', error.stack)
        setError(`Failed to delete project: ${error.message}`)
      } finally {
        setActionLoading(false)
      }
    } else {
      console.log('❌ User cancelled project deletion')
    }
  }

  if (loading) {
    return (
      <div className="p-3 sm:p-4 lg:p-6">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Project Management</h1>
        <div className="mt-4 flex items-center justify-center py-12">
          <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          <span className="ml-3 text-gray-600">Loading projects...</span>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="p-3 sm:p-4 lg:p-6 bg-gray-50 min-h-screen">
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-4 sm:p-6 mb-6 border border-green-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800">Project Management</h1>
            <button 
              onClick={fetchProjects}
              className="px-4 py-2 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-lg hover:from-green-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              Refresh
            </button>
          </div>
        </div>
        
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
          <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-green-50">
            <h3 className="font-semibold text-gray-800">Total Projects: {projects.length}</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-green-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Title</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Client</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Budget</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Created</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {projects.length > 0 ? (
                  projects.map((project, index) => (
                    <tr key={project._id || index} className="hover:bg-green-50 transition-colors duration-200">
                      <td className="px-4 py-3 text-sm">
                        <div className="font-medium text-gray-800 truncate max-w-xs" title={project.title}>
                          {project.title}
                        </div>
                        <div className="text-gray-600 text-xs truncate max-w-xs" title={project.description}>
                          {project.description}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 font-medium">
                        {project.personid?.first_name} {project.personid?.last_name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800 font-semibold">
                        ₹{project.budget?.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 text-xs rounded-full font-semibold ${
                          project.status === 'completed' ? 'bg-green-100 text-green-800' :
                          project.status === 'open' ? 'bg-blue-100 text-blue-800' :
                          project.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {project.status?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {project.createdAt ? new Date(project.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedProject(project);
                              setShowEditModal(true);
                            }}
                            disabled={actionLoading}
                            className="text-green-600 hover:text-green-800 disabled:opacity-50 font-medium transition-colors duration-200"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteProject(project._id)}
                            disabled={actionLoading}
                            className="text-red-600 hover:text-red-800 disabled:opacity-50 font-medium transition-colors duration-200"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                      No projects found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit Project Modal */}
      {showEditModal && selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1100] p-4">
          <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">Edit Project</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedProject(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-200 p-1"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={(e) => e.preventDefault()}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={selectedProject.title || ''}
                    onChange={(e) => setSelectedProject({...selectedProject, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    rows={4}
                    value={selectedProject.description || ''}
                    onChange={(e) => setSelectedProject({...selectedProject, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Budget (₹)
                  </label>
                  <input
                    type="number"
                    value={selectedProject.budget || ''}
                    onChange={(e) => setSelectedProject({...selectedProject, budget: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={selectedProject.status || ''}
                    onChange={(e) => setSelectedProject({...selectedProject, status: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white transition-all duration-200"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedProject(null);
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleEditProject(selectedProject)}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-lg hover:from-green-600 hover:to-blue-700 disabled:opacity-50 transition-all duration-200"
                >
                  {actionLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

const BidManagement = () => {
  const [bids, setBids] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    fetchBids()
  }, [])

  // Clear success message after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 5000)
      return () => clearTimeout(timer)
    }
  }, [success])

  // Clear error message after 10 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 10000)
      return () => clearTimeout(timer)
    }
  }, [error])

  const fetchBids = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await adminService.getBids()
      if (response.status) {
        setBids(response.data || [])
        console.log('✅ Bids fetched successfully:', response.data?.length || 0)
      } else {
        throw new Error(response.message || 'Failed to fetch bids')
      }
    } catch (error) {
      console.error('Error fetching bids:', error)
      setError(`Failed to fetch bids: ${error.message}`)
      setBids([]) // Clear bids on error
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteBid = async (bidId) => {
    console.log('🗑️ Delete bid requested for ID:', bidId)
    
    if (window.confirm('Are you sure you want to delete this bid? This action cannot be undone.')) {
      try {
        setActionLoading(true)
        setError('')
        setSuccess('')
        
        console.log('🔄 Calling delete API for bid:', bidId)
        
        const response = await adminService.deleteBid(bidId, 'Deleted by admin')
        
        console.log('📡 Delete bid API response:', response)
        
        if (response && response.status) {
          console.log('✅ Delete bid API successful, updating UI')
          
          // Update state immediately for real-time UI update
          setBids(prevBids => {
            const filteredBids = prevBids.filter(bid => bid._id !== bidId)
            console.log('📊 Bids before filter:', prevBids.length, 'after filter:', filteredBids.length)
            return filteredBids
          })
          
          // Show success message
          setSuccess('Bid deleted successfully!')
          
          // Clear success message after 3 seconds
          setTimeout(() => setSuccess(''), 3000)
          
          console.log('✅ Bid deleted and UI updated successfully')
        } else {
          console.error('❌ Delete bid API returned false status:', response)
          throw new Error(response?.message || 'Delete operation failed')
        }
      } catch (error) {
        console.error('❌ Error deleting bid:', error)
        console.error('❌ Error stack:', error.stack)
        setError(`Failed to delete bid: ${error.message}`)
      } finally {
        setActionLoading(false)
      }
    } else {
      console.log('❌ User cancelled bid deletion')
    }
  }

  if (loading) {
    return (
      <div className="p-3 sm:p-4 lg:p-6">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Bid Management</h1>
        <div className="mt-4 flex items-center justify-center py-12">
          <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          <span className="ml-3 text-gray-600">Loading bids...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-3 sm:p-4 lg:p-6 bg-gray-50 min-h-screen">
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4 sm:p-6 mb-6 border border-yellow-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800">Bid Management</h1>
          <button 
            onClick={fetchBids}
            className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-600 text-white rounded-lg hover:from-yellow-600 hover:to-orange-700 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            Refresh
          </button>
        </div>
      </div>
      
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-yellow-50">
          <h3 className="font-semibold text-gray-800">Total Bids: {bids.length}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-yellow-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Project</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Freelancer</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Bid Amount</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Submitted</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {bids.length > 0 ? (
                bids.map((bid, index) => (
                  <tr key={bid._id || index} className="hover:bg-yellow-50 transition-colors duration-200">
                    <td className="px-4 py-3 text-sm">
                      <div className="font-medium text-gray-800 truncate max-w-xs" title={bid.project_id?.title}>
                        {bid.project_id?.title || 'N/A'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 font-medium">
                      {bid.freelancer_id?.first_name} {bid.freelancer_id?.last_name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800 font-semibold">
                      ₹{bid.bid_amount?.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 text-xs rounded-full font-semibold ${
                        bid.status === 'accepted' ? 'bg-green-100 text-green-800' :
                        bid.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        bid.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {bid.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {bid.created_at ? new Date(bid.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <button
                        onClick={() => handleDeleteBid(bid._id)}
                        disabled={actionLoading}
                        className="text-red-600 hover:text-red-800 disabled:opacity-50 font-medium transition-colors duration-200"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                    No bids found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

const PaymentManagement = () => {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    fetchPayments()
  }, [])

  const fetchPayments = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await adminService.getPayments()
      setPayments(response.data || [])
    } catch (error) {
      console.error('Error fetching payments:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePayment = async (paymentId) => {
    if (window.confirm('Are you sure you want to delete this payment record? This action cannot be undone.')) {
      try {
        setActionLoading(true)
        await adminService.deletePayment(paymentId)
        fetchPayments()
      } catch (error) {
        console.error('Error deleting payment:', error)
        setError(error.message)
      } finally {
        setActionLoading(false)
      }
    }
  }

  if (loading) {
    return (
      <div className="p-3 sm:p-4 lg:p-6">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Payment Management</h1>
        <div className="mt-4 flex items-center justify-center py-12">
          <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          <span className="ml-3 text-gray-600">Loading payments...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-3 sm:p-4 lg:p-6 bg-gray-50 min-h-screen">
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 sm:p-6 mb-6 border border-emerald-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800">Payment Management</h1>
          <button 
            onClick={fetchPayments}
            className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            Refresh
          </button>
        </div>
      </div>
      
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-emerald-50">
          <h3 className="font-semibold text-gray-800">Total Payments: {payments.length}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-emerald-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Transaction ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Project</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {payments.length > 0 ? (
                payments.map((payment, index) => (
                  <tr key={payment._id || index} className="hover:bg-emerald-50 transition-colors duration-200">
                    <td className="px-4 py-3 text-sm font-mono text-gray-700">
                      {payment.payment_id || payment.transaction_id || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="font-medium text-gray-800 truncate max-w-xs" title={payment.project_id?.title}>
                        {payment.project_id?.title || 'N/A'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800 font-semibold">
                      ₹{payment.amount?.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 text-xs rounded-full font-semibold ${
                        payment.status === 'completed' || payment.status === 'success' ? 'bg-green-100 text-green-800' :
                        payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        payment.status === 'failed' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {payment.created_at ? new Date(payment.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <button
                        onClick={() => handleDeletePayment(payment._id)}
                        disabled={actionLoading}
                        className="text-red-600 hover:text-red-800 disabled:opacity-50 font-medium transition-colors duration-200"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                    No payments found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

const AdminProfile = () => {
  const [adminData, setAdminData] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const data = adminService.getAdminData()
    setAdminData(data)
    setFormData({
      name: data?.name || '',
      email: data?.email || '',
      phone: data?.phone || ''
    })
  }, [])

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      await adminService.updateAdminProfile(formData)
      const updatedData = adminService.getAdminData()
      setAdminData(updatedData)
      setIsEditing(false)
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-3 sm:p-4 lg:p-6 bg-gray-50 min-h-screen">
      <div className="max-w-2xl">
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 sm:p-6 mb-6 border border-indigo-100 shadow-sm">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-4 sm:mb-6" style={{ color: '#000000', fontWeight: '800' }}>Admin Profile</h1>
        
          {error && (
            <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-3 sm:px-4 py-3 rounded">
              {error}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div className="flex items-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-indigo-600 to-purple-700 rounded-full flex items-center justify-center text-white text-lg sm:text-xl font-bold shadow-sm">
                {adminData?.name?.charAt(0)?.toUpperCase()}
              </div>
              <div className="ml-3 sm:ml-4">
                <h2 className="text-lg sm:text-xl font-bold" style={{ color: '#000000', fontWeight: '800' }}>{adminData?.name}</h2>
                <p className="text-sm sm:text-base capitalize font-bold" style={{ color: '#1f2937', fontWeight: '700' }}>{adminData?.role?.replace('_', ' ')}</p>
              </div>
            </div>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm bg-gradient-to-r from-indigo-600 to-purple-700 text-white rounded-lg hover:from-indigo-700 hover:to-purple-800 transition-all duration-200 shadow-sm"
            >
              {isEditing ? 'Cancel' : 'Edit'}
            </button>
          </div>

          {isEditing ? (
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm sm:text-base text-gray-900 bg-white"
                  required
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm sm:text-base text-gray-900 bg-white"
                  required
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm sm:text-base text-gray-900 bg-white"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 font-medium"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Name</label>
                <p className="text-sm sm:text-base font-bold" style={{ color: '#000000', fontWeight: '700' }}>{adminData?.name}</p>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Email</label>
                <p className="text-sm sm:text-base font-bold" style={{ color: '#000000', fontWeight: '700' }}>{adminData?.email}</p>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Phone</label>
                <p className="text-sm sm:text-base font-bold" style={{ color: '#000000', fontWeight: '700' }}>{adminData?.phone || 'Not provided'}</p>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Role</label>
                <p className="text-sm sm:text-base font-bold capitalize" style={{ color: '#000000', fontWeight: '700' }}>{adminData?.role?.replace('_', ' ')}</p>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Last Login</label>
                <p className="text-sm sm:text-base font-bold" style={{ color: '#000000', fontWeight: '700' }}>
                  {adminData?.last_login ? new Date(adminData.last_login).toLocaleString() : 'Never'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const AdminPanel = () => {
  const [adminData, setAdminData] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    // Check screen size
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)

    // Check authentication
    if (!adminService.isAdminAuthenticated()) {
      navigate('/admin/login')
      return
    }

    // Get admin data
    const data = adminService.getAdminData()
    setAdminData(data)

    return () => window.removeEventListener('resize', checkScreenSize)
  }, [navigate])

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      try {
        await adminService.adminLogout()
        navigate('/admin/login')
      } catch (error) {
        console.error('Logout error:', error)
        // Clear auth even if API call fails
        adminService.clearAdminAuth()
        navigate('/admin/login')
      }
    }
  }

  const closeSidebar = () => {
    console.log('closeSidebar called, current state:', sidebarOpen) // Debug log
    setSidebarOpen(false)
    console.log('setSidebarOpen(false) called') // Debug log
  }

  if (!adminData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <AdminSidebar
          adminData={adminData}
          onLogout={handleLogout}
          isOpen={sidebarOpen}
          onClose={closeSidebar}
        />

        {/* Main Content */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Top Header - Mobile Only */}
          <div className="md:hidden bg-white shadow-sm border-b border-gray-200">
            <div className="flex items-center justify-between px-3 sm:px-4 h-14">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="text-sm sm:text-base font-semibold text-gray-900">Admin Panel</h1>
              <div className="w-8"></div>
            </div>
          </div>

          {/* Page Content */}
          <div className="flex-1 overflow-y-auto">
            <Routes>
              <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="/dashboard" element={<AdminDashboard />} />
              <Route path="/users" element={<UserManagement />} />
              <Route path="/freelancers" element={<FreelancerManagement />} />
              <Route path="/projects" element={<ProjectManagement />} />
              <Route path="/jobs" element={<JobManagement />} />
              <Route path="/bids" element={<BidManagement />} />
              <Route path="/permission-requests" element={<PermissionRequests />} />

              <Route path="/profile" element={<AdminProfile />} />
            </Routes>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminPanel