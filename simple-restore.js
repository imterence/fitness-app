const { PrismaClient } = require('@prisma/client')
const fs = require('fs')

const prisma = new PrismaClient()

async function simpleRestore() {
  try {
    console.log('🔄 Starting simple data restoration...')

    // Clear existing data first
    console.log('🧹 Clearing existing data...')
    await prisma.clientWorkout.deleteMany()
    await prisma.workout.deleteMany()
    await prisma.exercise.deleteMany()
    await prisma.client.deleteMany()
    await prisma.user.deleteMany()

    // 1. Restore Users
    console.log('👥 Restoring users...')
    const usersData = fs.readFileSync('exports/users.csv', 'utf8')
    const userLines = usersData.split('\n').slice(1).filter(line => line.trim())
    
    for (const line of userLines) {
      const [id, email, name, role, createdAt] = line.split(',').map(field => 
        field.replace(/"/g, '').trim()
      )
      
      if (email && name) {
        await prisma.user.create({
          data: {
            id,
            email,
            name,
            role,
            password: 'temp_password_123' // Temporary password
          }
        })
        console.log(`✅ User created: ${name} (${email})`)
      }
    }

    // 2. Create Client records for CLIENT users
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

    // 3. Restore Exercises (simplified)
    console.log('💪 Restoring exercises...')
    const exercisesData = fs.readFileSync('exports/exercises.csv', 'utf8')
    const exerciseLines = exercisesData.split('\n').slice(1).filter(line => line.trim())
    
    for (const line of exerciseLines) {
      const [name, category, description, muscleGroups, equipment, difficulty, instructions, videoUrl] = 
        line.split(',').map(field => field.replace(/"/g, '').trim())
      
      if (name && name !== 'name') { // Skip header
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
      }
    }

    // 4. Restore Workouts (simplified)
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
      }
    }

    console.log('🎉 Simple restoration completed successfully!')
    
    // Show summary
    const userCount = await prisma.user.count()
    const clientCount = await prisma.client.count()
    const exerciseCount = await prisma.exercise.count()
    const workoutCount = await prisma.workout.count()
    
    console.log('\n📊 Restoration Summary:')
    console.log(`👥 Users: ${userCount}`)
    console.log(`👤 Clients: ${clientCount}`)
    console.log(`💪 Exercises: ${exerciseCount}`)
    console.log(`🏋️ Workouts: ${workoutCount}`)

  } catch (error) {
    console.error('❌ Error during restoration:', error)
  } finally {
    await prisma.$disconnect()
  }
}

simpleRestore()
