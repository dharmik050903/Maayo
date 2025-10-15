/**
 * API Caching Service
 * Prevents duplicate API calls and provides caching for frequently accessed data
 */

class ApiCacheService {
  constructor() {
    this.cache = new Map()
    this.pendingRequests = new Map()
    this.cacheExpiry = {
      freelancers: 5 * 60 * 1000, // 5 minutes
      projects: 2 * 60 * 1000,    // 2 minutes
      skills: 10 * 60 * 1000,     // 10 minutes
      bids: 1 * 60 * 1000,        // 1 minute
      user: 30 * 60 * 1000        // 30 minutes
    }
  }

  /**
   * Generate cache key for API request
   */
  generateKey(endpoint, params = {}) {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((result, key) => {
        result[key] = params[key]
        return result
      }, {})
    
    return `${endpoint}_${JSON.stringify(sortedParams)}`
  }

  /**
   * Check if cache entry is valid
   */
  isValid(cacheEntry) {
    if (!cacheEntry) return false
    const now = Date.now()
    return now < cacheEntry.expiry
  }

  /**
   * Get cached data
   */
  get(key) {
    const cacheEntry = this.cache.get(key)
    if (this.isValid(cacheEntry)) {
      console.log('🎯 ApiCache: Cache hit for', key)
      return cacheEntry.data
    }
    
    if (cacheEntry) {
      console.log('⏰ ApiCache: Cache expired for', key)
      this.cache.delete(key)
    }
    
    return null
  }

  /**
   * Set cached data
   */
  set(key, data, cacheType = 'default') {
    const expiry = Date.now() + (this.cacheExpiry[cacheType] || 5 * 60 * 1000)
    this.cache.set(key, {
      data,
      expiry,
      timestamp: Date.now()
    })
    console.log('💾 ApiCache: Cached data for', key, 'expires in', this.cacheExpiry[cacheType] / 1000, 'seconds')
  }

  /**
   * Check if request is already pending
   */
  isPending(key) {
    return this.pendingRequests.has(key)
  }

  /**
   * Add pending request
   */
  addPending(key, promise) {
    this.pendingRequests.set(key, promise)
    
    // Clean up when promise resolves/rejects
    promise.finally(() => {
      this.pendingRequests.delete(key)
    })
    
    return promise
  }

  /**
   * Get pending request
   */
  getPending(key) {
    return this.pendingRequests.get(key)
  }

  /**
   * Remove pending request
   */
  removePending(key) {
    this.pendingRequests.delete(key)
    console.log('🗑️ ApiCache: Removed pending request for', key)
  }

  /**
   * Clear cache by type or all
   */
  clear(cacheType = null) {
    if (cacheType) {
      // Clear specific cache type
      for (const [key, value] of this.cache.entries()) {
        if (key.startsWith(cacheType)) {
          this.cache.delete(key)
        }
      }
      console.log('🗑️ ApiCache: Cleared cache for type:', cacheType)
    } else {
      // Clear all cache
      this.cache.clear()
      console.log('🗑️ ApiCache: Cleared all cache')
    }
  }

  /**
   * Clear expired entries
   */
  clearExpired() {
    const now = Date.now()
    let clearedCount = 0
    
    for (const [key, value] of this.cache.entries()) {
      if (now >= value.expiry) {
        this.cache.delete(key)
        clearedCount++
      }
    }
    
    if (clearedCount > 0) {
      console.log('🧹 ApiCache: Cleared', clearedCount, 'expired entries')
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const now = Date.now()
    const stats = {
      totalEntries: this.cache.size,
      pendingRequests: this.pendingRequests.size,
      expiredEntries: 0,
      validEntries: 0,
      cacheTypes: {}
    }

    for (const [key, value] of this.cache.entries()) {
      if (now >= value.expiry) {
        stats.expiredEntries++
      } else {
        stats.validEntries++
      }

      const cacheType = key.split('_')[0]
      stats.cacheTypes[cacheType] = (stats.cacheTypes[cacheType] || 0) + 1
    }

    return stats
  }
}

// Create singleton instance
const apiCache = new ApiCacheService()

// Auto-cleanup expired entries every 5 minutes
setInterval(() => {
  apiCache.clearExpired()
}, 5 * 60 * 1000)

export default apiCache
