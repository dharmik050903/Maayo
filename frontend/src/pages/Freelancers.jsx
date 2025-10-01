import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import Header from '../components/Header'
import { getFreelancers, isAuthenticated, getCurrentUser, clearAuth } from '../utils/api'
import { formatHourlyRate } from '../utils/currency'

export default function Freelancers() {
  const [searchParams] = useSearchParams()
  const [freelancers, setFreelancers] = useState([])
  const [filteredFreelancers, setFilteredFreelancers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [userData, setUserData] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const hasFetched = useRef(false)
  const hasInitialized = useRef(false)

  // Authentication check
  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      console.log('Freelancers: useEffect running (first time)');
      
      // Check if user is authenticated
      const authStatus = isAuthenticated();
      console.log('Freelancers: Authentication status:', authStatus);
      
      if (authStatus) {
        // Get user data if authenticated
        const user = getCurrentUser();
        console.log('Freelancers: User data:', user);
        
        if (user) {
          setUserData(user);
        }
      }
      
      // Set auth loading to false after initialization
      setAuthLoading(false);
    } else {
      console.log('Freelancers: Skipping duplicate initialization due to StrictMode');
    }
  }, []);

  useEffect(() => {
    if (!hasFetched.current && !authLoading) {
      hasFetched.current = true
      console.log('Freelancers component: Fetching freelancers (first time)')
      fetchFreelancers()
    } else {
      console.log('Freelancers component: Skipping duplicate fetch due to StrictMode')
    }
  }, [authLoading])

  // Handle search parameters from URL
  useEffect(() => {
    const searchFromUrl = searchParams.get('search')
    if (searchFromUrl) {
      setSearchQuery(searchFromUrl)
    }
  }, [searchParams])

  // Filter freelancers based on search query
  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = freelancers.filter(freelancer =>
        freelancer.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        freelancer.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        freelancer.overview?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        freelancer.skills?.some(skill =>
          skill.skill?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
      setFilteredFreelancers(filtered)
    } else {
      setFilteredFreelancers(freelancers)
    }
  }, [freelancers, searchQuery])

  const fetchFreelancers = async () => {
    try {
      setLoading(true)
      console.log('Fetching freelancers from database...')
      
      const { response, data } = await getFreelancers({})
      
      if (response.ok && data.status) {
        console.log('Freelancers fetched successfully:', data.data)
        setFreelancers(data.data || [])
        setFilteredFreelancers(data.data || [])
      } else {
        console.error('Failed to fetch freelancers:', data.message)
        setError(data.message || 'Failed to fetch freelancers')
      }
    } catch (err) {
      console.error('Error fetching freelancers:', err)
      setError('Error fetching freelancers')
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
            <p className="mt-4 text-white/80">Loading freelancers...</p>
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
            Browse <span className="text-mint">Freelancers</span>
          </h1>
          <p className="text-lg text-white/80">
            Discover talented professionals for your projects
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="Search freelancers by name, skills, or expertise..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 pl-12 bg-white/95 text-graphite rounded-xl focus:ring-2 focus:ring-mint focus:border-transparent border-0"
              />
              <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-coolgray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            {searchQuery && (
              <p className="text-white/70 text-sm mt-2">
                {filteredFreelancers.length} freelancer{filteredFreelancers.length !== 1 ? 's' : ''} found for "{searchQuery}"
              </p>
            )}
          </div>
        </div>

        {/* Freelancers Grid */}
        {filteredFreelancers.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-white/10 rounded-full mx-auto mb-6 flex items-center justify-center">
              <svg className="w-12 h-12 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              {searchQuery ? 'No Freelancers Found' : 'No Freelancers Available'}
            </h3>
            <p className="text-white/80">
              {searchQuery 
                ? `No freelancers found matching "${searchQuery}". Try a different search term.`
                : 'Check back later for new freelancers!'
              }
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="mt-4 px-6 py-2 bg-mint text-white rounded-lg hover:bg-mint/80 transition-colors"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFreelancers.map((freelancer, index) => (
              <div key={freelancer._id} className="card p-6 bg-white/95 hover:bg-white transition-colors slide-in-up" style={{animationDelay: `${index * 0.1}s`}}>
                <div className="flex flex-col h-full">
                  <div className="flex-1">
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 bg-mint/20 rounded-full flex items-center justify-center mr-4">
                        <span className="text-mint font-bold text-lg">
                          {freelancer.name?.[0] || 'F'}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-graphite">
                          {freelancer.name || 'Freelancer'}
                        </h3>
                        <p className="text-coolgray text-sm">{freelancer.title || 'Professional'}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-coolgray uppercase tracking-wide">Hourly Rate</p>
                        <p className="text-lg font-semibold text-mint">{formatHourlyRate(freelancer.hourly_rate || 0)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-coolgray uppercase tracking-wide">Projects</p>
                        <p className="text-lg font-semibold text-coral">{freelancer.total_projects || 0}</p>
                      </div>
                    </div>

                    {/* Overview */}
                    {freelancer.overview && (
                      <div className="mb-4">
                        <p className="text-sm text-coolgray line-clamp-2">
                          {freelancer.overview}
                        </p>
                      </div>
                    )}

                    {/* Experience Level */}
                    {freelancer.experience_level && (
                      <div className="mb-4">
                        <p className="text-xs text-coolgray uppercase tracking-wide">Experience</p>
                        <p className="text-sm font-medium text-graphite">{freelancer.experience_level}</p>
                      </div>
                    )}

                    {/* Skills */}
                    {freelancer.skills && freelancer.skills.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs text-coolgray uppercase tracking-wide mb-2">Skills</p>
                        <div className="flex flex-wrap gap-1">
                          {freelancer.skills.slice(0, 3).map((skill, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-violet/10 text-violet rounded text-xs font-medium"
                            >
                              {skill.skill}
                            </span>
                          ))}
                          {freelancer.skills.length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                              +{freelancer.skills.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <button className="w-full px-4 py-2 bg-mint text-white rounded-lg hover:bg-mint/80 transition-colors font-semibold">
                      View Profile
                    </button>
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