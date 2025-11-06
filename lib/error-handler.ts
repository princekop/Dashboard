/**
 * Production-safe error handler
 * Logs detailed errors server-side, returns sanitized errors to clients
 */

import { NextResponse } from 'next/server'

interface ErrorResponse {
  error: string
  details?: string
  code?: string
}

/**
 * Handle API errors safely for production
 * - In development: return detailed errors
 * - In production: return generic errors, log details
 */
export function handleApiError(
  error: unknown,
  context?: string
): NextResponse<ErrorResponse> {
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  // Log the error server-side (always)
  console.error(`[API Error${context ? ` - ${context}` : ''}]:`, error)
  
  // Determine error message
  let errorMessage = 'An unexpected error occurred'
  let statusCode = 500
  let errorDetails: string | undefined
  
  if (error instanceof Error) {
    // Check for known error types
    if (error.message.includes('Unauthorized') || error.message.includes('Invalid token')) {
      errorMessage = 'Authentication failed'
      statusCode = 401
    } else if (error.message.includes('Forbidden') || error.message.includes('Permission denied')) {
      errorMessage = 'Permission denied'
      statusCode = 403
    } else if (error.message.includes('Not found') || error.message.includes('does not exist')) {
      errorMessage = 'Resource not found'
      statusCode = 404
    } else if (error.message.includes('Rate limit')) {
      errorMessage = 'Too many requests'
      statusCode = 429
    } else if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
      errorMessage = 'Request timeout'
      statusCode = 504
    } else if (error.message.includes('Network') || error.message.includes('ECONNREFUSED')) {
      errorMessage = 'Service temporarily unavailable'
      statusCode = 503
    }
    
    // In development, include the actual error message
    if (isDevelopment) {
      errorDetails = error.message
      if (error.stack) {
        console.error('Stack trace:', error.stack)
      }
    }
  }
  
  return NextResponse.json(
    {
      error: errorMessage,
      details: errorDetails,
      code: statusCode.toString(),
    },
    { status: statusCode }
  )
}

/**
 * Sanitize error message for client display
 */
export function sanitizeErrorMessage(error: unknown): string {
  if (process.env.NODE_ENV === 'development') {
    if (error instanceof Error) {
      return error.message
    }
    return String(error)
  }
  
  // Production: return generic messages
  if (error instanceof Error) {
    if (error.message.includes('Unauthorized')) return 'Authentication required'
    if (error.message.includes('Forbidden')) return 'Access denied'
    if (error.message.includes('Not found')) return 'Item not found'
    if (error.message.includes('timeout')) return 'Request timed out'
    if (error.message.includes('Network')) return 'Network error occurred'
  }
  
  return 'An error occurred. Please try again.'
}

/**
 * Check if error is a user-facing error that should be shown
 */
export function isUserFacingError(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  
  const userFacingErrors = [
    'Unauthorized',
    'Invalid credentials',
    'Not found',
    'Already exists',
    'Rate limit exceeded',
    'Permission denied',
    'Invalid input',
    'Required field',
  ]
  
  return userFacingErrors.some(msg => error.message.includes(msg))
}

/**
 * Log error for monitoring (can be extended to send to error tracking service)
 */
export function logError(error: unknown, context?: Record<string, any>) {
  const timestamp = new Date().toISOString()
  const errorData = {
    timestamp,
    error: error instanceof Error ? {
      message: error.message,
      stack: error.stack,
      name: error.name,
    } : String(error),
    context,
    environment: process.env.NODE_ENV,
  }
  
  console.error('[ERROR LOG]', JSON.stringify(errorData, null, 2))
  
  // TODO: Send to error tracking service (Sentry, etc.)
  // if (process.env.SENTRY_DSN) {
  //   Sentry.captureException(error, { extra: context })
  // }
}
