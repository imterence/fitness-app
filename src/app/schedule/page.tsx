"use client"

import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, User, Target, CheckCircle, XCircle, ChevronLeft, ChevronRight, Dumbbell, CalendarDays, LogOut } from "lucide-react"
import Link from "next/link"

interface Exercise {
  id: string
  exercise: {
    id: string
    name: string
    description: string
    category: string
    difficulty: string
  }
  sets: number
  reps: string
  duration?: number
  weight?: number
  order: number
}

interface WorkoutAssignment {
  id: string
  scheduledDate: string
  status: string
  notes?: string
  client?: {
    name: string
    email: string
  }
  workout?: {
    name: string
    description?: string
    exercises: Exercise[]
    estimatedDuration: number
    difficulty: string
  }
  // Additional properties for program day assignments
  isProgramDay?: boolean
  programDay?: number
  totalProgramDays?: number
  originalId?: string
}

interface WorkoutProgramAssignment {
  id: string
  startDate: string
  status: string
  notes?: string
  client?: {
    name: string
    email: string
  }
  program?: {
    name: string
    description?: string
    totalDays: number
    difficulty: string
  }
  // Additional properties for program day assignments
  isProgramDay?: boolean
  programDay?: number
  totalProgramDays?: number
  originalId?: string
}

type Assignment = WorkoutAssignment | WorkoutProgramAssignment

export default function SchedulePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const clientId = searchParams.get('clientId')
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [clientName, setClientName] = useState<string>('')

  useEffect(() => {
    if (status === "loading") return
    
    if (!session?.user) {
      router.push("/auth/login")
      return
    }
    
    // Redirect clients to their homepage
    if (session?.user?.role === "CLIENT") {
      router.push("/client")
      return
    }
    
    fetchAssignments()
  }, [session, status, router])

  const fetchAssignments = async () => {
    try {
      setIsLoading(true)
      
      // For clients, show their own schedule. For trainers/admins, require clientId
      if (session?.user?.role === "CLIENT") {
        // Client viewing their own schedule - no clientId needed
        const [workoutResponse, programResponse] = await Promise.all([
          fetch('/api/workouts/assign'),
          fetch('/api/workout-programs/assign')
        ])
        
        if (workoutResponse.ok && programResponse.ok) {
          const workoutData = await workoutResponse.json()
          const programData = await programResponse.json()
          
          // Filter assignments for the current client
          const clientAssignments = [
            ...workoutData.assignments.filter((assignment: any) => 
              assignment.client?.userId === session.user.id
            ),
            ...programData.assignments.filter((assignment: any) => 
              assignment.client?.userId === session.user.id
            )
          ]
          
          setAssignments(clientAssignments)
          setClientName(session.user.name || 'Your')
        } else {
          setError('Failed to fetch assignments')
        }
      } else {
        // Trainer/Admin viewing specific client schedule
        if (!clientId) {
          router.push('/clients')
          return
        }
        
        const [workoutResponse, programResponse] = await Promise.all([
          fetch(`/api/workouts/assign?clientId=${clientId}`),
          fetch(`/api/workout-programs/assign?clientId=${clientId}`)
        ])
        
        if (workoutResponse.ok && programResponse.ok) {
          const workoutData = await workoutResponse.json()
          const programData = await programResponse.json()
          
          // Transform workout program assignments to create individual day assignments for trainer view
          const transformedPrograms = programData.assignments.flatMap((prog: any) => {
            if (!prog.program?.days || !prog.program.totalDays) {
              return []
            }
            
            // Create individual assignments for each day of the program
            const dayAssignments = []
            for (let dayIndex = 0; dayIndex < prog.program.totalDays; dayIndex++) {
              const dayNumber = dayIndex + 1
              const programDay = prog.program.days.find((d: any) => d.dayNumber === dayNumber)
              const dayDate = new Date(new Date(prog.startDate).getTime() + (dayIndex * 24 * 60 * 60 * 1000))
              
              dayAssignments.push({
                id: `${prog.id}-day-${dayNumber}`,
                originalId: prog.id,
                scheduledDate: dayDate.toISOString(),
                status: prog.status,
                notes: prog.notes,
                client: prog.client,
                workout: programDay ? {
                  name: `${prog.program.name} - Day ${dayNumber}`,
                  description: prog.program.description,
                  exercises: programDay.exercises || [],
                  estimatedDuration: programDay.estimatedDuration || 0,
                  difficulty: prog.program.difficulty
                } : undefined,
                isProgramDay: true,
                programDay: dayNumber,
                totalProgramDays: prog.program.totalDays
              })
            }
            
            return dayAssignments
          })
          
          const allAssignments = [
            ...workoutData.assignments,
            ...transformedPrograms
          ]
          
          setAssignments(allAssignments)
          
          // Set client name for display
          if (allAssignments.length > 0 && allAssignments[0].client?.name) {
            setClientName(allAssignments[0].client.name)
          } else {
            setClientName('Client')
          }
        } else {
          setError('Failed to fetch assignments')
        }
      }
    } catch (error) {
      console.error('Error fetching assignments:', error)
      setError('Network error')
    } finally {
      setIsLoading(false)
    }
  }

  const updateWorkoutStatus = async (assignmentId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/workouts/assign/${assignmentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        fetchAssignments()
      } else {
        console.error('Failed to update status')
      }
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  const deleteWorkoutAssignment = async (assignmentId: string, workoutName: string, clientName: string, assignment?: Assignment) => {
    if (!confirm(`Are you sure you want to delete the scheduled workout "${workoutName}" for ${clientName}? This action cannot be undone.`)) {
      return
    }

    try {
      let response: Response
      
      // Determine if this is a workout program assignment or single workout assignment
      const isWorkoutProgram = assignment && 'startDate' in assignment && 'program' in assignment
      
      if (isWorkoutProgram) {
        // Delete workout program assignment
        response = await fetch(`/api/workout-programs/assign?assignmentId=${assignmentId}`, {
          method: 'DELETE'
        })
      } else {
        // Delete single workout assignment
        response = await fetch(`/api/workouts/assign/${assignmentId}`, {
          method: 'DELETE'
        })
      }

      if (response.ok) {
        fetchAssignments()
        setSuccessMessage(`${isWorkoutProgram ? 'Workout program' : 'Workout'} assignment deleted successfully`)
      } else {
        const errorData = await response.json()
        setError(errorData.error || `Failed to delete ${isWorkoutProgram ? 'workout program' : 'workout'} assignment`)
      }
    } catch (error) {
      console.error('Error deleting assignment:', error)
      setError('Failed to delete assignment')
    }
  }

  const getWeekDates = (date: Date) => {
    const start = new Date(date)
    start.setDate(start.getDate() - start.getDay())
    
    const dates = []
    for (let i = 0; i < 7; i++) {
      const day = new Date(start)
      day.setDate(start.getDate() + i)
      dates.push(day)
    }
    return dates
  }

  // Helper functions to safely access assignment properties
  const getAssignmentDate = (assignment: Assignment): string => {
    if ('scheduledDate' in assignment) {
      return assignment.scheduledDate
    } else if ('startDate' in assignment) {
      return assignment.startDate
    }
    return ''
  }

  const getAssignmentName = (assignment: Assignment): string => {
    if ('workout' in assignment && assignment.workout) {
      // Check if this is a program day assignment
      if ((assignment as any).isProgramDay && (assignment as any).programDay) {
        return `${assignment.workout.name} (Day ${(assignment as any).programDay})`
      }
      return assignment.workout.name
    } else if ('program' in assignment && assignment.program) {
      return assignment.program.name
    }
    return 'Unnamed Assignment'
  }

  const getAssignmentDetails = (assignment: Assignment) => {
    if ('workout' in assignment && assignment.workout) {
      return {
        name: assignment.workout.name,
        description: assignment.workout.description,
        exercises: assignment.workout.exercises,
        estimatedDuration: assignment.workout.estimatedDuration,
        difficulty: assignment.workout.difficulty,
        type: 'workout' as const
      }
    } else if ('program' in assignment && assignment.program) {
      return {
        name: assignment.program.name,
        description: assignment.program.description,
        exercises: [],
        estimatedDuration: 0,
        difficulty: assignment.program.difficulty,
        type: 'program' as const,
        totalDays: assignment.program.totalDays
      }
    }
    return null
  }

  const getAssignmentsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return assignments.filter(assignment => 
      getAssignmentDate(assignment).startsWith(dateStr)
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'MISSED':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return <Clock className="h-4 w-4" />
      case 'IN_PROGRESS':
        return <Target className="h-4 w-4" />
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4" />
      case 'MISSED':
        return <XCircle className="h-4 w-4" />
      case 'CANCELLED':
        return <XCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = new Date(currentWeek)
    newWeek.setDate(newWeek.getDate() + (direction === 'next' ? 7 : -7))
    setCurrentWeek(newWeek)
  }

  const weekDates = getWeekDates(currentWeek)

  // Show loading while checking authentication
  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Schedule...</p>
        </div>
      </div>
    )
  }

  // Don't render if not authenticated
  if (!session?.user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Access denied. Redirecting...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/clients">
                <Button variant="ghost" size="sm">
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Back to Clients
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">
                {clientName ? `${clientName}'s Schedule` : 'Workout Schedule'}
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              {session.user.role !== "CLIENT" && (
                <Link href="/assign-workout">
                  <Button size="sm">
                    <Calendar className="h-4 w-4 mr-2" />
                    Assign Workout
                  </Button>
                </Link>
              )}
              <div className="flex items-center space-x-3">
                <div className="text-sm text-gray-600">
                  Logged in as: {session.user.name || session.user.email}
                </div>
                <Button onClick={signOut} variant="outline" size="sm">
                  <LogOut className="h-4 w-4 mr-2" />
                  Log Out
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {session.user.role === "CLIENT" ? "Your Weekly Workout Schedule" : clientName ? `${clientName}'s Weekly Workout Schedule` : "Client Workout Assignments"}
          </h2>
          <p className="text-gray-600">
            {session.user.role === "CLIENT" 
              ? "View and track your assigned workouts for the week"
              : clientName 
                ? `View and manage workout assignments for ${clientName}`
                : "Manage workout assignments for your clients"
            }
          </p>
        </div>

        {/* Error and Success Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-800">{error}</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setError(null)}
              className="mt-2 text-red-600 hover:text-red-800"
            >
              Dismiss
            </Button>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
            <p className="text-green-800">{successMessage}</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSuccessMessage(null)}
              className="mt-2 text-green-600 hover:text-green-800"
            >
              Dismiss
            </Button>
          </div>
        )}

        {/* Week Navigation */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateWeek('prev')}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous Week
          </Button>
          
          <div className="flex items-center space-x-2">
            <CalendarDays className="h-5 w-5 text-blue-600" />
            <span className="text-lg font-semibold text-gray-900">
              {weekDates[0].toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - {weekDates[6].toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateWeek('next')}
          >
            Next Week
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>

        {/* Weekly Calendar Grid */}
        <div className="grid grid-cols-7 gap-4 mb-8">
          {weekDates.map((date, index) => {
            const dayAssignments = getAssignmentsForDate(date)
            const isCurrentDay = isToday(date)
            
            return (
              <div key={index} className="min-h-[200px]">
                {/* Day Header */}
                <div className={`text-center p-3 rounded-t-lg border ${
                  isCurrentDay 
                    ? 'bg-blue-600 text-white border-blue-600' 
                    : 'bg-gray-50 text-gray-700 border-gray-200'
                }`}>
                  <div className="text-sm font-medium">
                    {formatDate(date)}
                  </div>
                  <div className="text-xs opacity-75">
                    {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
                
                {/* Day Content */}
                <div className="bg-white border border-gray-200 rounded-b-lg p-2 min-h-[150px]">
                  {dayAssignments.length === 0 ? (
                    <div className="text-center text-gray-400 text-xs py-8">
                      No workouts
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {dayAssignments.map((assignment) => (
                        <div
                          key={assignment.id}
                          className={`rounded-lg p-2 hover:bg-blue-100 transition-colors ${
                            (assignment as any).isProgramDay 
                              ? 'bg-green-50 border border-green-200' 
                              : 'bg-blue-50 border border-blue-200'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center space-x-2">
                              <span className={`text-xs font-medium line-clamp-1 ${
                                (assignment as any).isProgramDay ? 'text-green-900' : 'text-blue-900'
                              }`}>
                                {getAssignmentName(assignment)}
                              </span>
                              {(assignment as any).isProgramDay && (
                                <Badge variant="outline" className="text-xs bg-green-100 text-green-800 border-green-300">
                                  Day {(assignment as any).programDay}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center space-x-1">

                              {session.user.role !== "CLIENT" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    deleteWorkoutAssignment(
                                      assignment.id,
                                      getAssignmentName(assignment),
                                      assignment.client?.name || 'Unknown Client',
                                      assignment
                                    )
                                  }}
                                  className="h-4 w-4 p-0 text-red-500 hover:text-red-700 hover:bg-red-100"
                                >
                                  <XCircle className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                          
                          {assignment.client && (
                            <div className={`text-xs mb-1 ${
                              (assignment as any).isProgramDay ? 'text-green-700' : 'text-blue-700'
                            }`}>
                              {assignment.client.name}
                            </div>
                          )}
                          
                          <div className={`text-xs ${
                            (assignment as any).isProgramDay ? 'text-green-600' : 'text-blue-600'
                          }`}>
                            {new Date(getAssignmentDate(assignment)).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric'
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Detailed Assignments List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">All Assignments</h3>
          </div>
          
          {assignments.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No workouts scheduled
              </h3>
              <p className="text-gray-600 mb-4">
                {session.user.role === "CLIENT" 
                  ? "You don't have any workouts assigned yet."
                  : "No workouts have been assigned to clients yet."
                }
              </p>
              {session.user.role !== "CLIENT" && (
                <Link href="/assign-workout">
                  <Button>
                    Create and Assign Workout
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {assignments.map((assignment) => (
                <div key={assignment.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h4 className="text-lg font-semibold text-gray-900">
                          {getAssignmentName(assignment)}
                        </h4>

                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(getAssignmentDate(assignment)).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}</span>
                        </div>
                        
                        {assignment.client && (
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span>{assignment.client.name} ({assignment.client.email})</span>
                          </div>
                        )}
                        
                        {(() => {
                          const details = getAssignmentDetails(assignment)
                          if (details && details.type === 'workout') {
                            return (
                              <div className="flex items-center gap-2">
                                <Dumbbell className="h-4 w-4" />
                                <span>{details.exercises?.length || 0} exercises • {details.estimatedDuration} min</span>
                              </div>
                            )
                          } else if (details && details.type === 'program') {
                            return (
                              <div className="flex items-center gap-2">
                                <Dumbbell className="h-4 w-4" />
                                <span>{details.totalDays} day program</span>
                              </div>
                            )
                          }
                          return null
                        })()}
                      </div>

                      {/* Workout Details */}
                      {(() => {
                        const details = getAssignmentDetails(assignment)
                        if (details) {
                          return (
                            <div className="bg-gray-50 rounded-lg p-4 mb-4">
                              <h5 className="font-medium text-gray-900 mb-3">
                                {details.type === 'workout' ? 'Workout Details' : 'Program Details'}
                              </h5>
                              
                              {details.description && (
                                <p className="text-sm text-gray-600 mb-3">
                                  {details.description}
                                </p>
                              )}
                              
                              {details.exercises && details.exercises.length > 0 && (
                                <div className="space-y-2">
                                  <h6 className="text-sm font-medium text-gray-700">Exercises:</h6>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {details.exercises.slice(0, 6).map((exercise: any, index: number) => (
                                      <div key={index} className="flex items-center justify-between text-xs bg-white p-2 rounded border">
                                        <span className="font-medium text-gray-700">{exercise.exercise.name}</span>
                                        <span className="text-gray-500">
                                          {exercise.sets} × {exercise.reps}
                                          {exercise.rest && (
                                            <span className="ml-2 text-gray-400">| Rest: {exercise.rest}</span>
                                          )}
                                        </span>
                                      </div>
                                    ))}
                                    {details.exercises.length > 6 && (
                                      <div className="text-xs text-gray-500 italic">
                                        +{details.exercises.length - 6} more exercises
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                              {(!details.exercises || details.exercises.length === 0) && (
                                <div className="text-sm text-gray-500 italic">
                                  No exercises found for this {details.type === 'workout' ? 'workout' : 'program'}.
                                </div>
                              )}
                            </div>
                          )
                        }
                        return null
                      })()}

                      {assignment.notes && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <p className="text-sm text-blue-800">
                            <strong>Notes:</strong> {assignment.notes}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Status Update Buttons (for trainers) */}
                    {session.user.role !== "CLIENT" && (
                      <div className="flex flex-col gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateWorkoutStatus(assignment.id, 'IN_PROGRESS')}
                          disabled={assignment.status === 'IN_PROGRESS'}
                        >
                          Start
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateWorkoutStatus(assignment.id, 'COMPLETED')}
                          disabled={assignment.status === 'COMPLETED'}
                        >
                          Complete
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateWorkoutStatus(assignment.id, 'MISSED')}
                          disabled={assignment.status === 'MISSED'}
                        >
                          Missed
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteWorkoutAssignment(
                            assignment.id, 
                            getAssignmentName(assignment),
                            assignment.client?.name || 'Unknown Client',
                            assignment
                          )}
                          className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                        >
                          Delete
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

