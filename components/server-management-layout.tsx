"use client"

import { useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { ServerManagementSidebar } from "@/components/server-management-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { ErrorBoundary } from '@/components/error-boundary'
import { Terminal } from 'lucide-react'

interface ServerManagementLayoutProps {
  serverId: string
  children: ReactNode
}

interface ServerData {
  name: string
  product?: {
    name: string
  }
  pterodactylIdentifier?: string
}

interface ResourceData {
  attributes?: {
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
}

export function ServerManagementLayout({ serverId, children }: ServerManagementLayoutProps) {
  const router = useRouter()
  const [serverData, setServerData] = useState<ServerData | null>(null)
  const [resourceData, setResourceData] = useState<ResourceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    loadServerData()
    
    // Poll resources every 3 seconds
    const interval = setInterval(loadResources, 3000)
    loadResources()
    
    return () => clearInterval(interval)
  }, [serverId])

  const loadServerData = async () => {
    try {
      const res = await fetch(`/api/servers/${serverId}/info`)
      const data = await res.json()
      
      if (res.status === 403) {
        alert('You do not have permission to access this server')
        router.push('/dashboard/services')
        return
      }
      
      if (res.status === 404) {
        alert('Server not found')
        router.push('/dashboard/services')
        return
      }
      
      if (res.ok) {
        setServerData(data)
        setAuthorized(true)
      }
    } catch (error) {
      console.error('Failed to load server:', error)
      alert('Failed to load server data')
      router.push('/dashboard/services')
    } finally {
      setLoading(false)
    }
  }

  const loadResources = async () => {
    try {
      const res = await fetch(`/api/servers/${serverId}/resources`, {
        cache: 'no-store'
      })
      if (res.ok) {
        const data = await res.json()
        setResourceData(data)
      }
    } catch (error) {
      // Silently handle - browser extensions may interfere
      // Resources will retry in 3 seconds automatically
    }
  }

  if (loading) {
    return (
      <SidebarProvider>
        <ServerManagementSidebar 
          variant="inset" 
          serverId={serverId}
          serverName="Loading..."
        />
        <SidebarInset>
          <div className="flex items-center justify-center h-screen">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  if (!authorized || !serverData) {
    return null
  }

  return (
    <ErrorBoundary>
      <SidebarProvider>
        <ServerManagementSidebar 
          variant="inset" 
          serverId={serverId}
          serverName={serverData.name}
          serverStatus={resourceData?.attributes?.current_state}
          serverIp={resourceData?.attributes?.ip_alias || resourceData?.attributes?.ip}
          serverPort={resourceData?.attributes?.port?.toString()}
        />
        <SidebarInset className="flex flex-col" id="server-panel-container">
          {/* Main Content Area */}
          <div className="flex-1">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ErrorBoundary>
  )
}
