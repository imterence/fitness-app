import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PUT(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { clientId, subscriptionStatus, subscriptionPlan } = body

    if (!clientId) {
      return NextResponse.json({ error: "Client ID is required" }, { status: 400 })
    }

    // Update client subscription
    const updateData: any = {}
    
    if (subscriptionStatus !== undefined) {
      updateData.subscriptionStatus = subscriptionStatus
    }
    
    if (subscriptionPlan !== undefined) {
      updateData.subscriptionPlan = subscriptionPlan
    }

    const updatedClient = await prisma.client.update({
      where: { id: clientId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
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
      client: updatedClient,
      message: "Subscription updated successfully"
    })

  } catch (error) {
    console.error("Error updating subscription:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}