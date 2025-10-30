"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Server, ExternalLink, Trash2, Ban, Play, AlertTriangle } from "lucide-react"
import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

interface AdminServer {
  id: string
  name: string
  status: string
  expiresAt: string
  userId: string
  user: {
    name: string | null
    email: string
  }
  product: {
    name: string
    ram: number
    cpu: number
    storage: number
  }
  pterodactylId: number | null
  pterodactylIdentifier: string | null
  createdAt: string
}

export default function AdminServicesPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [servers, setServers] = useState<AdminServer[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedServer, setSelectedServer] = useState<AdminServer | null>(null)
  const [actionDialog, setActionDialog] = useState<'suspend' | 'unsuspend' | 'delete' | null>(null)
  const [processing, setProcessing] = useState(false)
  const [pteroSettings, setPteroSettings] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    if (!authLoading && !user?.isAdmin) {
      router.push('/dashboard')
    } else if (user?.isAdmin) {
      fetchServers()
      fetchPteroSettings()
    }
  }, [user, authLoading, router])

  const fetchServers = async () => {
    try {
      const res = await fetch('/api/admin/services')
      const data = await res.json()
      setServers(data.servers || [])
    } catch (error) {
      console.error('Failed to fetch servers:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPteroSettings = async () => {
    try {
      const res = await fetch('/api/admin/pterodactyl/settings')
      const data = await res.json()
      if (data.settings) {
        setPteroSettings(data.settings)
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    }
  }

  const handleAction = async () => {
    if (!selectedServer || !actionDialog) return

    setProcessing(true)
    try {
      const endpoint = actionDialog === 'delete' 
        ? `/api/admin/services/${selectedServer.id}/delete`
        : `/api/admin/services/${selectedServer.id}/${actionDialog}`

      const res = await fetch(endpoint, {
        method: 'POST'
      })

      if (res.ok) {
        await fetchServers()
        setActionDialog(null)
        setSelectedServer(null)
      } else {
        const data = await res.json()
        alert(`Failed: ${data.error}`)
      }
    } catch (error) {
      console.error('Failed to perform action:', error)
      alert('Operation failed')
    } finally {
      setProcessing(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500'
      case 'suspended': return 'bg-yellow-500'
      case 'terminated': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getDaysRemaining = (expiresAt: string) => {
    const days = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return Math.max(0, days)
  }

  const filteredServers = servers.filter(server => 
    server.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    server.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    server.user.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="flex flex-1 flex-col gap-6 p-6">
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-bold tracking-tight">Service Management</h1>
              <p className="text-muted-foreground">
                Manage all user servers and services
              </p>
            </div>

            <div className="flex gap-2">
              <Input 
                placeholder="Search by server name, user email, or name..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle>All Services ({filteredServers.length})</CardTitle>
                <CardDescription>View and manage user servers</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Server Name</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Resources</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredServers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No servers found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredServers.map((server) => (
                        <TableRow key={server.id}>
                          <TableCell className="font-medium">{server.name}</TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{server.user.name || 'N/A'}</span>
                              <span className="text-xs text-muted-foreground">{server.user.email}</span>
                            </div>
                          </TableCell>
                          <TableCell>{server.product.name}</TableCell>
                          <TableCell>
                            <div className="text-xs">
                              {server.product.ram}GB RAM • {server.product.cpu} CPU • {server.product.storage}GB
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(server.status)}>
                              {server.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col text-xs">
                              <span>{new Date(server.expiresAt).toLocaleDateString()}</span>
                              <span className="text-muted-foreground">
                                {getDaysRemaining(server.expiresAt)} days left
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {server.pterodactylIdentifier && pteroSettings && (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  asChild
                                >
                                  <a 
                                    href={`${pteroSettings.panelUrl}/server/${server.pterodactylIdentifier}`} 
                                    target="_blank" 
                                    rel="noopener"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                </Button>
                              )}
                              {server.status === 'active' && (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedServer(server)
                                    setActionDialog('suspend')
                                  }}
                                >
                                  <Ban className="h-3 w-3" />
                                </Button>
                              )}
                              {server.status === 'suspended' && (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedServer(server)
                                    setActionDialog('unsuspend')
                                  }}
                                >
                                  <Play className="h-3 w-3" />
                                </Button>
                              )}
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  setSelectedServer(server)
                                  setActionDialog('delete')
                                }}
                              >
                                <Trash2 className="h-3 w-3 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>

      {/* Action Confirmation Dialog */}
      <Dialog open={actionDialog !== null} onOpenChange={() => {
        setActionDialog(null)
        setSelectedServer(null)
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Confirm {actionDialog === 'delete' ? 'Delete' : actionDialog === 'suspend' ? 'Suspend' : 'Unsuspend'}
            </DialogTitle>
            <DialogDescription>
              {actionDialog === 'delete' && 'This will permanently delete the server from both the database and Pterodactyl panel.'}
              {actionDialog === 'suspend' && 'This will suspend the server on the Pterodactyl panel.'}
              {actionDialog === 'unsuspend' && 'This will unsuspend the server on the Pterodactyl panel.'}
            </DialogDescription>
          </DialogHeader>
          {selectedServer && (
            <div className="space-y-2">
              <p className="text-sm">
                <span className="font-medium">Server:</span> {selectedServer.name}
              </p>
              <p className="text-sm">
                <span className="font-medium">User:</span> {selectedServer.user.email}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setActionDialog(null)
              setSelectedServer(null)
            }}>
              Cancel
            </Button>
            <Button 
              variant={actionDialog === 'delete' ? 'destructive' : 'default'}
              onClick={handleAction}
              disabled={processing}
            >
              {processing ? 'Processing...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  )
}
