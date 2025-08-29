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

    console.log("Assignment API - Session user:", session.user)

    // Check if user is a trainer or admin
    if (session.user.role !== "TRAINER" && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden - Insufficient permissions" }, { status: 403 })
    }

    const { clientId, workoutId, scheduledDate, notes } = await request.json()

    console.log("Assigning workout:", { clientId, workoutId, scheduledDate, notes })

    // Validate required fields
    if (!clientId || !workoutId || !scheduledDate) {
      return NextResponse.json(
        { error: "Missing required fields: clientId, workoutId, scheduledDate" },
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

    // Get client info for the response
    const client = await prisma.client.findFirst({
      where: {
        userId: clientId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    console.log("Found client:", client)

    if (!client) {
      return NextResponse.json(
        { error: "Client not found or not assigned to you" },
        { status: 404 }
      )
    }

    // Check if client has an active subscription
    if (client.subscriptionStatus !== 'ACTIVE') {
      return NextResponse.json(
        { error: "Client does not have an active subscription. Only clients with active subscriptions can be assigned workouts." },
        { status: 400 }
      )
    }

    // Verify the workout exists (can be any workout - templates, public, or own)
    const workout = await prisma.workout.findFirst({
      where: {
        id: workoutId
      }
    })

    console.log("Found workout:", workout)

    if (!workout) {
      return NextResponse.json(
        { error: "Workout not found" },
        { status: 404 }
      )
    }

    // TODO: ENABLE MULTIPLE WORKOUTS PER DAY - Comment out this block to allow multiple workouts on same day
    /*
    // Check if this workout is already assigned to this client on the same date
    const existingAssignment = await prisma.clientWorkout.findFirst({
      where: {
        clientId: clientId,
        workoutId: workoutId,
        scheduledDate: new Date(scheduledDate)
      }
    })

    if (existingAssignment) {
      return NextResponse.json(
        { error: "This workout is already assigned to this client for this specific date" },
        { status: 400 }
      )
    }
    */

    // Create the workout assignment
    const clientWorkout = await prisma.clientWorkout.create({
      data: {
        clientId: clientId, // Use the User ID directly
        workoutId: workoutId,
        scheduledDate: new Date(scheduledDate),
        notes: notes || "",
        status: "SCHEDULED"
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
            description: true,
            estimatedDuration: true,
            difficulty: true,
            exercises: {
              include: {
                exercise: {
                  select: {
                    id: true,
                    name: true,
                    description: true,
                    category: true,
                    difficulty: true
                  }
                }
              },
              orderBy: {
                order: 'asc'
              }
            }
          }
        }
      }
    })

    console.log("Workout assigned successfully:", clientWorkout.id)
    console.log("Created assignment with exercises:", clientWorkout.workout?.exercises?.length || 0)

    return NextResponse.json({
      message: "Workout assigned successfully",
      assignment: clientWorkout
    }, { status: 201 })

  } catch (error: any) {
    console.error("Error assigning workout:", error)
    
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

    console.log("GET /api/workouts/assign - Session user:", session.user)

    // Check if a specific clientId is requested
    const { searchParams } = new URL(request.url)
    const requestedClientId = searchParams.get('clientId')

    let assignments
    if (session.user.role === "ADMIN") {
      // Admins see all assignments across all trainers and clients
      console.log("Fetching all assignments for admin")
      
      if (requestedClientId) {
        // Fetch assignments for the specific client
        assignments = await prisma.clientWorkout.findMany({
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
            workout: {
              select: {
                name: true,
                description: true,
                estimatedDuration: true,
                difficulty: true,
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
              }
            }
          },
          orderBy: {
            scheduledDate: 'asc'
          }
        })
        console.log("Found admin assignments for specific client:", assignments.length)
      } else {
        // Fetch all assignments across all clients
        assignments = await prisma.clientWorkout.findMany({
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
                description: true,
                estimatedDuration: true,
                difficulty: true,
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
              }
            }
          },
          orderBy: {
            scheduledDate: 'asc'
          }
        })
        console.log("Found admin assignments for all clients:", assignments.length)
      }
    } else if (session.user.role === "TRAINER") {
      // Trainers see assignments for their clients
      console.log("Fetching assignments for trainer:", session.user.id)
      
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
        assignments = await prisma.clientWorkout.findMany({
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
            workout: {
              select: {
                name: true,
                description: true,
                estimatedDuration: true,
                difficulty: true,
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
              }
            }
          },
          orderBy: {
            scheduledDate: 'asc'
          }
        })
        console.log("Found trainer assignments for specific client:", assignments.length)
        console.log("Sample assignment workout exercises:", assignments[0]?.workout?.exercises)
      } else {
        // Fetch assignments for all clients of this trainer
        // First, get all client user IDs that belong to this trainer
        const trainerClients = await prisma.client.findMany({
          where: { trainerId: session.user.id },
          select: { userId: true }
        })
        
        const clientUserIds = trainerClients.map(c => c.userId)
        console.log("Trainer's client user IDs:", clientUserIds)
        
        // Then find all ClientWorkout records for these clients
        assignments = await prisma.clientWorkout.findMany({
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
            workout: {
              select: {
                name: true,
                description: true,
                estimatedDuration: true,
                difficulty: true,
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
              }
            }
          },
          orderBy: {
            scheduledDate: 'asc'
          }
        })
        console.log("Found trainer assignments for all clients:", assignments.length)
        console.log("Sample assignment workout exercises:", assignments[0]?.workout?.exercises)
      }
    } else {
      // Clients see their own assignments
      console.log("Fetching assignments for client:", session.user.id)
      console.log("Client session user ID:", session.user.id)
      
      // First check if this user has a client profile
      const clientProfile = await prisma.client.findFirst({
        where: { userId: session.user.id }
      })
      console.log("Client profile found:", clientProfile ? "Yes" : "No")
      
      assignments = await prisma.clientWorkout.findMany({
        where: {
          clientId: session.user.id
        },
        include: {
          workout: {
            select: {
              name: true,
              description: true,
              estimatedDuration: true,
              difficulty: true,
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
            }
          }
        },
        orderBy: {
          scheduledDate: 'asc'
        }
      })
      console.log("Found client assignments:", assignments.length)
      console.log("Sample client assignment workout exercises:", assignments[0]?.workout?.exercises)
      console.log("Client assignments:", assignments)
    }

    return NextResponse.json({
      assignments,
      count: assignments.length
    })

  } catch (error) {
    console.error("Error fetching assignments:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
