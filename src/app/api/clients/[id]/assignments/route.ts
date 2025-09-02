import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: clientId } = await params
  
  console.log("API: Fetching assignments for client:", clientId)
  
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      console.log("API: No session found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("API: Session user:", { id: session.user.id, role: session.user.role })

    // Check if user is a trainer, admin, or the client themselves
    if (session.user.role !== "TRAINER" && session.user.role !== "ADMIN" && session.user.id !== clientId) {
      console.log("API: Insufficient permissions")
      return NextResponse.json({ error: "Forbidden - Insufficient permissions" }, { status: 403 })
    }

    // For trainers, verify the client belongs to them
    if (session.user.role === "TRAINER") {
      const clientAssignment = await prisma.client.findFirst({
        where: {
          userId: clientId,
          trainerId: session.user.id
        }
      })

      const directTrainerRelationship = await prisma.user.findFirst({
        where: {
          id: clientId,
          trainerId: session.user.id
        }
      })

      console.log("API: Client relationships:", { 
        clientAssignment: !!clientAssignment, 
        directTrainerRelationship: !!directTrainerRelationship 
      })

      if (!clientAssignment && !directTrainerRelationship) {
        console.log("API: Client not found or not assigned to trainer")
        return NextResponse.json(
          { error: "Client not found or not assigned to you" },
          { status: 404 }
        )
      }
    }

    // Get all workout assignments for this client
    console.log("API: Querying database for assignments...")
    
    const [singleWorkoutAssignments, programAssignments] = await Promise.all([
      // Single workout assignments
      prisma.clientWorkout.findMany({
        where: {
          clientId: clientId
        },
        select: {
          scheduledDate: true,
          workout: {
            select: {
              name: true
            }
          }
        }
      }),
      // Program day assignments - need to go through ClientWorkoutProgram first
      prisma.programDayAssignment.findMany({
        where: {
          clientWorkoutProgram: {
            clientId: clientId
          }
        },
        select: {
          scheduledDate: true,
          dayNumber: true,
          clientWorkoutProgram: {
            select: {
              program: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      })
    ])

    // Also get program start dates and calculate all program dates
    const clientWorkoutPrograms = await prisma.clientWorkoutProgram.findMany({
      where: {
        clientId: clientId
      },
      select: {
        startDate: true,
        program: {
          select: {
            totalDays: true,
            name: true
          }
        }
      }
    })

    // Create a map of dates to workout names
    const dateWorkoutMap = new Map<string, string[]>()

    // Helper function to add workout to date map
    const addWorkoutToDate = (date: Date, workoutName: string) => {
      const dateString = date.toISOString().split('T')[0] // YYYY-MM-DD format
      if (!dateWorkoutMap.has(dateString)) {
        dateWorkoutMap.set(dateString, [])
      }
      const workouts = dateWorkoutMap.get(dateString)!
      if (!workouts.includes(workoutName)) {
        workouts.push(workoutName)
      }
    }

    // Process single workout assignments
    for (const assignment of singleWorkoutAssignments) {
      const date = new Date(assignment.scheduledDate)
      addWorkoutToDate(date, assignment.workout.name)
    }

    // Process program day assignments
    for (const assignment of programAssignments) {
      const date = new Date(assignment.scheduledDate)
      const workoutName = `${assignment.clientWorkoutProgram.program.name} - Day ${assignment.dayNumber}`
      addWorkoutToDate(date, workoutName)
    }

    // Calculate all dates for multi-day programs
    for (const program of clientWorkoutPrograms) {
      const startDate = new Date(program.startDate)
      const totalDays = program.program.totalDays
      
      for (let i = 0; i < totalDays; i++) {
        const programDate = new Date(startDate)
        programDate.setDate(startDate.getDate() + i)
        const workoutName = `${program.program.name} - Day ${i + 1}`
        addWorkoutToDate(programDate, workoutName)
      }
    }

    console.log("API: Program calculations:", {
      clientWorkoutPrograms: clientWorkoutPrograms.length,
      singleWorkoutAssignments: singleWorkoutAssignments.length,
      programAssignments: programAssignments.length,
      dateWorkoutMapSize: dateWorkoutMap.size,
      sampleEntries: Array.from(dateWorkoutMap.entries()).slice(0, 3)
    })

    // Convert map to object for JSON response
    const scheduledDatesWithWorkouts = Object.fromEntries(dateWorkoutMap)
    const uniqueDates = Array.from(dateWorkoutMap.keys()).sort()

    console.log("API: Final processed data:", {
      uniqueDates: uniqueDates.length,
      sampleWorkouts: Object.entries(scheduledDatesWithWorkouts).slice(0, 3)
    })

    return NextResponse.json({
      scheduledDates: uniqueDates,
      scheduledDatesWithWorkouts: scheduledDatesWithWorkouts,
      count: uniqueDates.length
    })

  } catch (error) {
    console.error("Error fetching client assignments:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
