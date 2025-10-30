"use client"

import { useAuth } from "./auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export function AdminCheck({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    console.log('AdminCheck - User:', user, 'Loading:', loading, 'isAdmin:', user?.isAdmin)
    if (!loading && (!user || !user.isAdmin)) {
      console.log('Redirecting to dashboard - not admin')
      router.push("/dashboard")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  if (!user || !user.isAdmin) {
    console.log('AdminCheck failed - User:', user?.email, 'isAdmin:', user?.isAdmin)
    return null
  }

  return <>{children}</>
}
