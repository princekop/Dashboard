"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Network, Plus, Trash2, ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface Allocation {
  id: number
  ip: string
  port: number
  alias: string | null
  is_default: boolean
}

interface PortsTabProps {
  serverId: string
}

export function PortsTab({ serverId }: PortsTabProps) {
  const [allocations, setAllocations] = useState<Allocation[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadAllocations()
  }, [serverId])

  const loadAllocations = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/servers/${serverId}/allocations`)
      
      if (!res.ok) {
        console.error('Failed to load allocations:', res.status, res.statusText)
        return
      }
      
      const data = await res.json()
      console.log('Raw allocations data:', data)
      
      // Parse Pterodactyl API response format
      const allocationsData = data.data || []
      const parsedAllocations = allocationsData.map((item: any) => ({
        id: item.attributes?.id || item.id,
        ip: item.attributes?.ip || item.ip,
        port: item.attributes?.port || item.port,
        alias: item.attributes?.ip_alias || item.attributes?.alias || item.alias,
        is_default: item.attributes?.is_default || item.is_default
      }))
      
      console.log('Parsed allocations:', parsedAllocations)
      setAllocations(parsedAllocations)
    } catch (error) {
      console.error('Failed to load allocations:', error)
    } finally {
      setLoading(false)
    }
  }

  const createAllocation = async () => {
    try {
      const res = await fetch(`/api/servers/${serverId}/allocations`, {
        method: 'POST'
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        alert(`Failed to create port: ${data.error || 'Unknown error'}`)
        return
      }
      
      alert('Port allocation created successfully!')
      loadAllocations()
    } catch (error) {
      console.error('Failed to create allocation:', error)
      alert('Failed to create port allocation. Please try again.')
    }
  }

  const deleteAllocation = async (allocationId: number) => {
    if (!confirm('Delete this port allocation?')) return
    try {
      const res = await fetch(`/api/servers/${serverId}/allocations?allocationId=${allocationId}`, {
        method: 'DELETE'
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        alert(`Failed to delete port: ${data.error || 'Unknown error'}`)
        return
      }
      
      alert('Port allocation deleted successfully!')
      loadAllocations()
    } catch (error) {
      console.error('Failed to delete allocation:', error)
      alert('Failed to delete port allocation. Please try again.')
    }
  }

  return (
    <div className="space-y-4">
      <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <p className="text-sm text-blue-600 dark:text-blue-400">
          <strong>ℹ️ Port Allocations:</strong> These are the network ports assigned to your server. 
          The ability to add new ports depends on your hosting plan and available IP addresses.
        </p>
      </div>

      <Card className="border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Network className="h-5 w-5 text-primary" />
              Network Ports
              {allocations.length > 0 && (
                <Badge variant="outline">{allocations.length} Port{allocations.length > 1 ? 's' : ''}</Badge>
              )}
            </CardTitle>
            <Button size="sm" onClick={createAllocation} disabled={loading}>
              <Plus className="h-4 w-4 mr-2" />
              Add Port
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading ports...</div>
          ) : allocations.length === 0 ? (
            <div className="text-center py-12">
              <Network className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No port allocations</p>
            </div>
          ) : (
            <div className="space-y-3">
              {allocations.map((allocation, index) => (
                <Card key={`allocation-${allocation.id || index}`} className="border-primary/10">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-semibold text-lg text-primary">
                            {allocation.alias || allocation.ip}:{allocation.port}
                          </span>
                          {allocation.is_default && (
                            <Badge variant="default">Primary</Badge>
                          )}
                        </div>
                        <div className="flex gap-2 text-sm text-muted-foreground flex-wrap">
                          {allocation.alias && (
                            <>
                              <span className="font-semibold text-primary">IP Alias: {allocation.alias}</span>
                              <span>•</span>
                            </>
                          )}
                          <span>IP: {allocation.ip || 'N/A'}</span>
                          <span>•</span>
                          <span>Port: {allocation.port || 'N/A'}</span>
                        </div>
                      </div>
                      {!allocation.is_default && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteAllocation(allocation.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
