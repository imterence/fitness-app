"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, CheckCircle, AlertCircle, Users, Edit } from "lucide-react"
import Link from "next/link"
import WorkoutBuilder from "@/components/WorkoutBuilder"
import WorkoutAssignment from "@/components/WorkoutAssignment"

interface Exercise {
  id: string
  name: string
  category: string
  sets: number
  reps: string
  rest: string
  notes: string
}

interface WorkoutData {
  name: string
  description: string
  exercises: Exercise[]
  isPublic: boolean
  isMultiDay?: boolean
  days?: any[]
}

export default function WorkoutBuilderPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<{
    type: 'success' | 'error' | null
    message: string
  }>({ type: null, message: '' })
  const [savedWorkout, setSavedWorkout] = useState<{
    id: string
    name: string
  } | null>(null)
  const [showAssignment, setShowAssignment] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editProgramId, setEditProgramId] = useState<string | null>(null)
  const [initialData, setInitialData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  console.log("WorkoutBuilderPage rendered", { session, status })

  // Redirect if not authenticated or not a trainer
  useEffect(() => {
    console.log("useEffect running", { status, session })
    if (status === "loading") return
    
    if (!session?.user) {
      console.log("No session, redirecting to login")
      router.push("/auth/login")
      return
    }
    
    if (session.user.role !== "TRAINER" && session.user.role !== "ADMIN") {
      console.log("Not trainer, redirecting to dashboard")
      router.push("/dashboard")
      return
    }
    
    console.log("User authenticated and authorized")
  }, [session, status, router])

  // Check for edit mode and fetch existing program data
  useEffect(() => {
    const editParam = searchParams.get('edit')
    const typeParam = searchParams.get('type')
    
    if (editParam && typeParam === 'multi-day') {
      setEditMode(true)
      setEditProgramId(editParam)
      fetchExistingProgram(editParam)
    }
  }, [searchParams])

  const fetchExistingProgram = async (programId: string) => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/workout-programs/${programId}`)
      if (response.ok) {
        const program = await response.json()
        setInitialData({
          name: program.name,
          description: program.description,
          isMultiDay: true,
          numberOfDays: program.totalDays,
          days: program.days || []
        })
      }
    } catch (error) {
      console.error('Error fetching existing program:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveWorkout = async (workoutData: WorkoutData) => {
    setIsSaving(true)
    setSaveStatus({ type: null, message: '' })
    
    try {
      console.log("Saving workout:", workoutData)
      
      let endpoint = '/api/workouts'
      let method = 'POST'
      
      if (workoutData.isMultiDay) {
        endpoint = '/api/workout-programs'
        if (editMode && editProgramId) {
          endpoint = `/api/workout-programs/${editProgramId}`
          method = 'PATCH'
        }
      }
      
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(workoutData),
      })
      
      const result = await response.json()
      
      if (response.ok) {
        console.log("Workout saved successfully:", result)
        const workoutName = workoutData.isMultiDay ? result.program.name : result.workout.name
        const workoutId = workoutData.isMultiDay ? result.program.id : result.workout.id
        
        setSaveStatus({
          type: 'success',
          message: editMode 
            ? 'Workout program updated successfully!' 
            : (workoutData.isMultiDay ? 'Workout program created successfully!' : 'Workout saved successfully!')
        })
        
        // Store the saved workout for assignment
        setSavedWorkout({
          id: workoutId,
          name: workoutName
        })
        
        // Show assignment section
        setShowAssignment(true)
        
        // Clear the success message after 5 seconds
        setTimeout(() => {
          setSaveStatus({ type: null, message: '' })
        }, 5000)
      } else {
        console.error("Error saving workout:", result)
        setSaveStatus({
          type: 'error',
          message: result.error || 'Failed to save workout'
        })
      }
    } catch (error) {
      console.error("Network error saving workout:", error)
      setSaveStatus({
        type: 'error',
        message: 'Network error. Please try again.'
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleAssignmentComplete = () => {
    // Reset the form and assignment state
    setSavedWorkout(null)
    setShowAssignment(false)
    // You could also redirect to a different page or show a success message
  }

  // Show loading while checking authentication
  if (status === "loading") {
    console.log("Showing loading state")
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Workout Builder...</p>
        </div>
      </div>
    )
  }

  // Don't render if not authenticated or not a trainer
  if (!session?.user || (session.user.role !== "TRAINER" && session.user.role !== "ADMIN")) {
    console.log("Access denied, showing redirect message")
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Access denied. Redirecting...</p>
        </div>
      </div>
    )
  }

  console.log("Rendering main workout builder content")

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">
                {editMode ? 'Edit Workout Program' : 'Workout Builder'}
              </h1>
              <p className="text-sm text-gray-600">
                {editMode 
                  ? 'Modify your existing workout program' 
                  : 'Create single workouts or multi-day programs'
                }
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/clients">
                <Button variant="outline" size="sm">
                  <Users className="h-4 w-4 mr-2" />
                  View Clients
                </Button>
              </Link>
              <div className="text-sm text-gray-600">
                Logged in as: {session.user.name || session.user.email}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status Messages */}
      {saveStatus.type && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className={`rounded-md p-4 ${
            saveStatus.type === 'success' 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-center">
              {saveStatus.type === 'success' ? (
                <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
              )}
              <p className={`text-sm font-medium ${
                saveStatus.type === 'success' ? 'text-green-800' : 'text-red-800'
              }`}>
                {saveStatus.message}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Workout Builder */}
          <div>
            <WorkoutBuilder 
              onSave={handleSaveWorkout}
              isLoading={isSaving}
              editMode={editMode}
              editProgramId={editProgramId || undefined}
              initialData={initialData}
            />
          </div>

          {/* Workout Assignment */}
          {showAssignment && savedWorkout && (
            <div>
              <WorkoutAssignment
                workoutId={savedWorkout.id}
                workoutName={savedWorkout.name}
                onAssignmentComplete={handleAssignmentComplete}
              />
            </div>
          )}

          {/* Assignment Prompt */}
          {!showAssignment && saveStatus.type === 'success' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="text-center">
                <Users className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-blue-900 mb-2">
                  {editMode ? 'Workout Program Updated Successfully!' : 'Workout Created Successfully!'}
                </h3>
                <p className="text-blue-700 mb-4">
                  {editMode 
                    ? 'Your workout program has been updated. You can now assign it to your clients.'
                    : 'Now you can assign this workout to your clients. Click the button below to start assigning.'
                  }
                </p>
                <Button
                  onClick={() => setShowAssignment(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Assign to Clients
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

