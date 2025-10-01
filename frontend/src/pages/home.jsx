import { useState, useEffect, useRef } from "react"
import { Link, useSearchParams } from "react-router-dom"
import Header from "../components/Header"
import Button from "../components/Button"
import { projectService } from "../services/projectService"
import { formatBudget } from "../utils/currency"
import { isAuthenticated, getCurrentUser, clearAuth } from "../utils/api"
import { useTranslation } from "../hooks/useTranslation"
import hero from "../assets/medium-shot-woman-typing-keyboard.jpg"

export default function Home() {
  const [searchParams] = useSearchParams()
  const { t } = useTranslation()
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
      hasInitialized.current = true
      console.log('Home: useEffect running (first time)')
      
      const authStatus = isAuthenticated()
      console.log('Home: Authentication status:', authStatus)
      
      if (authStatus) {
        const user = getCurrentUser()
        console.log('Home: User data:', user)
        
        if (user) {
          setUserData(user)
        }
      }
      
      setAuthLoading(false)
    } else {
      console.log('Home: Skipping duplicate initialization due to StrictMode')
    }
  }, [])

  useEffect(() => {
    if (!hasFetched.current && !authLoading) { // Fetch only after auth status is determined
      hasFetched.current = true
      console.log('Home component: Fetching projects (first time)')
      fetchProjects()
    } else {
      console.log('Home component: Skipping duplicate fetch due to StrictMode')
    }
  }, [authLoading])

  const fetchProjects = async () => {
    try {
      setLoading(true)
      const response = await projectService.getBrowseProjects()
      setProjects(response.data || [])
    } catch (err) {
      console.error('Error fetching projects:', err)
      setError('Failed to load projects')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-gradient text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>{t('loading')}</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-brand-gradient text-white">
        <Header 
          userType={userData?.user_type || 'client'} 
          userData={userData} 
          onLogout={clearAuth}
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p>{t('loadingProjects')}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-brand-gradient text-white page-transition">
      <Header 
        userType={userData?.user_type || 'client'} 
        userData={userData} 
        onLogout={clearAuth}
      />

      {/* Hero Section */}
      <section className="flex flex-col md:flex-row items-center justify-between flex-1 max-w-7xl mx-auto px-6 pt-20">
        <div className="max-w-xl space-y-6 slide-in-left text-center md:text-left">
          <h1 className="text-4xl md:text-5xl font-bold leading-tight">
            {t('heroTitle')} <span className="text-mint">{t('freelancer')}</span> {t('heroTitleEnd')}
          </h1>
          <p className="text-lg text-white/80">
            {t('heroDescription')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center sm:justify-start">
            <Link to="/signup">
              <Button variant="accent" className="w-full sm:w-auto">{t('getStarted')}</Button>
            </Link>
            <Link to="/browse">
              <Button variant="primary" className="w-full sm:w-auto">{t('browseProjects')}</Button>
            </Link>
          </div>
        </div>
        <div className="mt-10 md:mt-0 slide-in-right">
          <img src={hero} alt="Woman typing on keyboard" className="w-[360px] md:w-[420px] rounded-xl shadow-soft border border-white/15 object-cover" />
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8 px-6">
          <div className="card p-6 text-center bg-white/95 slide-in-up">
            <h3 className="text-xl font-semibold text-graphite mb-3">{t('trustedTalent')}</h3>
            <p className="text-coolgray">{t('trustedTalentDesc')}</p>
          </div>
          <div className="card p-6 text-center bg-white/95 slide-in-up" style={{animationDelay: '0.1s'}}>
            <h3 className="text-xl font-semibold text-graphite mb-3">{t('securePayments')}</h3>
            <p className="text-coolgray">{t('securePaymentsDesc')}</p>
          </div>
          <div className="card p-6 text-center bg-white/95 slide-in-up" style={{animationDelay: '0.2s'}}>
            <h3 className="text-xl font-semibold text-graphite mb-3">{t('fastHiring')}</h3>
            <p className="text-coolgray">{t('fastHiringDesc')}</p>
          </div>
        </div>
      </section>

      {/* Featured Projects */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t('featuredProjects')} <span className="text-mint">{t('projects')}</span>
            </h2>
            <p className="text-lg text-white/80 max-w-2xl mx-auto">
              {t('featuredProjectsDesc')}
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
                <p className="mt-4 text-white/80">{t('loadingProjects')}</p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-white/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <p className="text-white/80 mb-4">{error}</p>
              <Button variant="outline" onClick={fetchProjects} className="px-6 py-2">
                {t('tryAgain')}
              </Button>
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-white/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">{t('noProjectsAvailable')}</h3>
              <p className="text-white/80">{t('noProjectsDesc')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {projects.map((project, index) => (
                <div key={project._id} className="card p-6 bg-white/95 hover:bg-white transition-colors group slide-in-up" style={{animationDelay: `${index * 0.1}s`}}>
                  <div className="flex flex-col h-full">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-graphite mb-2 line-clamp-2 group-hover:text-mint transition-colors">
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

          {/* View All Projects Button */}
          {projects.length > 0 && (
            <div className="text-center">
              <Link to="/browse">
                <Button variant="outline" className="px-8 py-3 text-lg border-white text-white hover:bg-white hover:text-graphite">
                  View All Projects
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Call to Action */}
      <section className="text-center py-16">
        <h2 className="text-3xl font-semibold mb-4">Ready to get started?</h2>
        <p className="mb-6 text-white/85">Join Maayo today and unlock your project’s potential.</p>
        <Link to="/signup">
          <Button variant="accent">{t('createAccount')}</Button>
        </Link>
      </section>
    </div>
  )
}
