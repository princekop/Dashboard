"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Gamepad2, Download, AlertCircle, Loader2, CheckCircle2, Package, Server, Boxes, Cpu } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'

interface VersionTabProps {
  serverId: string
}

const SERVER_TYPES = [
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

export function VersionTabEnhanced({ serverId }: VersionTabProps) {
  const [serverType, setServerType] = useState('paper')
  const [versions, setVersions] = useState<string[]>([])
  const [selectedVersion, setSelectedVersion] = useState('')
  const [selectedBuild, setSelectedBuild] = useState('')
  const [builds, setBuilds] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [installing, setInstalling] = useState(false)
  const [loadingBuilds, setLoadingBuilds] = useState(false)
  const [installProgress, setInstallProgress] = useState(0)
  const [error, setError] = useState('')

  useEffect(() => {
    loadVersions()
  }, [serverType])

  useEffect(() => {
    if (selectedVersion && serverType !== 'vanilla' && serverType !== 'bedrock') {
      loadBuilds()
    }
  }, [selectedVersion, serverType])

  const loadVersions = async () => {
    setLoading(true)
    setError('')
    setVersions([])
    setBuilds([])
    setSelectedVersion('')
    setSelectedBuild('')

    try {
      let data
      const timeout = 10000 // 10 second timeout

      switch (serverType) {
        case 'paper':
          data = await fetchWithTimeout('https://api.papermc.io/v2/projects/paper', timeout)
          setVersions(data.versions.reverse())
          if (data.versions.length > 0) setSelectedVersion(data.versions[data.versions.length - 1])
          break

        case 'purpur':
          data = await fetchWithTimeout('https://api.purpurmc.org/v2/purpur', timeout)
          setVersions(data.versions.reverse())
          if (data.versions.length > 0) setSelectedVersion(data.versions[data.versions.length - 1])
          break

        case 'spigot':
          // Spigot doesn't have a public API, we'll use common versions
          const spigotVersions = ['1.20.4', '1.20.2', '1.20.1', '1.19.4', '1.19.3', '1.19.2', '1.18.2', '1.17.1', '1.16.5']
          setVersions(spigotVersions)
          setSelectedVersion(spigotVersions[0])
          break

        case 'vanilla':
          data = await fetchWithTimeout('https://launchermeta.mojang.com/mc/game/version_manifest.json', timeout)
          const releases = data.versions.filter((v: any) => v.type === 'release')
          setVersions(releases.map((v: any) => v.id))
          if (releases.length > 0) setSelectedVersion(releases[0].id)
          break

        case 'fabric':
          data = await fetchWithTimeout('https://meta.fabricmc.net/v2/versions/game', timeout)
          const stableVersions = data.filter((v: any) => v.stable).map((v: any) => v.version)
          setVersions(stableVersions)
          if (stableVersions.length > 0) setSelectedVersion(stableVersions[0])
          break

        case 'bedrock':
          // Bedrock versions - manually maintained list since there's no official API
          const bedrockVersions = ['1.20.51', '1.20.50', '1.20.41', '1.20.40', '1.20.32', '1.20.31', '1.20.30', '1.20.15', '1.20.10', '1.20.0', '1.19.83', '1.19.80', '1.19.73']
          setVersions(bedrockVersions)
          setSelectedVersion(bedrockVersions[0])
          break
      }
    } catch (error: any) {
      console.error('Failed to load versions:', error)
      setError(`Failed to load versions: ${error.message}. Check your internet connection.`)
    } finally {
      setLoading(false)
    }
  }

  const loadBuilds = async () => {
    setLoadingBuilds(true)
    setError('')

    try {
      const timeout = 10000
      let data

      switch (serverType) {
        case 'paper':
          data = await fetchWithTimeout(`https://api.papermc.io/v2/projects/paper/versions/${selectedVersion}`, timeout)
          setBuilds(data.builds.reverse())
          if (data.builds.length > 0) setSelectedBuild(data.builds[data.builds.length - 1].toString())
          break

        case 'purpur':
          data = await fetchWithTimeout(`https://api.purpurmc.org/v2/purpur/${selectedVersion}`, timeout)
          setBuilds(data.builds.all.reverse())
          if (data.builds.all.length > 0) setSelectedBuild(data.builds.latest)
          break

        case 'fabric':
          data = await fetchWithTimeout('https://meta.fabricmc.net/v2/versions/loader', timeout)
          setBuilds(data.slice(0, 10)) // Get top 10 loader versions
          if (data.length > 0) setSelectedBuild(data[0].version)
          break
      }
    } catch (error: any) {
      console.error('Failed to load builds:', error)
      setError(`Failed to load builds: ${error.message}`)
    } finally {
      setLoadingBuilds(false)
    }
  }

  const fetchWithTimeout = async (url: string, timeout: number) => {
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

  const installVersion = async () => {
    if (!selectedVersion) {
      alert('Please select a version')
      return
    }

    if (serverType !== 'vanilla' && serverType !== 'bedrock' && serverType !== 'spigot' && !selectedBuild) {
      alert('Please select a build')
      return
    }

    const confirmMsg = serverType === 'bedrock' 
      ? `Install ${serverType.toUpperCase()} ${selectedVersion}? This will replace your server and requires Bedrock-specific configuration.`
      : `Install ${serverType.toUpperCase()} ${selectedVersion}${selectedBuild ? ` build #${selectedBuild}` : ''}? This will replace server.jar and restart the server.`

    if (!confirm(confirmMsg)) {
      return
    }

    setInstalling(true)
    setInstallProgress(0)
    setError('')

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setInstallProgress(prev => Math.min(prev + 10, 90))
      }, 500)

      const res = await fetch(`/api/servers/${serverId}/version/install`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serverType,
          version: selectedVersion,
          build: selectedBuild || 'latest'
        })
      })

      clearInterval(progressInterval)
      setInstallProgress(100)

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Installation failed')
      }

      alert('Version installed successfully! Server will restart.')
    } catch (error: any) {
      console.error('Failed to install version:', error)
      setError(error.message || 'Failed to install version')
      alert(error.message || 'Failed to install version')
    } finally {
      setInstalling(false)
      setTimeout(() => setInstallProgress(0), 2000)
    }
  }

  const currentServerType = SERVER_TYPES.find(t => t.id === serverType)
  const Icon = currentServerType?.icon || Package

  return (
    <div className="space-y-4 p-6">
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gamepad2 className="h-5 w-5 text-primary" />
            Version Manager
          </CardTitle>
          <CardDescription>
            Download and install different server software versions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Warning Alert */}
          <div className="p-4 rounded-lg border border-yellow-500/20 bg-yellow-500/10">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-sm">Warning</p>
                <p className="text-sm text-muted-foreground">
                  Changing server software may break existing worlds and plugins. Always create a backup before switching versions.
                </p>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-4 rounded-lg border border-red-500/20 bg-red-500/10">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm text-red-600">Error</p>
                  <p className="text-sm text-red-600/80">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Server Type Selection */}
          <div className="space-y-3">
            <Label className="text-base">Select Server Type</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {SERVER_TYPES.map((type) => {
                const TypeIcon = type.icon
                return (
                  <Card
                    key={type.id}
                    className={`cursor-pointer transition-all ${
                      serverType === type.id
                        ? `${type.borderColor} ${type.bgColor} ring-2 ring-offset-2 ring-${type.color.split('-')[1]}-500/50`
                        : 'border-primary/10 hover:border-primary/30'
                    }`}
                    onClick={() => setServerType(type.id)}
                  >
                    <CardContent className="pt-4 pb-4">
                      <div className="flex flex-col items-center text-center gap-2">
                        <TypeIcon className={`h-8 w-8 ${serverType === type.id ? type.color : 'text-muted-foreground'}`} />
                        <div>
                          <p className="font-semibold text-sm flex items-center gap-1 justify-center">
                            {type.name}
                            {type.recommended && (
                              <Badge variant="default" className="text-[10px] px-1 py-0">
                                Recommended
                              </Badge>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {type.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* Version Selection */}
          <div className="space-y-4 pt-4">
            <div className="flex items-center gap-3 pb-2 border-b">
              <Icon className={`h-5 w-5 ${currentServerType?.color}`} />
              <h3 className="font-semibold">
                Install {currentServerType?.name}
              </h3>
            </div>

            <div className="space-y-3">
              <Label>Minecraft Version</Label>
              <Select value={selectedVersion} onValueChange={setSelectedVersion} disabled={loading}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={loading ? "Loading versions..." : "Select version"} />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {versions.map((version, idx) => (
                    <SelectItem key={`${version}-${idx}`} value={version}>
                      {serverType === 'bedrock' ? `Bedrock ` : 'Minecraft '}{version}
                      {idx === 0 && <Badge className="ml-2 text-[10px]">Latest</Badge>}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Build Selection (for Paper, Purpur, Fabric) */}
            {['paper', 'purpur', 'fabric'].includes(serverType) && (
              <div className="space-y-3">
                <Label>
                  {serverType === 'fabric' ? 'Fabric Loader Version' : 'Build Number'}
                </Label>
                <Select value={selectedBuild} onValueChange={setSelectedBuild} disabled={loadingBuilds || !selectedVersion}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={loadingBuilds ? "Loading..." : "Select build"} />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {builds.map((build, idx) => {
                      const buildValue = typeof build === 'object' ? build.version : build.toString()
                      return (
                        <SelectItem key={`${buildValue}-${idx}`} value={buildValue}>
                          {serverType === 'fabric' ? `Loader ${buildValue}` : `Build #${buildValue}`}
                          {idx === 0 && <Badge className="ml-2 text-[10px]">Latest</Badge>}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Install Progress */}
            {installing && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Installing...</span>
                  <span className="font-semibold">{installProgress}%</span>
                </div>
                <Progress value={installProgress} className="h-2" />
              </div>
            )}

            {/* Install Button */}
            <Button 
              className="w-full" 
              onClick={installVersion}
              disabled={installing || loading || !selectedVersion || (['paper', 'purpur', 'fabric'].includes(serverType) && !selectedBuild)}
              size="lg"
            >
              {installing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Installing {installProgress}%...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Install {currentServerType?.name} {selectedVersion}
                  {selectedBuild && ` #${selectedBuild}`}
                </>
              )}
            </Button>
          </div>

          {/* Info Cards */}
          <div className="grid gap-3 pt-4 border-t">
            {serverType === 'bedrock' && (
              <Card className="border-cyan-500/20 bg-cyan-500/5">
                <CardContent className="pt-4 pb-4">
                  <div className="flex gap-3">
                    <AlertCircle className="h-5 w-5 text-cyan-600 flex-shrink-0" />
                    <div className="space-y-1">
                      <p className="font-semibold text-sm">Bedrock Edition Note</p>
                      <p className="text-sm text-muted-foreground">
                        Bedrock Edition allows cross-play with Xbox, PlayStation, Mobile, and Windows 10/11. 
                        Default port is 19132 (UDP). Java Edition clients cannot connect to Bedrock servers.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
