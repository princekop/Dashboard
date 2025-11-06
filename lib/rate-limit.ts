/**
 * In-memory rate limiter for API endpoints
 * For production, use Redis or similar distributed store
 */

interface RateLimitConfig {
  interval: number // Time window in milliseconds
  maxRequests: number // Max requests per interval
}

interface RateLimitRecord {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitRecord>()

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, record] of rateLimitStore.entries()) {
    if (record.resetTime < now) {
      rateLimitStore.delete(key)
    }
  }
}, 5 * 60 * 1000)

/**
 * Check if request should be rate limited
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const record = rateLimitStore.get(identifier)

  // No existing record or expired
  if (!record || record.resetTime < now) {
    const resetTime = now + config.interval
    rateLimitStore.set(identifier, { count: 1, resetTime })
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime,
    }
  }

  // Check if limit exceeded
  if (record.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: record.resetTime,
    }
  }

  // Increment count
  record.count++
  rateLimitStore.set(identifier, record)

  return {
    allowed: true,
    remaining: config.maxRequests - record.count,
    resetTime: record.resetTime,
  }
}

/**
 * Rate limit configurations for different endpoints
 */
export const RATE_LIMITS = {
  // AI endpoints - more restrictive
  AI_SETUP: {
    interval: 60 * 1000, // 1 minute
    maxRequests: 10,
  },
  AI_GEMINI: {
    interval: 60 * 1000, // 1 minute
    maxRequests: 15,
  },
  
  // File operations
  FILE_UPLOAD: {
    interval: 60 * 1000, // 1 minute
    maxRequests: 20,
  },
  FILE_OPERATIONS: {
    interval: 60 * 1000, // 1 minute
    maxRequests: 100,
  },
  
  // Server operations
  SERVER_POWER: {
    interval: 60 * 1000, // 1 minute
    maxRequests: 30,
  },
  SERVER_COMMANDS: {
    interval: 60 * 1000, // 1 minute
    maxRequests: 50,
  },
  
  // Plugin/Mod installation
  PLUGIN_INSTALL: {
    interval: 60 * 1000, // 1 minute
    maxRequests: 30,
  },
  
  // General API
  GENERAL: {
    interval: 60 * 1000, // 1 minute
    maxRequests: 100,
  },
} as const

/**
 * Get rate limit identifier from request
 */
export function getRateLimitIdentifier(request: Request): string {
  // In production, use user ID from auth token
  // For now, use IP address as fallback
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : 'unknown'
  
  // You should add user ID here if available
  return `ip:${ip}`
}
