"use client"

import { useParams } from 'next/navigation'
import { ServerManagementLayout } from '@/components/server-management-layout'
import { FileManagerTab } from '@/components/tabs/file-manager-tab-new'

export default function FilesPage() {
  const params = useParams()
  const serverId = params.id as string

  return (
    <ServerManagementLayout serverId={serverId}>
      <FileManagerTab serverId={serverId} />
    </ServerManagementLayout>
  )
}
