"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Puzzle, Search, Download, Trash2, Upload, RefreshCw, Loader2, ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'

interface Plugin {
  name: string
  version: string
  enabled: boolean
  fileName: string
}

interface ModrinthPlugin {
  project_id: string
  slug: string
  title: string
  description: string
  downloads: number
  icon_url: string
  author: string
  categories: string[]
  versions: string[]
  project_type: string
}

interface PluginsTabProps {
  serverId: string
}

export function PluginsTab({ serverId }: PluginsTabProps) {
  const [installedPlugins, setInstalledPlugins] = useState<Plugin[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showBrowse, setShowBrowse] = useState(false)
  const [modrinthPlugins, setModrinthPlugins] = useState<ModrinthPlugin[]>([])
  const [searchingModrinth, setSearchingModrinth] = useState(false)
  const [selectedPlugin, setSelectedPlugin] = useState<ModrinthPlugin | null>(null)
  const [pluginVersions, setPluginVersions] = useState<any[]>([])
  const [selectedVersion, setSelectedVersion] = useState<any>(null)
  const [installing, setInstalling] = useState(false)

  useEffect(() => {
    loadPlugins()
  }, [serverId])

  const loadPlugins = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/servers/${serverId}/files?directory=/plugins`)
      
      // If directory doesn't exist (500 error), just show empty
      if (!res.ok) {
        setInstalledPlugins([])
        setLoading(false)
        return
      }
      
      const data = await res.json()
      
      const pluginFiles = ((data.data || [])
        .filter((file: any) => {
          const attrs = file.attributes || file
          return attrs.is_file && attrs.name?.endsWith('.jar')
        })
        .map((file: any) => {
          const attrs = file.attributes || file
          return {
            name: attrs.name.replace('.jar', ''),
            version: 'Unknown',
            enabled: true,
            fileName: attrs.name
          }
        }))
      
      setInstalledPlugins(pluginFiles)
    } catch (error) {
      console.error('Failed to load plugins:', error)
      setInstalledPlugins([])
    } finally {
      setLoading(false)
    }
  }

  const deletePlugin = async (pluginName: string, fileName: string) => {
    if (!confirm(`Delete ${pluginName}?`)) return
    try {
      await fetch(`/api/servers/${serverId}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          root: '/plugins',
          files: [fileName]
        })
      })
      loadPlugins()
    } catch (error) {
      console.error('Failed to delete plugin:', error)
    }
  }

  const searchModrinth = async () => {
    if (!searchQuery.trim()) return
    
    setSearchingModrinth(true)
    try {
      const res = await fetch(
        `https://api.modrinth.com/v2/search?query=${encodeURIComponent(searchQuery)}&facets=[["project_type:plugin"]]&limit=20`
      )
      const data = await res.json()
      setModrinthPlugins(data.hits || [])
    } catch (error) {
      console.error('Failed to search Modrinth:', error)
    } finally {
      setSearchingModrinth(false)
    }
  }

  const viewPlugin = async (plugin: ModrinthPlugin) => {
    setSelectedPlugin(plugin)
    setSelectedVersion(null)
    
    try {
      const res = await fetch(`https://api.modrinth.com/v2/project/${plugin.project_id}/version`)
      const versions = await res.json()
      setPluginVersions(versions || [])
      if (versions.length > 0) {
        setSelectedVersion(versions[0]) // Select latest
      }
    } catch (error) {
      console.error('Failed to load plugin versions:', error)
    }
  }

  const installPlugin = async () => {
    if (!selectedVersion || !selectedPlugin) return

    setInstalling(true)
    try {
      const downloadUrl = selectedVersion.files[0]?.url
      if (!downloadUrl) throw new Error('No download URL found')

      const res = await fetch(`/api/servers/${serverId}/plugins/install`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: downloadUrl,
          fileName: selectedVersion.files[0].filename
        })
      })

      if (!res.ok) throw new Error('Installation failed')

      alert(`${selectedPlugin.title} installed successfully!`)
      setSelectedPlugin(null)
      setShowBrowse(false)
      loadPlugins()
    } catch (error: any) {
      console.error('Failed to install plugin:', error)
      alert(error.message || 'Failed to install plugin')
    } finally {
      setInstalling(false)
    }
  }

  const filteredPlugins = installedPlugins.filter(plugin =>
    plugin.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <Card className="border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Puzzle className="h-5 w-5 text-primary" />
              Plugins
              {installedPlugins.length > 0 && (
                <Badge variant="outline">{installedPlugins.length}</Badge>
              )}
            </CardTitle>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setShowBrowse(true)}>
                <Search className="h-4 w-4 mr-2" />
                Browse
              </Button>
              <Button size="sm" variant="outline" onClick={loadPlugins}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search installed plugins..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
              Loading plugins...
            </div>
          ) : filteredPlugins.length === 0 ? (
            <div className="text-center py-12">
              <Puzzle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                {searchQuery ? 'No plugins found' : 'No plugins installed'}
              </p>
              <Button onClick={() => setShowBrowse(true)}>
                Browse Modrinth
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPlugins.map((plugin, idx) => (
                <Card key={idx} className="border-primary/10">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h3 className="font-semibold">{plugin.name}</h3>
                        <div className="flex gap-2 items-center">
                          <Badge variant="secondary" className="text-xs">
                            v{plugin.version}
                          </Badge>
                          <Badge variant={plugin.enabled ? 'default' : 'outline'} className="text-xs">
                            {plugin.enabled ? 'Enabled' : 'Disabled'}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deletePlugin(plugin.name, plugin.fileName)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Browse Modrinth Dialog */}
      <Dialog open={showBrowse} onOpenChange={setShowBrowse}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Browse Plugins - Modrinth</DialogTitle>
            <DialogDescription>
              Search and install plugins from Modrinth
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Search plugins on Modrinth..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchModrinth()}
              />
              <Button onClick={searchModrinth} disabled={searchingModrinth}>
                {searchingModrinth ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>

            <ScrollArea className="h-[500px]">
              {searchingModrinth ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Searching Modrinth...</p>
                </div>
              ) : modrinthPlugins.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>Search for plugins to get started</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {modrinthPlugins.map((plugin) => (
                    <Card key={plugin.project_id} className="border-primary/10">
                      <CardContent className="pt-4">
                        <div className="flex gap-4">
                          {plugin.icon_url && (
                            <img 
                              src={plugin.icon_url} 
                              alt={plugin.title}
                              className="w-16 h-16 rounded object-cover"
                            />
                          )}
                          <div className="flex-1 space-y-2">
                            <div>
                              <h3 className="font-semibold">{plugin.title}</h3>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {plugin.description}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="secondary" className="text-xs">
                                <Download className="h-3 w-3 mr-1" />
                                {plugin.downloads.toLocaleString()}
                              </Badge>
                              {plugin.categories.slice(0, 3).map(cat => (
                                <Badge key={cat} variant="outline" className="text-xs">
                                  {cat}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <Button 
                            size="sm"
                            onClick={() => viewPlugin(plugin)}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Install
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      {/* Plugin Version Selection Dialog */}
      <Dialog open={!!selectedPlugin} onOpenChange={() => setSelectedPlugin(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedPlugin?.title}</DialogTitle>
            <DialogDescription>
              Select a version to install
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {pluginVersions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Loading versions...</p>
            ) : (
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {pluginVersions.map((version) => (
                    <Card 
                      key={version.id}
                      className={`cursor-pointer transition-colors ${
                        selectedVersion?.id === version.id ? 'border-primary' : 'border-primary/10'
                      }`}
                      onClick={() => setSelectedVersion(version)}
                    >
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold">{version.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {version.game_versions?.join(', ')}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            {version.version_type === 'release' && (
                              <Badge variant="default">Release</Badge>
                            )}
                            {version.version_type === 'beta' && (
                              <Badge variant="secondary">Beta</Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedPlugin(null)}>
              Cancel
            </Button>
            <Button 
              onClick={installPlugin} 
              disabled={!selectedVersion || installing}
            >
              {installing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Installing...
                </>
              ) : (
                'Install'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
