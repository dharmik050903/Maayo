import { useState, useEffect, useRef } from 'react'
import Button from './Button'
import Input from './Input'
import { projectService } from '../services/projectService'
import { skillsService } from '../services/skillsService'

export default function ProjectForm({ project = null, onSuccess, onCancel }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    budget: '',
    duration: '',
    skills_required: [],
    bid_deadline: '',
    min_bid_amount: '',
    max_bid_amount: ''
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [availableSkills, setAvailableSkills] = useState([])
  const [selectedSkills, setSelectedSkills] = useState([])
  const [skillSearch, setSkillSearch] = useState('')
  const hasInitialized = useRef(false)

  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true
      console.log('ProjectForm: useEffect running (first time)')
      loadSkills()
      if (project) {
        setForm({
          title: project.title || '',
          description: project.description || '',
        budget: project.budget || '',
        duration: project.duration || '',
        skills_required: project.skills_required || [],
        bid_deadline: project.bid_deadline || '',
        min_bid_amount: project.min_bid_amount || '',
        max_bid_amount: project.max_bid_amount || ''
      })
      setSelectedSkills(project.skills_required || [])
      }
    } else {
      console.log('ProjectForm: Skipping duplicate initialization due to StrictMode')
    }
  }, [project])

  const loadSkills = async () => {
    try {
      const response = await skillsService.getSkills()
      if (response.data && Array.isArray(response.data)) {
        setAvailableSkills(response.data)
      }
    } catch (error) {
      console.error('Error loading skills:', error)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm({ ...form, [name]: value })
    
    // Clear field error when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: false })
    }
  }

  const handleSkillSearch = (e) => {
    setSkillSearch(e.target.value)
  }

  const handleSkillToggle = (skill) => {
    const skillData = {
      skill: skill.skill,
      skill_id: skill._id
    }
    
    setSelectedSkills(prev => {
      const isSelected = prev.find(s => s.skill_id === skill._id)
      if (isSelected) {
        const updated = prev.filter(s => s.skill_id !== skill._id)
        setForm({ ...form, skills_required: updated })
        return updated
      } else {
        const updated = [...prev, skillData]
        setForm({ ...form, skills_required: updated })
        return updated
      }
    })
  }

  const validate = () => {
    const next = {}
    
    if (!form.title.trim()) next.title = 'Project title is required'
    if (!form.description.trim()) next.description = 'Project description is required'
    if (!form.budget || form.budget <= 0) next.budget = 'Valid budget is required'
    if (!form.duration || form.duration <= 0) next.duration = 'Valid duration is required'
    if (selectedSkills.length === 0) next.skills = 'At least one skill is required'
    
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage(null)
    
    if (!validate()) return
    
    setLoading(true)
    
    try {
      const projectData = {
        ...form,
        budget: Number(form.budget),
        duration: Number(form.duration),
        min_bid_amount: form.min_bid_amount ? Number(form.min_bid_amount) : undefined,
        max_bid_amount: form.max_bid_amount ? Number(form.max_bid_amount) : undefined
      }

      let response
      if (project) {
        response = await projectService.updateProject(project._id, projectData)
      } else {
        response = await projectService.createProject(projectData)
      }
      
      if (response.status) {
        setMessage({ type: 'success', text: `Project ${project ? 'updated' : 'created'} successfully! 🎉` })
        setTimeout(() => {
          onSuccess && onSuccess(response.data)
        }, 1500)
      } else {
        setMessage({ type: 'error', text: response.message || 'Something went wrong' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Something went wrong. Try again.' })
    } finally {
      setLoading(false)
    }
  }


  return (
    <div className="max-w-4xl mx-auto">
      <div className="card p-8 bg-white/95 backdrop-blur-sm text-gray-900">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-graphite">
            {project ? 'Edit Project' : 'Create New Project'}
          </h2>
          <p className="text-coolgray mt-2 text-lg">
            {project ? 'Update your project details' : 'Fill in the details to create a new project'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 text-gray-900">
          <Input
            label="Project Title"
            name="title"
            placeholder="e.g., Build a React E-commerce Website"
            value={form.title}
            onChange={handleChange}
            required
          />
          {errors.title && <p className="text-coral text-sm">{errors.title}</p>}

          <div>
            <label className="block text-sm font-semibold text-graphite mb-2">
              Project Description <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              placeholder="Describe your project in detail..."
              value={form.description}
              onChange={handleChange}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet text-gray-900"
              required
            />
            {errors.description && <p className="text-coral text-sm">{errors.description}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input
                label="Budget ($)"
                name="budget"
                type="number"
                placeholder="1000"
                value={form.budget}
                onChange={handleChange}
                required
              />
              {errors.budget && <p className="text-coral text-sm">{errors.budget}</p>}
            </div>
            <div>
              <Input
                label="Duration (days)"
                name="duration"
                type="number"
                placeholder="30"
                value={form.duration}
                onChange={handleChange}
                required
              />
              {errors.duration && <p className="text-coral text-sm">{errors.duration}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Input
                label="Min Bid Amount ($)"
                name="min_bid_amount"
                type="number"
                placeholder="500"
                value={form.min_bid_amount}
                onChange={handleChange}
              />
            </div>
            <div>
              <Input
                label="Max Bid Amount ($)"
                name="max_bid_amount"
                type="number"
                placeholder="2000"
                value={form.max_bid_amount}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <Input
                label="Bid Deadline"
                name="bid_deadline"
                type="date"
                value={form.bid_deadline}
                onChange={handleChange}
              />
            </div>
            <div className="md:col-span-2"></div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-graphite mb-2">
              Required Skills <span className="text-red-500">*</span>
            </label>
            
            <div className="space-y-3">
              {/* Skills Search Input */}
              <div className="mb-3">
                <input
                  type="text"
                  placeholder="Search skills..."
                  value={skillSearch}
                  onChange={handleSkillSearch}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-graphite bg-white focus:outline-none focus:ring-2 focus:ring-violet/50 focus:border-violet"
                />
              </div>
              
              {availableSkills.length === 0 ? (
                <div className="p-4 text-center text-coolgray border border-gray-300 rounded-md">
                  <p>Loading skills...</p>
                </div>
              ) : (
                <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md p-2">
                  {availableSkills
                    .filter(skill => 
                      skill.skill.toLowerCase().includes(skillSearch.toLowerCase())
                    )
                    .map((skill) => (
                    <label key={skill._id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedSkills.find(s => s.skill_id === skill._id) ? true : false}
                        onChange={() => handleSkillToggle(skill)}
                        className="rounded border-gray-300 text-violet focus:ring-violet"
                      />
                      <span className="text-sm text-graphite">{skill.skill}</span>
                    </label>
                  ))}
                  {availableSkills.filter(skill => 
                    skill.skill.toLowerCase().includes(skillSearch.toLowerCase())
                  ).length === 0 && skillSearch && (
                    <div className="p-4 text-center text-coolgray">
                      <p>No skills found matching "{skillSearch}"</p>
                    </div>
                  )}
                </div>
              )}

              {selectedSkills.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm text-coolgray mb-2">Selected Skills:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedSkills.map(skill => (
                      <span
                        key={skill.skill_id}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-violet/10 text-violet border border-violet/20"
                      >
                        {skill.skill}
                        <button
                          type="button"
                          onClick={() => handleSkillToggle({_id: skill.skill_id, skill: skill.skill})}
                          className="ml-2 text-violet/60 hover:text-violet"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {errors.skills && <p className="text-coral text-sm">{errors.skills}</p>}
          </div>

          {message && (
            <div className={`p-3 rounded-lg text-sm ${
              message.type === 'success' 
                ? 'bg-mint/20 text-mint border border-mint/30' 
                : 'bg-coral/20 text-coral border border-coral/30'
            }`}>
              {message.text}
            </div>
          )}

          <div className="flex gap-4 pt-6">
            <Button
              type="button"
              variant="secondary"
              onClick={onCancel}
              className="flex-1 px-6 py-3"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={loading}
              className="flex-1 px-6 py-3"
            >
              {loading ? 'Saving...' : (project ? 'Update Project' : 'Create Project')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
