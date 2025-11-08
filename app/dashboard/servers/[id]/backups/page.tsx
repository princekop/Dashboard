"use client"

import { useParams } from 'next/navigation'
import { ServerManagementLayout } from '@/components/server-management-layout'
import { BackupsTab } from '@/components/tabs/backups-tab'

export default function BackupsPage() {
  const params = useParams()
  const serverId = params.id as string

  return (
    <ServerManagementLayout serverId={serverId}>
      <BackupsTab serverId={serverId} />
    </ServerManagementLayout>
  )
}
