"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Database, Plus, Trash2, Key, Copy, Eye, EyeOff } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

interface DatabaseItem {
  id: string
  name: string
  username: string
  password?: string
  host: string
  port: number
  connections_from: string
}

interface DatabaseTabProps {
  serverId: string
}

export function DatabaseTab({ serverId }: DatabaseTabProps) {
  const [databases, setDatabases] = useState<DatabaseItem[]>([])
  const [loading, setLoading] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [newDbName, setNewDbName] = useState('')
  const [newDbRemote, setNewDbRemote] = useState('%')
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadDatabases()
  }, [serverId])

  const loadDatabases = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/servers/${serverId}/databases`)
      const data = await res.json()
      setDatabases(data.data || [])
    } catch (error) {
      console.error('Failed to load databases:', error)
    } finally {
      setLoading(false)
    }
  }

  const createDatabase = async () => {
    if (!newDbName.trim()) return
    try {
      await fetch(`/api/servers/${serverId}/databases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ database: newDbName, remote: newDbRemote })
      })
      setShowCreate(false)
      setNewDbName('')
      setNewDbRemote('%')
      loadDatabases()
    } catch (error) {
      console.error('Failed to create database:', error)
    }
  }

  const deleteDatabase = async (dbId: string, dbName: string) => {
    if (!confirm(`Delete database ${dbName}?`)) return
    try {
      await fetch(`/api/servers/${serverId}/databases?databaseId=${dbId}`, {
        method: 'DELETE'
      })
      loadDatabases()
    } catch (error) {
      console.error('Failed to delete database:', error)
    }
  }

  const rotatePassword = async (dbId: string) => {
    if (!confirm('Rotate database password? This will change the password.')) return
    try {
      await fetch(`/api/servers/${serverId}/databases/${dbId}/rotate`, {
        method: 'POST'
      })
      loadDatabases()
    } catch (error) {
      console.error('Failed to rotate password:', error)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const togglePasswordVisibility = (dbId: string) => {
    setVisiblePasswords(prev => {
      const newSet = new Set(prev)
      if (newSet.has(dbId)) {
        newSet.delete(dbId)
      } else {
        newSet.add(dbId)
      }
      return newSet
    })
  }

  return (
    <div className="space-y-4">
      <Card className="border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              Databases
            </CardTitle>
            <Button size="sm" onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Database
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading databases...</div>
          ) : databases.length === 0 ? (
            <div className="text-center py-12">
              <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No databases yet</p>
              <Button className="mt-4" onClick={() => setShowCreate(true)}>
                Create your first database
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {databases.map((db) => (
                <Card key={db.id} className="border-primary/10">
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-lg">{db.name}</h3>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => rotatePassword(db.id)}>
                            <Key className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => deleteDatabase(db.id, db.name)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Username</Label>
                          <div className="flex gap-2">
                            <Input value={db.username} readOnly className="font-mono text-sm" />
                            <Button size="sm" variant="ghost" onClick={() => copyToClipboard(db.username)}>
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Password</Label>
                          <div className="flex gap-2">
                            <Input
                              type={visiblePasswords.has(db.id) ? 'text' : 'password'}
                              value={db.password || '••••••••'}
                              readOnly
                              className="font-mono text-sm"
                            />
                            <Button size="sm" variant="ghost" onClick={() => togglePasswordVisibility(db.id)}>
                              {visiblePasswords.has(db.id) ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                            {db.password && (
                              <Button size="sm" variant="ghost" onClick={() => copyToClipboard(db.password!)}>
                                <Copy className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Host</Label>
                          <div className="flex gap-2">
                            <Input value={db.host} readOnly className="font-mono text-sm" />
                            <Button size="sm" variant="ghost" onClick={() => copyToClipboard(db.host)}>
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Port</Label>
                          <Input value={db.port} readOnly className="font-mono text-sm" />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2">
                        <Badge variant="secondary">Connections from: {db.connections_from}</Badge>
                      </div>
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
            <DialogTitle>Create New Database</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Database Name</Label>
              <Input
                value={newDbName}
                onChange={(e) => setNewDbName(e.target.value)}
                placeholder="my_database"
              />
            </div>
            <div>
              <Label>Remote Connections</Label>
              <Input
                value={newDbRemote}
                onChange={(e) => setNewDbRemote(e.target.value)}
                placeholder="%"
              />
              <p className="text-xs text-muted-foreground mt-1">Use % for any IP</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={createDatabase}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
