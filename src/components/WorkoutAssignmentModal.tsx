"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { X, Calendar, User, Dumbbell, Clock } from "lucide-react"

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
}

interface WorkoutAssignmentModalProps {
  isOpen: boolean
  onClose: () => void
  workout: WorkoutTemplate | null
  clients: Client[]
  onAssign: (assignment: any) => void
}

export default function WorkoutAssignmentModal({
  isOpen,
  onClose,
  workout,
  clients,
  onAssign
}: WorkoutAssignmentModalProps) {
  const [selectedClientId, setSelectedClientId] = useState("")
  const [scheduledDate, setScheduledDate] = useState("")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      // Set default date to tomorrow
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      setScheduledDate(tomorrow.toISOString().split('T')[0])
    }
  }, [isOpen])

  const handleAssign = async () => {
    if (!selectedClientId || !workout) {
      alert("Please select a client")
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/workouts/assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workoutId: workout.id,
          clientId: selectedClientId,
          scheduledDate,
          notes
        })
      })

      if (response.ok) {
        const result = await response.json()
        onAssign(result.assignment)
        onClose()
        // Reset form
        setSelectedClientId("")
        setNotes("")
      } else {
        const error = await response.json()
        alert(`Error assigning workout: ${error.error}`)
      }
    } catch (error) {
      console.error('Error assigning workout:', error)
      alert('Error assigning workout. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !workout) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Assign Workout</h2>
              <p className="text-gray-600">Assign this workout to a client</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Workout Details */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Dumbbell className="h-5 w-5 text-blue-600" />
                {workout.name}
              </CardTitle>
              <CardDescription>{workout.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span>{workout.duration}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                    {workout.difficulty}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-blue-100 rounded text-xs">
                    {workout.category}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Assignment Form */}
          <div className="space-y-6">
            {/* Client Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Client
              </label>
              {clients.length === 0 ? (
                <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                  <User className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">No clients available</p>
                  <p className="text-xs">Clients need to register first</p>
                </div>
              ) : (
                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Choose a client...</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.user.name} ({client.user.email})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Scheduled Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Scheduled Date
              </label>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                placeholder="Add any specific instructions or notes for the client..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleAssign}
              disabled={!selectedClientId || loading}
              className="min-w-[100px]"
            >
              {loading ? "Assigning..." : "Assign Workout"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

