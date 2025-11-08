"use client"

import { useParams } from 'next/navigation'
import { ServerManagementLayout } from '@/components/server-management-layout'
import { TrashTabRefactored } from '@/components/tabs/trash-tab-refactored'

export default function TrashPage() {
  const params = useParams()
  const serverId = params.id as string

  return (
    <ServerManagementLayout serverId={serverId}>
      <TrashTabRefactored serverId={serverId} />
    </ServerManagementLayout>
  )
}
