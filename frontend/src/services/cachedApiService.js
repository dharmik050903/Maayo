/**
 * Optimized API Service Wrappers
 * Uses caching to prevent duplicate API calls
 */

import apiCache from './apiCache.js'
import { getFreelancers as originalGetFreelancers } from '../utils/api.js'
import { projectService } from './projectService.js'
import { skillsService } from './skillsService.js'
import { bidService } from './bidService.js'

/**
 * Cached freelancers API
 */
export const getFreelancersCached = async (filters = {}) => {
  const cacheKey = apiCache.generateKey('freelancers', filters)
  
  // Check cache first
  const cachedData = apiCache.get(cacheKey)
  if (cachedData) {
    return cachedData
  }

  // Check if request is already pending
  const pendingRequest = apiCache.getPending(cacheKey)
  if (pendingRequest) {
    console.log('⏳ ApiCache: Waiting for pending freelancers request')
    return pendingRequest
  }

  // Make new request
  console.log('🌐 ApiCache: Fetching freelancers from API')
  const requestPromise = originalGetFreelancers(filters)
  
  // Add to pending requests
  apiCache.addPending(cacheKey, requestPromise)
  
  try {
    const result = await requestPromise
    
    // Cache successful response
    if (result.response?.ok && result.data?.status) {
      apiCache.set(cacheKey, result, 'freelancers')
    }
    
    return result
  } catch (error) {
    console.error('❌ ApiCache: Freelancers API error:', error)
    throw error
  }
}

/**
 * Cached projects API
 */
export const getAllProjectsCached = async (filters = {}) => {
  const cacheKey = apiCache.generateKey('projects', filters)
  
  // Check cache first
  const cachedData = apiCache.get(cacheKey)
  if (cachedData) {
    return cachedData
  }

  // Check if request is already pending
  const pendingRequest = apiCache.getPending(cacheKey)
  if (pendingRequest) {
    console.log('⏳ ApiCache: Waiting for pending projects request')
    return pendingRequest
  }

  // Make new request
  console.log('🌐 ApiCache: Fetching projects from API')
  const requestPromise = projectService.getAllProjects(filters)
  
  // Add to pending requests
  apiCache.addPending(cacheKey, requestPromise)
  
  try {
    const result = await requestPromise
    
    // Cache successful response
    if (result.status && result.data) {
      apiCache.set(cacheKey, result, 'projects')
    }
    
    return result
  } catch (error) {
    console.error('❌ ApiCache: Projects API error:', error)
    throw error
  }
}

/**
 * Cached skills API
 */
export const getSkillsCached = async () => {
  const cacheKey = apiCache.generateKey('skills', {})
  
  // Check cache first
  const cachedData = apiCache.get(cacheKey)
  if (cachedData) {
    return cachedData
  }

  // Check if request is already pending
  const pendingRequest = apiCache.getPending(cacheKey)
  if (pendingRequest) {
    console.log('⏳ ApiCache: Waiting for pending skills request')
    return pendingRequest
  }

  // Make new request
  console.log('🌐 ApiCache: Fetching skills from API')
  const requestPromise = skillsService.getSkills()
  
  // Add to pending requests
  apiCache.addPending(cacheKey, requestPromise)
  
  try {
    const result = await requestPromise
    
    // Cache successful response
    if (result.data && Array.isArray(result.data)) {
      apiCache.set(cacheKey, result, 'skills')
    }
    
    return result
  } catch (error) {
    console.error('❌ ApiCache: Skills API error:', error)
    throw error
  }
}

/**
 * Cached freelancer bids API
 */
export const getFreelancerBidsCached = async (filters = {}) => {
  const cacheKey = apiCache.generateKey('freelancer_bids', filters)
  
  // Check cache first
  const cachedData = apiCache.get(cacheKey)
  if (cachedData) {
    return cachedData
  }

  // Check if request is already pending
  const pendingRequest = apiCache.getPending(cacheKey)
  if (pendingRequest) {
    console.log('⏳ ApiCache: Waiting for pending freelancer bids request')
    return pendingRequest
  }

  // Make new request
  console.log('🌐 ApiCache: Fetching freelancer bids from API')
  const requestPromise = bidService.getFreelancerBids(filters)
  
  // Add to pending requests
  apiCache.addPending(cacheKey, requestPromise)
  
  try {
    const result = await requestPromise
    
    // Cache successful response
    if (result.status && result.data) {
      apiCache.set(cacheKey, result, 'bids')
    }
    
    return result
  } catch (error) {
    console.error('❌ ApiCache: Freelancer bids API error:', error)
    throw error
  }
}

/**
 * Cached client projects API
 */
export const getClientProjectsCached = async (filters = {}) => {
  const cacheKey = apiCache.generateKey('client_projects', filters)
  
  // Check cache first
  const cachedData = apiCache.get(cacheKey)
  if (cachedData) {
    return cachedData
  }

  // Check if request is already pending
  const pendingRequest = apiCache.getPending(cacheKey)
  if (pendingRequest) {
    console.log('⏳ ApiCache: Waiting for pending client projects request')
    return pendingRequest
  }

  // Make new request
  console.log('🌐 ApiCache: Fetching client projects from API')
  const requestPromise = projectService.getClientProjects(filters)
  
  // Add to pending requests
  apiCache.addPending(cacheKey, requestPromise)
  
  try {
    const result = await requestPromise
    
    // Cache successful response
    if (result.status && result.data) {
      apiCache.set(cacheKey, result, 'projects')
    }
    
    return result
  } catch (error) {
    console.error('❌ ApiCache: Client projects API error:', error)
    throw error
  }
}

/**
 * Clear cache for specific data type
 */
export const clearCache = (cacheType) => {
  apiCache.clear(cacheType)
}

/**
 * Get cache statistics
 */
export const getCacheStats = () => {
  return apiCache.getStats()
}

/**
 * Clear all cache
 */
export const clearAllCache = () => {
  apiCache.clear()
}
