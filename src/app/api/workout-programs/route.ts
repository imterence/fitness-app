import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const category = searchParams.get('category')
    const type = searchParams.get('type') // 'all', 'own', 'public'

    // Build where clause
    const whereClause: any = {}

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (category) {
      whereClause.category = category
    }

    // Filter based on user role and type
    if (session.user.role === "TRAINER" || session.user.role === "ADMIN") {
      if (type === 'own') {
        whereClause.creatorId = session.user.id
      } else if (type === 'active') {
        whereClause.status = 'ACTIVE'
      } else {
        // Default: trainers now see ALL programs (both their own and others')
        // No additional filtering needed
      }
    } else {
      // Clients can only see active programs
      whereClause.status = 'ACTIVE'
    }

    // Fetch workout programs with days and exercises
    const programs = await prisma.workoutProgram.findMany({
      where: whereClause,
      include: {
        creator: {
          select: {
            id: true,
            name: true
          }
        },
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
              },
              orderBy: {
                order: 'asc'
              }
            }
          },
          orderBy: {
            dayNumber: 'asc'
          }
        }
      },
      orderBy: [
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json({
      programs,
      count: programs.length
    })

  } catch (error) {
    console.error("Error fetching workout programs:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is a trainer or admin
    if (session.user.role !== "TRAINER" && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { name, description, days } = await request.json()

    // Validate required fields
    if (!name || !days || !Array.isArray(days) || days.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields: name and days array" },
        { status: 400 }
      )
    }

    // Validate days structure
    for (let i = 0; i < days.length; i++) {
      const day = days[i]
      if (!day.dayNumber || !day.name || typeof day.isRestDay !== 'boolean') {
        return NextResponse.json(
          { error: `Invalid day ${i + 1} structure` },
          { status: 400 }
        )
      }
      
      if (!day.isRestDay && (!day.exercises || !Array.isArray(day.exercises))) {
        return NextResponse.json(
          { error: `Day ${i + 1} is not a rest day but has no exercises` },
          { status: 400 }
        )
      }
    }

    // Create workout program with days and exercises
    const program = await prisma.workoutProgram.create({
      data: {
        name,
        description: description || "",
        category: "Custom",
        difficulty: "INTERMEDIATE",
        status: 'DRAFT',
        totalDays: days.length,
        creatorId: session.user.id,
        days: {
          create: days.map(day => ({
            dayNumber: day.dayNumber,
            name: day.name,
            isRestDay: day.isRestDay,
            estimatedDuration: day.estimatedDuration || null,
            notes: day.notes || "",
            exercises: day.isRestDay ? undefined : {
              create: day.exercises.map((exercise: any, index: number) => ({
                exerciseId: exercise.id,
                order: index + 1,
                sets: exercise.sets,
                reps: exercise.reps,
                rest: exercise.rest,
                notes: exercise.notes || ""
              }))
            }
          }))
        }
      },
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
              },
              orderBy: {
                order: 'asc'
              }
            }
          },
          orderBy: {
            dayNumber: 'asc'
          }
        }
      }
    })

    return NextResponse.json({
      message: "Workout program created successfully",
      program
    }, { status: 201 })

  } catch (error: any) {
    console.error("Error creating workout program:", error)
    
    // Provide more specific error messages
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: "A workout program with this name already exists" },
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
