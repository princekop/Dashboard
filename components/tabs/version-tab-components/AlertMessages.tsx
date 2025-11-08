import { AlertCircle } from 'lucide-react'

interface WarningAlertProps {}

export function WarningAlert({}: WarningAlertProps) {
  return (
    <div className="p-4 rounded-lg border border-yellow-500/20 bg-yellow-500/10">
      <div className="flex gap-3">
        <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-sm">Warning</p>
          <p className="text-sm text-muted-foreground">
            Changing server software may break existing worlds and plugins. Always create a backup before switching versions.
          </p>
        </div>
      </div>
    </div>
  )
}

interface ErrorAlertProps {
  error: string
}

export function ErrorAlert({ error }: ErrorAlertProps) {
  if (!error) return null

  return (
    <div className="p-4 rounded-lg border border-red-500/20 bg-red-500/10">
      <div className="flex gap-3">
        <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-sm text-red-600">Error</p>
          <p className="text-sm text-red-600/80">{error}</p>
        </div>
      </div>
    </div>
  )
}

interface BedrockNoteProps {}

export function BedrockNote({}: BedrockNoteProps) {
  return (
    <div className="p-4 rounded-lg border border-cyan-500/20 bg-cyan-500/5">
      <div className="flex gap-3">
        <AlertCircle className="h-5 w-5 text-cyan-600 flex-shrink-0" />
        <div className="space-y-1">
          <p className="font-semibold text-sm">Bedrock Edition Note</p>
          <p className="text-sm text-muted-foreground">
            Bedrock Edition allows cross-play with Xbox, PlayStation, Mobile, and Windows 10/11. 
            Default port is 19132 (UDP). Java Edition clients cannot connect to Bedrock servers.
          </p>
        </div>
      </div>
    </div>
  )
}
