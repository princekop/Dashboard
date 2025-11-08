import { Package, Boxes, Server, Gamepad2, Cpu } from 'lucide-react'
import { ServerType } from './types'

export const SERVER_TYPES: ServerType[] = [
  {
    id: 'paper',
    name: 'Paper',
    description: 'High performance with best plugin support',
    icon: Package,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
    recommended: true
  },
  {
    id: 'purpur',
    name: 'Purpur',
    description: 'Paper fork with additional customization',
    icon: Boxes,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/20',
    recommended: false
  },
  {
    id: 'spigot',
    name: 'Spigot',
    description: 'Classic plugin support, widely compatible',
    icon: Server,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/20',
    recommended: false
  },
  {
    id: 'vanilla',
    name: 'Vanilla',
    description: 'Official Minecraft server, no mods',
    icon: Gamepad2,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/20',
    recommended: false
  },
  {
    id: 'fabric',
    name: 'Fabric',
    description: 'Lightweight mod loader',
    icon: Cpu,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/20',
    recommended: false
  },
  {
    id: 'bedrock',
    name: 'Bedrock',
    description: 'Cross-platform Minecraft (Xbox, Mobile, Windows)',
    icon: Package,
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/20',
    recommended: false
  }
]

export const API_ENDPOINTS = {
  paper: 'https://api.papermc.io/v2/projects/paper',
  purpur: 'https://api.purpurmc.org/v2/purpur',
  vanilla: 'https://launchermeta.mojang.com/mc/game/version_manifest.json',
  fabric: 'https://meta.fabricmc.net/v2/versions/game',
  fabricLoader: 'https://meta.fabricmc.net/v2/versions/loader'
}

export const SPIGOT_VERSIONS = [
  '1.20.4', '1.20.2', '1.20.1', '1.19.4', '1.19.3', 
  '1.19.2', '1.18.2', '1.17.1', '1.16.5', '1.16.4',
  '1.15.2', '1.14.4', '1.13.2', '1.12.2'
]

export const BEDROCK_VERSIONS = [
  '1.20.51', '1.20.50', '1.20.41', '1.20.40', '1.20.32',
  '1.20.31', '1.20.30', '1.20.15', '1.20.10', '1.20.0',
  '1.19.83', '1.19.80', '1.19.73', '1.19.70', '1.19.63'
]

export const TIMEOUTS = {
  API_FETCH: 10000, // 10 seconds
  FILE_DOWNLOAD: 60000, // 60 seconds
  FILE_UPLOAD: 120000, // 2 minutes
}

export const FILE_SIZE_LIMITS = {
  MAX_UPLOAD: 100 * 1024 * 1024, // 100MB
}

export const TRASH_RETENTION_DAYS = 30
