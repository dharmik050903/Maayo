import React, { useState, useEffect } from 'react'
import { applicationService } from '../services/applicationService'
import Button from './Button'
import { useComprehensiveTranslation } from '../hooks/useComprehensiveTranslation'
import { authenticatedFetch, getCurrentUser } from '../utils/api'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

export default function ApplicationForm({ job, onSuccess, onCancel }) {
  const { t } = useComprehensiveTranslation()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [errors, setErrors] = useState({})

  const [formData, setFormData] = useState({
    cover_letter: '',
    resume_link: {
      url: '',
      title: 'Resume',
      description: ''
    },
    portfolio_links: [],
    expected_salary: {
      amount: '',
      currency: 'INR',
      salary_type: 'monthly'
    },
    availability: {
      start_date: '',
      notice_period: '1 month',
      working_hours: 'full-time'
    }
  })

  const [newPortfolioLink, setNewPortfolioLink] = useState({
    title: '',
    url: '',
    description: ''
  })

  // Fetch freelancer's resume link on component mount
  useEffect(() => {
    const fetchFreelancerResumeLink = async () => {
      try {
        // First try to get from localStorage
        const savedProfile = localStorage.getItem('freelancer_profile_data')
        if (savedProfile) {
          const profileData = JSON.parse(savedProfile)
          if (profileData.resume_link) {
            setFormData(prev => ({
              ...prev,
              resume_link: {
                ...prev.resume_link,
                url: profileData.resume_link,
                title: 'Resume',
                description: 'Resume from profile'
              }
            }))
            return
          }
        }

        // If not in localStorage, try to fetch from database
        const userData = getCurrentUser()
        if (userData && userData._id) {
          const response = await authenticatedFetch(`${API_BASE_URL}/freelancer/info`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'user_role': 'freelancer'
            },
            body: JSON.stringify({
              id: userData._id,
              user_role: 'freelancer'
            })
          })

          if (response.ok) {
            const data = await response.json()
            if (data.status && data.data && data.data.resume_link) {
              setFormData(prev => ({
                ...prev,
                resume_link: {
                  ...prev.resume_link,
                  url: data.data.resume_link,
                  title: 'Resume',
                  description: 'Resume from profile'
                }
              }))
            }
          }
        }
      } catch (error) {
        console.error('Error fetching freelancer resume link:', error)
        // Silently fail - user can still manually enter resume link
      }
    }

    fetchFreelancerResumeLink()
  }, [])

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.')
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }))
    }
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }))
    }
  }

  const handleAddPortfolioLink = () => {
    if (newPortfolioLink.title.trim() && newPortfolioLink.url.trim()) {
      setFormData(prev => ({
        ...prev,
        portfolio_links: [...prev.portfolio_links, { ...newPortfolioLink }]
      }))
      setNewPortfolioLink({ title: '', url: '', description: '' })
    }
  }

  const handleRemovePortfolioLink = (index) => {
    setFormData(prev => ({
      ...prev,
      portfolio_links: prev.portfolio_links.filter((_, i) => i !== index)
    }))
  }

  const validateForm = () => {
    const newErrors = {}

    if (job.application_settings?.require_cover_letter && !formData.cover_letter.trim()) {
      newErrors.cover_letter = 'Cover letter is required for this job'
    }

    if (job.application_settings?.require_resume_link && !formData.resume_link.url.trim()) {
      newErrors.resume_url = 'Resume link is required for this job'
    }

    if (formData.resume_link.url.trim() && !isValidUrl(formData.resume_link.url)) {
      newErrors.resume_url = 'Please provide a valid resume URL'
    }

    formData.portfolio_links.forEach((link, index) => {
      if (!isValidUrl(link.url)) {
        newErrors[`portfolio_url_${index}`] = 'Please provide a valid URL'
      }
    })

    if (formData.expected_salary.amount && formData.expected_salary.amount < 0) {
      newErrors.expected_salary = 'Expected salary must be a positive number'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const isValidUrl = (url) => {
    try {
      const urlObj = new URL(url)
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:'
    } catch {
      return false
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      setMessage({ type: 'error', text: 'Please fix the errors below' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
          // Clean and prepare data for backend
      const applicationData = {
            // Basic application info
            cover_letter: formData.cover_letter.trim() || undefined,
            
            // Resume link - only include if URL is provided
            resume_link: formData.resume_link.url.trim() ? {
              url: formData.resume_link.url.trim(),
              title: formData.resume_link.title.trim() || 'Resume',
              description: formData.resume_link.description.trim() || undefined
            } : undefined,
            
            // Portfolio links - filter out empty ones
            portfolio_links: formData.portfolio_links.filter(link => 
              link.url.trim() && link.title.trim()
            ).map(link => ({
              title: link.title.trim(),
              url: link.url.trim(),
              description: link.description.trim() || undefined
            })),
            
            // Expected salary - only include if amount is provided
            expected_salary: formData.expected_salary.amount ? {
              amount: parseInt(formData.expected_salary.amount),
          currency: formData.expected_salary.currency,
          salary_type: formData.expected_salary.salary_type
            } : undefined,
            
            // Availability
        availability: {
              start_date: formData.availability.start_date ? new Date(formData.availability.start_date).toISOString() : undefined,
              notice_period: formData.availability.notice_period,
              working_hours: formData.availability.working_hours
            }
          }

          // Remove undefined values to avoid sending empty fields
          Object.keys(applicationData).forEach(key => {
            if (applicationData[key] === undefined) {
              delete applicationData[key]
            }
          })

          console.log('Submitting application with data:', applicationData)
          console.log('Job ID:', job._id)
          console.log('Job application settings:', job.application_settings)
          console.log('User ID from localStorage:', localStorage.getItem('userId'))

      const response = await applicationService.applyForJob(job._id, applicationData)
          
          console.log('Application response:', response)
      
      if (response.status) {
        setMessage({ type: 'success', text: 'Application submitted successfully!' })
        setTimeout(() => {
          onSuccess()
        }, 1500)
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to submit application' })
      }
    } catch (error) {
      console.error('Error submitting application:', error)
          console.error('Error details:', error.response)
          
          let errorMessage = 'Failed to submit application. Please try again.'
          
          if (error.response) {
            try {
              const errorData = await error.response.json()
              errorMessage = errorData.message || errorMessage
              console.log('Error data:', errorData)
              
              // Provide specific error messages
              if (errorData.message === 'You have already applied for this job') {
                errorMessage = 'You have already applied for this job. Please check your applications or contact support if this is incorrect.'
              } else if (errorData.message.includes('required')) {
                errorMessage = `Missing required information: ${errorData.message}`
              } else if (errorData.message.includes('invalid')) {
                errorMessage = `Invalid data provided: ${errorData.message}`
              }
            } catch (parseError) {
              console.error('Error parsing error response:', parseError)
            }
          }
          
          setMessage({ type: 'error', text: errorMessage })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Application Requirements</h3>
        <div className="bg-blue-50 p-4 rounded-lg">
          <ul className="text-sm text-blue-800 space-y-1">
            {job.application_settings?.require_resume_link && (
              <li>• Resume link is required</li>
            )}
            {job.application_settings?.require_cover_letter && (
              <li>• Cover letter is required</li>
            )}
            {job.application_settings?.allow_portfolio_links && (
              <li>• Portfolio links are optional</li>
            )}
            <li>• Maximum {job.application_settings?.max_applications || 'unlimited'} applications allowed</li>
          </ul>
        </div>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Cover Letter */}
        {job.application_settings?.require_cover_letter && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cover Letter *
            </label>
            <textarea
              value={formData.cover_letter}
              onChange={(e) => handleInputChange('cover_letter', e.target.value)}
              placeholder="Write a compelling cover letter explaining why you're the right fit for this job..."
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.cover_letter && (
              <p className="text-red-500 text-sm mt-1">{errors.cover_letter}</p>
            )}
          </div>
        )}

        {/* Resume Link */}
        {job.application_settings?.require_resume_link && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Resume Link *
            </label>
            
            {/* Show auto-populated resume link if available */}
            {formData.resume_link.url ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-green-800 font-medium mb-1">
                      ✓ Resume link automatically loaded from your profile
                    </p>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">Title:</span>
                      <span className="text-sm font-medium text-gray-800">{formData.resume_link.title}</span>
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-sm text-gray-600">URL:</span>
                      <a 
                        href={formData.resume_link.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800 underline"
                      >
                        {formData.resume_link.url.length > 50 ? 
                          `${formData.resume_link.url.substring(0, 50)}...` : 
                          formData.resume_link.url
                        }
                      </a>
                    </div>
                    {formData.resume_link.description && (
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-sm text-gray-600">Description:</span>
                        <span className="text-sm text-gray-700">{formData.resume_link.description}</span>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      resume_link: { url: '', title: 'Resume', description: '' }
                    }))}
                    className="text-sm text-gray-500 hover:text-gray-700 underline"
                  >
                    Change
                  </button>
                </div>
              </div>
            ) : (
              /* Show input fields only if no resume link is available */
              <div className="space-y-3">
                <input
                  type="url"
                  value={formData.resume_link.url}
                  onChange={(e) => handleInputChange('resume_link.url', e.target.value)}
                  placeholder="https://drive.google.com/file/d/your-resume/view"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  value={formData.resume_link.title}
                  onChange={(e) => handleInputChange('resume_link.title', e.target.value)}
                  placeholder="Resume Title"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <textarea
                  value={formData.resume_link.description}
                  onChange={(e) => handleInputChange('resume_link.description', e.target.value)}
                  placeholder="Brief description of your resume"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
            
            {errors.resume_url && (
              <p className="text-red-500 text-sm mt-1">{errors.resume_url}</p>
            )}
          </div>
        )}

        {/* Portfolio Links */}
        {job.application_settings?.allow_portfolio_links && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Portfolio Links
            </label>
            
            {/* Add Portfolio Link */}
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                <input
                  type="text"
                  value={newPortfolioLink.title}
                  onChange={(e) => setNewPortfolioLink(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Portfolio Title"
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="url"
                  value={newPortfolioLink.url}
                  onChange={(e) => setNewPortfolioLink(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="https://yourportfolio.com"
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Button
                  type="button"
                  onClick={handleAddPortfolioLink}
                  variant="secondary"
                  disabled={!newPortfolioLink.title.trim() || !newPortfolioLink.url.trim()}
                >
                  Add Link
                </Button>
              </div>
              <textarea
                value={newPortfolioLink.description}
                onChange={(e) => setNewPortfolioLink(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of this portfolio piece"
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Portfolio Links List */}
            {formData.portfolio_links.length > 0 && (
              <div className="space-y-2">
                {formData.portfolio_links.map((link, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">{link.title}</span>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          View →
                        </a>
                      </div>
                      {link.description && (
                        <p className="text-sm text-gray-600 mt-1">{link.description}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemovePortfolioLink(index)}
                      className="text-red-600 hover:text-red-800 ml-2"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Expected Salary */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Expected Salary (Optional)
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="number"
              value={formData.expected_salary.amount}
              onChange={(e) => handleInputChange('expected_salary.amount', e.target.value)}
              placeholder="60000"
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={formData.expected_salary.currency}
              onChange={(e) => handleInputChange('expected_salary.currency', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="INR">INR</option>
              <option value="EUR">EUR</option>
            </select>
            <select
              value={formData.expected_salary.salary_type}
              onChange={(e) => handleInputChange('expected_salary.salary_type', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
              <option value="hourly">Hourly</option>
              <option value="project-based">Project-based</option>
            </select>
          </div>
          {errors.expected_salary && (
            <p className="text-red-500 text-sm mt-1">{errors.expected_salary}</p>
          )}
        </div>

        {/* Availability */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Availability
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Start Date</label>
              <input
                type="date"
                value={formData.availability.start_date}
                onChange={(e) => handleInputChange('availability.start_date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Notice Period</label>
              <select
                value={formData.availability.notice_period}
                onChange={(e) => handleInputChange('availability.notice_period', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="immediate">Immediate</option>
                <option value="1 week">1 week</option>
                <option value="2 weeks">2 weeks</option>
                <option value="1 month">1 month</option>
                <option value="2 months">2 months</option>
                <option value="3+ months">3+ months</option>
              </select>
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-3 pt-6 border-t">
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={loading}
            className="px-6 py-3 border-2 border-gray-300 text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 font-semibold"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={loading}
            disabled={loading}
            className="px-6 py-3 bg-mint text-white hover:bg-mint/90 border-2 border-mint hover:border-mint/80 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? 'Submitting...' : 'Submit Application'}
          </Button>
        </div>
      </form>
    </div>
  )
}

