import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

interface ImportExercise {
  exerciseName: string
  sets: number
  reps: string
  rest: string
  notes: string
  order: number
}

interface ImportWorkout {
  type: 'single-day' | 'multi-day'
  name: string
  description: string
  exercises: ImportExercise[]
  days?: Array<{
    dayNumber: number
    name: string
    isRestDay: boolean
    exercises: ImportExercise[]
  }>
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is a trainer or admin
    if (session.user.role !== "TRAINER" && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { workouts }: { workouts: ImportWorkout[] } = await request.json()

    if (!workouts || !Array.isArray(workouts)) {
      return NextResponse.json(
        { error: "Invalid workouts data" },
        { status: 400 }
      )
    }

    console.log(`Starting import of ${workouts.length} workouts`)
    console.log('Workouts data:', JSON.stringify(workouts, null, 2))

    const results = []
    const errors = []

    for (const workoutData of workouts) {
      try {
        console.log(`Processing workout: ${workoutData.name} (${workoutData.type})`)
        
        if (workoutData.type === 'single-day') {
          // Create single-day workout
          // First, find all existing exercises (case-insensitive)
          const validExercises = []
          const missingExercises = []
          
          for (const exerciseData of workoutData.exercises) {
            const exercise = await prisma.exercise.findFirst({
              where: { 
                name: {
                  equals: exerciseData.exerciseName,
                  mode: 'insensitive'
                }
              }
            })
            
            if (exercise) {
              validExercises.push({
                exerciseId: exercise.id,
                order: exerciseData.order,
                sets: exerciseData.sets,
                reps: exerciseData.reps,
                rest: exerciseData.rest,
                notes: exerciseData.notes
              })
            } else {
              missingExercises.push(exerciseData.exerciseName)
              console.log(`Skipping exercise "${exerciseData.exerciseName}" - not found in exercise library`)
            }
          }
          
          // Only create workout if it has at least one valid exercise
          if (validExercises.length === 0) {
            console.log(`Skipping workout "${workoutData.name}" - no valid exercises found`)
            errors.push({
              name: workoutData.name,
              error: `No valid exercises found. Missing exercises: ${missingExercises.join(', ')}`
            })
            continue
          }

          const workout = await prisma.workout.create({
            data: {
              name: workoutData.name,
              description: workoutData.description,
              category: "Custom",
              difficulty: "INTERMEDIATE",
              estimatedDuration: 60,
              isPublic: true,
              creatorId: session.user.id,
              exercises: {
                create: validExercises
              }
            }
          })

          console.log(`Successfully created single-day workout: ${workout.name} with ${validExercises.length} valid exercises (${workoutData.exercises.length} total in CSV)`)
          results.push({
            type: 'single-day',
            id: workout.id,
            name: workout.name,
            exercisesCount: validExercises.length,
            totalExercisesInCSV: workoutData.exercises.length,
            missingExercises: missingExercises.length > 0 ? missingExercises : undefined
          })
        } else {
          // Create multi-day workout program
          // First, handle all days and their exercises
          const daysData = []
          const missingExercises = []
          
          for (const dayData of workoutData.days || []) {
            if (dayData.isRestDay) {
              // Rest day - no exercises needed
              daysData.push({
                dayNumber: dayData.dayNumber,
                name: dayData.name,
                isRestDay: dayData.isRestDay,
                estimatedDuration: 60,
                notes: 'Rest day'
              })
            } else {
              // Active day - find valid exercises
              const validExercises = []
              const dayMissingExercises = []
              
              for (const exerciseData of dayData.exercises) {
                const exercise = await prisma.exercise.findFirst({
                  where: { 
                    name: {
                      equals: exerciseData.exerciseName,
                      mode: 'insensitive'
                    }
                  }
                })
                
                if (exercise) {
                  validExercises.push({
                    exerciseId: exercise.id,
                    order: exerciseData.order,
                    sets: exerciseData.sets,
                    reps: exerciseData.reps,
                    rest: exerciseData.rest,
                    notes: exerciseData.notes
                  })
                } else {
                  dayMissingExercises.push(exerciseData.exerciseName)
                  missingExercises.push(`${exerciseData.exerciseName} (Day ${dayData.dayNumber})`)
                  console.log(`Skipping exercise "${exerciseData.exerciseName}" in day ${dayData.name} - not found in exercise library`)
                }
              }
              
              // Only add day if it has valid exercises
              if (validExercises.length > 0) {
                daysData.push({
                  dayNumber: dayData.dayNumber,
                  name: dayData.name,
                  isRestDay: dayData.isRestDay,
                  estimatedDuration: 60,
                  notes: undefined,
                  exercises: {
                    create: validExercises
                  }
                })
              } else {
                console.log(`Skipping day "${dayData.name}" - no valid exercises found`)
              }
            }
          }

          // Only create workout program if it has at least one valid day
          if (daysData.length === 0) {
            console.log(`Skipping workout program "${workoutData.name}" - no valid days with exercises found`)
            errors.push({
              name: workoutData.name,
              error: `No valid days with exercises found. Missing exercises: ${missingExercises.join(', ')}`
            })
            continue
          }

          const workoutProgram = await prisma.workoutProgram.create({
            data: {
              name: workoutData.name,
              description: workoutData.description,
              category: "Custom",
              difficulty: "INTERMEDIATE",
              totalDays: daysData.length,
              isPublic: true,
              creatorId: session.user.id,
              days: {
                create: daysData
              }
            }
          })

          console.log(`Successfully created multi-day workout program: ${workoutProgram.name} with ${daysData.length} valid days (${workoutData.days?.length || 0} total in CSV)`)
          results.push({
            type: 'multi-day',
            id: workoutProgram.id,
            name: workoutProgram.name,
            daysCount: daysData.length,
            totalDaysInCSV: workoutData.days?.length || 0,
            missingExercises: missingExercises.length > 0 ? missingExercises : undefined
          })
        }
      } catch (error) {
        console.error(`Error importing workout ${workoutData.name}:`, error)
        errors.push({
          name: workoutData.name,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    // Calculate total exercises processed vs imported
    let totalExercisesInCSV = 0
    let totalExercisesImported = 0
    
    results.forEach(result => {
      if (result.type === 'single-day') {
        totalExercisesInCSV += result.totalExercisesInCSV || 0
        totalExercisesImported += result.exercisesCount || 0
      } else if (result.type === 'multi-day') {
        // For multi-day, we'd need to count exercises per day, but this gives us a rough idea
        totalExercisesInCSV += (result.totalDaysInCSV || 0) * 3 // Estimate 3 exercises per day
        totalExercisesImported += (result.daysCount || 0) * 3 // Estimate 3 exercises per day
      }
    })
    
    console.log(`Import completed. Results: ${results.length} successful, ${errors.length} errors`)
    console.log(`Exercises: ${totalExercisesImported} imported out of ${totalExercisesInCSV} in CSV`)
    console.log('Final results:', results)
    if (errors.length > 0) {
      console.log('Errors:', errors)
    }
    
    // Calculate summary statistics
    const totalWorkoutsAttempted = workouts.length
    const totalWorkoutsImported = results.length
    const totalWorkoutsFailed = errors.length
    
    let summaryMessage = `Successfully imported ${totalWorkoutsImported} out of ${totalWorkoutsAttempted} workouts`
    if (totalWorkoutsFailed > 0) {
      summaryMessage += ` (${totalWorkoutsFailed} failed)`
    }
    
    return NextResponse.json({
      message: summaryMessage,
      results,
      errors: errors.length > 0 ? errors : undefined,
      summary: {
        totalAttempted: totalWorkoutsAttempted,
        totalImported: totalWorkoutsImported,
        totalFailed: totalWorkoutsFailed
      }
    }, { status: 201 })

  } catch (error) {
    console.error("Error importing workouts:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
