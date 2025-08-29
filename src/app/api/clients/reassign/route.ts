import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only admins can reassign clients
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden - Only admins can reassign clients" }, { status: 403 })
    }

    const { clientId, newTrainerId } = await request.json()

    // Validate required fields
    if (!clientId || !newTrainerId) {
      return NextResponse.json(
        { error: "Missing required fields: clientId, newTrainerId" },
        { status: 400 }
      )
    }

    // Verify the client exists
    const client = await prisma.client.findUnique({
      where: { id: clientId }
    })

    if (!client) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      )
    }

    // Verify the new trainer exists and is actually a trainer
    const newTrainer = await prisma.user.findFirst({
      where: {
        id: newTrainerId,
        role: "TRAINER"
      }
    })

    if (!newTrainer) {
      return NextResponse.json(
        { error: "New trainer not found or is not a trainer" },
        { status: 404 }
      )
    }

    // Update the client's trainer
    const updatedClient = await prisma.client.update({
      where: { id: clientId },
      data: { trainerId: newTrainerId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        trainer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({
      message: "Client reassigned successfully",
      client: updatedClient
    }, { status: 200 })

  } catch (error) {
    console.error("Error reassigning client:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
