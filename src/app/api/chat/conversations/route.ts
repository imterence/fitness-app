import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/chat/conversations - Get all conversations for the current user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const userRole = session.user.role

    let conversations

    if (userRole === "CLIENT") {
      // Get conversations where user is the client
      conversations = await prisma.conversation.findMany({
        where: { clientId: userId },
        include: {
          trainer: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: {
              id: true,
              content: true,
              createdAt: true,
              isRead: true,
              senderId: true,
            }
          },
          _count: {
            select: {
              messages: {
                where: {
                  isRead: false,
                  senderId: { not: userId }
                }
              }
            }
          }
        },
        orderBy: { updatedAt: "desc" }
      })
    } else if (userRole === "TRAINER" || userRole === "ADMIN") {
      // Get conversations where user is the trainer
      conversations = await prisma.conversation.findMany({
        where: { trainerId: userId },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: {
              id: true,
              content: true,
              createdAt: true,
              isRead: true,
              senderId: true,
            }
          },
          _count: {
            select: {
              messages: {
                where: {
                  isRead: false,
                  senderId: { not: userId }
                }
              }
            }
          }
        },
        orderBy: { updatedAt: "desc" }
      })
    } else {
      return NextResponse.json({ error: "Invalid role" }, { status: 403 })
    }

    return NextResponse.json({ conversations })
  } catch (error) {
    console.error("Error fetching conversations:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/chat/conversations - Create a new conversation
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { clientId, trainerId } = await request.json()

    // Validate that the current user is either the client or trainer
    const userId = session.user.id
    const userRole = session.user.role

    if (userRole === "CLIENT" && clientId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    if ((userRole === "TRAINER" || userRole === "ADMIN") && trainerId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Check if conversation already exists
    const existingConversation = await prisma.conversation.findUnique({
      where: {
        clientId_trainerId: {
          clientId,
          trainerId
        }
      }
    })

    if (existingConversation) {
      return NextResponse.json({ conversation: existingConversation })
    }

    // Create new conversation
    const conversation = await prisma.conversation.create({
      data: {
        clientId,
        trainerId
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        trainer: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    })

    return NextResponse.json({ conversation })
  } catch (error) {
    console.error("Error creating conversation:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
