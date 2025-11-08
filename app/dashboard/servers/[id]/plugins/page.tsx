"use client"

import { useParams } from 'next/navigation'
import { ServerManagementLayout } from '@/components/server-management-layout'
import { PluginsTab } from '@/components/tabs/plugins-tab-new'

export default function PluginsPage() {
  const params = useParams()
  const serverId = params.id as string

  return (
    <ServerManagementLayout serverId={serverId}>
      <PluginsTab serverId={serverId} />
    </ServerManagementLayout>
  )
}
