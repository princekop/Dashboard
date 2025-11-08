"use client"

import { useParams } from 'next/navigation'
import { ServerManagementLayout } from '@/components/server-management-layout'
import { ModsTab } from '@/components/tabs/mods-tab-new'

export default function ModsPage() {
  const params = useParams()
  const serverId = params.id as string

  return (
    <ServerManagementLayout serverId={serverId}>
      <ModsTab serverId={serverId} />
    </ServerManagementLayout>
  )
}
