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

    console.log("Database test - Session user:", session.user)

    // Test basic database connection
    const dbTest: any = {
      timestamp: new Date().toISOString(),
      user: {
        id: session.user.id,
        email: session.user.email,
        role: session.user.role
      }
    }

    // Test Prisma connection by running a simple query
    try {
      const userCount = await prisma.user.count()
      dbTest.userCount = userCount
      console.log("Database connection successful, user count:", userCount)
    } catch (dbError) {
      console.error("Database connection failed:", dbError)
      dbTest.dbError = dbError instanceof Error ? dbError.message : String(dbError)
      return NextResponse.json({
        error: "Database connection failed",
        details: dbTest
      }, { status: 500 })
    }

    // Test specific queries based on user role
    if (session.user.role === "CLIENT") {
      try {
        // Test client workout assignments query
        const workoutAssignments = await prisma.clientWorkout.findMany({
          where: { clientId: session.user.id },
          take: 1
        })
        dbTest.clientWorkoutTest = {
          success: true,
          count: workoutAssignments.length
        }

        // Test client workout program assignments query
        const programAssignments = await prisma.clientWorkoutProgram.findMany({
          where: { clientId: session.user.id },
          take: 1
        })
        dbTest.clientProgramTest = {
          success: true,
          count: programAssignments.length
        }

        console.log("Client queries successful")
      } catch (queryError) {
        console.error("Client queries failed:", queryError)
        dbTest.queryError = queryError instanceof Error ? queryError.message : String(queryError)
      }
    }

    // Test workout availability for all users
    try {
      const workoutCount = await prisma.workout.count()
      const workoutProgramCount = await prisma.workoutProgram.count()
      
      dbTest.workoutCounts = {
        singleDayWorkouts: workoutCount,
        multiDayPrograms: workoutProgramCount,
        total: workoutCount + workoutProgramCount
      }
      
      console.log("Workout counts:", dbTest.workoutCounts)
    } catch (workoutError) {
      console.error("Workout count query failed:", workoutError)
      dbTest.workoutError = workoutError instanceof Error ? workoutError.message : String(workoutError)
    }

    return NextResponse.json({
      message: "Database test completed",
      results: dbTest
    })

  } catch (error) {
    console.error("Database test error:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
