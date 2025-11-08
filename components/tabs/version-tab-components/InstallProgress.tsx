import { Progress } from '@/components/ui/progress'

interface InstallProgressProps {
  progress: number
}

export function InstallProgress({ progress }: InstallProgressProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Installing...</span>
        <span className="font-semibold">{progress}%</span>
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  )
}
