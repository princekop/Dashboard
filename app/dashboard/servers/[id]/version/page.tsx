"use client"

import { useParams } from 'next/navigation'
import { ServerManagementLayout } from '@/components/server-management-layout'
import { VersionTabRefactored } from '@/components/tabs/version-tab-refactored'

export default function VersionPage() {
  const params = useParams()
  const serverId = params.id as string

  return (
    <ServerManagementLayout serverId={serverId}>
      <VersionTabRefactored serverId={serverId} />
    </ServerManagementLayout>
  )
}
