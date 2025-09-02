const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function forceAddData() {
  try {
    console.log('🔄 Force adding exercises and workouts...')

    // Get admin user ID
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
      select: { id: true }
    })

    if (!adminUser) {
      console.log('❌ No admin user found!')
      return
    }

    console.log(`Admin user ID: ${adminUser.id}`)

    // 1. Force add exercises using raw SQL
    console.log('💪 Force adding exercises...')
    
    const exercises = [
      ['Push-ups', 'Strength', 'Classic bodyweight push-up exercise', 'Chest, Triceps, Shoulders', 'Bodyweight', 'BEGINNER', 'Start in plank position, lower chest to ground, push back up', ''],
      ['Squats', 'Strength', 'Basic bodyweight squat exercise', 'Quadriceps, Glutes, Hamstrings', 'Bodyweight', 'BEGINNER', 'Stand with feet shoulder-width apart, lower down as if sitting in a chair, return to standing', ''],
      ['Plank', 'Core', 'Isometric core strengthening exercise', 'Core, Shoulders', 'Bodyweight', 'BEGINNER', 'Hold a straight line from head to heels, engage core', ''],
      ['Lunges', 'Strength', 'Single leg strengthening exercise', 'Quadriceps, Glutes, Hamstrings', 'Bodyweight', 'INTERMEDIATE', 'Step forward into lunge position, lower back knee toward ground, return to standing', ''],
      ['Burpees', 'Cardio', 'Full body cardio exercise', 'Full Body', 'Bodyweight', 'INTERMEDIATE', 'Squat down, jump back to plank, do push-up, jump feet forward, jump up with arms overhead', '']
    ]

    for (const [name, category, description, muscleGroups, equipment, difficulty, instructions, videoUrl] of exercises) {
      try {
        await prisma.$executeRaw`
          INSERT INTO "Exercise" ("id", "name", "category", "description", "muscleGroups", "equipment", "difficulty", "instructions", "videoUrl", "createdAt", "updatedAt")
          VALUES (gen_random_uuid()::text, ${name}, ${category}, ${description}, ${muscleGroups}, ${equipment}, ${difficulty}, ${instructions}, ${videoUrl}, NOW(), NOW())
        `
        console.log(`✅ Exercise added: ${name}`)
      } catch (error) {
        console.log(`⚠️ Error adding exercise ${name}:`, error.message)
      }
    }

    // 2. Force add workouts using raw SQL
    console.log('🏋️ Force adding workouts...')
    
    const workouts = [
      ['Beginner Full Body', 'A complete beginner workout targeting all major muscle groups', 'Custom', 'BEGINNER', '[{"exercise":{"name":"Push-ups"},"sets":3,"reps":"8-10","order":1},{"exercise":{"name":"Squats"},"sets":3,"reps":"10-12","order":2},{"exercise":{"name":"Plank"},"sets":3,"reps":"30 seconds","order":3}]', 30, adminUser.id],
      ['Intermediate HIIT', 'High intensity interval training workout', 'Custom', 'INTERMEDIATE', '[{"exercise":{"name":"Burpees"},"sets":4,"reps":"10","order":1},{"exercise":{"name":"Lunges"},"sets":3,"reps":"12 each leg","order":2},{"exercise":{"name":"Push-ups"},"sets":3,"reps":"12-15","order":3},{"exercise":{"name":"Squats"},"sets":3,"reps":"15-20","order":4}]', 45, adminUser.id],
      ['Core Focus', 'Workout focused on core strengthening', 'Custom', 'BEGINNER', '[{"exercise":{"name":"Plank"},"sets":3,"reps":"45 seconds","order":1},{"exercise":{"name":"Squats"},"sets":3,"reps":"12","order":2},{"exercise":{"name":"Push-ups"},"sets":2,"reps":"8","order":3}]', 25, adminUser.id]
    ]

    for (const [name, description, category, difficulty, exercises, estimatedDuration, creatorId] of workouts) {
      try {
        await prisma.$executeRaw`
          INSERT INTO "Workout" ("id", "name", "description", "category", "difficulty", "exercises", "estimatedDuration", "isPublic", "creatorId", "createdAt", "updatedAt")
          VALUES (gen_random_uuid()::text, ${name}, ${description}, ${category}, ${difficulty}, ${exercises}, ${estimatedDuration}, true, ${creatorId}, NOW(), NOW())
        `
        console.log(`✅ Workout added: ${name}`)
      } catch (error) {
        console.log(`⚠️ Error adding workout ${name}:`, error.message)
      }
    }

    console.log('🎉 Force add completed!')
    
    // Check final counts
    const exerciseCount = await prisma.exercise.count()
    const workoutCount = await prisma.workout.count()
    
    console.log(`\n📊 Final counts:`)
    console.log(`💪 Exercises: ${exerciseCount}`)
    console.log(`🏋️ Workouts: ${workoutCount}`)

  } catch (error) {
    console.error('❌ Error force adding data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

forceAddData()
