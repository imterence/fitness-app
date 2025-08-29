"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, User, Clock, MessageSquare } from "lucide-react"

interface Client {
  id: string
  userId: string
  user: {
    name: string
    email: string
  }
  goals?: string
  notes?: string
}

interface WorkoutAssignmentProps {
  workoutId: string
  workoutName: string
  onAssignmentComplete?: () => void
}

export default function WorkoutAssignment({ workoutId, workoutName, onAssignmentComplete }: WorkoutAssignmentProps) {
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClientId, setSelectedClientId] = useState("")
  const [scheduledDate, setScheduledDate] = useState(() => {
    const today = new Date()
    return today.toISOString().split('T')[0] // Format: YYYY-MM-DD
  })
  const [notes, setNotes] = useState("")
  const [isAssigning, setIsAssigning] = useState(false)
  const [assignmentStatus, setAssignmentStatus] = useState<{
    type: 'success' | 'error' | null
    message: string
  }>({ type: null, message: '' })

  useEffect(() => {
    fetchClients()
  }, [])

  const fetchClients = async () => {
    try {
      console.log("Fetching clients...")
      const response = await fetch('/api/clients')
      console.log("Clients API response:", response.status, response.ok)
      if (response.ok) {
        const data = await response.json()
        console.log("Clients data:", data)
        setClients(data.clients)
      } else {
        console.error('Failed to fetch clients:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
    }
  }

  const handleAssignment = async () => {
    if (!selectedClientId || !scheduledDate) {
      setAssignmentStatus({
        type: 'error',
        message: 'Please select a client and schedule date'
      })
      return
    }

    console.log("Starting assignment with:", { selectedClientId, workoutId, scheduledDate, notes })
    setIsAssigning(true)
    setAssignmentStatus({ type: null, message: '' })

    try {
      const response = await fetch('/api/workouts/assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId: selectedClientId,
          workoutId,
          scheduledDate,
          notes
        }),
      })

      console.log("Assignment API response:", response.status, response.ok)
      const result = await response.json()
      console.log("Assignment API result:", result)

      if (response.ok) {
        setAssignmentStatus({
          type: 'success',
          message: 'Workout assigned successfully!'
        })
        
        // Reset form
        setSelectedClientId("")
        setScheduledDate(() => {
          const today = new Date()
          return today.toISOString().split('T')[0] // Format: YYYY-MM-DD
        })
        setNotes("")
        
        // Notify parent component
        if (onAssignmentComplete) {
          onAssignmentComplete()
        }
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setAssignmentStatus({ type: null, message: '' })
        }, 3000)
      } else {
        setAssignmentStatus({
          type: 'error',
          message: result.error || 'Failed to assign workout'
        })
      }
    } catch (error) {
      console.error("Error assigning workout:", error)
      setAssignmentStatus({
        type: 'error',
        message: 'Network error. Please try again.'
      })
    } finally {
      setIsAssigning(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Assign Workout to Client
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Workout Info */}
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-sm text-gray-600">Workout to assign:</p>
          <p className="font-medium text-gray-900">{workoutName}</p>
        </div>

        {/* Client Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Client *
          </label>
          <select
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Choose a client...</option>
            {clients.map(client => (
              <option key={client.id} value={client.userId}>
                {client.user.name} ({client.user.email})
              </option>
            ))}
          </select>
        </div>

        {/* Schedule Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Schedule Date *
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <input
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Add any specific instructions or notes for the client..."
            rows={3}
          />
        </div>

        {/* Status Messages */}
        {assignmentStatus.type && (
          <div className={`rounded-md p-3 ${
            assignmentStatus.type === 'success' 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <p className={`text-sm font-medium ${
              assignmentStatus.type === 'success' ? 'text-green-800' : 'text-red-800'
            }`}>
              {assignmentStatus.message}
            </p>
          </div>
        )}

        {/* Assignment Button */}
        <Button
          onClick={handleAssignment}
          disabled={!selectedClientId || !scheduledDate || isAssigning}
          className="w-full"
        >
          <Clock className="h-4 w-4 mr-2" />
          {isAssigning ? "Assigning..." : "Assign Workout"}
        </Button>

        {/* Client List Preview */}
        {clients.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Available Clients</h4>
            <div className="space-y-2">
              {clients.map(client => (
                <div key={client.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{client.user.name}</p>
                    <p className="text-sm text-gray-600">{client.user.email}</p>
                    {client.goals && (
                      <p className="text-xs text-gray-500 mt-1">Goals: {client.goals}</p>
                    )}
                  </div>
                                     <Button
                     variant="outline"
                     size="sm"
                     onClick={() => {
                       setSelectedClientId(client.userId)
                       setScheduledDate(new Date().toISOString().split('T')[0])
                     }}
                   >
                    Select
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
