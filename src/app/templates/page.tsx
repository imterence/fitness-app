"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Dumbbell, Calendar, XCircle, CheckCircle, FileText, Edit2, Save, X, Trash2, Bed, Home, Users, Upload } from "lucide-react"
import Link from "next/link"
import WorkoutCSVImport from "@/components/WorkoutCSVImport"

interface Workout {
  id: string
  name: string
  description: string
  category: string
  difficulty: string
  isPublic: boolean
  type: 'single-day' | 'multi-day'
  totalDays: number
  estimatedDuration?: number
  createdAt: string
  exercises: Array<{
    exercise: {
      id: string
      name: string
    }
    sets: number
    reps: string
    rest: string
    notes?: string
  }>
  days?: Array<{
    dayNumber: number
    name?: string
    isRestDay: boolean
    estimatedDuration?: number
    notes?: string
    exercises: Array<{
      exercise: {
        id: string
        name: string
        description?: string
        category?: string
        difficulty?: string
      }
      sets: number
      reps: string
      rest: string
      notes?: string
    }>
  }>
  creator: {
    id: string
    name: string
  }
}

export default function TemplatesPage() {
  const { data: session } = useSession()
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [expandedWorkouts, setExpandedWorkouts] = useState<string[]>([])
  const [editingWorkout, setEditingWorkout] = useState<string | null>(null)
  const [editingExercise, setEditingExercise] = useState<string | null>(null)
  const [workoutUpdates, setWorkoutUpdates] = useState<{[key: string]: any}>({})
  const [showExerciseForm, setShowExerciseForm] = useState(false)
  const [availableExercises, setAvailableExercises] = useState<any[]>([])
  const [exerciseSearch, setExerciseSearch] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [newExercise, setNewExercise] = useState<{
    name: string
    category: string
    sets: number
    reps: string
    rest: string
    notes: string
    videoUrl: string
    exerciseId?: string
    workoutId?: string
    workoutType?: string
    dayNumber?: number
  }>({
    name: "",
    category: "",
    sets: 3,
    reps: "10",
    rest: "60s",
    notes: "",
    videoUrl: "",
    exerciseId: undefined,
    workoutId: undefined,
    workoutType: undefined,
    dayNumber: undefined
  })

  const [showCSVImport, setShowCSVImport] = useState(false)
  const [isImporting, setIsImporting] = useState(false)

  useEffect(() => {
    if (session?.user) {
      fetchWorkouts()
      fetchAvailableExercises()
      fetchCategories()
    }
  }, [session])

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

  const fetchWorkouts = async () => {
    try {
      setIsLoading(true)
      
      // Fetch both single-day workouts and multi-day workout programs
      const [workoutsResponse, programsResponse] = await Promise.all([
        fetch('/api/workouts'),
        fetch('/api/workout-programs')
      ])
      
      const allWorkouts: Workout[] = []
      
      if (workoutsResponse.ok) {
        const workoutsData = await workoutsResponse.json()
        // Add type indicator for single-day workouts
        const singleDayWorkouts = workoutsData.workouts.map((workout: Workout) => ({
          ...workout,
          type: 'single-day' as const,
          totalDays: 1
        }))
        allWorkouts.push(...singleDayWorkouts)
      }
      
      if (programsResponse.ok) {
        const programsData = await programsResponse.json()
        // Add type indicator for multi-day programs and map the data structure
        const multiDayPrograms = programsData.programs.map((program: any) => 
          normalizeWorkoutDays({
            ...program,
            type: 'multi-day' as const,
            exercises: [], // Multi-day programs don't have direct exercises
            days: program.days || [] // Include the days data
          })
        )
        allWorkouts.push(...multiDayPrograms)
      }
      
      // Sort by creation date (newest first)
      allWorkouts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      
      setWorkouts(allWorkouts)
    } catch (error) {
      console.error('Error fetching workouts:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'BEGINNER':
        return 'bg-green-100 text-green-800'
      case 'INTERMEDIATE':
        return 'bg-yellow-100 text-yellow-800'
      case 'ADVANCED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleCSVImport = async (workouts: any[]) => {
    setIsImporting(true)
    setError(null)
    
    try {
      const response = await fetch('/api/workouts/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ workouts }),
      })

      if (response.ok) {
        const result = await response.json()
        setSuccessMessage(`Successfully imported ${result.results.length} workouts!`)
        setShowCSVImport(false)
        // Refresh the workouts list
        fetchWorkouts()
      } else {
        const errorData = await response.json()
        setError(`Import failed: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error importing workouts:', error)
      setError('Failed to import workouts. Please try again.')
    } finally {
      setIsImporting(false)
    }
  }

  const handleDeleteWorkout = async (workoutId: string, workoutType: string) => {
    if (!confirm('Are you sure you want to delete this workout? This action cannot be undone.')) {
      return
    }

    try {
      let endpoint = `/api/workouts/${workoutId}`
      if (workoutType === 'multi-day') {
        endpoint = `/api/workout-programs/${workoutId}`
      }

      const response = await fetch(endpoint, {
        method: 'DELETE'
      })

      if (response.ok) {
        // Refresh the workouts list
        await fetchWorkouts()
        setSuccessMessage('Workout deleted successfully!')
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to delete workout')
      }
    } catch (error) {
      console.error('Error deleting workout:', error)
      setError('Failed to delete workout')
    }
  }

  const toggleWorkoutDetails = (workoutId: string) => {
    setExpandedWorkouts(prev => {
      // If this workout is already expanded, close it
      if (prev.includes(workoutId)) {
        return prev.filter(id => id !== workoutId);
      }
      // If another workout is expanded, close it and open this one
      // This ensures only one popup is visible at a time
      return [workoutId];
    });
  }

  const startEditingWorkout = (workoutId: string) => {
    setEditingWorkout(workoutId)
    const workout = workouts.find(w => w.id === workoutId)
    if (workout) {
      setWorkoutUpdates({
        [workoutId]: {
          name: workout.name,
          description: workout.description,
          category: workout.category,
          difficulty: workout.difficulty,
          isPublic: workout.isPublic
        }
      })
    }
  }

  const cancelEditingWorkout = () => {
    setEditingWorkout(null)
    setWorkoutUpdates({})
  }

  const updateWorkoutField = (workoutId: string, field: string, value: any) => {
    setWorkoutUpdates(prev => ({
      ...prev,
      [workoutId]: {
        ...prev[workoutId],
        [field]: value
      }
    }))
  }

  const saveWorkoutChanges = async (workoutId: string) => {
    try {
      const updates = workoutUpdates[workoutId]
      if (!updates) return

      const workout = workouts.find(w => w.id === workoutId)
      if (!workout) return

      const endpoint = workout.type === 'multi-day' 
        ? `/api/workout-programs/${workoutId}` 
        : `/api/workouts/${workoutId}`

      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      if (response.ok) {
        // Refresh the workouts list
        await fetchWorkouts()
        setEditingWorkout(null)
        setWorkoutUpdates({})
        setSuccessMessage('Workout updated successfully!')
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to update workout')
      }
    } catch (error) {
      console.error('Error updating workout:', error)
      setError('Failed to update workout')
    }
  }

  const removeExercise = async (workoutId: string, exerciseIndex: number) => {
    if (!confirm('Are you sure you want to remove this exercise?')) {
      return
    }

    try {
      const workout = workouts.find(w => w.id === workoutId)
      if (!workout || workout.type !== 'single-day') return

      const updatedExercises = workout.exercises.filter((_, index) => index !== exerciseIndex)
      
      const response = await fetch(`/api/workouts/${workoutId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          exercises: updatedExercises.map((exercise, index) => ({
            exercise: { id: exercise.exercise.id },
            order: index + 1,
            sets: exercise.sets,
            reps: exercise.reps,
            rest: exercise.rest,
            notes: exercise.notes
          }))
        }),
      })

      if (response.ok) {
        await fetchWorkouts()
        setSuccessMessage('Exercise removed successfully!')
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to remove exercise')
      }
    } catch (error) {
      console.error('Error removing exercise:', error)
      setError('Failed to remove exercise')
    }
  }

  const removeExerciseFromProgram = async (workoutId: string, dayNumber: number, exerciseIndex: number) => {
    if (!confirm('Are you sure you want to remove this exercise from the workout program?')) {
      return
    }

    try {
      const workout = workouts.find(w => w.id === workoutId)
      if (!workout || workout.type !== 'multi-day') return

      // Find the day and remove the exercise
          const updatedDays = workout.days?.map(day => {
      if (day.dayNumber === dayNumber) {
        const remainingExercises = day.exercises.filter((_, index) => index !== exerciseIndex)
        return {
          ...day,
          exercises: remainingExercises,
          isRestDay: remainingExercises.length === 0 // Convert to rest day if no exercises remain
        }
      }
      return day
    }) || []

      // Update the workout program with the modified days
      const response = await fetch(`/api/workout-programs/${workoutId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          days: updatedDays
        }),
      })

          if (response.ok) {
      await fetchWorkouts()
      const dayAfterDeletion = updatedDays.find(d => d.dayNumber === dayNumber)
      setSuccessMessage(dayAfterDeletion?.isRestDay 
        ? 'Exercise removed and day converted to rest day!' 
        : 'Exercise removed from workout program successfully!')
    } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to remove exercise from program')
      }
    } catch (error) {
      console.error('Error removing exercise from program:', error)
      setError('Failed to remove exercise from program')
    }
  }

  // Exercise editing functions
  const startEditingExercise = (workoutId: string, exerciseIndex: number, dayNumber?: number) => {
    const key = dayNumber ? `${workoutId}-${dayNumber}-${exerciseIndex}` : `${workoutId}-${exerciseIndex}`
    setEditingExercise(key)
  }

  const cancelExerciseEdit = () => {
    setEditingExercise(null)
  }

  const saveExerciseChanges = async (workoutId: string, exerciseIndex: number, dayNumber?: number) => {
    try {
      const workout = workouts.find(w => w.id === workoutId)
      if (!workout) return

      if (workout.type === 'single-day') {
        // Update single-day workout exercise
        const updatedExercises = workout.exercises.map((exercise, index) => {
          if (index === exerciseIndex) {
            return {
              ...exercise,
              sets: parseInt((document.getElementById(`sets-${workoutId}-${index}`) as HTMLInputElement)?.value || exercise.sets.toString()),
              reps: (document.getElementById(`reps-${workoutId}-${index}`) as HTMLInputElement)?.value || exercise.reps,
              rest: (document.getElementById(`rest-${workoutId}-${index}`) as HTMLInputElement)?.value || exercise.rest
            }
          }
          return exercise
        })

        const response = await fetch(`/api/workouts/${workoutId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            exercises: updatedExercises.map((exercise, index) => ({
              exercise: { id: exercise.exercise.id },
              order: index + 1,
              sets: exercise.sets,
              reps: exercise.reps,
              rest: exercise.rest,
              notes: exercise.notes
            }))
          }),
        })

        if (response.ok) {
          await fetchWorkouts()
          setEditingExercise(null)
          setSuccessMessage('Exercise updated successfully!')
        } else {
          const errorData = await response.json()
          setError(errorData.error || 'Failed to update exercise')
        }
      } else if (workout.type === 'multi-day' && dayNumber) {
        // Update multi-day workout program exercise
        const updatedDays = workout.days?.map(day => {
          if (day.dayNumber === dayNumber) {
            const updatedDayExercises = day.exercises.map((exercise, index) => {
              if (index === exerciseIndex) {
                return {
                  ...exercise,
                  sets: parseInt((document.getElementById(`sets-${workoutId}-${dayNumber}-${index}`) as HTMLInputElement)?.value || exercise.sets.toString()),
                  reps: (document.getElementById(`reps-${workoutId}-${dayNumber}-${index}`) as HTMLInputElement)?.value || exercise.reps,
                  rest: (document.getElementById(`rest-${workoutId}-${dayNumber}-${index}`) as HTMLInputElement)?.value || exercise.rest
                }
              }
              return exercise
            })
            return { ...day, exercises: updatedDayExercises }
          }
          return day
        }) || []

        const response = await fetch(`/api/workout-programs/${workoutId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            days: updatedDays
          }),
        })

        if (response.ok) {
          await fetchWorkouts()
          setEditingExercise(null)
          setSuccessMessage('Exercise updated successfully!')
        } else {
          const errorData = await response.json()
          setError(errorData.error || 'Failed to update exercise')
        }
      }
    } catch (error) {
      console.error('Error updating exercise:', error)
      setError('Failed to update exercise')
    }
  }

  // Filter exercises based on search and category
  const filteredExercises = availableExercises.filter(exercise =>
    (exercise.name.toLowerCase().includes(exerciseSearch.toLowerCase()) ||
     exercise.category.toLowerCase().includes(exerciseSearch.toLowerCase())) &&
    (selectedCategory === "" || exercise.category === selectedCategory)
  )

  const [exerciseCategories, setExerciseCategories] = useState<string[]>([])

  // Helper function to ensure days with no exercises are marked as rest days
  const normalizeWorkoutDays = (workout: Workout): Workout => {
    if (workout.type !== 'multi-day' || !workout.days) return workout
    
    const normalizedDays = workout.days.map(day => ({
      ...day,
      isRestDay: day.exercises.length === 0 ? true : day.isRestDay
    }))
    
    return { ...workout, days: normalizedDays }
  }

  const openAddExerciseForm = (workoutId: string, workoutType: string, dayNumber?: number) => {
    setNewExercise({
      name: "",
      category: "",
      sets: 3,
      reps: "10",
      rest: "60s",
      notes: "",
      videoUrl: "",
      exerciseId: undefined,
      workoutId,
      workoutType,
      dayNumber
    })
    setShowExerciseForm(true)
  }

  const addExerciseToWorkout = async () => {
    if (!newExercise.name.trim() || !newExercise.exerciseId || !newExercise.workoutId) {
      return
    }

    try {
      const workout = workouts.find(w => w.id === newExercise.workoutId)
      if (!workout) return

      if (workout.type === 'single-day') {
        // Add to single-day workout
        const updatedExercises = [
          ...workout.exercises,
          {
            exercise: { id: newExercise.exerciseId },
            sets: newExercise.sets,
            reps: newExercise.reps,
            rest: newExercise.rest,
            notes: newExercise.notes
          }
        ]

        const response = await fetch(`/api/workouts/${newExercise.workoutId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            exercises: updatedExercises.map((exercise, index) => ({
              exercise: { id: exercise.exercise.id },
              order: index + 1,
              sets: exercise.sets,
              reps: exercise.reps,
              rest: exercise.rest,
              notes: exercise.notes
            }))
          }),
        })

        if (response.ok) {
          await fetchWorkouts()
          setSuccessMessage('Exercise added successfully!')
          setShowExerciseForm(false)
          setNewExercise({
            name: "",
            category: "",
            sets: 3,
            reps: "10",
            rest: "60s",
            notes: "",
            videoUrl: "",
            exerciseId: undefined,
            workoutId: undefined,
            workoutType: undefined,
            dayNumber: undefined
          })
        } else {
          const errorData = await response.json()
          setError(errorData.error || 'Failed to add exercise')
        }
      } else if (workout.type === 'multi-day' && newExercise.dayNumber !== undefined) {
        // Add to specific day in multi-day workout program
        const updatedDays = workout.days?.map(day => {
          if (day.dayNumber === newExercise.dayNumber) {
            return {
              ...day,
              isRestDay: false, // Convert rest day to workout day when adding exercise
              exercises: [
                ...day.exercises,
                {
                  exercise: { id: newExercise.exerciseId },
                  sets: newExercise.sets,
                  reps: newExercise.reps,
                  rest: newExercise.rest,
                  notes: newExercise.notes
                }
              ]
            }
          }
          return day
        }) || []

        const response = await fetch(`/api/workout-programs/${newExercise.workoutId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            days: updatedDays
          }),
        })

        if (response.ok) {
          await fetchWorkouts()
          const wasRestDay = workout.days?.find(d => d.dayNumber === newExercise.dayNumber)?.isRestDay
          setSuccessMessage(wasRestDay 
            ? 'Exercise added and rest day converted to workout day!' 
            : 'Exercise added to workout program successfully!')
          setShowExerciseForm(false)
          setNewExercise({
            name: "",
            category: "",
            sets: 3,
            reps: "10",
            rest: "60s",
            notes: "",
            videoUrl: "",
            exerciseId: undefined,
            workoutId: undefined,
            workoutType: undefined,
            dayNumber: undefined
          })
        } else {
          const errorData = await response.json()
          setError(errorData.error || 'Failed to add exercise to program')
        }
      }
    } catch (error) {
      console.error('Error adding exercise:', error)
      setError('Failed to add exercise')
    }
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please log in to view workouts</h1>
          <Link href="/auth/login">
            <Button>Login</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Workout Library</h1>
              <p className="mt-2 text-gray-600">Browse and manage your workout templates</p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowCSVImport(true)}
                variant="outline"
                className="flex items-center gap-2 border-gray-300 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              >
                <Upload className="h-4 w-4" />
                Import CSV
              </Button>
              <Link href="/create-workout">
                <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="h-4 w-4" />
                  Create Workout
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <Link
              href="/dashboard"
              className="flex items-center space-x-2 py-4 px-2 text-gray-600 hover:text-gray-900 hover:border-b-2 hover:border-red-600 transition-colors"
            >
              <Home className="h-4 w-4" />
              <span>Dashboard</span>
            </Link>
            <Link
              href="/create-workout"
              className="flex items-center space-x-2 py-4 px-2 text-gray-600 hover:text-gray-900 hover:border-b-2 hover:border-red-600 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Create Workout</span>
            </Link>
            <Link
              href="/clients"
              className="flex items-center space-x-2 py-4 px-2 text-gray-600 hover:text-gray-900 hover:border-b-2 hover:border-red-600 transition-colors"
            >
              <Users className="h-4 w-4" />
              <span>My Clients</span>
            </Link>
            <Link
              href="/exercises"
              className="flex items-center space-x-2 py-4 px-2 text-gray-600 hover:text-gray-900 hover:border-b-2 hover:border-red-600 transition-colors"
            >
              <Dumbbell className="h-4 w-4" />
              <span>Exercise Library</span>
            </Link>
            <Link
              href="/assign-workout"
              className="flex items-center space-x-2 py-4 px-2 text-gray-600 hover:text-gray-900 hover:border-b-2 hover:border-red-600 transition-colors"
            >
              <Calendar className="h-4 w-4" />
              <span>Assign Workout</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              <p className="text-green-800 font-medium">{successMessage}</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <XCircle className="h-5 w-5 text-red-600 mr-2" />
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Workouts Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading workouts...</p>
          </div>
        ) : workouts.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Dumbbell className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No workouts found</h3>
              <p className="text-gray-600 mb-6">Get started by creating your first workout</p>
              <Link href="/create-workout">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Workout
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workouts.map((workout) => (
              <div key={workout.id} className="space-y-3 relative group">
                <Card className="hover:shadow-lg transition-shadow h-full flex flex-col">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base leading-tight">{workout.name}</CardTitle>
                      <div className="flex space-x-2">
                        {workout.isPublic && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Public
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="min-h-[3rem]">
                      {workout.description ? (
                        <p className="text-sm text-gray-600 overflow-hidden" style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical'
                        }}>
                          {workout.description}
                        </p>
                      ) : (
                        <div className="h-6"></div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 flex-1 flex flex-col">
                    {/* Compact workout info */}
                    <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-500">Type:</span>
                        <span className="font-medium">
                          {workout.type === 'multi-day' ? `${workout.totalDays}d` : '1d'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-500">Level:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(workout.difficulty)}`}>
                          {workout.difficulty || 'N/A'}
                        </span>
                      </div>
                      {workout.type === 'single-day' ? (
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-500">Exercises:</span>
                          <span className="font-medium">{workout.exercises.length}</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-500">Days:</span>
                          <span className="font-medium">{workout.totalDays}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-500">Category:</span>
                        <span className="font-medium truncate">{workout.category || 'Custom'}</span>
                      </div>
                    </div>
                    
                    {/* Action buttons - always at bottom */}
                    <div className="mt-auto space-y-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => toggleWorkoutDetails(workout.id)}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        {expandedWorkouts.includes(workout.id) ? 'Hide Details' : 'View Details'}
                      </Button>
                      
                      <div className="flex space-x-2">
                        {(session.user.role === "TRAINER" || session.user.role === "ADMIN") && (
                          <Link href={`/assign-workout?workoutId=${workout.id}&type=${workout.type}`} className="flex-1">
                            <Button size="sm" className="w-full">
                              <Calendar className="h-4 w-4 mr-1" />
                              Assign
                            </Button>
                          </Link>
                        )}
                        {workout.creator && workout.creator.id === session.user.id && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteWorkout(workout.id, workout.type)}
                            className="text-red-600 border-red-200 hover:bg-red-50 px-3"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Full-screen Modal for Workout Details */}
                {expandedWorkouts.includes(workout.id) && (
                  <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden">
                      <div className="p-6 overflow-y-auto max-h-[95vh]">
                        {/* Header with inline edit controls */}
                        <div className="flex items-center justify-between mb-6">
                          {editingWorkout === workout.id ? (
                            <div className="flex-1 mr-4">
                              <Input
                                value={workoutUpdates[workout.id]?.name || workout.name}
                                onChange={(e) => updateWorkoutField(workout.id, 'name', e.target.value)}
                                className="font-semibold text-lg"
                                placeholder="Workout name..."
                              />
                            </div>
                          ) : (
                            <h3 className="text-xl font-semibold text-gray-900">{workout.name}</h3>
                          )}
                          
                          <div className="flex items-center space-x-3">
                            {workout.creator && workout.creator.id === session.user.id && (
                              <>
                                {editingWorkout === workout.id ? (
                                  <>
                                    <Button variant="outline" onClick={() => saveWorkoutChanges(workout.id)}>
                                      <Save className="h-4 w-4 mr-2" />
                                      Save
                                    </Button>
                                    <Button variant="outline" onClick={cancelEditingWorkout}>
                                      <X className="h-4 w-4 mr-2" />
                                      Cancel
                                    </Button>
                                  </>
                                ) : (
                                  <>
                                    <Button variant="outline" onClick={() => startEditingWorkout(workout.id)}>
                                      <Edit2 className="h-4 w-4 mr-2" />
                                      Edit
                                    </Button>
                                    <Button
                                      variant="outline"
                                      onClick={() => handleDeleteWorkout(workout.id, workout.type)}
                                      className="text-red-600 border-red-200 hover:bg-red-50"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete
                                    </Button>
                                  </>
                                )}
                              </>
                            )}
                            <Button 
                              variant="outline" 
                              onClick={() => toggleWorkoutDetails(workout.id)}
                              className="px-4"
                            >
                              <X className="h-4 w-4 mr-2" />
                              Close
                            </Button>
                          </div>
                        </div>

                        {/* Workout Content */}
                        {workout.type === 'single-day' ? (
                          <div>
                            {/* Quick stats */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                              <div className="text-center p-4 bg-blue-50 rounded-lg border">
                                <div className="text-lg font-bold text-blue-600">{workout.exercises.length}</div>
                                <div className="text-sm text-gray-600">Exercises</div>
                              </div>
                              <div className="text-center p-4 bg-green-50 rounded-lg border">
                                <div className="text-lg font-bold text-green-600">{workout.estimatedDuration || 0}</div>
                                <div className="text-sm text-gray-600">Minutes</div>
                              </div>
                              <div className="text-center p-4 bg-purple-50 rounded-lg border">
                                <div className="text-sm font-bold text-purple-600 break-words">{workout.difficulty}</div>
                                <div className="text-sm text-gray-600">Level</div>
                              </div>
                              <div className="text-center p-4 bg-orange-50 rounded-lg border">
                                <div className="text-lg font-bold text-orange-600">{workout.category || 'Custom'}</div>
                                <div className="text-sm text-gray-600">Category</div>
                              </div>
                            </div>

                            {/* Description */}
                            <div className="mb-6">
                              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                              {editingWorkout === workout.id ? (
                                <Textarea
                                  value={workoutUpdates[workout.id]?.description || workout.description || ''}
                                  onChange={(e) => updateWorkoutField(workout.id, 'description', e.target.value)}
                                  placeholder="Describe your workout..."
                                  className="text-sm"
                                  rows={3}
                                />
                              ) : (
                                <p className="text-sm text-gray-600 p-3 bg-gray-50 rounded border min-h-[80px] break-words">
                                  {workout.description || 'No description provided'}
                                </p>
                              )}
                            </div>

                            {/* Category and Difficulty */}
                            <div className="grid grid-cols-2 gap-4 mb-6">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                                {editingWorkout === workout.id ? (
                                  <select
                                    value={workoutUpdates[workout.id]?.category || workout.category || ''}
                                    onChange={(e) => updateWorkoutField(workout.id, 'category', e.target.value)}
                                    className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  >
                                    <option value="">Select category</option>
                                    <option value="Strength">Strength</option>
                                    <option value="Cardio">Cardio</option>
                                    <option value="HIIT">HIIT</option>
                                    <option value="Flexibility">Flexibility</option>
                                    <option value="Sports">Sports</option>
                                    <option value="Custom">Custom</option>
                                  </select>
                                ) : (
                                  <p className="text-sm text-gray-600 p-2 bg-gray-50 rounded border">
                                    {workout.category || 'Custom'}
                                  </p>
                                )}
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
                                {editingWorkout === workout.id ? (
                                  <select
                                    value={workoutUpdates[workout.id]?.difficulty || workout.difficulty || ''}
                                    onChange={(e) => updateWorkoutField(workout.id, 'difficulty', e.target.value)}
                                    className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  >
                                    <option value="">Select difficulty</option>
                                    <option value="BEGINNER">Beginner</option>
                                    <option value="INTERMEDIATE">Intermediate</option>
                                    <option value="ADVANCED">Advanced</option>
                                  </select>
                                ) : (
                                  <p className="text-sm text-gray-600 p-2 bg-gray-50 rounded border">
                                    {workout.difficulty || 'N/A'}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Exercises section */}
                            <div className="mb-6">
                              <div className="flex items-center justify-between mb-4">
                                <h4 className="font-medium text-gray-900 text-lg">Exercises ({workout.exercises.length})</h4>
                                {workout.creator && workout.creator.id === session.user.id && (
                                  <Button 
                                    size="sm"
                                    onClick={() => openAddExerciseForm(workout.id, workout.type)}
                                  >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Exercise
                                  </Button>
                                )}
                              </div>
                              
                              {workout.exercises.length === 0 ? (
                                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border">
                                  <Dumbbell className="h-8 w-8 mx-auto mb-2 text-gray-500" />
                                  <p>No exercises added yet</p>
                                  {workout.creator && workout.creator.id === session.user.id && (
                                    <Button 
                                      size="sm" 
                                      className="mt-2"
                                      onClick={() => openAddExerciseForm(workout.id, workout.type)}
                                    >
                                      <Plus className="h-4 w-4 mr-2" />
                                      Add Your First Exercise
                                    </Button>
                                  )}
                                </div>
                              ) : (
                                <div className="space-y-4">
                                  {workout.exercises.map((exercise, index) => (
                                    <div key={index} className="p-4 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors">
                                      <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0">
                                          <div className="font-semibold text-gray-900 text-base mb-2">{exercise.exercise.name}</div>
                                          <div className="space-y-3">
                                            {editingExercise === `${workout.id}-${index}` ? (
                                              <div className="space-y-3">
                                                <div className="grid grid-cols-3 gap-3">
                                                  <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1">Sets</label>
                                                    <input
                                                      type="number"
                                                      id={`sets-${workout.id}-${index}`}
                                                      defaultValue={exercise.sets}
                                                      min="1"
                                                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                                    />
                                                  </div>
                                                  <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1">Reps</label>
                                                    <input
                                                      type="text"
                                                      id={`reps-${workout.id}-${index}`}
                                                      defaultValue={exercise.reps}
                                                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                                      placeholder="e.g., 10 or 8-12"
                                                    />
                                                  </div>
                                                  <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1">Rest</label>
                                                    <input
                                                      type="text"
                                                      id={`rest-${workout.id}-${index}`}
                                                      defaultValue={exercise.rest}
                                                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                                      placeholder="e.g., 60s or 2min"
                                                    />
                                                  </div>
                                                </div>
                                              </div>
                                            ) : (
                                              <div className="flex flex-wrap gap-3">
                                                <span className="inline-flex items-center bg-blue-100 text-blue-800 px-3 py-2 rounded-lg text-sm font-medium">
                                                  <strong>{exercise.sets}</strong> × <strong>{exercise.reps}</strong>
                                                </span>
                                                {exercise.rest && (
                                                  <span className="inline-flex items-center bg-green-100 text-green-800 px-3 py-2 rounded-lg text-sm font-medium">
                                                    Rest: {exercise.rest}
                                                  </span>
                                                )}
                                              </div>
                                            )}
                                            {exercise.notes && (
                                              <div className="text-green-800 bg-green-50 p-3 rounded-lg border text-sm break-words">
                                                <span className="font-medium text-green-900">Notes:</span> {exercise.notes}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        {workout.creator && workout.creator.id === session.user.id && (
                                          <div className="flex items-center space-x-2 ml-4">
                                            {editingExercise === `${workout.id}-${index}` ? (
                                              <>
                                                <Button 
                                                  size="sm" 
                                                  variant="outline"
                                                  onClick={() => saveExerciseChanges(workout.id, index)}
                                                  className="text-green-600 border-green-200 hover:bg-green-50"
                                                >
                                                  <CheckCircle className="h-4 w-4" />
                                                </Button>
                                                <Button 
                                                  size="sm" 
                                                  variant="outline"
                                                  onClick={() => cancelExerciseEdit()}
                                                >
                                                  <X className="h-4 w-4" />
                                                </Button>
                                              </>
                                            ) : (
                                              <>
                                                <Button 
                                                  size="sm" 
                                                  variant="outline"
                                                  onClick={() => startEditingExercise(workout.id, index)}
                                                >
                                                  <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button 
                                                  size="sm" 
                                                  variant="outline"
                                                  onClick={() => removeExercise(workout.id, index)}
                                                  className="text-red-600 border-red-200 hover:bg-red-50"
                                                >
                                                  <Trash2 className="h-4 w-4" />
                                                </Button>
                                              </>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div>
                            {/* Multi-day program stats */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                              <div className="text-center p-4 bg-blue-50 rounded-lg border">
                                <div className="text-lg font-bold text-blue-600">{workout.totalDays}</div>
                                <div className="text-sm text-gray-600">Days</div>
                              </div>
                              <div className="text-center p-4 bg-green-50 rounded-lg border">
                                <div className="text-sm font-bold text-green-600 break-words">{workout.difficulty}</div>
                                <div className="text-sm text-gray-600">Level</div>
                              </div>
                              <div className="text-center p-4 bg-purple-50 rounded-lg border">
                                <div className="text-lg font-bold text-purple-600">{workout.category || 'Custom'}</div>
                                <div className="text-sm text-gray-600">Category</div>
                              </div>
                              <div className="text-center p-4 bg-orange-50 rounded-lg border">
                                <div className="text-lg font-bold text-orange-600">Program</div>
                                <div className="text-sm text-gray-600">Type</div>
                              </div>
                            </div>

                            {/* Description */}
                            <div className="mb-6">
                              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                              {editingWorkout === workout.id ? (
                                <Textarea
                                  value={workoutUpdates[workout.id]?.description || workout.description || ''}
                                  onChange={(e) => updateWorkoutField(workout.id, 'description', e.target.value)}
                                  placeholder="Describe your workout program..."
                                  className="text-sm"
                                  rows={3}
                                />
                              ) : (
                                <p className="text-sm text-gray-600 p-3 bg-gray-50 rounded border min-h-[80px] break-words">
                                  {workout.description || 'No description provided'}
                                </p>
                              )}
                            </div>

                            {/* Category and Difficulty */}
                            <div className="grid grid-cols-2 gap-4 mb-6">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                                {editingWorkout === workout.id ? (
                                  <select
                                    value={workoutUpdates[workout.id]?.category || workout.category || ''}
                                    onChange={(e) => updateWorkoutField(workout.id, 'category', e.target.value)}
                                    className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  >
                                    <option value="">Select category</option>
                                    <option value="Strength">Strength</option>
                                    <option value="Cardio">Cardio</option>
                                    <option value="HIIT">HIIT</option>
                                    <option value="Flexibility">Flexibility</option>
                                    <option value="Sports">Sports</option>
                                    <option value="Custom">Custom</option>
                                  </select>
                                ) : (
                                  <p className="text-sm text-gray-600 p-2 bg-gray-50 rounded border">
                                    {workout.category || 'Custom'}
                                  </p>
                                )}
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
                                {editingWorkout === workout.id ? (
                                  <select
                                    value={workoutUpdates[workout.id]?.difficulty || workout.difficulty || ''}
                                    onChange={(e) => updateWorkoutField(workout.id, 'difficulty', e.target.value)}
                                    className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  >
                                    <option value="">Select difficulty</option>
                                    <option value="BEGINNER">Beginner</option>
                                    <option value="INTERMEDIATE">Intermediate</option>
                                    <option value="ADVANCED">Advanced</option>
                                  </select>
                                ) : (
                                  <p className="text-sm text-gray-600 p-2 bg-gray-50 rounded border">
                                    {workout.difficulty || 'N/A'}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Workout Days */}
                            <div className="mb-6">
                              <div className="flex items-center justify-between mb-4">
                                <h4 className="font-medium text-gray-900 text-lg">Workout Days ({workout.totalDays})</h4>
                              </div>
                              
                              {/* Check if workout has days data */}
                              {workout.days && workout.days.length > 0 ? (
                                <div className="space-y-4">
                                  {workout.days.map((day, dayIndex) => (
                                    <div key={day.dayNumber} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                      <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center space-x-3">
                                          <h5 className="font-semibold text-gray-900">
                                            Day {day.dayNumber}: {day.name || `Workout ${day.dayNumber}`}
                                          </h5>
                                          {day.isRestDay && (
                                            <span className="inline-flex items-center bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                                              Rest Day
                                            </span>
                                          )}
                                        </div>
                                        {!day.isRestDay && day.estimatedDuration && (
                                          <span className="text-sm text-gray-600">
                                            {day.estimatedDuration} min
                                          </span>
                                        )}
                                      </div>

                                      {!day.isRestDay && day.exercises && day.exercises.length > 0 ? (
                                        <div className="space-y-3">
                                          <div className="flex items-center justify-between mb-3">
                                            <h6 className="font-medium text-gray-700">Exercises ({day.exercises.length})</h6>
                                            {workout.creator && workout.creator.id === session.user.id && (
                                              <Button 
                                                size="sm" 
                                                variant="outline"
                                                onClick={() => openAddExerciseForm(workout.id, workout.type, day.dayNumber)}
                                              >
                                                <Plus className="h-4 w-4 mr-2" />
                                                Add Exercise
                                              </Button>
                                            )}
                                          </div>
                                          {day.exercises.map((exercise, exerciseIndex) => (
                                            <div key={exerciseIndex} className="p-3 bg-white rounded-lg border hover:bg-gray-50 transition-colors">
                                              <div className="flex items-start justify-between">
                                                <div className="flex-1 min-w-0">
                                                  <div className="font-semibold text-gray-900 text-base mb-2">
                                                    {exercise.exercise.name}
                                                  </div>
                                                  <div className="space-y-3">
                                                    {editingExercise === `${workout.id}-${day.dayNumber}-${exerciseIndex}` ? (
                                                      <div className="space-y-3">
                                                        <div className="grid grid-cols-3 gap-3">
                                                          <div>
                                                            <label className="block text-xs font-medium text-gray-700 mb-1">Sets</label>
                                                            <input
                                                              type="number"
                                                              id={`sets-${workout.id}-${day.dayNumber}-${exerciseIndex}`}
                                                              defaultValue={exercise.sets}
                                                              min="1"
                                                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                                            />
                                                          </div>
                                                          <div>
                                                            <label className="block text-xs font-medium text-gray-700 mb-1">Reps</label>
                                                            <input
                                                              type="text"
                                                              id={`reps-${workout.id}-${day.dayNumber}-${exerciseIndex}`}
                                                              defaultValue={exercise.reps}
                                                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                                              placeholder="e.g., 10 or 8-12"
                                                            />
                                                          </div>
                                                          <div>
                                                            <label className="block text-xs font-medium text-gray-700 mb-1">Rest</label>
                                                            <input
                                                              type="text"
                                                              id={`rest-${workout.id}-${day.dayNumber}-${exerciseIndex}`}
                                                              defaultValue={exercise.rest}
                                                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                                              placeholder="e.g., 60s or 2min"
                                                            />
                                                          </div>
                                                        </div>
                                                      </div>
                                                    ) : (
                                                      <div className="flex flex-wrap gap-3">
                                                        <span className="inline-flex items-center bg-blue-100 text-blue-800 px-3 py-2 rounded-lg text-sm font-medium">
                                                          <strong>{exercise.sets}</strong> × <strong>{exercise.reps}</strong>
                                                        </span>
                                                        {exercise.rest && (
                                                          <span className="inline-flex items-center bg-green-100 text-green-800 px-3 py-2 rounded-lg text-sm font-medium">
                                                            Rest: {exercise.rest}
                                                          </span>
                                                        )}
                                                      </div>
                                                    )}
                                                    {exercise.notes && (
                                                      <div className="text-green-800 bg-green-50 p-3 rounded-lg border text-sm break-words">
                                                        <span className="font-medium text-green-900">Notes:</span> {exercise.notes}
                                                      </div>
                                                    )}
                                                  </div>
                                                </div>
                                                {workout.creator && workout.creator.id === session.user.id && (
                                                  <div className="flex items-center space-x-2 ml-4">
                                                    {editingExercise === `${workout.id}-${day.dayNumber}-${exerciseIndex}` ? (
                                                      <>
                                                        <Button 
                                                          size="sm" 
                                                          variant="outline"
                                                          onClick={() => saveExerciseChanges(workout.id, exerciseIndex, day.dayNumber)}
                                                          className="text-green-600 border-green-200 hover:bg-green-50"
                                                        >
                                                          <CheckCircle className="h-4 w-4" />
                                                        </Button>
                                                        <Button 
                                                          size="sm" 
                                                          variant="outline"
                                                          onClick={() => cancelExerciseEdit()}
                                                        >
                                                          <X className="h-4 w-4" />
                                                        </Button>
                                                      </>
                                                    ) : (
                                                      <>
                                                        <Button 
                                                          size="sm" 
                                                          variant="outline"
                                                          onClick={() => startEditingExercise(workout.id, exerciseIndex, day.dayNumber)}
                                                        >
                                                          <Edit2 className="h-4 w-4" />
                                                        </Button>
                                                        <Button 
                                                          size="sm" 
                                                          variant="outline"
                                                          onClick={() => removeExerciseFromProgram(workout.id, day.dayNumber, exerciseIndex)}
                                                          className="text-red-600 border-red-200 hover:bg-red-50"
                                                        >
                                                          <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                      </>
                                                    )}
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      ) : !day.isRestDay ? (
                                        <div className="text-center py-4 text-gray-500 bg-white rounded-lg border">
                                          <p>No exercises added for this day</p>
                                          {workout.creator && workout.creator.id === session.user.id && (
                                            <Button 
                                              size="sm" 
                                              className="mt-2"
                                              onClick={() => openAddExerciseForm(workout.id, workout.type, day.dayNumber)}
                                            >
                                              <Plus className="h-4 w-4 mr-2" />
                                              Add Exercise to Day {day.dayNumber}
                                            </Button>
                                          )}
                                        </div>
                                      ) : (
                                        <div className="text-center py-4 text-gray-500 bg-white rounded-lg border">
                                          <Bed className="h-6 w-6 mx-auto mb-2 text-gray-500" />
                                          <p>Rest Day</p>
                                          {day.notes && (
                                            <p className="text-sm mt-2">{day.notes}</p>
                                          )}
                                          {workout.creator && workout.creator.id === session.user.id && (
                                            <Button 
                                              size="sm" 
                                              className="mt-2"
                                              onClick={() => openAddExerciseForm(workout.id, workout.type, day.dayNumber)}
                                            >
                                              <Plus className="h-4 w-4 mr-2" />
                                              Add Exercise to Rest Day
                                            </Button>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border">
                                  <FileText className="h-8 w-8 mx-auto mb-2 text-gray-500" />
                                  <p>Program structure not loaded</p>
                                  <p className="text-sm mt-1">Click "Edit Program" to view and modify the workout days</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Add Exercise Form - Popup Panel */}
      {showExerciseForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-white shadow-2xl">
            <CardHeader className="bg-gray-50 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">
                  Add Exercise to {newExercise.workoutType === 'single-day' ? 'Workout' : `Day ${newExercise.dayNumber} of Program`}
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
                            ...newExercise,
                            name: exercise.name,
                            category: exercise.category || "General",
                            exerciseId: exercise.id
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
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Video URL (YouTube)
                      </label>
                      <input
                        type="url"
                        value={newExercise.videoUrl || ''}
                        onChange={(e) => setNewExercise({ ...newExercise, videoUrl: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="https://youtube.com/watch?v=..."
                      />
                      <p className="text-xs text-gray-500 mt-1">Optional: Link to demonstration video</p>
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
                  onClick={addExerciseToWorkout}
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

      {/* CSV Import Modal */}
      {showCSVImport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <WorkoutCSVImport
            onImport={handleCSVImport}
            onCancel={() => setShowCSVImport(false)}
          />
        </div>
      )}
      

    </div>
  )
}

