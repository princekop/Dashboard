"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ServerAPI, TrashItem } from '@/lib/server-management'
import { TrashItemCard } from './trash-tab-components/TrashItem'
import { BulkActionsBar } from './trash-tab-components/BulkActionsBar'
import { EmptyTrashState } from './trash-tab-components/EmptyTrashState'

interface TrashTabProps {
  serverId: string
}

export function TrashTabRefactored({ serverId }: TrashTabProps) {
  const [trashItems, setTrashItems] = useState<TrashItem[]>([])
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  const api = new ServerAPI(serverId)

  useEffect(() => {
    loadTrashItems()
  }, [serverId])

  const loadTrashItems = async () => {
    setLoading(true)
    try {
      const data = await api.getTrashItems()
      setTrashItems(data.items || [])
    } catch (error) {
      console.error('Failed to load trash:', error)
    } finally {
      setLoading(false)
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
        await api.restoreFromTrash(itemId)
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
        await api.deletePermanently(itemId)
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
      await api.emptyTrash()
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
            <EmptyTrashState />
          ) : (
            <>
              <BulkActionsBar
                selectedCount={selectedItems.size}
                totalCount={trashItems.length}
                onSelectAll={toggleAll}
                onRestore={restoreSelected}
                onDelete={deleteSelected}
                disabled={actionLoading}
              />

              <div className="space-y-2">
                {trashItems.map((item) => (
                  <TrashItemCard
                    key={item.id}
                    item={item}
                    selected={selectedItems.has(item.id)}
                    onToggle={() => toggleItem(item.id)}
                    onRestore={() => restoreItems([item.id])}
                    onDelete={() => {
                      if (confirm(`Permanently delete ${item.name}?`)) {
                        deleteItems([item.id])
                      }
                    }}
                    disabled={actionLoading}
                  />
                ))}
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
