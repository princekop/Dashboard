"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, Search, Download, Trash2, RefreshCw, Loader2, Filter } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Mod {
  name: string
  version: string
  fileName: string
}

interface ModrinthMod {
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
  client_side: string
  server_side: string
}

interface ModsTabProps {
  serverId: string
}

export function ModsTab({ serverId }: ModsTabProps) {
  const [installedMods, setInstalledMods] = useState<Mod[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showBrowse, setShowBrowse] = useState(false)
  const [modrinthMods, setModrinthMods] = useState<ModrinthMod[]>([])
  const [searchingModrinth, setSearchingModrinth] = useState(false)
  const [selectedMod, setSelectedMod] = useState<ModrinthMod | null>(null)
  const [modVersions, setModVersions] = useState<any[]>([])
  const [selectedVersion, setSelectedVersion] = useState<any>(null)
  const [installing, setInstalling] = useState(false)
  const [modLoader, setModLoader] = useState<string>('fabric')
  const [mcVersion, setMcVersion] = useState<string>('')

  const minecraftVersions = [
    '1.20.4', '1.20.3', '1.20.2', '1.20.1', '1.20',
    '1.19.4', '1.19.3', '1.19.2', '1.19.1', '1.19',
    '1.18.2', '1.18.1', '1.18',
    '1.17.1', '1.17',
    '1.16.5', '1.16.4'
  ]

  useEffect(() => {
    loadMods()
  }, [serverId])

  const loadMods = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/servers/${serverId}/files?directory=/mods`)
      
      // If directory doesn't exist (500 error), just show empty
      if (!res.ok) {
        setInstalledMods([])
        setLoading(false)
        return
      }
      
      const data = await res.json()
      
      const modFiles = ((data.data || [])
        .filter((file: any) => {
          const attrs = file.attributes || file
          return attrs.is_file && attrs.name?.endsWith('.jar')
        })
        .map((file: any) => {
          const attrs = file.attributes || file
          return {
            name: attrs.name.replace('.jar', ''),
            version: 'Unknown',
            fileName: attrs.name
          }
        }))
      
      setInstalledMods(modFiles)
    } catch (error) {
      console.error('Failed to load mods:', error)
      setInstalledMods([])
    } finally {
      setLoading(false)
    }
  }

  const deleteMod = async (modName: string, fileName: string) => {
    if (!confirm(`Delete ${modName}?`)) return
    try {
      await fetch(`/api/servers/${serverId}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          root: '/mods',
          files: [fileName]
        })
      })
      loadMods()
    } catch (error) {
      console.error('Failed to delete mod:', error)
    }
  }

  const searchModrinth = async () => {
    if (!searchQuery.trim()) return
    
    setSearchingModrinth(true)
    try {
      let facets = `[["project_type:mod"]]`
      
      if (mcVersion) {
        facets = `[["project_type:mod"],["versions:${mcVersion}"]]`
      }
      
      if (modLoader) {
        facets = `[["project_type:mod"],["categories:${modLoader}"]]`
      }
      
      if (mcVersion && modLoader) {
        facets = `[["project_type:mod"],["versions:${mcVersion}"],["categories:${modLoader}"]]`
      }

      const res = await fetch(
        `https://api.modrinth.com/v2/search?query=${encodeURIComponent(searchQuery)}&facets=${facets}&limit=20`
      )
      const data = await res.json()
      setModrinthMods(data.hits || [])
    } catch (error) {
      console.error('Failed to search Modrinth:', error)
    } finally {
      setSearchingModrinth(false)
    }
  }

  const viewMod = async (mod: ModrinthMod) => {
    setSelectedMod(mod)
    setSelectedVersion(null)
    
    try {
      let versionUrl = `https://api.modrinth.com/v2/project/${mod.project_id}/version`
      const params = []
      
      if (modLoader) {
        params.push(`loaders=["${modLoader}"]`)
      }
      
      if (mcVersion) {
        params.push(`game_versions=["${mcVersion}"]`)
      }
      
      if (params.length > 0) {
        versionUrl += '?' + params.join('&')
      }

      const res = await fetch(versionUrl)
      const versions = await res.json()
      setModVersions(versions || [])
      if (versions.length > 0) {
        setSelectedVersion(versions[0]) // Select latest
      }
    } catch (error) {
      console.error('Failed to load mod versions:', error)
    }
  }

  const installMod = async () => {
    if (!selectedVersion || !selectedMod) return

    setInstalling(true)
    try {
      const downloadUrl = selectedVersion.files[0]?.url
      if (!downloadUrl) throw new Error('No download URL found')

      const res = await fetch(`/api/servers/${serverId}/mods/install`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: downloadUrl,
          fileName: selectedVersion.files[0].filename
        })
      })

      if (!res.ok) throw new Error('Installation failed')

      alert(`${selectedMod.title} installed successfully!`)
      setSelectedMod(null)
      setShowBrowse(false)
      loadMods()
    } catch (error: any) {
      console.error('Failed to install mod:', error)
      alert(error.message || 'Failed to install mod')
    } finally {
      setInstalling(false)
    }
  }

  const filteredMods = installedMods.filter(mod =>
    mod.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <Card className="border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Mods
              {installedMods.length > 0 && (
                <Badge variant="outline">{installedMods.length}</Badge>
              )}
            </CardTitle>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setShowBrowse(true)}>
                <Search className="h-4 w-4 mr-2" />
                Browse
              </Button>
              <Button size="sm" variant="outline" onClick={loadMods}>
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
              placeholder="Search installed mods..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
              Loading mods...
            </div>
          ) : filteredMods.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                {searchQuery ? 'No mods found' : 'No mods installed'}
              </p>
              <Button onClick={() => setShowBrowse(true)}>
                Browse Modrinth
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMods.map((mod, idx) => (
                <Card key={idx} className="border-primary/10">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h3 className="font-semibold">{mod.name}</h3>
                        <Badge variant="secondary" className="text-xs">
                          v{mod.version}
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteMod(mod.name, mod.fileName)}
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
            <DialogTitle>Browse Mods - Modrinth</DialogTitle>
            <DialogDescription>
              Search and install mods from Modrinth
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <Select value={modLoader} onValueChange={setModLoader}>
                <SelectTrigger>
                  <SelectValue placeholder="Mod Loader" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fabric">Fabric</SelectItem>
                  <SelectItem value="forge">Forge</SelectItem>
                  <SelectItem value="quilt">Quilt</SelectItem>
                  <SelectItem value="neoforge">NeoForge</SelectItem>
                </SelectContent>
              </Select>

              <Select value={mcVersion || undefined} onValueChange={(v) => setMcVersion(v === 'all' ? '' : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="MC Version (Optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Versions</SelectItem>
                  {minecraftVersions.map(v => (
                    <SelectItem key={v} value={v}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="Search mods on Modrinth..."
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
              ) : modrinthMods.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>Search for mods to get started</p>
                  <p className="text-xs mt-2">Select mod loader and optionally MC version for better results</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {modrinthMods.map((mod) => (
                    <Card key={mod.project_id} className="border-primary/10">
                      <CardContent className="pt-4">
                        <div className="flex gap-4">
                          {mod.icon_url && (
                            <img 
                              src={mod.icon_url} 
                              alt={mod.title}
                              className="w-16 h-16 rounded object-cover"
                            />
                          )}
                          <div className="flex-1 space-y-2">
                            <div>
                              <h3 className="font-semibold">{mod.title}</h3>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {mod.description}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="secondary" className="text-xs">
                                <Download className="h-3 w-3 mr-1" />
                                {mod.downloads.toLocaleString()}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {mod.client_side} client
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {mod.server_side} server
                              </Badge>
                              {mod.categories.slice(0, 2).map(cat => (
                                <Badge key={cat} variant="outline" className="text-xs">
                                  {cat}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <Button 
                            size="sm"
                            onClick={() => viewMod(mod)}
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

      {/* Mod Version Selection Dialog */}
      <Dialog open={!!selectedMod} onOpenChange={() => setSelectedMod(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedMod?.title}</DialogTitle>
            <DialogDescription>
              Select a version to install
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {modVersions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Loading versions...</p>
            ) : (
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {modVersions.map((version) => (
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
                              {version.game_versions?.join(', ')} • {version.loaders?.join(', ')}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            {version.version_type === 'release' && (
                              <Badge variant="default">Release</Badge>
                            )}
                            {version.version_type === 'beta' && (
                              <Badge variant="secondary">Beta</Badge>
                            )}
                            {version.version_type === 'alpha' && (
                              <Badge variant="outline">Alpha</Badge>
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
            <Button variant="outline" onClick={() => setSelectedMod(null)}>
              Cancel
            </Button>
            <Button 
              onClick={installMod} 
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
