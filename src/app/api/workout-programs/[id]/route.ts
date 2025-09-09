import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Find the workout program with all related data
    const workoutProgram = await prisma.workoutProgram.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        days: {
          include: {
            exercises: {
              include: {
                exercise: {
                  select: {
                    id: true,
                    name: true,
                    category: true,
                    description: true
                  }
                }
              }
            }
          },
          orderBy: {
            dayNumber: 'asc'
          }
        }
      }
    })

    if (!workoutProgram) {
      return NextResponse.json({ error: "Workout program not found" }, { status: 404 })
    }

    // Check if user is the creator or an admin
    if (workoutProgram.creator.id !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden - You can only view your own workout programs" }, { status: 403 })
    }

    return NextResponse.json(workoutProgram)

  } catch (error: any) {
    console.error("Error fetching workout program:", error)
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Check if user is a trainer or admin
    if (session.user.role !== "TRAINER" && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden - Insufficient permissions" }, { status: 403 })
    }

    // Find the workout program
    const workoutProgram = await prisma.workoutProgram.findUnique({
      where: { id },
      include: {
        creator: true
      }
    })

    if (!workoutProgram) {
      return NextResponse.json({ error: "Workout program not found" }, { status: 404 })
    }

    // Check if user is the creator or an admin
    if (workoutProgram.creator.id !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden - You can only delete your own workout programs" }, { status: 403 })
    }

    // Delete the workout program (cascade will handle related records)
    await prisma.workoutProgram.delete({
      where: { id }
    })

    return NextResponse.json({
      message: "Workout program deleted successfully"
    })

  } catch (error: any) {
    console.error("Error deleting workout program:", error)
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params
    const body = await request.json()

    // Find the workout program
    const workoutProgram = await prisma.workoutProgram.findUnique({
      where: { id },
      include: {
        creator: true
      }
    })

    if (!workoutProgram) {
      return NextResponse.json({ error: "Workout program not found" }, { status: 404 })
    }

    // Check if user is the creator or an admin
    if (workoutProgram.creator.id !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden - You can only edit your own workout programs" }, { status: 403 })
    }

    // Update the workout program basic info if provided
    if (body.name !== undefined || body.description !== undefined || body.totalDays !== undefined) {
      await prisma.workoutProgram.update({
        where: { id },
        data: {
          ...(body.name !== undefined && { name: body.name }),
          ...(body.description !== undefined && { description: body.description }),
          ...(body.totalDays !== undefined && { totalDays: body.totalDays }),
          // Always keep these as defaults
          category: "Custom",
          difficulty: "INTERMEDIATE",
          isPublic: true
        }
      })
    }

    // Update the workout program days if provided
    if (body.days !== undefined) {
      console.log(`Updating workout program ${id} with ${body.days.length} days`)
      
      // Use a transaction to ensure data consistency
      await prisma.$transaction(async (tx) => {
        // First, delete existing days and exercises
        await tx.workoutDayExercise.deleteMany({
          where: {
            day: {
              programId: id
            }
          }
        })
        await tx.workoutDay.deleteMany({
          where: { programId: id }
        })

        // Then create new days and exercises
        if (body.days && body.days.length > 0) {
          for (const day of body.days) {
            console.log(`Creating day ${day.dayNumber} for program ${id}`)
            const newDay = await tx.workoutDay.create({
              data: {
                programId: id,
                dayNumber: day.dayNumber,
                name: day.name,
                isRestDay: day.isRestDay,
                estimatedDuration: day.estimatedDuration,
                notes: day.notes
              }
            })

            // Create exercises for this day if not a rest day
            if (!day.isRestDay && day.exercises && day.exercises.length > 0) {
              console.log(`Creating ${day.exercises.length} exercises for day ${day.dayNumber}`)
              // Validate exercise data before creating
              const exerciseData = day.exercises.map((exercise: any, index: number) => {
                if (!exercise.exercise || !exercise.exercise.id) {
                  throw new Error(`Exercise ${index + 1} in day ${day.dayNumber} is missing exercise ID`)
                }
                return {
                  dayId: newDay.id,
                  exerciseId: exercise.exercise.id,
                  order: index + 1,
                  sets: exercise.sets || 1,
                  reps: exercise.reps || "10",
                  rest: exercise.rest || "60s",
                  notes: exercise.notes || ""
                }
              })

              await tx.workoutDayExercise.createMany({
                data: exerciseData
              })
            }
          }
        }
      })
    }

    // Fetch the updated workout program
    const updatedProgram = await prisma.workoutProgram.findUnique({
      where: { id },
      include: {
        days: {
          include: {
            exercises: {
              include: {
                exercise: true
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
    })

    return NextResponse.json({
      message: "Workout program updated successfully",
      program: updatedProgram
    })

  } catch (error: any) {
    console.error("Error updating workout program:", error)
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    )
  }
}
