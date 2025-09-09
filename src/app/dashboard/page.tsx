"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Users, Dumbbell, TrendingUp, Plus, Search, Filter, LogOut, User, Settings, BarChart3, Eye, Edit, Home, FileText, Clock, MessageCircle } from "lucide-react"
import Link from "next/link"

interface User {
  id: string
  name: string
  email: string
  role: string
  clients?: string[]
  trainerId?: string
}

interface Client {
  id: string
  userId: string
  user: {
    name: string
    email: string
  }
  goals: string
  notes: string
  createdAt: string
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [workoutCount, setWorkoutCount] = useState(0)
  const [assignments, setAssignments] = useState([])
  const [availableClients, setAvailableClients] = useState([])
  const [showClientAssignment, setShowClientAssignment] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "loading") return
    
    if (status === "unauthenticated") {
      router.push("/")
      return
    }

    if (session?.user) {
      setUser(session.user as User)
      if (session.user.role === "TRAINER" || session.user.role === "ADMIN") {
        fetchClients()
        fetchAvailableClients()
        fetchWorkoutCount()
        fetchAssignments()
      } else {
        fetchWorkoutCount()
        fetchAssignments()
      }
    }
  }, [session, status, router])

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients')
      if (response.ok) {
        const data = await response.json()
        setClients(data.clients)
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
    }
  }

  const fetchWorkoutCount = async () => {
    try {
      const response = await fetch('/api/workouts')
      if (response.ok) {
        const data = await response.json()
        setWorkoutCount(data.count)
      }
    } catch (error) {
      console.error('Error fetching workout count:', error)
    }
  }

  const fetchAssignments = async () => {
    try {
      const response = await fetch('/api/workouts/assign')
      if (response.ok) {
        const data = await response.json()
        setAssignments(data.assignments)
      }
    } catch (error) {
      console.error('Error fetching assignments:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableClients = async () => {
    try {
      const response = await fetch('/api/clients/available')
      if (response.ok) {
        const data = await response.json()
        setAvailableClients(data.clients)
      }
    } catch (error) {
      console.error('Error fetching available clients:', error)
    }
  }

  const handleAssignClient = async (clientId: string) => {
    try {
      const response = await fetch('/api/clients/assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ clientId })
      })

      if (response.ok) {
        // Refresh the lists
        fetchClients()
        fetchAvailableClients()
        setShowClientAssignment(false)
        alert('Client assigned successfully!')
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error assigning client:', error)
      alert('Error assigning client. Please try again.')
    }
  }

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    router.push("/")
  }

  const handleHomeClick = () => {
    router.push("/dashboard")
  }

  const handleWorkoutBuilderClick = () => {
    router.push("/create-workout")
  }

  const handleWorkoutLibraryClick = () => {
    router.push("/templates")
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const isTrainer = user.role === "TRAINER" || user.role === "ADMIN"
  const isClient = user.role === "CLIENT"

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-gray-900">WhateverFit</h1>
              </div>
              <div className="text-sm text-gray-500">
                Welcome back, {user.name}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {isTrainer && (
                <Button 
                  variant="primary" 
                  className="flex items-center space-x-2"
                  onClick={handleWorkoutBuilderClick}
                >
                  <Plus className="h-4 w-4" />
                  <span>Create Workout</span>
                </Button>
              )}
              <Button 
                variant="ghost" 
                onClick={() => signOut()}
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Bar */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={handleHomeClick}
              className="flex items-center space-x-2 py-4 px-2 text-gray-600 hover:text-gray-900 border-b-2 border-transparent hover:border-red-600 transition-colors"
            >
              <Home className="h-4 w-4" />
              <span>Dashboard</span>
            </button>
            {isTrainer ? (
              <>
                <Link
                  href="/clients"
                  className="flex items-center space-x-2 py-4 px-2 text-gray-600 hover:text-gray-900 border-b-2 border-transparent hover:border-red-600 transition-colors"
                >
                  <Users className="h-4 w-4" />
                  <span>Clients</span>
                </Link>
                <Link
                  href="/assign-workout"
                  className="flex items-center space-x-2 py-4 px-2 text-gray-600 hover:text-gray-900 border-b-2 border-transparent hover:border-red-600 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Assign Workout</span>
                </Link>
                <button
                  onClick={handleWorkoutLibraryClick}
                  className="flex items-center space-x-2 py-4 px-2 text-gray-600 hover:text-gray-900 border-b-2 border-transparent hover:border-red-600 transition-colors"
                >
                  <FileText className="h-4 w-4" />
                  <span>Workout Library</span>
                </button>
                <Link
                  href="/exercises"
                  className="flex items-center space-x-2 py-4 px-2 text-gray-600 hover:text-gray-900 border-b-2 border-transparent hover:border-red-600 transition-colors"
                >
                  <Dumbbell className="h-4 w-4" />
                  <span>Exercise Library</span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/coach"
                  className="flex items-center space-x-2 py-4 px-2 text-gray-600 hover:text-gray-900 border-b-2 border-transparent hover:border-red-600 transition-colors"
                >
                  <User className="h-4 w-4" />
                  <span>My Coach</span>
                </Link>
                <Link
                  href="/progress"
                  className="flex items-center space-x-2 py-4 px-2 text-gray-600 hover:text-gray-900 border-b-2 border-transparent hover:border-red-600 transition-colors"
                >
                  <TrendingUp className="h-4 w-4" />
                  <span>Progress</span>
                </Link>
              </>
            )}

          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Role-specific Welcome */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {isTrainer ? "Trainer Dashboard" : "Client Dashboard"}
          </h2>
          <p className="text-gray-600">
            {isTrainer 
              ? "Manage your clients, create workouts, and track progress"
              : "View your schedule, track workouts, and monitor progress"
            }
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    {isTrainer ? "Clients" : "Total Clients"}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">{clients.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Dumbbell className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    {isTrainer ? "Workouts Created" : "Workouts Assigned"}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">{workoutCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    {isTrainer ? "Active Assignments" : "Completed Workouts"}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">{assignments.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    {isTrainer ? "This Month" : "This Month"}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {isTrainer 
                      ? clients.filter(client => {
                          const createdAt = new Date(client.createdAt)
                          const now = new Date()
                          return createdAt.getMonth() === now.getMonth() && createdAt.getFullYear() === now.getFullYear()
                        }).length
                      : assignments.filter((assignment: any) => {
                          const completedAt = assignment.completedAt ? new Date(assignment.completedAt) : null
                          const now = new Date()
                          return completedAt && completedAt.getMonth() === now.getMonth() && completedAt.getFullYear() === now.getFullYear()
                        }).length
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions for Trainers */}
        {isTrainer && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link href="/create-workout">
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardContent className="p-6 h-full flex flex-col">
                    <div className="flex items-center space-x-3 flex-1">
                      <Plus className="h-8 w-8 text-blue-600 flex-shrink-0" />
                      <div className="min-w-0">
                        <h4 className="font-semibold text-gray-900">Create Workout</h4>
                        <p className="text-sm text-gray-600">Build a new workout program</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              
              <Link href="/clients">
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardContent className="p-6 h-full flex flex-col">
                    <div className="flex items-center space-x-3 flex-1">
                      <Users className="h-8 w-8 text-blue-600 flex-shrink-0" />
                      <div className="min-w-0">
                        <h4 className="font-semibold text-gray-900">Manage Clients</h4>
                        <p className="text-sm text-gray-600">View and manage your clients</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              
              <Link href="/exercises">
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardContent className="p-6 h-full flex flex-col">
                    <div className="flex items-center space-x-3 flex-1">
                      <Dumbbell className="h-8 w-8 text-blue-600 flex-shrink-0" />
                      <div className="min-w-0">
                        <h4 className="font-semibold text-gray-900">Exercise Library</h4>
                        <p className="text-sm text-gray-600">Browse exercise database</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/chat">
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardContent className="p-6 h-full flex flex-col">
                    <div className="flex items-center space-x-3 flex-1">
                      <MessageCircle className="h-8 w-8 text-green-600 flex-shrink-0" />
                      <div className="min-w-0">
                        <h4 className="font-semibold text-gray-900">Messages</h4>
                        <p className="text-sm text-gray-600">Chat with your clients</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>
        )}

        {/* Quick Actions for Clients */}
        {isClient && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Link href="/schedule">
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardContent className="p-6 h-full flex flex-col">
                    <div className="flex items-center space-x-3 flex-1">
                      <Calendar className="h-8 w-8 text-blue-600 flex-shrink-0" />
                      <div className="min-w-0">
                        <h4 className="font-semibold text-gray-900">My Schedule</h4>
                        <p className="text-sm text-gray-600">View your workout schedule</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/chat">
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardContent className="p-6 h-full flex flex-col">
                    <div className="flex items-center space-x-3 flex-1">
                      <MessageCircle className="h-8 w-8 text-green-600 flex-shrink-0" />
                      <div className="min-w-0">
                        <h4 className="font-semibold text-gray-900">Messages</h4>
                        <p className="text-sm text-gray-600">Chat with your trainer</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/templates">
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardContent className="p-6 h-full flex flex-col">
                    <div className="flex items-center space-x-3 flex-1">
                      <Dumbbell className="h-8 w-8 text-purple-600 flex-shrink-0" />
                      <div className="min-w-0">
                        <h4 className="font-semibold text-gray-900">Workout Templates</h4>
                        <p className="text-sm text-gray-600">Browse available workouts</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>
        )}

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
            <div className="space-y-3">
              {isTrainer ? (
                <>
                  {clients.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p className="text-sm">No recent activity</p>
                      <p className="text-xs">Activity will appear here once you have clients</p>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">Welcome to WhateverFit!</p>
                          <p className="text-xs text-gray-600">Get started by creating your first workout</p>
                        </div>
                      </div>
                    </>
                  )}
                </>
              ) : session?.user?.role === "ADMIN" ? (
                <>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">Admin Dashboard</p>
                      <p className="text-xs text-gray-600">Manage all trainers, clients, and workout assignments</p>
                    </div>
                  </div>
                  {clients.length > 0 && (
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">{clients.length} clients registered</p>
                        <p className="text-xs text-gray-600">Across all trainers in the system</p>
                      </div>
                    </div>
                  )}
                  {assignments.length > 0 && (
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">{assignments.length} workout assignments</p>
                        <p className="text-xs text-gray-600">Active across all clients</p>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">Welcome to WhateverFit!</p>
                      <p className="text-xs text-gray-600">Your trainer will assign workouts here</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Client Assignment Modal */}
      {showClientAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Assign Available Clients</h2>
                  <p className="text-gray-600">Select clients to assign to your training program</p>
                </div>
                <button
                  onClick={() => setShowClientAssignment(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {availableClients.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">No available clients</p>
                  <p className="text-xs">All clients are already assigned to trainers</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {availableClients.map((client: any) => (
                    <div key={client.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div>
                        <h3 className="font-medium text-gray-900">{client.user.name}</h3>
                        <p className="text-sm text-gray-600">{client.user.email}</p>
                      </div>
                                              <Button 
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                          size="sm"
                          onClick={() => handleAssignClient(client.id)}
                        >
                        Assign to Me
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end mt-6 pt-4 border-t border-gray-200">
                <Button variant="outline" onClick={() => setShowClientAssignment(false)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

