const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

async function restoreData() {
  try {
    console.log('🔄 Starting data restoration...')

    // 1. Restore Users
    console.log('📝 Restoring users...')
    const usersData = fs.readFileSync('exports/users.csv', 'utf8')
    const userLines = usersData.split('\n').slice(1).filter(line => line.trim())
    
    for (const line of userLines) {
      const [id, email, name, role, createdAt] = line.split(',').map(field => 
        field.replace(/"/g, '').trim()
      )
      
      if (email && name) {
        try {
          await prisma.user.upsert({
            where: { email },
            update: { name, role },
            create: {
              id,
              email,
              name,
              role,
              password: 'temp_password_123', // Temporary password
              createdAt: new Date(createdAt)
            }
          })
          console.log(`✅ User restored: ${name} (${email})`)
        } catch (error) {
          console.log(`⚠️ User already exists: ${name} (${email})`)
        }
      }
    }

    // 2. Restore Exercises
    console.log('💪 Restoring exercises...')
    const exercisesData = fs.readFileSync('exports/exercises.csv', 'utf8')
    const exerciseLines = exercisesData.split('\n').slice(1).filter(line => line.trim())
    
    for (const line of exerciseLines) {
      const [name, category, description, muscleGroups, equipment, difficulty, instructions, videoUrl] = 
        line.split(',').map(field => field.replace(/"/g, '').trim())
      
      if (name) {
        try {
          await prisma.exercise.upsert({
            where: { name },
            update: { 
              category, 
              description, 
              muscleGroups, 
              equipment, 
              difficulty, 
              instructions, 
              videoUrl 
            },
            create: {
              name,
              category,
              description,
              muscleGroups,
              equipment,
              difficulty,
              instructions,
              videoUrl
            }
          })
          console.log(`✅ Exercise restored: ${name}`)
        } catch (error) {
          console.log(`⚠️ Exercise already exists: ${name}`)
        }
      }
    }

    // 3. Restore Workouts
    console.log('🏋️ Restoring workouts...')
    const workoutsData = fs.readFileSync('exports/workouts.csv', 'utf8')
    const workoutLines = workoutsData.split('\n').slice(1).filter(line => line.trim())
    
    for (const line of workoutLines) {
      const [name, description, category, difficulty, exercises] = 
        line.split(',').map(field => field.replace(/"/g, '').trim())
      
      if (name) {
        try {
          // Find the first admin user to be the creator
          const adminUser = await prisma.user.findFirst({
            where: { role: 'ADMIN' }
          })
          
          if (adminUser) {
            await prisma.workout.upsert({
              where: { name },
              update: { 
                description, 
                category, 
                difficulty, 
                exercises: exercises || '[]'
              },
              create: {
                name,
                description,
                category,
                difficulty,
                exercises: exercises || '[]',
                estimatedDuration: 60, // Default duration
                status: 'ACTIVE',
                creatorId: adminUser.id
              }
            })
            console.log(`✅ Workout restored: ${name}`)
          }
        } catch (error) {
          console.log(`⚠️ Workout already exists: ${name}`)
        }
      }
    }

    console.log('🎉 Data restoration completed successfully!')
    
    // Show summary
    const userCount = await prisma.user.count()
    const exerciseCount = await prisma.exercise.count()
    const workoutCount = await prisma.workout.count()
    
    console.log('\n📊 Restoration Summary:')
    console.log(`👥 Users: ${userCount}`)
    console.log(`💪 Exercises: ${exerciseCount}`)
    console.log(`🏋️ Workouts: ${workoutCount}`)

  } catch (error) {
    console.error('❌ Error during restoration:', error)
  } finally {
    await prisma.$disconnect()
  }
}

restoreData()
