import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Clock, Users, Target, Dumbbell } from "lucide-react"

interface WorkoutTemplateProps {
  id: string
  name: string
  description: string
  duration: string
  difficulty: "Beginner" | "Intermediate" | "Advanced"
  category: string
  exercises: number
  onUseTemplate: (id: string) => void
  onPreview: (id: string) => void
}

export function WorkoutTemplate({
  id,
  name,
  description,
  duration,
  difficulty,
  category,
  exercises,
  onUseTemplate,
  onPreview
}: WorkoutTemplateProps) {
  const difficultyColors = {
    Beginner: "bg-green-100 text-green-800",
    Intermediate: "bg-yellow-100 text-yellow-800",
    Advanced: "bg-red-100 text-red-800"
  }

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{name}</CardTitle>
            <CardDescription className="mt-2">{description}</CardDescription>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${difficultyColors[difficulty]}`}>
            {difficulty}
          </span>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-gray-500" />
            <span className="text-gray-600">{duration}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Dumbbell className="h-4 w-4 text-gray-500" />
            <span className="text-gray-600">{exercises} exercises</span>
          </div>
          <div className="flex items-center space-x-2">
            <Target className="h-4 w-4 text-gray-500" />
            <span className="text-gray-600">{category}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-gray-500" />
            <span className="text-gray-600">Hyrox</span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex space-x-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="flex-1"
          onClick={() => onPreview(id)}
        >
          Preview
        </Button>
        <Button 
          variant="primary" 
          size="sm" 
          className="flex-1"
          onClick={() => onUseTemplate(id)}
        >
          Use Template
        </Button>
      </CardFooter>
    </Card>
  )
}

