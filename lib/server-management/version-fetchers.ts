import { fetchWithTimeout } from './api-client'
import { API_ENDPOINTS, SPIGOT_VERSIONS, BEDROCK_VERSIONS } from './constants'

/**
 * Fetch versions for different server types
 */
export class VersionFetcher {
  static async fetchPaperVersions(): Promise<string[]> {
    const data = await fetchWithTimeout(API_ENDPOINTS.paper)
    return data.versions.reverse() // Latest first
  }

  static async fetchPaperBuilds(version: string): Promise<number[]> {
    const url = `${API_ENDPOINTS.paper}/versions/${version}`
    const data = await fetchWithTimeout(url)
    return data.builds.reverse()
  }

  static async fetchPurpurVersions(): Promise<string[]> {
    const data = await fetchWithTimeout(API_ENDPOINTS.purpur)
    return data.versions.reverse()
  }

  static async fetchPurpurBuilds(version: string): Promise<{ all: number[]; latest: string }> {
    const url = `${API_ENDPOINTS.purpur}/${version}`
    const data = await fetchWithTimeout(url)
    return {
      all: data.builds.all.reverse(),
      latest: data.builds.latest
    }
  }

  static async fetchVanillaVersions(): Promise<string[]> {
    const data = await fetchWithTimeout(API_ENDPOINTS.vanilla)
    const releases = data.versions.filter((v: any) => v.type === 'release')
    return releases.map((v: any) => v.id)
  }

  static async fetchFabricVersions(): Promise<string[]> {
    const data = await fetchWithTimeout(API_ENDPOINTS.fabric)
    const stableVersions = data.filter((v: any) => v.stable)
    return stableVersions.map((v: any) => v.version)
  }

  static async fetchFabricLoaders(): Promise<Array<{ version: string }>> {
    const data = await fetchWithTimeout(API_ENDPOINTS.fabricLoader)
    return data.slice(0, 10) // Get top 10 loader versions
  }

  static getSpigotVersions(): string[] {
    return SPIGOT_VERSIONS
  }

  static getBedrockVersions(): string[] {
    return BEDROCK_VERSIONS
  }

  /**
   * Main method to fetch versions based on server type
   */
  static async fetchVersions(serverType: string): Promise<string[]> {
    switch (serverType) {
      case 'paper':
        return this.fetchPaperVersions()
      case 'purpur':
        return this.fetchPurpurVersions()
      case 'spigot':
        return this.getSpigotVersions()
      case 'vanilla':
        return this.fetchVanillaVersions()
      case 'fabric':
        return this.fetchFabricVersions()
      case 'bedrock':
        return this.getBedrockVersions()
      default:
        throw new Error(`Unknown server type: ${serverType}`)
    }
  }

  /**
   * Fetch builds for version (Paper, Purpur, Fabric only)
   */
  static async fetchBuilds(serverType: string, version: string): Promise<any[]> {
    switch (serverType) {
      case 'paper':
        return this.fetchPaperBuilds(version)
      case 'purpur':
        const purpurData = await this.fetchPurpurBuilds(version)
        return purpurData.all
      case 'fabric':
        return this.fetchFabricLoaders()
      default:
        return []
    }
  }
}
