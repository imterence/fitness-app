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

    const { id: workoutId } = await params
    const body = await request.json()
    const { exercises, name, description } = body

    // Check if user is a trainer or admin
    if (session.user.role !== "TRAINER" && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Verify the workout exists and belongs to this trainer
    const workout = await prisma.workout.findFirst({
      where: {
        id: workoutId,
        creatorId: session.user.id
      }
    })

    if (!workout) {
      return NextResponse.json(
        { error: "Workout not found or not created by you" },
        { status: 404 }
      )
    }

    // Update basic workout information if provided
    if (name !== undefined || description !== undefined) {
      await prisma.workout.update({
        where: { id: workoutId },
        data: {
          ...(name !== undefined && { name }),
          ...(description !== undefined && { description }),
          // Always keep these as defaults
          category: "Custom",
          difficulty: "INTERMEDIATE",
          isPublic: true
        }
      })
    }

    // Update the workout exercises if provided
    if (exercises !== undefined) {
      // First, delete existing exercises
      await prisma.workoutExercise.deleteMany({
        where: { workoutId }
      })

      // Then create new exercises
      if (exercises && exercises.length > 0) {
        const exerciseData = exercises.map((exercise: { exercise: { id: string }, sets: number, reps: string, rest: string, notes?: string }, index: number) => ({
          workoutId,
          exerciseId: exercise.exercise.id,
          order: index + 1,
          sets: exercise.sets,
          reps: exercise.reps,
          rest: exercise.rest,
          notes: exercise.notes
        }))

        await prisma.workoutExercise.createMany({
          data: exerciseData
        })
      }
    }

    // Fetch the updated workout
    const updatedWorkout = await prisma.workout.findUnique({
      where: { id: workoutId },
      include: {
        exercises: {
          include: {
            exercise: true
          },
          orderBy: {
            order: 'asc'
          }
        }
      }
    })

    return NextResponse.json({
      message: "Workout updated successfully",
      workout: updatedWorkout
    })

  } catch (error) {
    console.error("Error updating workout:", error)
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

    const { id: workoutId } = await params

    // Check if user is a trainer or admin
    if (session.user.role !== "TRAINER" && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Verify the workout exists and belongs to this trainer
    const workout = await prisma.workout.findFirst({
      where: {
        id: workoutId,
        creatorId: session.user.id
      }
    })

    if (!workout) {
      return NextResponse.json(
        { error: "Workout not found or not created by you" },
        { status: 404 }
      )
    }

    // Check if workout is assigned to any clients
    const assignments = await prisma.clientWorkout.findMany({
      where: { workoutId }
    })

    if (assignments.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete workout that is assigned to clients. Please unassign all clients first." },
        { status: 400 }
      )
    }

    // Delete the workout (this will cascade delete workout exercises due to schema)
    await prisma.workout.delete({
      where: { id: workoutId }
    })

    return NextResponse.json({
      message: "Workout deleted successfully"
    })

  } catch (error) {
    console.error("Error deleting workout:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
