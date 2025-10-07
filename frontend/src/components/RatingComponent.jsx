import React, { useState } from 'react'
import { ratingService } from '../services/ratingService'
import { getCurrentUser } from '../utils/api'

const RatingComponent = ({ projectId, freelancerId, onRatingSubmitted, isOpen, onClose }) => {
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [review, setReview] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleStarClick = (starRating) => {
    setRating(starRating)
  }

  const handleStarHover = (starRating) => {
    setHoveredRating(starRating)
  }

  const handleStarLeave = () => {
    setHoveredRating(0)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (rating === 0) {
      setError('Please select a rating')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Get current user info
      const currentUser = getCurrentUser()
      if (!currentUser) {
        throw new Error('User not authenticated')
      }

      // Prepare rating data to match backend schema
      const ratingData = {
        project_id: projectId,
        reviewee_id: freelancerId,
        rating: rating,
        comment: review.trim(),
        communication_rating: rating, // Default to same as overall rating
        quality_rating: rating,
        timeliness_rating: rating,
        professionalism_rating: rating
      }

      console.log('Submitting rating:', ratingData)
      
      // Submit rating to backend
      await ratingService.submitRating(ratingData)
      
      onRatingSubmitted?.({
        projectId,
        freelancerId,
        rating,
        review: review.trim()
      })
      
      // Reset form
      setRating(0)
      setReview('')
      onClose?.()
    } catch (error) {
      console.error('Error submitting rating:', error)
      setError(error.message || 'Failed to submit rating. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1100] p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Rate This Project</h3>
          <p className="text-gray-600">How was your experience with this freelancer?</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Star Rating */}
          <div className="text-center">
            <div className="flex justify-center space-x-2 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleStarClick(star)}
                  onMouseEnter={() => handleStarHover(star)}
                  onMouseLeave={handleStarLeave}
                  className="text-4xl transition-colors duration-200 focus:outline-none"
                >
                  <span
                    className={`${
                      star <= (hoveredRating || rating)
                        ? 'text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  >
                    ★
                  </span>
                </button>
              ))}
            </div>
            
            {rating > 0 && (
              <p className="text-sm text-gray-600">
                {rating === 1 && 'Poor'}
                {rating === 2 && 'Fair'}
                {rating === 3 && 'Good'}
                {rating === 4 && 'Very Good'}
                {rating === 5 && 'Excellent'}
              </p>
            )}
          </div>

          {/* Review Text */}
          <div>
            <label htmlFor="review" className="block text-sm font-semibold text-gray-700 mb-2">
              Write a Review (Optional)
            </label>
            <textarea
              id="review"
              value={review}
              onChange={(e) => setReview(e.target.value)}
              rows="4"
              maxLength="500"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-violet focus:border-violet transition-all duration-200 resize-none"
              placeholder="Share your experience working with this freelancer..."
            />
            <p className="text-xs text-gray-500 mt-1">
              {review.length}/500 characters
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || rating === 0}
              className="flex-1 px-6 py-3 bg-violet text-white rounded-xl hover:bg-violet/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
            >
              {loading ? 'Submitting...' : 'Submit Rating'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default RatingComponent