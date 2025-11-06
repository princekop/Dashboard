/**
 * Production-ready API client with retry logic, timeouts, and error handling
 */

interface FetchOptions extends RequestInit {
  timeout?: number
  retries?: number
  retryDelay?: number
}

interface ApiError extends Error {
  status?: number
  details?: any
}

/**
 * Enhanced fetch with timeout support
 */
async function fetchWithTimeout(
  url: string,
  options: FetchOptions = {}
): Promise<Response> {
  const { timeout = 30000, ...fetchOptions } = options

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout - please try again')
    }
    throw error
  }
}

/**
 * Fetch with automatic retry logic
 */
export async function apiFetch(
  url: string,
  options: FetchOptions = {}
): Promise<Response> {
  const { retries = 3, retryDelay = 1000, ...fetchOptions } = options

  let lastError: Error | null = null

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetchWithTimeout(url, fetchOptions)
      
      // Don't retry on 4xx errors (client errors)
      if (response.status >= 400 && response.status < 500) {
        return response
      }

      // Retry on 5xx errors (server errors)
      if (response.status >= 500 && attempt < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)))
        continue
      }

      return response
    } catch (error) {
      lastError = error as Error
      
      // Don't retry on network errors if it's the last attempt
      if (attempt === retries - 1) {
        break
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)))
    }
  }

  throw lastError || new Error('Request failed after retries')
}

/**
 * Typed API call with JSON parsing and error handling
 */
export async function apiCall<T = any>(
  url: string,
  options: FetchOptions = {}
): Promise<T> {
  try {
    const response = await apiFetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      let errorMessage = `Request failed with status ${response.status}`
      let errorDetails = null

      try {
        const errorData = await response.json()
        errorMessage = errorData.error || errorData.message || errorMessage
        errorDetails = errorData.details || errorData
      } catch {
        // If JSON parsing fails, use status text
        errorMessage = response.statusText || errorMessage
      }

      const error = new Error(errorMessage) as ApiError
      error.status = response.status
      error.details = errorDetails
      throw error
    }

    const data = await response.json()
    return data
  } catch (error) {
    if (error instanceof Error) {
      // Add more context to network errors
      if (error.message.includes('Failed to fetch')) {
        throw new Error('Network error - please check your connection')
      }
    }
    throw error
  }
}

/**
 * Safe API call that returns null on error (for non-critical requests)
 */
export async function safeApiCall<T = any>(
  url: string,
  options: FetchOptions = {}
): Promise<T | null> {
  try {
    return await apiCall<T>(url, options)
  } catch (error) {
    console.error('Safe API call failed:', error)
    return null
  }
}

/**
 * Batch API calls with concurrency control
 */
export async function batchApiCalls<T = any>(
  requests: Array<{ url: string; options?: FetchOptions }>,
  concurrency: number = 5
): Promise<Array<T | null>> {
  const results: Array<T | null> = []
  
  for (let i = 0; i < requests.length; i += concurrency) {
    const batch = requests.slice(i, i + concurrency)
    const batchResults = await Promise.allSettled(
      batch.map(req => apiCall<T>(req.url, req.options))
    )
    
    results.push(
      ...batchResults.map(result => 
        result.status === 'fulfilled' ? result.value : null
      )
    )
  }
  
  return results
}
