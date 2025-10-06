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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <Link
              to={`/freelancer/jobs/${job._id}`}
              className="text-lg font-semibold text-blue-600 hover:text-blue-800"
            >
              {job.job_title}
            </Link>
            <span className={`px-2 py-1 text-xs rounded-full ${
              job.job_type === 'full-time' ? 'bg-green-100 text-green-800' :
              job.job_type === 'part-time' ? 'bg-yellow-100 text-yellow-800' :
              job.job_type === 'contract' ? 'bg-blue-100 text-blue-800' :
              job.job_type === 'freelance' ? 'bg-purple-100 text-purple-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {job.job_type}
            </span>
            <span className={`px-2 py-1 text-xs rounded-full ${
              job.work_mode === 'remote' ? 'bg-blue-100 text-blue-800' :
              job.work_mode === 'onsite' ? 'bg-orange-100 text-orange-800' :
              'bg-purple-100 text-purple-800'
            }`}>
              {job.work_mode}
            </span>
          </div>

          <div className="text-sm text-gray-600 mb-2">
            <span className="font-medium">{job.company_info.company_name}</span>
            <span className="mx-2">•</span>
            <span>{job.location.city}, {job.location.country}</span>
            <span className="mx-2">•</span>
            <span className="capitalize">{job.company_info.company_size} employees</span>
          </div>

          <p className="text-gray-700 mb-3 line-clamp-2">
            {job.job_description.substring(0, 200)}...
          </p>

          <div className="flex flex-wrap gap-2 mb-3">
            {job.required_skills.slice(0, 5).map((skill, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
              >
                {skill.skill}
              </span>
            ))}
            {job.required_skills.length > 5 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                +{job.required_skills.length - 5} more
              </span>
            )}
          </div>

          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-4">
              <span className="font-medium text-green-600">
                {formatSalary(job.salary)}
              </span>
              <span>
                Posted {formatDate(job.created_at)}
              </span>
              <span className={`${
                daysUntilDeadline < 7 ? 'text-red-600' : 
                daysUntilDeadline < 14 ? 'text-yellow-600' : 
                'text-gray-600'
              }`}>
                {daysUntilDeadline > 0 ? `${daysUntilDeadline} days left` : 'Deadline passed'}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-gray-500">
                {job.analytics.total_applications} applications
              </span>
              <span className="text-gray-500">
                {job.analytics.total_views} views
              </span>
            </div>
          </div>
        </div>

        {showActions && (
          <div className="flex flex-col space-y-2 ml-4">
            <button
              onClick={() => onSaveJob(job._id)}
              className={`p-2 rounded-md transition-colors ${
                job.is_saved 
                  ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title={job.is_saved ? 'Unsave job' : 'Save job'}
            >
              {job.is_saved ? '★' : '☆'}
            </button>
            
            <Link to={`/freelancer/jobs/${job._id}`}>
              <Button size="sm">
                View Details
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
