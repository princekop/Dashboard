"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Trash2, RotateCcw, X, AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface TrashItem {
  id: string
  name: string
  type: 'file' | 'folder' | 'plugin' | 'mod'
  path: string
  deletedAt: Date
  size: number
}

interface TrashTabProps {
  serverId: string
}

export function TrashTab({ serverId }: TrashTabProps) {
  const [trashItems, setTrashItems] = useState<TrashItem[]>([])
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
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

  const restoreSelected = async () => {
    if (selectedItems.size === 0) return
    if (!confirm(`Restore ${selectedItems.size} item(s)?`)) return
    
    // Implement restore logic
    setTrashItems(prev => prev.filter(item => !selectedItems.has(item.id)))
    setSelectedItems(new Set())
  }

  const deleteSelected = async () => {
    if (selectedItems.size === 0) return
    if (!confirm(`Permanently delete ${selectedItems.size} item(s)? This cannot be undone.`)) return
    
    // Implement permanent delete logic
    setTrashItems(prev => prev.filter(item => !selectedItems.has(item.id)))
    setSelectedItems(new Set())
  }

  const emptyTrash = async () => {
    if (!confirm('Empty trash? All items will be permanently deleted. This cannot be undone.')) return
    
    setTrashItems([])
    setSelectedItems(new Set())
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'file': return 'bg-blue-500'
      case 'folder': return 'bg-yellow-500'
      case 'plugin': return 'bg-purple-500'
      case 'mod': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="space-y-4">
      <Card className="border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-primary" />
                Trash Bin
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Items are kept for 30 days before permanent deletion
              </p>
            </div>
            {trashItems.length > 0 && (
              <Button size="sm" variant="destructive" onClick={emptyTrash}>
                <Trash2 className="h-4 w-4 mr-2" />
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
                Deleted items will appear here
              </p>
            </div>
          ) : (
            <>
              {selectedItems.size > 0 && (
                <div className="mb-4 p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="default">{selectedItems.size} selected</Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={restoreSelected}>
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Restore
                      </Button>
                      <Button size="sm" variant="destructive" onClick={deleteSelected}>
                        <X className="h-4 w-4 mr-2" />
                        Delete Forever
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {trashItems.map((item) => (
                  <Card
                    key={item.id}
                    className={`border-primary/10 cursor-pointer transition-colors ${
                      selectedItems.has(item.id) ? 'bg-primary/5 border-primary/30' : ''
                    }`}
                    onClick={() => toggleItem(item.id)}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <div className={`w-2 h-2 rounded-full ${getTypeColor(item.type)}`} />
                          <div className="space-y-1 flex-1">
                            <h3 className="font-semibold">{item.name}</h3>
                            <div className="flex gap-4 text-sm text-muted-foreground">
                              <span>{item.path}</span>
                              <span>•</span>
                              <span>{formatSize(item.size)}</span>
                              <span>•</span>
                              <span>Deleted {formatDate(item.deletedAt)}</span>
                            </div>
                          </div>
                        </div>
                        <Badge variant="secondary" className="capitalize">
                          {item.type}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="border-yellow-500/20 bg-yellow-500/5">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
            <div className="space-y-1">
              <p className="font-semibold text-sm">Note</p>
              <p className="text-sm text-muted-foreground">
                This is a simulated trash bin. In production, deleted items would be moved here temporarily before permanent deletion.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
