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

    // Only trainers and admins can approve workouts
    if (session.user.role !== "TRAINER" && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden - Only trainers can approve workouts" }, { status: 403 })
    }

    const { id: workoutId } = await params
    const body = await request.json()
    const { status } = body

    // Validate status
    if (!status || !['DRAFT', 'ACTIVE', 'ARCHIVED'].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be DRAFT, ACTIVE, or ARCHIVED" },
        { status: 400 }
      )
    }

    // Find the workout
    const workout = await prisma.workout.findUnique({
      where: { id: workoutId }
    })

    if (!workout) {
      return NextResponse.json(
        { error: "Workout not found" },
        { status: 404 }
      )
    }

    // Update the workout status
    const updatedWorkout = await prisma.workout.update({
      where: { id: workoutId },
      data: { status }
    })

    return NextResponse.json({
      message: `Workout status updated to ${status}`,
      workout: updatedWorkout
    })

  } catch (error) {
    console.error("Error updating workout status:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

