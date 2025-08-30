"use client"

import { useState, useEffect, Suspense } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Users, 
  User, 
  Calendar, 
  Plus, 
  ArrowLeft,
  Search,
  Dumbbell,
  Clock,
  CheckCircle,
  XCircle,
  Target,
  Star,
  Filter,
  CalendarDays,
  UserPlus,
  Zap
} from "lucide-react"
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
  reps: number
  duration?: number
  weight?: number
  order: number
}

interface WorkoutDay {
  id: string
  dayNumber: number
  isRestDay: boolean
  exercises?: Exercise[]
}

interface Workout {
  id: string
  name: string
  description: string
  difficulty: string
  estimatedDuration: number
  isPublic: boolean
  creator: {
    id: string
    name: string
    email: string
  }
  exercises: Exercise[]
  isAssigned?: boolean
  assignmentStatus?: string
  type?: string
  totalDays?: number
  days?: WorkoutDay[]
}

interface Client {
  id: string
  userId: string
  user: {
    id: string
    name: string
    email: string
    role: string
  }
  goals?: string
  notes?: string
  trainerId?: string
  trainer?: {
    id: string
    name: string
    email: string
  }
}

export default function AssignWorkoutPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AssignWorkoutContent />
    </Suspense>
  )
}

function AssignWorkoutContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  // Get search params without useSearchParams
  const [clientId, setClientId] = useState<string | null>(null)
  const [workoutId, setWorkoutId] = useState<string | null>(null)
  const [workoutType, setWorkoutType] = useState<string | null>(null)
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      setClientId(urlParams.get('clientId'))
      setWorkoutId(urlParams.get('workoutId'))
      setWorkoutType(urlParams.get('type'))
    }
  }, [])
  
  // Helper function to format dates consistently without timezone issues
  const formatDateForDisplay = (dateString: string) => {
    // Parse the date string and create a date object in local timezone
    const [year, month, day] = dateString.split('-').map(Number)
    return new Date(year, month - 1, day).toLocaleDateString()
  }
  
  // Helper function to add days to a date string without timezone issues
  const addDaysToDateString = (dateString: string, daysToAdd: number) => {
    const [year, month, day] = dateString.split('-').map(Number)
    
    // Create a new date object in local timezone
    const date = new Date(year, month - 1, day + daysToAdd)
    
    // Format back to YYYY-MM-DD string without using toISOString()
    const newYear = date.getFullYear()
    const newMonth = String(date.getMonth() + 1).padStart(2, '0')
    const newDay = String(date.getDate()).padStart(2, '0')
    
    return `${newYear}-${newMonth}-${newDay}`
  }
  
  // Helper function to convert Date object to date string without timezone issues
  const dateToDateString = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    
    return `${year}-${month}-${day}`
  }
  
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [filteredWorkouts, setFilteredWorkouts] = useState<Workout[]>([])
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'templates' | 'custom'>('all')
  const [scheduledDates, setScheduledDates] = useState<string[]>([])
  const [showCalendar, setShowCalendar] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [isLoading, setIsLoading] = useState(true)
  const [isAssigning, setIsAssigning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [clientScheduledDates, setClientScheduledDates] = useState<string[]>([])

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      fetchClients()
      // Always fetch workouts, even without a client selected
      fetchAllWorkouts()
    }
  }, [status, session])

  useEffect(() => {
    filterWorkouts()
  }, [workouts, searchTerm, filterType])

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        
        // For trainers, only show clients assigned to them
        if (session?.user?.role === "TRAINER") {
          const myAssignedClients = data.clients.filter((client: Client) => 
            client.trainerId === session.user.id
          )
          setClients(myAssignedClients)
        } else {
          // Admin sees all clients
          setClients(data.clients)
        }
        
        if (clientId) {
          const client = data.clients.find((c: Client) => c.id === clientId)
          if (client) {
            setSelectedClient(client)
          }
        }
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
    }
  }

     const fetchAllWorkouts = async () => {
     try {
       setIsLoading(true)
       setError(null)
       
       console.log("🔍 Fetching all workouts...")
       console.log("🔍 Current session:", session)
       console.log("🔍 Session user:", session?.user)
       
       const response = await fetch('/api/workouts/available', {
         credentials: 'include'
       })
       
       console.log("📊 Workout API response:", {
         status: response.status,
         ok: response.ok,
         statusText: response.statusText
       })
       
       if (response.ok) {
         const data = await response.json()
         console.log("📋 Workout API data:", data)
         console.log("📊 Workouts count:", data.workouts?.length || 0)
         
         if (data.workouts && data.workouts.length > 0) {
           setWorkouts(data.workouts)
         } else {
           console.log("⚠️ No workouts found in response")
           setWorkouts([])
           setError('No workouts available. Please create some workouts first.')
         }
       } else {
         const errorText = await response.text()
         console.error("❌ Workout API error:", response.status, errorText)
         setError(`Failed to fetch workouts: ${response.status} - ${errorText}`)
       }
     } catch (error) {
       console.error('❌ Network error fetching workouts:', error)
       setError(`Network error: ${error instanceof Error ? error.message : String(error)}`)
     } finally {
       setIsLoading(false)
     }
   }

  const fetchClientScheduledDates = async (targetClientId: string) => {
    try {
      console.log('Frontend: Fetching scheduled dates for client:', targetClientId)
      const response = await fetch(`/api/clients/${targetClientId}/assignments`, {
        credentials: 'include'
      })
      console.log('Frontend: API response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Frontend: API response data:', data)
        setClientScheduledDates(data.scheduledDates || [])
        console.log('Frontend: Set client scheduled dates:', data.scheduledDates || [])
      } else {
        const errorData = await response.json()
        console.error('Frontend: Failed to fetch client scheduled dates:', errorData)
        setClientScheduledDates([])
      }
    } catch (error) {
      console.error('Frontend: Error fetching client scheduled dates:', error)
      setClientScheduledDates([])
    }
  }

  const fetchWorkouts = async (targetClientId: string) => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/workouts/available?clientId=${targetClientId}`, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setWorkouts(data.workouts)
      } else {
        setError('Failed to fetch workouts')
      }
    } catch (error) {
      console.error('Error fetching workouts:', error)
      setError('Network error')
    } finally {
      setIsLoading(false)
    }
  }

  const filterWorkouts = () => {
    let filtered = workouts

    if (filterType === 'templates') {
      filtered = filtered.filter(w => w.type === 'multi-day')
    } else if (filterType === 'custom') {
      filtered = filtered.filter(w => w.type === 'single-day')
    }

    if (searchTerm) {
      filtered = filtered.filter(w => 
        w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.exercises.some(e => e.exercise.name.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    setFilteredWorkouts(filtered)
  }

  const handleWorkoutSelect = (workout: Workout) => {
    setSelectedWorkout(workout)
  }

  const removeDate = (dateToRemove: string) => {
    setScheduledDates(scheduledDates.filter(date => date !== dateToRemove))
  }

  const clearDates = () => {
    setScheduledDates([])
  }

     const toggleDateSelection = (dateString: string) => {
     if (scheduledDates.includes(dateString)) {
       // Remove the selected date
       setScheduledDates(scheduledDates.filter(date => date !== dateString))
     } else {
       if (selectedWorkout?.type === 'multi-day' && selectedWorkout.days) {
         // For multi-day programs, clear previous selection and only select this date
         // The program will automatically span the required number of days
         setScheduledDates([dateString])
       } else {
         // For single-day workouts, add to existing selection
         setScheduledDates([...scheduledDates, dateString])
       }
     }
   }

  const openCalendar = () => {
    setCurrentMonth(new Date())
    setShowCalendar(true)
  }

  const closeCalendar = () => {
    setShowCalendar(false)
  }

  // Generate calendar days for a specific month
  const generateCalendarDays = (targetMonth: Date) => {
    const today = new Date()
    const month = targetMonth.getMonth()
    const year = targetMonth.getFullYear()
    
    const days = []
    
    // Get first day of month and total days in month
    const firstDayOfMonth = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null)
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      if (date >= today) {
        days.push(date)
      } else {
        days.push(null) // Past dates
      }
    }
    
    return days
  }

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  const goToToday = () => {
    setCurrentMonth(new Date())
  }

  const handleAssignWorkout = async () => {
    if (!selectedClient || !selectedWorkout || scheduledDates.length === 0) return

    try {
      setIsAssigning(true)
      setError(null)
      setSuccessMessage(null)



      // Assign workout to multiple dates
      let successCount = 0
      let errorCount = 0
      
      if (selectedWorkout.type === 'multi-day' && selectedWorkout.days) {
        // For multi-day programs, only use the FIRST selected date as the start date
        // The program will automatically span the required number of days
        const startDate = scheduledDates[0] // Only use the first selected date
        const totalDays = selectedWorkout.days.length
        
        try {
          // Assign the program starting from the first selected date
          const requestBody = {
            clientId: selectedClient.user.id,
            programId: selectedWorkout.id,
            startDate: startDate,
            notes: `Assigned "${selectedWorkout.name}" (${totalDays} days) to ${selectedClient.user.name} starting ${formatDateForDisplay(startDate)}`
          }

          const assignResponse = await fetch('/api/workout-programs/assign', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(requestBody)
          })

          if (assignResponse.ok) {
            successCount = 1
            // Show which dates the program will span
            const programDates = []
            for (let i = 0; i < totalDays; i++) {
              programDates.push(addDaysToDateString(startDate, i))
            }
            console.log(`Program will span dates: ${programDates.join(', ')}`)
          } else {
            errorCount++
          }
        } catch (error) {
          errorCount++
        }
      } else {
        // For single-day workouts, assign to each selected date
        for (const date of scheduledDates) {
          try {
            const requestBody = {
              clientId: selectedClient.user.id,
              workoutId: selectedWorkout.id,
              scheduledDate: date,
              notes: `Assigned "${selectedWorkout.name}" to ${selectedClient.user.name} for ${formatDateForDisplay(date)}`
            }

            const assignResponse = await fetch('/api/workouts/assign', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include',
              body: JSON.stringify(requestBody)
            })

            if (assignResponse.ok) {
              successCount++
            } else {
              errorCount++
            }
          } catch (error) {
            errorCount++
          }
        }
      }

      if (errorCount === 0) {
        if (selectedWorkout.type === 'multi-day' && selectedWorkout.days) {
          // For multi-day programs, show the date range it spans
          const startDate = scheduledDates[0]
          const totalDays = selectedWorkout.days.length
          const endDate = addDaysToDateString(startDate, totalDays - 1)
          setSuccessMessage(`Workout program "${selectedWorkout.name}" successfully assigned to ${selectedClient.user.name}! It will run from ${formatDateForDisplay(startDate)} to ${formatDateForDisplay(endDate)} (${totalDays} days).`)
        } else {
          setSuccessMessage(`Workout "${selectedWorkout.name}" successfully assigned to ${selectedClient.user.name} for ${scheduledDates.length} date(s)!`)
        }
      } else if (successCount > 0) {
        setSuccessMessage(`Workout assigned to ${successCount} date(s) with ${errorCount} error(s). Some assignments may have failed.`)
      } else {
        throw new Error('Failed to assign workout to any dates')
      }
      
      setSelectedWorkout(null)
      setScheduledDates([])
      
      if (clientId) {
        await fetchWorkouts(clientId)
      }

    } catch (error) {
      console.error('Error assigning workout:', error)
      setError(error instanceof Error ? error.message : 'Failed to assign workout')
    } finally {
      setIsAssigning(false)
    }
  }

  const handleDeleteWorkout = async (workoutId: string, workoutType?: string) => {
    if (!confirm('Are you sure you want to delete this workout? This action cannot be undone.')) {
      return
    }

    try {
      // Choose the appropriate API endpoint based on workout type
      const endpoint = workoutType === 'multi-day' 
        ? `/api/workout-programs/${workoutId}` 
        : `/api/workouts/${workoutId}`

      const response = await fetch(endpoint, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        if (clientId) {
          await fetchWorkouts(clientId)
        }
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

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'BEGINNER':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'INTERMEDIATE':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'ADVANCED':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

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

  // Debug session information
  console.log("🔍 Assign Workout Page - Session Debug:", {
    status,
    session: session ? {
      user: session.user ? {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role
      } : null
    } : null,
    isAuthenticated: !!session?.user,
    hasCorrectRole: session?.user?.role === "TRAINER" || session?.user?.role === "ADMIN"
  })

  if (!session?.user || (session.user.role !== "TRAINER" && session.user.role !== "ADMIN")) {
    console.log("❌ Access denied - redirecting to dashboard")
    console.log("❌ Session user:", session?.user)
    console.log("❌ User role:", session?.user?.role)
    router.push('/dashboard')
    return null
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
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Clients
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Assign Workout</h1>
                <p className="text-sm text-gray-600">Select a client and assign them a workout</p>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              Logged in as: {session.user.name || session.user.email}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Split Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Information Note for Trainers */}
        {session?.user?.role === "TRAINER" && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Workout Assignment Information
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>• <strong>Client Restriction:</strong> You can only assign workouts to clients that are assigned to you</p>
                  <p>• <strong>Workout Access:</strong> You can see and assign ALL workouts in the system (both yours and others')</p>
                  <p>• <strong>To assign a new client:</strong> Go to the <strong>Clients</strong> page first</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Side - Client & Workout Selection */}
          <div className="space-y-6">
            
            {/* Client Selection */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Users className="h-5 w-5 mr-2 text-blue-600" />
                  Select Client
                </h2>
                <Badge variant="secondary">{clients.length} clients</Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {clients.map((client) => (
                  <Card 
                    key={client.id} 
                    className={`cursor-pointer transition-all hover:shadow-md border-2 ${
                      selectedClient?.id === client.id 
                        ? 'ring-2 ring-blue-500 bg-blue-50 border-blue-200' 
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                    onClick={() => {
                      console.log('Frontend: Selected client:', client)
                      console.log('Frontend: Client ID:', client.id)
                      console.log('Frontend: Client user ID:', client.userId)
                      setSelectedClient(client)
                      fetchWorkouts(client.id)
                      fetchClientScheduledDates(client.userId) // Use userId instead of id
                      setSelectedWorkout(null)
                      setScheduledDates([])
                    }}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center space-x-3">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                          selectedClient?.id === client.id 
                            ? 'bg-blue-100 text-blue-600' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          <User className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">{client.user.name}</h3>
                          <p className="text-sm text-gray-600 truncate">{client.user.email}</p>
                        </div>
                        {selectedClient?.id === client.id && (
                          <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Workout Selection */}
            {selectedClient && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Dumbbell className="h-5 w-5 mr-2 text-green-600" />
                    Select Workout
                  </h2>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">{filteredWorkouts.length}</Badge>
                    <Button 
                      onClick={async () => {
                        if (selectedClient) {
                          await fetchWorkouts(selectedClient.id)
                          // Also refresh the client's scheduled dates for the calendar
                          await fetchClientScheduledDates(selectedClient.userId)
                        } else {
                          await fetchAllWorkouts()
                        }
                        setSearchTerm('')
                        setFilterType('all')
                      }}
                      size="sm" 
                      variant="outline"
                      className="text-blue-600 border-blue-200 hover:bg-blue-50"
                    >
                      <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Refresh
                    </Button>

                    <Link href="/create-workout">
                      <Button size="sm" variant="outline">
                        <Plus className="h-4 w-4 mr-1" />
                        New
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Search and Filters */}
                <div className="bg-white rounded-lg border border-gray-200 p-3 mb-4">
                  <div className="space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search workouts..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button
                        variant={filterType === 'all' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilterType('all')}
                        className="flex items-center text-xs"
                      >
                        <Filter className="h-3 w-3 mr-1" />
                        All
                      </Button>
                      
                      <Button
                        variant={filterType === 'custom' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilterType('custom')}
                        className="flex items-center text-xs"
                      >
                        <Zap className="h-3 w-3 mr-1" />
                        Custom
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Workouts List */}
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {isLoading ? (
                    <div className="text-center py-6">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-2 text-sm text-gray-600">Loading workouts...</p>
                    </div>
                  ) : filteredWorkouts.length === 0 ? (
                    <div className="text-center py-6 text-gray-500">
                      <Dumbbell className="h-6 w-6 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm">No workouts found</p>
                    </div>
                  ) : (
                    filteredWorkouts.map((workout) => (
                      <Card 
                        key={workout.id} 
                        className={`cursor-pointer transition-all hover:shadow-md border-2 ${
                          selectedWorkout?.id === workout.id 
                            ? 'ring-2 ring-green-500 bg-green-50 border-green-200' 
                            : 'border-gray-200 hover:border-green-300'
                        }`}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 cursor-pointer min-w-0" onClick={() => handleWorkoutSelect(workout)}>
                              <div className="flex items-center space-x-2 mb-2">
                                <h4 className="font-semibold text-gray-900 truncate">{workout.name}</h4>
                                
                                <Badge variant="outline" className={`text-xs ${getDifficultyColor(workout.difficulty)}`}>
                                  {workout.difficulty}
                                </Badge>
                              </div>
                              
                                                             <div className="flex items-center space-x-4 text-xs text-gray-500">
                                 <span className="flex items-center">
                                   <Clock className="h-3 w-3 mr-1" />
                                   {workout.estimatedDuration} min
                                 </span>
                                 <span className="flex items-center">
                                   <Dumbbell className="h-3 w-3 mr-1" />
                                   {workout.type === 'multi-day' && workout.days 
                                     ? workout.days.reduce((total: number, day: WorkoutDay) => total + (day.exercises?.length || 0), 0)
                                     : workout.exercises?.length || 0
                                   } exercises
                                 </span>
                                 {workout.type === 'multi-day' && workout.days && (
                                   <span className="flex items-center">
                                     <CalendarDays className="h-3 w-3 mr-1" />
                                     {workout.days.length} days
                                   </span>
                                 )}
                               </div>


                            </div>
                            
                            <div className="flex items-center space-x-2 ml-2 flex-shrink-0">
                              {selectedWorkout?.id === workout.id && (
                                <CheckCircle className="h-5 w-5 text-green-600" />
                              )}
                              {workout.creator.id === session.user.id && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDeleteWorkout(workout.id, workout.type)
                                  }}
                                  className="text-red-600 border-red-200 hover:bg-red-50 h-7 w-7 p-0"
                                >
                                  <XCircle className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Side - Workout Details & Assignment */}
          <div className="lg:pl-4">
            {selectedClient && selectedWorkout ? (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm sticky top-8">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                    {selectedWorkout.name}
                  </CardTitle>
                  <p className="text-sm text-gray-600">Assigning to {selectedClient.user.name}</p>
                </CardHeader>
                
                <CardContent className="space-y-6">
                                     {/* Workout Summary */}
                   <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                     <div className="text-center">
                       <div className="text-2xl font-bold text-blue-600">
                         {selectedWorkout.type === 'multi-day' && selectedWorkout.days 
                           ? selectedWorkout.days.reduce((total: number, day: WorkoutDay) => total + (day.exercises?.length || 0), 0)
                           : selectedWorkout.exercises?.length || 0
                         }
                       </div>
                       <div className="text-xs text-gray-600">
                         Exercises
                       </div>
                     </div>
                                         <div className="text-center">
                       <div className="text-2xl font-bold text-green-600">{selectedWorkout.estimatedDuration}</div>
                       <div className="text-xs text-gray-600">Minutes</div>
                     </div>
                     <div className="text-center">
                       <div className="text-2xl font-bold text-purple-600">
                         {selectedWorkout.type === 'multi-day' && selectedWorkout.days 
                           ? selectedWorkout.days.length
                           : selectedWorkout.difficulty
                         }
                       </div>
                       <div className="text-xs text-gray-600">
                         {selectedWorkout.type === 'multi-day' ? 'Days' : 'Level'}
                       </div>
                     </div>
                  </div>

                  {/* Workout Description */}
                  {selectedWorkout.description && (
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">Description</h5>
                      <p className="text-sm text-gray-600">{selectedWorkout.description}</p>
                    </div>
                  )}

                  {/* Exercises Preview */}
                  <div>
                    <h5 className="font-medium text-gray-900 mb-3">
                      {selectedWorkout.type === 'multi-day' ? 'Program Overview' : 'Exercises'}
                    </h5>
                    {selectedWorkout.type === 'multi-day' ? (
                      <div className="space-y-3">
                        <div className="text-center py-2">
                          <p className="text-sm font-medium text-gray-700">{selectedWorkout.days?.length || selectedWorkout.totalDays || 0}-day workout program</p>
                          <p className="text-xs text-gray-500 mt-1">Total exercises: {selectedWorkout.days?.reduce((total: number, day: WorkoutDay) => total + (day.exercises?.length || 0), 0) || 0}</p>
                        </div>
                        {selectedWorkout.days && (
                          <div className="space-y-2 max-h-32 overflow-y-auto">
                            {selectedWorkout.days.map((day, index) => (
                              <div key={day.id || index} className="flex items-center justify-between text-xs bg-gray-50 p-2 rounded border">
                                <span className="font-medium text-gray-700">
                                  Day {day.dayNumber}: {day.isRestDay ? 'Rest Day' : `${day.exercises?.length || 0} exercises`}
                                </span>
                                {day.isRestDay && (
                                  <span className="text-gray-400 text-xs">Rest</span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {selectedWorkout.exercises.slice(0, 5).map((exercise, index) => (
                          <div key={index} className="flex items-center justify-between text-xs bg-gray-50 p-2 rounded border">
                            <span className="font-medium text-gray-700 truncate">{exercise.exercise.name}</span>
                            <span className="text-gray-500">{exercise.sets} × {exercise.reps}</span>
                          </div>
                        ))}
                        {selectedWorkout.exercises.length > 5 && (
                          <div className="text-xs text-gray-500 italic text-center">
                            +{selectedWorkout.exercises.length - 5} more exercises
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Date Selection */}
                  <div className="border-t pt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      <CalendarDays className="h-4 w-4 inline mr-2 text-blue-600" />
                      {selectedWorkout.type === 'multi-day' 
                        ? 'When should this program start?' 
                        : 'When should this workout be completed?'
                      }
                    </label>
                    
                    {/* Calendar Button */}
                    <div className="mb-3">
                      <Button 
                        onClick={openCalendar} 
                        variant="outline"
                        className="w-full"
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        Select Dates on Calendar
                      </Button>
                      <p className="text-xs text-gray-500 mt-1">
                        The calendar will show dates that already have workouts assigned (in red) to help you avoid conflicts.
                      </p>
                    </div>

                    {/* Selected Dates */}
                    {scheduledDates.length > 0 && (
                      <div className="space-y-2 mb-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">Selected Dates ({scheduledDates.length})</span>
                          <Button 
                            onClick={clearDates} 
                            size="sm" 
                            variant="ghost"
                            className="text-red-600 hover:text-red-700"
                          >
                            Clear All
                          </Button>
                        </div>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {scheduledDates.map((date, index) => (
                            <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded border">
                              <span className="text-sm text-gray-700">
                                {formatDateForDisplay(date)}
                              </span>
                              <Button 
                                onClick={() => removeDate(date)} 
                                size="sm" 
                                variant="ghost"
                                className="text-red-600 hover:text-red-700 h-6 w-6 p-0"
                              >
                                <XCircle className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedWorkout.type === 'multi-day' && selectedWorkout.days ? (
                      <div className="space-y-2">
                        <p className="text-xs text-blue-600 bg-blue-50 p-2 rounded border">
                          <CalendarDays className="h-3 w-3 inline mr-1" />
                          <strong>Multi-day Program:</strong> This {selectedWorkout.days.length}-day program will be scheduled consecutively starting from each selected date.
                        </p>
                        <p className="text-xs text-gray-500">
                          Each selected start date will create a complete {selectedWorkout.days.length}-day program sequence.
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500">
                        You can assign the same workout multiple times on different dates.
                      </p>
                    )}
                  </div>

                  {/* Assign Button */}
                  <div className="border-t pt-4">
                    <Button
                      onClick={handleAssignWorkout}
                      disabled={isAssigning || scheduledDates.length === 0}
                      className="w-full h-11 text-base"
                      size="lg"
                    >
                      {isAssigning ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Assigning...
                        </>
                      ) : scheduledDates.length === 0 ? (
                        <>
                          <Calendar className="h-4 w-4 mr-2" />
                          Select at least one date
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          {selectedWorkout.type === 'multi-day' && selectedWorkout.days
                            ? `Assign ${selectedWorkout.days.length}-Day Program for ${scheduledDates.length} start date(s)`
                            : `Assign Workout for ${scheduledDates.length} date(s)`
                          }
                        </>
                      )}
                    </Button>
                    
                    {scheduledDates.length === 0 && (
                      <p className="text-sm text-amber-600 mt-2 text-center">
                        Please select at least one completion date to continue
                      </p>
                    )}
                  </div>
                </CardContent>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                <div className="text-gray-400 mb-4">
                  {!selectedClient ? (
                    <>
                      <Users className="h-12 w-12 mx-auto mb-3" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Client</h3>
                      <p className="text-gray-600">Choose a client from the left to start assigning workouts</p>
                    </>
                  ) : (
                    <>
                      <Dumbbell className="h-12 w-12 mx-auto mb-3" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Workout</h3>
                      <p className="text-gray-600">Choose a workout from the left to see details and assign it</p>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Error and Success Messages */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-50 border border-red-200 rounded-lg p-4 max-w-md shadow-lg">
          <div className="flex items-center space-x-2">
            <XCircle className="h-5 w-5 text-red-600" />
            <p className="text-red-800">{error}</p>
          </div>
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
        <div className="fixed bottom-4 right-4 bg-green-50 border border-green-200 rounded-lg p-4 max-w-md shadow-lg">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <p className="text-green-800">{successMessage}</p>
          </div>
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

      {/* Calendar Modal */}
      {showCalendar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white shadow-2xl">
            <CardHeader className="bg-gray-50 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">
                  Select Multiple Dates
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={closeCalendar}
                  className="hover:bg-gray-200"
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                                 {/* Calendar Header */}
                 <div className="text-center mb-4">
                   <div className="flex items-center justify-between mb-3">
                     <Button
                       variant="outline"
                       size="sm"
                       onClick={goToPreviousMonth}
                       className="h-8 w-8 p-0"
                     >
                       ←
                     </Button>
                     <h3 className="text-xl font-semibold text-gray-900">
                       {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                     </h3>
                     <Button
                       variant="outline"
                       size="sm"
                       onClick={goToNextMonth}
                       className="h-8 w-8 p-0"
                     >
                       →
                     </Button>
                   </div>
                                       <div className="flex items-center justify-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={goToToday}
                        className="text-xs"
                      >
                        Today
                      </Button>
                      <p className="text-sm text-gray-600">
                        {selectedWorkout?.type === 'multi-day' && selectedWorkout.days 
                          ? `Click a date to start the ${selectedWorkout.days.length}-day program (it will automatically span ${selectedWorkout.days.length} consecutive days)`
                          : 'Click on dates to select/deselect them'
                        }
                        <br />
                        {/* TODO: ENABLE MULTIPLE WORKOUTS PER DAY - Uncomment this line when re-enabling the restriction
                        <span className="text-red-600">Dates in red already have workouts assigned and cannot be selected.</span>
                        */}
                        <span className="text-blue-600">Multiple workouts can now be assigned to the same day.</span>
                        {selectedWorkout?.type === 'multi-day' && selectedWorkout.days && (
                          <>
                            <br />
                            <span className="text-blue-600">Light blue shows the full program span when a start date is selected.</span>
                          </>
                        )}
                      </p>
                    </div>
                 </div>

                                 {/* Calendar Grid */}
                 <div className="bg-white rounded-lg border border-gray-200 p-4">
                   {/* Day headers */}
                   <div className="grid grid-cols-7 gap-1 mb-2">
                     {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                       <div key={day} className="text-center text-sm font-semibold text-gray-600 p-2">
                         {day}
                       </div>
                     ))}
                   </div>
                   
                   {/* Calendar days */}
                   <div className="grid grid-cols-7 gap-1">
                     {generateCalendarDays(currentMonth).map((date, index) => {
                       if (!date) {
                         return <div key={index} className="p-2"></div>
                       }
                       
                                               const dateString = dateToDateString(date)
                        const isSelected = scheduledDates.includes(dateString)
                        const isToday = date.toDateString() === new Date().toDateString()
                        // TODO: ENABLE MULTIPLE WORKOUTS PER DAY - Keep visual indicator but allow selection
                        const hasExistingWorkout = clientScheduledDates.includes(dateString)
                        
                        // Check if this date is part of a selected multi-day program span
                        let isInProgramSpan = false
                        let programSpanDay = 0
                        
                        if (selectedWorkout?.type === 'multi-day' && selectedWorkout.days && scheduledDates.length > 0) {
                          const startDate = scheduledDates[0]
                          const totalDays = selectedWorkout.days.length
                          
                          // Calculate which day this would be in the program (0 = start date, 1 = day 2, etc.)
                          for (let i = 0; i < totalDays; i++) {
                            const programDate = addDaysToDateString(startDate, i)
                            if (programDate === dateString) {
                              isInProgramSpan = true
                              programSpanDay = i
                              break
                            }
                          }
                        }
                        
                        // Debug logging for first few dates
                        if (index < 7) {
                          console.log('Calendar debug:', {
                            date: date.toDateString(),
                            dateString,
                            hasExistingWorkout,
                            isInProgramSpan,
                            programSpanDay,
                            clientScheduledDates: clientScheduledDates.slice(0, 5)
                          })
                        }
                        
                        return (
                          <button
                            key={index}
                            onClick={() => toggleDateSelection(dateString)}
                            // TODO: ENABLE MULTIPLE WORKOUTS PER DAY - Allow selection of dates with existing workouts
                            // disabled={hasExistingWorkout}
                            className={`
                              h-10 w-full text-sm rounded-lg border transition-all duration-200 hover:shadow-md flex items-center justify-center
                              ${isSelected 
                                ? 'bg-blue-500 text-white border-blue-500 shadow-md font-semibold' 
                                : isInProgramSpan && programSpanDay > 0
                                  ? 'bg-blue-200 text-blue-800 border-blue-300 font-medium' // Lighter blue for program span days
                                : hasExistingWorkout
                                  ? 'bg-red-100 text-red-600 border-red-300 hover:bg-red-200 cursor-pointer' // Red but interactive with pointer cursor
                                  : 'bg-white text-gray-700 border-gray-200 hover:bg-blue-50 hover:border-blue-300 cursor-pointer'
                              }
                              ${isToday ? 'ring-2 ring-blue-300 font-bold' : ''}
                            `}
                            title={
                              hasExistingWorkout 
                                ? 'Date already has a workout assigned (can still select for additional workouts)'
                                : isInProgramSpan && programSpanDay > 0
                                  ? `Day ${programSpanDay + 1} of ${selectedWorkout?.days?.length || 0}-day program`
                                  : ''
                            }
                          >
                            {date.getDate()}
                          </button>
                        )
                     })}
                   </div>
                 </div>

                 {/* Calendar Legend */}
                 <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                   <h4 className="font-medium text-gray-900 mb-2 text-sm">Calendar Legend</h4>
                   <div className="flex items-center space-x-4 text-xs text-gray-600">
                     <div className="flex items-center space-x-2">
                       <div className="w-4 h-4 bg-white border border-gray-200 rounded"></div>
                       <span>Available</span>
                     </div>
                     <div className="flex items-center space-x-2">
                       <div className="w-4 h-4 bg-blue-500 border border-blue-500 rounded"></div>
                       <span>Selected</span>
                     </div>
                     <div className="flex items-center space-x-2">
                       <div className="w-4 h-4 bg-blue-200 border border-blue-300 rounded"></div>
                       <span>Program Span</span>
                     </div>
                     <div className="flex items-center space-x-2">
                       <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
                       <span>Has Existing Workout (Still Selectable)</span>
                     </div>
                   </div>
                 </div>

                {/* Selected dates summary */}
                {scheduledDates.length > 0 && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-900 mb-2">
                      Selected Dates ({scheduledDates.length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {scheduledDates.slice(0, 10).map((date, index) => (
                        <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                          {formatDateForDisplay(date)}
                        </span>
                      ))}
                      {scheduledDates.length > 10 && (
                        <span className="text-blue-600 text-sm">
                          +{scheduledDates.length - 10} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex justify-between items-center pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={clearDates}
                    disabled={scheduledDates.length === 0}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    Clear All
                  </Button>
                  <div className="flex space-x-3">
                    <Button
                      variant="outline"
                      onClick={closeCalendar}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={closeCalendar}
                      disabled={scheduledDates.length === 0}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Done ({scheduledDates.length} selected)
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
