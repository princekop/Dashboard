"use client"

import { useEffect, useState } from "react"
import { X, Bell, AlertCircle, CheckCircle, Info, AlertTriangle } from "lucide-react"
import { Button } from "./ui/button"
import { Card, CardContent } from "./ui/card"
import { Badge } from "./ui/badge"

interface Announcement {
  id: string
  title: string
  message: string
  type: string
  priority: number
  createdAt: string
}

export function AnnouncementPopup() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [isVisible, setIsVisible] = useState(false)
  const [dismissedIds, setDismissedIds] = useState<string[]>([])

  useEffect(() => {
    // Load dismissed announcements from localStorage
    const dismissed = localStorage.getItem('dismissedAnnouncements')
    if (dismissed) {
      setDismissedIds(JSON.parse(dismissed))
    }

    // Fetch announcements
    fetch('/api/announcements')
      .then(res => res.json())
      .then(data => {
        const activeAnnouncements = data.announcements || []
        setAnnouncements(activeAnnouncements)
        
        // Show popup if there are new announcements
        const dismissed = localStorage.getItem('dismissedAnnouncements')
        const dismissedList = dismissed ? JSON.parse(dismissed) : []
        const hasNew = activeAnnouncements.some((a: Announcement) => !dismissedList.includes(a.id))
        
        if (hasNew && activeAnnouncements.length > 0) {
          setTimeout(() => setIsVisible(true), 1000)
        }
      })
      .catch(error => console.error('Failed to fetch announcements:', error))
  }, [])

  const handleDismiss = (id: string) => {
    const newDismissed = [...dismissedIds, id]
    setDismissedIds(newDismissed)
    localStorage.setItem('dismissedAnnouncements', JSON.stringify(newDismissed))
    
    // Hide popup if all announcements are dismissed
    const remaining = announcements.filter(a => !newDismissed.includes(a.id))
    if (remaining.length === 0) {
      setIsVisible(false)
    }
  }

  const handleDismissAll = () => {
    const allIds = announcements.map(a => a.id)
    setDismissedIds(allIds)
    localStorage.setItem('dismissedAnnouncements', JSON.stringify(allIds))
    setIsVisible(false)
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <Info className="h-5 w-5 text-blue-500" />
    }
  }

  const getBgClass = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-500/10 border-green-500/20'
      case 'warning':
        return 'bg-yellow-500/10 border-yellow-500/20'
      case 'error':
        return 'bg-red-500/10 border-red-500/20'
      default:
        return 'bg-blue-500/10 border-blue-500/20'
    }
  }

  const visibleAnnouncements = announcements.filter(a => !dismissedIds.includes(a.id))

  if (!isVisible || visibleAnnouncements.length === 0) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md animate-in slide-in-from-bottom-5 duration-500">
      <Card className="shadow-2xl border-2">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <h3 className="font-bold text-lg">Announcements</h3>
              <Badge variant="secondary">{visibleAnnouncements.length}</Badge>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleDismissAll}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {visibleAnnouncements.map((announcement) => (
              <div
                key={announcement.id}
                className={`p-3 rounded-lg border ${getBgClass(announcement.type)}`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getIcon(announcement.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="font-semibold text-sm">{announcement.title}</h4>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 flex-shrink-0"
                        onClick={() => handleDismiss(announcement.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                      {announcement.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(announcement.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {visibleAnnouncements.length > 1 && (
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-3"
              onClick={handleDismissAll}
            >
              Dismiss All
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
