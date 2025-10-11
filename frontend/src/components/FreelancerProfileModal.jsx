import React from 'react'
import { formatHourlyRate } from '../utils/currency'
import { getSafeUrl } from '../utils/urlValidation'

export default function FreelancerProfileModal({ freelancer, isOpen, onClose }) {
  if (!isOpen || !freelancer) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1100] p-4">
      <div className="bg-white rounded-[2rem] p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-graphite">Freelancer Profile</h3>
          <button
            onClick={onClose}
            className="text-coolgray hover:text-graphite transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="space-y-6">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-violet/5 to-mint/5 p-6 rounded-xl border border-violet/20">
            <div className="flex items-start space-x-6">
              <div className="w-24 h-24 bg-coral/20 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-coral" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="text-2xl font-bold text-graphite">{freelancer.name}</h4>
                <p className="text-coral font-medium text-lg">{freelancer.title}</p>
                <p className="text-coolgray">{freelancer.location}</p>
                <p className="text-sm text-coolgray">{freelancer.years_experience} years experience</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    freelancer.experience_level === 'Expert' ? 'bg-green-100 text-green-800' :
                    freelancer.experience_level === 'Intermediate' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {freelancer.experience_level}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    freelancer.availability === 'full-time' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                  }`}>
                    {freelancer.availability}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Overview */}
          <div>
            <h5 className="font-semibold text-graphite mb-3 text-lg">Overview</h5>
            <div className="bg-gray-50 p-4 rounded-xl">
              <p className="text-coolgray leading-relaxed">{freelancer.overview}</p>
            </div>
          </div>

          {/* Rating and Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-gray-200 p-4 rounded-xl">
              <h6 className="font-semibold text-graphite mb-2">Rating</h6>
              <div className="flex items-center space-x-2">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className={`w-5 h-5 ${i < Math.floor(freelancer.rating) ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-sm text-coolgray">{freelancer.rating}</span>
                <span className="text-xs text-coolgray">({freelancer.completed_projects} projects)</span>
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 p-4 rounded-xl">
              <h6 className="font-semibold text-graphite mb-2">Hourly Rate</h6>
              <p className="text-2xl font-bold text-mint">{formatHourlyRate(freelancer.hourly_rate)}</p>
            </div>
            
            <div className="bg-white border border-gray-200 p-4 rounded-xl">
              <h6 className="font-semibold text-graphite mb-2">Response Time</h6>
              <p className="text-coolgray">Responds in {freelancer.response_time}</p>
            </div>
          </div>

          {/* Skills */}
          <div>
            <h5 className="font-semibold text-graphite mb-3 text-lg">Skills</h5>
            <div className="flex flex-wrap gap-2">
              {freelancer.skills.map((skill, index) => (
                <span key={index} className="px-3 py-2 bg-coral/10 text-coral rounded-full text-sm font-medium border border-coral/20">
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Language */}
          <div>
            <h5 className="font-semibold text-graphite mb-3 text-lg">Language</h5>
            <div className="bg-gray-50 p-4 rounded-xl">
              <p className="text-coolgray capitalize">{freelancer.english_level} English</p>
            </div>
          </div>

          {/* Portfolio Links */}
          {(freelancer.resume_link || freelancer.github_link) && (
            <div>
              <h5 className="font-semibold text-graphite mb-3 text-lg">Portfolio & Links</h5>
              <div className="bg-gray-50 p-4 rounded-xl space-y-3">
                {freelancer.resume_link && (
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-3 text-gray-800 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <a 
                      href={getSafeUrl(freelancer.resume_link)} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-gray-800 hover:text-gray-600 underline text-sm break-all"
                    >
                      View Resume
                    </a>
                  </div>
                )}
                {freelancer.github_link && (
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-3 text-gray-800 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                    <a 
                      href={getSafeUrl(freelancer.github_link)} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-gray-800 hover:text-gray-600 underline text-sm break-all"
                    >
                      View GitHub Profile
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-graphite rounded-xl hover:bg-gray-50 transition-all duration-200 font-semibold"
            >
              Close
            </button>
            <button
              onClick={() => {
                // TODO: Add contact/hire functionality
                console.log('Contact freelancer:', freelancer._id)
              }}
              className="flex-1 px-6 py-3 bg-violet text-white rounded-xl hover:bg-violet/90 transition-all duration-200 font-semibold"
            >
              Contact Freelancer
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
