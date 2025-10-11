import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { jobService } from '../services/jobService'
import { applicationService } from '../services/applicationService'
import Button from '../components/Button'
import Header from '../components/Header'
import ApplicationForm from '../components/ApplicationForm'
import { useComprehensiveTranslation } from '../hooks/useComprehensiveTranslation'
import { isAuthenticated, getCurrentUser, clearAuth } from '../utils/api'

export default function JobDetail() {
  const { t } = useComprehensiveTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const [userData, setUserData] = useState(null)
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState(null)
  const [showApplicationForm, setShowApplicationForm] = useState(false)
  const [hasApplied, setHasApplied] = useState(false)
  const [isSaved, setIsSaved] = useState(false)

  useEffect(() => {
    checkAuth()
    fetchJobDetails()
  }, [id])

  const checkAuth = () => {
    if (!isAuthenticated()) {
      navigate('/login')
      return
    }
    const user = getCurrentUser()
    setUserData(user)
  }

  const handleLogout = () => {
    clearAuth()
    navigate('/login')
  }

  const fetchJobDetails = async () => {
    try {
      setLoading(true)
      const response = await jobService.getJobById(id)
      
      if (response.status) {
        setJob(response.data)
        setHasApplied(response.data.has_applied || false)
        setIsSaved(response.data.is_saved || false)
        checkExistingApplication(response.data._id)
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to fetch job details' })
      }
    } catch (error) {
      console.error('Error fetching job details:', error)
      setMessage({ type: 'error', text: 'Failed to fetch job details. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const checkExistingApplication = async (jobId) => {
    try {
      console.log('Checking for existing application for job:', jobId)
      console.log('User ID:', userData?._id)
      
      // Get user's applications to check if they've already applied for this job
      const applicationsResponse = await applicationService.getFreelancerApplications({
        page: 1,
        limit: 100 // Get all applications to check
      })
      
      if (applicationsResponse.status) {
        const existingApp = applicationsResponse.data.applications.find(app => 
          app.job_id === jobId || app.job_id._id === jobId
        )
        
        if (existingApp) {
          console.log('Found existing application:', existingApp)
          setHasApplied(true)
          setMessage({ 
            type: 'info', 
            text: `You have already applied for this job on ${new Date(existingApp.application_tracking.applied_at).toLocaleDateString()}. Status: ${existingApp.application_status}` 
          })
        } else {
          console.log('No existing application found')
          setHasApplied(false)
        }
      }
    } catch (error) {
      console.error('Error checking existing application:', error)
      // Don't set error message here as it's not critical
    }
  }

  const handleSaveJob = async () => {
    try {
      console.log('Saving job with ID:', id)
      const response = await applicationService.toggleJobSave(id)
      console.log('Save job response:', response)
      
      if (response.status) {
        setIsSaved(response.data.is_saved)
        setMessage({ 
          type: 'success', 
          text: response.data.is_saved ? 'Job saved successfully!' : 'Job unsaved successfully!' 
        })
      } else {
        // Handle specific error cases
        if (response.message === 'Only freelancers can save jobs') {
          setMessage({ type: 'error', text: 'Only freelancers can save jobs. Please log in as a freelancer.' })
        } else if (response.message === 'Cannot save inactive or closed jobs') {
          setMessage({ type: 'error', text: 'This job is no longer available for saving.' })
        } else if (response.error && response.error.includes('validation failed')) {
          setMessage({ 
            type: 'error', 
            text: 'Job save feature is temporarily unavailable due to a backend validation issue. Please try again later or contact support.' 
          })
        } else {
          setMessage({ type: 'error', text: response.message || 'Failed to save job' })
        }
      }
    } catch (error) {
      console.error('Error saving job:', error)
      setMessage({ type: 'error', text: 'Failed to save job. Please try again.' })
    }
  }

  const handleApplySuccess = () => {
    setHasApplied(true)
    setShowApplicationForm(false)
    setMessage({ type: 'success', text: 'Application submitted successfully!' })
  }

  const formatSalary = (salary) => {
    if (!salary.min_salary && !salary.max_salary) return 'Salary not specified'
    if (salary.min_salary === salary.max_salary) {
      return `${salary.currency} ${salary.min_salary.toLocaleString()} ${salary.salary_type}`
    }
    return `${salary.currency} ${salary.min_salary.toLocaleString()} - ${salary.max_salary.toLocaleString()} ${salary.salary_type}`
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getDaysUntilDeadline = (deadline) => {
    const now = new Date()
    const deadlineDate = new Date(deadline)
    const diffTime = deadlineDate - now
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const formatWebsiteUrl = (url) => {
    try {
      // Remove protocol and www for display
      const cleanUrl = url.replace(/^https?:\/\/(www\.)?/, '')
      return cleanUrl.length > 40 ? `${cleanUrl.substring(0, 40)}...` : cleanUrl
    } catch {
      return url.length > 40 ? `${url.substring(0, 40)}...` : url
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-gradient">
        <Header userData={userData} onLogout={handleLogout} />
        <main className="py-8 pt-24">
          <div className="max-w-6xl mx-auto px-4">
            <div className="card p-8 bg-white/95 rounded-3xl shadow-xl">
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
                <div className="space-y-4">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                  <div className="h-4 bg-gray-200 rounded w-4/6"></div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-brand-gradient">
        <Header userData={userData} onLogout={handleLogout} />
        <main className="py-8 pt-24">
          <div className="max-w-6xl mx-auto px-4">
            <div className="card p-8 bg-white/95 text-center">
              <h1 className="text-2xl font-bold text-graphite mb-4">Job Not Found</h1>
              <p className="text-coolgray mb-6">The job you're looking for doesn't exist or has been removed.</p>
              <Button onClick={() => navigate('/freelancer/jobs')}>
                Browse Jobs
              </Button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  const daysUntilDeadline = getDaysUntilDeadline(job.application_deadline)
  const isDeadlinePassed = daysUntilDeadline <= 0
  const canApply = !hasApplied && !isDeadlinePassed && job.status === 'active'

  return (
    <div className="min-h-screen bg-brand-gradient">
      <Header userData={userData} onLogout={handleLogout} />
      
      <main className="py-8 pt-24">
        <div className="max-w-6xl mx-auto px-4">
          {/* Back Button */}
          <div className="mb-6">
            <Button
              onClick={() => navigate('/freelancer/jobs')}
              variant="secondary"
              className="flex items-center gap-2 bg-white text-gray-800 border-gray-300 hover:bg-purple-600 hover:text-white hover:border-purple-600 rounded-xl px-6 py-3 font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Browse Jobs
            </Button>
          </div>

          <div className="card bg-white/95 rounded-3xl shadow-xl">
            {/* Header */}
            <div className="p-8 border-b border-gray-200">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-graphite mb-2">{job.job_title}</h1>
                  <div className="flex items-center space-x-4 text-coolgray mb-4">
                    <span className="font-medium">{job.company_info.company_name}</span>
                    <span>•</span>
                    <span>{job.location.city}, {job.location.country}</span>
                    <span>•</span>
                    <span className="capitalize">{job.work_mode}</span>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <span className={`px-3 py-1 text-sm rounded-full ${
                      job.job_type === 'full-time' ? 'bg-green-100 text-green-800' :
                      job.job_type === 'part-time' ? 'bg-yellow-100 text-yellow-800' :
                      job.job_type === 'contract' ? 'bg-blue-100 text-blue-800' :
                      job.job_type === 'freelance' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {job.job_type}
                    </span>
                    
                    <span className="text-lg font-semibold text-mint">
                      {formatSalary(job.salary)}
                    </span>
                    
                    <span className={`text-sm ${
                      isDeadlinePassed ? 'text-red-600' : 
                      daysUntilDeadline < 7 ? 'text-yellow-600' : 
                      'text-coolgray'
                    }`}>
                      {isDeadlinePassed ? 'Deadline passed' : `${daysUntilDeadline} days left`}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col space-y-3 ml-6">
                  <button
                    onClick={handleSaveJob}
                    className={`px-4 py-2 rounded-md transition-colors ${
                      isSaved 
                        ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200' 
                        : 'bg-gray-100 text-coolgray hover:bg-gray-200'
                    }`}
                  >
                    {isSaved ? '★ Saved' : '☆ Save Job'}
                  </button>
                  
                  {canApply && (
                    <Button
                      onClick={() => setShowApplicationForm(true)}
                      className="w-full bg-mint hover:bg-mint/90 text-white border-mint"
                    >
                      Apply Now
                    </Button>
                  )}
                  
                  {hasApplied && (
                    <div className="px-4 py-2 bg-blue-100 text-blue-800 rounded-md text-center">
                      ✓ Applied
                    </div>
                  )}
                  
                  {isDeadlinePassed && (
                    <div className="px-4 py-2 bg-red-100 text-red-800 rounded-md text-center">
                      Deadline Passed
                    </div>
                  )}
                </div>
              </div>

              {message && (
                <div className={`p-4 rounded-lg ${
                  message.type === 'success' 
                    ? 'bg-green-50 text-green-800 border border-green-200' 
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  {message.text}
                </div>
              )}
            </div>

            {/* Job Details */}
            <div className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                  {/* Job Description */}
                  <div>
                    <h2 className="text-xl font-semibold text-graphite mb-4">Job Description</h2>
                    <div className="prose max-w-none">
                      <p className="text-coolgray whitespace-pre-wrap">{job.job_description}</p>
                    </div>
                  </div>

                  {/* Required Skills */}
                  <div>
                    <h2 className="text-xl font-semibold text-graphite mb-4">Required Skills</h2>
                    <div className="flex flex-wrap gap-2">
                      {job.required_skills.map((skill, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-mint/10 text-mint text-sm rounded-full border border-mint/20"
                        >
                          {skill.skill} ({skill.proficiency_level})
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Experience Requirements */}
                  <div>
                    <h2 className="text-xl font-semibold text-graphite mb-4">Experience Requirements</h2>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-coolgray">
                        <strong>Experience:</strong> {job.experience_required.min_experience} - {job.experience_required.max_experience} years ({job.experience_required.experience_type})
                      </p>
                      {job.education_required.degree && (
                        <p className="text-coolgray mt-2">
                          <strong>Education:</strong> {job.education_required.degree} in {job.education_required.field}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Company Information */}
                  <div>
                    <h2 className="text-xl font-semibold text-graphite mb-4">About {job.company_info.company_name}</h2>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-coolgray mb-2">
                        <strong>Company Size:</strong> {job.company_info.company_size} employees
                      </p>
                      {job.company_info.company_website && (
                        <p className="text-coolgray mb-2">
                          <strong>Website:</strong> 
                          <a 
                            href={job.company_info.company_website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-mint hover:text-mint/80 ml-1 break-all"
                          >
                            {formatWebsiteUrl(job.company_info.company_website)}
                          </a>
                        </p>
                      )}
                      {job.company_info.company_description && (
                        <p className="text-coolgray">
                          {job.company_info.company_description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  {/* Job Overview */}
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-graphite mb-4">Job Overview</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-coolgray">Job Type:</span>
                        <span className="font-medium capitalize text-graphite">{job.job_type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-coolgray">Work Mode:</span>
                        <span className="font-medium capitalize text-graphite">{job.work_mode}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-coolgray">Duration:</span>
                        <span className="font-medium text-graphite">{job.job_duration}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-coolgray">Posted:</span>
                        <span className="font-medium text-graphite">{formatDate(job.created_at)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-coolgray">Deadline:</span>
                        <span className="font-medium text-graphite">{formatDate(job.application_deadline)}</span>
                      </div>
                      {job.job_start_date && (
                        <div className="flex justify-between">
                          <span className="text-coolgray">Start Date:</span>
                          <span className="font-medium text-graphite">{formatDate(job.job_start_date)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Job Stats */}
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-graphite mb-4">Job Statistics</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-coolgray">Views:</span>
                        <span className="font-medium text-graphite">{job.analytics?.total_views || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-coolgray">Applications:</span>
                        <span className="font-medium text-graphite">{job.analytics?.total_applications || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-coolgray">Saved:</span>
                        <span className="font-medium text-graphite">{job.analytics?.total_saves || 0}</span>
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-graphite mb-4">Contact Information</h3>
                    <div className="space-y-2">
                      <p className="text-coolgray">
                        <strong>Contact Person:</strong> {job.contact_info.contact_person}
                      </p>
                      <p className="text-coolgray">
                        <strong>Email:</strong> 
                        <a 
                          href={`mailto:${job.contact_info.contact_email}`}
                          className="text-mint hover:text-mint/80 ml-1 break-all"
                        >
                          {job.contact_info.contact_email}
                        </a>
                      </p>
                      {job.contact_info.contact_phone && (
                        <p className="text-coolgray">
                          <strong>Phone:</strong> 
                          <a 
                            href={`tel:${job.contact_info.contact_phone}`}
                            className="text-mint hover:text-mint/80 ml-1"
                          >
                            {job.contact_info.contact_phone}
                          </a>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Application Form Modal */}
      {showApplicationForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1100] p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-graphite">Apply for {job.job_title}</h2>
                <button
                  onClick={() => setShowApplicationForm(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6">
              <ApplicationForm
                job={job}
                onSuccess={handleApplySuccess}
                onCancel={() => setShowApplicationForm(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}