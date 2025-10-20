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

    // Only trainers and admins can approve workout programs
    if (session.user.role !== "TRAINER" && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden - Only trainers can approve workout programs" }, { status: 403 })
    }

    const { id: programId } = await params
    const body = await request.json()
    const { status } = body

    // Validate status
    if (!status || !['DRAFT', 'ACTIVE', 'ARCHIVED'].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be DRAFT, ACTIVE, or ARCHIVED" },
        { status: 400 }
      )
    }

    // Find the workout program
    const program = await prisma.workoutProgram.findUnique({
      where: { id: programId }
    })

    if (!program) {
      return NextResponse.json(
        { error: "Workout program not found" },
        { status: 404 }
      )
    }

    // Update the workout program status
    const updatedProgram = await prisma.workoutProgram.update({
      where: { id: programId },
      data: { status }
    })

    return NextResponse.json({
      message: `Workout program status updated to ${status}`,
      program: updatedProgram
    })

  } catch (error) {
    console.error("Error updating workout program status:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

