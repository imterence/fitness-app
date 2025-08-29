import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is a client
    if (session.user.role !== "CLIENT") {
      return NextResponse.json({ error: "Forbidden - Only clients can access coach information" }, { status: 403 })
    }

    // Get the client's trainer information
    const client = await prisma.client.findFirst({
      where: {
        userId: session.user.id
      },
      include: {
        trainer: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true
          }
        }
      }
    })

    if (!client || !client.trainer) {
      return NextResponse.json({ error: "No coach assigned" }, { status: 404 })
    }

    // Get additional stats for the coach
    const coachStats = await prisma.user.findUnique({
      where: {
        id: client.trainer.id
      },
      include: {
        _count: {
          select: {
            clients: true,
            createdWorkouts: true
          }
        }
      }
    })

    const coach = {
      ...client.trainer,
      clients: coachStats?._count.clients || 0,
      createdWorkouts: coachStats?._count.createdWorkouts || 0
    }

    return NextResponse.json({
      coach,
      message: "Coach information retrieved successfully"
    })

  } catch (error) {
    console.error("Error fetching coach information:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
