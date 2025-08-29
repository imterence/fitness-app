import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only admins can fetch user lists
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden - Only admins can fetch user lists" }, { status: 403 })
    }

    // Get role filter from query params
    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')

    let users
    if (role) {
      // Fetch users by specific role
      users = await prisma.user.findMany({
        where: { role: role as any },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true
        },
        orderBy: {
          name: 'asc'
        }
      })
    } else {
      // Fetch all users (excluding passwords)
      users = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true
        },
        orderBy: {
          name: 'asc'
        }
      })
    }

    return NextResponse.json({
      users,
      count: users.length
    })

  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
