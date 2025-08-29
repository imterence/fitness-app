"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Clock, Users, Dumbbell, Plus, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react"
import Link from "next/link"

interface Client {
  id: string
  userId: string
  user: {
    name: string
    email: string
  }
  goals: string
  notes: string
}

interface WorkoutTemplate {
  id: string
  name: string
  description: string
  duration: string
  difficulty: string
  category: string
  exercises: {
    exercise: {
      name: string
      category: string
    }
    sets: number
    reps: number
    rest: number
  }[]
}

interface WorkoutAssignment {
  id: string
  clientId: string
  templateId: string
  scheduledDate: string
  notes: string
  status: string
  client: {
    user: {
      name: string
    }
  }
  template: {
    name: string
    duration: string
  }
}

export default function ScheduleWorkoutPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [clients, setClients] = useState<Client[]>([])
  const [workouts, setWorkouts] = useState<WorkoutTemplate[]>([])
  const [assignments, setAssignments] = useState<WorkoutAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedClient, setSelectedClient] = useState<string>("")
  const [selectedWorkout, setSelectedWorkout] = useState<string>("")
  const [scheduledDate, setScheduledDate] = useState<string>("")
  const [notes, setNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState("")

  // Redirect if not authenticated or not a trainer
  useEffect(() => {
    if (status === "loading") return
    
    if (!session?.user) {
      router.push("/auth/login")
      return
    }
    
    if (session.user.role !== "trainer" && session.user.role !== "admin") {
      router.push("/dashboard")
      return
    }
  }, [session, status, router])

  // Fetch data
  useEffect(() => {
    if (session?.user && (session.user.role === "trainer" || session.user.role === "admin")) {
      fetchData()
    }
  }, [session])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch clients
      const clientsResponse = await fetch("/api/clients")
      if (clientsResponse.ok) {
        const clientsData = await clientsResponse.json()
        setClients(clientsData.clients)
      }
      
      // Fetch workouts
      const workoutsResponse = await fetch("/api/workouts")
      if (workoutsResponse.ok) {
        const workoutsData = await workoutsResponse.json()
        setWorkouts(workoutsData.workouts)
      }
      
      // Fetch existing assignments
      const assignmentsResponse = await fetch("/api/workouts/assign")
      if (assignmentsResponse.ok) {
        const assignmentsData = await assignmentsResponse.json()
        setAssignments(assignmentsData.assignments)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      setMessage("Error loading data. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedClient || !selectedWorkout) {
      setMessage("Please select both a client and a workout.")
      return
    }

    try {
      setSubmitting(true)
      setMessage("")

      const response = await fetch("/api/workouts/assign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientId: selectedClient,
          workoutId: selectedWorkout,
          scheduledDate: scheduledDate || null,
          notes: notes.trim() || null,
        }),
      })

      if (response.ok) {
        setMessage("Workout scheduled successfully!")
        // Reset form
        setSelectedClient("")
        setSelectedWorkout("")
        setScheduledDate("")
        setNotes("")
        // Refresh assignments
        fetchData()
      } else {
        const errorData = await response.json()
        setMessage(`Error: ${errorData.error}`)
      }
    } catch (error) {
      console.error("Error scheduling workout:", error)
      setMessage("Error scheduling workout. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId)
    return client?.user.name || "Unknown Client"
  }

  const getWorkoutName = (workoutId: string) => {
    const workout = workouts.find(w => w.id === workoutId)
    return workout?.name || "Unknown Workout"
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session?.user || (session.user.role !== "trainer" && session.user.role !== "admin")) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Schedule Workout</h1>
                <p className="text-sm text-gray-500">Assign workouts to your clients</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {session.user.name || session.user.email}
              </span>
              <Link href="/dashboard">
                <Button variant="outline">Dashboard</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Schedule Form */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Plus className="h-5 w-5 text-blue-600" />
                  <span>Schedule New Workout</span>
                </CardTitle>
                <CardDescription>
                  Select a client, workout, and schedule details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Client Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Client
                    </label>
                    <select
                      value={selectedClient}
                      onChange={(e) => setSelectedClient(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Choose a client...</option>
                      {clients.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.user.name} ({client.user.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Workout Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Workout
                    </label>
                    <select
                      value={selectedWorkout}
                      onChange={(e) => setSelectedWorkout(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Choose a workout...</option>
                      {workouts.map((workout) => (
                        <option key={workout.id} value={workout.id}>
                          {workout.name} - {workout.duration} ({workout.difficulty})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Date Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Scheduled Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes (Optional)
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Add any specific instructions or notes for this workout..."
                    />
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={submitting || !selectedClient || !selectedWorkout}
                    className="w-full"
                  >
                    {submitting ? "Scheduling..." : "Schedule Workout"}
                  </Button>

                  {/* Message */}
                  {message && (
                    <div className={`p-3 rounded-md ${
                      message.includes("successfully") 
                        ? "bg-green-50 text-green-800 border border-green-200" 
                        : "bg-red-50 text-red-800 border border-red-200"
                    }`}>
                      {message.includes("successfully") ? (
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4" />
                          <span>{message}</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <AlertCircle className="h-4 w-4" />
                          <span>{message}</span>
                        </div>
                      )}
                    </div>
                  )}
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Current Assignments */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-green-600" />
                  <span>Current Assignments</span>
                </CardTitle>
                <CardDescription>
                  View all workouts you've assigned to clients
                </CardDescription>
              </CardHeader>
              <CardContent>
                {assignments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Dumbbell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No workouts assigned yet</p>
                    <p className="text-sm">Use the form to schedule workouts for your clients</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {assignments.map((assignment) => (
                      <div
                        key={assignment.id}
                        className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">
                              {getClientName(assignment.clientId)}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {getWorkoutName(assignment.templateId)}
                            </p>
                            {assignment.scheduledDate && (
                              <p className="text-xs text-gray-500 mt-1">
                                Scheduled: {new Date(assignment.scheduledDate).toLocaleDateString()}
                              </p>
                            )}
                            {assignment.notes && (
                              <p className="text-sm text-gray-600 mt-2 italic">
                                "{assignment.notes}"
                              </p>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              assignment.status === "ASSIGNED" 
                                ? "bg-blue-100 text-blue-800"
                                : assignment.status === "COMPLETED"
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}>
                              {assignment.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3">
                <Users className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">{clients.length}</p>
                  <p className="text-sm text-gray-500">Total Clients</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3">
                <Dumbbell className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">{workouts.length}</p>
                  <p className="text-sm text-gray-500">Available Workouts</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3">
                <Calendar className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">{assignments.length}</p>
                  <p className="text-sm text-gray-500">Scheduled Workouts</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
