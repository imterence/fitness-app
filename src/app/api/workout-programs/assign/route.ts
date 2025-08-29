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

    console.log("Workout Program Assignment API - Session user:", session.user)

    // Check if user is a trainer or admin
    if (session.user.role !== "TRAINER" && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden - Insufficient permissions" }, { status: 403 })
    }

    const { clientId, programId, startDate, notes } = await request.json()

    console.log("Assigning workout program:", { clientId, programId, startDate, notes })

    // Validate required fields
    if (!clientId || !programId || !startDate) {
      return NextResponse.json(
        { error: "Missing required fields: clientId, programId, startDate" },
        { status: 400 }
      )
    }

    console.log("Session user ID:", session.user.id)
    console.log("Client ID to assign:", clientId)

    // Verify the client belongs to this trainer
    // First check if the user exists and is a client
    const clientUser = await prisma.user.findFirst({
      where: {
        id: clientId,
        role: "CLIENT"
      }
    })

    if (!clientUser) {
      return NextResponse.json(
        { error: "User not found or is not a client" },
        { status: 404 }
      )
    }

    // For admins, skip trainer-client relationship check
    // For trainers, verify the client is assigned to them
    if (session.user.role === "TRAINER") {
      // Check if the client is assigned to this trainer
      // The relationship can be either through User.trainerId or Client.trainerId
      const clientAssignment = await prisma.client.findFirst({
        where: {
          userId: clientId,
          trainerId: session.user.id
        }
      })

      console.log("Client assignment found:", clientAssignment ? "Yes" : "No")

      // Also check if the user has a direct trainerId relationship
      const directTrainerRelationship = await prisma.user.findFirst({
        where: {
          id: clientId,
          trainerId: session.user.id
        }
      })

      console.log("Direct trainer relationship found:", directTrainerRelationship ? "Yes" : "No")

      if (!clientAssignment && !directTrainerRelationship) {
        console.log("No relationship found - client not assigned to trainer")
        return NextResponse.json(
          { error: "Client not found or not assigned to you" },
          { status: 404 }
        )
      }
    }

    // Verify the workout program exists
    const workoutProgram = await prisma.workoutProgram.findFirst({
      where: {
        id: programId
      }
    })

    console.log("Found workout program:", workoutProgram)

    if (!workoutProgram) {
      return NextResponse.json(
        { error: "Workout program not found" },
        { status: 404 }
      )
    }

    // Check if client has an active subscription
    const client = await prisma.client.findFirst({
      where: {
        userId: clientId
      }
    })

    if (!client) {
      return NextResponse.json(
        { error: "Client profile not found" },
        { status: 404 }
      )
    }

    if (client.subscriptionStatus !== 'ACTIVE') {
      return NextResponse.json(
        { error: "Client does not have an active subscription. Only clients with active subscriptions can be assigned workout programs." },
        { status: 400 }
      )
    }

    // TODO: ENABLE MULTIPLE WORKOUTS PER DAY - Comment out this block to allow multiple workout programs on same day
    /*
    // Check if this program is already assigned to this client on the same start date
    const existingAssignment = await prisma.clientWorkoutProgram.findMany({
      where: {
        clientId: clientId,
        programId: programId,
        startDate: new Date(startDate)
      }
    })

    if (existingAssignment.length > 0) {
      return NextResponse.json(
        { error: "This workout program is already assigned to this client starting on this date" },
        { status: 400 }
      )
    }
    */

    // Create the workout program assignment
    const clientWorkoutProgram = await prisma.clientWorkoutProgram.create({
      data: {
        clientId: clientId,
        programId: programId,
        startDate: new Date(startDate),
        notes: notes || "",
        status: "ACTIVE"
      },
      include: {
        client: {
          select: {
            name: true,
            email: true
          }
        },
        program: {
          select: {
            name: true,
            description: true,
            totalDays: true,
            difficulty: true
          }
        }
      }
    })

    console.log("Workout program assigned successfully:", clientWorkoutProgram.id)

    // TODO: Create individual day assignments once Prisma client is regenerated
    // This will be implemented to show all program days in trainer schedule
    console.log(`Program assigned starting from ${startDate}`)

    return NextResponse.json({
      message: "Workout program assigned successfully",
      assignment: clientWorkoutProgram
    }, { status: 201 })

  } catch (error: any) {
    console.error("Error assigning workout program:", error)
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: "Duplicate assignment detected. This might be due to a database constraint." },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("GET /api/workout-programs/assign - Session user:", session.user)

    // Check if a specific clientId is requested
    const { searchParams } = new URL(request.url)
    const requestedClientId = searchParams.get('clientId')

    let assignments
    if (session.user.role === "ADMIN") {
      // Admins see all workout program assignments across all trainers and clients
      console.log("Fetching all workout program assignments for admin")
      
      if (requestedClientId) {
        // Fetch assignments for the specific client
        assignments = await prisma.clientWorkoutProgram.findMany({
          where: {
            clientId: requestedClientId
          },
          include: {
            client: {
              select: {
                name: true,
                email: true
              }
            },
            program: {
              include: {
                days: {
                  include: {
                    exercises: {
                      include: {
                        exercise: {
                          select: {
                            id: true,
                            name: true,
                            description: true,
                            category: true,
                            difficulty: true,
                            videoUrl: true,
                            instructions: true
                          }
                        }
                      },
                      orderBy: {
                        order: 'asc'
                      }
                    }
                  },
                  orderBy: {
                    dayNumber: 'asc'
                  }
                }
              }
            }
          },
          orderBy: {
            startDate: 'asc'
          }
        })
        console.log("Found admin workout program assignments for specific client:", assignments.length)
      } else {
        // Fetch all assignments across all clients
        assignments = await prisma.clientWorkoutProgram.findMany({
          include: {
            client: {
              select: {
                name: true,
                email: true
              }
            },
            program: {
              include: {
                days: {
                  include: {
                    exercises: {
                      include: {
                        exercise: {
                          select: {
                            id: true,
                            name: true,
                            description: true,
                            category: true,
                            difficulty: true,
                            videoUrl: true,
                            instructions: true
                          }
                        }
                      },
                      orderBy: {
                        order: 'asc'
                      }
                    }
                  },
                  orderBy: {
                    dayNumber: 'asc'
                  }
                }
              }
            }
          },
          orderBy: {
            startDate: 'asc'
          }
        })
        console.log("Found admin workout program assignments for all clients:", assignments.length)
      }
    } else if (session.user.role === "TRAINER") {
      // Trainers see assignments for their clients
      console.log("Fetching workout program assignments for trainer:", session.user.id)
      
      if (requestedClientId) {
        // Verify the requested client belongs to this trainer
        // First, get all client user IDs that belong to this trainer
        const trainerClients = await prisma.client.findMany({
          where: { trainerId: session.user.id },
          select: { userId: true }
        })
        
        const clientUserIds = trainerClients.map(c => c.userId)
        console.log("Trainer's client user IDs:", clientUserIds)
        
        // Check if the requested client ID is in the trainer's client list
        if (!clientUserIds.includes(requestedClientId)) {
          return NextResponse.json({ error: "Client not found or not assigned to you" }, { status: 404 })
        }
        
        // Fetch assignments for the specific client
        assignments = await prisma.clientWorkoutProgram.findMany({
          where: {
            clientId: requestedClientId
          },
          include: {
            client: {
              select: {
                name: true,
                email: true
              }
            },
            program: {
              include: {
                days: {
                  include: {
                    exercises: {
                      include: {
                        exercise: {
                          select: {
                            id: true,
                            name: true,
                            description: true,
                            category: true,
                            difficulty: true,
                            videoUrl: true,
                            instructions: true
                          }
                        }
                      },
                      orderBy: {
                        order: 'asc'
                      }
                    }
                  },
                  orderBy: {
                    dayNumber: 'asc'
                  }
                }
              }
            }
          },
          orderBy: {
            startDate: 'asc'
          }
        })
        console.log("Found trainer workout program assignments for specific client:", assignments.length)
      } else {
        // Fetch assignments for all clients of this trainer
        // First, get all client user IDs that belong to this trainer
        const trainerClients = await prisma.client.findMany({
          where: { trainerId: session.user.id },
          select: { userId: true }
        })
        
        const clientUserIds = trainerClients.map(c => c.userId)
        console.log("Trainer's client user IDs:", clientUserIds)
        
        // Then find all ClientWorkoutProgram records for these clients
        assignments = await prisma.clientWorkoutProgram.findMany({
          where: {
            clientId: { in: clientUserIds }
          },
          include: {
            client: {
              select: {
                name: true,
                email: true
              }
            },
            program: {
              include: {
                days: {
                  include: {
                    exercises: {
                      include: {
                        exercise: {
                          select: {
                            id: true,
                            name: true,
                            description: true,
                            category: true,
                            difficulty: true,
                            videoUrl: true,
                            instructions: true
                          }
                        }
                      },
                      orderBy: {
                        order: 'asc'
                      }
                    }
                  },
                  orderBy: {
                    dayNumber: 'asc'
                  }
                }
              }
            }
          },
          orderBy: {
            startDate: 'asc'
          }
        })
        console.log("Found trainer workout program assignments for all clients:", assignments.length)
      }
    } else {
      // Clients see their own assignments
      console.log("Fetching workout program assignments for client:", session.user.id)
      
      assignments = await prisma.clientWorkoutProgram.findMany({
        where: {
          clientId: session.user.id
        },
        include: {
          program: {
            include: {
              days: {
                include: {
                  exercises: {
                    include: {
                      exercise: {
                        select: {
                          id: true,
                          name: true,
                          description: true,
                          category: true,
                          difficulty: true,
                          videoUrl: true,
                          instructions: true
                        }
                      }
                    },
                    orderBy: {
                      order: 'asc'
                    }
                  }
                },
                orderBy: {
                  dayNumber: 'asc'
                }
              }
            }
          }
        },
        orderBy: {
          startDate: 'asc'
        }
      })
      console.log("Found client workout program assignments:", assignments.length)
    }

    return NextResponse.json({
      assignments,
      count: assignments.length
    })

  } catch (error) {
    console.error("Error fetching workout program assignments:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is a trainer or admin
    if (session.user.role !== "TRAINER" && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden - Insufficient permissions" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const assignmentId = searchParams.get('assignmentId')

    if (!assignmentId) {
      return NextResponse.json(
        { error: "Assignment ID is required" },
        { status: 400 }
      )
    }

    // Find the assignment first to verify ownership/permissions
    const assignment = await prisma.clientWorkoutProgram.findUnique({
      where: { id: assignmentId }
    })

    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      )
    }

    console.log("Debug - Assignment found:", {
      assignmentId: assignment.id,
      clientId: assignment.clientId,
      sessionUserId: session.user.id,
      sessionUserRole: session.user.role
    })

    // Verify permissions
    if (session.user.role === "TRAINER") {
      // Trainers can only delete assignments for their clients
      // Check if the client is assigned to this trainer by looking up the Client record directly
      const clientRecord = await prisma.client.findFirst({
        where: {
          userId: assignment.clientId,
          trainerId: session.user.id
        }
      })
      
      console.log("Debug - Permission check for trainer:", {
        assignmentClientId: assignment.clientId,
        sessionUserId: session.user.id,
        clientRecordFound: !!clientRecord,
        clientRecordTrainerId: clientRecord?.trainerId
      })
      
      if (!clientRecord) {
        return NextResponse.json(
          { error: "Forbidden - You can only delete assignments for your clients" },
          { status: 403 }
        )
      }
    }
    // Admins can delete any assignment

    // Delete the assignment
    await prisma.clientWorkoutProgram.delete({
      where: { id: assignmentId }
    })

    return NextResponse.json({
      message: "Workout program assignment deleted successfully"
    })

  } catch (error: any) {
    console.error("Error deleting workout program assignment:", error)
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    )
  }
}
