"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Gamepad2, Download, AlertCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'

interface VersionTabProps {
  serverId: string
}

export function VersionTab({ serverId }: VersionTabProps) {
  const [currentVersion, setCurrentVersion] = useState('1.20.1')
  const [selectedVersion, setSelectedVersion] = useState('1.20.1')
  const [installing, setInstalling] = useState(false)

  const minecraftVersions = [
    '1.20.4', '1.20.3', '1.20.2', '1.20.1', '1.20',
    '1.19.4', '1.19.3', '1.19.2', '1.19.1', '1.19',
    '1.18.2', '1.18.1', '1.18',
    '1.17.1', '1.17',
    '1.16.5', '1.16.4', '1.16.3', '1.16.2', '1.16.1',
    '1.12.2', '1.8.9'
  ]

  const installVersion = async () => {
    if (!confirm(`Change server version to ${selectedVersion}? This will replace the server.jar file.`)) return
    
    setInstalling(true)
    try {
      // This would typically download and install the version
      await new Promise(resolve => setTimeout(resolve, 2000))
      setCurrentVersion(selectedVersion)
    } catch (error) {
      console.error('Failed to install version:', error)
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
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Current Version</p>
                  <p className="text-2xl font-bold text-primary">{currentVersion}</p>
                </div>
                <Badge variant="default" className="text-sm px-3 py-1">Active</Badge>
              </div>
            </div>

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

            <div className="space-y-3">
              <Label>Select New Version</Label>
              <Select value={selectedVersion} onValueChange={setSelectedVersion}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {minecraftVersions.map(version => (
                    <SelectItem key={version} value={version}>
                      Minecraft {version}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button 
              className="w-full" 
              onClick={installVersion}
              disabled={installing || selectedVersion === currentVersion}
            >
              <Download className="h-4 w-4 mr-2" />
              {installing ? 'Installing...' : 'Install Version'}
            </Button>
          </div>

          <div className="space-y-3 pt-4 border-t">
            <h3 className="font-semibold">Available Server Types</h3>
            <div className="grid gap-3">
              {['Paper', 'Spigot', 'Fabric', 'Forge', 'Vanilla'].map(type => (
                <Card key={type} className="border-primary/10">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{type}</p>
                        <p className="text-sm text-muted-foreground">
                          {type === 'Paper' && 'High performance, plugin support'}
                          {type === 'Spigot' && 'Original plugin platform'}
                          {type === 'Fabric' && 'Lightweight modding'}
                          {type === 'Forge' && 'Traditional modding'}
                          {type === 'Vanilla' && 'Official Minecraft server'}
                        </p>
                      </div>
                      {type === 'Paper' && <Badge>Current</Badge>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
