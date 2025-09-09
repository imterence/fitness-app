"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Users, 
  User, 
  Mail, 
  Target, 
  Calendar, 
  Plus, 
  ArrowLeft,
  Phone,
  MapPin,
  Activity,
  UserPlus,
  UserMinus,
  RefreshCw,
  CheckCircle,
  XCircle,
  MessageCircle
} from "lucide-react"
import Link from "next/link"

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
  createdAt: string
  assignedWorkouts?: any[]
  trainer?: {
    id: string
    name: string
    email: string
  }
  subscriptionStatus?: string
  subscriptionPlan?: string
  subscriptionStart?: string
  subscriptionEnd?: string
}

export default function ClientsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [assignedClients, setAssignedClients] = useState<Client[]>([])
  const [availableClients, setAvailableClients] = useState<Client[]>([])
  const [otherTrainersClients, setOtherTrainersClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isAssigning, setIsAssigning] = useState<string | null>(null)
  const [isUnassigning, setIsUnassigning] = useState<string | null>(null)
  const [isReassigning, setIsReassigning] = useState<string | null>(null)
  const [showReassignModal, setShowReassignModal] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [trainers, setTrainers] = useState<any[]>([])
  const [selectedTrainerId, setSelectedTrainerId] = useState<string>("")
  const [isStartingConversation, setIsStartingConversation] = useState<string | null>(null)

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      fetchClients()
      if (session.user.role === "ADMIN") {
        fetchTrainers()
      }
    }
  }, [status, session])

  const fetchClients = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Fetch both assigned and available clients
      const [assignedResponse, availableResponse] = await Promise.all([
        fetch('/api/clients'),
        fetch('/api/clients/available')
      ])

      if (assignedResponse.ok && availableResponse.ok) {
        const assignedData = await assignedResponse.json()
        const availableData = await availableResponse.json()
        
        // For trainers, we need to separate clients into assigned vs unassigned
        if (session?.user?.role === "TRAINER") {
          const myAssignedClients = assignedData.clients.filter((client: any) => 
            client.trainerId === session.user.id
          )
          const unassignedClients = assignedData.clients.filter((client: any) => 
            client.trainerId === null
          )
          const otherTrainersClients = assignedData.clients.filter((client: any) => 
            client.trainerId && client.trainerId !== session.user.id
          )
          
          setAssignedClients(myAssignedClients)
          setAvailableClients(unassignedClients)
          setOtherTrainersClients(otherTrainersClients)
        } else {
          // Admin sees all clients as assigned
          setAssignedClients(assignedData.clients)
          setAvailableClients(availableData.clients)
        }
      } else {
        setError('Failed to fetch clients')
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
      setError('Network error')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchTrainers = async () => {
    try {
      const response = await fetch('/api/users?role=TRAINER')
      if (response.ok) {
        const data = await response.json()
        setTrainers(data.users || [])
      }
    } catch (error) {
      console.error('Error fetching trainers:', error)
    }
  }

  const handleAssignClient = async (clientId: string) => {
    try {
      setIsAssigning(clientId)
      const response = await fetch('/api/clients/assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ clientId })
      })

      if (response.ok) {
        // Refresh the client lists
        await fetchClients()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to assign client')
      }
    } catch (error) {
      console.error('Error assigning client:', error)
      setError('Network error')
    } finally {
      setIsAssigning(null)
    }
  }

  const handleUnassignClient = async (clientId: string) => {
    try {
      setIsUnassigning(clientId)
      const response = await fetch('/api/clients/unassign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ clientId })
      })

      if (response.ok) {
        // Refresh the client lists
        await fetchClients()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to unassign client')
      }
    } catch (error) {
      console.error('Error unassigning client:', error)
      setError('Network error')
    } finally {
      setIsUnassigning(null)
    }
  }

  const handleReassignClient = async (clientId: string, newTrainerId: string) => {
    try {
      setIsReassigning(clientId)
      setError(null) // Clear any existing errors
      const response = await fetch('/api/clients/reassign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ clientId, newTrainerId })
      })

      if (response.ok) {
        // Refresh the client lists
        await fetchClients()
        setShowReassignModal(false)
        setSelectedClient(null)
        setSelectedTrainerId("")
        // Show success message
        setError(null)
        setSuccessMessage(selectedClient?.trainer ? 'Client reassigned successfully!' : 'Client assigned to trainer successfully!')
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to reassign client')
      }
    } catch (error) {
      console.error('Error reassigning client:', error)
      setError('Network error')
    } finally {
      setIsReassigning(null)
    }
  }

  const handleToggleSubscription = async (clientId: string, newStatus: string) => {
    try {
      setError(null)
      const response = await fetch('/api/clients/subscription', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ clientId, subscriptionStatus: newStatus })
      })

      if (response.ok) {
        // Refresh the client lists
        await fetchClients()
        setSuccessMessage(`Subscription status updated to ${newStatus}`)
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to update subscription status')
      }
    } catch (error) {
      console.error('Error updating subscription status:', error)
      setError('Network error')
    }
  }

  const handleStartConversation = async (clientId: string) => {
    console.log("Starting conversation with client:", clientId)
    console.log("Current user ID:", session?.user?.id)
    
    setIsStartingConversation(clientId)
    setError(null)
    
    try {
      const response = await fetch("/api/chat/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: clientId,
          trainerId: session?.user?.id
        })
      })

      console.log("Response status:", response.status)
      const data = await response.json()
      console.log("Response data:", data)

      if (response.ok) {
        console.log("Conversation created successfully, redirecting to chat")
        // Redirect to chat page
        router.push("/chat")
      } else {
        console.error("Failed to start conversation:", data.error)
        setError(data.error || "Failed to start conversation")
      }
    } catch (error) {
      console.error("Error starting conversation:", error)
      setError("Network error while starting conversation")
    } finally {
      setIsStartingConversation(null)
    }
  }

  const handleUpdateSubscriptionPlan = async (clientId: string, newPlan: string) => {
    try {
      setError(null)
      const response = await fetch('/api/clients/subscription', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ clientId, subscriptionPlan: newPlan })
      })

      if (response.ok) {
        // Refresh the client lists
        await fetchClients()
        setSuccessMessage(`Subscription plan updated to ${newPlan}`)
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to update subscription plan')
      }
    } catch (error) {
      console.error('Error updating subscription plan:', error)
      setError('Network error')
    }
  }

  // Show loading while checking authentication
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-900">Loading...</p>
        </div>
      </div>
    )
  }

  // Redirect if not authenticated
  if (status === "unauthenticated") {
    router.push('/')
    return null
  }

  // Redirect if user is a client
  if (session?.user?.role === "CLIENT") {
    router.push('/schedule')
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-4 sm:h-16 space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900 hover:bg-gray-100">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Back to Dashboard</span>
                  <span className="sm:hidden">Back</span>
                </Button>
              </Link>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Client Management</h1>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4 w-full sm:w-auto">
              <Link href="/create-workout" className="flex-1 sm:flex-none">
                <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Create Workout</span>
                  <span className="sm:hidden">Create</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              <p className="text-green-800">{successMessage}</p>
            </div>
          </div>
        )}
        
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center">
              <XCircle className="h-5 w-5 text-red-600 mr-2" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    {session?.user?.role === "ADMIN" ? "Total Clients" : "My Assigned Clients"}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">{assignedClients.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <UserPlus className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Available</p>
                  <p className="text-2xl font-bold text-gray-900">{availableClients.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Activity className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    {session?.user?.role === "ADMIN" ? "Active Clients" : "Other Trainers"}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {session?.user?.role === "ADMIN" 
                      ? assignedClients.filter(client => client.assignedWorkouts && client.assignedWorkouts.length > 0).length
                      : otherTrainersClients.length
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">New This Month</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {assignedClients.filter(client => {
                      const createdAt = new Date(client.createdAt)
                      const now = new Date()
                      return createdAt.getMonth() === now.getMonth() && createdAt.getFullYear() === now.getFullYear()
                    }).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Trainer Distribution Stats - Admin Only */}
          {session?.user?.role === "ADMIN" && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-red-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">With Trainers</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {assignedClients.filter(client => client.trainer).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Subscription Summary - Admin Only */}
        {session?.user?.role === "ADMIN" && (
          <div className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-800">Active Subscriptions</p>
                      <p className="text-2xl font-bold text-green-900">
                        {assignedClients.filter(c => c.subscriptionStatus === 'ACTIVE').length}
                      </p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-red-50 border-red-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-red-800">Inactive Subscriptions</p>
                      <p className="text-2xl font-bold text-red-900">
                        {assignedClients.filter(c => c.subscriptionStatus !== 'ACTIVE').length}
                      </p>
                    </div>
                    <XCircle className="h-8 w-8 text-red-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-800">Assigned to Trainers</p>
                      <p className="text-2xl font-bold text-blue-900">
                        {assignedClients.filter(c => c.trainer).length}
                      </p>
                    </div>
                    <User className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-orange-50 border-orange-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-orange-800">Unassigned</p>
                      <p className="text-2xl font-bold text-orange-900">
                        {assignedClients.filter(c => !c.trainer).length}
                      </p>
                    </div>
                    <UserMinus className="h-8 w-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Available Clients Section */}
        {availableClients.length > 0 && (
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 space-y-2 sm:space-y-0">
              <h2 className="text-xl font-semibold text-gray-900">
                {session?.user?.role === "ADMIN" ? "Available Clients" : "Unassigned Clients"}
              </h2>
              <Badge variant="secondary" className="self-start sm:self-auto">{availableClients.length} available</Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableClients.map((client) => (
                <Card key={client.id} className="hover:shadow-md transition-shadow border-green-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg text-gray-900">{client.user.name}</CardTitle>
                          <Badge variant="outline" className="text-xs">
                            {client.user.role}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail className="h-4 w-4 mr-2" />
                      {client.user.email}
                    </div>
                    
                    {client.goals && (
                      <div className="flex items-start text-sm text-gray-600">
                        <Target className="h-4 w-4 mr-2 mt-0.5" />
                        <span className="line-clamp-2">{client.goals}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="h-4 w-4 mr-2" />
                      Available since {new Date(client.createdAt).toLocaleDateString()}
                    </div>
                    
                    {/* Subscription Status - Admin Only */}
                    {session?.user?.role === "ADMIN" && (
                      <div className="space-y-2 text-sm bg-gray-50 p-3 rounded-md mb-3 border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={client.subscriptionStatus === 'ACTIVE'}
                              onChange={() => handleToggleSubscription(client.id, client.subscriptionStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')}
                              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded mr-2 cursor-pointer"
                            />
                            <span className={`font-medium ${client.subscriptionStatus === 'ACTIVE' ? 'text-green-800' : 'text-gray-600'}`}>
                              Subscription: {client.subscriptionStatus || 'INACTIVE'}
                            </span>
                          </div>
                        </div>
                        
                        {client.subscriptionStatus === 'ACTIVE' && (
                          <div className="flex items-center space-x-2">
                            <label className="text-xs text-gray-600">Plan:</label>
                            <select
                              value={client.subscriptionPlan || 'BASIC'}
                              onChange={(e) => handleUpdateSubscriptionPlan(client.id, e.target.value)}
                              className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-green-500 bg-white text-gray-900"
                            >
                              <option value="BASIC">BASIC</option>
                              <option value="PRO">PRO</option>
                              <option value="ELITE">ELITE</option>
                            </select>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="pt-3 border-t border-gray-200">
                      <Button
                        onClick={() => handleAssignClient(client.id)}
                        disabled={isAssigning === client.id}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        size="sm"
                      >
                        {isAssigning === client.id ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Assigning...
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-4 w-4 mr-2" />
                            Assign to Me
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Other Trainers' Clients Section - Only for Trainers */}
        {session?.user?.role === "TRAINER" && otherTrainersClients.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Clients Assigned to Other Trainers</h2>
              <Badge variant="secondary">{otherTrainersClients.length} clients</Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {otherTrainersClients.map((client) => (
                <Card key={client.id} className="hover:shadow-md transition-shadow border-gray-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{client.user.name}</CardTitle>
                          <Badge variant="outline" className="text-xs">
                            {client.user.role}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail className="h-4 w-4 mr-2" />
                      {client.user.email}
                    </div>
                    
                    {client.goals && (
                      <div className="flex items-start text-sm text-gray-600">
                        <Target className="h-4 w-4 mr-2 mt-0.5" />
                        <span className="line-clamp-2">{client.goals}</span>
                      </div>
                    )}
                    
                    {client.trainer && (
                      <div className="flex items-center text-sm text-blue-600">
                        <User className="h-4 w-4 mr-2" />
                        <span>Trainer: {client.trainer.name}</span>
                      </div>
                    )}
                    
                    {/* Subscription Status - Admin Only */}
                    {session?.user?.role === "ADMIN" && (
                      <div className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded-md">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={client.subscriptionStatus === 'ACTIVE'}
                            onChange={() => handleToggleSubscription(client.id, client.subscriptionStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')}
                            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded mr-2 cursor-pointer"
                          />
                          <span className={`font-medium ${client.subscriptionStatus === 'ACTIVE' ? 'text-green-700' : 'text-gray-600'}`}>
                            Subscription: {client.subscriptionStatus || 'INACTIVE'}
                          </span>
                        </div>
                        {client.subscriptionPlan && (
                          <Badge variant="outline" className="text-xs">
                            {client.subscriptionPlan}
                          </Badge>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="h-4 w-4 mr-2" />
                      Client since {new Date(client.createdAt).toLocaleDateString()}
                    </div>
                    
                    <div className="pt-3 border-t">
                      <div className="text-center text-sm text-gray-500 py-2">
                        View only - Client assigned to another trainer
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Assigned Clients Section */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
            <h2 className="text-xl font-semibold text-gray-900">
              {session?.user?.role === "ADMIN" ? "All Clients" : "My Assigned Clients"}
            </h2>
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
              <Badge variant="secondary" className="self-start sm:self-auto">{assignedClients.length} assigned</Badge>
              
              {/* Trainer Filter - Admin Only */}
              {session?.user?.role === "ADMIN" && trainers.length > 0 && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
                  <label className="text-sm text-gray-600 whitespace-nowrap">Filter by assigned trainer:</label>
                  <select
                    className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
                    onChange={(e) => {
                      // TODO: Implement trainer filtering
                      if (e.target.value) {
                        setError(`Filtering by trainer: ${e.target.value} - Coming soon!`)
                      }
                    }}
                    defaultValue=""
                  >
                    <option value="">All Trainers</option>
                    {trainers.map((trainer) => (
                      <option key={trainer.id} value={trainer.id}>
                        {trainer.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              {/* Subscription Status Filter - Admin Only */}
              {session?.user?.role === "ADMIN" && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
                  <label className="text-sm text-gray-600 whitespace-nowrap">Filter by subscription:</label>
                  <select
                    className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
                    onChange={(e) => {
                      // TODO: Implement subscription filtering
                      if (e.target.value) {
                        setError(`Filtering by subscription: ${e.target.value} - Coming soon!`)
                      }
                    }}
                    defaultValue=""
                  >
                    <option value="">All Subscriptions</option>
                    <option value="ACTIVE">Active Only</option>
                    <option value="INACTIVE">Inactive Only</option>
                    <option value="EXPIRED">Expired Only</option>
                    <option value="CANCELLED">Cancelled Only</option>
                  </select>
                </div>
              )}

            </div>
          </div>

          {assignedClients.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Users className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Clients Assigned</h3>
                <p className="text-gray-600 mb-4">
                  {availableClients.length > 0 
                    ? "Select clients from the available list above to start training them."
                    : "No clients are available for assignment yet."
                  }
                </p>
                {availableClients.length === 0 && (
                  <Link href="/create-workout">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Workout
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {assignedClients.map((client) => (
                <Card key={client.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{client.user.name}</CardTitle>
                          <Badge variant="outline" className="text-xs">
                            {client.user.role}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail className="h-4 w-4 mr-2" />
                      {client.user.email}
                    </div>
                    
                    {client.goals && (
                      <div className="flex items-start text-sm text-gray-600">
                        <Target className="h-4 w-4 mr-2 mt-0.5" />
                        <span className="line-clamp-2">{client.goals}</span>
                      </div>
                    )}
                    
                    {client.notes && (
                      <div className="flex items-start text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mr-2 mt-0.5" />
                        <span className="line-clamp-2">{client.notes}</span>
                      </div>
                    )}
                    
                    {/* Trainer Status Display - Fixed */}
                    {session?.user?.role === "ADMIN" && client.trainer && (
                      <div className="flex items-center text-sm text-blue-600">
                        <User className="h-4 w-4 mr-2" />
                        <span>Trainer: {client.trainer.name}</span>
                      </div>
                    )}
                    
                    {session?.user?.role === "ADMIN" && !client.trainer && (
                      <div className="flex items-center text-sm text-orange-600">
                        <User className="h-4 w-4 mr-2" />
                        <span>No trainer assigned</span>
                      </div>
                    )}
                    
                    {/* Show trainer info for regular trainers too */}
                    {session?.user?.role === "TRAINER" && client.trainer && (
                      <div className="flex items-center text-sm text-blue-600">
                        <User className="h-4 w-4 mr-2" />
                        <span>Your Client</span>
                      </div>
                    )}
                    
                    {session?.user?.role === "TRAINER" && !client.trainer && (
                      <div className="flex items-center text-sm text-orange-600">
                        <User className="h-4 w-4 mr-2" />
                        <span>Unassigned Client</span>
                      </div>
                    )}
                    
                    {/* Subscription Status - Admin Only */}
                    {session?.user?.role === "ADMIN" && (
                      <div className="space-y-2 text-sm bg-gray-50 p-3 rounded-md">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={client.subscriptionStatus === 'ACTIVE'}
                              onChange={() => handleToggleSubscription(client.id, client.subscriptionStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')}
                              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded mr-2 cursor-pointer"
                            />
                            <span className={`font-medium ${client.subscriptionStatus === 'ACTIVE' ? 'text-green-700' : 'text-gray-600'}`}>
                              Subscription: {client.subscriptionStatus || 'INACTIVE'}
                            </span>
                          </div>
                        </div>
                        
                        {client.subscriptionStatus === 'ACTIVE' && (
                          <div className="flex items-center space-x-2">
                            <label className="text-xs text-gray-600">Plan:</label>
                            <select
                              value={client.subscriptionPlan || 'BASIC'}
                              onChange={(e) => handleUpdateSubscriptionPlan(client.id, e.target.value)}
                              className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-green-500"
                            >
                              <option value="BASIC">BASIC</option>
                              <option value="PRO">PRO</option>
                              <option value="ELITE">ELITE</option>
                            </select>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="h-4 w-4 mr-2" />
                      Client since {new Date(client.createdAt).toLocaleDateString()}
                    </div>
                    
                    <div className="pt-3 border-t space-y-2">
                      <div className="flex space-x-2">
                        <Link href={`/schedule?clientId=${client.userId}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full">
                            <Calendar className="h-4 w-4 mr-2" />
                            View Schedule
                          </Button>
                        </Link>
                        <Button 
                          onClick={() => handleStartConversation(client.userId)}
                          disabled={isStartingConversation === client.userId}
                          size="sm" 
                          className="w-8 h-8 p-0 bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 flex items-center justify-center"
                        >
                          {isStartingConversation === client.userId ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <MessageCircle className="h-4 w-8" />
                          )}
                        </Button>
                        <Link href={`/assign-workout?clientId=${client.userId}`} className="flex-1">
                          <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                            <Plus className="h-4 w-4 mr-2" />
                            Workout
                          </Button>
                        </Link>
                      </div>
                      
                      <div className="flex space-x-2">
                        {session?.user?.role === "ADMIN" && client.trainer && (
                          <>
                            <Button
                              onClick={() => {
                                setSelectedClient(client)
                                setShowReassignModal(true)
                              }}
                              variant="outline"
                              size="sm"
                              className="flex-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                            >
                              <User className="h-4 w-4 mr-2" />
                              Reassign
                            </Button>
                            <Button 
                              onClick={() => handleStartConversation(client.userId)}
                              disabled={isStartingConversation === client.userId}
                              size="sm" 
                              className="w-8 h-8 p-0 bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 flex items-center justify-center"
                            >
                              {isStartingConversation === client.userId ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <MessageCircle className="h-4 w-4" />
                              )}
                            </Button>
                          </>
                        )}
                        
                        {session?.user?.role === "ADMIN" && !client.trainer && (
                          <Button
                            onClick={() => {
                              setSelectedClient(client)
                              setShowReassignModal(true)
                            }}
                            variant="outline"
                            size="sm"
                            className="flex-1 text-green-600 border-green-200 hover:bg-green-50"
                          >
                            <UserPlus className="h-4 w-4 mr-2" />
                            Assign to Trainer
                          </Button>
                        )}
                        
                        <Button
                          onClick={() => handleUnassignClient(client.id)}
                          disabled={isUnassigning === client.id}
                          variant="outline"
                          size="sm"
                          className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                        >
                          {isUnassigning === client.id ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              Unassigning...
                            </>
                          ) : (
                            <>
                              <UserMinus className="h-4 w-4 mr-2" />
                              Unassign Client
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      
      {/* Reassign Modal */}
      {showReassignModal && selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {selectedClient.trainer ? `Reassign ${selectedClient.user.name}` : `Assign ${selectedClient.user.name} to Trainer`}
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {selectedClient.trainer ? "Select New Trainer" : "Select Trainer"}
              </label>
              <select
                value={selectedTrainerId}
                onChange={(e) => setSelectedTrainerId(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a trainer...</option>
                {trainers.map((trainer) => (
                  <option key={trainer.id} value={trainer.id}>
                    {trainer.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex space-x-3">
              <Button
                onClick={() => {
                  setShowReassignModal(false)
                  setSelectedClient(null)
                  setSelectedTrainerId("")
                }}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleReassignClient(selectedClient.id, selectedTrainerId)}
                disabled={!selectedTrainerId || isReassigning === selectedClient.id}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isReassigning === selectedClient.id ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    {selectedClient.trainer ? "Reassigning..." : "Assigning..."}
                  </>
                ) : (
                  selectedClient.trainer ? "Reassign" : "Assign"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
