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

    // Build where clause
    const whereClause: Record<string, any> = {}
    
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

    // Fetch exercises
    const exercises = await prisma.exercise.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        difficulty: true,
        muscleGroups: true,
        equipment: true,
        instructions: true,
        videoUrl: true
      },
      orderBy: [
        { category: 'asc' },
        { name: 'asc' }
      ]
    })

    return NextResponse.json({
      exercises,
      count: exercises.length
    })

  } catch (error) {
    console.error("Error fetching exercises:", error)
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

    const { name, description, category, difficulty, muscleGroups, equipment, instructions, videoUrl } = await request.json()

    // Validate required fields
    if (!name || !description || !category || !difficulty) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Check if exercise with same name already exists
    const existingExercise = await prisma.exercise.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } }
    })

    if (existingExercise) {
      return NextResponse.json(
        { error: "Exercise with this name already exists" },
        { status: 409 }
      )
    }

    // Create new exercise
    const exercise = await prisma.exercise.create({
      data: {
        name,
        description,
        category,
        difficulty,
        muscleGroups: muscleGroups || [],
        equipment: equipment || [],
        instructions: instructions || "",
        videoUrl: videoUrl || null
      }
    })

    return NextResponse.json({
      message: "Exercise created successfully",
      exercise
    }, { status: 201 })

  } catch (error) {
    console.error("Error creating exercise:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
