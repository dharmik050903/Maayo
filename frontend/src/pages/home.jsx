import { useState, useEffect, useRef } from "react"
import { Link, useSearchParams } from "react-router-dom"
import Header from "../components/Header"
import Button from "../components/Button"
import { projectService } from "../services/projectService"
import { formatBudget } from "../utils/currency"
import { isAuthenticated, getCurrentUser, clearAuth } from "../utils/api"
import { useComprehensiveTranslation } from "../hooks/useComprehensiveTranslation"
import hero from "../assets/medium-shot-woman-typing-keyboard.jpg"

export default function Home() {
  const [searchParams] = useSearchParams()
  const { t } = useComprehensiveTranslation()
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
      <section className="flex flex-col lg:flex-row items-center justify-between flex-1 max-w-7xl mx-auto px-4 md:px-6 pt-16 md:pt-20 pb-12 md:pb-16">
        <div className="max-w-2xl space-y-6 md:space-y-8 slide-in-left text-center lg:text-left">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight text-balance">
            {t('heroTitle')} <span className="text-mint">{t('freelancer')}</span> {t('heroTitleEnd')}
          </h1>
          <p className="text-base md:text-lg lg:text-xl text-white/90 leading-relaxed max-w-xl mx-auto lg:mx-0">
            {t('heroDescription')}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center lg:justify-start">
            <Link to="/signup">
              <Button variant="accent" size="lg" className="w-full sm:w-auto text-sm md:text-base px-6 md:px-8 py-3 md:py-4">
                {t('getStarted')}
              </Button>
            </Link>
            <Link to="/browse">
              <Button variant="outline" size="lg" className="w-full sm:w-auto border-white text-white hover:bg-white hover:text-graphite text-sm md:text-base px-6 md:px-8 py-3 md:py-4">
                {t('browseProjects')}
              </Button>
            </Link>
          </div>
        </div>
        <div className="mt-8 md:mt-12 lg:mt-0 slide-in-right">
          <div className="relative">
            <img 
              src={hero} 
              alt="Woman typing on keyboard" 
              className="w-[280px] sm:w-[320px] md:w-[400px] lg:w-[480px] xl:w-[520px] rounded-2xl md:rounded-3xl shadow-2xl border border-white/20 object-cover" 
            />
            <div className="absolute -top-2 md:-top-4 -right-2 md:-right-4 w-16 h-16 md:w-24 md:h-24 bg-mint/20 rounded-full blur-xl"></div>
            <div className="absolute -bottom-2 md:-bottom-4 -left-2 md:-left-4 w-20 h-20 md:w-32 md:h-32 bg-violet/20 rounded-full blur-xl"></div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 md:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6">
              Why Choose <span className="text-mint">Maayo</span>?
            </h2>
            <p className="text-base md:text-lg lg:text-xl text-white/80 max-w-3xl mx-auto">
              We provide the tools and platform you need to succeed in the modern freelance economy
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <div className="card-elevated p-6 md:p-8 text-center slide-in-up group">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-mint/20 rounded-2xl mx-auto mb-4 md:mb-6 flex items-center justify-center group-hover:bg-mint/30 transition-colors">
                <svg className="w-6 h-6 md:w-8 md:h-8 text-mint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-graphite mb-3 md:mb-4">{t('trustedTalent')}</h3>
              <p className="text-sm md:text-base text-coolgray leading-relaxed">{t('trustedTalentDesc')}</p>
            </div>
            <div className="card-elevated p-6 md:p-8 text-center slide-in-up group" style={{animationDelay: '0.1s'}}>
              <div className="w-12 h-12 md:w-16 md:h-16 bg-violet/20 rounded-2xl mx-auto mb-4 md:mb-6 flex items-center justify-center group-hover:bg-violet/30 transition-colors">
                <svg className="w-6 h-6 md:w-8 md:h-8 text-violet" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-graphite mb-3 md:mb-4">{t('securePayments')}</h3>
              <p className="text-sm md:text-base text-coolgray leading-relaxed">{t('securePaymentsDesc')}</p>
            </div>
            <div className="card-elevated p-6 md:p-8 text-center slide-in-up group" style={{animationDelay: '0.2s'}}>
              <div className="w-12 h-12 md:w-16 md:h-16 bg-coral/20 rounded-2xl mx-auto mb-4 md:mb-6 flex items-center justify-center group-hover:bg-coral/30 transition-colors">
                <svg className="w-6 h-6 md:w-8 md:h-8 text-coral" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-graphite mb-3 md:mb-4">{t('fastHiring')}</h3>
              <p className="text-sm md:text-base text-coolgray leading-relaxed">{t('fastHiringDesc')}</p>
          </div>
          </div>
        </div>
      </section>

      {/* Featured Projects */}
      <section className="py-12 md:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6">
              {t('featuredProjects')} <span className="text-mint">{t('projects')}</span>
            </h2>
            <p className="text-base md:text-lg lg:text-xl text-white/80 max-w-3xl mx-auto">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-12">
              {projects.map((project, index) => (
                <div key={project._id} className="card-elevated p-6 md:p-8 bg-white/95 hover:bg-white transition-all duration-300 group slide-in-up" style={{animationDelay: `${index * 0.1}s`}}>
                  <div className="flex flex-col h-full">
                    <div className="flex-1">
                      <h3 className="text-xl md:text-2xl font-bold text-graphite mb-3 md:mb-4 line-clamp-2 group-hover:text-mint transition-colors">
                        {project.title}
                      </h3>
                      <p className="text-coolgray text-sm md:text-base mb-4 md:mb-6 line-clamp-3 leading-relaxed">
                        {project.description}
                      </p>
                      
                      <div className="grid grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6">
                        <div className="p-3 md:p-4 bg-mint/10 rounded-xl">
                          <p className="text-xs md:text-sm text-coolgray uppercase tracking-wide font-semibold mb-1 md:mb-2">Budget</p>
                          <p className="text-lg md:text-xl font-bold text-mint">{formatBudget(project.budget)}</p>
                        </div>
                        <div className="p-3 md:p-4 bg-coral/10 rounded-xl">
                          <p className="text-xs md:text-sm text-coolgray uppercase tracking-wide font-semibold mb-1 md:mb-2">Duration</p>
                          <p className="text-lg md:text-xl font-bold text-coral">{project.duration} days</p>
                        </div>
                      </div>

                      {/* Skills */}
                      {project.skills_required && project.skills_required.length > 0 && (
                        <div className="mb-4 md:mb-6">
                          <p className="text-xs md:text-sm text-coolgray uppercase tracking-wide font-semibold mb-2 md:mb-3">Skills Required</p>
                          <div className="flex flex-wrap gap-2">
                            {project.skills_required.slice(0, 4).map((skill, index) => (
                              <span
                                key={index}
                                className="px-2 md:px-3 py-1 bg-violet/10 text-violet rounded-full text-xs md:text-sm font-medium"
                              >
                                {skill.skill}
                              </span>
                            ))}
                            {project.skills_required.length > 4 && (
                              <span className="px-2 md:px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs md:text-sm font-medium">
                                +{project.skills_required.length - 4} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Project Details */}
                      <div className="space-y-2 md:space-y-3 text-xs md:text-sm text-coolgray mb-4 md:mb-6">
                        {project.location && (
                          <div className="flex items-center gap-2 md:gap-3">
                            <div className="w-6 h-6 md:w-8 md:h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                              <svg className="w-3 h-3 md:w-4 md:h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            </div>
                            <span className="font-medium">{project.location}</span>
                          </div>
                        )}
                        
                        {project.project_type && (
                          <div className="flex items-center gap-2 md:gap-3">
                            <div className="w-6 h-6 md:w-8 md:h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                              <svg className="w-3 h-3 md:w-4 md:h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                            </div>
                            <span className="font-medium">{project.project_type}</span>
                          </div>
                        )}

                        {project.experience_level && (
                          <div className="flex items-center gap-2 md:gap-3">
                            <div className="w-6 h-6 md:w-8 md:h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                              <svg className="w-3 h-3 md:w-4 md:h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                            </svg>
                            </div>
                            <span className="font-medium">{project.experience_level}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Posted Date */}
                    <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-gray-200">
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
                <Button variant="outline" className="px-6 md:px-8 py-2 md:py-3 text-base md:text-lg border-white text-white hover:bg-white hover:text-graphite">
                  View All Projects
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-12 md:py-16 lg:py-20">
        <div className="max-w-4xl mx-auto text-center px-4 md:px-6">
          <div className="card-elevated p-8 md:p-12 bg-white/95">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 text-graphite">
              Ready to get started?
            </h2>
            <p className="text-base md:text-lg lg:text-xl text-coolgray mb-6 md:mb-8 leading-relaxed">
              Join Maayo today and unlock your project's potential. Connect with talented freelancers or find amazing opportunities.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
        <Link to="/signup">
                <Button variant="accent" size="lg" className="w-full sm:w-auto text-sm md:text-base px-6 md:px-8 py-3 md:py-4">
                  {t('createAccount')}
                </Button>
              </Link>
              <Link to="/browse">
                <Button variant="outline" size="lg" className="w-full sm:w-auto border-primary text-primary hover:bg-primary hover:text-white text-sm md:text-base px-6 md:px-8 py-3 md:py-4">
                  Browse Projects
                </Button>
        </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
