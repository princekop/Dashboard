import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

interface VersionSelectorProps {
  versions: string[]
  selectedVersion: string
  onSelect: (version: string) => void
  loading?: boolean
  serverType: string
}

export function VersionSelector({ 
  versions, 
  selectedVersion, 
  onSelect, 
  loading,
  serverType
}: VersionSelectorProps) {
  return (
    <div className="space-y-3">
      <Label>Minecraft Version</Label>
      <Select value={selectedVersion} onValueChange={onSelect} disabled={loading}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={loading ? "Loading versions..." : "Select version"} />
        </SelectTrigger>
        <SelectContent className="max-h-[300px]">
          {versions.map((version, idx) => (
            <SelectItem key={`${version}-${idx}`} value={version}>
              {serverType === 'bedrock' ? 'Bedrock ' : 'Minecraft '}{version}
              {idx === 0 && <Badge className="ml-2 text-[10px]">Latest</Badge>}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
