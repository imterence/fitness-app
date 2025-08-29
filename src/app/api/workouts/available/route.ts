import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Available workouts API - Request received")
    console.log("🔍 Available workouts API - Request headers:", Object.fromEntries(request.headers.entries()))
    
    // Check authentication
    const session = await getServerSession(authOptions)
    console.log("🔍 Available workouts API - getServerSession result:", session)
    
    if (!session?.user) {
      console.log("❌ Available workouts API: No session")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("🔍 Available workouts API - Session user:", {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role
    })

    // Check if user is a trainer or admin
    if (session.user.role !== "TRAINER" && session.user.role !== "ADMIN") {
      console.log("❌ Available workouts API: Insufficient role -", session.user.role)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    console.log("✅ Available workouts API: Authentication successful")

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'all'
    const clientId = searchParams.get('clientId')

    console.log("🔍 Available workouts API - Query params:", { type, clientId })

    // Build where clause based on type and user role
    let whereClause: any = {}
    
    if (session.user.role === "ADMIN") {
      // Admins see all workouts
      whereClause = {}
    } else {
      // Trainers now see ALL workouts (both their own and others')
      whereClause = {}
    }

    if (type === 'templates') {
      // For templates, show workout programs (multi-day)
      // No additional filtering needed since trainers see all
    } else if (type === 'custom') {
      // For custom workouts, show single-day workouts
      // No additional filtering needed since trainers see all
    }

    // Fetch both single-day workouts and multi-day workout programs
    const [workouts, workoutPrograms] = await Promise.all([
      prisma.workout.findMany({
        where: whereClause,
        include: {
          exercises: {
            include: {
              exercise: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  category: true,
                  difficulty: true
                }
              }
            },
            orderBy: {
              order: 'asc'
            }
          },
          creator: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: [
          { createdAt: 'desc' }
        ]
      }),
      prisma.workoutProgram.findMany({
        where: whereClause,
        include: {
          days: {
            include: {
              exercises: {
                include: {
                  exercise: {
                    select: {
                      id: true,
                      name: true,
                      description: true,
                      category: true,
                      difficulty: true
                    }
                  }
                }
              }
            },
            orderBy: {
              dayNumber: 'asc'
            }
          },
          creator: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: [
          { createdAt: 'desc' }
        ]
      })
    ])

    console.log("🔍 Available workouts API - Database results:", {
      singleDayWorkouts: workouts.length,
      multiDayPrograms: workoutPrograms.length,
      workoutIds: workouts.map(w => ({ id: w.id, name: w.name })),
      programIds: workoutPrograms.map(p => ({ id: p.id, name: p.name }))
    })

    // Debug: Check the structure of workout programs
    if (workoutPrograms.length > 0) {
      console.log("🔍 Sample workout program structure:", {
        id: workoutPrograms[0].id,
        name: workoutPrograms[0].name,
        totalDays: workoutPrograms[0].totalDays,
        hasDays: !!workoutPrograms[0].days,
        daysLength: workoutPrograms[0].days ? workoutPrograms[0].days.length : 0,
        daysStructure: workoutPrograms[0].days ? workoutPrograms[0].days[0] : null
      })
    }

    // Combine and format workouts and programs
    const allWorkouts = [
      ...workouts.map(workout => ({
        ...workout,
        type: 'single-day',
        totalDays: 1
      })),
      ...workoutPrograms.map(program => ({
        ...program,
        type: 'multi-day',
        totalDays: program.totalDays || (program.days ? program.days.length : 0),
        exercises: [], // Multi-day programs don't have direct exercises
        estimatedDuration: program.days ? program.days.reduce((total: number, day: any) => total + (day.estimatedDuration || 0), 0) : 0
      }))
    ]

    // If clientId is provided, check if any workouts are already assigned to this client
    let workoutsWithAssignmentStatus = allWorkouts
    if (clientId) {
      const [clientWorkoutAssignments, clientProgramAssignments] = await Promise.all([
        prisma.clientWorkout.findMany({
          where: { clientId },
          select: { workoutId: true, status: true }
        }),
        prisma.clientWorkoutProgram.findMany({
          where: { clientId },
          select: { programId: true, status: true }
        })
      ])

      workoutsWithAssignmentStatus = allWorkouts.map(workout => {
        if (workout.type === 'single-day') {
          const assignment = clientWorkoutAssignments.find(a => a.workoutId === workout.id)
          return {
            ...workout,
            isAssigned: !!assignment,
            assignmentStatus: assignment?.status || null
          }
        } else {
          const assignment = clientProgramAssignments.find(a => a.programId === workout.id)
          return {
            ...workout,
            isAssigned: !!assignment,
            assignmentStatus: assignment?.status || null
          }
        }
      })
    }

    return NextResponse.json({
      workouts: workoutsWithAssignmentStatus,
      count: workoutsWithAssignmentStatus.length
    })

  } catch (error) {
    console.error("❌ Error fetching available workouts:", error)
    console.error("❌ Error details:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    })
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
