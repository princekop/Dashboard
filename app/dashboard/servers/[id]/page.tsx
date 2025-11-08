"use client"

import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

export default function ServerManagePage() {
  const router = useRouter()
  const params = useParams()
  const serverId = params.id as string

  useEffect(() => {
    // Redirect to console page
    router.replace(`/dashboard/servers/${serverId}/console`)
  }, [serverId, router])

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
    </div>
  )
}
