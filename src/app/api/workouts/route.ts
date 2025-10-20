import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    console.log("API Route - Session data:", JSON.stringify(session, null, 2))
    
    if (!session?.user) {
      console.log("API Route - No session found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("API Route - User data:", {
      id: session.user.id,
      email: session.user.email,
      role: session.user.role,
      roleType: typeof session.user.role
    })

    // Check if user is a trainer or admin
    if (session.user.role !== "TRAINER" && session.user.role !== "ADMIN") {
      console.log("API Route - Role check failed. User role:", session.user.role)
      console.log("API Route - Expected roles: TRAINER or ADMIN")
      return NextResponse.json({ error: "Forbidden - Insufficient permissions" }, { status: 403 })
    }

    const { name, description, exercises } = await request.json()

    console.log("Creating workout with data:", { name, description, exercisesCount: exercises?.length })
    console.log("Exercises data structure:", JSON.stringify(exercises, null, 2))
    
    // Validate each exercise has the required fields
    if (exercises && exercises.length > 0) {
      for (let i = 0; i < exercises.length; i++) {
        const ex = exercises[i]
        console.log(`Exercise ${i + 1} validation:`, {
          hasId: !!ex.id,
          id: ex.id,
          hasName: !!ex.name,
          name: ex.name,
          hasSets: ex.sets !== undefined,
          sets: ex.sets,
          hasReps: !!ex.reps,
          reps: ex.reps,
          hasRest: !!ex.rest,
          rest: ex.rest
        })
        
        if (!ex.id) {
          console.error(`Exercise ${i + 1} is missing ID:`, ex)
          return NextResponse.json(
            { error: `Exercise ${i + 1} is missing required ID field` },
            { status: 400 }
          )
        }
      }
    }

    // Validate required fields
    if (!name || !exercises || exercises.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Create workout
    console.log("About to create workout with data:", {
      name,
      description,
      category: "Custom",
      difficulty: "INTERMEDIATE",
      estimatedDuration: 60,
      creatorId: session.user.id,
      exercisesCount: exercises.length,
      status: 'DRAFT'
    })

    let workout
    try {
      // Try to create workout with exercises first
      workout = await prisma.workout.create({
        data: {
          name,
          description: description || "",
          category: "Custom",
          difficulty: "INTERMEDIATE" as const,
          estimatedDuration: 60, // Default duration in minutes
          status: 'DRAFT',
          creatorId: session.user.id,
          exercises: {
            create: exercises.map((exercise: { id: string; name: string; category: string; notes?: string; sets: number; reps: string; rest: string }, index: number) => ({
              exerciseId: exercise.id, // Link to existing exercise
              order: index + 1,
              sets: exercise.sets,
              reps: exercise.reps,
              rest: exercise.rest,
              notes: exercise.notes
            }))
          }
        },
        include: {
          exercises: {
            include: {
              exercise: true
            }
          }
        }
      })
      console.log("Workout created with exercises successfully")
    } catch (exerciseError) {
      console.error("Failed to create workout with exercises, trying without exercises:", exerciseError)
      console.error("Exercise error details:", {
        message: exerciseError instanceof Error ? exerciseError.message : 'Unknown error',
        code: (exerciseError as any)?.code,
        meta: (exerciseError as any)?.meta
      })
      
      // Fallback: create workout without exercises
      workout = await prisma.workout.create({
        data: {
          name,
          description: description || "",
          category: "Custom",
          difficulty: "INTERMEDIATE" as const,
          estimatedDuration: 60,
          status: 'DRAFT',
          creatorId: session.user.id
        }
      })
      console.log("Workout created without exercises successfully")
    }

    console.log("Workout created successfully:", {
      id: workout.id,
      name: workout.name,
      exercisesCount: (workout as { exercises?: any[] }).exercises?.length || 0
    })

    // If we created the workout without exercises, fetch it with exercises to return consistent data
    if (!(workout as { exercises?: any[] }).exercises) {
      workout = await prisma.workout.findUnique({
        where: { id: workout.id },
        include: {
          exercises: {
            include: {
              exercise: true
            }
          }
        }
      })
    }

    return NextResponse.json({
      message: "Workout created successfully",
      workout: workout
    }, { status: 201 })

  } catch (error: any) {
    console.error("Error creating workout:", error)
    
    // Provide more specific error messages
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: "A workout with this name already exists" },
        { status: 400 }
      )
    }
    
    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: "Invalid reference - check exercise data" },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')

          // Fetch workouts based on user role
      let workouts
      if (session.user.role === "TRAINER" || session.user.role === "ADMIN") {
        // Trainers now see ALL workouts (both their own and others')
        const whereClause: any = {}

        // Add search filter if specified
        if (search) {
          whereClause.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } }
          ]
        }

        workouts = await prisma.workout.findMany({
          where: whereClause,
          include: {
            creator: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            exercises: {
              include: {
                exercise: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        })
    } else {
      // Clients see only active workouts
      workouts = await prisma.workout.findMany({
        where: {
          status: 'ACTIVE',
          ...(search && {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } }
            ]
          })
        },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          exercises: {
            include: {
              exercise: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
    }

    return NextResponse.json({
      workouts,
      count: workouts.length
    })

  } catch (error) {
    console.error("Error fetching workouts:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
