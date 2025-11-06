"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Archive, Plus, Trash2, Download, RotateCcw, Clock, HardDrive, Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

interface Backup {
  uuid: string
  name: string
  bytes: number
  created_at: string
  completed_at: string | null
  is_successful: boolean
  is_locked: boolean
  checksum: string | null
}

interface BackupsTabProps {
  serverId: string
}

export function BackupsTab({ serverId }: BackupsTabProps) {
  const [backups, setBackups] = useState<Backup[]>([])
  const [loading, setLoading] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [backupName, setBackupName] = useState('')
  const [creating, setCreating] = useState(false)
  const [restoring, setRestoring] = useState<string | null>(null)

  useEffect(() => {
    loadBackups()
    // Auto-refresh every 10 seconds
    const interval = setInterval(loadBackups, 10000)
    return () => clearInterval(interval)
  }, [serverId])

  const loadBackups = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/servers/${serverId}/backups`)
      const data = await res.json()
      
      // Handle both direct array and nested data structure
      const backupList = Array.isArray(data) ? data : (data.data || [])
      
      setBackups(backupList.map((item: any) => {
        const attrs = item.attributes || item
        return {
          uuid: attrs.uuid || item.uuid,
          name: attrs.name || item.name || 'Unnamed',
          bytes: attrs.bytes || item.bytes || 0,
          created_at: attrs.created_at || item.created_at,
          completed_at: attrs.completed_at || item.completed_at,
          is_successful: attrs.is_successful ?? item.is_successful ?? true,
          is_locked: attrs.is_locked ?? item.is_locked ?? false,
          checksum: attrs.checksum || item.checksum
        }
      }))
    } catch (error) {
      console.error('Failed to load backups:', error)
      setBackups([])
    } finally {
      setLoading(false)
    }
  }

  const createBackup = async () => {
    if (creating) return
    
    setCreating(true)
    try {
      const res = await fetch(`/api/servers/${serverId}/backups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: backupName || undefined })
      })
      
      if (!res.ok) throw new Error('Failed to create backup')
      
      setShowCreate(false)
      setBackupName('')
      
      // Wait a bit then reload
      setTimeout(loadBackups, 1000)
    } catch (error) {
      console.error('Failed to create backup:', error)
      alert('Failed to create backup. Please try again.')
    } finally {
      setCreating(false)
    }
  }

  const deleteBackup = async (uuid: string, name: string) => {
    if (!confirm(`Delete backup "${name}"? This cannot be undone.`)) return
    
    try {
      const res = await fetch(`/api/servers/${serverId}/backups?uuid=${uuid}`, {
        method: 'DELETE'
      })
      
      if (!res.ok) throw new Error('Failed to delete backup')
      
      loadBackups()
    } catch (error) {
      console.error('Failed to delete backup:', error)
      alert('Failed to delete backup.')
    }
  }

  const restoreBackup = async (uuid: string, name: string) => {
    if (!confirm(`Restore backup "${name}"? This will overwrite current server files!`)) return
    
    setRestoring(uuid)
    try {
      const res = await fetch(`/api/servers/${serverId}/backups/${uuid}/restore`, {
        method: 'POST'
      })
      
      if (!res.ok) throw new Error('Failed to restore backup')
      
      alert('Backup restore started! Server will restart.')
      setTimeout(loadBackups, 2000)
    } catch (error) {
      console.error('Failed to restore backup:', error)
      alert('Failed to restore backup.')
    } finally {
      setRestoring(null)
    }
  }

  const downloadBackup = async (uuid: string, name: string) => {
    try {
      const res = await fetch(`/api/servers/${serverId}/backups/${uuid}/download`)
      const data = await res.json()
      
      if (data.url) {
        window.open(data.url, '_blank')
      }
    } catch (error) {
      console.error('Failed to get download URL:', error)
      alert('Failed to get download link.')
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  return (
    <div className="space-y-4">
      <Card className="border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Archive className="h-5 w-5 text-primary" />
              Backups
              {backups.length > 0 && (
                <Badge variant="outline">{backups.length}</Badge>
              )}
            </CardTitle>
            <Button size="sm" onClick={() => setShowCreate(true)} disabled={creating}>
              <Plus className="h-4 w-4 mr-2" />
              Create Backup
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading && backups.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
              Loading backups...
            </div>
          ) : backups.length === 0 ? (
            <div className="text-center py-12">
              <Archive className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No backups yet</p>
              <Button onClick={() => setShowCreate(true)}>
                Create your first backup
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {backups.map((backup) => (
                <Card key={backup.uuid} className={`border-primary/10 ${!backup.is_successful ? 'border-red-500/20 bg-red-500/5' : ''}`}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold">{backup.name}</h3>
                          {backup.is_locked && (
                            <Badge variant="secondary" className="text-xs">Locked</Badge>
                          )}
                          {!backup.is_successful && (
                            <Badge variant="destructive" className="text-xs">Failed</Badge>
                          )}
                          {backup.is_successful && backup.completed_at && (
                            <Badge variant="default" className="text-xs">Completed</Badge>
                          )}
                          {backup.is_successful && !backup.completed_at && (
                            <Badge variant="outline" className="text-xs">In Progress</Badge>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <HardDrive className="h-4 w-4" />
                            <span>{formatSize(backup.bytes)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{formatDate(backup.created_at)}</span>
                          </div>
                        </div>
                        
                        {backup.checksum && (
                          <div className="text-xs text-muted-foreground font-mono">
                            Checksum: {backup.checksum.substring(0, 16)}...
                          </div>
                        )}
                      </div>

                      {backup.is_successful && backup.completed_at && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => downloadBackup(backup.uuid, backup.name)}
                            title="Download"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => restoreBackup(backup.uuid, backup.name)}
                            disabled={restoring === backup.uuid}
                            title="Restore"
                          >
                            {restoring === backup.uuid ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <RotateCcw className="h-4 w-4" />
                            )}
                          </Button>
                          {!backup.is_locked && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => deleteBackup(backup.uuid, backup.name)}
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Backup</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Backup Name (Optional)</Label>
              <Input
                value={backupName}
                onChange={(e) => setBackupName(e.target.value)}
                placeholder="my-backup"
                disabled={creating}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Leave empty for auto-generated name
              </p>
            </div>
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-sm text-muted-foreground">
                ℹ️ This will create a backup of all server files. The process may take a few minutes depending on server size.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)} disabled={creating}>
              Cancel
            </Button>
            <Button onClick={createBackup} disabled={creating}>
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Backup'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
