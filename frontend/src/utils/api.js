// API utility functions for making authenticated requests and managing user data

// Base API URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

/**
 * Get authentication headers from localStorage
 * @returns {Object} Headers object with auth data
 */
export function getAuthHeaders() {
  const authHeaders = localStorage.getItem('authHeaders')
  console.log('getAuthHeaders: Raw authHeaders from localStorage:', authHeaders)
  
  if (!authHeaders) {
    console.log('getAuthHeaders: No auth headers found in localStorage')
    return {}
  }
  
  try {
    const { token, _id, userRole, userEmail } = JSON.parse(authHeaders)
    
    // Get user data to include name in headers
    const userData = getCurrentUser()
    const firstName = userData?.first_name || userData?.personName?.split(' ')[0] || ''
    const lastName = userData?.last_name || userData?.personName?.split(' ').slice(1).join(' ') || ''
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'id': _id,
      'user_role': userRole,
      'user_email': userEmail,
      'first_name': firstName,
      'last_name': lastName
    }
    console.log('getAuthHeaders: Parsed headers:', headers)
    return headers
  } catch (error) {
    console.error('getAuthHeaders: Error parsing auth headers:', error)
    return {}
  }
}

/**
 * Make an authenticated API request
 * @param {string} url - API endpoint URL
 * @param {Object} options - Fetch options
 * @returns {Promise} Fetch response
 */
export async function authenticatedFetch(url, options = {}) {
  const authHeaders = getAuthHeaders()
  
  // Merge auth headers with existing headers
  const headers = {
    ...authHeaders,
    ...options.headers
  }
  
  console.log('authenticatedFetch: Making request to:', url)
  console.log('authenticatedFetch: Headers:', headers)
  console.log('authenticatedFetch: Options:', options)
  
  try {
    const response = await fetch(url, {
      ...options,
      headers
    })
    
    console.log('authenticatedFetch: Response status:', response.status)
    console.log('authenticatedFetch: Response ok:', response.ok)
    
    // Handle 401 Unauthorized responses
    if (response.status === 401) {
      console.log('Unauthorized access, clearing auth data')
      clearAuth()
      window.location.href = '/login'
      return response
    }
    
    return response
  } catch (error) {
    console.error('authenticatedFetch: Error making request:', error)
    console.error('authenticatedFetch: Error type:', typeof error)
    console.error('authenticatedFetch: Error message:', error.message)
    console.error('authenticatedFetch: Error name:', error.name)
    throw error
  }
}

/**
 * Check if user is authenticated and token is valid
 * @returns {boolean} True if user has valid auth data and token
 */
export function isAuthenticated() {
  const authHeaders = localStorage.getItem('authHeaders')
  const authToken = localStorage.getItem('authToken')
  
  if (!authHeaders || !authToken) {
    return false
  }
  
  try {
    // Parse the token to check if it's expired
    const tokenPayload = JSON.parse(atob(authToken.split('.')[1]))
    const currentTime = Math.floor(Date.now() / 1000)
    
    // Check if token is expired
    if (tokenPayload.exp && tokenPayload.exp < currentTime) {
      console.log('Token has expired, clearing auth data')
      clearAuth()
      return false
    }
    
    return true
  } catch (error) {
    console.error('Error checking token validity:', error)
    // If we can't parse the token, clear auth data
    clearAuth()
    return false
  }
}

/**
 * Get current user data
 * @returns {Object|null} User data or null
 */
export function getCurrentUser() {
  const userData = localStorage.getItem('userData')
  if (!userData) return null
  
  try {
    return JSON.parse(userData)
  } catch (error) {
    console.error('Error parsing user data:', error)
    return null
  }
}

/**
 * Clear all authentication and user data from localStorage
 */
export function clearAuth() {
  localStorage.removeItem('authToken')
  localStorage.removeItem('userData')
  localStorage.removeItem('authHeaders')
  localStorage.removeItem('tokenExpiration')
  // Don't clear profile data - it should persist across logins
  // localStorage.removeItem('freelancer_profile_completed')
  // localStorage.removeItem('client_profile_completed')
  // localStorage.removeItem('freelancer_profile_data')
  // localStorage.removeItem('client_profile_data')
  // localStorage.removeItem('freelancer_profile_id')
  // localStorage.removeItem('client_profile_id')
}

/**
 * Clear all data including profile data (use only on actual logout)
 */
export function clearAllData() {
  localStorage.removeItem('authToken')
  localStorage.removeItem('userData')
  localStorage.removeItem('authHeaders')
  localStorage.removeItem('tokenExpiration')
  localStorage.removeItem('freelancer_profile_completed')
  localStorage.removeItem('client_profile_completed')
  localStorage.removeItem('freelancer_profile_data')
  localStorage.removeItem('client_profile_data')
  localStorage.removeItem('freelancer_profile_id')
  localStorage.removeItem('client_profile_id')
  localStorage.removeItem('freelancer_personId')
  localStorage.removeItem('client_personId')
  localStorage.removeItem('current_user_id')
}

/**
 * Store authentication data in localStorage
 * @param {Object} authData - Authentication data
 */
export function storeAuthData(authData) {
  const { token, user } = authData
  
  // Store individual items
  localStorage.setItem('authToken', token)
  localStorage.setItem('userData', JSON.stringify(user))
  
  // Store auth headers for API calls
  const authHeaders = {
    token,
    _id: user._id,
    userRole: user.user_type,
    userEmail: user.email
  }
  localStorage.setItem('authHeaders', JSON.stringify(authHeaders))
  
  // Store token expiration time for easy checking
  try {
    const tokenPayload = JSON.parse(atob(token.split('.')[1]))
    if (tokenPayload.exp) {
      localStorage.setItem('tokenExpiration', tokenPayload.exp.toString())
    }
  } catch (error) {
    console.error('Error storing token expiration:', error)
  }
}

/**
 * Check if token is close to expiration (within 7 days)
 * @returns {boolean} True if token expires within 7 days
 */
export function isTokenNearExpiration() {
  const tokenExpiration = localStorage.getItem('tokenExpiration')
  if (!tokenExpiration) return false
  
  const expirationTime = parseInt(tokenExpiration)
  const currentTime = Math.floor(Date.now() / 1000)
  const sevenDaysInSeconds = 7 * 24 * 60 * 60 // 7 days
  
  return (expirationTime - currentTime) < sevenDaysInSeconds
}

/**
 * Get token expiration date
 * @returns {Date|null} Token expiration date or null
 */
export function getTokenExpirationDate() {
  const tokenExpiration = localStorage.getItem('tokenExpiration')
  if (!tokenExpiration) return null
  
  const expirationTime = parseInt(tokenExpiration)
  return new Date(expirationTime * 1000)
}

/**
 * Check and maintain user session
 * This should be called on app startup to ensure user stays logged in
 * @returns {Object} Session status
 */
export function checkSession() {
  const isAuth = isAuthenticated()
  const user = getCurrentUser()
  const tokenExpiration = getTokenExpirationDate()
  
  if (!isAuth || !user) {
    return {
      isAuthenticated: false,
      user: null,
      tokenExpiration: null,
      message: 'User not authenticated'
    }
  }
  
  const now = new Date()
  const timeUntilExpiration = tokenExpiration ? tokenExpiration.getTime() - now.getTime() : 0
  const daysUntilExpiration = Math.floor(timeUntilExpiration / (1000 * 60 * 60 * 24))
  
  return {
    isAuthenticated: true,
    user,
    tokenExpiration,
    daysUntilExpiration,
    isNearExpiration: isTokenNearExpiration(),
    message: `Session valid for ${daysUntilExpiration} more days`
  }
}

// ============================================================================
// AUTHENTICATION API FUNCTIONS
// ============================================================================

/**
 * Login user
 * @param {Object} credentials - Login credentials
 * @returns {Promise} Login response
 */
export async function loginUser(credentials) {
  const response = await fetch(`${API_BASE_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(credentials)
  })
  
  const data = await response.json()
  
  if (response.ok) {
    storeAuthData(data)
  }
  
  return { response, data }
}

/**
 * Register new user
 * @param {Object} userData - User registration data
 * @returns {Promise} Registration response
 */
export async function registerUser(userData) {
  const response = await fetch(`${API_BASE_URL}/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(userData)
  })
  
  const data = await response.json()
  return { response, data }
}

// ============================================================================
// FREELANCER API FUNCTIONS
// ============================================================================

/**
 * Create freelancer profile
 * @param {Object} profileData - Freelancer profile data
 * @returns {Promise} Create response
 */
export async function createFreelancerProfile(profileData) {
  const response = await authenticatedFetch(`${API_BASE_URL}/freelancer/info`, {
    method: 'POST',
    body: JSON.stringify(profileData)
  })
  
  const data = await response.json()
  return { response, data }
}

/**
 * Update freelancer profile
 * @param {Object} profileData - Updated freelancer profile data
 * @returns {Promise} Update response
 */
export async function updateFreelancerProfile(profileData) {
  const response = await authenticatedFetch(`${API_BASE_URL}/freelancer/info/update`, {
    method: 'POST',
    body: JSON.stringify(profileData)
  })
  
  const data = await response.json()
  return { response, data }
}

/**
 * Fetch freelancer profile by user ID
 * @param {string} userId - User ID (personId from tblpersonmaster)
 * @returns {Promise<Object>} Freelancer profile data
 */
export async function fetchFreelancerProfile(userId) {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/freelancer/list`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ id: userId })
    })
    
    if (response.ok) {
      const data = await response.json()
      return { response, data }
    }
    
    return { response, data: { status: false, message: 'Failed to fetch profile' } }
  } catch (error) {
    console.error('Error fetching freelancer profile:', error)
    return { response: null, data: { status: false, message: error.message } }
  }
}

/**
 * Check if freelancer profile exists
 * @param {string} userId - User ID (personId from tblpersonmaster)
 * @returns {Promise<boolean>} True if profile exists
 */
export async function checkFreelancerProfileExists(userId) {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/freelancer/list`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ id: userId })
    })
    
    if (response.ok) {
      const data = await response.json()
      return data.status && data.data && data.data.personId // Check if personId matches
    }
    return false
  } catch (error) {
    console.error('Error checking freelancer profile:', error)
    return false
  }
}

// ============================================================================
// CLIENT API FUNCTIONS
// ============================================================================

/**
 * Create client profile
 * @param {Object} profileData - Client profile data
 * @returns {Promise} Create response
 */
export async function createClientProfile(profileData) {
  const response = await authenticatedFetch(`${API_BASE_URL}/client/info`, {
    method: 'POST',
    body: JSON.stringify(profileData)
  })
  
  const data = await response.json()
  return { response, data }
}

/**
 * Update client profile
 * @param {Object} profileData - Updated client profile data
 * @returns {Promise} Update response
 */
export async function updateClientProfile(profileData) {
  const response = await authenticatedFetch(`${API_BASE_URL}/client/info/update`, {
    method: 'POST',
    body: JSON.stringify(profileData)
  })
  
  const data = await response.json()
  return { response, data }
}

/**
 * Check if client profile exists
 * @param {string} userId - User ID (personId from tblpersonmaster)
 * @returns {Promise<boolean>} True if profile exists
 */
export async function checkClientProfileExists(userId) {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/client/info/update`, {
      method: 'POST',
      body: JSON.stringify({ personId: userId })
    })
    
    if (response.ok) {
      const data = await response.json()
      return data.data && data.data.personId // Check if personId matches
    }
    return false
  } catch (error) {
    console.error('Error checking client profile:', error)
    return false
  }
}

// ============================================================================
// SKILLS API FUNCTIONS
// ============================================================================

/**
 * Get all skills
 * @returns {Promise} Skills response
 */
export async function getSkills() {
  const response = await fetch(`${API_BASE_URL}/skills`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  })
  
  const data = await response.json()
  return { response, data }
}

// ============================================================================
// PROJECT API FUNCTIONS
// ============================================================================

/**
 * Create new project
 * @param {Object} projectData - Project data
 * @returns {Promise} Create response
 */
export async function createProject(projectData) {
  const response = await authenticatedFetch(`${API_BASE_URL}/project/create`, {
    method: 'POST',
    body: JSON.stringify(projectData)
  })
  
  const data = await response.json()
  return { response, data }
}

/**
 * Get projects list
 * @param {Object} filters - Project filters
 * @returns {Promise} Projects response
 */
export async function getProjects(filters = {}) {
  const response = await authenticatedFetch(`${API_BASE_URL}/project/list`, {
    method: 'POST',
    body: JSON.stringify(filters)
  })
  
  const data = await response.json()
  return { response, data }
}

/**
 * Get freelancers list
 * @param {Object} filters - Freelancer filters
 * @returns {Promise} Freelancers response
 */
export async function getFreelancers(filters = {}) {
  console.log('🔄 API: Fetching freelancers with filters:', filters)
  const response = await authenticatedFetch(`${API_BASE_URL}/freelancer/list`, {
    method: 'POST',
    body: JSON.stringify(filters)
  })
  
  const data = await response.json()
  console.log('📊 API: Freelancers response:', { status: response.status, data })
  console.log('🔍 API: Full response details:', {
    status: response.status,
    statusText: response.statusText,
    ok: response.ok,
    headers: Object.fromEntries(response.headers.entries()),
    dataKeys: Object.keys(data || {}),
    dataStatus: data?.status,
    dataMessage: data?.message,
    dataDataLength: data?.data?.length,
    dataDataSample: data?.data?.[0],
    pagination: data?.pagination
  })
  return { response, data }
}

/**
 * Update project
 * @param {Object} projectData - Updated project data
 * @returns {Promise} Update response
 */
export async function updateProject(projectData) {
  const response = await authenticatedFetch(`${API_BASE_URL}/project/update`, {
    method: 'POST',
    body: JSON.stringify(projectData)
  })
  
  const data = await response.json()
  return { response, data }
}

/**
 * Delete project
 * @param {string} projectId - Project ID
 * @returns {Promise} Delete response
 */
export async function deleteProject(projectId) {
  const response = await authenticatedFetch(`${API_BASE_URL}/project/delete`, {
    method: 'POST',
    body: JSON.stringify({ id: projectId })
  })
  
  const data = await response.json()
  return { response, data }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Handle API errors
 * @param {Response} response - Fetch response
 * @param {Object} data - Response data
 * @returns {Object} Error object
 */
export function handleApiError(response, data) {
  if (!response.ok) {
    return {
      error: true,
      message: data.message || 'An error occurred',
      status: response.status
    }
  }
  return { error: false }
}

/**
 * Get user type from localStorage
 * @returns {string|null} User type or null
 */
export function getUserType() {
  const user = getCurrentUser()
  return user ? user.user_type : null
}

/**
 * Check if user is freelancer
 * @returns {boolean} True if user is freelancer
 */
export function isFreelancer() {
  return getUserType() === 'freelancer'
}

/**
 * Check if user is client
 * @returns {boolean} True if user is client
 */
export function isClient() {
  return getUserType() === 'client'
}

/**
 * Get profile data from localStorage
 * @param {string} userType - User type ('freelancer' or 'client')
 * @returns {Object|null} Profile data or null
 */
export function getProfileData(userType) {
  const profileData = localStorage.getItem(`${userType}_profile_data`)
  if (!profileData) return null
  
  try {
    return JSON.parse(profileData)
  } catch (error) {
    console.error('Error parsing profile data:', error)
    return null
  }
}

/**
 * Store profile data in localStorage
 * @param {string} userType - User type ('freelancer' or 'client')
 * @param {Object} profileData - Profile data
 */
export function storeProfileData(userType, profileData) {
  localStorage.setItem(`${userType}_profile_data`, JSON.stringify(profileData))
  localStorage.setItem(`${userType}_profile_completed`, 'true')
  if (profileData._id) {
    localStorage.setItem(`${userType}_profile_id`, profileData._id)
  }
}

/**
 * Check if profile is completed
 * @param {string} userType - User type ('freelancer' or 'client')
 * @returns {boolean} True if profile is completed
 */
export function isProfileCompleted(userType) {
  const completed = localStorage.getItem(`${userType}_profile_completed`)
  const profileData = localStorage.getItem(`${userType}_profile_data`)
  return completed === 'true' && !!profileData
}

/**
 * Get API base URL
 * @returns {string} API base URL
 */
export function getApiBaseUrl() {
  return API_BASE_URL
}

/**
 * Make a simple GET request
 * @param {string} endpoint - API endpoint
 * @returns {Promise} Response
 */
export async function apiGet(endpoint) {
  const response = await authenticatedFetch(`${API_BASE_URL}${endpoint}`, {
    method: 'GET'
  })
  
  const data = await response.json()
  return { response, data }
}

/**
 * Make a simple POST request
 * @param {string} endpoint - API endpoint
 * @param {Object} data - Request data
 * @returns {Promise} Response
 */
export async function apiPost(endpoint, data) {
  const response = await authenticatedFetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    body: JSON.stringify(data)
  })
  
  const responseData = await response.json()
  return { response, data: responseData }
}

/**
 * Make a simple PUT request
 * @param {string} endpoint - API endpoint
 * @param {Object} data - Request data
 * @returns {Promise} Response
 */
export async function apiPut(endpoint, data) {
  const response = await authenticatedFetch(`${API_BASE_URL}${endpoint}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  })
  
  const responseData = await response.json()
  return { response, data: responseData }
}

/**
 * Make a simple DELETE request
 * @param {string} endpoint - API endpoint
 * @returns {Promise} Response
 */
export async function apiDelete(endpoint) {
  const response = await authenticatedFetch(`${API_BASE_URL}${endpoint}`, {
    method: 'DELETE'
  })
  
  const data = await response.json()
  return { response, data }
}