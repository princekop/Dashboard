"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, Search, Trash2, Upload, RefreshCw, Download } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface Mod {
  name: string
  size: number
}

interface ModsTabProps {
  serverId: string
}

export function ModsTab({ serverId }: ModsTabProps) {
  const [mods, setMods] = useState<Mod[]>([])
  const [modpacks, setModpacks] = useState<Mod[]>([])
  const [resourcePacks, setResourcePacks] = useState<Mod[]>([])
  const [shaderPacks, setShaderPacks] = useState<Mod[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadAllMods()
  }, [serverId])

  const loadAllMods = async () => {
    setLoading(true)
    try {
      await Promise.all([
        loadModsFromDirectory('/mods', setMods),
        loadModsFromDirectory('/modpacks', setModpacks),
        loadModsFromDirectory('/resourcepacks', setResourcePacks),
        loadModsFromDirectory('/shaderpacks', setShaderPacks)
      ])
    } finally {
      setLoading(false)
    }
  }

  const loadModsFromDirectory = async (directory: string, setter: (mods: Mod[]) => void) => {
    try {
      const res = await fetch(`/api/servers/${serverId}/files?directory=${encodeURIComponent(directory)}`)
      const data = await res.json()
      
      const files = (data.data || [])
        .filter((file: any) => file.is_file)
        .map((file: any) => ({
          name: file.name,
          size: file.size
        }))
      
      setter(files)
    } catch (error) {
      console.error(`Failed to load from ${directory}:`, error)
      setter([])
    }
  }

  const deleteMod = async (directory: string, modName: string, reload: () => void) => {
    if (!confirm(`Delete ${modName}?`)) return
    try {
      await fetch(`/api/servers/${serverId}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          root: directory,
          files: [modName]
        })
      })
      reload()
    } catch (error) {
      console.error('Failed to delete mod:', error)
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const renderModList = (items: Mod[], directory: string, reload: () => void) => {
    const filtered = items.filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    if (filtered.length === 0) {
      return (
        <div className="text-center py-12">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {searchQuery ? 'No items found' : 'No items installed'}
          </p>
        </div>
      )
    }

    return (
      <div className="space-y-3">
        {filtered.map((item, idx) => (
          <Card key={idx} className="border-primary/10">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1 flex-1">
                  <h3 className="font-semibold">{item.name}</h3>
                  <p className="text-sm text-muted-foreground">{formatSize(item.size)}</p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteMod(directory, item.name, reload)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Card className="border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Mods & Packs
            </CardTitle>
            <Button size="sm" variant="outline" onClick={loadAllMods}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <Tabs defaultValue="mods" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="mods">Mods</TabsTrigger>
              <TabsTrigger value="modpacks">Modpacks</TabsTrigger>
              <TabsTrigger value="resourcepacks">Resources</TabsTrigger>
              <TabsTrigger value="shaderpacks">Shaders</TabsTrigger>
            </TabsList>

            <TabsContent value="mods" className="mt-4">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : (
                renderModList(mods, '/mods', () => loadModsFromDirectory('/mods', setMods))
              )}
            </TabsContent>

            <TabsContent value="modpacks" className="mt-4">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : (
                renderModList(modpacks, '/modpacks', () => loadModsFromDirectory('/modpacks', setModpacks))
              )}
            </TabsContent>

            <TabsContent value="resourcepacks" className="mt-4">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : (
                renderModList(resourcePacks, '/resourcepacks', () => loadModsFromDirectory('/resourcepacks', setResourcePacks))
              )}
            </TabsContent>

            <TabsContent value="shaderpacks" className="mt-4">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : (
                renderModList(shaderPacks, '/shaderpacks', () => loadModsFromDirectory('/shaderpacks', setShaderPacks))
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
