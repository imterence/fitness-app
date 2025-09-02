"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  User, 
  Mail, 
  Calendar, 
  ArrowLeft,
  Phone,
  MapPin,
  Award,
  Target,
  MessageSquare,
  Clock,
  TrendingUp
} from "lucide-react"
import Link from "next/link"

interface Coach {
  id: string
  name: string
  email: string
  role: string
  createdAt: string
  clients?: any[]
  createdWorkouts?: any[]
}

export default function CoachPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [coach, setCoach] = useState<Coach | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      fetchCoach()
    }
  }, [status, session])

  const fetchCoach = async () => {
    try {
      setIsLoading(true)
      // Get coach info from the user's trainerId
      const response = await fetch('/api/coach')
      if (response.ok) {
        const data = await response.json()
        setCoach(data.coach)
      } else {
        setError('Failed to fetch coach information')
      }
    } catch (error) {
      console.error('Error fetching coach:', error)
      setError('Network error')
    } finally {
      setIsLoading(false)
    }
  }

  // Show loading while checking authentication
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
          <p className="mt-4 text-gray-300">Loading Coach Information...</p>
        </div>
      </div>
    )
  }

  // Don't render if not authenticated or not a client
  if (!session?.user || session.user.role !== "CLIENT") {
    router.push('/dashboard')
    return null
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
          <p className="mt-4 text-gray-300">Loading coach information...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <Button 
            onClick={fetchCoach}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (!coach) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <div className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white hover:bg-gray-700">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-white">My Coach</h1>
            </div>
          </div>
        </div>
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="bg-gray-800/90 backdrop-blur-sm border-gray-700 shadow-2xl">
            <CardContent className="p-8 text-center">
              <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">No Coach Assigned</h3>
              <p className="text-gray-300 mb-4">
                You haven't been assigned a coach yet. Please contact the administrator to get assigned to a trainer.
              </p>
              <Link href="/dashboard">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  Back to Dashboard
                </Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Header */}
      <div className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white hover:bg-gray-700">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-white">My Coach</h1>
            </div>
            <div className="text-sm text-gray-300">
              Logged in as: {session.user.name || session.user.email}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Coach Profile */}
          <div className="lg:col-span-2">
            <Card className="bg-gray-800/90 backdrop-blur-sm border-gray-700 shadow-2xl">
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <div className="h-16 w-16 bg-red-500/20 rounded-full flex items-center justify-center">
                    <User className="h-8 w-8 text-red-500" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl text-white">{coach.name}</CardTitle>
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge variant="secondary" className="bg-red-500/20 text-red-400 border-red-500/30">{coach.role}</Badge>
                      <Badge variant="outline" className="border-gray-600 text-gray-300">Your Coach</Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center text-gray-300">
                    <Mail className="h-5 w-5 mr-3 text-red-500" />
                    <span>{coach.email}</span>
                  </div>
                  
                  <div className="flex items-center text-gray-300">
                    <Calendar className="h-5 w-5 mr-3 text-red-500" />
                    <span>Coach since {new Date(coach.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="border-t border-gray-700 pt-6">
                  <h3 className="text-lg font-semibold text-white mb-4">About Your Coach</h3>
                  <p className="text-gray-300 leading-relaxed">
                    Your coach is dedicated to helping you achieve your fitness goals. They create personalized workout plans, 
                    track your progress, and provide guidance to ensure you're getting the most out of your training sessions.
                  </p>
                </div>

                <div className="border-t border-gray-700 pt-6">
                  <h3 className="text-lg font-semibold text-white mb-4">What Your Coach Provides</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start space-x-3">
                      <Target className="h-5 w-5 text-red-500 mt-0.5" />
                      <div>
                        <p className="font-medium text-white">Personalized Workouts</p>
                        <p className="text-sm text-gray-300">Custom training plans tailored to your goals</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <TrendingUp className="h-5 w-5 text-red-500 mt-0.5" />
                      <div>
                        <p className="font-medium text-white">Progress Tracking</p>
                        <p className="text-sm text-gray-300">Monitor your improvements over time</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <Clock className="h-5 w-5 text-red-500 mt-0.5" />
                      <div>
                        <p className="font-medium text-white">Flexible Scheduling</p>
                        <p className="text-sm text-gray-300">Workouts that fit your schedule</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <MessageSquare className="h-5 w-5 text-red-500 mt-0.5" />
                      <div>
                        <p className="font-medium text-white">Ongoing Support</p>
                        <p className="text-sm text-gray-300">Guidance and motivation when you need it</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions & Stats */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="bg-gray-800/90 backdrop-blur-sm border-gray-700 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-lg text-white">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/schedule" className="w-full">
                  <Button variant="outline" className="w-full justify-start border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white">
                    <Calendar className="h-4 w-4 mr-2" />
                    View My Schedule
                  </Button>
                </Link>
                
                <Link href="/workouts" className="w-full">
                  <Button variant="outline" className="w-full justify-start border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white">
                    <Target className="h-4 w-4 mr-2" />
                    My Workouts
                  </Button>
                </Link>
                
                <Link href="/progress" className="w-full">
                  <Button variant="outline" className="w-full justify-start border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Track Progress
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Coach Stats */}
            <Card className="bg-gray-800/90 backdrop-blur-sm border-gray-700 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-lg text-white">Coach Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Total Clients</span>
                  <span className="font-semibold text-white">
                    {coach.clients ? coach.clients.length : 'N/A'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Workouts Created</span>
                  <span className="font-semibold text-white">
                    {coach.createdWorkouts ? coach.createdWorkouts.length : 'N/A'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Experience</span>
                  <span className="font-semibold text-white">
                    {(() => {
                      const startDate = new Date(coach.createdAt)
                      const now = new Date()
                      const years = now.getFullYear() - startDate.getFullYear()
                      return years > 0 ? `${years}+ years` : 'New'
                    })()}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Contact Info */}
            <Card className="bg-gray-800/90 backdrop-blur-sm border-gray-700 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-lg text-white">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center text-sm text-gray-300">
                  <Mail className="h-4 w-4 mr-2 text-red-500" />
                  <span>{coach.email}</span>
                </div>
                
                <div className="pt-3">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Send Message
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
