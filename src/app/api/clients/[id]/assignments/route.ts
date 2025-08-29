import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: clientId } = await params
  
  console.log("API: Fetching assignments for client:", clientId)
  
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      console.log("API: No session found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("API: Session user:", { id: session.user.id, role: session.user.role })

    // Check if user is a trainer, admin, or the client themselves
    if (session.user.role !== "TRAINER" && session.user.role !== "ADMIN" && session.user.id !== clientId) {
      console.log("API: Insufficient permissions")
      return NextResponse.json({ error: "Forbidden - Insufficient permissions" }, { status: 403 })
    }

    // For trainers, verify the client belongs to them
    if (session.user.role === "TRAINER") {
      const clientAssignment = await prisma.client.findFirst({
        where: {
          userId: clientId,
          trainerId: session.user.id
        }
      })

      const directTrainerRelationship = await prisma.user.findFirst({
        where: {
          id: clientId,
          trainerId: session.user.id
        }
      })

      console.log("API: Client relationships:", { 
        clientAssignment: !!clientAssignment, 
        directTrainerRelationship: !!directTrainerRelationship 
      })

      if (!clientAssignment && !directTrainerRelationship) {
        console.log("API: Client not found or not assigned to trainer")
        return NextResponse.json(
          { error: "Client not found or not assigned to you" },
          { status: 404 }
        )
      }
    }

    // Get all workout assignments for this client
    console.log("API: Querying database for assignments...")
    
    const [singleWorkoutAssignments, programAssignments] = await Promise.all([
      // Single workout assignments
      prisma.clientWorkout.findMany({
        where: {
          clientId: clientId
        },
        select: {
          scheduledDate: true
        }
      }),
      // Program day assignments - need to go through ClientWorkoutProgram first
      prisma.programDayAssignment.findMany({
        where: {
          clientWorkoutProgram: {
            clientId: clientId
          }
        },
        select: {
          scheduledDate: true
        }
      })
    ])

    // Also get program start dates and calculate all program dates
    const clientWorkoutPrograms = await prisma.clientWorkoutProgram.findMany({
      where: {
        clientId: clientId
      },
      select: {
        startDate: true,
        program: {
          select: {
            totalDays: true
          }
        }
      }
    })

    // Calculate all dates for multi-day programs
    const programDates = []
    for (const program of clientWorkoutPrograms) {
      const startDate = new Date(program.startDate)
      const totalDays = program.program.totalDays
      
      for (let i = 0; i < totalDays; i++) {
        const programDate = new Date(startDate)
        programDate.setDate(startDate.getDate() + i)
        programDates.push(programDate)
      }
    }

    console.log("API: Program calculations:", {
      clientWorkoutPrograms: clientWorkoutPrograms.length,
      calculatedProgramDates: programDates.length,
      sampleProgramDates: programDates.slice(0, 5)
    })

    console.log("API: Raw assignment data:", {
      singleWorkoutCount: singleWorkoutAssignments.length,
      programCount: programAssignments.length,
      singleWorkoutDates: singleWorkoutAssignments.map(a => a.scheduledDate),
      programDates: programAssignments.map(a => a.scheduledDate)
    })

    // Combine all scheduled dates and format them as YYYY-MM-DD strings
    const allDates = [
      ...singleWorkoutAssignments.map(a => a.scheduledDate),
      ...programAssignments.map(a => a.scheduledDate),
      ...programDates // Add the calculated program dates
    ]

    // Convert to YYYY-MM-DD format and remove duplicates
    const uniqueDates = [...new Set(
      allDates.map(date => {
        const d = new Date(date)
        const year = d.getFullYear()
        const month = String(d.getMonth() + 1).padStart(2, '0')
        const day = String(d.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
      })
    )].sort()

    console.log("API: Final processed dates:", uniqueDates)

    return NextResponse.json({
      scheduledDates: uniqueDates,
      count: uniqueDates.length
    })

  } catch (error) {
    console.error("Error fetching client assignments:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
