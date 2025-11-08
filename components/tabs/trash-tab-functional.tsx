"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Trash2, RotateCcw, X, AlertTriangle, Loader2, File, Folder, Package, Box } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'

interface TrashItem {
  id: string
  name: string
  type: 'file' | 'folder' | 'plugin' | 'mod'
  path: string
  deletedAt: string
  size: number
}

interface TrashTabProps {
  serverId: string
}

export function TrashTabFunctional({ serverId }: TrashTabProps) {
  const [trashItems, setTrashItems] = useState<TrashItem[]>([])
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    loadTrashItems()
  }, [serverId])

  const loadTrashItems = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/servers/${serverId}/trash`)
      if (res.ok) {
        const data = await res.json()
        setTrashItems(data.items || [])
      }
    } catch (error) {
      console.error('Failed to load trash:', error)
    } finally {
      setLoading(false)
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
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) {
      return 'Today'
    } else if (diffDays === 1) {
      return 'Yesterday'
    } else if (diffDays < 7) {
      return `${diffDays} days ago`
    } else {
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date)
    }
  }

  const toggleItem = (id: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const toggleAll = () => {
    if (selectedItems.size === trashItems.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(trashItems.map(item => item.id)))
    }
  }

  const restoreItems = async (itemIds: string[]) => {
    setActionLoading(true)
    try {
      for (const itemId of itemIds) {
        await fetch(`/api/servers/${serverId}/trash?itemId=${itemId}`, {
          method: 'PUT'
        })
      }
      await loadTrashItems()
      setSelectedItems(new Set())
      alert(`Restored ${itemIds.length} item(s) successfully`)
    } catch (error) {
      console.error('Failed to restore items:', error)
      alert('Failed to restore items')
    } finally {
      setActionLoading(false)
    }
  }

  const deleteItems = async (itemIds: string[]) => {
    setActionLoading(true)
    try {
      for (const itemId of itemIds) {
        await fetch(`/api/servers/${serverId}/trash?itemId=${itemId}`, {
          method: 'DELETE'
        })
      }
      await loadTrashItems()
      setSelectedItems(new Set())
      alert(`Permanently deleted ${itemIds.length} item(s)`)
    } catch (error) {
      console.error('Failed to delete items:', error)
      alert('Failed to delete items')
    } finally {
      setActionLoading(false)
    }
  }

  const restoreSelected = async () => {
    if (selectedItems.size === 0) return
    if (!confirm(`Restore ${selectedItems.size} item(s)?`)) return
    await restoreItems(Array.from(selectedItems))
  }

  const deleteSelected = async () => {
    if (selectedItems.size === 0) return
    if (!confirm(`Permanently delete ${selectedItems.size} item(s)? This cannot be undone.`)) return
    await deleteItems(Array.from(selectedItems))
  }

  const emptyTrash = async () => {
    if (trashItems.length === 0) return
    if (!confirm('Empty trash? All items will be permanently deleted. This cannot be undone.')) return
    
    setActionLoading(true)
    try {
      await fetch(`/api/servers/${serverId}/trash?emptyAll=true`, {
        method: 'DELETE'
      })
      await loadTrashItems()
      setSelectedItems(new Set())
      alert('Trash emptied successfully')
    } catch (error) {
      console.error('Failed to empty trash:', error)
      alert('Failed to empty trash')
    } finally {
      setActionLoading(false)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'file': return File
      case 'folder': return Folder
      case 'plugin': return Package
      case 'mod': return Box
      default: return File
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'file': return 'text-blue-500'
      case 'folder': return 'text-yellow-500'
      case 'plugin': return 'text-purple-500'
      case 'mod': return 'text-green-500'
      default: return 'text-gray-500'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-4 p-6">
      <Card className="border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-primary" />
                Trash Bin
                {trashItems.length > 0 && (
                  <Badge variant="secondary">{trashItems.length} items</Badge>
                )}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Items are kept for 30 days before automatic deletion
              </p>
            </div>
            {trashItems.length > 0 && (
              <Button 
                size="sm" 
                variant="destructive" 
                onClick={emptyTrash}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Empty Trash
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {trashItems.length === 0 ? (
            <div className="text-center py-16">
              <Trash2 className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
              <p className="text-lg font-semibold mb-2">Trash is empty</p>
              <p className="text-sm text-muted-foreground">
                Deleted items will appear here and can be restored within 30 days
              </p>
            </div>
          ) : (
            <>
              {/* Bulk Actions Bar */}
              <div className="mb-4 p-4 rounded-lg bg-muted/50 border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={selectedItems.size === trashItems.length && trashItems.length > 0}
                      onCheckedChange={toggleAll}
                    />
                    <span className="text-sm font-medium">
                      {selectedItems.size > 0 
                        ? `${selectedItems.size} selected` 
                        : 'Select all'}
                    </span>
                  </div>
                  {selectedItems.size > 0 && (
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={restoreSelected}
                        disabled={actionLoading}
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Restore ({selectedItems.size})
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive" 
                        onClick={deleteSelected}
                        disabled={actionLoading}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Delete Forever ({selectedItems.size})
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Trash Items List */}
              <div className="space-y-2">
                {trashItems.map((item) => {
                  const TypeIcon = getTypeIcon(item.type)
                  const typeColor = getTypeColor(item.type)
                  
                  return (
                    <Card
                      key={item.id}
                      className={`border-primary/10 transition-all ${
                        selectedItems.has(item.id) ? 'bg-primary/5 border-primary/30 ring-1 ring-primary/20' : 'hover:bg-muted/50'
                      }`}
                    >
                      <CardContent className="pt-4 pb-4">
                        <div className="flex items-center gap-4">
                          <Checkbox
                            checked={selectedItems.has(item.id)}
                            onCheckedChange={() => toggleItem(item.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <TypeIcon className={`h-5 w-5 flex-shrink-0 ${typeColor}`} />
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold truncate">{item.name}</h3>
                              <div className="flex gap-3 text-sm text-muted-foreground mt-1">
                                <span className="truncate">{item.path}</span>
                                <span className="flex-shrink-0">•</span>
                                <span className="flex-shrink-0">{formatSize(item.size)}</span>
                                <span className="flex-shrink-0">•</span>
                                <span className="flex-shrink-0">{formatDate(item.deletedAt)}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Badge variant="secondary" className="capitalize">
                              {item.type}
                            </Badge>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => restoreItems([item.id])}
                              disabled={actionLoading}
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                if (confirm(`Permanently delete ${item.name}?`)) {
                                  deleteItems([item.id])
                                }
                              }}
                              disabled={actionLoading}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="border-yellow-500/20 bg-yellow-500/5">
        <CardContent className="pt-6 pb-6">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
            <div className="space-y-1">
              <p className="font-semibold text-sm">Automatic Cleanup</p>
              <p className="text-sm text-muted-foreground">
                Items in trash are automatically deleted after 30 days. Make sure to restore important files before they expire.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
