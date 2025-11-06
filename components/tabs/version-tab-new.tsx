"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Gamepad2, Download, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface VersionTabProps {
  serverId: string
}

interface PaperVersion {
  version: string
  builds: number[]
}

export function VersionTab({ serverId }: VersionTabProps) {
  const [serverType, setServerType] = useState('paper')
  const [versions, setVersions] = useState<string[]>([])
  const [selectedVersion, setSelectedVersion] = useState('')
  const [selectedBuild, setSelectedBuild] = useState('')
  const [builds, setBuilds] = useState<number[]>([])
  const [loading, setLoading] = useState(false)
  const [installing, setInstalling] = useState(false)
  const [loadingBuilds, setLoadingBuilds] = useState(false)

  useEffect(() => {
    if (serverType === 'paper') {
      loadPaperVersions()
    } else if (serverType === 'purpur') {
      loadPurpurVersions()
    }
  }, [serverType])

  useEffect(() => {
    if (selectedVersion && serverType === 'paper') {
      loadPaperBuilds(selectedVersion)
    } else if (selectedVersion && serverType === 'purpur') {
      loadPurpurBuilds(selectedVersion)
    }
  }, [selectedVersion, serverType])

  const loadPaperVersions = async () => {
    setLoading(true)
    try {
      const res = await fetch('https://api.papermc.io/v2/projects/paper')
      const data = await res.json()
      setVersions(data.versions.reverse()) // Latest first
      if (data.versions.length > 0) {
        setSelectedVersion(data.versions[data.versions.length - 1]) // Select latest
      }
    } catch (error) {
      console.error('Failed to load Paper versions:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadPaperBuilds = async (version: string) => {
    setLoadingBuilds(true)
    try {
      const res = await fetch(`https://api.papermc.io/v2/projects/paper/versions/${version}`)
      const data = await res.json()
      setBuilds(data.builds.reverse()) // Latest first
      if (data.builds.length > 0) {
        setSelectedBuild(data.builds[data.builds.length - 1].toString())
      }
    } catch (error) {
      console.error('Failed to load Paper builds:', error)
    } finally {
      setLoadingBuilds(false)
    }
  }

  const loadPurpurVersions = async () => {
    setLoading(true)
    try {
      const res = await fetch('https://api.purpurmc.org/v2/purpur')
      const data = await res.json()
      setVersions(data.versions.reverse())
      if (data.versions.length > 0) {
        setSelectedVersion(data.versions[data.versions.length - 1])
      }
    } catch (error) {
      console.error('Failed to load Purpur versions:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadPurpurBuilds = async (version: string) => {
    setLoadingBuilds(true)
    try {
      const res = await fetch(`https://api.purpurmc.org/v2/purpur/${version}`)
      const data = await res.json()
      setBuilds(data.builds.all.reverse())
      if (data.builds.all.length > 0) {
        setSelectedBuild(data.builds.latest)
      }
    } catch (error) {
      console.error('Failed to load Purpur builds:', error)
    } finally {
      setLoadingBuilds(false)
    }
  }

  const installVersion = async () => {
    if (!selectedVersion || !selectedBuild) {
      alert('Please select version and build')
      return
    }

    if (!confirm(`Install ${serverType.toUpperCase()} ${selectedVersion} build #${selectedBuild}? This will replace server.jar and restart the server.`)) {
      return
    }

    setInstalling(true)
    try {
      const res = await fetch(`/api/servers/${serverId}/version/install`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serverType,
          version: selectedVersion,
          build: selectedBuild
        })
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Installation failed')
      }

      alert('Version installed successfully! Server will restart.')
    } catch (error: any) {
      console.error('Failed to install version:', error)
      alert(error.message || 'Failed to install version')
    } finally {
      setInstalling(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gamepad2 className="h-5 w-5 text-primary" />
            Version Manager
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 rounded-lg border border-yellow-500/20 bg-yellow-500/10">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-sm">Warning</p>
                <p className="text-sm text-muted-foreground">
                  Changing versions may break existing worlds and plugins. Always backup before changing versions.
                </p>
              </div>
            </div>
          </div>

          <Tabs value={serverType} onValueChange={setServerType} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="paper">Paper</TabsTrigger>
              <TabsTrigger value="purpur">Purpur</TabsTrigger>
              <TabsTrigger value="fabric">Fabric</TabsTrigger>
              <TabsTrigger value="vanilla">Vanilla</TabsTrigger>
            </TabsList>

            <TabsContent value="paper" className="space-y-4 mt-4">
              <div className="space-y-3">
                <Label>Minecraft Version</Label>
                <Select value={selectedVersion} onValueChange={setSelectedVersion} disabled={loading}>
                  <SelectTrigger>
                    <SelectValue placeholder={loading ? "Loading versions..." : "Select version"} />
                  </SelectTrigger>
                  <SelectContent>
                    {versions.map(version => (
                      <SelectItem key={version} value={version}>
                        Minecraft {version}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>Build Number</Label>
                <Select value={selectedBuild} onValueChange={setSelectedBuild} disabled={loadingBuilds || !selectedVersion}>
                  <SelectTrigger>
                    <SelectValue placeholder={loadingBuilds ? "Loading builds..." : "Select build"} />
                  </SelectTrigger>
                  <SelectContent>
                    {builds.map(build => (
                      <SelectItem key={build} value={build.toString()}>
                        Build #{build}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button 
                className="w-full" 
                onClick={installVersion}
                disabled={installing || !selectedVersion || !selectedBuild}
              >
                {installing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Installing...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Install Paper {selectedVersion} #{selectedBuild}
                  </>
                )}
              </Button>
            </TabsContent>

            <TabsContent value="purpur" className="space-y-4 mt-4">
              <div className="space-y-3">
                <Label>Minecraft Version</Label>
                <Select value={selectedVersion} onValueChange={setSelectedVersion} disabled={loading}>
                  <SelectTrigger>
                    <SelectValue placeholder={loading ? "Loading versions..." : "Select version"} />
                  </SelectTrigger>
                  <SelectContent>
                    {versions.map(version => (
                      <SelectItem key={version} value={version}>
                        Minecraft {version}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>Build Number</Label>
                <Select value={selectedBuild} onValueChange={setSelectedBuild} disabled={loadingBuilds || !selectedVersion}>
                  <SelectTrigger>
                    <SelectValue placeholder={loadingBuilds ? "Loading builds..." : "Select build"} />
                  </SelectTrigger>
                  <SelectContent>
                    {builds.map(build => (
                      <SelectItem key={build} value={build.toString()}>
                        Build #{build}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button 
                className="w-full" 
                onClick={installVersion}
                disabled={installing || !selectedVersion || !selectedBuild}
              >
                {installing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Installing...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Install Purpur {selectedVersion} #{selectedBuild}
                  </>
                )}
              </Button>
            </TabsContent>

            <TabsContent value="fabric" className="mt-4">
              <div className="text-center py-8 text-muted-foreground">
                <p className="mb-2">Fabric support coming soon</p>
                <p className="text-sm">Manual installation available via File Manager</p>
              </div>
            </TabsContent>

            <TabsContent value="vanilla" className="mt-4">
              <div className="text-center py-8 text-muted-foreground">
                <p className="mb-2">Vanilla support coming soon</p>
                <p className="text-sm">Manual installation available via File Manager</p>
              </div>
            </TabsContent>
          </Tabs>

          <div className="space-y-3 pt-4 border-t">
            <h3 className="font-semibold">Server Types</h3>
            <div className="grid gap-3">
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">Paper</p>
                      <p className="text-sm text-muted-foreground">High performance, best plugin support</p>
                    </div>
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-primary/10">
                <CardContent className="pt-4">
                  <div>
                    <p className="font-semibold">Purpur</p>
                    <p className="text-sm text-muted-foreground">Paper fork with additional features</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
