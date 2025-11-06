"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useAuth } from "@/lib/auth-context"
import { useEffect, useState } from "react"
import { 
  UserCircle, 
  Mail, 
  Calendar, 
  Shield, 
  Upload, 
  Check,
  Sparkles,
  Lock,
  Save,
  Image as ImageIcon,
  X,
  Code,
  Terminal as TerminalIcon
} from "lucide-react"
import { toast } from "sonner"

export default function AccountPage() {
  const { user } = useAuth()
  const [avatar, setAvatar] = useState<string>("")
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState(user?.name || "")
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)
  const [devMode, setDevMode] = useState(user?.devMode || false)

  // Default avatars
  const defaultAvatars = [
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Precious",
    "https://api.dicebear.com/7.x/bottts/svg?seed=Dusty",
    "https://api.dicebear.com/7.x/bottts/svg?seed=Luna",
    "https://api.dicebear.com/7.x/bottts/svg?seed=Max",
    "https://api.dicebear.com/7.x/personas/svg?seed=Oliver",
    "https://api.dicebear.com/7.x/personas/svg?seed=Emma",
    "https://api.dicebear.com/7.x/lorelei/svg?seed=Sammy",
    "https://api.dicebear.com/7.x/lorelei/svg?seed=Charlie",
    "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Happy",
    "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Cool",
  ]

  useEffect(() => {
    if (user) {
      fetchUserProfile()
    }
  }, [user])

  const fetchUserProfile = async () => {
    try {
      const res = await fetch('/api/user/profile')
      const data = await res.json()
      if (data.avatar) {
        setAvatar(data.avatar)
      }
      if (data.name) {
        setName(data.name)
      }
      if (data.devMode !== undefined) {
        setDevMode(data.devMode)
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error)
    }
  }

  const toggleDevMode = async () => {
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ devMode: !devMode }),
      })

      if (res.ok) {
        setDevMode(!devMode)
        toast.success(`Developer Mode ${!devMode ? 'enabled' : 'disabled'}!`)
        setTimeout(() => window.location.reload(), 1000)
      } else {
        toast.error('Failed to toggle developer mode')
      }
    } catch (error) {
      toast.error('Failed to toggle developer mode')
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB')
      return
    }

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('avatar', file)

      const res = await fetch('/api/user/avatar', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (res.ok) {
        setAvatar(data.avatarUrl)
        toast.success('Avatar updated successfully!')
        setTimeout(() => window.location.reload(), 1000)
      } else {
        toast.error(data.error || 'Failed to upload avatar')
      }
    } catch (error) {
      console.error('Avatar upload error:', error)
      toast.error('Failed to upload avatar')
    } finally {
      setUploading(false)
    }
  }

  const selectDefaultAvatar = async (avatarUrl: string) => {
    setUploading(true)
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar: avatarUrl }),
      })

      if (res.ok) {
        setAvatar(avatarUrl)
        setShowAvatarPicker(false)
        toast.success('Avatar updated successfully!')
        setTimeout(() => window.location.reload(), 1000)
      } else {
        toast.error('Failed to update avatar')
      }
    } catch (error) {
      toast.error('Failed to update avatar')
    } finally {
      setUploading(false)
    }
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })

      if (res.ok) {
        toast.success('Profile updated successfully!')
      } else {
        toast.error('Failed to update profile')
      }
    } catch (error) {
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  const joinedDate = user.createdAt 
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : 'Recently'

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="flex flex-1 flex-col gap-6 p-6">
            {/* Header with Glass Effect */}
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 backdrop-blur-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-purple-600/5 to-pink-600/5"></div>
              <div className="relative p-8">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-6">
                    {/* Avatar with Glass Border */}
                    <div className="relative group">
                      <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full opacity-75 group-hover:opacity-100 blur transition duration-200"></div>
                      <div className="relative">
                        <Avatar className="h-24 w-24 ring-4 ring-background">
                          <AvatarImage src={avatar || undefined} alt={user.name || "User"} />
                          <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-blue-600 to-purple-600 text-white">
                            {(user.name || user.email).charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <Button
                          onClick={() => setShowAvatarPicker(true)}
                          className="absolute bottom-0 right-0 p-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-full h-10 w-10"
                          disabled={uploading}
                        >
                          {uploading ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                          ) : (
                            <Upload className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                          {user.name || "User"}
                        </h1>
                        {user.isAdmin && (
                          <Badge className="bg-gradient-to-r from-amber-500 to-orange-600 border-0">
                            <Shield className="h-3 w-3 mr-1" />
                            Admin
                          </Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {user.email}
                      </p>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Joined {joinedDate}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
                      <Sparkles className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Profile Information Card with Glass Effect */}
              <Card className="relative overflow-hidden border-white/10 bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-purple-600/5"></div>
                <CardHeader className="relative">
                  <CardTitle className="flex items-center gap-2">
                    <UserCircle className="h-5 w-5" />
                    Profile Information
                  </CardTitle>
                  <CardDescription>
                    Update your personal information
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Display Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your name"
                      className="bg-background/50 backdrop-blur-sm border-white/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      value={user.email}
                      disabled
                      className="bg-background/30 backdrop-blur-sm border-white/10"
                    />
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Lock className="h-3 w-3" />
                      Email cannot be changed
                    </p>
                  </div>

                  <Button 
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    {saving ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Account Stats Card with Glass Effect */}
              <Card className="relative overflow-hidden border-white/10 bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 to-pink-600/5"></div>
                <CardHeader className="relative">
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    Account Status
                  </CardTitle>
                  <CardDescription>
                    Your account information and privileges
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 backdrop-blur-sm border border-white/10">
                      <span className="text-sm text-muted-foreground">Account Type</span>
                      <Badge variant={user.isAdmin ? "default" : "secondary"} className="font-semibold">
                        {user.isAdmin ? "Administrator" : "Customer"}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 backdrop-blur-sm border border-white/10">
                      <span className="text-sm text-muted-foreground">Email Verified</span>
                      <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                        <Check className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 backdrop-blur-sm border border-white/10">
                      <span className="text-sm text-muted-foreground">Account Status</span>
                      <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-700">
                        Active
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 backdrop-blur-sm border border-white/10">
                      <span className="text-sm text-muted-foreground">Profile Photo</span>
                      <Badge variant={avatar ? "default" : "secondary"}>
                        {avatar ? "Uploaded" : "Not Set"}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                      <div className="flex items-center gap-2">
                        <Code className="h-4 w-4 text-purple-500" />
                        <span className="text-sm font-medium">Developer Mode</span>
                      </div>
                      <Button
                        size="sm"
                        variant={devMode ? "default" : "outline"}
                        onClick={toggleDevMode}
                        className={devMode ? "bg-purple-600 hover:bg-purple-700" : ""}
                      >
                        {devMode ? "Enabled" : "Disabled"}
                      </Button>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/10">
                    <div className="p-4 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20">
                      <p className="text-sm font-medium mb-1">🎉 Premium Member</p>
                      <p className="text-xs text-muted-foreground">
                        Thank you for being part of DarkByte Premium!
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Security Notice with Glass Effect */}
            <Card className="relative overflow-hidden border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-orange-500/5 backdrop-blur-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-600/5 to-orange-600/5"></div>
              <CardContent className="relative p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-amber-500/20 rounded-lg">
                    <Lock className="h-5 w-5 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">Security & Privacy</h3>
                    <p className="text-sm text-muted-foreground">
                      Your profile photo is securely stored and protected. Only you can change your avatar and personal information. 
                      We never share your data with third parties.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>

      {/* Avatar Picker Dialog */}
      <Dialog open={showAvatarPicker} onOpenChange={setShowAvatarPicker}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Choose Avatar</DialogTitle>
            <DialogDescription>
              Select a default avatar or upload your own image
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Upload Custom Avatar */}
            <div className="space-y-2">
              <Label htmlFor="custom-avatar-upload" className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Upload Custom Avatar
              </Label>
              <div className="flex gap-2">
                <Input
                  id="custom-avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  disabled={uploading}
                  className="cursor-pointer"
                />
              </div>
              <p className="text-xs text-muted-foreground">Max size: 5MB. Supports JPG, PNG, GIF</p>
            </div>

            {/* Default Avatars Grid */}
            <div className="space-y-2">
              <Label>Or Choose a Default Avatar</Label>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                {defaultAvatars.map((avatarUrl, index) => (
                  <button
                    key={index}
                    onClick={() => selectDefaultAvatar(avatarUrl)}
                    disabled={uploading}
                    className="relative group"
                  >
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full opacity-0 group-hover:opacity-75 blur transition duration-200"></div>
                    <Avatar className="h-16 w-16 ring-2 ring-background cursor-pointer hover:ring-4 hover:ring-primary transition-all">
                      <AvatarImage src={avatarUrl} alt={`Avatar ${index + 1}`} />
                    </Avatar>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  )
}
