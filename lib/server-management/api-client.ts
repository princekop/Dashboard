import { TIMEOUTS } from './constants'

/**
 * Fetch with timeout support
 */
export async function fetchWithTimeout(
  url: string, 
  timeout: number = TIMEOUTS.API_FETCH
): Promise<any> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, { signal: controller.signal })
    clearTimeout(timeoutId)
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    return await response.json()
  } catch (error: any) {
    clearTimeout(timeoutId)
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.')
    }
    throw error
  }
}

/**
 * Server Management API Client
 */
export class ServerAPI {
  constructor(private serverId: string) {}

  // Version Management
  async installVersion(data: { serverType: string; version: string; build?: string }) {
    const response = await fetch(`/api/servers/${this.serverId}/version/install`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Installation failed')
    }

    return response.json()
  }

  // Trash Management
  async getTrashItems() {
    const response = await fetch(`/api/servers/${this.serverId}/trash`)
    if (!response.ok) throw new Error('Failed to fetch trash items')
    return response.json()
  }

  async moveToTrash(item: { name: string; type: string; path: string; size?: number }) {
    const response = await fetch(`/api/servers/${this.serverId}/trash`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    })
    
    if (!response.ok) throw new Error('Failed to move to trash')
    return response.json()
  }

  async restoreFromTrash(itemId: string) {
    const response = await fetch(`/api/servers/${this.serverId}/trash?itemId=${itemId}`, {
      method: 'PUT'
    })
    
    if (!response.ok) throw new Error('Failed to restore item')
    return response.json()
  }

  async deletePermanently(itemId: string) {
    const response = await fetch(`/api/servers/${this.serverId}/trash?itemId=${itemId}`, {
      method: 'DELETE'
    })
    
    if (!response.ok) throw new Error('Failed to delete item')
    return response.json()
  }

  async emptyTrash() {
    const response = await fetch(`/api/servers/${this.serverId}/trash?emptyAll=true`, {
      method: 'DELETE'
    })
    
    if (!response.ok) throw new Error('Failed to empty trash')
    return response.json()
  }

  // Server Info
  async getServerInfo() {
    const response = await fetch(`/api/servers/${this.serverId}/info`)
    if (!response.ok) throw new Error('Failed to fetch server info')
    return response.json()
  }

  async getServerResources() {
    const response = await fetch(`/api/servers/${this.serverId}/resources`, {
      cache: 'no-store'
    })
    if (!response.ok) throw new Error('Failed to fetch resources')
    return response.json()
  }
}
