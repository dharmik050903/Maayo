/**
 * Cache Invalidation Utilities
 * Provides functions to clear cache when data changes
 */

import { clearCache } from './cachedApiService.js'

/**
 * Clear cache after project operations
 */
export const invalidateProjectCache = () => {
  console.log('🔄 Cache: Invalidating project cache after project operation')
  clearCache('projects')
  clearCache('client_projects')
}

/**
 * Clear cache after bid operations
 */
export const invalidateBidCache = () => {
  console.log('🔄 Cache: Invalidating bid cache after bid operation')
  clearCache('freelancer_bids')
  clearCache('projects') // Projects might show bid status
}

/**
 * Clear cache after freelancer operations
 */
export const invalidateFreelancerCache = () => {
  console.log('🔄 Cache: Invalidating freelancer cache after freelancer operation')
  clearCache('freelancers')
}

/**
 * Clear cache after skills operations
 */
export const invalidateSkillsCache = () => {
  console.log('🔄 Cache: Invalidating skills cache after skills operation')
  clearCache('skills')
}

/**
 * Clear all cache (use sparingly)
 */
export const invalidateAllCache = () => {
  console.log('🔄 Cache: Invalidating all cache')
  clearCache()
}

/**
 * Clear cache after user operations (login/logout)
 */
export const invalidateUserCache = () => {
  console.log('🔄 Cache: Invalidating user-related cache after user operation')
  clearCache('user')
  clearCache('freelancer_bids')
  clearCache('client_projects')
}
