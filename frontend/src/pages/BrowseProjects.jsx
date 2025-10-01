import { useState, useEffect, useRef } from 'react'
import Header from '../components/Header'
import { isAuthenticated, getCurrentUser, clearAuth } from '../utils/api'
import { formatBudget } from '../utils/currency'

export default function BrowseProjects() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [userData, setUserData] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const hasFetched = useRef(false)
  const hasInitialized = useRef(false)

  // Authentication check
  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      console.log('BrowseProjects: useEffect running (first time)');
      
      // Check if user is authenticated
      const authStatus = isAuthenticated();
      console.log('BrowseProjects: Authentication status:', authStatus);
      
      if (authStatus) {
        // Get user data if authenticated
        const user = getCurrentUser();
        console.log('BrowseProjects: User data:', user);
        
        if (user) {
          setUserData(user);
        }
      }
      
      // Set auth loading to false after initialization
      setAuthLoading(false);
    } else {
      console.log('BrowseProjects: Skipping duplicate initialization due to StrictMode');
    }
  }, []);

  useEffect(() => {
    if (!hasFetched.current && !authLoading) {
      hasFetched.current = true
      console.log('BrowseProjects component: Fetching projects (first time)')
      fetchProjects()
    } else {
      console.log('BrowseProjects component: Skipping duplicate fetch due to StrictMode')
    }
  }, [authLoading])

  const fetchProjects = async () => {
    try {
      setLoading(true)
      // Use the new public browse endpoint that doesn't require authentication
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
      const response = await fetch(`${API_BASE_URL}/project/browse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      })
      
      if (response.ok) {
        const data = await response.json()
        setProjects(data.data || [])
      } else {
        setError('Failed to fetch projects')
      }
    } catch (err) {
      setError('Error fetching projects')
      console.error('Error fetching projects:', err)
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-gradient text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-gradient text-white">
        <Header 
          userType={userData?.user_type || 'client'} 
          userData={userData} 
          onLogout={clearAuth}
        />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
            <p className="mt-4 text-white/80">Loading projects...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-brand-gradient text-white">
        <Header 
          userType={userData?.user_type || 'client'} 
          userData={userData} 
          onLogout={clearAuth}
        />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-white/80">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-brand-gradient text-white page-transition">
      <Header 
        userType={userData?.user_type || 'client'} 
        userData={userData} 
        onLogout={clearAuth}
      />
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 pt-20 pb-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4">
            Browse <span className="text-mint">Projects</span>
          </h1>
          <p className="text-lg text-white/80">
            Discover amazing projects from talented professionals
          </p>
        </div>

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-white/10 rounded-full mx-auto mb-6 flex items-center justify-center">
              <svg className="w-12 h-12 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No Projects Available</h3>
            <p className="text-white/80">Check back later for new projects!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project, index) => (
              <div key={project._id} className="card p-6 bg-white/95 hover:bg-white transition-colors slide-in-up" style={{animationDelay: `${index * 0.1}s`}}>
                <div className="flex flex-col h-full">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-graphite mb-2 line-clamp-2">
                      {project.title}
                    </h3>
                    <p className="text-coolgray text-sm mb-4 line-clamp-3">
                      {project.description}
                    </p>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-coolgray uppercase tracking-wide">Budget</p>
                        <p className="text-lg font-semibold text-mint">{formatBudget(project.budget)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-coolgray uppercase tracking-wide">Duration</p>
                        <p className="text-lg font-semibold text-coral">{project.duration} days</p>
                      </div>
                    </div>

                    {/* Skills */}
                    {project.skills_required && project.skills_required.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs text-coolgray uppercase tracking-wide mb-2">Skills Required</p>
                        <div className="flex flex-wrap gap-1">
                          {project.skills_required.slice(0, 3).map((skill, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-violet/10 text-violet rounded text-xs font-medium"
                            >
                              {skill.skill}
                            </span>
                          ))}
                          {project.skills_required.length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                              +{project.skills_required.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Project Details */}
                    <div className="space-y-2 text-sm text-coolgray">
                      {project.location && (
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span>{project.location}</span>
                        </div>
                      )}
                      
                      {project.project_type && (
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                          <span>{project.project_type}</span>
                        </div>
                      )}

                      {project.experience_level && (
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                          </svg>
                          <span>{project.experience_level}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Posted Date */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs text-coolgray">
                      Posted {new Date(project.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
