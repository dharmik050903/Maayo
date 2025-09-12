import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import Header from '../components/Header'
import Button from '../components/Button'
import { authenticatedFetch, isAuthenticated, getCurrentUser, clearAuth } from '../utils/api'
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

export default function FreelancerDashboard() {
  const [userData, setUserData] = useState(null)
  const [freelancerInfo, setFreelancerInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const hasInitialized = useRef(false)
  const [message, setMessage] = useState(null)
  const [isFirstTime, setIsFirstTime] = useState(true)
  const [skillsList, setSkillsList] = useState([])
  const [selectedSkills, setSelectedSkills] = useState([])
  const [skillsSearchTerm, setSkillsSearchTerm] = useState('')
  const [availability, setAvailability] = useState('')
  const skillsInputRef = useRef(null)
  const [resumeLink, setResumeLink] = useState('')
  const [githubLink, setGithubLink] = useState('')
  const [certifications, setCertifications] = useState([{ name: '', link: '' }])
  const [profileData, setProfileData] = useState({
    hourly_rate: '',
    experience_level: '',
    summary: '',
    education: '',
    work_history: ''
  })
  const [employmentHistory, setEmploymentHistory] = useState([{ compayname: '', role: '', years: '', months: '' }])
  const [hasExperience, setHasExperience] = useState(true)


  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true
      console.log('FreelancerDashboard: useEffect started (first time)')
      
      // Check if user is authenticated
      if (!isAuthenticated()) {
        console.log('FreelancerDashboard: User not authenticated, redirecting to login')
        window.location.href = '/login'
        return
      }
      
      // Get user data
      const user = getCurrentUser()
      console.log('FreelancerDashboard: User data:', user)
      
      if (user) {
        setUserData(user)
        
        // Check if user already has a profile in database
        checkExistingProfile(user._id)
        fetchSkills()
      } else {
        console.log('FreelancerDashboard: No user data found')
        setLoading(false)
      }
    } else {
      console.log('FreelancerDashboard: Skipping duplicate initialization due to StrictMode')
    }
  }, [])

  // Handle clicking outside skills input to remove focus
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (skillsInputRef.current && !skillsInputRef.current.contains(event.target)) {
        skillsInputRef.current.blur()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const checkExistingProfile = async (userId) => {
    try {
      console.log('🔍 Checking if user already has profile in database...')
      console.log('🔍 User ID:', userId)
      
      // Check localStorage first
      const storedProfileId = localStorage.getItem('freelancer_profile_id')
      const profileCompleted = localStorage.getItem('freelancer_profile_completed')
      const profileData = localStorage.getItem('freelancer_profile_data')
      
      console.log('📝 localStorage check:', {
        storedProfileId,
        profileCompleted,
        profileData: profileData ? 'exists' : 'null'
      })
      
      // If we have completion flag and data, load the profile data but don't redirect
      if (profileCompleted === 'true' && profileData) {
        console.log('📝 Found completed profile in localStorage - loading profile data')
        try {
          const parsedProfileData = JSON.parse(profileData)
          setFreelancerInfo(parsedProfileData)
          setIsFirstTime(false)
          
          // Populate form data
          setProfileData({
            hourly_rate: parsedProfileData.hourly_rate || '',
            experience_level: parsedProfileData.experience_level || '',
            summary: parsedProfileData.overview || '',
            education: parsedProfileData.highest_education || '',
            work_history: parsedProfileData.work_history || ''
          })
          setSelectedSkills(parsedProfileData.skills?.map(skill => skill.skill_id) || [])
          setAvailability(parsedProfileData.availability || '')
          setResumeLink(parsedProfileData.resume_link || '')
          setGithubLink(parsedProfileData.github_link || '')
          setCertifications(parsedProfileData.certification?.length > 0 ? parsedProfileData.certification : [{ name: '', link: '' }])
          setEmploymentHistory(parsedProfileData.employement_history?.length > 0 ? parsedProfileData.employement_history : [{ compayname: '', role: '', years: '', months: '' }])
          setHasExperience(parsedProfileData.employement_history?.length > 0)
        } catch (error) {
          console.error('Error parsing profile data:', error)
        }
        setLoading(false)
        return
      }
      
      // If we have stored profile ID, verify it exists in database
      if (storedProfileId) {
        console.log('📝 Found stored profile ID, verifying in database...')
        
        try {
          const verifyResponse = await authenticatedFetch(`${API_BASE_URL}/freelancer/info/update`, {
            method: 'POST',
            body: JSON.stringify({ 
              _id: storedProfileId,
              title: "verification_check"
            })
          })
          
          if (verifyResponse.ok) {
            const data = await verifyResponse.json()
            console.log('✅ Profile exists in database - loading profile data')
            // Store the completion flag
            localStorage.setItem('freelancer_profile_completed', 'true')
            localStorage.setItem('freelancer_profile_data', JSON.stringify(data.data))
            
            // Load profile data instead of redirecting
            setFreelancerInfo(data.data)
            setIsFirstTime(false)
            
            // Populate form data
            setProfileData({
              hourly_rate: data.data.hourly_rate || '',
              experience_level: data.data.experience_level || '',
              summary: data.data.overview || '',
              education: data.data.highest_education || '',
              work_history: data.data.work_history || ''
            })
            setSelectedSkills(data.data.skills?.map(skill => skill.skill_id) || [])
            setAvailability(data.data.availability || '')
            setResumeLink(data.data.resume_link || '')
            setGithubLink(data.data.github_link || '')
            setCertifications(data.data.certification?.length > 0 ? data.data.certification : [{ name: '', link: '' }])
            setEmploymentHistory(data.data.employement_history?.length > 0 ? data.data.employement_history : [{ compayname: '', role: '', years: '', months: '' }])
            setHasExperience(data.data.employement_history?.length > 0)
            
            setLoading(false)
            return
          } else {
            console.log('❌ Stored profile not found in database, clearing localStorage')
            localStorage.removeItem('freelancer_profile_id')
            localStorage.removeItem('freelancer_profile_completed')
            localStorage.removeItem('freelancer_profile_data')
            localStorage.removeItem('freelancer_personId')
          }
        } catch (verifyError) {
          console.log('❌ Error verifying profile, clearing localStorage:', verifyError)
          localStorage.removeItem('freelancer_profile_id')
          localStorage.removeItem('freelancer_profile_completed')
          localStorage.removeItem('freelancer_profile_data')
          localStorage.removeItem('freelancer_personId')
        }
      }
      
      // No profile found - user needs to create one
      console.log('📊 No profile found - user needs to create profile')
      setLoading(false)
      
    } catch (error) {
      console.error('❌ Error checking profile:', error)
      setLoading(false)
    }
  }

  const fetchFreelancerInfo = async () => {
    try {
      // First try to fetch from database using stored profile ID
      const profileId = localStorage.getItem('freelancer_profile_id')
      
      if (profileId) {
        console.log('Attempting to fetch profile from database with ID:', {
          profileId: profileId,
          profileIdType: typeof profileId,
          profileIdLength: profileId?.length,
          localStorageKey: 'freelancer_profile_id'
        })
        
        // Try to fetch from database using update endpoint (which can also be used to get data)
        const requestBody = { _id: profileId }
        console.log('Making API request to fetch profile:', {
          url: 'http://localhost:5000/api/freelancer/info/update',
          method: 'POST',
          body: requestBody
        })
        const response = await authenticatedFetch(`${API_BASE_URL}/freelancer/info/update`, {
          method: 'POST',
          body: JSON.stringify(requestBody)
        })
        
        if (response.ok) {
          const data = await response.json()
          console.log('Profile fetched from database:', data.data)
          
          setFreelancerInfo(data.data)
          setIsFirstTime(false)
          
          // Populate form data
          setProfileData({
            hourly_rate: data.data.hourly_rate || '',
            experience_level: data.data.experience_level || '',
            summary: data.data.overview || '',
            education: data.data.highest_education || '',
            work_history: data.data.work_history || ''
          })
          setSelectedSkills(data.data.skills?.map(skill => skill.skill_id) || [])
          setAvailability(data.data.availability || '')
          setResumeLink(data.data.resume_link || '')
          setGithubLink(data.data.github_link || '')
          setCertifications(data.data.certification?.length > 0 ? data.data.certification : [{ name: '', link: '' }])
          setEmploymentHistory(data.data.employement_history?.length > 0 ? data.data.employement_history : [{ compayname: '', role: '', years: '', months: '' }])
          setHasExperience(data.data.employement_history?.length > 0)
          
          // Update localStorage with fresh data from database
          localStorage.setItem('freelancer_profile_data', JSON.stringify(data.data))
          localStorage.setItem('freelancer_profile_completed', 'true')
          
          setLoading(false)
          return
        } else {
          console.log('Profile not found in database, falling back to localStorage')
        }
      }
      
      // Fallback to localStorage if database fetch fails
      const savedProfile = localStorage.getItem('freelancer_profile_data')
      
      if (savedProfile) {
        const profileData = JSON.parse(savedProfile)
        setFreelancerInfo(profileData)
        setIsFirstTime(false)
        
        // Populate form data
        setProfileData({
          hourly_rate: profileData.hourly_rate || '',
          experience_level: profileData.experience_level || '',
          summary: profileData.overview || '',
          education: profileData.highest_education || '',
          work_history: profileData.work_history || ''
        })
        setSelectedSkills(profileData.skills?.map(skill => skill.skill_id) || [])
        setAvailability(profileData.availability || '')
        setResumeLink(profileData.resume_link || '')
        setGithubLink(profileData.github_link || '')
        setCertifications(profileData.certification?.length > 0 ? profileData.certification : [{ name: '', link: '' }])
        setEmploymentHistory(profileData.employement_history?.length > 0 ? profileData.employement_history : [{ compayname: '', role: '', years: '', months: '' }])
        setHasExperience(profileData.employement_history?.length > 0)
      } else {
        setIsFirstTime(true)
        setFreelancerInfo(null)
      }
    } catch (error) {
      console.error('Error fetching freelancer info:', error)
      // If error, assume first time
      setIsFirstTime(true)
    } finally {
      setLoading(false)
    }
  }

  const getFallbackSkills = () => {
    return [
      { _id: 'skill_1', skill: 'React', category: 'Frontend' },
      { _id: 'skill_2', skill: 'Node.js', category: 'Backend' },
      { _id: 'skill_3', skill: 'JavaScript', category: 'Programming' },
      { _id: 'skill_4', skill: 'Python', category: 'Programming' },
      { _id: 'skill_5', skill: 'HTML/CSS', category: 'Frontend' },
      { _id: 'skill_6', skill: 'MongoDB', category: 'Database' },
      { _id: 'skill_7', skill: 'Express.js', category: 'Backend' },
      { _id: 'skill_8', skill: 'UI/UX Design', category: 'Design' },
      { _id: 'skill_9', skill: 'Figma', category: 'Design' },
      { _id: 'skill_10', skill: 'Git', category: 'Tools' },
      { _id: 'skill_11', skill: 'AWS', category: 'Cloud' },
      { _id: 'skill_12', skill: 'Docker', category: 'DevOps' },
      { _id: 'skill_13', skill: 'TypeScript', category: 'Programming' },
      { _id: 'skill_14', skill: 'Vue.js', category: 'Frontend' },
      { _id: 'skill_15', skill: 'Angular', category: 'Frontend' },
      { _id: 'skill_16', skill: 'PHP', category: 'Backend' },
      { _id: 'skill_17', skill: 'Laravel', category: 'Backend' },
      { _id: 'skill_18', skill: 'MySQL', category: 'Database' },
      { _id: 'skill_19', skill: 'PostgreSQL', category: 'Database' },
      { _id: 'skill_20', skill: 'GraphQL', category: 'Backend' }
    ]
  }

  const fetchSkills = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/skills`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('Skills fetched:', data)
        setSkillsList(data.data || [])
      } else {
        console.error('Failed to fetch skills:', response.status)
      }
    } catch (error) {
      console.error('Error fetching skills:', error)
      // Fallback skills list if API fails
      setSkillsList(getFallbackSkills())
    }
  }

  const handleSkillToggle = (skill) => {
    setSelectedSkills(prev => 
      prev.includes(skill._id) 
        ? prev.filter(id => id !== skill._id)
        : [...prev, skill._id]
    )
  }

  const handleAvailabilityChange = (type) => {
    setAvailability(type)
  }

  const addCertification = () => {
    setCertifications(prev => [...prev, { name: '', link: '' }])
  }

  const removeCertification = (index) => {
    setCertifications(prev => prev.filter((_, i) => i !== index))
  }

  const updateCertification = (index, field, value) => {
    setCertifications(prev => 
      prev.map((cert, i) => 
        i === index ? { ...cert, [field]: value } : cert
      )
    )
  }

  const addEmploymentHistory = () => {
    setEmploymentHistory(prev => [...prev, { compayname: '', role: '', years: '', months: '' }])
  }

  const removeEmploymentHistory = (index) => {
    setEmploymentHistory(prev => prev.filter((_, i) => i !== index))
  }

  const updateEmploymentHistory = (index, field, value) => {
    setEmploymentHistory(prev => 
      prev.map((emp, i) => 
        i === index ? { ...emp, [field]: value } : emp
      )
    )
  }

  const handleProfileChange = (field, value) => {
    setProfileData(prev => ({ ...prev, [field]: value }))
  }

  const handleSaveCertificates = async () => {
    setSaving(true)
    setMessage(null)
    
    // Validate required fields
    if (!resumeLink.trim()) {
      setMessage({ type: 'error', text: 'Resume link is required. Please paste your open link of resume.' })
      setSaving(false)
      return
    }
    
    try {
      const profilePayload = {
        title: `${userData?.first_name} ${userData?.last_name}`,
        overview: profileData.summary,
        skills: selectedSkills.map(skillId => {
          const skill = skillsList.find(s => s._id === skillId)
          return {
            skill: skill?.skill || '',
            skill_id: skillId
          }
        }),
        hourly_rate: profileData.hourly_rate,
        experience_level: profileData.experience_level,
        availability: availability,
        resume_link: resumeLink,
        github_link: githubLink,
        certification: certifications.filter(cert => cert.name.trim() !== ''),
        employement_history: hasExperience ? employmentHistory.filter(emp => emp.compayname.trim() !== '') : [],
        highest_education: profileData.education
      }

      let response
      
      if (isFirstTime) {
        // First time - create profile
        response = await authenticatedFetch(`${API_BASE_URL}/freelancer/info`, {
          method: 'POST',
          body: JSON.stringify(profilePayload)
        })
      } else {
        // Update existing profile
        response = await authenticatedFetch(`${API_BASE_URL}/freelancer/info/update`, {
          method: 'POST',
          body: JSON.stringify({
            ...profilePayload,
            _id: freelancerInfo?._id
          })
        })
      }

      if (response.ok) {
        const data = await response.json()
        setMessage({ type: 'success', text: 'Certificates saved successfully! 🎉' })
        
        // Store profile data in localStorage
        localStorage.setItem('freelancer_profile_data', JSON.stringify(data.data))
        setIsFirstTime(false)
        setFreelancerInfo(data.data)
      } else {
        const data = await response.json()
        setMessage({ type: 'error', text: data.message || 'Failed to save certificates' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Something went wrong. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    setMessage(null)

    // Validate required fields
    if (!resumeLink.trim()) {
      setMessage({ type: 'error', text: 'Resume link is required. Please paste your open link of resume.' })
      setSaving(false)
      return
    }

    try {
      const profilePayload = {
        title: `${userData?.first_name} ${userData?.last_name}`,
        overview: profileData.summary,
        skills: selectedSkills.map(skillId => {
          const skill = skillsList.find(s => s._id === skillId)
          return {
            skill: skill?.skill || '',
            skill_id: skillId
          }
        }),
        hourly_rate: profileData.hourly_rate,
        experience_level: profileData.experience_level,
        availability: availability,
        resume_link: resumeLink,
        github_link: githubLink,
        certification: certifications.filter(cert => cert.name.trim() !== ''),
        employement_history: hasExperience ? employmentHistory.filter(emp => emp.compayname.trim() !== '') : [],
        highest_education: profileData.education
      }

      let response
      let apiEndpoint
      
      if (isFirstTime) {
        // First time - create profile
        apiEndpoint = `${API_BASE_URL}/freelancer/info`
        response = await authenticatedFetch(apiEndpoint, {
          method: 'POST',
          body: JSON.stringify(profilePayload)
        })
      } else {
        // Update existing profile
        apiEndpoint = `${API_BASE_URL}/freelancer/info/update`
        response = await authenticatedFetch(apiEndpoint, {
          method: 'POST',
          body: JSON.stringify({
            ...profilePayload,
            _id: freelancerInfo?._id
          })
        })
      }

      if (response.ok) {
        const data = await response.json()
        const successMessage = isFirstTime ? 'Profile created successfully! 🎉' : 'Profile updated successfully! 🎉'
        setMessage({ type: 'success', text: successMessage })
        
        localStorage.setItem('freelancer_profile_data', JSON.stringify(data.data))
        localStorage.setItem('freelancer_profile_completed', 'true')
        localStorage.setItem('freelancer_profile_id', data.data._id)
        localStorage.setItem('freelancer_personId', data.data.personId)
        
        // Debug logging
        console.log('FreelancerDashboard: Profile saved to localStorage', {
          fullResponse: data,
          profileData: data.data,
          completed: 'true',
          profileId: data.data._id,
          personId: data.data.personId,
          profileIdType: typeof data.data._id,
          profileIdLength: data.data._id?.length
        })
        
        console.log('🔍 Verifying localStorage after save:', {
          profileData: localStorage.getItem('freelancer_profile_data'),
          profileCompleted: localStorage.getItem('freelancer_profile_completed'),
          profileId: localStorage.getItem('freelancer_profile_id'),
          personId: localStorage.getItem('freelancer_personId')
        })
        
        setIsFirstTime(false)
        setFreelancerInfo(data.data)
        
        setTimeout(() => {
          window.location.href = "/freelancer-home"
        }, 2000)
      } else {
        const data = await response.json()
        console.error('❌ Profile creation/update failed:', {
          status: response.status,
          statusText: response.statusText,
          errorData: data,
          apiEndpoint,
          profilePayload
        })
        setMessage({ type: 'error', text: data.message || `Failed to ${isFirstTime ? 'create' : 'update'} profile` })
      }
    } catch (error) {
      console.error('❌ Profile creation/update error:', error)
      setMessage({ type: 'error', text: 'Something went wrong. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = () => {
    clearAuth()
    window.location.href = '/'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }


  return (
    <div className="min-h-screen flex flex-col bg-brand-gradient text-white">
      <Header 
        userType="freelancer" 
        onLogout={handleLogout} 
        userData={userData}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-6 pt-28 pb-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold leading-tight">
            Welcome back, <span className="text-mint">{userData?.first_name}</span>!
          </h1>
          <p className="text-lg text-white/80 mt-4">
            Here's your freelancer dashboard overview
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card p-6 bg-white/95">
            <div className="flex items-center">
              <div className="p-3 bg-mint/20 rounded-lg">
                <svg className="w-6 h-6 text-mint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-coolgray">Total Earnings</p>
                <p className="text-2xl font-bold text-graphite">
                  ${freelancerInfo?.total_earnings || '0'}
                </p>
              </div>
            </div>
          </div>

          <div className="card p-6 bg-white/95">
            <div className="flex items-center">
              <div className="p-3 bg-violet/20 rounded-lg">
                <svg className="w-6 h-6 text-violet" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-coolgray">Active Projects</p>
                <p className="text-2xl font-bold text-graphite">
                  {freelancerInfo?.active_projects || '0'}
                </p>
              </div>
            </div>
          </div>

          <div className="card p-6 bg-white/95">
            <div className="flex items-center">
              <div className="p-3 bg-coral/20 rounded-lg">
                <svg className="w-6 h-6 text-coral" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-coolgray">Rating</p>
                <p className="text-2xl font-bold text-graphite">
                  {freelancerInfo?.rating || '4.8'}
                </p>
              </div>
            </div>
          </div>

          <div className="card p-6 bg-white/95">
            <div className="flex items-center">
              <div className="p-3 bg-primary/20 rounded-lg">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-coolgray">Hours Worked</p>
                <p className="text-2xl font-bold text-graphite">
                  {freelancerInfo?.total_hours || '0'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="card p-6 bg-white/95">
              <div className="text-center">
                <div className="w-24 h-24 bg-mint/20 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-2xl font-bold text-mint uppercase">
                    {userData?.first_name?.[0]}{userData?.last_name?.[0]}
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-graphite uppercase">
                  {userData?.first_name} {userData?.last_name}
                </h3>
                <p className="text-coolgray">{userData?.country}</p>
                <p className="text-sm text-coolgray mt-2">{userData?.email}</p>
              </div>
              
              <div className="mt-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-graphite mb-1">Hourly Rate ($)</label>
                  <input
                    type="number"
                    value={profileData.hourly_rate}
                    onChange={(e) => handleProfileChange('hourly_rate', e.target.value)}
                    placeholder="Enter hourly rate"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet text-sm text-graphite bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-graphite mb-1">Experience Level</label>
                  <select
                    value={profileData.experience_level}
                    onChange={(e) => handleProfileChange('experience_level', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet text-sm text-graphite bg-white"
                  >
                    <option value="">Select experience level</option>
                    <option value="Fresher">Fresher (0-2 years)</option>
                    <option value="Intermediate">Intermediate (2-5 years)</option>
                    <option value="Advanced">Advanced (5-10 years)</option>
                    <option value="Expert">Expert (10+ years)</option>
                  </select>
                  {profileData.experience_level === 'Fresher' && (
                    <p className="text-xs text-blue-600 mt-1">
                      💡 Perfect for beginners! Focus on your education, skills, and any projects you've worked on.
                    </p>
                  )}
                </div>
                <div>
                  <h4 className="font-medium text-graphite mb-3">Availability</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <button
                      onClick={() => handleAvailabilityChange('part-time')}
                      className={`px-3 py-2 rounded-lg border-2 transition-all duration-200 ${
                        availability === 'part-time'
                          ? 'border-coral bg-coral/10 text-coral'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-coral/50 hover:bg-coral/5'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-coral"></div>
                        <span className="font-medium text-sm">Part Time</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">Less than 30h/week</div>
                    </button>
                    
                    <button
                      onClick={() => handleAvailabilityChange('full-time')}
                      className={`px-3 py-2 rounded-lg border-2 transition-all duration-200 ${
                        availability === 'full-time'
                          ? 'border-mint bg-mint/10 text-mint'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-mint/50 hover:bg-mint/5'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-mint"></div>
                        <span className="font-medium text-sm">Full Time</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">30+ hours/week</div>
                    </button>
                    
                    <button
                      onClick={() => handleAvailabilityChange('contract')}
                      className={`px-3 py-2 rounded-lg border-2 transition-all duration-200 ${
                        availability === 'contract'
                          ? 'border-violet bg-violet/10 text-violet'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-violet/50 hover:bg-violet/5'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-violet"></div>
                        <span className="font-medium text-sm">Contract</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">Project-based</div>
                    </button>
                  </div>
                  
                  {availability && (
                    <p className="text-sm text-coolgray mt-2 text-center">
                      Selected: <span className="font-medium capitalize">{availability.replace('-', ' ')}</span>
                    </p>
                  )}
                </div>
                
                {/* Resume Link Field */}
                <div>
                  <label className="block text-sm font-medium text-graphite mb-1">
                    Resume Link <span className="text-coral">*</span>
                  </label>
                  <input
                    type="url"
                    value={resumeLink}
                    onChange={(e) => setResumeLink(e.target.value)}
                    placeholder="https://drive.google.com/file/d/your-resume-link/view"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet text-sm text-graphite bg-white"
                    required
                  />
                  <p className="text-xs text-coral mt-1">
                    Please paste your open link of resume
                  </p>
                </div>
                
                {/* GitHub Link Field */}
                <div>
                  <label className="block text-sm font-medium text-graphite mb-1">
                    GitHub Link <span className="text-coolgray text-xs">(Optional)</span>
                  </label>
                  <input
                    type="url"
                    value={githubLink}
                    onChange={(e) => setGithubLink(e.target.value)}
                    placeholder="https://github.com/yourusername"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet text-sm text-graphite bg-white"
                  />
                  <p className="text-xs text-coolgray mt-1">
                    Share your GitHub profile to showcase your projects
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Profile Details */}
            <div className="card p-6 bg-white/95">
              <h3 className="text-lg font-semibold text-graphite mb-4">Profile Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-graphite mb-2">Professional Summary</label>
                  <textarea
                    value={profileData.summary}
                    onChange={(e) => handleProfileChange('summary', e.target.value)}
                    placeholder="Tell clients about yourself, your experience, and what you can do for them..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet text-sm resize-none text-graphite bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-graphite mb-2">Education</label>
                  <textarea
                    value={profileData.education}
                    onChange={(e) => handleProfileChange('education', e.target.value)}
                    placeholder="List your educational background, degrees, certifications..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet text-sm resize-none text-graphite bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-graphite mb-2">Employment History</label>
                  
                  {/* Experience Toggle */}
                  <div className="mb-4">
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="hasExperience"
                          checked={hasExperience}
                          onChange={() => setHasExperience(true)}
                          className="mr-2 text-violet focus:ring-violet"
                        />
                        <span className="text-sm text-graphite">I have work experience</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="hasExperience"
                          checked={!hasExperience}
                          onChange={() => setHasExperience(false)}
                          className="mr-2 text-violet focus:ring-violet"
                        />
                        <span className="text-sm text-graphite">No work experience (Fresher)</span>
                      </label>
                    </div>
                  </div>

                  {hasExperience ? (
                    <div className="space-y-4">
                    {employmentHistory.map((emp, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="font-medium text-graphite">Employment {index + 1}</h4>
                          {employmentHistory.length > 1 && (
                            <button
                              onClick={() => removeEmploymentHistory(index)}
                              className="text-coral hover:text-red-600 text-sm"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-graphite mb-1">Company Name</label>
                            <input
                              type="text"
                              value={emp.compayname}
                              onChange={(e) => updateEmploymentHistory(index, 'compayname', e.target.value)}
                              placeholder="Company name"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet text-sm text-graphite bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-graphite mb-1">Role/Position</label>
                            <input
                              type="text"
                              value={emp.role}
                              onChange={(e) => updateEmploymentHistory(index, 'role', e.target.value)}
                              placeholder="Your role/position"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet text-sm text-graphite bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-graphite mb-1">Years</label>
                            <input
                              type="number"
                              value={emp.years}
                              onChange={(e) => updateEmploymentHistory(index, 'years', parseInt(e.target.value) || 0)}
                              placeholder="Years"
                              min="0"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet text-sm text-graphite bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-graphite mb-1">Months</label>
                            <input
                              type="number"
                              value={emp.months}
                              onChange={(e) => updateEmploymentHistory(index, 'months', parseInt(e.target.value) || 0)}
                              placeholder="Months"
                              min="0"
                              max="11"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet text-sm text-graphite bg-white"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                      <button
                        onClick={addEmploymentHistory}
                        className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-coolgray hover:border-violet hover:text-violet transition-colors"
                      >
                        + Add Another Employment
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                      <div className="text-gray-500 mb-2">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-1">No Work Experience</h3>
                      <p className="text-sm text-gray-500 mb-4">You're starting fresh! Focus on your education, skills, and certifications.</p>
                      <div className="text-xs text-gray-400">
                        💡 <strong>Tip:</strong> Highlight your education, projects, and any relevant skills to stand out to clients.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Skills */}
            <div className="card p-6 bg-white/95">
              <h3 className="text-lg font-semibold text-graphite mb-4">Skills</h3>
              
              {/* Skills Multi-Select */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-graphite mb-2">Select Your Skills</label>
                
                {/* Skills Search Input */}
                <div className="mb-3">
                  <input
                    ref={skillsInputRef}
                    type="text"
                    placeholder="Search skills..."
                    value={skillsSearchTerm}
                    onChange={(e) => setSkillsSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-graphite bg-white focus:outline-none focus:ring-2 focus:ring-violet/50 focus:border-violet"
                  />
                </div>
                
                {skillsList.length === 0 ? (
                  <div className="p-4 text-center text-coolgray border border-gray-300 rounded-md">
                    <p>Loading skills...</p>
                    <button 
                      onClick={() => setSkillsList(getFallbackSkills())}
                      className="mt-2 px-3 py-1 bg-violet text-white rounded text-sm hover:bg-violet/80"
                    >
                      Load Sample Skills
                    </button>
                  </div>
                ) : (
                  <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md p-2">
                    {skillsList
                      .filter(skill => 
                        skill.skill.toLowerCase().includes(skillsSearchTerm.toLowerCase()) ||
                        skill.category.toLowerCase().includes(skillsSearchTerm.toLowerCase())
                      )
                      .map((skill) => (
                      <label key={skill._id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedSkills.includes(skill._id)}
                          onChange={() => handleSkillToggle(skill)}
                          className="rounded border-gray-300 text-violet focus:ring-violet"
                        />
                        <span className="text-sm text-graphite">{skill.skill}</span>
                        <span className="text-xs text-coolgray">({skill.category})</span>
                      </label>
                    ))}
                    {skillsList.filter(skill => 
                      skill.skill.toLowerCase().includes(skillsSearchTerm.toLowerCase()) ||
                      skill.category.toLowerCase().includes(skillsSearchTerm.toLowerCase())
                    ).length === 0 && skillsSearchTerm && (
                      <div className="p-4 text-center text-coolgray">
                        <p>No skills found matching "{skillsSearchTerm}"</p>
                      </div>
                    )}
                  </div>
                )}
                {selectedSkills.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-coolgray mb-2">Selected Skills:</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedSkills.map(skillId => {
                        const skill = skillsList.find(s => s._id === skillId)
                        return skill ? (
                          <span key={skillId} className="px-3 py-1 bg-mint/20 text-mint rounded-full text-sm font-medium">
                            {skill.skill}
                          </span>
                        ) : null
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Certifications */}
            <div className="card p-6 bg-white/95">
              <h3 className="text-lg font-semibold text-graphite mb-4">Certifications</h3>
              <div className="space-y-4">
                {certifications.map((cert, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium text-graphite">Certification {index + 1}</h4>
                      {certifications.length > 1 && (
                        <button
                          onClick={() => removeCertification(index)}
                          className="text-coral hover:text-red-600 text-sm"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-graphite mb-1">Certification Name</label>
                        <input
                          type="text"
                          value={cert.name}
                          onChange={(e) => updateCertification(index, 'name', e.target.value)}
                          placeholder="e.g., AWS Certified Solutions Architect"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet text-sm text-graphite bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-graphite mb-1">Certification Link (URL)</label>
                        <input
                          type="url"
                          value={cert.link}
                          onChange={(e) => updateCertification(index, 'link', e.target.value)}
                          placeholder="https://example.com/certificate"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet text-sm text-graphite bg-white"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <div className="flex gap-3">
                  <button
                    onClick={handleSaveCertificates}
                    className="flex-1 py-2 bg-violet text-white rounded-lg hover:bg-violet/90 transition-colors font-medium"
                  >
                    Add Certificate
                  </button>
                  <button
                    onClick={addCertification}
                    className="flex-1 py-2 border-2 border-dashed border-gray-300 rounded-lg text-coolgray hover:border-violet hover:text-violet transition-colors"
                  >
                    + Add Another Certification
                  </button>
                </div>
              </div>
            </div>

            {/* Save Profile Button */}
            <div className="card p-6 bg-white border-2 border-violet/20">
              <h3 className="text-lg font-semibold text-graphite mb-4">{isFirstTime ? 'Create Profile' : 'Save Changes'}</h3>
              <div className="flex flex-col space-y-4">
                {/* Message Display */}
                {message && (
                  <div className={`p-4 rounded-lg ${
                    message.type === 'success' 
                      ? 'bg-mint/20 text-mint border border-mint/30' 
                      : 'bg-coral/20 text-coral border border-coral/30'
                  }`}>
                    {message.text}
                  </div>
                )}
                
                {/* Save Button */}
                <button 
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="w-full py-3 px-4 bg-violet text-white rounded-lg font-semibold text-lg hover:bg-violet/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? (isFirstTime ? 'Creating Profile...' : 'Saving Profile...') : (isFirstTime ? 'Create Profile' : 'Save Profile')}
                </button>
              </div>
            </div>

            {/* Recent Projects */}
            <div className="card p-6 bg-white/95">
              <h3 className="text-lg font-semibold text-graphite mb-4">Recent Projects</h3>
              <div className="space-y-4">
                <div className="border-l-4 border-mint pl-4">
                  <h4 className="font-medium text-graphite">Website Development</h4>
                  <p className="text-sm text-coolgray">Client: John Doe</p>
                  <p className="text-sm text-coolgray">Completed 2 days ago</p>
                </div>
                <div className="border-l-4 border-violet pl-4">
                  <h4 className="font-medium text-graphite">Mobile App Design</h4>
                  <p className="text-sm text-coolgray">Client: Jane Smith</p>
                  <p className="text-sm text-coolgray">In Progress</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
