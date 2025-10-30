"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Edit2, Save, X, Bell, CheckCircle } from "lucide-react"
import { toast } from "sonner"

interface Announcement {
  id: string
  title: string
  message: string
  type: string
  priority: number
  isActive: boolean
  createdAt: string
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info',
    priority: '0',
    isActive: true
  })

  useEffect(() => {
    fetchAnnouncements()
  }, [])

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch('/api/admin/announcements')
      const data = await res.json()
      setAnnouncements(data.announcements || [])
    } catch (error) {
      console.error('Failed to fetch announcements:', error)
      toast.error('Failed to load announcements')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = editingId 
        ? `/api/admin/announcements/${editingId}`
        : '/api/admin/announcements'
      
      const res = await fetch(url, {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          priority: parseInt(formData.priority)
        })
      })

      if (res.ok) {
        toast.success(editingId ? 'Announcement updated!' : 'Announcement created!')
        resetForm()
        fetchAnnouncements()
      } else {
        toast.error('Failed to save announcement')
      }
    } catch (error) {
      console.error('Failed to save announcement:', error)
      toast.error('Failed to save announcement')
    }
  }

  const handleEdit = (announcement: Announcement) => {
    setEditingId(announcement.id)
    setFormData({
      title: announcement.title,
      message: announcement.message,
      type: announcement.type,
      priority: announcement.priority.toString(),
      isActive: announcement.isActive
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return

    try {
      const res = await fetch(`/api/admin/announcements/${id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        toast.success('Announcement deleted!')
        fetchAnnouncements()
      } else {
        toast.error('Failed to delete announcement')
      }
    } catch (error) {
      console.error('Failed to delete announcement:', error)
      toast.error('Failed to delete announcement')
    }
  }

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/admin/announcements/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus })
      })

      if (res.ok) {
        toast.success(`Announcement ${!currentStatus ? 'activated' : 'deactivated'}!`)
        fetchAnnouncements()
      } else {
        toast.error('Failed to update announcement')
      }
    } catch (error) {
      console.error('Failed to update announcement:', error)
      toast.error('Failed to update announcement')
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      message: '',
      type: 'info',
      priority: '0',
      isActive: true
    })
    setEditingId(null)
    setShowForm(false)
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-500'
      case 'warning': return 'bg-yellow-500'
      case 'error': return 'bg-red-500'
      default: return 'bg-blue-500'
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Announcements</h1>
          <p className="text-muted-foreground">Manage system-wide announcements and updates</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? <X className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
          {showForm ? 'Cancel' : 'New Announcement'}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Announcement' : 'Create New Announcement'}</CardTitle>
            <CardDescription>
              Share important updates with your users
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., System Maintenance"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message *</Label>
                <Textarea
                  id="message"
                  placeholder="Enter announcement details..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="success">Success</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Input
                    id="priority"
                    type="number"
                    placeholder="0"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">Higher = More Important</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4"
                />
                <Label htmlFor="isActive" className="cursor-pointer">Active (visible to users)</Label>
              </div>

              <div className="flex gap-2">
                <Button type="submit">
                  <Save className="h-4 w-4 mr-2" />
                  {editingId ? 'Update' : 'Create'} Announcement
                </Button>
                {editingId && (
                  <Button type="button" variant="outline" onClick={resetForm}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel Edit
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center p-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      ) : announcements.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Bell className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-lg font-semibold">No announcements yet</p>
            <p className="text-sm text-muted-foreground">Create your first announcement to get started</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <Card key={announcement.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className={`w-1 h-full rounded-full ${getTypeColor(announcement.type)}`} />
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{announcement.title}</h3>
                        <Badge variant={announcement.isActive ? "default" : "secondary"}>
                          {announcement.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        <Badge variant="outline" className="capitalize">
                          {announcement.type}
                        </Badge>
                        {announcement.priority > 0 && (
                          <Badge variant="destructive">Priority: {announcement.priority}</Badge>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => toggleActive(announcement.id, announcement.isActive)}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEdit(announcement)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="text-destructive"
                          onClick={() => handleDelete(announcement.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap mb-2">
                      {announcement.message}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Created: {new Date(announcement.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
