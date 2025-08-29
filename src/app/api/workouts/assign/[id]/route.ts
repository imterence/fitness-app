import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const { status } = await request.json()

    if (!status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 })
    }

    // Find the assignment
    const assignment = await prisma.clientWorkout.findUnique({
      where: { id },
      include: {
        client: true,
        workout: true
      }
    })

    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 })
    }

    // Check permissions
    if (session.user.role === "CLIENT") {
      // Clients can only update their own assignments
      if (assignment.clientId !== session.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    } else if (session.user.role === "TRAINER" || session.user.role === "ADMIN") {
      // Trainers can only update assignments for their clients
      const clientProfile = await prisma.client.findFirst({
        where: { 
          userId: assignment.clientId,
          trainerId: session.user.id
        }
      })
      
      if (!clientProfile) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    } else {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Update the assignment
    const updatedAssignment = await prisma.clientWorkout.update({
      where: { id },
      data: {
        status,
        completedAt: status === "COMPLETED" ? new Date() : null
      },
      include: {
        client: {
          select: {
            name: true,
            email: true
          }
        },
        workout: {
          select: {
            name: true,
            description: true
          }
        }
      }
    })

    return NextResponse.json({
      message: "Assignment updated successfully",
      assignment: updatedAssignment
    })

  } catch (error) {
    console.error("Error updating assignment:", error)
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
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Find the assignment
    const assignment = await prisma.clientWorkout.findUnique({
      where: { id },
      include: {
        client: true,
        workout: true
      }
    })

    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 })
    }

    // Check permissions - only trainers and admins can delete assignments
    if (session.user.role !== "TRAINER" && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Trainers can only delete assignments for their own clients
    if (session.user.role === "TRAINER") {
      const clientProfile = await prisma.client.findFirst({
        where: { 
          userId: assignment.clientId,
          trainerId: session.user.id
        }
      })
      
      if (!clientProfile) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }

    // Delete the assignment
    await prisma.clientWorkout.delete({
      where: { id }
    })

    return NextResponse.json({
      message: "Workout assignment deleted successfully"
    })

  } catch (error) {
    console.error("Error deleting assignment:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
