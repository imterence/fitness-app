"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, Download, FileText, AlertCircle, CheckCircle, Loader2 } from "lucide-react"
import { parse } from "csv-parse/sync"

interface WorkoutCSVRow {
  workoutType: string
  name: string
  description: string
  dayNumber: string
  dayName: string
  isRestDay: string
  exerciseOrder: string
  exerciseName: string
  sets: string
  reps: string
  rest: string
  notes: string
}

interface ParsedWorkout {
  type: 'single-day' | 'multi-day'
  name: string
  description: string
  exercises: Array<{
    exerciseName: string
    sets: number
    reps: string
    rest: string
    notes: string
    order: number
  }>
  days?: Array<{
    dayNumber: number
    name: string
    isRestDay: boolean
    exercises: Array<{
      exerciseName: string
      sets: number
      reps: string
      rest: string
      notes: string
      order: number
    }>
  }>
}

interface WorkoutCSVImportProps {
  onImport: (workouts: ParsedWorkout[]) => void
  onCancel: () => void
}

export default function WorkoutCSVImport({ onImport, onCancel }: WorkoutCSVImportProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<ParsedWorkout[]>([])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile && selectedFile.type === "text/csv") {
      setFile(selectedFile)
      setError(null)
      setPreview([])
    } else {
      setError("Please select a valid CSV file")
      setFile(null)
    }
  }

  const downloadTemplate = () => {
    const link = document.createElement("a")
    link.href = "/workout-template.csv"
    link.download = "workout-template.csv"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const processCSV = async () => {
    if (!file) return

    setIsProcessing(true)
    setError(null)

    try {
      const text = await file.text()
      const rows = parse(text, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      }) as WorkoutCSVRow[]

      const workouts = parseWorkoutRows(rows)
      setPreview(workouts)
    } catch (err) {
      setError("Error processing CSV file. Please check the format.")
      console.error("CSV processing error:", err)
    } finally {
      setIsProcessing(false)
    }
  }

  const parseWorkoutRows = (rows: WorkoutCSVRow[]): ParsedWorkout[] => {
    const workoutMap = new Map<string, ParsedWorkout>()

    rows.forEach((row) => {
      const workoutKey = `${row.workoutType}-${row.name}`
      
      if (!workoutMap.has(workoutKey)) {
        workoutMap.set(workoutKey, {
          type: row.workoutType as 'single-day' | 'multi-day',
          name: row.name,
          description: row.description,
          exercises: [],
          days: row.workoutType === 'multi-day' ? [] : undefined
        })
      }

      const workout = workoutMap.get(workoutKey)!
      const exerciseData = {
        exerciseName: row.exerciseName,
        sets: parseInt(row.sets) || 0,
        reps: row.reps,
        rest: row.rest,
        notes: row.notes,
        order: parseInt(row.exerciseOrder) || 0
      }

      if (row.workoutType === 'single-day') {
        workout.exercises.push(exerciseData)
      } else {
        // Multi-day workout
        const dayNumber = parseInt(row.dayNumber)
        let day = workout.days!.find(d => d.dayNumber === dayNumber)
        
        if (!day) {
          day = {
            dayNumber,
            name: row.dayName,
            isRestDay: row.isRestDay.toLowerCase() === 'true',
            exercises: []
          }
          workout.days!.push(day)
        }

        if (!day.isRestDay && exerciseData.exerciseName) {
          day.exercises.push(exerciseData)
        }
      }
    })

    // Sort exercises by order within each workout/day
    workoutMap.forEach(workout => {
      if (workout.type === 'single-day') {
        workout.exercises.sort((a, b) => a.order - b.order)
      } else {
        workout.days!.sort((a, b) => a.dayNumber - b.dayNumber)
        workout.days!.forEach(day => {
          day.exercises.sort((a, b) => a.order - b.order)
        })
      }
    })

    return Array.from(workoutMap.values())
  }

  const handleImport = () => {
    if (preview.length > 0) {
      onImport(preview)
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto bg-white border border-gray-200 shadow-xl">
      <CardHeader className="bg-gray-50 border-b border-gray-200">
        <CardTitle className="flex items-center gap-2 text-gray-900">
          <FileText className="h-5 w-5 text-blue-600" />
          Import Workouts from CSV
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        {/* Template Download */}
        <div className="flex items-center justify-between p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200 shadow-sm">
          <div>
            <h3 className="font-semibold text-blue-900 flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Download Template
            </h3>
            <p className="text-sm text-blue-700 mt-1">
              Use our CSV template to ensure proper formatting for both single-day and multi-day workouts.
            </p>
          </div>
          <Button 
            onClick={downloadTemplate} 
            variant="outline" 
            className="bg-white hover:bg-blue-50 border-2 border-blue-300 text-blue-700 font-medium px-4 py-2 shadow-sm hover:shadow-md transition-all duration-200"
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>

        {/* File Upload */}
        <div className="space-y-4">
          <Label htmlFor="csv-file">Select CSV File</Label>
          <Input
            id="csv-file"
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="cursor-pointer"
          />
          {file && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle className="h-4 w-4" />
              {file.name} selected
            </div>
          )}
        </div>

        {/* Process Button */}
        {file && (
          <Button 
            onClick={processCSV} 
            disabled={isProcessing}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-6 px-6 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                <span className="text-base">Processing CSV...</span>
              </>
            ) : (
              <>
                <Upload className="h-5 w-5 mr-2" />
                <span className="text-base">Process CSV & Preview</span>
              </>
            )}
          </Button>
        )}

        {/* Error Display */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        {/* Preview */}
        {preview.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Preview ({preview.length} workouts)</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {preview.map((workout, index) => (
                <div key={index} className="p-3 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100">
                  <div className="font-medium text-gray-900">
                    {workout.name} ({workout.type})
                  </div>
                  <div className="text-sm text-gray-700">
                    {workout.type === 'single-day' ? 'Single Day Workout' : 'Multi-Day Program'}
                  </div>
                  {workout.type === 'single-day' ? (
                    <div className="text-sm text-gray-600 mt-1">
                      {workout.exercises.length} exercises
                    </div>
                  ) : (
                    <div className="text-sm text-gray-600 mt-1">
                      {workout.days?.length} days
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button 
            onClick={onCancel} 
            variant="outline" 
            className="flex-1 py-5 text-base border-2 hover:bg-gray-50"
          >
            Cancel
          </Button>
          {preview.length > 0 && (
            <Button 
              onClick={handleImport} 
              className="flex-1 py-5 text-base bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200"
            >
              <CheckCircle className="h-5 w-5 mr-2" />
              Import {preview.length} Workout{preview.length !== 1 ? 's' : ''}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
