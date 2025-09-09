const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function clearWorkoutAssignments() {
  try {
    console.log('Starting to clear all workout assignment data...')
    
    // Clear workout progress data first (due to foreign key constraints)
    console.log('Clearing workout progress data...')
    const progressDeleted = await prisma.workoutProgress.deleteMany({})
    console.log(`Deleted ${progressDeleted.count} workout progress records`)
    
    // Clear workout day progress data
    console.log('Clearing workout day progress data...')
    const dayProgressDeleted = await prisma.workoutDayProgress.deleteMany({})
    console.log(`Deleted ${dayProgressDeleted.count} workout day progress records`)
    
    // Clear program day assignments
    console.log('Clearing program day assignments...')
    const dayAssignmentsDeleted = await prisma.programDayAssignment.deleteMany({})
    console.log(`Deleted ${dayAssignmentsDeleted.count} program day assignment records`)
    
    // Clear client workout programs
    console.log('Clearing client workout programs...')
    const programsDeleted = await prisma.clientWorkoutProgram.deleteMany({})
    console.log(`Deleted ${programsDeleted.count} client workout program records`)
    
    // Clear individual client workouts
    console.log('Clearing individual client workouts...')
    const workoutsDeleted = await prisma.clientWorkout.deleteMany({})
    console.log(`Deleted ${workoutsDeleted.count} client workout records`)
    
    console.log('\n✅ Successfully cleared all workout assignment data!')
    console.log('\nSummary of deleted records:')
    console.log(`- Workout Progress: ${progressDeleted.count}`)
    console.log(`- Workout Day Progress: ${dayProgressDeleted.count}`)
    console.log(`- Program Day Assignments: ${dayAssignmentsDeleted.count}`)
    console.log(`- Client Workout Programs: ${programsDeleted.count}`)
    console.log(`- Individual Client Workouts: ${workoutsDeleted.count}`)
    
  } catch (error) {
    console.error('❌ Error clearing workout assignments:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the function
clearWorkoutAssignments()














