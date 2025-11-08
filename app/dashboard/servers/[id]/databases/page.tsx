"use client"

import { useParams } from 'next/navigation'
import { ServerManagementLayout } from '@/components/server-management-layout'
import { DatabaseTab } from '@/components/tabs/database-tab'

export default function DatabasesPage() {
  const params = useParams()
  const serverId = params.id as string

  return (
    <ServerManagementLayout serverId={serverId}>
      <DatabaseTab serverId={serverId} />
    </ServerManagementLayout>
  )
}
