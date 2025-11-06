"use client"

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ErrorBoundary } from '@/components/error-boundary'
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Terminal, Folder, Database, Network, Settings, Puzzle, Package, Gamepad2, Trash2, Wrench, ArrowLeft, Archive, Bot } from 'lucide-react'
import { ConsoleTab } from '@/components/tabs/console-tab'
import { FileManagerTab } from '@/components/tabs/file-manager-tab-new'
import { DatabaseTab } from '@/components/tabs/database-tab'
import { PortsTab } from '@/components/tabs/ports-tab'
import { StartupTab } from '@/components/tabs/startup-tab'
import { PluginsTab } from '@/components/tabs/plugins-tab-new'
import { ModsTab } from '@/components/tabs/mods-tab-new'
import { VersionTab } from '@/components/tabs/version-tab-new'
import { SettingsTab } from '@/components/tabs/settings-tab'
import { TrashTab } from '@/components/tabs/trash-tab'
import { BackupsTab } from '@/components/tabs/backups-tab'
import { BotControllerTab } from '@/components/tabs/bot-controller-tab'
import { useAuth } from '@/lib/auth-context'

export default function ServerManagePage() {
  const router = useRouter()
  const params = useParams()
  const serverId = params.id as string
  const { user } = useAuth()
  
  const [activeTab, setActiveTab] = useState('console')
  const [serverData, setServerData] = useState<any>(null)
  const [resourceData, setResourceData] = useState<any>(null)
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
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex items-center justify-center h-full">
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
        <AppSidebar variant="inset" />
        <SidebarInset className="flex flex-col h-screen relative" id="server-panel-container">
          <SiteHeader />
          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex flex-1 flex-col overflow-hidden">
            {/* Header */}
            <div className="border-b bg-gradient-to-br from-primary/10 via-primary/5 to-background px-6 py-5 flex-shrink-0 backdrop-blur-sm">
              <div className="flex items-start justify-between gap-6 flex-wrap">
                {/* Left Section */}
                <div className="flex flex-col gap-4 flex-1 min-w-[300px]">
                  {/* Back Button */}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => router.push('/dashboard/services')}
                    className="w-fit hover:bg-primary/10"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Services
                  </Button>
                  
                  {/* Server Info */}
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center shadow-lg ring-2 ring-primary/20">
                      <Terminal className="h-7 w-7 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h1 className="text-2xl font-bold mb-1 truncate">{serverData.name}</h1>
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <p className="text-sm text-muted-foreground">{serverData.product?.name}</p>
                        {resourceData?.attributes?.current_state && (
                          <>
                            <span className="text-muted-foreground">•</span>
                            <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-semibold ${
                              resourceData.attributes.current_state === 'running' 
                                ? 'bg-green-500/15 text-green-700 dark:text-green-400 ring-1 ring-green-500/30' 
                                : resourceData.attributes.current_state === 'starting'
                                ? 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 ring-1 ring-yellow-500/30'
                                : 'bg-red-500/15 text-red-700 dark:text-red-400 ring-1 ring-red-500/30'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                resourceData.attributes.current_state === 'running' ? 'bg-green-500 animate-pulse' :
                                resourceData.attributes.current_state === 'starting' ? 'bg-yellow-500 animate-pulse' :
                                'bg-red-500'
                              }`} />
                              {resourceData.attributes.current_state}
                            </span>
                          </>
                        )}
                      </div>
                      {resourceData?.attributes ? (
                        <div className="flex items-center gap-2">
                          <div className="inline-flex items-center gap-2 text-xs font-mono font-bold px-3 py-1.5 bg-gradient-to-r from-primary/20 to-primary/10 rounded-lg border border-primary/30 shadow-sm">
                            <Terminal className="h-3 w-3 text-primary" />
                            <span className="text-primary">
                              {resourceData.attributes.ip_alias || resourceData.attributes.ip || 'N/A'}:{resourceData.attributes.port || '25565'}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground animate-pulse flex items-center gap-2">
                          <span className="h-3 w-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                          Loading server info...
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Resource Stats */}
                {resourceData?.attributes?.limits && (
                  <div className="flex gap-3 flex-wrap">
                    <div className="group relative overflow-hidden flex flex-col items-center justify-center px-5 py-3 rounded-xl bg-gradient-to-br from-blue-500/15 to-blue-500/5 border border-blue-500/30 hover:border-blue-500/50 transition-all shadow-sm hover:shadow-md min-w-[100px]">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="relative z-10 text-center">
                        <div className="text-[10px] uppercase tracking-wider font-semibold text-blue-600/70 dark:text-blue-400/70 mb-1">Memory</div>
                        <div className="text-xl font-bold text-blue-600 dark:text-blue-400 mb-0.5">
                          {Math.round((resourceData.attributes.resources.memory_bytes / 1024 / 1024))} MB
                        </div>
                        <div className="text-[10px] text-blue-600/60 dark:text-blue-400/60">
                          / {Math.round((resourceData.attributes.limits?.memory / 1024 / 1024))} MB
                        </div>
                      </div>
                    </div>
                    
                    <div className="group relative overflow-hidden flex flex-col items-center justify-center px-5 py-3 rounded-xl bg-gradient-to-br from-green-500/15 to-green-500/5 border border-green-500/30 hover:border-green-500/50 transition-all shadow-sm hover:shadow-md min-w-[100px]">
                      <div className="absolute inset-0 bg-gradient-to-br from-green-500/0 to-green-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="relative z-10 text-center">
                        <div className="text-[10px] uppercase tracking-wider font-semibold text-green-600/70 dark:text-green-400/70 mb-1">CPU Usage</div>
                        <div className="text-xl font-bold text-green-600 dark:text-green-400 mb-0.5">
                          {Math.round(resourceData.attributes.resources.cpu_absolute * 10) / 10}%
                        </div>
                        <div className="text-[10px] text-green-600/60 dark:text-green-400/60">
                          / {resourceData.attributes.limits?.cpu}%
                        </div>
                      </div>
                    </div>
                    
                    <div className="group relative overflow-hidden flex flex-col items-center justify-center px-5 py-3 rounded-xl bg-gradient-to-br from-purple-500/15 to-purple-500/5 border border-purple-500/30 hover:border-purple-500/50 transition-all shadow-sm hover:shadow-md min-w-[100px]">
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="relative z-10 text-center">
                        <div className="text-[10px] uppercase tracking-wider font-semibold text-purple-600/70 dark:text-purple-400/70 mb-1">Storage</div>
                        <div className="text-xl font-bold text-purple-600 dark:text-purple-400 mb-0.5">
                          {Math.round((resourceData.attributes.resources.disk_bytes / 1024 / 1024))} MB
                        </div>
                        <div className="text-[10px] text-purple-600/60 dark:text-purple-400/60">
                          / {Math.round((resourceData.attributes.limits?.disk / 1024 / 1024))} MB
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
              <div className="px-6 pt-4 border-b overflow-x-auto flex-shrink-0">
                <TabsList className="inline-flex h-auto p-1 bg-muted/50">
                  <TabsTrigger value="console" className="gap-2">
                    <Terminal className="h-4 w-4" />
                    Console
                  </TabsTrigger>
                  <TabsTrigger value="files" className="gap-2">
                    <Folder className="h-4 w-4" />
                    Files
                  </TabsTrigger>
                  <TabsTrigger value="databases" className="gap-2">
                    <Database className="h-4 w-4" />
                    Databases
                  </TabsTrigger>
                  <TabsTrigger value="backups" className="gap-2">
                    <Archive className="h-4 w-4" />
                    Backups
                  </TabsTrigger>
                  <TabsTrigger value="ports" className="gap-2">
                    <Network className="h-4 w-4" />
                    Ports
                  </TabsTrigger>
                  <TabsTrigger value="startup" className="gap-2">
                    <Wrench className="h-4 w-4" />
                    Startup
                  </TabsTrigger>
                  <TabsTrigger value="plugins" className="gap-2">
                    <Puzzle className="h-4 w-4" />
                    Plugins
                  </TabsTrigger>
                  <TabsTrigger value="mods" className="gap-2">
                    <Package className="h-4 w-4" />
                    Mods
                  </TabsTrigger>
                  <TabsTrigger value="version" className="gap-2">
                    <Gamepad2 className="h-4 w-4" />
                    Version
                  </TabsTrigger>
                  <TabsTrigger value="settings" className="gap-2">
                    <Settings className="h-4 w-4" />
                    Settings
                  </TabsTrigger>
                  <TabsTrigger value="trash" className="gap-2">
                    <Trash2 className="h-4 w-4" />
                    Trash
                  </TabsTrigger>
                  {user?.devMode && (
                    <TabsTrigger value="bots" className="gap-2">
                      <Bot className="h-4 w-4" />
                      Bot Controller
                    </TabsTrigger>
                  )}
                </TabsList>
              </div>

              <div className="flex-1 overflow-hidden">
                <TabsContent value="console" className="mt-0 h-full overflow-y-auto p-6">
                  <ConsoleTab serverId={serverId} serverIdentifier={serverData.pterodactylIdentifier || ''} />
                </TabsContent>

                <TabsContent value="files" className="mt-0 h-full overflow-y-auto p-6">
                  <FileManagerTab serverId={serverId} />
                </TabsContent>

                <TabsContent value="databases" className="mt-0 h-full overflow-y-auto p-6">
                  <DatabaseTab serverId={serverId} />
                </TabsContent>

                <TabsContent value="backups" className="mt-0 h-full overflow-y-auto p-6">
                  <BackupsTab serverId={serverId} />
                </TabsContent>

                <TabsContent value="ports" className="mt-0 h-full overflow-y-auto p-6">
                  <PortsTab serverId={serverId} />
                </TabsContent>

                <TabsContent value="startup" className="mt-0 h-full overflow-y-auto p-6">
                  <StartupTab serverId={serverId} />
                </TabsContent>

                <TabsContent value="plugins" className="mt-0 h-full overflow-y-auto p-6">
                  <PluginsTab serverId={serverId} />
                </TabsContent>

                <TabsContent value="mods" className="mt-0 h-full overflow-y-auto p-6">
                  <ModsTab serverId={serverId} />
                </TabsContent>

                <TabsContent value="version" className="mt-0 h-full overflow-y-auto p-6">
                  <VersionTab serverId={serverId} />
                </TabsContent>

                <TabsContent value="settings" className="mt-0 h-full overflow-y-auto p-6">
                  <SettingsTab serverId={serverId} />
                </TabsContent>

                <TabsContent value="trash" className="mt-0 h-full overflow-y-auto p-6">
                  <TrashTab serverId={serverId} />
                </TabsContent>

                {user?.devMode && (
                  <TabsContent value="bots" className="mt-0 h-full overflow-y-auto p-6">
                    <BotControllerTab serverId={serverId} />
                  </TabsContent>
                )}
              </div>
            </Tabs>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ErrorBoundary>
  )
}
