"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Puzzle, Search, Download, Trash2, Upload, RefreshCw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'

interface Plugin {
  name: string
  version: string
  enabled: boolean
}

interface PluginsTabProps {
  serverId: string
}

export function PluginsTab({ serverId }: PluginsTabProps) {
  const [plugins, setPlugins] = useState<Plugin[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showUpload, setShowUpload] = useState(false)

  useEffect(() => {
    loadPlugins()
  }, [serverId])

  const loadPlugins = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/servers/${serverId}/files?directory=/plugins`)
      const data = await res.json()
      
      const pluginFiles = (data.data || [])
        .filter((file: any) => file.is_file && file.name.endsWith('.jar'))
        .map((file: any) => ({
          name: file.name.replace('.jar', ''),
          version: 'Unknown',
          enabled: true
        }))
      
      setPlugins(pluginFiles)
    } catch (error) {
      console.error('Failed to load plugins:', error)
      setPlugins([])
    } finally {
      setLoading(false)
    }
  }

  const deletePlugin = async (pluginName: string) => {
    if (!confirm(`Delete ${pluginName}?`)) return
    try {
      await fetch(`/api/servers/${serverId}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          root: '/plugins',
          files: [`${pluginName}.jar`]
        })
      })
      loadPlugins()
    } catch (error) {
      console.error('Failed to delete plugin:', error)
    }
  }

  const filteredPlugins = plugins.filter(plugin =>
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
            </CardTitle>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={loadPlugins}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button size="sm" onClick={() => setShowUpload(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search plugins..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading plugins...</div>
          ) : filteredPlugins.length === 0 ? (
            <div className="text-center py-12">
              <Puzzle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchQuery ? 'No plugins found' : 'No plugins installed'}
              </p>
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
                        onClick={() => deletePlugin(plugin.name)}
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

      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Plugin</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                Upload .jar files to /plugins directory using the File Manager
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowUpload(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
