"use client"

import { useParams } from 'next/navigation'
import { ServerManagementLayout } from '@/components/server-management-layout'
import { PortsTab } from '@/components/tabs/ports-tab'

export default function PortsPage() {
  const params = useParams()
  const serverId = params.id as string

  return (
    <ServerManagementLayout serverId={serverId}>
      <PortsTab serverId={serverId} />
    </ServerManagementLayout>
  )
}
