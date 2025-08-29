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

    // Check if user is a trainer or admin
    if (session.user.role !== "TRAINER" && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { clientId } = await request.json()

    if (!clientId) {
      return NextResponse.json({ error: "Client ID is required" }, { status: 400 })
    }

    // Check if client is assigned to this trainer
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        trainerId: session.user.id
      }
    })

    if (!client) {
      return NextResponse.json({ error: "Client not found or not assigned to you" }, { status: 404 })
    }

    // Unassign client from trainer
    const updatedClient = await prisma.client.update({
      where: {
        id: clientId
      },
      data: {
        trainerId: null
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    })

    return NextResponse.json({
      message: "Client unassigned successfully",
      client: updatedClient
    })

  } catch (error) {
    console.error("Error unassigning client:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
