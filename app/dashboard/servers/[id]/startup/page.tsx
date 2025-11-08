"use client"

import { useParams } from 'next/navigation'
import { ServerManagementLayout } from '@/components/server-management-layout'
import { StartupTab } from '@/components/tabs/startup-tab'

export default function StartupPage() {
  const params = useParams()
  const serverId = params.id as string

  return (
    <ServerManagementLayout serverId={serverId}>
      <StartupTab serverId={serverId} />
    </ServerManagementLayout>
  )
}
