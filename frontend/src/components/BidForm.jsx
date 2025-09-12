import React, { useState } from 'react'
import { bidService } from '../services/bidService'
import { aiService } from '../services/aiService'

const BidForm = ({ project, onBidSubmitted, onCancel }) => {
  const [formData, setFormData] = useState({
    project_id: project?._id || '',
    bid_amount: '',
    proposed_duration: '',
    cover_letter: '',
    start_date: '',
    availability_hours: 40,
    milestones: []
  })
  
  const [milestoneTitle, setMilestoneTitle] = useState('')
  const [milestoneAmount, setMilestoneAmount] = useState('')
  const [milestoneDescription, setMilestoneDescription] = useState('')
  const [milestoneDueDate, setMilestoneDueDate] = useState('')
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')

  const handleInputChange = (e) => {
    const { name, value } = e.target
    
    // For proposed_duration and availability_hours, only allow whole numbers
    if (name === 'proposed_duration' || name === 'availability_hours') {
      // Remove any decimal points and non-numeric characters except digits
      const cleanValue = value.replace(/[^\d]/g, '')
      setFormData(prev => ({
        ...prev,
        [name]: cleanValue
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  // Count words in cover letter
  const getWordCount = (text) => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length
  }

  // Check if cover letter has at least 10 words
  const hasMinimumWords = getWordCount(formData.cover_letter) >= 10

  // Generate AI proposal
  const handleGenerateAIProposal = async () => {
    if (!hasMinimumWords) {
      setAiError('Please write at least 10 words in your cover letter first')
      return
    }

    setAiLoading(true)
    setAiError('')

    try {
      const proposalData = {
        title: project.title,
        description: project.description,
        budget: project.budget,
        bid_amount: formData.bid_amount,
        milestones: formData.milestones,
        prompt: formData.cover_letter // Use current cover letter as prompt
      }

      const response = await aiService.generateProposal(proposalData)
      
      if (response.status && response.data) {
        setFormData(prev => ({
          ...prev,
          cover_letter: response.data.proposalText
        }))
      } else {
        throw new Error(response.message || 'Failed to generate AI proposal')
      }
    } catch (error) {
      console.error('Error generating AI proposal:', error)
      setAiError(error.message || 'Failed to generate AI proposal. Please try again.')
    } finally {
      setAiLoading(false)
    }
  }

  const addMilestone = () => {
    if (!milestoneTitle.trim() || !milestoneAmount) {
      setError('Milestone title and amount are required')
      return
    }

    const newMilestone = {
      title: milestoneTitle.trim(),
      amount: parseFloat(milestoneAmount),
      description: milestoneDescription.trim(),
      due_date: milestoneDueDate
    }

    setFormData(prev => ({
      ...prev,
      milestones: [...prev.milestones, newMilestone]
    }))

    // Reset milestone form
    setMilestoneTitle('')
    setMilestoneAmount('')
    setMilestoneDescription('')
    setMilestoneDueDate('')
    setError('')
  }

  const removeMilestone = (index) => {
    setFormData(prev => ({
      ...prev,
      milestones: prev.milestones.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Validate required fields
      if (!formData.bid_amount || !formData.proposed_duration || !formData.cover_letter) {
        throw new Error('Bid amount, proposed duration, and cover letter are required')
      }

      if (formData.bid_amount <= 0) {
        throw new Error('Bid amount must be greater than 0')
      }

      if (formData.proposed_duration <= 0) {
        throw new Error('Proposed duration must be greater than 0')
      }

      // Prepare bid data
      const bidData = {
        ...formData,
        bid_amount: parseFloat(formData.bid_amount),
        proposed_duration: parseInt(formData.proposed_duration),
        availability_hours: parseInt(formData.availability_hours) || 40
      }

      const response = await bidService.createBid(bidData)
      
      if (response.status) {
        onBidSubmitted?.(response.data)
        // Reset form
        setFormData({
          project_id: project?._id || '',
          bid_amount: '',
          proposed_duration: '',
          cover_letter: '',
          start_date: '',
          availability_hours: 40,
          milestones: []
        })
      } else {
        throw new Error(response.message || 'Failed to submit bid')
      }
    } catch (error) {
      console.error('Error submitting bid:', error)
      setError(error.message || 'Failed to submit bid. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!project) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <p>Project information is required to submit a bid.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 max-w-4xl mx-auto relative">
      {/* Cancel Button */}
      <button
        onClick={onCancel}
        className="absolute top-4 right-4 text-coolgray hover:text-graphite transition-colors p-2 hover:bg-gray-100 rounded-full"
        aria-label="Close"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="mb-8">
        <h2 className="text-3xl font-bold text-graphite mb-4">Submit a Bid</h2>
        <div className="bg-gradient-to-r from-violet/5 to-mint/5 border border-violet/20 rounded-2xl p-6">
          <h3 className="font-bold text-graphite text-xl mb-3">Project: {project.title}</h3>
          <p className="text-coolgray mb-4 leading-relaxed">{project.description}</p>
          <div className="flex flex-wrap gap-6 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-violet rounded-full"></div>
              <span className="text-graphite font-medium">Budget: <span className="text-violet font-bold">{project.budget?.toLocaleString()}</span></span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-mint rounded-full"></div>
              <span className="text-graphite font-medium">Duration: <span className="text-mint font-bold">{project.duration} days</span></span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-coral rounded-full"></div>
              <span className="text-graphite font-medium">Skills: <span className="text-coral font-bold">{project.skills_required?.join(', ') || 'N/A'}</span></span>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Bid Amount and Duration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label htmlFor="bid_amount" className="block text-sm font-semibold text-graphite mb-3">
              Your Bid Amount ($) *
            </label>
            <input
              type="number"
              id="bid_amount"
              name="bid_amount"
              value={formData.bid_amount}
              onChange={handleInputChange}
              min="0"
              step="0.01"
              required
              className="text-graphite w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-violet focus:border-violet transition-all duration-200"
              placeholder="Enter your bid amount"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="proposed_duration" className="block text-sm font-semibold text-graphite mb-3">
              Proposed Duration (days) *
            </label>
            <input
              type="number"
              id="proposed_duration"
              name="proposed_duration"
              value={formData.proposed_duration}
              onChange={handleInputChange}
              min="1"
              step="1"
              required
              className="text-graphite w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-violet focus:border-violet transition-all duration-200"
              placeholder="Enter duration in days (whole numbers only)"
            />
          </div>
        </div>

        {/* Start Date and Availability */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label htmlFor="start_date" className="block text-sm font-semibold text-graphite mb-3">
              Preferred Start Date
            </label>
            <input
              type="date"
              id="start_date"
              name="start_date"
              value={formData.start_date}
              onChange={handleInputChange}
              min={new Date().toISOString().split('T')[0]}
              className="text-graphite w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-violet focus:border-violet transition-all duration-200"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="availability_hours" className="block text-sm font-semibold text-graphite mb-3">
              Availability (hours per week)
            </label>
            <input
              type="number"
              id="availability_hours"
              name="availability_hours"
              value={formData.availability_hours}
              onChange={handleInputChange}
              min="1"
              max="168"
              step="1"
              className="text-graphite w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-violet focus:border-violet transition-all duration-200"
              placeholder="Enter hours per week (whole numbers only)"
            />
          </div>
        </div>

        {/* Cover Letter */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label htmlFor="cover_letter" className="block text-sm font-semibold text-graphite">
              Cover Letter *
            </label>
            <div className="flex items-center gap-2">
              {hasMinimumWords && (
                <button
                  type="button"
                  onClick={handleGenerateAIProposal}
                  disabled={aiLoading}
                  className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-semibold rounded-lg hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl"
                >
                  {aiLoading ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      AI Personalized Proposal
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
          
          {!hasMinimumWords && formData.cover_letter.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-lg text-sm">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Write at least 10 words to unlock AI personalized proposal
              </div>
            </div>
          )}

          <textarea
            id="cover_letter"
            name="cover_letter"
            value={formData.cover_letter}
            onChange={handleInputChange}
            rows="6"
            maxLength="2000"
            required
            className="text-graphite w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-violet focus:border-violet transition-all duration-200 resize-none"
            placeholder="Describe your approach, experience, and why you're the best fit for this project..."
          />
          
          <div className="flex justify-between items-center">
            <p className="text-sm text-coolgray">
              {formData.cover_letter.length}/2000 characters
            </p>
            {hasMinimumWords && (
              <p className="text-sm text-green-600 font-medium">
                ✓ Ready for AI enhancement
              </p>
            )}
          </div>

          {/* AI Error Message */}
          {aiError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {aiError}
              </div>
            </div>
          )}
        </div>

        {/* Milestones */}
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-graphite">Project Milestones (Optional)</h3>
          
          {/* Add Milestone Form */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 rounded-2xl border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-graphite">
                  Milestone Title *
                </label>
                <input
                  type="text"
                  value={milestoneTitle}
                  onChange={(e) => setMilestoneTitle(e.target.value)}
                  className="text-graphite w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-violet focus:border-violet transition-all duration-200"
                  placeholder="e.g., Design Phase"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-graphite">
                  Amount ($) *
                </label>
                <input
                  type="number"
                  value={milestoneAmount}
                  onChange={(e) => setMilestoneAmount(e.target.value)}
                  min="0"
                  step="0.01"
                  className="text-graphite w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-violet focus:border-violet transition-all duration-200"
                  placeholder="0.00"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-graphite">
                  Description
                </label>
                <input
                  type="text"
                  value={milestoneDescription}
                  onChange={(e) => setMilestoneDescription(e.target.value)}
                  className="text-graphite w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-violet focus:border-violet transition-all duration-200"
                  placeholder="Brief description of the milestone"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-graphite">
                  Due Date
                </label>
                <input
                  type="date"
                  value={milestoneDueDate}
                  onChange={(e) => setMilestoneDueDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="text-graphite w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-violet focus:border-violet transition-all duration-200"
                />
              </div>
            </div>
            
            <button
              type="button"
              onClick={addMilestone}
              className="px-6 py-3 bg-violet text-white rounded-xl hover:bg-violet/90 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
            >
              Add Milestone
            </button>
          </div>

          {/* Milestones List */}
          {formData.milestones.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-semibold text-graphite text-lg">Added Milestones:</h4>
              {formData.milestones.map((milestone, index) => (
                <div key={index} className="bg-white border border-gray-200 rounded-2xl p-6 flex justify-between items-start shadow-sm hover:shadow-md transition-shadow duration-200">
                  <div className="flex-1">
                    <h5 className="font-semibold text-graphite text-lg mb-2">{milestone.title}</h5>
                    {milestone.description && (
                      <p className="text-coolgray mb-3">{milestone.description}</p>
                    )}
                    <div className="flex gap-6 text-sm">
                      <span className="text-violet font-semibold">Amount: ${milestone.amount?.toLocaleString()}</span>
                      {milestone.due_date && <span className="text-mint font-semibold">Due: {milestone.due_date}</span>}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeMilestone(index)}
                    className="ml-4 text-coral hover:text-coral/80 p-2 hover:bg-coral/10 rounded-full transition-all duration-200"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* Submit Buttons */}
        <div className="flex justify-end gap-4 pt-8 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-8 py-3 border border-gray-300 text-graphite rounded-xl hover:bg-gray-50 transition-all duration-200 font-semibold"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 bg-violet text-white rounded-xl hover:bg-violet/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
          >
            {loading ? 'Submitting...' : 'Submit Bid'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default BidForm

