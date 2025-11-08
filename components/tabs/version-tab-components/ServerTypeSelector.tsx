import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { SERVER_TYPES, ServerType } from '@/lib/server-management'

interface ServerTypeSelectorProps {
  selectedType: string
  onSelect: (typeId: string) => void
}

export function ServerTypeSelector({ selectedType, onSelect }: ServerTypeSelectorProps) {
  return (
    <div className="space-y-3">
      <Label className="text-base">Select Server Type</Label>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {SERVER_TYPES.map((type: ServerType) => {
          const TypeIcon = type.icon
          const isSelected = selectedType === type.id
          
          return (
            <Card
              key={type.id}
              className={`cursor-pointer transition-all ${
                isSelected
                  ? `${type.borderColor} ${type.bgColor} ring-2 ring-offset-2`
                  : 'border-primary/10 hover:border-primary/30'
              }`}
              onClick={() => onSelect(type.id)}
            >
              <CardContent className="pt-4 pb-4">
                <div className="flex flex-col items-center text-center gap-2">
                  <TypeIcon 
                    className={`h-8 w-8 ${isSelected ? type.color : 'text-muted-foreground'}`} 
                  />
                  <div>
                    <p className="font-semibold text-sm flex items-center gap-1 justify-center">
                      {type.name}
                      {type.recommended && (
                        <Badge variant="default" className="text-[10px] px-1 py-0">
                          Recommended
                        </Badge>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {type.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
