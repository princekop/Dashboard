"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { UserCheck, UserX, Shield } from "lucide-react"
import { useState, useEffect } from "react"

interface User {
  id: string
  name: string | null
  email: string
  isAdmin: boolean
  createdAt: string
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users')
      const data = await res.json()
      setUsers(data.users || [])
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleAdmin = async (userId: string, currentStatus: boolean) => {
    if (!confirm(`${currentStatus ? 'Remove' : 'Grant'} admin access for this user?`)) return

    try {
      await fetch(`/api/admin/users/${userId}/toggle-admin`, {
        method: 'POST'
      })
      fetchUsers()
    } catch (error) {
      console.error('Failed to toggle admin:', error)
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Manage Users</h1>
        <p className="text-muted-foreground">
          View and manage user accounts and permissions
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      ) : (
        <div className="grid gap-4">
          {users.map((user) => (
            <Card key={user.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{user.name || 'No Name'}</CardTitle>
                    <CardDescription>{user.email}</CardDescription>
                  </div>
                  <Badge variant={user.isAdmin ? "default" : "secondary"}>
                    {user.isAdmin ? (
                      <><Shield className="h-3 w-3 mr-1" /> Admin</>
                    ) : (
                      'User'
                    )}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Joined {new Date(user.createdAt).toLocaleDateString()}
                  </div>
                  <Button
                    variant={user.isAdmin ? "destructive" : "default"}
                    size="sm"
                    onClick={() => toggleAdmin(user.id, user.isAdmin)}
                  >
                    {user.isAdmin ? (
                      <><UserX className="h-4 w-4 mr-2" /> Remove Admin</>
                    ) : (
                      <><UserCheck className="h-4 w-4 mr-2" /> Make Admin</>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
