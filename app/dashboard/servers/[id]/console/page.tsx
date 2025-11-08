"use client"

import { useParams } from 'next/navigation'
import { ServerManagementLayout } from '@/components/server-management-layout'
import { ConsoleTabEnhanced } from '@/components/tabs/console-tab-enhanced'
import { useState, useEffect } from 'react'

export default function ConsolePage() {
  const params = useParams()
  const serverId = params.id as string
  const [serverIdentifier, setServerIdentifier] = useState('')

  useEffect(() => {
    const fetchServerInfo = async () => {
      try {
        const res = await fetch(`/api/servers/${serverId}/info`)
        const data = await res.json()
        if (res.ok) {
          setServerIdentifier(data.pterodactylIdentifier || '')
        }
      } catch (error) {
        console.error('Failed to load server info:', error)
      }
    }
    fetchServerInfo()
  }, [serverId])

  return (
    <ServerManagementLayout serverId={serverId}>
      <ConsoleTabEnhanced serverId={serverId} serverIdentifier={serverIdentifier} />
    </ServerManagementLayout>
  )
}
