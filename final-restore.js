const { PrismaClient } = require('@prisma/client')
const fs = require('fs')

const prisma = new PrismaClient()

async function finalRestore() {
  try {
    console.log('🔄 Final data restoration...')

    // 1. Create Client records using raw SQL to avoid schema issues
    console.log('👤 Creating client records...')
    const clientUsers = await prisma.user.findMany({
      where: { role: 'CLIENT' },
      select: { id: true, name: true }
    })
    
    for (const user of clientUsers) {
      try {
        await prisma.$executeRaw`
          INSERT INTO "Client" ("id", "userId", "goals", "notes", "createdAt", "updatedAt")
          VALUES (gen_random_uuid()::text, ${user.id}, 'General fitness goals', 'Restored from backup', NOW(), NOW())
          ON CONFLICT ("userId") DO NOTHING
        `
        console.log(`✅ Client record created for: ${user.name}`)
      } catch (error) {
        console.log(`⚠️ Client record already exists for: ${user.name}`)
      }
    }

    // 2. Restore Exercises
    console.log('💪 Restoring exercises...')
    const exercisesData = fs.readFileSync('exports/exercises.csv', 'utf8')
    const exerciseLines = exercisesData.split('\n').slice(1).filter(line => line.trim())
    
    for (const line of exerciseLines) {
      const [name, category, description, muscleGroups, equipment, difficulty, instructions, videoUrl] = 
        line.split(',').map(field => field.replace(/"/g, '').trim())
      
      if (name && name !== 'name') { // Skip header
        try {
          await prisma.$executeRaw`
            INSERT INTO "Exercise" ("id", "name", "category", "description", "muscleGroups", "equipment", "difficulty", "instructions", "videoUrl", "createdAt", "updatedAt")
            VALUES (gen_random_uuid()::text, ${name}, ${category || 'General'}, ${description || ''}, ${muscleGroups || ''}, ${equipment || ''}, ${difficulty || 'BEGINNER'}, ${instructions || ''}, ${videoUrl || ''}, NOW(), NOW())
            ON CONFLICT ("name") DO NOTHING
          `
          console.log(`✅ Exercise created: ${name}`)
        } catch (error) {
          console.log(`⚠️ Exercise already exists: ${name}`)
        }
      }
    }

    // 3. Restore Workouts
    console.log('🏋️ Restoring workouts...')
    const workoutsData = fs.readFileSync('exports/workouts.csv', 'utf8')
    const workoutLines = workoutsData.split('\n').slice(1).filter(line => line.trim())
    
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
      select: { id: true }
    })
    
    for (const line of workoutLines) {
      const [name, description, category, difficulty, exercises] = 
        line.split(',').map(field => field.replace(/"/g, '').trim())
      
      if (name && name !== 'name' && adminUser) { // Skip header
        try {
          await prisma.$executeRaw`
            INSERT INTO "Workout" ("id", "name", "description", "category", "difficulty", "exercises", "estimatedDuration", "isPublic", "creatorId", "createdAt", "updatedAt")
            VALUES (gen_random_uuid()::text, ${name}, ${description || ''}, ${category || 'Custom'}, ${difficulty || 'INTERMEDIATE'}, ${exercises || '[]'}, 60, true, ${adminUser.id}, NOW(), NOW())
            ON CONFLICT ("name") DO NOTHING
          `
          console.log(`✅ Workout created: ${name}`)
        } catch (error) {
          console.log(`⚠️ Workout already exists: ${name}`)
        }
      }
    }

    console.log('🎉 Final restoration completed!')
    
    // Final summary
    const finalUserCount = await prisma.user.count()
    const finalClientCount = await prisma.client.count()
    const finalExerciseCount = await prisma.exercise.count()
    const finalWorkoutCount = await prisma.workout.count()
    
    console.log('\n📊 Final Summary:')
    console.log(`👥 Users: ${finalUserCount}`)
    console.log(`👤 Clients: ${finalClientCount}`)
    console.log(`💪 Exercises: ${finalExerciseCount}`)
    console.log(`🏋️ Workouts: ${finalWorkoutCount}`)

  } catch (error) {
    console.error('❌ Error during restoration:', error)
  } finally {
    await prisma.$disconnect()
  }
}

finalRestore()
