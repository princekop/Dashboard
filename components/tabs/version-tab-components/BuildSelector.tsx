import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

interface BuildSelectorProps {
  builds: any[]
  selectedBuild: string
  onSelect: (build: string) => void
  loading?: boolean
  serverType: string
  disabled?: boolean
}

export function BuildSelector({ 
  builds, 
  selectedBuild, 
  onSelect, 
  loading,
  serverType,
  disabled
}: BuildSelectorProps) {
  return (
    <div className="space-y-3">
      <Label>
        {serverType === 'fabric' ? 'Fabric Loader Version' : 'Build Number'}
      </Label>
      <Select value={selectedBuild} onValueChange={onSelect} disabled={loading || disabled}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={loading ? "Loading..." : "Select build"} />
        </SelectTrigger>
        <SelectContent className="max-h-[300px]">
          {builds.map((build, idx) => {
            const buildValue = typeof build === 'object' ? build.version : build.toString()
            return (
              <SelectItem key={`${buildValue}-${idx}`} value={buildValue}>
                {serverType === 'fabric' ? `Loader ${buildValue}` : `Build #${buildValue}`}
                {idx === 0 && <Badge className="ml-2 text-[10px]">Latest</Badge>}
              </SelectItem>
            )
          })}
        </SelectContent>
      </Select>
    </div>
  )
}
