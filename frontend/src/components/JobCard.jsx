import React from 'react'
import { Link } from 'react-router-dom'
import Button from './Button'

export default function JobCard({ job, onSaveJob, showActions = true }) {
  const formatSalary = (salary) => {
    if (!salary.min_salary && !salary.max_salary) return 'Salary not specified'
    if (salary.min_salary === salary.max_salary) {
      return `${salary.currency} ${salary.min_salary.toLocaleString()} ${salary.salary_type}`
    }
    return `${salary.currency} ${salary.min_salary.toLocaleString()} - ${salary.max_salary.toLocaleString()} ${salary.salary_type}`
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString()
  }

  const getDaysUntilDeadline = (deadline) => {
    const now = new Date()
    const deadlineDate = new Date(deadline)
    const diffTime = deadlineDate - now
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const daysUntilDeadline = getDaysUntilDeadline(job.application_deadline)

  return (
    <div className="job-card hover-lift">
      {/* Header */}
      <div className="job-card-header">
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-3">
            <Link
              to={`/freelancer/jobs/${job._id}`}
              className="job-card-title hover:text-primary transition-colors"
            >
              {job.job_title}
            </Link>
            <span className={`status-badge ${
              job.job_type === 'full-time' ? 'status-active' :
              job.job_type === 'part-time' ? 'status-pending' :
              job.job_type === 'contract' ? 'status-active' :
              job.job_type === 'freelance' ? 'status-pending' :
              'status-inactive'
            }`}>
              {job.job_type}
            </span>
            <span className={`status-badge ${
              job.work_mode === 'remote' ? 'status-active' :
              job.work_mode === 'onsite' ? 'status-pending' :
              'status-inactive'
            }`}>
              {job.work_mode}
            </span>
          </div>

          <div className="job-card-company mb-4">
            {job.company_info.company_name}
          </div>

          <div className="job-card-meta mb-4">
            <div className="job-card-meta-item">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{job.location.city}, {job.location.country}</span>
            </div>
            <div className="job-card-meta-item">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span className="capitalize">{job.company_info.company_size} employees</span>
            </div>
            <div className="job-card-meta-item">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Posted {formatDate(job.created_at)}</span>
            </div>
            <div className="job-card-meta-item">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
              <span className="font-semibold text-green-600">{formatSalary(job.salary)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="mb-6">
        <p className="job-card-description project-description">
          {job.job_description.substring(0, 200)}...
        </p>
      </div>

      {/* Skills */}
      <div className="job-card-skills mb-6">
        {job.required_skills.slice(0, 6).map((skill, index) => (
          <span
            key={index}
            className="job-card-skill"
          >
            {skill.skill}
          </span>
        ))}
        {job.required_skills.length > 6 && (
          <span className="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
            +{job.required_skills.length - 6} more
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="job-card-footer">
        <div className="job-card-stats">
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className={`${
              daysUntilDeadline < 7 ? 'text-red-600 font-semibold' : 
              daysUntilDeadline < 14 ? 'text-yellow-600 font-semibold' : 
              'text-gray-600'
            }`}>
              {daysUntilDeadline > 0 ? `${daysUntilDeadline} days left` : 'Deadline passed'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span>{job.analytics.total_applications} applications</span>
          </div>
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span>{job.analytics.total_views} views</span>
          </div>
        </div>

        {showActions && (
          <div className="job-card-actions">
            <button
              onClick={() => onSaveJob(job._id)}
              className={`p-3 rounded-xl transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-md ${
                job.is_saved 
                  ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title={job.is_saved ? 'Unsave job' : 'Save job'}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d={job.is_saved ? "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" : "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"} />
              </svg>
            </button>
            
            <Link to={`/freelancer/jobs/${job._id}`}>
              <Button size="sm" className="bg-mint text-white hover:bg-mint/90">
                View Details
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
