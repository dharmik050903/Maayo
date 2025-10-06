import React, { useState } from 'react'
import { applicationService } from '../services/applicationService'
import Button from './Button'
import { useComprehensiveTranslation } from '../hooks/useComprehensiveTranslation'

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

    if (job.application_settings.require_cover_letter && !formData.cover_letter.trim()) {
      newErrors.cover_letter = 'Cover letter is required for this job'
    }

    if (job.application_settings.require_resume_link && !formData.resume_link.url.trim()) {
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
      new URL(url)
      return true
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
      // Convert form data to match backend schema
      const applicationData = {
        ...formData,
        expected_salary: {
          amount: formData.expected_salary.amount ? parseInt(formData.expected_salary.amount) : null,
          currency: formData.expected_salary.currency,
          salary_type: formData.expected_salary.salary_type
        },
        availability: {
          ...formData.availability,
          start_date: formData.availability.start_date ? new Date(formData.availability.start_date) : null
        }
      }

      const response = await applicationService.applyForJob(job._id, applicationData)
      
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
      setMessage({ type: 'error', text: 'Failed to submit application. Please try again.' })
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
            {job.application_settings.require_resume_link && (
              <li>• Resume link is required</li>
            )}
            {job.application_settings.require_cover_letter && (
              <li>• Cover letter is required</li>
            )}
            {job.application_settings.allow_portfolio_links && (
              <li>• Portfolio links are optional</li>
            )}
            <li>• Maximum {job.application_settings.max_applications} applications allowed</li>
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
        {job.application_settings.require_cover_letter && (
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
        {job.application_settings.require_resume_link && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Resume Link *
            </label>
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
            {errors.resume_url && (
              <p className="text-red-500 text-sm mt-1">{errors.resume_url}</p>
            )}
          </div>
        )}

        {/* Portfolio Links */}
        {job.application_settings.allow_portfolio_links && (
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
              <option value="USD">USD</option>
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
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={loading}
            disabled={loading}
          >
            {loading ? 'Submitting...' : 'Submit Application'}
          </Button>
        </div>
      </form>
    </div>
  )
}
