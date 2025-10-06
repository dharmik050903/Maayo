import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from './Button'
import Input from './Input'
import Header from './Header'
import { jobService } from '../services/jobService'
import { skillsService } from '../services/skillsService'
import { useComprehensiveTranslation } from '../hooks/useComprehensiveTranslation'
import { isAuthenticated, getCurrentUser, clearAuth } from '../utils/api'

export default function JobCreateForm() {
  const { t } = useComprehensiveTranslation()
  const navigate = useNavigate()
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(false)
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
  const [availableSkills, setAvailableSkills] = useState([])
  const [skillSearchQuery, setSkillSearchQuery] = useState('')
  const [showSkillSuggestions, setShowSkillSuggestions] = useState(false)
  const [loadingSkills, setLoadingSkills] = useState(false)
  const [deadlineType, setDeadlineType] = useState('date') // 'date' or 'datetime'

  useEffect(() => {
    // Check authentication
    if (!isAuthenticated()) {
      window.location.href = '/login'
      return
    }
    
    const user = getCurrentUser()
    setUserData(user)
    loadSkills()
  }, [])

  const loadSkills = async () => {
    try {
      setLoadingSkills(true)
      const response = await skillsService.getSkills()
      if (response.success) {
        setAvailableSkills(response.data || [])
      }
    } catch (error) {
      console.error('Error loading skills:', error)
    } finally {
      setLoadingSkills(false)
    }
  }

  const handleSkillSearch = async (query) => {
    setSkillSearchQuery(query)
    if (query.length > 1) {
      try {
        const response = await skillsService.searchSkills(query)
        if (response.success) {
          setAvailableSkills(response.data || [])
          setShowSkillSuggestions(true)
        }
      } catch (error) {
        console.error('Error searching skills:', error)
      }
    } else {
      loadSkills()
      setShowSkillSuggestions(false)
    }
  }

  const handleSelectSkill = (skill) => {
    setNewSkill(skill.skill)
    setShowSkillSuggestions(false)
    setSkillSearchQuery('')
  }

  const handleDeadlineTypeChange = (type) => {
    setDeadlineType(type)
    // Clear the deadline value when switching types to avoid format conflicts
    setFormData(prev => ({
      ...prev,
      application_deadline: ''
    }))
  }

  const handleLogout = () => {
    clearAuth()
    window.location.href = '/login'
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
      setSkillSearchQuery('')
      setShowSkillSuggestions(false)
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

    if (!formData.contact_info.contact_phone.trim()) {
      newErrors.contact_phone = 'Contact phone is required'
    }

    if (!formData.application_deadline) {
      newErrors.application_deadline = 'Application deadline is required'
    }

    // Location validation
    if (!formData.location.country.trim()) {
      newErrors.country = 'Country is required'
    }

    // Skills validation
    if (formData.required_skills.length === 0) {
      newErrors.required_skills = 'At least one skill is required'
    }

    // Company website validation
    if (!formData.company_info.company_website.trim()) {
      newErrors.company_website = 'Company website is required'
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

    setLoading(true)
    setMessage(null)

    try {
      // Convert form data to match backend schema
      const jobData = {
        ...formData,
        status: 'active', // Set as active so it's immediately visible to freelancers
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

      console.log('🚀 Creating job with data:', jobData)
      console.log('🚀 Job status being sent:', jobData.status)
      const response = await jobService.createJob(jobData)
      console.log('📋 Job creation response:', response)
      console.log('📋 Created job status:', response.data?.status)
      
      if (response.status) {
        setMessage({ type: 'success', text: 'Job posted successfully!' })
        setTimeout(() => {
          navigate('/client/jobs')
        }, 1500)
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to create job' })
      }
    } catch (error) {
      console.error('Error creating job:', error)
      setMessage({ type: 'error', text: 'Failed to create job. Please try again.' })
    } finally {
      setLoading(false)
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
          <div className="mb-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold leading-tight text-graphite mb-2">
              Post a New <span className="text-mint">Job</span>
            </h1>
            <p className="text-lg text-coolgray">Create a job posting to attract talented freelancers</p>
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
                    label="Country *"
                    type="text"
                    value={formData.location.country}
                    onChange={(e) => handleInputChange('location.country', e.target.value)}
                    placeholder="India"
                  />
                  {errors.country && (
                    <p className="text-red-500 text-sm mt-1">{errors.country}</p>
                  )}
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
              <h2 className="text-xl font-semibold text-graphite border-b pb-2">Required Skills *</h2>
              
              {/* Skill Input Section */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  {/* Skill Search/Input */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-graphite mb-2">Add Skill</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={newSkill}
                        onChange={(e) => {
                          setNewSkill(e.target.value)
                          handleSkillSearch(e.target.value)
                        }}
                        onFocus={() => {
                          if (availableSkills.length > 0) {
                            setShowSkillSuggestions(true)
                          }
                        }}
                        placeholder="Search or type a skill (e.g., React, JavaScript)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mint text-graphite bg-white"
                      />
                      
                      {/* Skill Suggestions Dropdown */}
                      {showSkillSuggestions && availableSkills.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                          {availableSkills.slice(0, 10).map((skill, index) => (
                            <div
                              key={skill._id || index}
                              onClick={() => handleSelectSkill(skill)}
                              className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-graphite border-b border-gray-100 last:border-b-0"
                            >
                              <div className="font-medium">{skill.skill}</div>
                              {skill.category && (
                                <div className="text-xs text-coolgray">{skill.category}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Proficiency Level */}
                  <div>
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
                </div>
                
                {/* Add Button */}
                <div className="flex justify-center">
                  <Button
                    type="button"
                    onClick={handleAddSkill}
                    variant="secondary"
                    disabled={!newSkill.trim()}
                    className="px-6 py-2"
                  >
                    Add Skill
                  </Button>
                </div>
              </div>

              {/* Selected Skills Display */}
              {formData.required_skills.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-graphite">Selected Skills ({formData.required_skills.length})</h3>
                  <div className="flex flex-wrap gap-2">
                    {formData.required_skills.map((skill, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-mint/20 text-mint border border-mint/30"
                      >
                        <span className="font-medium">{skill.skill}</span>
                        <span className="ml-2 text-xs bg-mint/30 px-2 py-0.5 rounded-full">
                          {skill.proficiency_level}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(index)}
                          className="ml-2 text-mint hover:text-red-600 transition-colors"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {errors.required_skills && (
                <p className="text-red-500 text-sm">{errors.required_skills}</p>
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
              
              <div className="space-y-4">
                {/* Deadline Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-graphite mb-3">Deadline Type</label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="deadlineType"
                        value="date"
                        checked={deadlineType === 'date'}
                        onChange={(e) => handleDeadlineTypeChange(e.target.value)}
                        className="mr-2 text-mint focus:ring-mint"
                      />
                      <span className="text-graphite">Date Only</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="deadlineType"
                        value="datetime"
                        checked={deadlineType === 'datetime'}
                        onChange={(e) => handleDeadlineTypeChange(e.target.value)}
                        className="mr-2 text-mint focus:ring-mint"
                      />
                      <span className="text-graphite">Date & Time</span>
                    </label>
                  </div>
                </div>

                {/* Deadline Input */}
                <div>
                  <Input
                    label="Application Deadline *"
                    type={deadlineType === 'datetime' ? 'datetime-local' : 'date'}
                    value={formData.application_deadline}
                    onChange={(e) => handleInputChange('application_deadline', e.target.value)}
                    error={errors.application_deadline}
                    placeholder={deadlineType === 'datetime' ? 'Select date and time' : 'Select date'}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Input
                    label="Job Start Date"
                    type="date"
                    value={formData.job_start_date}
                    onChange={(e) => handleInputChange('job_start_date', e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-graphite mb-2">Job Duration</label>
                  <select
                    value={formData.job_duration}
                    onChange={(e) => handleInputChange('job_duration', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mint text-graphite bg-white"
                  >
                    <option value="permanent">Permanent</option>
                    <option value="contract">Contract</option>
                    <option value="temporary">Temporary</option>
                    <option value="project-based">Project-based</option>
                  </select>
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
                    label="Company Website *"
                    type="url"
                    value={formData.company_info.company_website}
                    onChange={(e) => handleInputChange('company_info.company_website', e.target.value)}
                    placeholder="https://yourcompany.com"
                  />
                  {errors.company_website && (
                    <p className="text-red-500 text-sm mt-1">{errors.company_website}</p>
                  )}
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
                    label="Contact Phone *"
                    type="tel"
                    value={formData.contact_info.contact_phone}
                    onChange={(e) => handleInputChange('contact_info.contact_phone', e.target.value)}
                    placeholder="+91 9876543210"
                  />
                  {errors.contact_phone && (
                    <p className="text-red-500 text-sm mt-1">{errors.contact_phone}</p>
                  )}
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
                loading={loading}
                disabled={loading}
              >
                {loading ? 'Creating Job...' : 'Post Job'}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
