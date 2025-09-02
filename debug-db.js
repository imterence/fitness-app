const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function debugDatabase() {
  try {
    console.log('🔍 Debugging database...')

    // Try to find exercises directly
    console.log('💪 Looking for exercises...')
    const exercises = await prisma.exercise.findMany({
      take: 5
    })
    console.log(`Found ${exercises.length} exercises:`)
    exercises.forEach(ex => console.log(`  - ${ex.name}`))

    // Try to find workouts directly
    console.log('\n🏋️ Looking for workouts...')
    const workouts = await prisma.workout.findMany({
      take: 5
    })
    console.log(`Found ${workouts.length} workouts:`)
    workouts.forEach(w => console.log(`  - ${w.name}`))

    // Try raw SQL query
    console.log('\n🔍 Raw SQL query for exercises...')
    const rawExercises = await prisma.$queryRaw`SELECT COUNT(*) as count FROM "Exercise"`
    console.log('Raw exercise count:', rawExercises)

    console.log('\n🔍 Raw SQL query for workouts...')
    const rawWorkouts = await prisma.$queryRaw`SELECT COUNT(*) as count FROM "Workout"`
    console.log('Raw workout count:', rawWorkouts)

  } catch (error) {
    console.error('❌ Error debugging database:', error)
  } finally {
    await prisma.$disconnect()
  }
}

debugDatabase()
