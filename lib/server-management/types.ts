// Server Management Type Definitions

export interface ServerType {
  id: string
  name: string
  description: string
  icon: any
  color: string
  bgColor: string
  borderColor: string
  recommended: boolean
}

export interface VersionInfo {
  version: string
  build?: string | number
  isLatest?: boolean
}

export interface TrashItem {
  id: string
  serverId: string
  name: string
  type: 'file' | 'folder' | 'plugin' | 'mod'
  path: string
  size: number
  originalData?: string
  deletedAt: string
  expiresAt?: string
}

export interface ServerInfo {
  id: string
  name: string
  status: string
  pterodactylIdentifier?: string
  product?: {
    name: string
  }
}

export interface ResourceStats {
  current_state?: string
  ip?: string
  ip_alias?: string
  port?: number
  limits?: {
    memory: number
    cpu: number
    disk: number
  }
  resources?: {
    memory_bytes: number
    cpu_absolute: number
    disk_bytes: number
  }
}

export interface InstallVersionRequest {
  serverType: string
  version: string
  build?: string
}

export interface InstallVersionResponse {
  success: boolean
  message: string
  error?: string
  details?: string
}
