"use client"

import { useParams } from 'next/navigation'
import { ServerManagementLayout } from '@/components/server-management-layout'
import { BotControllerTab } from '@/components/tabs/bot-controller-tab'

export default function BotsPage() {
  const params = useParams()
  const serverId = params.id as string

  return (
    <ServerManagementLayout serverId={serverId}>
      <BotControllerTab serverId={serverId} />
    </ServerManagementLayout>
  )
}
