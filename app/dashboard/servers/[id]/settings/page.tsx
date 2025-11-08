"use client"

import { useParams } from 'next/navigation'
import { ServerManagementLayout } from '@/components/server-management-layout'
import { SettingsTab } from '@/components/tabs/settings-tab'

export default function SettingsPage() {
  const params = useParams()
  const serverId = params.id as string

  return (
    <ServerManagementLayout serverId={serverId}>
      <SettingsTab serverId={serverId} />
    </ServerManagementLayout>
  )
}
