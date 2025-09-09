import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: exerciseId } = await params
    const { name, description, category, difficulty, muscleGroups, equipment, instructions, videoUrl } = await request.json()

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: "Exercise name is required" },
        { status: 400 }
      )
    }

    // Check if exercise exists
    const existingExercise = await prisma.exercise.findUnique({
      where: { id: exerciseId }
    })

    if (!existingExercise) {
      return NextResponse.json(
        { error: "Exercise not found" },
        { status: 404 }
      )
    }

    // Check if another exercise with the same name exists (excluding current one)
    const duplicateExercise = await prisma.exercise.findFirst({
      where: {
        name: { equals: name, mode: 'insensitive' },
        id: { not: exerciseId }
      }
    })

    if (duplicateExercise) {
      return NextResponse.json(
        { error: "Another exercise with this name already exists" },
        { status: 409 }
      )
    }

    // Update exercise
    const updatedExercise = await prisma.exercise.update({
      where: { id: exerciseId },
      data: {
        name,
        description: description || "",
        category: category || "General",
        difficulty: difficulty || "INTERMEDIATE",
        muscleGroups: muscleGroups || [],
        equipment: equipment || [],
        instructions: instructions || "",
        videoUrl: videoUrl || null
      }
    })

    return NextResponse.json({
      message: "Exercise updated successfully",
      exercise: updatedExercise
    })

  } catch (error) {
    console.error("Error updating exercise:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: exerciseId } = await params

    // Check if exercise exists
    const existingExercise = await prisma.exercise.findUnique({
      where: { id: exerciseId }
    })

    if (!existingExercise) {
      return NextResponse.json(
        { error: "Exercise not found" },
        { status: 404 }
      )
    }

    // Check if exercise is used in any workouts
    const workoutUsage = await prisma.workoutExercise.findFirst({
      where: { exerciseId }
    })

    if (workoutUsage) {
      return NextResponse.json(
        { error: "Cannot delete exercise as it is used in workouts" },
        { status: 400 }
      )
    }

    // Delete exercise
    await prisma.exercise.delete({
      where: { id: exerciseId }
    })

    return NextResponse.json({
      message: "Exercise deleted successfully"
    })

  } catch (error) {
    console.error("Error deleting exercise:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
