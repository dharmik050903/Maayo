import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import Input from '../components/Input'
import Header from '../components/Header'
import { jobService } from '../services/jobService'
import { useComprehensiveTranslation } from '../hooks/useComprehensiveTranslation'
import { isAuthenticated, getCurrentUser, clearAuth } from '../utils/api'

export default function JobEditForm() {
  const { t } = useComprehensiveTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)
  const [errors, setErrors] = useState({})

  const [formData, setFormData] = useState({
    // Basic job information
    job_title: '',
    job_description: '',
    job_type: 'full-time',
    work_mode: 'remote',
    
    // Location
    location: {
      country: 'India',
      state: '',
      city: '',
      address: ''
    },
    
    // Salary
    salary: {
      min_salary: '',
      max_salary: '',
      currency: 'INR',
      salary_type: 'monthly'
    },
    
    // Skills
    required_skills: [],
    
    // Experience
    experience_required: {
      min_experience: 0,
      max_experience: 10,
      experience_type: 'any'
    },
    
    // Education
    education_required: {
      degree: '',
      field: '',
      minimum_grade: ''
    },
    
    // Timeline
    application_deadline: '',
    job_start_date: '',
    job_duration: 'permanent',
    
    // Application settings
    application_settings: {
      require_resume_link: true,
      allow_portfolio_links: true,
      require_cover_letter: false,
      max_applications: 100
    },
    
    // Company information
    company_info: {
      company_name: '',
      company_size: '1-10',
      company_website: '',
      company_description: ''
    },
    
    // Contact information
    contact_info: {
      contact_person: '',
      contact_email: '',
      contact_phone: '',
      alternate_email: ''
    }
  })

  const [newSkill, setNewSkill] = useState('')
  const [skillProficiency, setSkillProficiency] = useState('intermediate')

  useEffect(() => {
    // Check authentication
    if (!isAuthenticated()) {
      window.location.href = '/login'
      return
    }
    
    const user = getCurrentUser()
    setUserData(user)
    fetchJobDetails()
  }, [id])

  const handleLogout = () => {
    clearAuth()
    window.location.href = '/login'
  }

  const fetchJobDetails = async () => {
    try {
      setLoading(true)
      const response = await jobService.getJobById(id)
      
      if (response.status) {
        const job = response.data
        setFormData({
          job_title: job.job_title || '',
          job_description: job.job_description || '',
          job_type: job.job_type || 'full-time',
          work_mode: job.work_mode || 'remote',
          location: {
            country: job.location?.country || 'India',
            state: job.location?.state || '',
            city: job.location?.city || '',
            address: job.location?.address || ''
          },
          salary: {
            min_salary: job.salary?.min_salary || '',
            max_salary: job.salary?.max_salary || '',
            currency: job.salary?.currency || 'INR',
            salary_type: job.salary?.salary_type || 'monthly'
          },
          required_skills: job.required_skills || [],
          experience_required: {
            min_experience: job.experience_required?.min_experience || 0,
            max_experience: job.experience_required?.max_experience || 10,
            experience_type: job.experience_required?.experience_type || 'any'
          },
          education_required: {
            degree: job.education_required?.degree || '',
            field: job.education_required?.field || '',
            minimum_grade: job.education_required?.minimum_grade || ''
          },
          application_deadline: job.application_deadline ? new Date(job.application_deadline).toISOString().slice(0, 16) : '',
          job_start_date: job.job_start_date ? new Date(job.job_start_date).toISOString().slice(0, 10) : '',
          job_duration: job.job_duration || 'permanent',
          application_settings: {
            require_resume_link: job.application_settings?.require_resume_link ?? true,
            allow_portfolio_links: job.application_settings?.allow_portfolio_links ?? true,
            require_cover_letter: job.application_settings?.require_cover_letter ?? false,
            max_applications: job.application_settings?.max_applications || 100
          },
          company_info: {
            company_name: job.company_info?.company_name || '',
            company_size: job.company_info?.company_size || '1-10',
            company_website: job.company_info?.company_website || '',
            company_description: job.company_info?.company_description || ''
          },
          contact_info: {
            contact_person: job.contact_info?.contact_person || '',
            contact_email: job.contact_info?.contact_email || '',
            contact_phone: job.contact_info?.contact_phone || '',
            alternate_email: job.contact_info?.alternate_email || ''
          }
        })
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

  const handleAddSkill = () => {
    if (newSkill.trim() && !formData.required_skills.find(skill => skill.skill === newSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        required_skills: [
          ...prev.required_skills,
          {
            skill: newSkill.trim(),
            proficiency_level: skillProficiency
          }
        ]
      }))
      setNewSkill('')
    }
  }

  const handleRemoveSkill = (index) => {
    setFormData(prev => ({
      ...prev,
      required_skills: prev.required_skills.filter((_, i) => i !== index)
    }))
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.job_title.trim()) {
      newErrors.job_title = 'Job title is required'
    }

    if (!formData.job_description.trim()) {
      newErrors.job_description = 'Job description is required'
    }

    if (!formData.company_info.company_name.trim()) {
      newErrors.company_name = 'Company name is required'
    }

    if (!formData.contact_info.contact_person.trim()) {
      newErrors.contact_person = 'Contact person is required'
    }

    if (!formData.contact_info.contact_email.trim()) {
      newErrors.contact_email = 'Contact email is required'
    }

    if (!formData.application_deadline) {
      newErrors.application_deadline = 'Application deadline is required'
    }

    if (formData.salary.min_salary && formData.salary.max_salary) {
      if (parseInt(formData.salary.min_salary) >= parseInt(formData.salary.max_salary)) {
        newErrors.salary = 'Minimum salary must be less than maximum salary'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      setMessage({ type: 'error', text: 'Please fix the errors below' })
      return
    }

    setSaving(true)
    setMessage(null)

    try {
      // Convert form data to match backend schema
      const jobData = {
        ...formData,
        salary: {
          min_salary: parseInt(formData.salary.min_salary) || 0,
          max_salary: parseInt(formData.salary.max_salary) || 0,
          currency: formData.salary.currency,
          salary_type: formData.salary.salary_type
        },
        experience_required: {
          min_experience: parseInt(formData.experience_required.min_experience) || 0,
          max_experience: parseInt(formData.experience_required.max_experience) || 10,
          experience_type: formData.experience_required.experience_type
        },
        application_deadline: new Date(formData.application_deadline),
        job_start_date: formData.job_start_date ? new Date(formData.job_start_date) : null
      }

      const response = await jobService.updateJob(id, jobData)
      
      if (response.status) {
        setMessage({ type: 'success', text: 'Job updated successfully!' })
        setTimeout(() => {
          navigate('/client/jobs')
        }, 1500)
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to update job' })
      }
    } catch (error) {
      console.error('Error updating job:', error)
      setMessage({ type: 'error', text: 'Failed to update job. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  if (loading && !userData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-brand-gradient text-white">
      <Header 
        userType="client" 
        onLogout={handleLogout} 
        userData={userData}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-6 pt-20 pb-8">
        <div className="card bg-white/95 rounded-lg shadow-sm p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-graphite mb-2">Edit Job</h1>
            <p className="text-coolgray">Update your job posting details</p>
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

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-graphite border-b pb-2">Basic Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Input
                    label="Job Title *"
                    type="text"
                    value={formData.job_title}
                    onChange={(e) => handleInputChange('job_title', e.target.value)}
                    placeholder="e.g., Senior React Developer"
                    error={errors.job_title}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-graphite mb-2">Job Type *</label>
                  <select
                    value={formData.job_type}
                    onChange={(e) => handleInputChange('job_type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mint text-graphite bg-white"
                  >
                    <option value="full-time">Full-time</option>
                    <option value="part-time">Part-time</option>
                    <option value="contract">Contract</option>
                    <option value="freelance">Freelance</option>
                    <option value="internship">Internship</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-graphite mb-2">Job Description *</label>
                <textarea
                  value={formData.job_description}
                  onChange={(e) => handleInputChange('job_description', e.target.value)}
                  placeholder="Describe the role, responsibilities, and requirements..."
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mint text-graphite bg-white"
                />
                {errors.job_description && (
                  <p className="text-red-500 text-sm mt-1">{errors.job_description}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-graphite mb-2">Work Mode *</label>
                  <select
                    value={formData.work_mode}
                    onChange={(e) => handleInputChange('work_mode', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mint text-graphite bg-white"
                  >
                    <option value="remote">Remote</option>
                    <option value="onsite">On-site</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-graphite mb-2">Job Duration</label>
                  <select
                    value={formData.job_duration}
                    onChange={(e) => handleInputChange('job_duration', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mint text-graphite bg-white"
                  >
                    <option value="1-3 months">1-3 months</option>
                    <option value="3-6 months">3-6 months</option>
                    <option value="6-12 months">6-12 months</option>
                    <option value="1+ years">1+ years</option>
                    <option value="permanent">Permanent</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-graphite border-b pb-2">Location</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Input
                    label="Country"
                    type="text"
                    value={formData.location.country}
                    onChange={(e) => handleInputChange('location.country', e.target.value)}
                    placeholder="India"
                  />
                </div>
                
                <div>
                  <Input
                    label="State"
                    type="text"
                    value={formData.location.state}
                    onChange={(e) => handleInputChange('location.state', e.target.value)}
                    placeholder="Maharashtra"
                  />
                </div>
                
                <div>
                  <Input
                    label="City *"
                    type="text"
                    value={formData.location.city}
                    onChange={(e) => handleInputChange('location.city', e.target.value)}
                    placeholder="Mumbai"
                  />
                </div>
              </div>
            </div>

            {/* Salary */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-graphite border-b pb-2">Salary Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <Input
                    label="Min Salary"
                    type="number"
                    value={formData.salary.min_salary}
                    onChange={(e) => handleInputChange('salary.min_salary', e.target.value)}
                    placeholder="50000"
                  />
                </div>
                
                <div>
                  <Input
                    label="Max Salary"
                    type="number"
                    value={formData.salary.max_salary}
                    onChange={(e) => handleInputChange('salary.max_salary', e.target.value)}
                    placeholder="80000"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-graphite mb-2">Currency</label>
                  <select
                    value={formData.salary.currency}
                    onChange={(e) => handleInputChange('salary.currency', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mint text-graphite bg-white"
                  >
                    <option value="INR">INR</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-graphite mb-2">Salary Type</label>
                  <select
                    value={formData.salary.salary_type}
                    onChange={(e) => handleInputChange('salary.salary_type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mint text-graphite bg-white"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                    <option value="hourly">Hourly</option>
                    <option value="project-based">Project-based</option>
                  </select>
                </div>
              </div>
              {errors.salary && (
                <p className="text-red-500 text-sm">{errors.salary}</p>
              )}
            </div>

            {/* Required Skills */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-graphite border-b pb-2">Required Skills</h2>
              
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    label="Add Skill"
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    placeholder="e.g., React, JavaScript"
                  />
                </div>
                
                <div className="w-40">
                  <label className="block text-sm font-medium text-graphite mb-2">Proficiency</label>
                  <select
                    value={skillProficiency}
                    onChange={(e) => setSkillProficiency(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mint text-graphite bg-white"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                    <option value="expert">Expert</option>
                  </select>
                </div>
                
                <div className="flex items-end">
                  <Button
                    type="button"
                    onClick={handleAddSkill}
                    variant="secondary"
                    disabled={!newSkill.trim()}
                  >
                    Add
                  </Button>
                </div>
              </div>

              {formData.required_skills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.required_skills.map((skill, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                    >
                      {skill.skill} ({skill.proficiency_level})
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(index)}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Experience Requirements */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-graphite border-b pb-2">Experience Requirements</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Input
                    label="Min Experience (years)"
                    type="number"
                    value={formData.experience_required.min_experience}
                    onChange={(e) => handleInputChange('experience_required.min_experience', e.target.value)}
                    placeholder="0"
                  />
                </div>
                
                <div>
                  <Input
                    label="Max Experience (years)"
                    type="number"
                    value={formData.experience_required.max_experience}
                    onChange={(e) => handleInputChange('experience_required.max_experience', e.target.value)}
                    placeholder="10"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-graphite mb-2">Experience Type</label>
                  <select
                    value={formData.experience_required.experience_type}
                    onChange={(e) => handleInputChange('experience_required.experience_type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mint text-graphite bg-white"
                  >
                    <option value="any">Any Experience</option>
                    <option value="relevant">Relevant Experience</option>
                    <option value="total">Total Experience</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-graphite border-b pb-2">Timeline</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Input
                    label="Application Deadline *"
                    type="datetime-local"
                    value={formData.application_deadline}
                    onChange={(e) => handleInputChange('application_deadline', e.target.value)}
                    error={errors.application_deadline}
                  />
                </div>
                
                <div>
                  <Input
                    label="Job Start Date"
                    type="date"
                    value={formData.job_start_date}
                    onChange={(e) => handleInputChange('job_start_date', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Company Information */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-graphite border-b pb-2">Company Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Input
                    label="Company Name *"
                    type="text"
                    value={formData.company_info.company_name}
                    onChange={(e) => handleInputChange('company_info.company_name', e.target.value)}
                    placeholder="Your Company Name"
                    error={errors.company_name}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-graphite mb-2">Company Size</label>
                  <select
                    value={formData.company_info.company_size}
                    onChange={(e) => handleInputChange('company_info.company_size', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mint text-graphite bg-white"
                  >
                    <option value="1-10">1-10 employees</option>
                    <option value="11-50">11-50 employees</option>
                    <option value="51-200">51-200 employees</option>
                    <option value="201-500">201-500 employees</option>
                    <option value="501-1000">501-1000 employees</option>
                    <option value="1000+">1000+ employees</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Input
                    label="Company Website"
                    type="url"
                    value={formData.company_info.company_website}
                    onChange={(e) => handleInputChange('company_info.company_website', e.target.value)}
                    placeholder="https://yourcompany.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-graphite mb-2">Company Description</label>
                <textarea
                  value={formData.company_info.company_description}
                  onChange={(e) => handleInputChange('company_info.company_description', e.target.value)}
                  placeholder="Brief description of your company..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mint text-graphite bg-white"
                />
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-graphite border-b pb-2">Contact Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Input
                    label="Contact Person *"
                    type="text"
                    value={formData.contact_info.contact_person}
                    onChange={(e) => handleInputChange('contact_info.contact_person', e.target.value)}
                    placeholder="John Doe"
                    error={errors.contact_person}
                  />
                </div>
                
                <div>
                  <Input
                    label="Contact Email *"
                    type="email"
                    value={formData.contact_info.contact_email}
                    onChange={(e) => handleInputChange('contact_info.contact_email', e.target.value)}
                    placeholder="john@company.com"
                    error={errors.contact_email}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Input
                    label="Contact Phone"
                    type="tel"
                    value={formData.contact_info.contact_phone}
                    onChange={(e) => handleInputChange('contact_info.contact_phone', e.target.value)}
                    placeholder="+91 9876543210"
                  />
                </div>
                
                <div>
                  <Input
                    label="Alternate Email"
                    type="email"
                    value={formData.contact_info.alternate_email}
                    onChange={(e) => handleInputChange('contact_info.alternate_email', e.target.value)}
                    placeholder="hr@company.com"
                  />
                </div>
              </div>
            </div>

            {/* Application Settings */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-graphite border-b pb-2">Application Settings</h2>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="require_resume"
                    checked={formData.application_settings.require_resume_link}
                    onChange={(e) => handleInputChange('application_settings.require_resume_link', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="require_resume" className="ml-2 block text-sm text-graphite">
                    Require resume link
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="allow_portfolio"
                    checked={formData.application_settings.allow_portfolio_links}
                    onChange={(e) => handleInputChange('application_settings.allow_portfolio_links', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="allow_portfolio" className="ml-2 block text-sm text-graphite">
                    Allow portfolio links
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="require_cover_letter"
                    checked={formData.application_settings.require_cover_letter}
                    onChange={(e) => handleInputChange('application_settings.require_cover_letter', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="require_cover_letter" className="ml-2 block text-sm text-graphite">
                    Require cover letter
                  </label>
                </div>
              </div>

              <div>
                <Input
                  label="Maximum Applications"
                  type="number"
                  value={formData.application_settings.max_applications}
                  onChange={(e) => handleInputChange('application_settings.max_applications', e.target.value)}
                  placeholder="100"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/client/jobs')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={saving}
                disabled={saving}
              >
                {saving ? 'Updating Job...' : 'Update Job'}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
