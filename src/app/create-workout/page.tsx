"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Plus, Save, Trash2, GripVertical, X, Calendar, Bed } from "lucide-react"
import Link from "next/link"

interface Exercise {
  id: string
  name: string
  sets: number
  reps: string
  rest: string
  notes: string
  category: string
  description?: string
}

interface WorkoutDay {
  dayNumber: number
  name: string
  isRestDay: boolean
  estimatedDuration?: number
  notes?: string
  exercises: Exercise[]
}

export default function CreateWorkoutPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [workoutName, setWorkoutName] = useState("")
  const [workoutDescription, setWorkoutDescription] = useState("")
  const [isMultiDay, setIsMultiDay] = useState(false)
  const [numberOfDays, setNumberOfDays] = useState(2)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [workoutDays, setWorkoutDays] = useState<WorkoutDay[]>([])
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [showExerciseForm, setShowExerciseForm] = useState(false)
  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([])
  const [exerciseSearch, setExerciseSearch] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [newExercise, setNewExercise] = useState<Omit<Exercise, 'id'> & { exerciseId?: string; dayIndex?: number }>({
    name: "",
    category: "",
    sets: 3,
    reps: "10",
    rest: "60s",
    notes: "",
    exerciseId: undefined,
    dayIndex: undefined
  })

  // Simple authentication check - redirect if not logged in
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login")
    }
  }, [status, router])

  // Fetch available exercises on component mount
  useEffect(() => {
    fetchAvailableExercises()
    fetchCategories()
  }, [])

  // Initialize workout days when multi-day is enabled
  useEffect(() => {
    if (isMultiDay && workoutDays.length === 0) {
      initializeWorkoutDays()
    }
  }, [isMultiDay])

  // Fetch available exercises from the exercise library
  const fetchAvailableExercises = async () => {
    try {
      const response = await fetch('/api/exercises')
      if (response.ok) {
        const data = await response.json()
        setAvailableExercises(data.exercises || [])
      }
    } catch (error) {
      console.error('Error fetching exercises:', error)
    }
  }

  // Fetch exercise categories from the database
  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/exercises/categories', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setExerciseCategories(data.categories || [])
      } else {
        console.error('Failed to fetch categories')
        // Fallback to default categories if API fails
        setExerciseCategories(["Strength", "Cardio", "Flexibility", "Balance", "Power", "Endurance", "Recovery"])
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
      // Fallback to default categories if API fails
      setExerciseCategories(["Strength", "Cardio", "Flexibility", "Balance", "Power", "Endurance", "Recovery"])
    }
  }

  // Initialize workout days when multi-day is enabled
  const initializeWorkoutDays = () => {
    const days: WorkoutDay[] = []
    for (let i = 1; i <= numberOfDays; i++) {
      days.push({
        dayNumber: i,
        name: `Day ${i}`,
        isRestDay: false,
        estimatedDuration: 60,
        notes: "",
        exercises: []
      })
    }
    setWorkoutDays(days)
  }

  // Handle multi-day toggle
  const handleMultiDayToggle = (enabled: boolean) => {
    setIsMultiDay(enabled)
    if (enabled) {
      initializeWorkoutDays()
    } else {
      setWorkoutDays([])
    }
  }

  // Handle number of days change
  const handleNumberOfDaysChange = (newNumberOfDays: number) => {
    // Check if reducing days and there are exercises that would be lost
    if (newNumberOfDays < numberOfDays && isMultiDay) {
      const exercisesInRemovedDays = workoutDays
        .slice(newNumberOfDays)
        .some(day => day.exercises.length > 0)
      
      if (exercisesInRemovedDays) {
        const confirmed = window.confirm(
          `Reducing to ${newNumberOfDays} days will remove exercises from days ${newNumberOfDays + 1}-${numberOfDays}. Are you sure?`
        )
        if (!confirmed) {
          return
        }
      }
    }
    
    setNumberOfDays(newNumberOfDays)
    if (isMultiDay) {
      // Reinitialize workout days with new count
      const days: WorkoutDay[] = []
      for (let i = 1; i <= newNumberOfDays; i++) {
        days.push({
          dayNumber: i,
          name: `Day ${i}`,
          isRestDay: false,
          estimatedDuration: 60,
          notes: "",
          exercises: []
        })
      }
      setWorkoutDays(days)
    }
  }

  // Filter exercises based on search and category
  const filteredExercises = availableExercises.filter(exercise =>
    (exercise.name.toLowerCase().includes(exerciseSearch.toLowerCase()) ||
     exercise.category.toLowerCase().includes(exerciseSearch.toLowerCase())) &&
    (selectedCategory === "" || exercise.category === selectedCategory)
  )

  const [exerciseCategories, setExerciseCategories] = useState<string[]>([])

  const addExercise = () => {
    if (newExercise.name.trim() && newExercise.category && newExercise.exerciseId) {
      const exercise: Exercise = {
        id: newExercise.exerciseId, // This should be the exercise ID from the library
        name: newExercise.name,
        category: newExercise.category,
        sets: newExercise.sets,
        reps: newExercise.reps,
        rest: newExercise.rest,
        notes: newExercise.notes
      }
      
      if (isMultiDay && newExercise.dayIndex !== undefined) {
        // Add to specific day
        addExerciseToDay(newExercise.dayIndex)
      } else {
        // Add to single workout
        setExercises([...exercises, exercise])
      }
      
      setNewExercise({
        name: "",
        category: "",
        sets: 3,
        reps: "10",
        rest: "60s",
        notes: "",
        exerciseId: undefined,
        dayIndex: undefined
      })
      setShowExerciseForm(false)
    }
  }

  const removeExercise = (id: string) => {
    setExercises(exercises.filter(ex => ex.id !== id))
  }

  const updateExercise = (id: string, field: keyof Exercise, value: string | number) => {
    setExercises(exercises.map(ex => 
      ex.id === id ? { ...ex, [field]: value } : ex
    ))
  }

  // Multi-day exercise management
  const addExerciseToDay = (dayIndex: number) => {
    if (newExercise.name.trim() && newExercise.category && newExercise.exerciseId) {
      const exercise: Exercise = {
        id: newExercise.exerciseId, // This should be the exercise ID from the library
        name: newExercise.name,
        category: newExercise.category,
        sets: newExercise.sets,
        reps: newExercise.reps,
        rest: newExercise.rest,
        notes: newExercise.notes
      }
      
      const updatedDays = [...workoutDays]
      updatedDays[dayIndex].exercises.push(exercise)
      
      setWorkoutDays(updatedDays)
      setNewExercise({
        name: "",
        category: "",
        sets: 3,
        reps: "10",
        rest: "60s",
        notes: "",
        exerciseId: undefined,
        dayIndex: undefined
      })
      setShowExerciseForm(false)
    }
  }

  const removeExerciseFromDay = (dayIndex: number, exerciseId: string) => {
    const updatedDays = [...workoutDays]
    updatedDays[dayIndex].exercises = updatedDays[dayIndex].exercises.filter(ex => ex.id !== exerciseId)
    setWorkoutDays(updatedDays)
  }

  const updateExerciseInDay = (dayIndex: number, exerciseId: string, field: keyof Exercise, value: any) => {
    const updatedDays = [...workoutDays]
    updatedDays[dayIndex].exercises = updatedDays[dayIndex].exercises.map((ex) => 
      ex.id === exerciseId ? { ...ex, [field]: value } : ex
    )
    setWorkoutDays(updatedDays)
  }

  const handleDayTypeChange = (dayIndex: number, isRestDay: boolean) => {
    const updatedDays = [...workoutDays]
    updatedDays[dayIndex] = {
      ...updatedDays[dayIndex],
      isRestDay,
      exercises: isRestDay ? [] : updatedDays[dayIndex].exercises
    }
    setWorkoutDays(updatedDays)
  }

  const saveWorkout = async () => {
    if (!workoutName.trim()) {
      setMessage("Please enter a workout name")
      return
    }
    
    if (isMultiDay) {
      // Validate multi-day workout
      const hasValidDays = workoutDays.some(day => !day.isRestDay && day.exercises.length > 0)
      if (!hasValidDays) {
        setMessage("Please add exercises to at least one non-rest day")
        return
      }
    } else {
      if (exercises.length === 0) {
        setMessage("Please add at least one exercise")
        return
      }
    }

    try {
      setSaving(true)
      setMessage("")

      let endpoint = '/api/workouts'
      let workoutData: any = {
        name: workoutName,
        description: workoutDescription
      }

      if (isMultiDay) {
        endpoint = '/api/workout-programs'
        workoutData = {
          name: workoutName,
          description: workoutDescription,
          totalDays: numberOfDays,
          days: workoutDays.map(day => ({
            dayNumber: day.dayNumber,
            name: day.name,
            isRestDay: day.isRestDay,
            estimatedDuration: day.estimatedDuration,
            notes: day.notes,
            exercises: day.exercises.map(ex => ({
              id: ex.id,
              name: ex.name,
              sets: ex.sets,
              reps: ex.reps,
              rest: ex.rest,
              notes: ex.notes,
              category: ex.category
            }))
          }))
        }
      } else {
        workoutData.exercises = exercises.map(ex => ({
          id: ex.id,
          name: ex.name,
          sets: ex.sets,
          reps: ex.reps,
          rest: ex.rest,
          notes: ex.notes,
          category: ex.category
        }))
      }

      // Add debugging
      console.log("Sending workout data:", workoutData)
      console.log("Exercises being sent:", workoutData.exercises)

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(workoutData)
      })

      if (response.ok) {
        const result = await response.json()
        console.log("Workout saved successfully:", result)
        const workoutType = isMultiDay ? 'workout program' : 'workout'
        setMessage(`${workoutType.charAt(0).toUpperCase() + workoutType.slice(1)} "${workoutName}" saved successfully!`)
        // Reset form
        setWorkoutName("")
        setWorkoutDescription("")
        setExercises([])
        setWorkoutDays([])
        setIsMultiDay(false)
        setNumberOfDays(2)
      } else {
        const error = await response.json()
        console.error("Error saving workout:", error)
        setMessage(`Error saving workout: ${error.error}`)
      }
    } catch (error) {
      console.error('Error saving workout:', error)
      setMessage('Error saving workout. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // Don't render if not authenticated
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Please log in to access the workout builder.</p>
          <Link href="/auth/login">
            <Button className="mt-4">Go to Login</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Workout Builder</h1>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-600">
                {session.user.name || session.user.email}
              </span>
              <Link href="/dashboard">
                <Button variant="outline">Dashboard</Button>
              </Link>
              <Button variant="outline" onClick={saveWorkout} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Saving..." : "Save Workout"}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Message Display */}
      {message && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className={`p-3 rounded-md ${
            message.includes("successfully") 
              ? "bg-green-50 text-green-800 border border-green-200" 
              : "bg-red-50 text-red-800 border border-red-200"
          }`}>
            {message}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Workout Details */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Workout Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Workout Name
                  </label>
                  <input
                    type="text"
                    value={workoutName}
                    onChange={(e) => setWorkoutName(e.target.value)}
                    placeholder="e.g., Hyrox Prep Week 1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={workoutDescription}
                    onChange={(e) => setWorkoutDescription(e.target.value)}
                    placeholder="Describe the workout focus and goals..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Multi-Day Toggle */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="isMultiDay"
                      checked={isMultiDay}
                      onChange={(e) => handleMultiDayToggle(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isMultiDay" className="text-sm font-medium text-gray-700">
                      Multi-Day Workout Program
                    </label>
                  </div>
                  
                  {isMultiDay && (
                    <div className="ml-6 space-y-2">
                      <label className="block text-sm text-gray-600 mb-1">
                        Number of Days ({numberOfDays} selected)
                      </label>
                      <select
                        value={numberOfDays}
                        onChange={(e) => handleNumberOfDaysChange(parseInt(e.target.value))}
                        className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {[2, 3, 4, 5, 6, 7].map(num => (
                          <option key={num} value={num}>{num} Days</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Workout Content */}
          <div className="lg:col-span-2">
            {isMultiDay ? (
              /* Multi-Day Workout Days */
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{numberOfDays}-Day Workout Program</span>
                    <span className="text-sm font-normal text-gray-500">
                      {workoutDays.filter(day => !day.isRestDay).length} workout days, {workoutDays.filter(day => day.isRestDay).length} rest days
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {workoutDays.map((day, dayIndex) => (
                    <div key={day.dayNumber} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <h4 className="font-medium text-gray-900">Day {day.dayNumber}</h4>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`rest-${day.dayNumber}`}
                              checked={day.isRestDay}
                              onChange={(e) => handleDayTypeChange(dayIndex, e.target.checked)}
                              className="rounded border-gray-300"
                            />
                            <label htmlFor={`rest-${day.dayNumber}`} className="text-sm text-gray-600">
                              Rest Day
                            </label>
                          </div>
                        </div>
                        {!day.isRestDay && (
                          <div className="text-sm text-gray-500">
                            {day.exercises.length} exercises
                          </div>
                        )}
                      </div>

                      {!day.isRestDay ? (
                        <>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <label className="block text-sm text-gray-600 mb-1">Day Name</label>
                              <input
                                type="text"
                                value={day.name}
                                onChange={(e) => {
                                  const updatedDays = [...workoutDays]
                                  updatedDays[dayIndex].name = e.target.value
                                  setWorkoutDays(updatedDays)
                                }}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="e.g., Upper Body, Cardio"
                              />
                            </div>
                            <div>
                              <label className="block text-sm text-gray-600 mb-1">Duration (min)</label>
                              <input
                                type="number"
                                value={day.estimatedDuration || ""}
                                onChange={(e) => {
                                  const updatedDays = [...workoutDays]
                                  updatedDays[dayIndex].estimatedDuration = parseInt(e.target.value) || 0
                                  setWorkoutDays(updatedDays)
                                }}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                min="15"
                                max="180"
                              />
                            </div>
                          </div>

                          {/* Day Exercises */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h5 className="font-medium text-gray-900">Exercises</h5>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setShowExerciseForm(true)
                                  setNewExercise(prev => ({ ...prev, dayIndex }))
                                }}
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Exercise
                              </Button>
                            </div>

                            {day.exercises.length === 0 ? (
                              <p className="text-gray-500 text-center py-4 text-sm">
                                No exercises added yet. Click "Add Exercise" to get started.
                              </p>
                            ) : (
                              <div className="space-y-3">
                                {day.exercises.map((exercise, exerciseIndex) => (
                                  <div key={exercise.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                                    <div className="flex items-center justify-between mb-2">
                                      <h6 className="font-medium text-gray-900">
                                        {exerciseIndex + 1}. {exercise.name}
                                      </h6>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeExerciseFromDay(dayIndex, exercise.id)}
                                        className="text-red-600 hover:text-red-700"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                      <div>
                                        <label className="block text-xs text-gray-600 mb-1">Sets</label>
                                        <input
                                          type="number"
                                          value={exercise.sets}
                                          onChange={(e) => updateExerciseInDay(dayIndex, exercise.id, 'sets', parseInt(e.target.value) || 0)}
                                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                          min="1"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-xs text-gray-600 mb-1">Reps</label>
                                        <input
                                          type="text"
                                          value={exercise.reps}
                                          onChange={(e) => updateExerciseInDay(dayIndex, exercise.id, 'reps', e.target.value)}
                                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                          placeholder="10"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-xs text-gray-600 mb-1">Rest</label>
                                        <input
                                          type="text"
                                          value={exercise.rest}
                                          onChange={(e) => updateExerciseInDay(dayIndex, exercise.id, 'rest', e.target.value)}
                                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                          placeholder="60s"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-xs text-gray-600 mb-1">Notes</label>
                                        <input
                                          type="text"
                                          value={exercise.notes}
                                          onChange={(e) => updateExerciseInDay(dayIndex, exercise.id, 'notes', e.target.value)}
                                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                          placeholder="Optional"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-4 text-gray-500">
                          <Bed className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                          <p className="text-sm">Rest Day - No exercises scheduled</p>
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : (
              /* Single Day Workout Exercises */
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Workout Exercises</CardTitle>
                  <Button
                    onClick={() => setShowExerciseForm(true)}
                    disabled={showExerciseForm}
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Exercise
                  </Button>
                </CardHeader>
                <CardContent>
                  {exercises.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>No exercises added yet</p>
                      <p className="text-sm">Click "Add Exercise" to get started</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {exercises.map((exercise, index) => (
                        <div key={exercise.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <GripVertical className="h-4 w-4 text-gray-400 cursor-move" />
                              <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                            </div>
                            <button
                              onClick={() => removeExercise(exercise.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                          
                          <h4 className="font-medium mb-3">{exercise.name}</h4>
                          
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Sets</label>
                              <input
                                type="number"
                                value={exercise.sets}
                                onChange={(e) => updateExercise(exercise.id, 'sets', parseInt(e.target.value) || 1)}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Reps</label>
                              <input
                                type="text"
                                value={exercise.reps}
                                onChange={(e) => updateExercise(exercise.id, 'reps', e.target.value)}
                                placeholder="10"
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Rest</label>
                              <input
                                type="text"
                                value={exercise.rest}
                                onChange={(e) => updateExercise(exercise.id, 'rest', e.target.value)}
                                placeholder="60s"
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                          
                          <div className="mt-3">
                            <label className="block text-xs text-gray-600 mb-1">Notes</label>
                            <input
                              type="text"
                              value={exercise.notes}
                              onChange={(e) => updateExercise(exercise.id, 'notes', e.target.value)}
                              placeholder="Optional notes..."
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      {/* Add Exercise Form - Popup Panel */}
      {showExerciseForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-white shadow-2xl">
            <CardHeader className="bg-gray-50 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">
                  {isMultiDay && newExercise.dayIndex !== undefined 
                    ? `Add Exercise to Day ${newExercise.dayIndex + 1}` 
                    : 'Select Exercise from Library'
                  }
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowExerciseForm(false)}
                  className="hover:bg-gray-200"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Exercise Selection */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Available Exercises</h4>
                
                {/* Search and Filter Bar */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Search exercises by name or category..."
                    value={exerciseSearch}
                    onChange={(e) => setExerciseSearch(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Categories</option>
                    {exerciseCategories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                {availableExercises.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">Loading exercises...</p>
                ) : filteredExercises.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No exercises found matching your search.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                    {filteredExercises.map((exercise) => (
                      <div
                        key={exercise.id}
                        className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 shadow-sm hover:shadow-md"
                        onClick={() => {
                          setNewExercise({
                            name: exercise.name,
                            category: exercise.category || "General",
                            sets: 3,
                            reps: "10",
                            rest: "60s",
                            notes: "",
                            exerciseId: exercise.id,
                            dayIndex: newExercise.dayIndex
                          })
                        }}
                      >
                        <h5 className="font-semibold text-gray-900 text-lg mb-2">{exercise.name}</h5>
                        <div className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full w-fit mb-2">
                          {exercise.category}
                        </div>
                        {exercise.description && (
                          <p className="text-sm text-gray-600 leading-relaxed">{exercise.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Exercise Configuration */}
              {newExercise.name && (
                <div className="border-t pt-6 bg-gray-50 -mx-6 px-6 pb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-900 text-lg">Configure Exercise</h4>
                    {newExercise.exerciseId && (
                      <div className="bg-green-100 text-green-800 text-xs font-medium px-3 py-1 rounded-full">
                        ✓ Exercise Selected
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Exercise Name
                      </label>
                      <input
                        type="text"
                        value={newExercise.name}
                        onChange={(e) => setNewExercise({ ...newExercise, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category
                      </label>
                      <input
                        type="text"
                        value={newExercise.category}
                        onChange={(e) => setNewExercise({ ...newExercise, category: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sets
                      </label>
                      <input
                        type="number"
                        value={newExercise.sets}
                        onChange={(e) => setNewExercise({ ...newExercise, sets: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Reps
                      </label>
                      <input
                        type="text"
                        value={newExercise.reps}
                        onChange={(e) => setNewExercise({ ...newExercise, reps: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., 10 or 8-12"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rest Period
                      </label>
                      <input
                        type="text"
                        value={newExercise.rest}
                        onChange={(e) => setNewExercise({ ...newExercise, rest: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., 60s or 2min"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Notes
                      </label>
                      <input
                        type="text"
                        value={newExercise.notes}
                        onChange={(e) => setNewExercise({ ...newExercise, notes: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Optional notes"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-6 border-t bg-white -mx-6 px-6 pb-6">
                <Button
                  variant="outline"
                  onClick={() => setShowExerciseForm(false)}
                  className="px-6"
                >
                  Cancel
                </Button>
                <Button
                  onClick={addExercise}
                  disabled={!newExercise.name.trim() || !newExercise.exerciseId}
                  className="px-6"
                >
                  Add Exercise
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
