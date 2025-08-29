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

    // Only admins can update subscription status
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 })
    }

    const { clientId, subscriptionStatus, subscriptionPlan } = await request.json()

    if (!clientId) {
      return NextResponse.json({ error: "Missing client ID" }, { status: 400 })
    }

    // Prepare update data
    const updateData: any = {}
    
    if (subscriptionStatus) {
      // Validate subscription status
      const validStatuses = ['ACTIVE', 'INACTIVE', 'EXPIRED', 'CANCELLED', 'PENDING']
      if (!validStatuses.includes(subscriptionStatus)) {
        return NextResponse.json({ error: "Invalid subscription status" }, { status: 400 })
      }
      
      updateData.subscriptionStatus = subscriptionStatus
      
      // If setting to INACTIVE, clear subscription plan and dates
      if (subscriptionStatus === 'INACTIVE') {
        updateData.subscriptionPlan = null
        updateData.subscriptionStart = null
        updateData.subscriptionEnd = null
      }
    }
    
    if (subscriptionPlan) {
      // Validate subscription plan
      const validPlans = ['BASIC', 'PRO', 'ELITE']
      if (!validPlans.includes(subscriptionPlan)) {
        return NextResponse.json({ error: "Invalid subscription plan" }, { status: 400 })
      }
      
      updateData.subscriptionPlan = subscriptionPlan
      
      // If setting a plan, ensure status is ACTIVE
      if (!updateData.subscriptionStatus) {
        updateData.subscriptionStatus = 'ACTIVE'
      }
    }

    // Update the client's subscription information
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
      message: "Subscription status updated successfully",
      client: updatedClient
    })

  } catch (error) {
    console.error("Error updating subscription status:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
