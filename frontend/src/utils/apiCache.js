// Simple API cache utility to prevent duplicate API calls
class APICache {
  constructor() {
    this.cache = new Map()
    this.cacheTimeout = 5 * 60 * 1000 // 5 minutes
  }

  // Generate cache key from URL and options
  generateKey(url, options = {}) {
    const method = options.method || 'GET'
    const body = options.body ? JSON.stringify(options.body) : ''
    return `${method}:${url}:${body}`
  }

  // Get cached response
  get(url, options = {}) {
    const key = this.generateKey(url, options)
    const cached = this.cache.get(key)
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      console.log('🚀 API Cache HIT:', key)
      return cached.data
    }
    
    if (cached) {
      console.log('⏰ API Cache EXPIRED:', key)
      this.cache.delete(key)
    }
    
    return null
  }

  // Set cached response
  set(url, options = {}, data) {
    const key = this.generateKey(url, options)
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
    console.log('💾 API Cache SET:', key)
  }

  // Clear cache
  clear() {
    this.cache.clear()
    console.log('🗑️ API Cache CLEARED')
  }

  // Clear specific cache entry
  clearKey(url, options = {}) {
    const key = this.generateKey(url, options)
    this.cache.delete(key)
    console.log('🗑️ API Cache CLEARED:', key)
  }
}

export const apiCache = new APICache()
