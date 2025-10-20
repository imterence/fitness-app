const { PrismaClient } = require('@prisma/client')
const fs = require('fs')

const prisma = new PrismaClient()

async function completeRestore() {
  try {
    console.log('🔄 Completing data restoration...')

    // Check current status
    const userCount = await prisma.user.count()
    const clientCount = await prisma.client.count()
    const exerciseCount = await prisma.exercise.count()
    const workoutCount = await prisma.workout.count()
    
    console.log('📊 Current Status:')
    console.log(`👥 Users: ${userCount}`)
    console.log(`👤 Clients: ${clientCount}`)
    console.log(`💪 Exercises: ${exerciseCount}`)
    console.log(`🏋️ Workouts: ${workoutCount}`)

    // 1. Create Client records for CLIENT users (if missing)
    if (clientCount === 0) {
      console.log('👤 Creating client records...')
      const clientUsers = await prisma.user.findMany({
        where: { role: 'CLIENT' }
      })
      
      for (const user of clientUsers) {
        await prisma.client.create({
          data: {
            userId: user.id,
            goals: 'General fitness goals',
            notes: 'Restored from backup'
          }
        })
        console.log(`✅ Client record created for: ${user.name}`)
      }
    }

    // 2. Restore Exercises (if missing)
    if (exerciseCount === 0) {
      console.log('💪 Restoring exercises...')
      const exercisesData = fs.readFileSync('exports/exercises.csv', 'utf8')
      const exerciseLines = exercisesData.split('\n').slice(1).filter(line => line.trim())
      
      for (const line of exerciseLines) {
        const [name, category, description, muscleGroups, equipment, difficulty, instructions, videoUrl] = 
          line.split(',').map(field => field.replace(/"/g, '').trim())
        
        if (name && name !== 'name') { // Skip header
          try {
            await prisma.exercise.create({
              data: {
                name,
                category: category || 'General',
                description: description || '',
                muscleGroups: muscleGroups || '',
                equipment: equipment || '',
                difficulty: difficulty || 'BEGINNER',
                instructions: instructions || '',
                videoUrl: videoUrl || ''
              }
            })
            console.log(`✅ Exercise created: ${name}`)
          } catch (error) {
            console.log(`⚠️ Exercise already exists: ${name}`)
          }
        }
      }
    }

    // 3. Restore Workouts (if missing)
    if (workoutCount === 0) {
      console.log('🏋️ Restoring workouts...')
      const workoutsData = fs.readFileSync('exports/workouts.csv', 'utf8')
      const workoutLines = workoutsData.split('\n').slice(1).filter(line => line.trim())
      
      const adminUser = await prisma.user.findFirst({
        where: { role: 'ADMIN' }
      })
      
      for (const line of workoutLines) {
        const [name, description, category, difficulty, exercises] = 
          line.split(',').map(field => field.replace(/"/g, '').trim())
        
        if (name && name !== 'name' && adminUser) { // Skip header
          try {
            await prisma.workout.create({
              data: {
                name,
                description: description || '',
                category: category || 'Custom',
                difficulty: difficulty || 'INTERMEDIATE',
                exercises: exercises || '[]',
                estimatedDuration: 60,
                status: 'ACTIVE',
                creatorId: adminUser.id
              }
            })
            console.log(`✅ Workout created: ${name}`)
          } catch (error) {
            console.log(`⚠️ Workout already exists: ${name}`)
          }
        }
      }
    }

    console.log('🎉 Restoration completed successfully!')
    
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

completeRestore()
