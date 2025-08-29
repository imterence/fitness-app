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

    // Check if client exists, is available, and has an active subscription
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
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

    if (!client) {
      return NextResponse.json({ error: "Client not found or already assigned" }, { status: 404 })
    }

    // Check if client has an active subscription
    if (client.subscriptionStatus !== 'ACTIVE') {
      return NextResponse.json({ 
        error: "Client does not have an active subscription. Only clients with active subscriptions can be assigned to trainers." 
      }, { status: 400 })
    }

    // Assign client to trainer
    const updatedClient = await prisma.client.update({
      where: {
        id: clientId
      },
      data: {
        trainerId: session.user.id
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
      message: "Client assigned successfully",
      client: updatedClient
    })

  } catch (error) {
    console.error("Error assigning client:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
