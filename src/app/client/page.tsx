"use client"

import { useState, useEffect, useMemo } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, User, Target, CheckCircle, XCircle, Dumbbell, CalendarDays, LogOut, ChevronLeft, ChevronRight, X } from "lucide-react"
import Link from "next/link"

interface Exercise {
  id: string
  exercise: {
    id: string
    name: string
    description: string
    category: string
    difficulty: string
    videoUrl?: string
    instructions?: string
  }
  sets: number
  reps: string
  rest?: string
  duration?: number
  weight?: number
  order: number
}

interface WorkoutAssignment {
  id: string
  scheduledDate: string
  status: string
  notes?: string
  workout?: {
    name: string
    description?: string
    exercises: Exercise[]
    estimatedDuration: number
    difficulty: string
  }
  // Additional properties for expanded program day assignments
  programDay?: number
  program?: any
  specificDay?: any
}

interface WorkoutProgramAssignment {
  id: string
  startDate: string
  status: string
  notes?: string
  program?: {
    name: string
    description?: string
    totalDays: number
    difficulty: string
    days: {
      id: string
      dayNumber: number
      exercises: Exercise[]
      estimatedDuration: number
    }[]
  }
  // Additional properties for expanded program day assignments
  workout?: {
    name: string
    description?: string
    exercises: Exercise[]
    estimatedDuration: number
    difficulty: string
  }
  programDay?: number
  specificDay?: any
}

type Assignment = WorkoutAssignment | WorkoutProgramAssignment

export default function ClientPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [selectedWorkout, setSelectedWorkout] = useState<Assignment | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  // Helper function to extract YouTube video ID from URL
  const getYouTubeVideoId = (url: string): string | null => {
    if (!url) return null
    
    // Handle different YouTube URL formats
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/v\/([^&\n?#]+)/,
      /youtube\.com\/watch\?.*v=([^&\n?#]+)/
    ]
    
    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) return match[1]
    }
    
    return null
  }

  useEffect(() => {
    if (status === "loading") return
    
    if (!session?.user) {
      router.push("/auth/login")
      return
    }

    if (session.user.role !== "CLIENT") {
      router.push("/dashboard")
      return
    }
    
    fetchAssignments()
  }, [session, status, router])

  const fetchAssignments = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      console.log("🔍 Fetching assignments for client:", session.user.id)
      
      // Fetch both workout assignments and workout program assignments for the current client
      // Include clientId parameter to ensure we get the full data with program days
      const [workoutResponse, programResponse] = await Promise.all([
        fetch(`/api/workouts/assign?clientId=${session.user.id}`, {
          credentials: 'include'
        }),
        fetch(`/api/workout-programs/assign?clientId=${session.user.id}`, {
          credentials: 'include'
        })
      ])
      
      console.log("📊 API Responses:", {
        workout: { status: workoutResponse.status, ok: workoutResponse.ok },
        program: { status: programResponse.status, ok: programResponse.ok }
      })
      
      if (workoutResponse.ok && programResponse.ok) {
        const workoutData = await workoutResponse.json()
        const programData = await programResponse.json()
        
        console.log("📋 Raw workout data:", workoutData)
        console.log("📋 Raw program data:", programData)
        
        // Filter assignments for the current client
        const clientWorkoutAssignments = workoutData.assignments.filter((assignment: any) => 
          assignment.clientId === session?.user?.id
        )
        
        const clientProgramAssignments = programData.assignments.filter((assignment: any) => 
          assignment.clientId === session?.user?.id
        )
        
        console.log("👤 Filtered assignments:", {
          workouts: clientWorkoutAssignments.length,
          programs: clientProgramAssignments.length
        })
        
        // Transform program assignments to create individual day assignments
        const expandedProgramAssignments = clientProgramAssignments.flatMap((prog: any) => {
          if (!prog.program?.days || !prog.program.totalDays) {
            console.log("⚠️ Program missing days or totalDays:", prog)
            return []
          }
          
          // Create individual assignments for each day of the program
          const dayAssignments = []
          for (let dayIndex = 0; dayIndex < prog.program.totalDays; dayIndex++) {
            const dayNumber = dayIndex + 1
            const programDay = prog.program.days.find((d: any) => d.dayNumber === dayNumber)
            
            // Calculate the date for this day - use timestamp addition for reliability
            // dayIndex is 0-based, so Day 1 = +0 days, Day 2 = +1 day, Day 3 = +2 days
            const startDate = new Date(prog.startDate)
            const dayDate = new Date(startDate.getTime() + (dayIndex * 24 * 60 * 60 * 1000))
            
            // Debug: Log the exact calculation details
            console.log(`🔍 Date calculation for ${prog.program.name}:`, {
              originalStartDate: prog.startDate,
              parsedStartDate: startDate.toISOString(),
              dayIndex,
              dayNumber,
              calculatedDayDate: dayDate.toISOString(),
              finalDateString: dateToDateString(dayDate)
            })
            
            // Create a virtual assignment for this specific day
            const dayAssignment = {
              id: `${prog.id}-day-${dayNumber}`, // Unique ID for each day
              originalId: prog.id, // Keep track of original assignment
              scheduledDate: dateToDateString(dayDate) + 'T00:00:00.000Z',
              status: prog.status,
              notes: prog.notes,
              programDay: dayNumber,
              program: prog.program,
              specificDay: programDay,
              workout: programDay ? {
                name: `${prog.program.name} - Day ${dayNumber}`,
                description: prog.program.description,
                exercises: programDay.exercises || [],
                estimatedDuration: programDay.estimatedDuration || 0,
                difficulty: prog.program.difficulty
              } : null
            }
            
            dayAssignments.push(dayAssignment)
          }
          
          return dayAssignments
        })
        
        // Combine workout assignments with expanded program day assignments
        const allAssignments = [
          ...clientWorkoutAssignments,
          ...expandedProgramAssignments
        ]
        
        console.log("✅ Final combined assignments:", allAssignments.length)
        setAssignments(allAssignments)
      } else {
        // Get detailed error information
        let errorDetails = 'Failed to fetch assignments'
        
        if (!workoutResponse.ok) {
          const workoutError = await workoutResponse.text()
          errorDetails += `\nWorkout API: ${workoutResponse.status} - ${workoutError}`
          console.error("❌ Workout API error:", workoutResponse.status, workoutError)
        }
        
        if (!programResponse.ok) {
          const programError = await programResponse.text()
          errorDetails += `\nProgram API: ${programResponse.status} - ${programError}`
          console.error("❌ Program API error:", programResponse.status, programError)
        }
        
        setError(errorDetails)
      }
    } catch (error) {
      console.error('❌ Network error fetching assignments:', error)
      setError(`Network error: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsLoading(false)
    }
  }

  const getWeekDates = (date: Date) => {
    const startOfWeek = new Date(date)
    startOfWeek.setDate(date.getDate() - date.getDay())
    
    const weekDates = []
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek)
      day.setDate(startOfWeek.getDate() + i)
      weekDates.push(day)
    }
    return weekDates
  }

  // Helper function to convert Date object to date string without timezone issues
  const dateToDateString = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    
    return `${year}-${month}-${day}`
  }

  const getAssignmentsForDate = (date: Date) => {
    const dateStr = dateToDateString(date)
    
    return assignments.filter(assignment => {
      if ('scheduledDate' in assignment) {
        // Both single workouts and expanded program day assignments use scheduledDate
        return assignment.scheduledDate.startsWith(dateStr)
      }
      return false
    })
  }

  const previousWeek = () => {
    setCurrentWeek(prev => {
      const newDate = new Date(prev)
      newDate.setDate(prev.getDate() - 7)
      return newDate
    })
  }

  const nextWeek = () => {
    setCurrentWeek(prev => {
      const newDate = new Date(prev)
      newDate.setDate(prev.getDate() + 7)
      return newDate
    })
  }

  const selectWorkout = (assignment: Assignment, clickedDate?: Date) => {
    setSelectedWorkout(assignment)
    if (clickedDate) {
      setSelectedDate(clickedDate)
    }
  }

  // All hooks must be called before any conditional returns
  const weekDates = useMemo(() => getWeekDates(currentWeek), [currentWeek])
  const weekStart = weekDates[0]
  const weekEnd = weekDates[6]
  const weekRange = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`

  // Show loading while checking authentication
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-500 mx-auto"></div>
          <p className="mt-4 text-gray-300 text-xl">Loading...</p>
        </div>
      </div>
    )
  }

  // Redirect if not authenticated
  if (status === "unauthenticated") {
    router.push('/')
    return null
  }

  // Redirect if not a client
  if (session?.user?.role !== "CLIENT") {
    router.push('/dashboard')
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Header */}
      <div className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Dumbbell className="h-8 w-8 text-red-500" />
                <span className="text-2xl font-bold text-white">
                  <span className="text-red-500">Whatever</span>Fit
                </span>
              </div>
              <span className="text-sm text-gray-300">Welcome, {session.user.name}!</span>
              <Button onClick={signOut} variant="outline" size="sm" className="bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white hover:border-gray-500 transition-all duration-200">
                <LogOut className="h-4 w-4 mr-2" />
                Log Out
              </Button>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button onClick={fetchAssignments} variant="outline" size="sm" className="bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white hover:border-gray-500 transition-all duration-200">
                <Calendar className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-lg backdrop-blur-sm">
            <div className="flex items-center">
              <XCircle className="h-5 w-5 text-red-400 mr-2" />
              <p className="text-red-200">{error}</p>
            </div>
          </div>
        )}

        {/* Week Navigation */}
        <div className="flex items-center justify-between mb-8">
          <Button onClick={previousWeek} variant="outline" size="sm" className="bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white hover:border-gray-500 transition-all duration-200">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous Week
          </Button>
          <h2 className="text-lg font-semibold text-white">Week of {weekRange}</h2>
          <Button onClick={nextWeek} variant="outline" size="sm" className="bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white hover:border-gray-500 transition-all duration-200">
            Next Week
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>

        {/* Weekly Schedule */}
        {isLoading ? (
                      <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
              <p className="text-gray-300 text-base">Loading your workouts...</p>
            </div>
        ) : (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
             {weekDates.map((date, index) => {
               const dayAssignments = getAssignmentsForDate(date)
               const isToday = date.toDateString() === new Date().toDateString()
               
               return (
                                 <Card key={`${dateToDateString(date)}-${index}`} className={`${isToday ? 'ring-2 ring-red-500' : ''} bg-gray-800/50 border-gray-700 backdrop-blur-sm hover:bg-gray-800/70 transition-all duration-200 min-h-[160px]`}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xs text-center text-white font-medium">
                      {date.toLocaleDateString('en-US', { weekday: 'short' })}
                    </CardTitle>
                    <p className="text-xs text-center text-gray-400">
                      {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </CardHeader>
                  <CardContent className="pt-0 px-3">
                    {dayAssignments.length > 0 ? (
                      <div className="space-y-3">
                        {dayAssignments.map((assignment, idx) => (
                          <div key={idx}>
                            {('workout' in assignment && assignment.workout) ? (
                              assignment.workout.exercises?.length > 0 ? (
                                <Button
                                  onClick={() => selectWorkout(assignment, date)}
                                  variant="outline"
                                  size="sm"
                                  className={`w-full text-left h-auto p-4 min-h-[80px] transition-all duration-200 ${
                                    assignment.programDay 
                                      ? 'bg-green-900/20 border-green-500/30 hover:bg-green-900/40 hover:border-green-500/50 text-green-200' 
                                      : 'bg-blue-900/20 border-blue-500/30 hover:bg-blue-900/40 hover:border-blue-500/50 text-blue-200'
                                  }`}
                                >
                                  <div className="space-y-2">
                                    <div className={`font-medium leading-tight ${
                                      assignment.programDay ? 'text-green-200' : 'text-blue-200'
                                    } ${assignment.workout.name.length > 25 ? 'text-[8px]' : assignment.workout.name.length > 20 ? 'text-[9px]' : assignment.workout.name.length > 15 ? 'text-[10px]' : 'text-xs'}`}>
                                      {assignment.workout.name}
                                    </div>
                                    <div className={`leading-tight ${
                                      assignment.programDay ? 'text-green-300' : 'text-blue-300'
                                    } text-[9px]`}>
                                      {assignment.workout.exercises?.length || 0} exercises
                                    </div>
                                    {assignment.workout.estimatedDuration > 0 && (
                                      <div className={`leading-tight ${
                                        assignment.programDay ? 'text-green-400' : 'text-blue-400'
                                      } text-[9px]`}>
                                        {assignment.workout.estimatedDuration} min
                                      </div>
                                    )}
                                  </div>
                                </Button>
                              ) : (
                                // Rest day for program days with no exercises
                                <div className="text-center text-gray-400 text-xs py-4 bg-gray-700/20 rounded border-2 border-dashed border-gray-600">
                                  Rest Day
                                </div>
                              )
                            ) : null}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-gray-400 text-xs py-4">
                        Rest day
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
        )}

        {/* Summary Stats */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm hover:bg-gray-800/70 transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-red-500" />
                <div className="ml-4">
                  <p className="text-xs font-medium text-gray-400">Total Assignments</p>
                  <p className="text-lg font-bold text-white">{assignments.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm hover:bg-gray-800/70 transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Dumbbell className="h-8 w-8 text-green-500" />
                <div className="ml-4">
                  <p className="text-xs font-medium text-gray-400">Active Workouts</p>
                  <p className="text-lg font-bold text-white">
                    {assignments.filter(a => a.status === "ACTIVE").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm hover:bg-gray-800/70 transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-purple-500" />
                <div className="ml-4">
                  <p className="text-xs font-medium text-gray-400">Completed</p>
                  <p className="text-lg font-bold text-white">
                    {assignments.filter(a => a.status === "COMPLETED").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Workout Details */}
        {selectedWorkout && (
          <div className="mt-12 bg-gray-800/50 rounded-xl border border-gray-700 backdrop-blur-sm p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Workout Details</h3>
            </div>
            
            {/* Show workout details - only for individual workouts, not program workouts */}
            {('workout' in selectedWorkout && selectedWorkout.workout && !(selectedWorkout as any)?.program) && (
              <div className="space-y-6">
                {selectedWorkout.workout.description && (
                  <div>
                    <h4 className="font-medium text-white mb-2 text-base">Description</h4>
                    <p className="text-gray-300 text-sm">{selectedWorkout.workout.description}</p>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="flex items-center space-x-3">
                    <Clock className="h-6 w-6 text-red-500" />
                    <span className="text-gray-300 text-sm">
                      {selectedWorkout.workout.estimatedDuration} minutes
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Target className="h-6 w-6 text-red-500" />
                    <span className="text-gray-300 text-sm">
                      {selectedWorkout.workout.difficulty}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Show program details - only for program workouts */}
            {((selectedWorkout as any)?.program || (selectedWorkout as any)?.specificDay) && (
              <div className="space-y-6">
                {(selectedWorkout as any).program?.description && (
                  <div>
                    <h4 className="font-medium text-white mb-2 text-base">Description</h4>
                    <p className="text-gray-300 text-sm">{(selectedWorkout as any).program.description}</p>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="flex items-center space-x-3">
                    <CalendarDays className="h-6 w-6 text-green-500" />
                    <span className="text-gray-300 text-sm">
                      {(selectedWorkout as any).program?.totalDays || 1} days program
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Target className="h-6 w-6 text-green-500" />
                    <span className="text-gray-300 text-sm">
                      {(selectedWorkout as any).program?.difficulty}
                    </span>
                  </div>
                </div>
                
                {/* Show which specific day this is */}
                {(selectedWorkout as any)?.programDay && (
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-6 w-6 text-green-500" />
                    <span className="text-base font-medium text-green-400">
                      Day {(selectedWorkout as any).programDay} of {(selectedWorkout as any).program.totalDays}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Trainer Notes */}
            {selectedWorkout.notes && (
              <div className="mt-6">
                <h4 className="font-medium text-white mb-2 text-base">Trainer Notes</h4>
                <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3 backdrop-blur-sm">
                  <p className="text-yellow-200 text-sm">{selectedWorkout.notes}</p>
                </div>
              </div>
            )}

            {/* Exercises */}
            <div className="mt-8">
              <h4 className="font-medium text-white mb-4 text-lg">Exercises</h4>
              <div className="space-y-4">
                {('workout' in selectedWorkout && selectedWorkout.workout?.exercises) ? (
                  // For single workouts, show all exercises
                                    selectedWorkout.workout.exercises.length > 0 ? (
                    selectedWorkout.workout.exercises.map((exercise, index) => (
                      <Card key={exercise.id} className="bg-gray-700/50 border-gray-600 backdrop-blur-sm hover:bg-gray-700/70 transition-all duration-200">
                        <CardContent className="p-6">
                          <div className="flex items-start space-x-4">
                            <div className="flex-1">
                              <h5 className="font-medium mb-2 text-white text-base">
                                {index + 1}. {exercise.exercise.name}
                              </h5>
                              <p className="text-gray-300 mb-2 text-sm">
                                {exercise.exercise.description}
                              </p>
                              <div className="flex items-center space-x-6 text-sm text-gray-400">
                                <span>Sets: {exercise.sets}</span>
                                <span>Reps: {exercise.reps}</span>
                                {exercise.rest && <span>Rest: {exercise.rest}</span>}
                                {exercise.duration && <span>Duration: {exercise.duration}s</span>}
                                {exercise.weight && <span>Weight: {exercise.weight}kg</span>}
                              </div>
                              
                              {/* Exercise Instructions */}
                              {exercise.exercise.instructions && (
                                <div className="mt-3 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                                  <h6 className="text-sm font-medium text-blue-200 mb-2">Instructions:</h6>
                                  <p className="text-sm text-blue-100 leading-relaxed">{exercise.exercise.instructions}</p>
                                </div>
                              )}
                              
                              {/* Video Embedding */}
                              {exercise.exercise.videoUrl && getYouTubeVideoId(exercise.exercise.videoUrl) && (
                                <div className="mt-4">
                                  <h6 className="text-sm font-medium text-gray-300 mb-2">How to perform:</h6>
                                  <div className="relative w-1/2" style={{ paddingBottom: '28.125%' }}>
                                    <iframe
                                      className="absolute top-0 left-0 w-full h-full rounded-lg"
                                      src={`https://www.youtube.com/embed/${getYouTubeVideoId(exercise.exercise.videoUrl)}`}
                                      title={`${exercise.exercise.name} demonstration`}
                                      frameBorder="0"
                                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                      allowFullScreen
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                            <Badge variant="outline" className="text-xs border-gray-600 text-gray-300">
                              {exercise.exercise.category}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <p className="text-gray-400 text-center py-6 text-base">No exercises found</p>
                  )
                ) : (selectedWorkout as any)?.programDay ? (
                  // For program day assignments, the workout data is already day-specific
                  (() => {
                    const dayExercises = selectedWorkout.workout?.exercises || []
                    const dayDuration = selectedWorkout.workout?.estimatedDuration || 0
                    const dayNumber = (selectedWorkout as any).programDay
                    
                    if (dayExercises.length > 0) {
                      return (
                        <div>
                          <div className="mb-6 p-4 bg-green-900/20 border border-green-500/30 rounded-lg backdrop-blur-sm">
                            <h5 className="font-medium text-green-200 text-base">
                              Day {dayNumber} - {dayExercises.length} exercises
                              {dayDuration > 0 && (
                                <span className="text-xs text-green-300 ml-2">
                                  ({dayDuration} min)
                                </span>
                              )}
                            </h5>
                          </div>
                          {dayExercises.map((exercise: Exercise, index: number) => (
                            <Card key={exercise.id} className="bg-gray-700/50 border-gray-600 backdrop-blur-sm hover:bg-gray-700/70 transition-all duration-200">
                              <CardContent className="p-6">
                                <div className="flex items-start space-x-4">
                                  <div className="flex-1">
                                    <h5 className="font-medium mb-2 text-white text-base">
                                      {index + 1}. {exercise.exercise.name}
                                    </h5>
                                    <p className="text-gray-300 mb-2 text-sm">
                                      {exercise.exercise.description}
                                    </p>
                                    <div className="flex items-center space-x-6 text-sm text-gray-400">
                                      <span>Sets: {exercise.sets}</span>
                                      <span>Reps: {exercise.reps}</span>
                                      {exercise.rest && <span>Rest: {exercise.rest}</span>}
                                      {exercise.duration && <span>Duration: {exercise.duration}s</span>}
                                      {exercise.weight && <span>Weight: {exercise.weight}kg</span>}
                                    </div>
                                    
                                    {/* Exercise Instructions */}
                                    {exercise.exercise.instructions && (
                                      <div className="mt-3 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                                        <h6 className="text-sm font-medium text-blue-200 mb-2">Instructions:</h6>
                                        <p className="text-sm text-blue-100 leading-relaxed">{exercise.exercise.instructions}</p>
                                      </div>
                                    )}
                                    
                                    {/* Video Embedding */}
                                    {exercise.exercise.videoUrl && getYouTubeVideoId(exercise.exercise.videoUrl) && (
                                      <div className="mt-4">
                                        <h6 className="text-sm font-medium text-gray-300 mb-2">How to perform:</h6>
                                        <div className="relative w-1/2" style={{ paddingBottom: '28.125%' }}>
                                          <iframe
                                            className="absolute top-0 left-0 w-full h-full rounded-lg"
                                            src={`https://www.youtube.com/embed/${getYouTubeVideoId(exercise.exercise.videoUrl)}`}
                                            title={`${exercise.exercise.name} demonstration`}
                                            frameBorder="0"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                          />
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  <Badge variant="outline" className="text-xs border-gray-600 text-gray-300">
                                    {exercise.exercise.category}
                                  </Badge>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )
                    } else {
                      // Rest day
                      return (
                        <div className="text-center py-12">
                          <div className="text-gray-400 mb-4">
                            <Calendar className="h-16 w-16 mx-auto" />
                          </div>
                          <h5 className="text-lg font-medium text-white mb-2">Rest Day</h5>
                          <p className="text-gray-300 text-base">Day {dayNumber} is planned as a rest day.</p>
                        </div>
                      )
                    }
                  })()
                ) : (
                  <p className="text-gray-400 text-center py-6 text-base">No exercises found</p>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
