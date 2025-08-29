"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"

export default function TestRoute() {
  const { data: session, status } = useSession()
  const [testResults, setTestResults] = useState<any>({})
  const [isLoading, setIsLoading] = useState(false)

  const testEndpoints = async () => {
    if (!session?.user) return
    
    setIsLoading(true)
    const results: any = {}
    
    try {
      // Test workout assignments endpoint
      console.log("Testing workout assignments endpoint...")
      const workoutResponse = await fetch(`/api/workouts/assign?clientId=${session.user.id}`)
      results.workoutAssignments = {
        status: workoutResponse.status,
        ok: workoutResponse.ok,
        statusText: workoutResponse.statusText
      }
      
      if (workoutResponse.ok) {
        const workoutData = await workoutResponse.json()
        results.workoutData = workoutData
        console.log("Workout assignments response:", workoutData)
      } else {
        const errorText = await workoutResponse.text()
        results.workoutError = errorText
        console.error("Workout assignments error:", errorText)
      }
      
      // Test workout program assignments endpoint
      console.log("Testing workout program assignments endpoint...")
      const programResponse = await fetch(`/api/workout-programs/assign?clientId=${session.user.id}`)
      results.programAssignments = {
        status: programResponse.status,
        ok: programResponse.ok,
        statusText: programResponse.statusText
      }
      
      if (programResponse.ok) {
        const programData = await programResponse.json()
        results.programData = programData
        console.log("Workout program assignments response:", programData)
      } else {
        const errorText = await programResponse.text()
        results.programError = errorText
        console.error("Workout program assignments error:", errorText)
      }
      
    } catch (error) {
      console.error("Test error:", error)
      results.error = error instanceof Error ? error.message : String(error)
    } finally {
      setIsLoading(false)
    }
    
    setTestResults(results)
  }

  if (status === "loading") {
    return <div>Loading...</div>
  }

  if (!session?.user) {
    return <div>Not authenticated</div>
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">API Test Route</h1>
      
      <div className="mb-4">
        <p><strong>User ID:</strong> {session.user.id}</p>
        <p><strong>User Role:</strong> {session.user.role}</p>
        <p><strong>User Email:</strong> {session.user.email}</p>
      </div>
      
      <button 
        onClick={testEndpoints}
        disabled={isLoading}
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {isLoading ? "Testing..." : "Test API Endpoints"}
      </button>
      
      {Object.keys(testResults).length > 0 && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-4">Test Results:</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify(testResults, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}






